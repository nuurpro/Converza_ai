"""
Supabase client — single async-compatible instance for the entire app.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

from services.config import is_production, load_local_env_override

load_dotenv()

# Local monorepo dev only — in Docker/production env comes from /etc/converza/.env
if not is_production():
    parts = Path(__file__).resolve().parents
    if len(parts) > 2:
        bot_env = parts[2] / "converza_bot" / ".env"
        if bot_env.is_file():
            load_dotenv(bot_env)

load_local_env_override()

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY must be set in .env"
            )
        _client = create_client(url, key)
    return _client
