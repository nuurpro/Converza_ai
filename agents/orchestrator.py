"""
Orchestrator Agent — the CMO of the Converza swarm.

Receives a user prompt + client_context, reasons about intent, uses
tools (clarify / research / route), and returns a structured response.
Implements a full ReAct loop: Reason → Act → Observe → repeat until
the agent produces a final text response or a terminal tool call.
"""

import json
import anthropic
from typing import Any

from agents.tools import ORCHESTRATOR_TOOLS, TOOL_EXECUTORS

# ─────────────────────────────────────────────────────────────────────
# System prompt — client_context is injected at runtime
# ─────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are the Converza Orchestrator — the Chief Marketing Officer of an autonomous AI marketing swarm.

You do NOT generate creative assets. You research, strategize, and route.

## YOUR WORKFLOW (ReAct)

1. **Reason** — Analyze the user's intent against their business context injected at the start of the conversation.
2. **Act** — Use a tool if needed:
   - `search_market_competitors` to research the competitive landscape BEFORE proposing strategy.
   - `ask_clarifying_question` ONLY if the user's intent is genuinely ambiguous (prefer action over questions).
   - `route_to_narrative_agent` ONLY after the user explicitly approves the strategy.
3. **Observe** — Incorporate tool results into your reasoning.
4. **Respond** — Deliver a strategic recommendation or ask your clarifying question.

## ROLE ADAPTATION

The client's role (Owner or Marketer) is provided in their context block.

When role is "Owner":
- Frame everything around revenue, ROI, market position, and competitive advantage.
- Skip tactical minutiae unless asked. Language: pipeline, LTV, CAC, conversion rate, growth lever.

When role is "Marketer":
- Go deep on execution: content calendars, platform-specific tactics, A/B testing, metrics and KPIs.
- Treat them as a skilled peer. Language: CTR, ROAS, hook rate, engagement rate, funnel stage.

## THE APPROVAL GATE

Before calling `route_to_narrative_agent`, you MUST:
1. Present a clear strategic proposal with campaign name, angle, audience, and deliverables.
2. Ask: "Does this align with your vision, or should we adjust?"
3. Wait for explicit user approval. NEVER route without approval.

## THE "TRUST BUT VERIFY" RULE

When the client mentions competitors or market assumptions, accept their input but call `search_market_competitors` to enrich and validate with your own research.

## RESPONSE STYLE

- Be direct. No filler phrases.
- Think like a CMO with a $50M portfolio. Every recommendation must be grounded in the client's specific context.
- When presenting strategy, use structured formatting: campaign name, angle, audience, channels, expected impact.
- Keep responses concise but substantive. Owners get the executive summary; Marketers get the tactical playbook."""


def _build_context_block(client_context: dict) -> str:
    """
    Build a client context block to prepend to the first user message.
    Keeping context OUT of the system prompt preserves prompt cache hit rates —
    the static _SYSTEM_PROMPT is cacheable across all clients.
    """
    role = client_context.get("user_role", "Owner")
    hex_colors = client_context.get("hex_colors", [])
    hex_str = ", ".join(hex_colors) if hex_colors else "Not provided"

    return (
        f"[CLIENT CONTEXT]\n"
        f"Brand Name: {client_context.get('brand_name', 'Unknown')}\n"
        f"Industry: {client_context.get('industry', 'General')}\n"
        f"Target Location: {client_context.get('target_location', 'Not specified')}\n"
        f"Brand Colors (hex): {hex_str}\n"
        f"Target Audience: {client_context.get('target_audience', 'Not specified')}\n"
        f"Core Offer: {client_context.get('core_offer', 'Not specified')}\n"
        f"User Role: {role}\n"
        f"[END CLIENT CONTEXT]\n\n"
    )


# ─────────────────────────────────────────────────────────────────────
# Terminal tool handlers — these produce the final structured response
# instead of looping back to Claude.
# ─────────────────────────────────────────────────────────────────────

def _handle_terminal_tool(tool_name: str, tool_input: dict) -> dict:
    """
    Process tools that end the ReAct loop and produce a client-facing
    response directly.
    """
    if tool_name == "ask_clarifying_question":
        return {
            "type": "clarification",
            "question": tool_input["question"],
        }

    if tool_name == "route_to_narrative_agent":
        return {
            "type": "routing",
            "destination": "narrative_agent",
            "brief": tool_input,
        }

    # Should never reach here — unknown terminal tool
    return {"type": "error", "message": f"Unknown terminal tool: {tool_name}"}


# ─────────────────────────────────────────────────────────────────────
# ReAct loop
# ─────────────────────────────────────────────────────────────────────

MAX_TOOL_ROUNDS = 5  # Safety cap — prevent infinite loops

async def run_orchestrator(
    user_message: str,
    client_context: dict,
    conversation_history: list[dict] | None = None,
) -> dict:
    """
    Execute the Orchestrator's ReAct loop.

    Returns a dict with one of three shapes:
      {"type": "message",       "content": "..."}
      {"type": "clarification", "question": "..."}
      {"type": "routing",       "destination": "narrative_agent", "brief": {...}}

    Client context is injected into the first user message (not the system prompt)
    so the static _SYSTEM_PROMPT remains cacheable across all clients via
    Anthropic's prompt caching.
    """
    client = anthropic.AsyncAnthropic()

    # Build messages array — inject context into first user turn
    history: list[dict[str, Any]] = list(conversation_history or [])

    if history:
        # Inject context into existing first user message if not already present
        first_content = history[0].get("content", "")
        if "[CLIENT CONTEXT]" not in first_content:
            history[0] = {
                **history[0],
                "content": _build_context_block(client_context) + first_content,
            }
        messages = history + [{"role": "user", "content": user_message}]
    else:
        # First turn — prepend context to the current message
        messages = [{"role": "user", "content": _build_context_block(client_context) + user_message}]

    for _round in range(MAX_TOOL_ROUNDS):

        # ── REASON + ACT: Call Claude with tools ──
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": _SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=ORCHESTRATOR_TOOLS,
            messages=messages,
        )

        # ── Check stop reason ──
        if response.stop_reason == "end_turn":
            # Claude chose to respond with text — no tool call.
            # Extract the text content and return it.
            text_parts = [
                block.text for block in response.content
                if block.type == "text"
            ]
            return {
                "type": "message",
                "content": "\n\n".join(text_parts),
            }

        if response.stop_reason != "tool_use":
            # Unexpected stop reason (max_tokens, etc.)
            text_parts = [
                block.text for block in response.content
                if block.type == "text"
            ]
            return {
                "type": "message",
                "content": "\n\n".join(text_parts) or "I need more context to help you.",
            }

        # ── OBSERVE: Process each tool call in this turn ──
        # Append Claude's full response (text + tool_use blocks) to history
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []

        for block in response.content:
            if block.type != "tool_use":
                continue

            tool_name = block.name
            tool_input = block.input
            tool_id = block.id

            # --- Terminal tools: end the loop and return to client ---
            if tool_name in ("ask_clarifying_question", "route_to_narrative_agent"):
                return _handle_terminal_tool(tool_name, tool_input)

            # --- Executable tools: run locally, feed result back to Claude ---
            executor = TOOL_EXECUTORS.get(tool_name)
            if executor:
                result_str = executor(**tool_input)
            else:
                result_str = json.dumps({"error": f"Unknown tool: {tool_name}"})

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": result_str,
            })

        # Append all tool results as a single user turn, then loop
        # back to Claude so it can reason over the observations.
        messages.append({"role": "user", "content": tool_results})

    # Safety: max rounds exceeded — return whatever text we have
    return {
        "type": "message",
        "content": "I've completed my analysis. Let me know how you'd like to proceed.",
    }
