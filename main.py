import json
import logging
import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated, AsyncGenerator

import anthropic
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.dag_runner import execute_dag
from agents.manager import stream_manager
from agents.orchestrator import run_orchestrator
from db import get_supabase
from llm import stream_gemini
from services.brand_passport import (
    fetch_passport_by_id,
    fetch_passport_by_org,
    passport_to_client_context,
    sync_organization,
    upsert_passport,
)
from services.access_requests import (
    approve_request,
    create_request,
    get_request,
    is_user_approved,
    link_telegram_id,
    list_requests,
    reject_request,
)
from services.config import is_production, require_env_vars
from services.supabase_errors import format_supabase_error
from services.pdf_parser import process_documents
from services.session import (
    assert_org_access,
    create_token,
    get_admin_user,
    get_current_user,
    is_admin_telegram_id,
)
from services.telegram_auth import verify_telegram_auth

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    brand_id: str | None = None
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


class TelegramAuthData(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


class AccessRequestCreate(BaseModel):
    full_name: str
    business_name: str
    contact: str
    telegram_username: str
    message: str


class AccessReviewRequest(BaseModel):
    review_note: str = ""


class DMCloserOnboardingRequest(BaseModel):
    org_id: str
    brand_name: str
    industry: str = ""
    target_location: str = "Uzbekistan"
    target_audience: str
    core_offer: str
    tone: str = "Friendly, confident, and concise"
    brand_voice: str = ""
    hex_colors: list[str] = []
    pricing: list[dict] = []
    faq: list[dict] = []
    objections: list[dict] = []
    raw_notes: str = ""
    click_token: str = ""
    source: str = "web_form"


# ---------------------------------------------------------------------------
# System prompt — kept static for prompt caching effectiveness
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """## LANGUAGE — CRITICAL
Always respond in Uzbek (O'zbek tilida). Every message you send to the user must be written in natural, fluent Uzbek, regardless of the language the user writes in. Use Uzbek marketing terminology; you may keep widely-used English terms (CTR, ROAS, funnel) where natural, but the surrounding text must be Uzbek.

You are the Converza Co-Pilot — the strategic marketing intelligence layer of the Converza enterprise AI platform.

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

def _cors_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if is_production() and raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return ["*"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    require_env_vars(
        [
            "SUPABASE_URL",
            "TELEGRAM_BOT_TOKEN",
            "JWT_SECRET",
        ],
        service="web",
    )
    yield


app = FastAPI(title="Converza Co-Pilot", version="0.1.0", lifespan=lifespan)

_cors = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials="*" not in _cors,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic client — used by orchestrator/manager agents (not /chat which uses KIE.ai)
anthropic_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


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
            yield f"data: {json.dumps({'error': 'KIE API kaliti notog\u02bcri. .env faylidagi KIE_API_KEY ni tekshiring.'})}\n\n"
        elif "429" in error_msg or "rate" in error_msg.lower():
            yield f"data: {json.dumps({'error': 'Soʻrovlar chegarasi tugadi. Biroz kutib, qayta urinib koʻring.'})}\n\n"
        else:
            yield f"data: {json.dumps({'error': f'LLM xatosi: {error_msg}'})}\n\n"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Converza Co-Pilot"}


@app.get("/ready")
async def ready():
    checks: dict[str, str] = {}
    ok = True

    for key in ("SUPABASE_URL", "TELEGRAM_BOT_TOKEN", "JWT_SECRET"):
        if os.getenv(key, "").strip():
            checks[key] = "ok"
        else:
            checks[key] = "missing"
            ok = False

    if os.getenv("KIE_API_KEY", "").strip():
        checks["KIE_API_KEY"] = "ok"
    else:
        checks["KIE_API_KEY"] = "missing"
        if is_production():
            ok = False

    try:
        get_supabase().table("organizations").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except Exception as exc:
        checks["supabase"] = f"error: {exc}"
        ok = False

    if not ok:
        return {"status": "not_ready", "checks": checks}
    return {"status": "ready", "checks": checks}


@app.get("/api/auth/config")
async def auth_config():
    """Public config for the Telegram Login Widget."""
    return {
        "bot_username": os.getenv("TELEGRAM_BOT_USERNAME", "ConverzaSales_bot"),
    }


# ---------------------------------------------------------------------------
# Telegram webhook proxy → converza_bot
# Lets a single public domain (ngrok → this web app) serve both the web login
# page and the Telegram bot webhooks. Telegram webhook calls are small JSON
# POSTs, so a simple forward is sufficient.
# ---------------------------------------------------------------------------

BOT_INTERNAL_URL = os.getenv("BOT_INTERNAL_URL", "http://localhost:8000")
WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip()


async def _proxy_to_bot(path: str, request: Request) -> Response:
    body = await request.body()
    target = f"{BOT_INTERNAL_URL}/webhook/{path}"
    headers = {
        "content-type": request.headers.get("content-type", "application/json"),
    }
    secret = request.headers.get("x-telegram-bot-api-secret-token")
    if secret:
        headers["x-telegram-bot-api-secret-token"] = secret
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(target, content=body, headers=headers)
    except Exception as e:
        logger.error("webhook proxy error forwarding to %s: %s", target, e)
        return Response(
            content=json.dumps({"ok": False, "error": "bot_unreachable", "detail": str(e)}),
            status_code=502,
            media_type="application/json",
        )
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type", "application/json"),
    )


@app.post("/webhook/telegram")
async def proxy_webhook_telegram(request: Request):
    return await _proxy_to_bot("telegram", request)


@app.post("/webhook/hitl")
async def proxy_webhook_hitl(request: Request):
    return await _proxy_to_bot("hitl", request)


def _validate_access_request_body(body: AccessRequestCreate) -> None:
    if len(body.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="To'liq ismingizni kiriting.")
    if len(body.business_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Biznes nomini kiriting.")
    if len(body.message.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="Qiynayotgan muammoingizni kamida 30 belgi bilan yozing.",
        )
    phone_digits = re.sub(r"\D", "", body.contact)
    if len(phone_digits) < 9:
        raise HTTPException(
            status_code=400,
            detail="To'g'ri telefon raqamini kiriting (masalan: +998901234567).",
        )
    username = (body.telegram_username or "").strip().lstrip("@")
    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Telegram @username majburiy — login shu orqali bog'lanadi.",
        )


@app.post("/api/access-request")
async def submit_access_request(body: AccessRequestCreate):
    """Public — submit a request before Telegram login is allowed."""
    _validate_access_request_body(body)
    try:
        saved = create_request(
            full_name=body.full_name,
            business_name=body.business_name,
            contact=body.contact,
            telegram_username=body.telegram_username,
            message=body.message,
        )
        return {
            "ok": True,
            "request_id": saved["id"],
            "status": saved["status"],
        }
    except Exception as exc:
        logger.exception("access request create failed")
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/access-request/{request_id}")
async def access_request_status(request_id: str):
    """Public — poll approval status by request id."""
    row = get_request(request_id)
    if not row:
        raise HTTPException(status_code=404, detail="So'rov topilmadi.")
    return {
        "request_id": row["id"],
        "status": row["status"],
        "review_note": row.get("review_note"),
        "created_at": row.get("created_at"),
        "reviewed_at": row.get("reviewed_at"),
    }


@app.post("/api/auth/telegram")
async def telegram_auth(auth_data: TelegramAuthData):
    data_dict = auth_data.model_dump(exclude_none=True)
    if not verify_telegram_auth(data_dict.copy()):
        raise HTTPException(
            status_code=403, detail="Telegram autentifikatsiya kaliti noto'g'ri."
        )

    org_id = str(auth_data.id)
    is_admin = is_admin_telegram_id(auth_data.id)

    if not is_admin and not is_user_approved(org_id, auth_data.username):
        raise HTTPException(
            status_code=403,
            detail=(
                "Kirish uchun admin tasdig'i kerak. "
                "Avval kirish so'rovini yuboring va tasdiqlanishini kuting."
            ),
        )

    sync_organization(org_id)
    if not is_admin:
        link_telegram_id(org_id, auth_data.username)

    role = "admin" if is_admin else "user"
    token = create_token(org_id, auth_data.id, role=role)
    return {
        "ok": True,
        "token": token,
        "org_id": org_id,
        "role": role,
        "first_name": auth_data.first_name,
        "username": auth_data.username,
    }


@app.get("/api/admin/access-requests")
async def admin_list_access_requests(
    user: Annotated[dict, Depends(get_admin_user)],
    status: str | None = None,
):
    if status and status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Noto'g'ri status.")
    return {"requests": list_requests(status)}


@app.post("/api/admin/access-requests/{request_id}/approve")
async def admin_approve_request(
    request_id: str,
    body: AccessReviewRequest,
    user: Annotated[dict, Depends(get_admin_user)],
):
    try:
        row = approve_request(request_id, body.review_note)
        return {"ok": True, "request": row}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/admin/access-requests/{request_id}/reject")
async def admin_reject_request(
    request_id: str,
    body: AccessReviewRequest,
    user: Annotated[dict, Depends(get_admin_user)],
):
    try:
        row = reject_request(request_id, body.review_note)
        return {"ok": True, "request": row}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/org/connection-status")
async def connection_status(user: Annotated[dict, Depends(get_current_user)]):
    org_id = str(user["org_id"])
    try:
        result = (
            get_supabase()
            .table("organizations")
            .select("business_connection_id")
            .eq("id", org_id)
            .maybe_single()
            .execute()
        )
        conn_id = None
        if result and result.data:
            conn_id = result.data.get("business_connection_id")
        return {
            "org_id": org_id,
            "connected": bool(conn_id),
            "business_connection_id": conn_id,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/dm-closer/onboard")
async def onboard_dm_closer(
    request: DMCloserOnboardingRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not request.org_id:
        raise HTTPException(
            status_code=400,
            detail="org_id talab qilinadi. Avval Telegram orqali kiring.",
        )
    assert_org_access(user, request.org_id)
    try:
        payload = request.model_dump()
        saved = upsert_passport(request.org_id, payload)
        return {
            "ok": True,
            "brand_id": saved["id"],
            "org_id": saved["org_id"],
            "brand_name": saved["brand_name"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=format_supabase_error(e))


@app.post("/api/dm-closer/parse-pdf")
async def parse_pdf(
    user: Annotated[dict, Depends(get_current_user)],
    files: list[UploadFile] = File(...),
):
    """
    Accept one or more PDFs and auto-generate a structured Brand Passport.
    Does NOT persist — the client reviews and saves via /api/dm-closer/onboard.
    """
    if not files:
        raise HTTPException(
            status_code=400, detail="Kamida bitta PDF fayl yuklang."
        )

    named_files: list[tuple[str, bytes]] = []
    for upload in files:
        filename = upload.filename or "document.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Faqat PDF fayllar qabul qilinadi: {filename}",
            )
        data = await upload.read()
        if not data:
            continue
        named_files.append((filename, data))

    if not named_files:
        raise HTTPException(
            status_code=400, detail="Yuklangan fayllar bo'sh."
        )

    try:
        passport = await process_documents(named_files)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "files_processed": len(named_files),
        "passport": passport,
    }


@app.get("/api/brand-passport/by-org/{org_id}")
async def get_brand_passport_by_org(
    org_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    assert_org_access(user, org_id)
    try:
        passport = fetch_passport_by_org(org_id)
        if not passport:
            raise HTTPException(status_code=404, detail="Brend pasporti topilmadi.")
        return passport
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


def _resolve_client_context(request: ChatRequest) -> ClientContext:
    if request.brand_id:
        passport = fetch_passport_by_id(request.brand_id)
        if passport:
            return ClientContext(**passport_to_client_context(passport))
    return request.client_context


@app.post("/chat")
async def chat(
    request: ChatRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    conversation_id = str(uuid.uuid4())
    client_context = _resolve_client_context(request)
    context_block = build_context_block(client_context, request.user_role)

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
async def orchestrate(
    request: OrchestrateRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    ctx = request.client_context.model_dump()

    try:
        result = await run_orchestrator(
            user_message=request.user_message,
            client_context=ctx,
            conversation_history=request.conversation_history,
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit reached. Try again shortly.")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {e.message}")

    return result


# ---------------------------------------------------------------------------
# Pipeline — Dual-State Manager Agent (SSE)
# ---------------------------------------------------------------------------

def _fetch_brand_passport(brand_id: str) -> dict:
    """Fetch Brand Passport from Supabase by ID."""
    passport = fetch_passport_by_id(brand_id)
    if not passport:
        raise ValueError(f"Brand passport not found: {brand_id}")
    return passport


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
        # ── Resolve Brand Passport ──
        brand_passport = _default_brand_passport(ClientContext())
        if request.brand_id:
            try:
                brand_passport = _fetch_brand_passport(request.brand_id)
            except Exception:
                pass

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

    except anthropic.AuthenticationError:
        yield f"data: {json.dumps({'type': 'error', 'error': 'API kaliti notogʻri. ANTHROPIC_API_KEY ni tekshiring.'})}\n\n"
    except anthropic.RateLimitError:
        yield f"data: {json.dumps({'type': 'error', 'error': 'Soʻrovlar chegarasi tugadi. Biroz kutib, qayta urinib koʻring.'})}\n\n"
    except anthropic.APIStatusError as e:
        yield f"data: {json.dumps({'type': 'error', 'error': f'API xatosi ({e.status_code}): {e.message}'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': f'Quvur xatosi: {str(e)}'})}\n\n"


@app.post("/api/pipeline")
async def pipeline(
    request: PipelineRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Beta API — hidden from SPA. Most DAG agents are stubs; prefer /chat for owners."""
    return StreamingResponse(
        stream_pipeline(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/pipeline/{run_id}")
async def get_pipeline_run(
    run_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
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
async def pipeline_status(
    run_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
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
# Brand Passport CRUD
# ---------------------------------------------------------------------------

@app.get("/api/brand-passport/{brand_id}")
async def get_brand_passport(
    brand_id: str,
    user: Annotated[dict, Depends(get_current_user)],
):
    try:
        return _fetch_brand_passport(brand_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/brand-passport")
async def create_brand_passport(
    passport: dict,
    user: Annotated[dict, Depends(get_current_user)],
):
    try:
        sb = get_supabase()
        result = sb.table("brand_passports").insert(passport).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/brand-passport/{brand_id}")
async def update_brand_passport(
    brand_id: str,
    updates: dict,
    user: Annotated[dict, Depends(get_current_user)],
):
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

@app.get("/")
async def index():
    """Serve the SPA with no-store so updated JS/HTML is never served stale."""
    return FileResponse(
        "static/index.html",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/admin")
async def admin_page():
    return FileResponse(
        "static/admin.html",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


app.mount("/", StaticFiles(directory="static", html=True), name="static")
