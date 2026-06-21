"""PDF -> Brand Passport via Hermes + MCP."""

from __future__ import annotations

import fitz  # PyMuPDF

from converza_agent.client import HermesError
from converza_agent.config import hermes_configured
from converza_agent.runtime import run_agent_json

MAX_CHARS = 16000


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
    chunks: list[str] = []
    for filename, data in named_files:
        try:
            extracted = extract_text_from_pdf(data).strip()
        except Exception as exc:
            extracted = f"(Faylni o'qishda xatolik: {exc})"
        if extracted:
            chunks.append(f"=== Hujjat: {filename} ===\n{extracted}")
    return "\n\n".join(chunks)


def _normalize(passport: dict) -> dict:
    passport.setdefault("brand_name", "")
    passport.setdefault("industry", "")
    passport.setdefault("target_location", "O'zbekiston")
    passport.setdefault("target_audience", "")
    passport.setdefault("core_offer", "")
    if not (passport.get("tone") or "").strip():
        passport["tone"] = "Samimiy, ishonchli va lo'nda"
    passport.setdefault("raw_notes", "")
    for key in ("pricing", "faq", "objections"):
        if not isinstance(passport.get(key), list):
            passport[key] = []
    return passport


async def generate_passport_from_text(text: str) -> dict:
    if not text.strip():
        return _normalize({"raw_notes": "Hujjatlardan matn topilmadi."})
    if not hermes_configured():
        raise RuntimeError("HERMES_API_KEY sozlanmagan.")

    try:
        parsed = await run_agent_json(
            "passport-extract",
            [{"role": "user", "content": f"Hujjat matni:\n\n{text[:MAX_CHARS]}"}],
            session_key="converza:pdf-parser",
            max_tokens=2000,
        )
    except HermesError as exc:
        raise RuntimeError(f"Brand passport yaratib bo'lmadi. {exc}") from exc

    return _normalize(parsed)


async def process_documents(named_files: list[tuple[str, bytes]]) -> dict:
    text = extract_text_from_pdfs(named_files)
    return await generate_passport_from_text(text)
