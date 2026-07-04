"""JWT session tokens issued after Telegram Login Widget auth."""

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

_bearer = HTTPBearer(auto_error=False)


def admin_telegram_ids() -> set[str]:
    raw = os.getenv("ADMIN_TELEGRAM_IDS", "")
    return {item.strip() for item in raw.split(",") if item.strip()}


def is_admin_telegram_id(telegram_id: int | str) -> bool:
    return str(telegram_id) in admin_telegram_ids()


def create_token(org_id: str, telegram_id: int, *, role: str = "user") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "org_id": org_id,
        "telegram_id": telegram_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya muddati tugagan. Qayta kiring.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Noto'g'ri yoki muddati o'tgan sessiya.",
        )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avval Telegram orqali kiring.",
        )
    return decode_token(credentials.credentials)


def assert_org_access(user: dict, org_id: str) -> None:
    """Prevent IDOR — request org_id must match JWT claim."""
    if str(user.get("org_id")) != str(org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ma'lumotga kirish huquqi yo'q.",
        )


async def get_admin_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    user = await get_current_user(credentials)
    telegram_id = str(user.get("telegram_id", ""))
    if user.get("role") != "admin" and not is_admin_telegram_id(telegram_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin huquqi yo'q.",
        )
    return user
