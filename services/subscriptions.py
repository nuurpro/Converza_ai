"""Subscription status for web API (mirrors converza_bot.services.subscriptions)."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from db import get_supabase
from services.config import is_production


def subscription_required() -> bool:
    if os.getenv("SUBSCRIPTION_REQUIRED", "").strip().lower() in ("0", "false", "no"):
        return False
    if not is_production():
        return os.getenv("SUBSCRIPTION_REQUIRED", "").strip().lower() in ("1", "true", "yes")
    return True


def _parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def is_subscription_active(org_id: str) -> bool:
    if not subscription_required():
        return True
    try:
        result = (
            get_supabase()
            .table("org_subscriptions")
            .select("status, current_period_end")
            .eq("org_id", org_id)
            .maybe_single()
            .execute()
        )
    except Exception:
        return False
    row = result.data if result else None
    if not row or row.get("status") != "active":
        return False
    period_end = _parse_ts(row.get("current_period_end"))
    if period_end and period_end < datetime.now(timezone.utc):
        return False
    return True
