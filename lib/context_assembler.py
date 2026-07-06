from __future__ import annotations

from pathlib import Path
from typing import Any

from lib.repository import SwitchboardRepository

VALID_AGENTS = {"milo", "sleyz", "vea"}
IDENTITIES_DIR = Path(__file__).resolve().parent.parent / "identities"


def load_identity_file(agent_slug: str) -> str:
    if agent_slug not in VALID_AGENTS:
        raise ValueError(f"Unknown agent_slug: {agent_slug}")

    path = IDENTITIES_DIR / f"{agent_slug}.md"
    return path.read_text(encoding="utf-8")


async def assemble_context(
    org_id: str,
    agent_slug: str,
    *,
    repo: SwitchboardRepository,
) -> dict[str, Any]:
    brand_passport = await repo.get_brand_passport(org_id)
    identity = load_identity_file(agent_slug)
    scoped_memory = await repo.get_agent_memory(org_id, agent_slug, limit=20)
    return {
        "brand_passport": brand_passport,
        "identity": identity,
        "memory": scoped_memory,
    }
