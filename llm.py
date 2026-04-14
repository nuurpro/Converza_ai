"""
LLM provider abstraction — routes chat inference through KIE.ai (Gemini 3 Flash).

KIE.ai uses Google's native Gemini API format:
  - Endpoint: POST https://api.kie.ai/gemini/v1/models/{model}:streamGenerateContent
  - Auth: Bearer token
  - Messages: { contents: [{ role: "user"|"model", parts: [{ text: "..." }] }] }
  - Streaming: SSE chunks with candidates[].content.parts[].text
"""

import os
import json
import httpx
from typing import AsyncGenerator

# ─────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────

KIE_BASE = "https://api.kie.ai/gemini/v1/models"
KIE_CHAT_MODEL = "gemini-3-flash-v1beta"


def _get_kie_key() -> str:
    key = os.getenv("KIE_API_KEY")
    if not key:
        raise RuntimeError("KIE_API_KEY must be set in .env")
    return key


# ─────────────────────────────────────────────────────────────────────
# Message format conversion: Anthropic-style → Gemini native
# ─────────────────────────────────────────────────────────────────────

def _to_gemini_contents(
    messages: list[dict],
    system_prompt: str | None = None,
) -> tuple[list[dict], str | None]:
    """
    Convert Anthropic/OpenAI-style messages to Gemini contents format.

    Gemini uses:
      role: "user" | "model"  (not "assistant")
      parts: [{"text": "..."}]

    System prompt becomes a systemInstruction (Gemini native).
    """
    contents = []

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        # Gemini uses "model" instead of "assistant"
        gemini_role = "model" if role == "assistant" else "user"

        # Handle string content or list-of-blocks content
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            # Extract text from content blocks
            text_parts = []
            for block in content:
                if isinstance(block, dict):
                    if block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif "text" in block:
                        text_parts.append(block["text"])
                elif isinstance(block, str):
                    text_parts.append(block)
            text = "\n".join(text_parts)
        else:
            text = str(content)

        if text.strip():
            contents.append({
                "role": gemini_role,
                "parts": [{"text": text}],
            })

    return contents, system_prompt


# ─────────────────────────────────────────────────────────────────────
# Streaming chat via KIE.ai Gemini endpoint
# ─────────────────────────────────────────────────────────────────────

async def stream_gemini(
    messages: list[dict],
    system_prompt: str | None = None,
    model: str = KIE_CHAT_MODEL,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """
    Stream text tokens from KIE.ai Gemini API.

    Yields plain text tokens (not SSE-formatted — caller wraps in SSE).
    """
    api_key = _get_kie_key()
    url = f"{KIE_BASE}/{model}:streamGenerateContent"

    contents, sys_prompt = _to_gemini_contents(messages, system_prompt)

    body: dict = {
        "stream": True,
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 1.0,
        },
    }

    # System instruction (Gemini native — separate from contents)
    if sys_prompt:
        body["systemInstruction"] = {
            "parts": [{"text": sys_prompt}],
        }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, json=body, headers=headers) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                raise RuntimeError(
                    f"KIE API error ({response.status_code}): {error_body.decode()}"
                )

            buffer = ""
            async for chunk in response.aiter_text():
                buffer += chunk

                # KIE streams newline-delimited JSON or SSE data: lines
                lines = buffer.split("\n")
                buffer = lines.pop()  # keep incomplete line in buffer

                for line in lines:
                    line = line.strip()
                    if not line:
                        continue

                    # Strip SSE "data: " prefix if present
                    if line.startswith("data: "):
                        line = line[6:]

                    if line == "[DONE]":
                        return

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Extract text from Gemini response format
                    # Structure: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
                    candidates = data.get("candidates", [])
                    for candidate in candidates:
                        parts = (
                            candidate.get("content", {}).get("parts", [])
                        )
                        for part in parts:
                            text = part.get("text", "")
                            if text:
                                yield text
