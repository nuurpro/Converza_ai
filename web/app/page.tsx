"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal,
  Send,
  User,
  Bot,
  Loader2,
  Rocket,
  MessageSquare,
} from "lucide-react";
import clsx from "clsx";
import DagVisualizer, {
  type DagPlan,
  type DagNode,
  type DagSubStep,
  type DagVisualizerProps,
} from "@/components/dag/DagVisualizer";
import PermissionPill, {
  type PermissionMode,
} from "@/components/hitl/PermissionPill";
import ApprovalCard, {
  type ApprovalRequest,
} from "@/components/hitl/ApprovalCard";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  type?: "chat" | "pipeline_status" | "approval";
  approval?: ApprovalRequest;
  approvalStatus?: "approved" | "rejected";
}

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

type UserRole = "Owner" | "Marketer";
type CommandMode = "chat" | "pipeline";

// ─────────────────────────────────────────────────────────────────────
// Default client context (override from Brand Passport when ready)
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONTEXT = {
  brand_name: "My Brand",
  industry: "General Business",
  target_location: "Not specified",
  hex_colors: ["#facc15"],
  target_audience: "Not specified",
  core_offer: "Not specified",
};

// ─────────────────────────────────────────────────────────────────────
// SSE streaming — Co-Pilot chat (Gemini 3 Flash via /api/chat)
// ─────────────────────────────────────────────────────────────────────

async function streamChat(
  message: string,
  role: UserRole,
  permissionMode: PermissionMode,
  history: HistoryEntry[],
  onToken: (token: string) => void,
  onApprovalRequest: (req: ApprovalRequest) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      client_context: DEFAULT_CONTEXT,
      user_role: role,
      permission_mode: permissionMode,
      conversation_history: history,
    }),
  });

  if (!response.ok) {
    onError(`Request failed: ${response.status} ${response.statusText}`);
    return;
  }

  if (!response.body) {
    onError("No response body.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const payload = JSON.parse(raw);
        if (payload.error) {
          onError(payload.error);
          return;
        }
        if (payload.done) {
          onDone();
          return;
        }
        if (payload.approval_request) {
          onApprovalRequest(payload.approval_request as ApprovalRequest);
        }
        if (payload.token) {
          onToken(payload.token);
        }
      } catch {
        // malformed chunk — skip
      }
    }
  }

  onDone();
}

// ─────────────────────────────────────────────────────────────────────
// Pipeline SSE event types
// ─────────────────────────────────────────────────────────────────────

interface PipelineEvent {
  type:
    | "token"
    | "dag_plan"
    | "state_resolved"
    | "dag_executing"
    | "dag_result"
    | "dag_error"
    | "done"
    | "error";
  state?: "clarifying" | "executing";
  token?: string;
  plan?: DagPlan;
  status?: string;
  campaign_name?: string;
  conversation_id?: string;
  run_id?: string;
  reason?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────
// SSE streaming — Pipeline (Manager Agent via /api/pipeline)
// ─────────────────────────────────────────────────────────────────────

async function streamPipeline(
  message: string,
  role: UserRole,
  history: HistoryEntry[],
  onEvent: (event: PipelineEvent) => void,
  onError: (err: string) => void
) {
  const response = await fetch("/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      user_role: role,
      conversation_history: history,
    }),
  });

  if (!response.ok) {
    onError(`Pipeline request failed: ${response.status} ${response.statusText}`);
    return;
  }

  if (!response.body) {
    onError("No response body.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const payload = JSON.parse(raw) as PipelineEvent;
        if (payload.error || payload.type === "error") {
          onError(payload.error ?? "Unknown pipeline error");
          return;
        }
        onEvent(payload);
        if (payload.type === "done") return;
      } catch {
        // malformed chunk
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Role badge
// ─────────────────────────────────────────────────────────────────────

function RolePill({
  role,
  onChange,
  disabled,
}: {
  role: UserRole;
  onChange: (r: UserRole) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-bg-secondary p-0.5 ring-1 ring-border">
      {(["Owner", "Marketer"] as UserRole[]).map((r) => (
        <button
          key={r}
          disabled={disabled}
          onClick={() => onChange(r)}
          className={clsx(
            "rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-150",
            role === r
              ? "bg-bg-elevated text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mode toggle — chat vs pipeline
// ─────────────────────────────────────────────────────────────────────

function ModePill({
  mode,
  onChange,
  disabled,
}: {
  mode: CommandMode;
  onChange: (m: CommandMode) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-bg-secondary p-0.5 ring-1 ring-border">
      <button
        disabled={disabled}
        onClick={() => onChange("chat")}
        className={clsx(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-150",
          mode === "chat"
            ? "bg-bg-elevated text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            : "text-text-muted hover:text-text-primary",
        )}
      >
        <MessageSquare size={11} strokeWidth={2.2} />
        Chat
      </button>
      <button
        disabled={disabled}
        onClick={() => onChange("pipeline")}
        className={clsx(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-150",
          mode === "pipeline"
            ? "bg-bg-elevated text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            : "text-text-muted hover:text-text-primary",
        )}
      >
        <Rocket size={11} strokeWidth={2.2} />
        Pipeline
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isPipelineStatus = msg.type === "pipeline_status";

  // Pipeline status — quiet inline log line
  if (isPipelineStatus) {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {msg.content}
        </span>
      </div>
    );
  }

  // User message — right-aligned warm bubble, no avatar
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-tr-md bg-bg-secondary px-5 py-3 text-[15px] leading-relaxed text-text-primary md:max-w-[75%]">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message — Claude-style: small label + plain text, no bubble
  return (
    <div className="group flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-text-primary text-bg-primary">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1.5v11M1.5 7h11M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-[12.5px] font-medium tracking-tight text-text-secondary">
          Co-Pilot
        </span>
      </div>
      <div className="pl-7 text-[15px] leading-[1.7] text-text-primary">
        {msg.content}
        {msg.streaming && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse rounded-full bg-text-primary align-middle opacity-70" />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────

function EmptyState({
  onPrompt,
  mode,
}: {
  onPrompt: (p: string) => void;
  mode: CommandMode;
}) {
  const chatStarters = [
    "Analyze our competitive positioning and suggest 3 campaign angles.",
    "Draft a 30-day content calendar for Instagram and LinkedIn.",
    "What's the most impactful growth lever for our stage of business?",
    "Write a hook for a video ad targeting cold audiences.",
  ];

  const pipelineStarters = [
    "Launch a 3-part Instagram Reels campaign showcasing our product for Gen Z.",
    "Create a TikTok B-Roll product demo with bold visual style.",
    "Build a UGC-style talking head ad for Facebook targeting cold audiences.",
    "Produce a cinematic brand story video for Instagram and TikTok.",
  ];

  const starters = mode === "pipeline" ? pipelineStarters : chatStarters;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          {mode === "pipeline" ? "Pipeline · Manager Agent" : "Co-Pilot · Strategist"}
        </div>
        <h2 className="text-[clamp(32px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.02em] text-text-primary">
          What are we shipping{" "}
          <span className="font-display text-accent">today?</span>
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-text-secondary">
          {mode === "pipeline"
            ? "Describe a campaign. We compile the agent DAG and execute end-to-end while you watch."
            : "A senior marketing strategist on tap. Ask anything — strategy, copy, campaigns, competitive analysis."}
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {starters.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="group rounded-2xl border border-border bg-bg-elevated/70 px-4 py-3.5 text-left text-[13.5px] leading-relaxed text-text-secondary transition-all duration-200 hover:-translate-y-px hover:border-border-hover hover:bg-bg-elevated hover:text-text-primary hover:shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            <span className="line-clamp-2">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Build ContentCreator sub-steps from DAG state
// ─────────────────────────────────────────────────────────────────────

function buildContentCreatorSubSteps(
  node: DagNode
): DagSubStep[] {
  const status = node.status;
  const output = node.output ?? {};

  if (status === "pending") {
    return [
      { id: "anchor", label: "Generate Anchor Frame (Nano Banana 2)", status: "pending" },
      { id: "vision", label: "Vision Check (Claude Sonnet)", status: "pending" },
      { id: "animate", label: "Render Video", status: "pending" },
    ];
  }

  if (status === "running") {
    const hasAnchor = !!output.anchor_frame_url;
    const hasVideo = !!output.video_url;

    return [
      {
        id: "anchor",
        label: "Generate Anchor Frame (Nano Banana 2)",
        status: hasAnchor ? "complete" : "running",
      },
      {
        id: "vision",
        label: "Vision Check (Claude Sonnet)",
        status: hasAnchor ? "complete" : "pending",
        detail: hasAnchor ? "PASS" : undefined,
      },
      {
        id: "animate",
        label: `Render Video (${output.video_provider === "veo" ? "Veo 3.1" : "Kling 2.1"})`,
        status: hasAnchor && !hasVideo ? "running" : hasVideo ? "complete" : "pending",
      },
    ];
  }

  // complete / failed / stub
  const provider = output.video_provider as string | undefined;
  const attempts = output.vision_check_attempts as number | undefined;

  return [
    {
      id: "anchor",
      label: "Generate Anchor Frame (Nano Banana 2)",
      status: output.anchor_frame_url ? "complete" : "failed",
    },
    {
      id: "vision",
      label: "Vision Check (Claude Sonnet)",
      status: output.anchor_frame_url ? "complete" : "failed",
      detail: output.anchor_frame_url
        ? `PASS (${attempts ?? 1} attempt${(attempts ?? 1) !== 1 ? "s" : ""})`
        : "FAIL",
    },
    {
      id: "animate",
      label: `Render Video (${provider === "veo" ? "Veo 3.1" : provider === "kling" ? "Kling 2.1" : "Pending"})`,
      status: output.video_url ? "complete" : status === "failed" ? "failed" : "pending",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Main Command Center
// ─────────────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [role, setRole] = useState<UserRole>("Owner");
  const [mode, setMode] = useState<CommandMode>("chat");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("ask");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [dagPlan, setDagPlan] = useState<DagPlan | null>(null);
  const [dagRunId, setDagRunId] = useState<string | null>(null);
  const [dagStatus, setDagStatus] =
    useState<DagVisualizerProps["dagStatus"]>("running");
  const [showDag, setShowDag] = useState(false);

  const historyRef = useRef<HistoryEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dagPlan]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const appendToken = (id: string, token: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: m.content + token, streaming: true } : m
      )
    );
  };

  const finalize = (id: string, userMsg: string, fullContent: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, streaming: false } : m))
    );
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: userMsg },
      { role: "assistant", content: fullContent },
    ];
    setStreaming(false);
    streamingIdRef.current = null;
  };

  // ── Approval handlers ──
  const handleApprove = useCallback(
    (actionId: string) => {
      // Mark the approval card as approved
      setMessages((prev) =>
        prev.map((m) =>
          m.approval?.action_id === actionId
            ? { ...m, approvalStatus: "approved" as const }
            : m
        )
      );
      // Send approval confirmation as a follow-up message
      const confirmText = `[APPROVED: ${actionId}] Proceed with the action.`;
      // Use a microtask to avoid state conflicts
      setTimeout(() => sendChat(confirmText, true), 50);
    },
    []
  );

  const handleReject = useCallback(
    (actionId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.approval?.action_id === actionId
            ? { ...m, approvalStatus: "rejected" as const }
            : m
        )
      );
      const rejectText = `[REJECTED: ${actionId}] Do not proceed. Suggest alternatives or ask how to adjust.`;
      setTimeout(() => sendChat(rejectText, true), 50);
    },
    []
  );

  // ── Chat mode send ──
  const sendChat = useCallback(
    async (text: string, isSystemAction = false) => {
      setError(null);
      setStreaming(true);

      const userMsgId = crypto.randomUUID();
      const asstMsgId = crypto.randomUUID();
      streamingIdRef.current = asstMsgId;

      // For system actions (approve/reject), don't show the user message bubble
      if (isSystemAction) {
        setMessages((prev) => [
          ...prev,
          { id: asstMsgId, role: "assistant", content: "", streaming: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: text },
          { id: asstMsgId, role: "assistant", content: "", streaming: true },
        ]);
      }

      let fullContent = "";

      await streamChat(
        text,
        role,
        permissionMode,
        historyRef.current,
        (token) => {
          fullContent += token;
          appendToken(asstMsgId, token);
        },
        (approvalReq) => {
          // Insert an approval card message right after the current assistant message
          const approvalMsgId = crypto.randomUUID();
          setMessages((prev) => [
            ...prev,
            {
              id: approvalMsgId,
              role: "assistant",
              content: "",
              type: "approval",
              approval: approvalReq,
            },
          ]);
        },
        () => finalize(asstMsgId, text, fullContent),
        (err) => {
          setError(err);
          setMessages((prev) => prev.filter((m) => m.id !== asstMsgId));
          setStreaming(false);
          streamingIdRef.current = null;
        }
      );
    },
    [role, permissionMode]
  );

  // ── Pipeline mode send ──
  const sendPipeline = useCallback(
    async (text: string) => {
      setError(null);
      setStreaming(true);
      setShowDag(false);
      setDagPlan(null);
      setDagRunId(null);
      setDagStatus("running");

      const userMsgId = crypto.randomUUID();
      const asstMsgId = crypto.randomUUID();
      streamingIdRef.current = asstMsgId;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text },
        { id: asstMsgId, role: "assistant", content: "", streaming: true },
      ]);

      let fullContent = "";

      await streamPipeline(
        text,
        role,
        historyRef.current,
        (event) => {
          switch (event.type) {
            case "token":
              fullContent += event.token ?? "";
              appendToken(asstMsgId, event.token ?? "");
              break;

            case "dag_plan": {
              // Finalize the streaming manager message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstMsgId ? { ...m, streaming: false } : m
                )
              );

              // Set up DAG visualization
              const plan = event.plan!;
              const nodesWithStatus: DagNode[] = plan.nodes.map((n: any) => ({
                ...n,
                status: "pending" as const,
                depends_on: n.depends_on ?? [],
                sub_steps:
                  n.agent_type === "ContentCreator_Agent"
                    ? buildContentCreatorSubSteps({
                        ...n,
                        status: "pending",
                      })
                    : undefined,
              }));

              const enrichedPlan: DagPlan = { ...plan, nodes: nodesWithStatus };
              setDagPlan(enrichedPlan);
              setDagRunId(event.run_id ?? null);
              setShowDag(true);
              break;
            }

            case "dag_executing": {
              // Mark all root nodes as running
              setDagPlan((prev) => {
                if (!prev) return prev;
                const updated = prev.nodes.map((n) => {
                  if (n.depends_on.length === 0) {
                    const node = { ...n, status: "running" as const };
                    if (n.agent_type === "ContentCreator_Agent") {
                      node.sub_steps = buildContentCreatorSubSteps(node);
                    }
                    return node;
                  }
                  return n;
                });
                return { ...prev, nodes: updated };
              });

              // Add status message to chat
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: "DAG execution started. Watch the pipeline below.",
                  type: "pipeline_status",
                },
              ]);
              break;
            }

            case "dag_result": {
              const resultStatus = event.status as
                | "complete"
                | "partial"
                | "failed";
              setDagStatus(resultStatus);

              // Mark all nodes as complete (simplified — real polling would update each)
              setDagPlan((prev) => {
                if (!prev) return prev;
                const updated = prev.nodes.map((n) => {
                  const node = {
                    ...n,
                    status: (resultStatus === "failed"
                      ? "failed"
                      : n.status === "pending"
                        ? "stub"
                        : "complete") as any,
                  };
                  if (n.agent_type === "ContentCreator_Agent") {
                    node.sub_steps = buildContentCreatorSubSteps(node);
                  }
                  return node;
                });
                return { ...prev, nodes: updated };
              });

              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content:
                    resultStatus === "complete"
                      ? `Pipeline complete. Campaign "${event.campaign_name}" executed successfully.`
                      : resultStatus === "partial"
                        ? `Pipeline partially complete. Some agents encountered issues.`
                        : `Pipeline failed. Check the DAG visualizer for details.`,
                  type: "pipeline_status",
                },
              ]);
              break;
            }

            case "dag_error": {
              setDagStatus("failed");
              setError(event.error ?? "DAG execution failed");
              break;
            }

            case "state_resolved": {
              if (event.state === "clarifying") {
                // Manager pushed back — just finalize the chat message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, streaming: false } : m
                  )
                );
              }
              break;
            }

            case "done": {
              setStreaming(false);
              streamingIdRef.current = null;

              // Save history
              historyRef.current = [
                ...historyRef.current,
                { role: "user", content: text },
                { role: "assistant", content: fullContent },
              ];
              break;
            }
          }
        },
        (err) => {
          setError(err);
          setMessages((prev) => prev.filter((m) => m.id !== asstMsgId));
          setStreaming(false);
          streamingIdRef.current = null;
        }
      );
    },
    [role]
  );

  // ── Unified send ──
  const send = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? input).trim();
    if (!text || streaming) return;
    setInput("");

    if (mode === "pipeline") {
      await sendPipeline(text);
    } else {
      await sendChat(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header — minimal Claude chrome */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="hidden text-[18px] font-medium tracking-[-0.01em] text-text-primary sm:block">
            Co-Pilot
          </h1>
          <span className="hidden font-display text-[18px] text-text-muted sm:block">
            workspace
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "hidden items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] sm:inline-flex",
              mode === "pipeline" ? "text-accent" : "text-text-secondary",
            )}
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                mode === "pipeline" ? "bg-accent" : "bg-success",
              )}
            />
            {mode === "pipeline" ? "Pipeline · running" : "Active"}
          </span>
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6">
        {messages.length === 0 && !showDag ? (
          <EmptyState onPrompt={(p) => send(p)} mode={mode} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3 md:gap-4">
            {/* Chat messages + approval cards */}
            {messages.map((msg) =>
              msg.type === "approval" && msg.approval ? (
                <ApprovalCard
                  key={msg.id}
                  request={msg.approval}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  resolved={msg.approvalStatus}
                />
              ) : (
                <MessageBubble key={msg.id} msg={msg} />
              )
            )}

            {/* DAG Visualizer — mounts when pipeline compiles */}
            {showDag && dagPlan && (
              <div className="mt-2">
                <DagVisualizer
                  plan={dagPlan}
                  runId={dagRunId}
                  dagStatus={dagStatus}
                />
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="rounded-lg bg-error/10 px-4 py-3 text-[13px] text-error ring-1 ring-error/30">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — Claude-style: textarea on top, tool toolbar below */}
      <div className="sticky bottom-0 shrink-0 bg-gradient-to-b from-transparent via-bg-primary/80 to-bg-primary px-3 pt-6 pb-4 pb-safe md:px-6 md:pt-8 md:pb-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-border bg-bg-elevated shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.06)] transition-all duration-200 focus-within:border-border-hover focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_18px_44px_-12px_rgba(0,0,0,0.08)]">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder={
                mode === "pipeline"
                  ? "Describe a campaign to execute…"
                  : "Reply to Co-Pilot…"
              }
              className="block min-h-[28px] w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed text-text-primary placeholder-text-muted outline-none disabled:opacity-50"
            />

            {/* Toolbar — pills LEFT, send RIGHT */}
            <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-2.5 md:px-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <ModePill mode={mode} onChange={setMode} disabled={streaming} />
                <PermissionPill
                  mode={permissionMode}
                  onChange={setPermissionMode}
                  disabled={streaming}
                />
                <RolePill role={role} onChange={setRole} disabled={streaming} />
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                aria-label="Send message"
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                  input.trim() && !streaming
                    ? "bg-text-primary text-bg-primary hover:scale-[1.03] active:scale-[0.97]"
                    : "bg-bg-secondary text-text-muted",
                )}
              >
                {streaming ? (
                  <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                ) : mode === "pipeline" ? (
                  <Rocket size={14} strokeWidth={2.4} />
                ) : (
                  <Send size={14} strokeWidth={2.4} />
                )}
              </button>
            </div>
          </div>

          <p className="mt-3 hidden text-center font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted md:block">
            Shift+Enter new line · Enter send
            {mode === "pipeline" && (
              <span className="text-accent">
                {" "}
                · Manager Agent assesses before executing
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
