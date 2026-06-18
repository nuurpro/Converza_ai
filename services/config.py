"""Environment helpers for the web service."""

import os
import sys


def is_production() -> bool:
    return os.getenv("ENV", "development").lower() == "production"


def load_local_env_override() -> None:
    if is_production():
        return
    from pathlib import Path
    from dotenv import load_dotenv

    root = Path(__file__).resolve().parents[3]
    load_dotenv(root / ".env.local", override=True)


def require_env_vars(names: list[str], service: str = "web") -> None:
    if not is_production():
        return
    missing = [name for name in names if not os.getenv(name, "").strip()]
    if missing:
        print(
            f"FATAL [{service}]: missing required env vars in production: "
            + ", ".join(missing),
            file=sys.stderr,
        )
        sys.exit(1)
