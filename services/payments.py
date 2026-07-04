"""Click payment helpers for the web API (mirrors converza_bot.services.payments)."""

INVALID_PROVIDER_TOKENS = frozenset(
    {"", "123456", "test", "changeme", "your_token_here", "your_click_provider_token_here"}
)


def is_configured_provider_token(provider_token: str | None) -> bool:
    token = (provider_token or "").strip()
    if token.lower() in INVALID_PROVIDER_TOKENS:
        return False
    return len(token) >= 20 and ":" in token


def payments_configured(click_token: str | None) -> bool:
    return is_configured_provider_token(click_token)
