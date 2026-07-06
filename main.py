import os
import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from db import get_supabase
from llm import stream_gemini
from lib.context_assembler import VALID_AGENTS
from lib.mentions import extract_mentions
from lib.repository import SupabaseRepository
from lib.switchboard import (
    handle_direct_agent_message,
    handle_squad_owner_message,
    resolve_hitl,
    run_agent,
)

load_dotenv()

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ClientContext(BaseModel):
    brand_name: str = "Unknown Brand"
    industry: str = "General Business"
    target_location: str = "Not specified"
    hex_colors: list[str] = []
    target_audience: str = "Not specified"
    core_offer: str = "Not specified"


class ChatRequest(BaseModel):
    message: str
    client_context: ClientContext = ClientContext()
    user_role: str = "Owner"  # "Owner" | "Marketer"
    conversation_history: list[dict] = []


class OrchestrateRequest(BaseModel):
    user_message: str
    client_context: ClientContext = ClientContext()
    conversation_history: list[dict] = []


class PipelineRequest(BaseModel):
    message: str
    brand_id: str | None = None         # UUID of Brand Passport in Supabase
    user_id: str | None = None          # UUID of user
    user_role: str = "Owner"
    conversation_id: str | None = None  # existing conversation to append to
    conversation_history: list[dict] = []


class AgentMessageRequest(BaseModel):
    org_id: str
    text: str


class SquadMessageRequest(BaseModel):
    org_id: str
    text: str


class HitlEditRequest(BaseModel):
    final_content: str | None = None


# ---------------------------------------------------------------------------
# System prompt — kept static for prompt caching effectiveness
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are the Converza Co-Pilot — the strategic marketing intelligence layer of the Converza enterprise AI platform.

Converza is a multi-agent marketing swarm built for serious businesses. Your role is not to act like a chatbot. You are a senior marketing strategist and AI systems coordinator embedded in the client's business. You think like a CMO, write like a world-class copywriter, and plan like an agency principal.

Your mission is to help the client's business grow through intelligent, brand-aligned marketing strategy, content, and execution guidance.

## CORE BEHAVIOR

- Never introduce yourself as an AI, chatbot, or assistant. You are the Converza Co-Pilot.
- Speak with authority. You are the most experienced marketing strategist this client has ever worked with.
- Be direct. No filler phrases like "Certainly!", "Of course!", or "Great question!". Just get to work.
- Adapt tone to the client's brand and industry — inferred from their client context.
- Ask clarifying questions only when truly necessary. Default to taking action and making recommendations.
- When you have all the context you need, act. When you don't, ask one focused question — not a list of five.

## ROLE-SPECIFIC ADAPTATION

When user_role is "Owner":
- Frame everything around business outcomes: revenue, customer acquisition, market position, ROI.
- Speak in terms of strategy, competitive advantage, and growth systems.
- Skip tactical minutiae unless asked. Owners want the "so what" and the "what next".
- Use language like: pipeline, conversion rate, LTV, CAC, market share, growth lever.

When user_role is "Marketer":
- Go deep on execution: content calendars, platform-specific tactics, copywriting frameworks, A/B testing, metrics and KPIs.
- Treat them as a skilled peer. Use industry-standard terminology freely.
- Offer structured, actionable outputs they can take directly into their workflow.
- Use language like: CTR, ROAS, hook rate, engagement rate, funnel stage, creative brief.

## CLIENT CONTEXT

You always have access to the client's business context injected at the start of the conversation:
- brand_name: The name of the business
- industry: Their market category
- target_location: Geographic focus
- hex_colors: Brand color palette (relevant for visual content guidance)
- target_audience: Who they are marketing to
- core_offer: Their primary product or service

Use this context to make every response feel bespoke. Never give generic advice. Always tie recommendations back to their specific brand, audience, and offer.

## THE CO-PILOT DYNAMIC

You are not a subservient tool. You are a highly paid, collaborative partner. This means:
1. When a client gives you information, accept it — but actively enrich it with your expertise.
2. Before launching any campaign or finalizing any strategy, present your findings and explicitly ask: "Does this align with your vision, or should we adjust?"
3. Push back when you see a better path. A good Co-Pilot doesn't just take orders.

## SCOPE

You can:
- Develop full marketing strategies and campaign concepts
- Write and refine copy, hooks, scripts, and messaging frameworks
- Plan content calendars and content systems
- Analyze competitive positioning and market gaps
- Guide brand voice, tone, and visual identity direction
- Advise on paid, organic, email, and social channel strategy
- Identify weaknesses in the client's current marketing approach and prescribe fixes

You are the Co-Pilot. Take the controls."""


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Converza Co-Pilot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten before production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def build_context_block(ctx: ClientContext, role: str) -> str:
    """
    Builds the client context injection block prepended to the first user message.
    Keeping this out of the system prompt preserves prompt cache hit rates.
    """
    hex_str = ", ".join(ctx.hex_colors) if ctx.hex_colors else "Not provided"
    return (
        f"[CLIENT CONTEXT]\n"
        f"Brand Name: {ctx.brand_name}\n"
        f"Industry: {ctx.industry}\n"
        f"Target Location: {ctx.target_location}\n"
        f"Brand Colors (hex): {hex_str}\n"
        f"Target Audience: {ctx.target_audience}\n"
        f"Core Offer: {ctx.core_offer}\n"
        f"User Role: {role}\n"
        f"[END CLIENT CONTEXT]\n\n"
    )


def get_switchboard_repo() -> SupabaseRepository:
    return SupabaseRepository(get_supabase())


async def stream_response(
    messages: list[dict],
    conversation_id: str,
) -> AsyncGenerator[str, None]:
    """
    Streams LLM response as SSE events via KIE.ai (Gemini 3 Flash).

    Event formats:
      data: {"token": "...", "conversation_id": "..."}
      data: {"done": true, "conversation_id": "..."}
      data: {"error": "..."}
    """
    try:
        async for token in stream_gemini(
            messages=messages,
            system_prompt=SYSTEM_PROMPT,
        ):
            payload = json.dumps({"token": token, "conversation_id": conversation_id})
            yield f"data: {payload}\n\n"

        yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"

    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "auth" in error_msg.lower():
            yield f"data: {json.dumps({'error': 'Invalid KIE API key. Check your KIE_API_KEY in .env.'})}\n\n"
        elif "429" in error_msg or "rate" in error_msg.lower():
            yield f"data: {json.dumps({'error': 'Rate limit reached. Please wait a moment and try again.'})}\n\n"
        else:
            yield f"data: {json.dumps({'error': f'LLM error: {error_msg}'})}\n\n"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Converza Co-Pilot"}


@app.post("/chat")
async def chat(request: ChatRequest):
    conversation_id = str(uuid.uuid4())
    context_block = build_context_block(request.client_context, request.user_role)

    history = list(request.conversation_history)

    if history:
        # Inject context into the first user message if not already present (idempotent)
        first_content = history[0].get("content", "")
        if "[CLIENT CONTEXT]" not in first_content:
            history[0] = {**history[0], "content": context_block + first_content}
        messages = history + [{"role": "user", "content": request.message}]
    else:
        # First turn — prepend context to the current message
        messages = [{"role": "user", "content": context_block + request.message}]

    return StreamingResponse(
        stream_response(messages, conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Orchestrator Agent endpoint — ReAct loop
# ---------------------------------------------------------------------------

@app.post("/api/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    ctx = request.client_context.model_dump()

    try:
        from agents.orchestrator import run_orchestrator

        result = await run_orchestrator(
            user_message=request.user_message,
            client_context=ctx,
            conversation_history=request.conversation_history,
        )
    except Exception as e:
        error_name = e.__class__.__name__
        if error_name == "AuthenticationError":
            raise HTTPException(status_code=401, detail="Invalid ANTHROPIC_API_KEY.")
        if error_name == "RateLimitError":
            raise HTTPException(status_code=429, detail="Rate limit reached. Try again shortly.")
        if error_name == "APIStatusError":
            raise HTTPException(status_code=502, detail=f"Anthropic API error: {getattr(e, 'message', str(e))}")
        raise

    return result


# ---------------------------------------------------------------------------
# Pipeline — Dual-State Manager Agent (SSE)
# ---------------------------------------------------------------------------

def _fetch_brand_passport(brand_id: str) -> dict:
    """Fetch Brand Passport from Supabase by ID."""
    sb = get_supabase()
    result = sb.table("brand_passports").select("*").eq("id", brand_id).single().execute()
    return result.data


def _default_brand_passport(ctx: ClientContext) -> dict:
    """Fallback Brand Passport from inline ClientContext (no Supabase)."""
    return {
        "brand_name": ctx.brand_name,
        "industry": ctx.industry,
        "target_location": ctx.target_location,
        "hex_colors": ctx.hex_colors,
        "target_audience": ctx.target_audience,
        "core_offer": ctx.core_offer,
        "brand_voice": "Not specified",
        "competitors": [],
        "avoid_topics": [],
    }


def _save_message(conversation_id: str, role: str, content: str, dag_run_id: str | None = None):
    """Persist a message to Supabase conversation_messages."""
    sb = get_supabase()
    row = {
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
    }
    if dag_run_id:
        row["dag_run_id"] = dag_run_id
    sb.table("conversation_messages").insert(row).execute()


def _create_dag_run(user_id: str | None, brand_id: str | None, user_message: str) -> str:
    """Create a dag_runs row and return its ID."""
    sb = get_supabase()
    row: dict = {
        "user_message": user_message,
        "status": "pending",
        "stage": "assessing",
    }
    if user_id:
        row["user_id"] = user_id
    if brand_id:
        row["brand_id"] = brand_id
    result = sb.table("dag_runs").insert(row).execute()
    return result.data[0]["id"]


def _update_dag_run(run_id: str, updates: dict):
    """Update a dag_runs row."""
    sb = get_supabase()
    sb.table("dag_runs").update(updates).eq("id", run_id).execute()


def _insert_dag_nodes(run_id: str, nodes: list[dict]):
    """Bulk insert dag_node_runs for a compiled DAG plan."""
    sb = get_supabase()
    rows = [
        {
            "run_id": run_id,
            "node_id": node["node_id"],
            "agent_type": node["agent_type"],
            "status": "pending",
            "input_payload": node.get("brief", {}),
        }
        for node in nodes
    ]
    sb.table("dag_node_runs").insert(rows).execute()


async def stream_pipeline(request: PipelineRequest) -> AsyncGenerator[str, None]:
    """
    Dual-state pipeline SSE stream.

    Events:
      data: {"type": "token",    "state": "clarifying"|"executing", "token": "..."}
      data: {"type": "dag_plan", "state": "executing", "plan": {...}, "run_id": "..."}
      data: {"type": "state_resolved", "state": "clarifying"|"executing", "run_id": "..."}
      data: {"type": "done",     "conversation_id": "...", "run_id": "..."}
      data: {"type": "error",    "error": "..."}
    """
    conv_id = request.conversation_id or str(uuid.uuid4())
    run_id: str | None = None
    dag_plan_data: dict | None = None

    try:
        from agents.manager import stream_manager
        from agents.dag_runner import execute_dag

        # ── Resolve Brand Passport ──
        if request.brand_id:
            try:
                brand_passport = _fetch_brand_passport(request.brand_id)
            except Exception:
                brand_passport = _default_brand_passport(ClientContext())
        else:
            brand_passport = _default_brand_passport(ClientContext())

        # ── Create DAG run record ──
        try:
            run_id = _create_dag_run(request.user_id, request.brand_id, request.message)
        except Exception:
            run_id = str(uuid.uuid4())  # Proceed without persistence if Supabase fails

        # ── Save user message ──
        try:
            _save_message(conv_id, "user", request.message)
        except Exception:
            pass  # Non-blocking — don't kill the stream

        # ── Run Manager Agent (dual-state) ──
        assistant_content = ""

        async for event in stream_manager(
            user_message=request.message,
            brand_passport=brand_passport,
            user_role=request.user_role,
            conversation_history=request.conversation_history,
        ):
            if event["type"] == "token":
                assistant_content += event["token"]
                payload = json.dumps({
                    "type": "token",
                    "state": event["state"],
                    "token": event["token"],
                    "conversation_id": conv_id,
                    "run_id": run_id,
                })
                yield f"data: {payload}\n\n"

            elif event["type"] == "dag_plan":
                dag_plan_data = event["plan"]

                # Log the DAG plan to Supabase
                try:
                    _update_dag_run(run_id, {
                        "status": "running",
                        "stage": "executing",
                        "dag_plan": dag_plan_data,
                    })
                    _insert_dag_nodes(run_id, dag_plan_data["nodes"])
                except Exception:
                    pass

                payload = json.dumps({
                    "type": "dag_plan",
                    "state": "executing",
                    "plan": dag_plan_data,
                    "conversation_id": conv_id,
                    "run_id": run_id,
                })
                yield f"data: {payload}\n\n"

            elif event["type"] == "state_resolved":
                state = event["state"]

                # Update DAG run status based on resolved state
                try:
                    if state == "clarifying":
                        _update_dag_run(run_id, {
                            "status": "cancelled",
                            "stage": "clarification",
                            "completed_at": datetime.now(timezone.utc).isoformat(),
                        })
                except Exception:
                    pass

                payload = json.dumps({
                    "type": "state_resolved",
                    "state": state,
                    "conversation_id": conv_id,
                    "run_id": run_id,
                    "reason": event.get("reason"),
                })
                yield f"data: {payload}\n\n"

                # ── Trigger DAG execution for executing state ──
                if state == "executing" and dag_plan_data:
                    yield f"data: {json.dumps({'type': 'dag_executing', 'conversation_id': conv_id, 'run_id': run_id})}\n\n"

                    try:
                        dag_result = await execute_dag(
                            dag_plan=dag_plan_data,
                            brand_passport=brand_passport,
                            run_id=run_id,
                        )

                        yield f"data: {json.dumps({'type': 'dag_result', 'status': dag_result['status'], 'campaign_name': dag_result.get('campaign_name', ''), 'conversation_id': conv_id, 'run_id': run_id})}\n\n"

                    except Exception as e:
                        yield f"data: {json.dumps({'type': 'dag_error', 'error': str(e), 'conversation_id': conv_id, 'run_id': run_id})}\n\n"

        # ── Save assistant response ──
        try:
            _save_message(conv_id, "assistant", assistant_content, dag_run_id=run_id)
        except Exception:
            pass

        # ── Done ──
        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'run_id': run_id})}\n\n"

    except Exception as e:
        error_name = e.__class__.__name__
        if error_name == "AuthenticationError":
            yield f"data: {json.dumps({'type': 'error', 'error': 'Invalid API key. Check your ANTHROPIC_API_KEY.'})}\n\n"
            return
        if error_name == "RateLimitError":
            yield f"data: {json.dumps({'type': 'error', 'error': 'Rate limit reached. Please wait and try again.'})}\n\n"
            return
        if error_name == "APIStatusError":
            status_code = getattr(e, "status_code", "unknown")
            message = getattr(e, "message", str(e))
            yield f"data: {json.dumps({'type': 'error', 'error': f'API error ({status_code}): {message}'})}\n\n"
            return
        yield f"data: {json.dumps({'type': 'error', 'error': f'Pipeline error: {str(e)}'})}\n\n"


@app.post("/api/pipeline")
async def pipeline(request: PipelineRequest):
    return StreamingResponse(
        stream_pipeline(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/pipeline/{run_id}")
async def get_pipeline_run(run_id: str):
    """Fetch a completed DAG run with all node results."""
    try:
        sb = get_supabase()
        run = sb.table("dag_runs").select("*").eq("id", run_id).single().execute()
        nodes = sb.table("dag_node_runs").select("*").eq("run_id", run_id).execute()
        return {
            "run": run.data,
            "nodes": nodes.data,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Run not found: {str(e)}")


@app.post("/api/pipeline/status")
async def pipeline_status(run_id: str):
    """Poll DAG run status."""
    try:
        sb = get_supabase()
        run = sb.table("dag_runs").select("id, status, stage, started_at, completed_at").eq("id", run_id).single().execute()
        nodes = sb.table("dag_node_runs").select("node_id, agent_type, status").eq("run_id", run_id).execute()
        return {
            "run": run.data,
            "nodes": nodes.data,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Run not found: {str(e)}")


# ---------------------------------------------------------------------------
# Agent Switchboard + Squad Chat
# ---------------------------------------------------------------------------

@app.post("/api/agent/{agent_slug}/message")
async def agent_message(agent_slug: str, request: AgentMessageRequest):
    if agent_slug not in VALID_AGENTS:
        raise HTTPException(status_code=404, detail="Unknown agent")

    try:
        result = await handle_direct_agent_message(
            org_id=request.org_id,
            agent_slug=agent_slug,
            text=request.text,
            repo=get_switchboard_repo(),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/squad/message")
async def squad_message(request: SquadMessageRequest, background_tasks: BackgroundTasks):
    repo = get_switchboard_repo()
    mentions = extract_mentions(request.text)
    owner_message = await repo.insert_squad_message(
        org_id=request.org_id,
        sender_slug="owner",
        content=request.text,
        mentions=mentions,
    )

    targets = mentions or ["milo"]
    for target in targets:
        background_tasks.add_task(
            run_agent,
            org_id=request.org_id,
            agent_slug=target,
            text=request.text,
            triggered_by="owner",
            repo=repo,
        )

    return {"message": owner_message, "routed_to": targets}


@getattr(app, "get")("/api/squad/stream")
async def squad_stream(org_id: str):
    async def events() -> AsyncGenerator[str, None]:
        seen_messages: set[str] = set()
        seen_steps: set[str] = set()
        while True:
            try:
                sb = get_supabase()
                messages = (
                    sb.table("squad_messages")
                    .select("*")
                    .eq("org_id", org_id)
                    .order("created_at", desc=False)
                    .limit(100)
                    .execute()
                )
                for row in messages.data or []:
                    if row["id"] in seen_messages:
                        continue
                    seen_messages.add(row["id"])
                    yield f"data: {json.dumps({'type': 'squad_message', 'row': row}, default=str)}\n\n"

                steps = (
                    sb.table("agent_run_steps")
                    .select("*")
                    .eq("org_id", org_id)
                    .order("created_at", desc=False)
                    .limit(100)
                    .execute()
                )
                for row in steps.data or []:
                    if row["id"] in seen_steps:
                        continue
                    seen_steps.add(row["id"])
                    yield f"data: {json.dumps({'type': 'agent_run_step', 'row': row}, default=str)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/hitl/{draft_id}/approve")
async def hitl_approve(draft_id: str):
    try:
        return await resolve_hitl(
            draft_id=draft_id,
            action="approve",
            repo=get_switchboard_repo(),
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")


@app.post("/api/hitl/{draft_id}/reject")
async def hitl_reject(draft_id: str):
    try:
        return await resolve_hitl(
            draft_id=draft_id,
            action="reject",
            repo=get_switchboard_repo(),
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")


@app.post("/api/hitl/{draft_id}/edit")
async def hitl_edit(draft_id: str, request: HitlEditRequest):
    try:
        return await resolve_hitl(
            draft_id=draft_id,
            action="edit",
            repo=get_switchboard_repo(),
            edited_content=request.final_content,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")


@app.get("/api/dashboard/{org_id}/stats")
async def dashboard_stats(org_id: str):
    try:
        return {"stats": await get_switchboard_repo().get_dashboard_stats(org_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Brand Passport CRUD
# ---------------------------------------------------------------------------

@app.get("/api/brand-passport/{brand_id}")
async def get_brand_passport(brand_id: str):
    try:
        return _fetch_brand_passport(brand_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/brand-passport")
async def create_brand_passport(passport: dict):
    try:
        sb = get_supabase()
        result = sb.table("brand_passports").insert(passport).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/brand-passport/{brand_id}")
async def update_brand_passport(brand_id: str, updates: dict):
    try:
        sb = get_supabase()
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = sb.table("brand_passports").update(updates).eq("id", brand_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Static files — must be mounted LAST so API routes take priority
# ---------------------------------------------------------------------------

app.mount("/", StaticFiles(directory="static", html=True), name="static")
