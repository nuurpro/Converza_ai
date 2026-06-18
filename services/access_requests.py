"""Access request workflow — approve before Telegram login."""

from datetime import datetime, timezone

from db import get_supabase

VALID_STATUSES = ("pending", "approved", "rejected")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_username(username: str | None) -> str | None:
    if not username:
        return None
    return username.strip().lstrip("@").lower() or None


def create_request(
    *,
    full_name: str,
    business_name: str,
    contact: str,
    telegram_username: str | None = None,
    message: str = "",
) -> dict:
    sb = get_supabase()
    row = {
        "full_name": full_name.strip(),
        "business_name": business_name.strip(),
        "contact": contact.strip(),
        "telegram_username": _normalize_username(telegram_username),
        "message": (message or "").strip(),
        "status": "pending",
        "updated_at": _now(),
    }
    result = sb.table("access_requests").insert(row).execute()
    return result.data[0]


def get_request(request_id: str) -> dict | None:
    sb = get_supabase()
    result = (
        sb.table("access_requests")
        .select("*")
        .eq("id", request_id)
        .maybe_single()
        .execute()
    )
    if result is None:
        return None
    return result.data


def list_requests(status: str | None = None) -> list[dict]:
    sb = get_supabase()
    query = sb.table("access_requests").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []


def _find_approved(telegram_id: str, telegram_username: str | None) -> dict | None:
    sb = get_supabase()
    by_id = (
        sb.table("access_requests")
        .select("*")
        .eq("telegram_id", telegram_id)
        .eq("status", "approved")
        .maybe_single()
        .execute()
    )
    if by_id and by_id.data:
        return by_id.data

    username = _normalize_username(telegram_username)
    if not username:
        return None

    result = (
        sb.table("access_requests")
        .select("*")
        .eq("status", "approved")
        .eq("telegram_username", username)
        .order("reviewed_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def is_user_approved(telegram_id: str, telegram_username: str | None) -> bool:
    return _find_approved(telegram_id, telegram_username) is not None


def link_telegram_id(telegram_id: str, telegram_username: str | None) -> None:
    """Attach telegram_id to the approved request after first login."""
    approved = _find_approved(telegram_id, telegram_username)
    if not approved or approved.get("telegram_id"):
        return
    sb = get_supabase()
    sb.table("access_requests").update({
        "telegram_id": telegram_id,
        "telegram_username": _normalize_username(telegram_username) or approved.get("telegram_username"),
        "updated_at": _now(),
    }).eq("id", approved["id"]).execute()


def approve_request(request_id: str, review_note: str = "") -> dict:
    sb = get_supabase()
    result = (
        sb.table("access_requests")
        .update({
            "status": "approved",
            "review_note": review_note.strip() or None,
            "reviewed_at": _now(),
            "updated_at": _now(),
        })
        .eq("id", request_id)
        .eq("status", "pending")
        .execute()
    )
    if not result.data:
        raise ValueError("So'rov topilmadi yoki allaqachon ko'rib chiqilgan.")
    return result.data[0]


def reject_request(request_id: str, review_note: str = "") -> dict:
    sb = get_supabase()
    result = (
        sb.table("access_requests")
        .update({
            "status": "rejected",
            "review_note": review_note.strip() or None,
            "reviewed_at": _now(),
            "updated_at": _now(),
        })
        .eq("id", request_id)
        .eq("status", "pending")
        .execute()
    )
    if not result.data:
        raise ValueError("So'rov topilmadi yoki allaqachon ko'rib chiqilgan.")
    return result.data[0]
