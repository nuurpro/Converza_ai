"""LLM — streams Co-Pilot via Hermes + MCP."""

from typing import AsyncGenerator

from converza_agent.runtime import stream_agent


async def stream_gemini(
    messages: list[dict],
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """Legacy name kept for /chat SSE handler."""
    del system_prompt, model
    async for token in stream_agent(
        "copilot",
        messages,
        session_key="converza:copilot",
        max_tokens=max_tokens,
    ):
        yield token
