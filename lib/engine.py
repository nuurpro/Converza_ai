from __future__ import annotations

import os
from typing import Any

import httpx


async def call_engine(
    system_prompt: str,
    user_input: str,
    tools: list[dict[str, Any]] | None = None,
) -> str:
    """Single stateless Groq completion call.

    No session id is sent. All context must be in system_prompt and user_input.
    """
    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY must be set in .env")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input},
    ]
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": 400,
        "temperature": float(os.getenv("GROQ_TEMPERATURE", "0.4")),
    }
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(2):
            if attempt == 1:
                payload["messages"] = [
                    *messages,
                    {
                        "role": "user",
                        "content": "Return the final visible answer now. Do not return empty content.",
                    },
                ]

            response = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"].get("content") or ""
            if content.strip():
                return content.strip()

    raise RuntimeError("Reasoning engine returned empty content twice")
