"""
Unified Brand Passport service for the web Co-Pilot.

Mirrors converza_bot/services/brand_passport.py so both services share
the same write/read contract against Supabase.
"""

from datetime import datetime, timezone

from db import get_supabase

# Columns that exist on the live Supabase brand_passports table.
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
    enriched["brand_voice"] = passport.get("brand_voice") or passport.get("tone") or ""
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


def upsert_passport(org_id: str, data: dict) -> dict:
    sb = get_supabase()
    sync_organization(org_id, click_token=data.get("click_token"))

    passport = {k: data[k] for k in DB_PASSPORT_FIELDS if k in data}
    passport["org_id"] = org_id
    passport["updated_at"] = datetime.now(timezone.utc).isoformat()

    existing = fetch_passport_by_org(org_id)
    if existing:
        result = (
            sb.table("brand_passports")
            .update(passport)
            .eq("id", existing["id"])
            .execute()
        )
    else:
        result = sb.table("brand_passports").insert(passport).execute()

    return enrich_passport(result.data[0])


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
