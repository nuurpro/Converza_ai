"""
PDF -> structured Brand Passport.

Business owners can upload one or more PDFs. We extract the text from all of
them, then ask an LLM to produce a single structured Brand Passport JSON that
matches the shape used across Converza (bot + web).

Primary LLM: Groq (llama-3.3-70b-versatile) — same as converza_bot.
Fallback:    Anthropic, if GROQ_API_KEY is not available.
"""

from __future__ import annotations

import json
import os

import fitz  # PyMuPDF
import httpx

GROQ_MODEL = "llama-3.3-70b-versatile"
ANTHROPIC_MODEL = "claude-3-5-sonnet-latest"
MAX_CHARS = 16000  # keep prompt within model limits

PASSPORT_SCHEMA = {
    "brand_name": "string",
    "industry": "string",
    "target_location": "string",
    "target_audience": "string",
    "core_offer": "string",
    "tone": "string",
    "pricing": [{"tier": "string", "price": "string", "features": ["string"]}],
    "faq": [{"question": "string", "answer": "string"}],
    "objections": [{"objection": "string", "response": "string"}],
    "raw_notes": "string",
}

SYSTEM_PROMPT = (
    "Siz biznes hujjatlarini tahlil qiluvchi AI tizimisiz.\n"
    "Berilgan matnlardan strukturalangan Brand Passport JSON yarating.\n"
    "Barcha matn maydonlari O'zbek tilida bo'lsin.\n"
    "Faqat quyidagi JSON strukturasini qaytaring, boshqa hech narsa yozmang:\n"
    f"{json.dumps(PASSPORT_SCHEMA, ensure_ascii=False)}\n\n"
    "Agar pricing, faq yoki objections topilmasa, [] qaytaring. "
    "brand_name topilmasa, hujjatdagi kompaniya nomidan foydalaning."
)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for page in doc:
            text += page.get_text()
    finally:
        doc.close()
    return text


def extract_text_from_pdfs(named_files: list[tuple[str, bytes]]) -> str:
    """Combine text from multiple PDFs, labeling each by filename."""
    chunks: list[str] = []
    for filename, data in named_files:
        try:
            extracted = extract_text_from_pdf(data).strip()
        except Exception as exc:
            extracted = f"(Faylni o'qishda xatolik: {exc})"
        if extracted:
            chunks.append(f"=== Hujjat: {filename} ===\n{extracted}")
    return "\n\n".join(chunks)


async def _summarize_with_groq(text: str, api_key: str) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Quyidagi hujjat(lar)dan kompaniya pasportini yarating:\n\n{text[:MAX_CHARS]}",
        },
    ]
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 2000,
                "response_format": {"type": "json_object"},
            },
        )
        resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"].strip()
    return json.loads(content)


async def _summarize_with_anthropic(text: str, api_key: str) -> dict:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    resp = await client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Quyidagi hujjat(lar)dan kompaniya pasportini yarating. "
                    "Faqat JSON qaytaring:\n\n" + text[:MAX_CHARS]
                ),
            }
        ],
    )
    raw = "".join(block.text for block in resp.content if block.type == "text").strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1].lstrip("json").strip()
    return json.loads(raw)


def _normalize(passport: dict) -> dict:
    """Ensure list fields are lists and required string fields exist."""
    passport.setdefault("brand_name", "")
    passport.setdefault("industry", "")
    passport.setdefault("target_location", "O'zbekiston")
    passport.setdefault("target_audience", "")
    passport.setdefault("core_offer", "")
    if not (passport.get("tone") or "").strip():
        passport["tone"] = "Samimiy, ishonchli va lo'nda"
    passport.setdefault("raw_notes", "")
    for key in ("pricing", "faq", "objections"):
        value = passport.get(key)
        if not isinstance(value, list):
            passport[key] = []
    return passport


async def generate_passport_from_text(text: str) -> dict:
    if not text.strip():
        return _normalize({"raw_notes": "Hujjatlardan matn topilmadi."})

    groq_key = os.getenv("GROQ_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    parsed: dict | None = None
    errors: list[str] = []

    if groq_key:
        try:
            parsed = await _summarize_with_groq(text, groq_key)
        except Exception as exc:
            errors.append(f"Groq: {exc}")

    if parsed is None and anthropic_key:
        try:
            parsed = await _summarize_with_anthropic(text, anthropic_key)
        except Exception as exc:
            errors.append(f"Anthropic: {exc}")

    if parsed is None:
        detail = "; ".join(errors) if errors else "LLM kaliti sozlanmagan (GROQ_API_KEY yoki ANTHROPIC_API_KEY)."
        raise RuntimeError(f"Brand passport yaratib bo'lmadi. {detail}")

    return _normalize(parsed)


async def process_documents(named_files: list[tuple[str, bytes]]) -> dict:
    """Full pipeline: extract text from PDFs -> structured Brand Passport dict."""
    text = extract_text_from_pdfs(named_files)
    return await generate_passport_from_text(text)
