from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from lib.repository import SwitchboardRepository


def _started_text(step_label: str) -> str:
    normalized = step_label[0].lower() + step_label[1:] if step_label else step_label
    if normalized.startswith("researching "):
        normalized = normalized.removeprefix("researching ")
    return f"Starting {normalized}..."


def _completed_text(step_label: str, detail: str | None = None) -> str:
    core = step_label
    if core.lower().startswith("researching "):
        core = core[len("Researching "):]
    if core.endswith("ing"):
        core = core[:-3]
    normalized = core[0].lower() + core[1:] if core else core
    if detail:
        return f"Finished {normalized} — {detail}"
    return f"Finished {normalized}."


@asynccontextmanager
async def narrate_step(
    *,
    repo: SwitchboardRepository,
    org_id: str,
    agent_slug: str,
    run_id: str,
    step_label: str,
    completed_detail: str | None = None,
) -> AsyncIterator[None]:
    await repo.insert_agent_run_step(
        agent_run_id=run_id,
        org_id=org_id,
        agent_slug=agent_slug,
        step_label=step_label,
        step_status="started",
    )
    await repo.insert_squad_message(
        org_id=org_id,
        sender_slug=agent_slug,
        content=_started_text(step_label),
        related_run_id=run_id,
    )
    try:
        yield
    except Exception as exc:
        await repo.insert_agent_run_step(
            agent_run_id=run_id,
            org_id=org_id,
            agent_slug=agent_slug,
            step_label=step_label,
            step_status="failed",
            detail=str(exc),
        )
        await repo.insert_squad_message(
            org_id=org_id,
            sender_slug=agent_slug,
            content=f"Failed {step_label} — {exc}",
            related_run_id=run_id,
        )
        raise
    else:
        await repo.insert_agent_run_step(
            agent_run_id=run_id,
            org_id=org_id,
            agent_slug=agent_slug,
            step_label=step_label,
            step_status="completed",
            detail=completed_detail,
        )
        await repo.insert_squad_message(
            org_id=org_id,
            sender_slug=agent_slug,
            content=_completed_text(step_label, completed_detail),
            related_run_id=run_id,
        )
