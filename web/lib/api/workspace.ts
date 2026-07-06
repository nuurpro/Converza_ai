import type {
  ActivityFeedItem,
  AgentId,
  DashboardStat,
  DraftStatus,
  SquadMessageData,
} from "@/lib/data/workspace";
import { workspaceTokens } from "@/lib/data/workspace";

export const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ??
  "00000000-0000-0000-0000-000000000001";

export interface AgentMessageResponse {
  run_id: string;
  agent_slug: AgentId;
  response: string;
}

export interface SquadMessageRow {
  id: string;
  org_id: string;
  sender_slug: string;
  content: string;
  mentions?: string[];
  related_run_id?: string | null;
  hitl_draft_id?: string | null;
  created_at?: string;
}

export interface AgentRunStepRow {
  id: string;
  agent_run_id: string;
  org_id: string;
  agent_slug: AgentId;
  step_label: string;
  step_status: "started" | "completed" | "failed" | string;
  detail?: string | null;
  created_at?: string;
}

export type SquadStreamEvent =
  | { type: "squad_message"; row: SquadMessageRow }
  | { type: "agent_run_step"; row: AgentRunStepRow }
  | { type: "error"; error: string };

interface SquadPostResponse {
  message: SquadMessageRow;
  routed_to: AgentId[];
}

interface HitlResponse {
  id: string;
  status: DraftStatus;
}

const senderMeta: Record<
  string,
  Pick<SquadMessageData, "sender" | "senderColor" | "mark" | "role">
> = {
  owner: {
    sender: "Owner",
    senderColor: workspaceTokens.black,
    mark: "N",
    role: "user",
  },
  converza: {
    sender: "Converza",
    senderColor: workspaceTokens.black,
    mark: "C",
    role: "assistant",
  },
  milo: {
    sender: "Milo",
    senderColor: workspaceTokens.milo,
    mark: "M",
    role: "assistant",
  },
  sleyz: {
    sender: "Sleyz",
    senderColor: workspaceTokens.sleyz,
    mark: "S",
    role: "assistant",
  },
  vea: {
    sender: "Vea",
    senderColor: workspaceTokens.vea,
    mark: "V",
    role: "assistant",
  },
};

const agentNames: Record<string, string> = {
  milo: "Milo",
  sleyz: "Sleyz",
  vea: "Vea",
};

const agentColors: Record<string, string> = {
  milo: workspaceTokens.milo,
  sleyz: workspaceTokens.sleyz,
  vea: workspaceTokens.vea,
  converza: workspaceTokens.black,
};

function backendPath(path: string) {
  return `/api/backend${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : `Request failed with ${response.status}`;
    throw new Error(detail);
  }

  return payload as T;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(backendPath(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return readJson<T>(response);
}

export async function sendAgentMessage(
  agentId: AgentId,
  text: string,
  orgId = DEFAULT_ORG_ID,
) {
  return apiJson<AgentMessageResponse>(`/api/agent/${agentId}/message`, {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, text }),
  });
}

export async function sendSquadMessage(text: string, orgId = DEFAULT_ORG_ID) {
  return apiJson<SquadPostResponse>("/api/squad/message", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, text }),
  });
}

export async function fetchDashboardStats(orgId = DEFAULT_ORG_ID) {
  const payload = await apiJson<{ stats: DashboardStat[] }>(
    `/api/dashboard/${orgId}/stats`,
  );
  return payload.stats;
}

export async function resolveHitlDraft(
  draftId: string,
  action: "approve" | "reject" | "edit",
  finalContent?: string,
) {
  return apiJson<HitlResponse>(`/api/hitl/${draftId}/${action}`, {
    method: "POST",
    body: action === "edit" ? JSON.stringify({ final_content: finalContent ?? "" }) : undefined,
  });
}

export function createSquadEventSource(orgId = DEFAULT_ORG_ID) {
  const params = new URLSearchParams({ org_id: orgId });
  return new EventSource(backendPath(`/api/squad/stream?${params.toString()}`));
}

export function parseSquadStreamEvent(raw: string): SquadStreamEvent | null {
  try {
    return JSON.parse(raw) as SquadStreamEvent;
  } catch {
    return null;
  }
}

export function mapSquadMessage(row: SquadMessageRow): SquadMessageData {
  const meta = senderMeta[row.sender_slug] ?? senderMeta.converza;
  const hitlStatus = inferHitlStatus(row.content);

  return {
    id: row.id,
    role: meta.role,
    sender: meta.sender,
    senderColor: meta.senderColor,
    mark: meta.mark,
    timestamp: formatTimestamp(row.created_at),
    text: row.content,
    hitlCard: row.hitl_draft_id
      ? {
          id: row.hitl_draft_id,
          label: hitlStatus === "pending" ? "Review before publishing" : "Decision recorded",
          content: row.content,
          status: hitlStatus,
        }
      : undefined,
  };
}

export function mapRunStepToActivity(row: AgentRunStepRow): ActivityFeedItem {
  const name = agentNames[row.agent_slug] ?? row.agent_slug;
  const status =
    row.step_status === "started"
      ? "started"
      : row.step_status === "completed"
        ? "finished"
        : row.step_status;
  const detail = row.detail ? ` — ${row.detail}` : "";

  return {
    id: row.id,
    agentId: row.agent_slug,
    color: agentColors[row.agent_slug] ?? workspaceTokens.black,
    text: `${name} ${status} ${row.step_label.toLowerCase()}${detail}`,
    timestamp: formatTimestamp(row.created_at),
  };
}

export function inferHitlStatus(content: string): DraftStatus {
  const normalized = content.toLowerCase();
  if (normalized.includes("hitl approved")) return "approved";
  if (normalized.includes("hitl rejected")) return "rejected";
  if (normalized.includes("hitl edited")) return "edited";
  return "pending";
}

export function isHitlDecisionMessage(message: SquadMessageData) {
  return message.hitlCard?.status && message.hitlCard.status !== "pending";
}

function formatTimestamp(value?: string) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
