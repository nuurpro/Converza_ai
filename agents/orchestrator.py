"""Orchestrator — strategic CMO layer via Hermes + MCP."""

from typing import Any

from converza_agent.runtime import run_agent_text


def _build_context_block(client_context: dict) -> str:
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


async def run_orchestrator(
    user_message: str,
    client_context: dict,
    conversation_history: list[dict] | None = None,
) -> dict:
    history: list[dict[str, Any]] = list(conversation_history or [])

    if history:
        first_content = history[0].get("content", "")
        if "[CLIENT CONTEXT]" not in first_content:
            history[0] = {
                **history[0],
                "content": _build_context_block(client_context) + first_content,
            }
        messages = history + [{"role": "user", "content": user_message}]
    else:
        messages = [
            {
                "role": "user",
                "content": _build_context_block(client_context) + user_message,
            }
        ]

    content = await run_agent_text(
        "orchestrator",
        messages,
        session_key=f"converza:orchestrator:{client_context.get('brand_name', 'unknown')}",
    )
    return {"type": "message", "content": content}
