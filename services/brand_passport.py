"""
Unified Brand Passport service for the web Co-Pilot.

Mirrors converza_bot/services/brand_passport.py so both services share
the same write/read contract against Supabase.
"""

import json
import re
from datetime import datetime, timezone

from db import get_supabase
from services.supabase_errors import format_supabase_error, parse_missing_column

_META_START = "---converza_meta---"
_META_END = "---end_meta---"

# Columns the app writes when the database schema is fully migrated.
DB_PASSPORT_FIELDS = (
    "brand_name",
    "industry",
    "target_location",
    "target_audience",
    "core_offer",
    "tone",
    "pricing",
    "faq",
    "objections",
    "raw_notes",
)


def _embed_meta_in_raw_notes(user_notes: str, meta: dict) -> str:
    clean = re.sub(
        rf"{re.escape(_META_START)}.*?{re.escape(_META_END)}\s*",
        "",
        user_notes or "",
        flags=re.DOTALL,
    ).strip()
    block = f"{_META_START}\n{json.dumps(meta, ensure_ascii=False)}\n{_META_END}\n"
    return block + clean


def _extract_meta_from_raw_notes(raw_notes: str) -> tuple[dict, str]:
    text = raw_notes or ""
    match = re.search(
        rf"{re.escape(_META_START)}\s*(\{{.*?\}})\s*{re.escape(_META_END)}",
        text,
        flags=re.DOTALL,
    )
    if not match:
        return {}, text
    try:
        meta = json.loads(match.group(1))
    except json.JSONDecodeError:
        meta = {}
    clean = re.sub(
        rf"{re.escape(_META_START)}.*?{re.escape(_META_END)}\s*",
        "",
        text,
        flags=re.DOTALL,
    ).strip()
    return meta, clean


def normalize_brand_context(
    passport: dict | None,
    legacy: str | dict | None = None,
) -> dict:
    if isinstance(legacy, str) and legacy.strip():
        return {
            "brand_name": None,
            "industry": None,
            "target_audience": None,
            "core_offer": None,
            "tone": None,
            "brand_voice": None,
            "faq": [],
            "pricing": [],
            "objections": [],
            "raw_notes": legacy,
            "brand_passport": {"raw_notes": legacy},
        }

    if isinstance(legacy, dict) and legacy and not passport:
        passport = legacy

    if not passport:
        return {}

    voice = passport.get("brand_voice") or passport.get("tone") or ""
    return {
        "brand_name": passport.get("brand_name"),
        "industry": passport.get("industry"),
        "target_audience": passport.get("target_audience"),
        "core_offer": passport.get("core_offer"),
        "target_location": passport.get("target_location"),
        "tone": passport.get("tone"),
        "brand_voice": voice,
        "faq": passport.get("faq") or [],
        "pricing": passport.get("pricing") or [],
        "objections": passport.get("objections") or [],
        "hex_colors": passport.get("hex_colors") or [],
        "competitors": passport.get("competitors") or [],
        "avoid_topics": passport.get("avoid_topics") or [],
        "raw_notes": passport.get("raw_notes") or "",
        "brand_passport": passport,
    }


def _maybe_single_row(sb, table: str, select: str, **eq_filters) -> dict | None:
    """supabase-py returns None when maybe_single finds 0 rows."""
    query = sb.table(table).select(select)
    for col, val in eq_filters.items():
        query = query.eq(col, val)
    result = query.maybe_single().execute()
    if result is None:
        return None
    return result.data


def enrich_passport(passport: dict | None) -> dict | None:
    """Add in-memory agent fields that are not stored as DB columns."""
    if not passport:
        return passport
    enriched = dict(passport)
    meta, clean_notes = _extract_meta_from_raw_notes(enriched.get("raw_notes") or "")
    enriched["raw_notes"] = clean_notes
    for key, value in meta.items():
        enriched.setdefault(key, value)
    enriched["brand_voice"] = enriched.get("brand_voice") or enriched.get("tone") or ""
    enriched.setdefault("hex_colors", [])
    enriched.setdefault("competitors", [])
    enriched.setdefault("avoid_topics", [])
    return enriched


def fetch_passport_by_org(org_id: str) -> dict | None:
    sb = get_supabase()
    row = _maybe_single_row(sb, "brand_passports", "*", org_id=org_id)
    return enrich_passport(row)


def fetch_passport_by_id(brand_id: str) -> dict | None:
    sb = get_supabase()
    row = _maybe_single_row(sb, "brand_passports", "*", id=brand_id)
    return enrich_passport(row)


def _persist_passport(sb, passport: dict, existing: dict | None):
    if existing:
        return (
            sb.table("brand_passports")
            .update(passport)
            .eq("id", existing["id"])
            .execute()
        )
    return sb.table("brand_passports").insert(passport).execute()


def upsert_passport(org_id: str, data: dict) -> dict:
    sb = get_supabase()
    sync_organization(org_id, click_token=data.get("click_token"))

    passport = {k: data[k] for k in DB_PASSPORT_FIELDS if k in data}
    passport["org_id"] = org_id
    passport["updated_at"] = datetime.now(timezone.utc).isoformat()

    existing = fetch_passport_by_org(org_id)
    user_notes = data.get("raw_notes") or ""
    stashed: dict = {}

    for _ in range(len(DB_PASSPORT_FIELDS) + 1):
        try:
            result = _persist_passport(sb, passport, existing)
            return enrich_passport(result.data[0])
        except Exception as exc:
            missing = parse_missing_column(str(exc))
            if missing and missing in passport:
                stashed[missing] = passport.pop(missing)
                passport["raw_notes"] = _embed_meta_in_raw_notes(user_notes, stashed)
                continue
            raise ValueError(format_supabase_error(exc)) from exc

    raise ValueError(
        "Brend pasportini saqlab bo'lmadi. Ma'lumotlar bazasi sxemasini tekshiring."
    )


def sync_organization(org_id: str, click_token: str | None = None) -> None:
    """Best-effort write of org metadata.

    `organizations` holds optional metadata (click_token, business_connection_id).
    Login and onboarding must never fail if this write fails (e.g. the table has
    not been provisioned yet), so errors are swallowed and logged.
    """
    sb = get_supabase()
    row: dict = {"id": org_id}
    if click_token:
        row["click_token"] = click_token
    try:
        sb.table("organizations").upsert(row).execute()
    except Exception as e:
        print(f"[brand_passport] sync_organization skipped for {org_id}: {e}")


def passport_to_client_context(passport: dict) -> dict:
    """Map a saved passport into the ClientContext shape used by /chat."""
    return {
        "brand_name": passport.get("brand_name") or "Unknown Brand",
        "industry": passport.get("industry") or "General Business",
        "target_location": passport.get("target_location") or "Not specified",
        "hex_colors": passport.get("hex_colors") or [],
        "target_audience": passport.get("target_audience") or "Not specified",
        "core_offer": passport.get("core_offer") or "Not specified",
    }
