from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Protocol


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SwitchboardRepository(Protocol):
    async def get_brand_passport(self, org_id: str) -> dict[str, Any]: ...
    async def get_agent_memory(self, org_id: str, agent_slug: str, limit: int = 20) -> list[dict[str, Any]]: ...
    async def insert_agent_memory(self, org_id: str, agent_slug: str, role: str, content: str) -> dict[str, Any]: ...
    async def create_agent_run(self, org_id: str, agent_slug: str, triggered_by: str, input_text: str) -> str: ...
    async def update_agent_run(self, run_id: str, updates: dict[str, Any]) -> None: ...
    async def insert_agent_run_step(self, agent_run_id: str, org_id: str, agent_slug: str, step_label: str, step_status: str, detail: str | None = None) -> dict[str, Any]: ...
    async def insert_squad_message(self, org_id: str, sender_slug: str, content: str, mentions: list[str] | None = None, related_run_id: str | None = None, hitl_draft_id: str | None = None) -> dict[str, Any]: ...
    async def create_draft(self, org_id: str, agent_slug: str, inbound_text: str, draft_content: str, prospect_id: str | None = None) -> dict[str, Any]: ...
    async def update_draft(self, draft_id: str, updates: dict[str, Any]) -> dict[str, Any]: ...
    async def get_draft(self, draft_id: str) -> dict[str, Any] | None: ...
    async def get_dashboard_stats(self, org_id: str) -> list[dict[str, str]]: ...


class InMemoryRepository:
    def __init__(self) -> None:
        self.brand_passports: dict[str, dict[str, Any]] = {}
        self.agent_memory: list[dict[str, Any]] = []
        self.agent_runs: list[dict[str, Any]] = []
        self.agent_run_steps: list[dict[str, Any]] = []
        self.squad_messages: list[dict[str, Any]] = []
        self.drafts: list[dict[str, Any]] = []

    def seed_brand_passport(self, org_id: str, passport: dict[str, Any]) -> None:
        self.brand_passports[org_id] = {"org_id": org_id, **passport}

    async def get_brand_passport(self, org_id: str) -> dict[str, Any]:
        return self.brand_passports.get(org_id, {"org_id": org_id, "brand_name": "Unknown Brand"})

    async def get_agent_memory(self, org_id: str, agent_slug: str, limit: int = 20) -> list[dict[str, Any]]:
        rows = [
            row
            for row in self.agent_memory
            if row["org_id"] == org_id and row["agent_slug"] == agent_slug
        ]
        return rows[-limit:]

    async def insert_agent_memory(self, org_id: str, agent_slug: str, role: str, content: str) -> dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "agent_slug": agent_slug,
            "role": role,
            "content": content,
            "created_at": utc_now_iso(),
        }
        self.agent_memory.append(row)
        return row

    async def create_agent_run(self, org_id: str, agent_slug: str, triggered_by: str, input_text: str) -> str:
        row = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "agent_slug": agent_slug,
            "triggered_by": triggered_by,
            "input_text": input_text,
            "status": "running",
            "created_at": utc_now_iso(),
            "completed_at": None,
        }
        self.agent_runs.append(row)
        return row["id"]

    async def update_agent_run(self, run_id: str, updates: dict[str, Any]) -> None:
        for row in self.agent_runs:
            if row["id"] == run_id:
                row.update(updates)
                return

    async def insert_agent_run_step(
        self,
        agent_run_id: str,
        org_id: str,
        agent_slug: str,
        step_label: str,
        step_status: str,
        detail: str | None = None,
    ) -> dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "agent_run_id": agent_run_id,
            "org_id": org_id,
            "agent_slug": agent_slug,
            "step_label": step_label,
            "step_status": step_status,
            "detail": detail,
            "created_at": utc_now_iso(),
        }
        self.agent_run_steps.append(row)
        return row

    async def insert_squad_message(
        self,
        org_id: str,
        sender_slug: str,
        content: str,
        mentions: list[str] | None = None,
        related_run_id: str | None = None,
        hitl_draft_id: str | None = None,
    ) -> dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "sender_slug": sender_slug,
            "content": content,
            "mentions": mentions or [],
            "related_run_id": related_run_id,
            "hitl_draft_id": hitl_draft_id,
            "created_at": utc_now_iso(),
        }
        self.squad_messages.append(row)
        return row

    async def create_draft(
        self,
        org_id: str,
        agent_slug: str,
        inbound_text: str,
        draft_content: str,
        prospect_id: str | None = None,
    ) -> dict[str, Any]:
        row = {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "agent_slug": agent_slug,
            "prospect_id": prospect_id,
            "inbound_text": inbound_text,
            "draft_content": draft_content,
            "final_content": None,
            "status": "pending",
            "created_at": utc_now_iso(),
            "decided_at": None,
        }
        self.drafts.append(row)
        return row

    async def update_draft(self, draft_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        for row in self.drafts:
            if row["id"] == draft_id:
                row.update(updates)
                return row
        raise KeyError(draft_id)

    async def get_draft(self, draft_id: str) -> dict[str, Any] | None:
        return next((row for row in self.drafts if row["id"] == draft_id), None)

    async def get_dashboard_stats(self, org_id: str) -> list[dict[str, str]]:
        running = sum(1 for run in self.agent_runs if run["org_id"] == org_id and run["status"] == "running")
        pending = sum(1 for draft in self.drafts if draft["org_id"] == org_id and draft["status"] == "pending")
        completed = sum(1 for run in self.agent_runs if run["org_id"] == org_id and run["status"] == "completed")
        return [
            {"value": str(running), "label": "Runs active"},
            {"value": str(pending), "label": "Drafts pending"},
            {"value": str(completed), "label": "Completed runs"},
            {"value": str(len(self.squad_messages)), "label": "Squad messages"},
        ]


class SupabaseRepository:
    def __init__(self, client: Any) -> None:
        self.client = client

    async def get_brand_passport(self, org_id: str) -> dict[str, Any]:
        result = (
            self.client.table("brand_passports")
            .select("*")
            .eq("org_id", org_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else {"org_id": org_id, "brand_name": "Unknown Brand"}

    async def get_agent_memory(self, org_id: str, agent_slug: str, limit: int = 20) -> list[dict[str, Any]]:
        result = (
            self.client.table("agent_memory")
            .select("*")
            .eq("org_id", org_id)
            .eq("agent_slug", agent_slug)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    async def insert_agent_memory(self, org_id: str, agent_slug: str, role: str, content: str) -> dict[str, Any]:
        result = self.client.table("agent_memory").insert({
            "org_id": org_id,
            "agent_slug": agent_slug,
            "role": role,
            "content": content,
        }).execute()
        return result.data[0]

    async def create_agent_run(self, org_id: str, agent_slug: str, triggered_by: str, input_text: str) -> str:
        result = self.client.table("agent_runs").insert({
            "org_id": org_id,
            "agent_slug": agent_slug,
            "triggered_by": triggered_by,
            "input_text": input_text,
            "status": "running",
        }).execute()
        return result.data[0]["id"]

    async def update_agent_run(self, run_id: str, updates: dict[str, Any]) -> None:
        self.client.table("agent_runs").update(updates).eq("id", run_id).execute()

    async def insert_agent_run_step(
        self,
        agent_run_id: str,
        org_id: str,
        agent_slug: str,
        step_label: str,
        step_status: str,
        detail: str | None = None,
    ) -> dict[str, Any]:
        result = self.client.table("agent_run_steps").insert({
            "agent_run_id": agent_run_id,
            "org_id": org_id,
            "agent_slug": agent_slug,
            "step_label": step_label,
            "step_status": step_status,
            "detail": detail,
        }).execute()
        return result.data[0]

    async def insert_squad_message(
        self,
        org_id: str,
        sender_slug: str,
        content: str,
        mentions: list[str] | None = None,
        related_run_id: str | None = None,
        hitl_draft_id: str | None = None,
    ) -> dict[str, Any]:
        result = self.client.table("squad_messages").insert({
            "org_id": org_id,
            "sender_slug": sender_slug,
            "content": content,
            "mentions": mentions or [],
            "related_run_id": related_run_id,
            "hitl_draft_id": hitl_draft_id,
        }).execute()
        return result.data[0]

    async def create_draft(
        self,
        org_id: str,
        agent_slug: str,
        inbound_text: str,
        draft_content: str,
        prospect_id: str | None = None,
    ) -> dict[str, Any]:
        result = self.client.table("drafts").insert({
            "org_id": org_id,
            "agent_slug": agent_slug,
            "prospect_id": prospect_id,
            "inbound_text": inbound_text,
            "draft_content": draft_content,
            "status": "pending",
        }).execute()
        return result.data[0]

    async def update_draft(self, draft_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table("drafts").update(updates).eq("id", draft_id).execute()
        return result.data[0]

    async def get_draft(self, draft_id: str) -> dict[str, Any] | None:
        result = self.client.table("drafts").select("*").eq("id", draft_id).limit(1).execute()
        return result.data[0] if result.data else None

    async def get_dashboard_stats(self, org_id: str) -> list[dict[str, str]]:
        runs = self.client.table("agent_runs").select("id,status").eq("org_id", org_id).execute().data or []
        drafts = self.client.table("drafts").select("id,status").eq("org_id", org_id).execute().data or []
        messages = self.client.table("squad_messages").select("id").eq("org_id", org_id).execute().data or []
        active = sum(1 for run in runs if run.get("status") == "running")
        completed = sum(1 for run in runs if run.get("status") == "completed")
        pending = sum(1 for draft in drafts if draft.get("status") == "pending")
        return [
            {"value": str(active), "label": "Runs active"},
            {"value": str(pending), "label": "Drafts pending"},
            {"value": str(completed), "label": "Completed runs"},
            {"value": str(len(messages)), "label": "Squad messages"},
        ]
