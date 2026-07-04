"""
Manager Agent — Dual-State Orchestrator (Gatekeeper + Compiler).

State 1 — CLARIFYING: Pushes back on bad strategy, missing data, or flawed prompts.
State 2 — EXECUTING:  Compiles a full DAG execution plan and triggers worker nodes.

The Manager uses a single LLM call with structured tool_use to branch:
  - Tool `clarify`:  halts the pipeline → streams a consultative response
  - Tool `compile_dag`: approves the prompt → returns a DAG execution plan
"""

import json
from typing import Any

from converza_agent.runtime import run_agent_json

# ─────────────────────────────────────────────────────────────────────
# System prompt — imported from converza_agent (Hermes runtime)
# ─────────────────────────────────────────────────────────────────────

# MANAGER_SYSTEM_PROMPT imported above

# Legacy tool schemas kept for reference in DAG node briefs.
MANAGER_TOOLS = [
    {
        "name": "clarify",
        "description": (
            "HALT execution and push back on the user's request. Use this when "
            "the prompt is missing critical data, is strategically flawed, or "
            "contradicts the Brand Passport. Provide a consultative response "
            "explaining why and what's needed to proceed."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": (
                        "Why execution is being halted. Be specific: what's missing, "
                        "what's flawed, or what contradicts the brand."
                    ),
                },
                "response": {
                    "type": "string",
                    "description": (
                        "The full consultative message to stream back to the user. "
                        "Must explain the issue, offer an alternative or pivot, and "
                        "end with ONE focused question to unblock execution."
                    ),
                },
            },
            "required": ["reason", "response"],
        },
    },
    {
        "name": "compile_dag",
        "description": (
            "APPROVE the request and compile a full DAG execution plan. Use this "
            "only when the objective is clear, platform is specified, audience is "
            "defined, and the strategy is sound. Produces a strategic thesis and "
            "an ordered list of agent nodes with their briefs."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "strategic_thesis": {
                    "type": "string",
                    "description": (
                        "One sentence capturing the campaign's core strategic insight. "
                        "E.g., 'Position [brand] as the anti-corporate alternative by "
                        "leading with founder authenticity on short-form video.'"
                    ),
                },
                "campaign_name": {
                    "type": "string",
                    "description": "Short, memorable campaign identifier.",
                },
                "target_platforms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Platforms this campaign targets (e.g., 'instagram', 'tiktok').",
                },
                "nodes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "node_id": {
                                "type": "string",
                                "description": "Unique node identifier (e.g., 'intelligence_001').",
                            },
                            "agent_type": {
                                "type": "string",
                                "enum": [
                                    "Intelligence_Agent",
                                    "ProductManager_Agent",
                                    "Copywriter_Agent",
                                    "ContentCreator_Agent",
                                    "UGC_Creator_Agent",
                                ],
                                "description": "Which agent handles this node.",
                            },
                            "depends_on": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "node_ids this node depends on. Empty array = no dependencies.",
                            },
                            "brief": {
                                "type": "object",
                                "description": (
                                    "The input payload for this agent. Must be self-contained — "
                                    "the agent has NO access to the original user prompt or "
                                    "other nodes' outputs (those are injected at runtime by "
                                    "the pipeline runner)."
                                ),
                            },
                        },
                        "required": ["node_id", "agent_type", "depends_on", "brief"],
                    },
                    "description": "Ordered list of DAG nodes with dependencies and briefs.",
                },
            },
            "required": ["strategic_thesis", "campaign_name", "target_platforms", "nodes"],
        },
    },
]


# ─────────────────────────────────────────────────────────────────────
# Context block builder
# ─────────────────────────────────────────────────────────────────────

def _build_context_block(brand_passport: dict, user_role: str) -> str:
    """
    Builds a context block from Brand Passport + user role.
    Injected into the first user message, NOT the system prompt.
    """
    hex_colors = brand_passport.get("hex_colors", [])
    hex_str = ", ".join(hex_colors) if hex_colors else "Not provided"
    competitors = brand_passport.get("competitors", [])
    comp_str = ", ".join(competitors) if competitors else "None specified"
    avoid = brand_passport.get("avoid_topics", [])
    avoid_str = ", ".join(avoid) if avoid else "None"

    objections = brand_passport.get("objections") or []
    obj_str = "\n".join(
        f"- {item.get('objection', '')}: {item.get('response', '')}"
        for item in objections
    ) or "None specified"
    raw_notes = brand_passport.get("raw_notes") or "None"

    return (
        f"[BRAND PASSPORT]\n"
        f"Brand Name: {brand_passport.get('brand_name', 'Unknown')}\n"
        f"Industry: {brand_passport.get('industry', 'General Business')}\n"
        f"Target Location: {brand_passport.get('target_location', 'Not specified')}\n"
        f"Brand Colors: {hex_str}\n"
        f"Target Audience: {brand_passport.get('target_audience', 'Not specified')}\n"
        f"Core Offer: {brand_passport.get('core_offer', 'Not specified')}\n"
        f"Brand Voice: {brand_passport.get('brand_voice', 'Not specified')}\n"
        f"Known Competitors: {comp_str}\n"
        f"Topics to Avoid: {avoid_str}\n"
        f"Objection Handlers:\n{obj_str}\n"
        f"Sales Notes: {raw_notes}\n"
        f"User Role: {user_role}\n"
        f"[END BRAND PASSPORT]\n\n"
    )


# ─────────────────────────────────────────────────────────────────────
# Core execution — single LLM call with forced tool use
# ─────────────────────────────────────────────────────────────────────

async def run_manager(
    user_message: str,
    brand_passport: dict,
    user_role: str = "Owner",
    conversation_history: list[dict[str, Any]] | None = None,
) -> dict:
    """
    Run the Manager Agent's dual-state assessment.

    Returns one of two shapes:
      {"state": "clarifying", "reason": "...", "response": "..."}
      {"state": "executing",  "strategic_thesis": "...", "campaign_name": "...",
       "target_platforms": [...], "nodes": [...]}
    """
    history: list[dict[str, Any]] = list(conversation_history or [])
    context_block = _build_context_block(brand_passport, user_role)

    if history:
        first_content = history[0].get("content", "")
        if "[BRAND PASSPORT]" not in first_content:
            history[0] = {
                **history[0],
                "content": context_block + first_content,
            }
        messages = history + [{"role": "user", "content": user_message}]
    else:
        messages = [{"role": "user", "content": context_block + user_message}]

    payload = await run_agent_json(
        "manager",
        messages,
        session_key=f"converza:manager:{brand_passport.get('brand_name', 'unknown')}",
        max_tokens=4096,
    )

    action = payload.get("action")
    if action == "clarify":
        return {
            "state": "clarifying",
            "reason": payload.get("reason", ""),
            "response": payload.get("response", ""),
        }
    if action == "compile_dag":
        return {
            "state": "executing",
            "strategic_thesis": payload.get("strategic_thesis", ""),
            "campaign_name": payload.get("campaign_name", ""),
            "target_platforms": payload.get("target_platforms", []),
            "nodes": payload.get("nodes", []),
        }

    return {
        "state": "clarifying",
        "reason": "Unable to assess request",
        "response": payload.get("response") or "Batafsilroq ma'lumot kerak.",
    }


# ─────────────────────────────────────────────────────────────────────
# Streaming variant — streams the clarification response token-by-token
# ─────────────────────────────────────────────────────────────────────

async def stream_manager(
    user_message: str,
    brand_passport: dict,
    user_role: str = "Owner",
    conversation_history: list[dict[str, Any]] | None = None,
):
    """
    Streaming version of run_manager. Yields SSE-formatted chunks.

    For CLARIFYING state: streams the consultative response token-by-token.
    For EXECUTING state: yields the full DAG plan as a single JSON event.

    Since we need the full tool_use input to determine state, we use
    the non-streaming API call, then simulate streaming for the UI.
    """
    result = await run_manager(
        user_message=user_message,
        brand_passport=brand_passport,
        user_role=user_role,
        conversation_history=conversation_history,
    )

    if result["state"] == "clarifying":
        # Stream the consultative response word-by-word for natural UX
        words = result["response"].split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else f" {word}"
            yield {
                "type": "token",
                "state": "clarifying",
                "token": token,
            }

        yield {
            "type": "state_resolved",
            "state": "clarifying",
            "reason": result["reason"],
        }

    elif result["state"] == "executing":
        # Emit a status message, then the full DAG plan
        status_msg = f"Strategy approved. Compiling DAG: \"{result['campaign_name']}\" — {result['strategic_thesis']}"
        words = status_msg.split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else f" {word}"
            yield {
                "type": "token",
                "state": "executing",
                "token": token,
            }

        yield {
            "type": "dag_plan",
            "state": "executing",
            "plan": {
                "strategic_thesis": result["strategic_thesis"],
                "campaign_name": result["campaign_name"],
                "target_platforms": result["target_platforms"],
                "nodes": result["nodes"],
            },
        }

        yield {
            "type": "state_resolved",
            "state": "executing",
        }
