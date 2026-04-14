"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import {
  Check,
  Loader2,
  AlertTriangle,
  Clock,
  Eye,
  Image,
  Video,
  Sparkles,
  Search,
  FileText,
  Megaphone,
  PenTool,
  Camera,
  Users,
  Brain,
  ChevronRight,
  Zap,
  ArrowDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type NodeStatus = "pending" | "running" | "complete" | "failed" | "stub";

export interface DagSubStep {
  id: string;
  label: string;
  status: NodeStatus;
  detail?: string;
}

export interface DagNode {
  node_id: string;
  agent_type: string;
  status: NodeStatus;
  depends_on: string[];
  brief?: Record<string, unknown>;
  output?: Record<string, unknown>;
  sub_steps?: DagSubStep[];
}

export interface DagPlan {
  strategic_thesis: string;
  campaign_name: string;
  target_platforms: string[];
  nodes: DagNode[];
}

export interface DagVisualizerProps {
  plan: DagPlan;
  runId: string | null;
  dagStatus: "running" | "complete" | "partial" | "failed";
}

// ─────────────────────────────────────────────────────────────────────
// Agent metadata — icons, labels, colors
// ─────────────────────────────────────────────────────────────────────

const AGENT_META: Record<
  string,
  { icon: typeof Brain; label: string; color: string; ringColor: string }
> = {
  Intelligence_Agent: {
    icon: Search,
    label: "Intelligence",
    color: "text-blue-400",
    ringColor: "ring-blue-500/50",
  },
  ProductManager_Agent: {
    icon: Megaphone,
    label: "Product Manager",
    color: "text-purple-400",
    ringColor: "ring-purple-500/50",
  },
  Copywriter_Agent: {
    icon: PenTool,
    label: "Copywriter",
    color: "text-emerald-400",
    ringColor: "ring-emerald-500/50",
  },
  ContentCreator_Agent: {
    icon: Camera,
    label: "Content Creator",
    color: "text-amber-400",
    ringColor: "ring-amber-500/50",
  },
  UGC_Creator_Agent: {
    icon: Users,
    label: "UGC Creator",
    color: "text-pink-400",
    ringColor: "ring-pink-500/50",
  },
};

const DEFAULT_META = {
  icon: Brain,
  label: "Agent",
  color: "text-text-muted",
  ringColor: "ring-border",
};

// ─────────────────────────────────────────────────────────────────────
// Status indicator
// ─────────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: NodeStatus }) {
  switch (status) {
    case "complete":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
          <Check size={12} strokeWidth={3} className="text-success" />
        </div>
      );
    case "running":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20">
          <Loader2
            size={12}
            strokeWidth={2.5}
            className="animate-spin text-blue-400"
          />
        </div>
      );
    case "failed":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-error/20">
          <AlertTriangle size={12} strokeWidth={2.5} className="text-error" />
        </div>
      );
    case "stub":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-dim">
          <Sparkles size={12} strokeWidth={2} className="text-accent" />
        </div>
      );
    default:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-active">
          <Clock size={12} strokeWidth={2} className="text-text-muted" />
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Sub-step row (ContentCreator micro-steps)
// ─────────────────────────────────────────────────────────────────────

function SubStepRow({ step }: { step: DagSubStep }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12px] transition-all",
        step.status === "running" && "bg-blue-500/5",
        step.status === "complete" && "bg-success/5",
        step.status === "failed" && "bg-error/5"
      )}
    >
      <StatusIcon status={step.status} />
      <span
        className={clsx(
          "font-medium",
          step.status === "pending" ? "text-text-muted" : "text-text-secondary"
        )}
      >
        {step.label}
      </span>
      {step.detail && (
        <span className="ml-auto font-mono text-[11px] text-text-muted">
          {step.detail}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Output preview — shows result snippets
// ─────────────────────────────────────────────────────────────────────

function OutputPreview({ output, agentType }: { output: Record<string, unknown>; agentType: string }) {
  if (agentType === "ContentCreator_Agent") {
    const anchorUrl = output.anchor_frame_url as string | undefined;
    const videoUrl = output.video_url as string | undefined;
    const provider = output.video_provider as string | undefined;
    const attempts = output.vision_check_attempts as number | undefined;

    return (
      <div className="mt-2 flex flex-col gap-2">
        {anchorUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-bg-primary/60 px-3 py-2 ring-1 ring-border">
            <Image size={12} className="shrink-0 text-amber-400" />
            <span className="truncate font-mono text-[11px] text-text-muted">
              Anchor frame ready
            </span>
            {attempts !== undefined && (
              <span className="ml-auto text-[10px] text-text-muted">
                {attempts} attempt{attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
        {videoUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-bg-primary/60 px-3 py-2 ring-1 ring-border">
            <Video size={12} className="shrink-0 text-emerald-400" />
            <span className="truncate font-mono text-[11px] text-text-muted">
              {provider === "veo" ? "Veo 3.1" : "Kling 2.1"} video rendered
            </span>
          </div>
        )}
      </div>
    );
  }

  // Generic output preview — show first meaningful value
  const preview = output.output ?? output.message ?? output;
  const previewStr =
    typeof preview === "string"
      ? preview
      : JSON.stringify(preview, null, 0);

  return (
    <div className="mt-2 rounded-lg bg-bg-primary/60 px-3 py-2 ring-1 ring-border">
      <p className="line-clamp-2 font-mono text-[11px] leading-relaxed text-text-muted">
        {previewStr.slice(0, 200)}
        {previewStr.length > 200 ? "…" : ""}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Single DAG node card
// ─────────────────────────────────────────────────────────────────────

function NodeCard({ node }: { node: DagNode }) {
  const meta = AGENT_META[node.agent_type] ?? DEFAULT_META;
  const Icon = meta.icon;

  const isRunning = node.status === "running";
  const isComplete = node.status === "complete" || node.status === "stub";
  const isFailed = node.status === "failed";

  return (
    <div
      className={clsx(
        "relative rounded-xl border bg-bg-secondary p-4 transition-all duration-500",
        isRunning && "border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.08)]",
        isComplete && "border-success/30",
        isFailed && "border-error/30",
        !isRunning && !isComplete && !isFailed && "border-border opacity-50"
      )}
    >
      {/* Animated border glow for running state */}
      {isRunning && (
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-blue-500/30 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-all",
            isRunning && "bg-blue-500/10 ring-blue-500/30",
            isComplete && "bg-success/10 ring-success/30",
            isFailed && "bg-error/10 ring-error/30",
            !isRunning && !isComplete && !isFailed && "bg-bg-tertiary ring-border"
          )}
        >
          <Icon
            size={16}
            strokeWidth={1.8}
            className={clsx(
              isRunning || isComplete || isFailed ? meta.color : "text-text-muted"
            )}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={clsx(
                "text-[13px] font-semibold",
                node.status === "pending"
                  ? "text-text-muted"
                  : "text-text-primary"
              )}
            >
              {meta.label}
            </h3>
            <StatusIcon status={node.status} />
          </div>
          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-text-muted">
            {node.node_id}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={clsx(
            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            node.status === "running" &&
              "bg-blue-500/10 text-blue-400",
            node.status === "complete" &&
              "bg-success/10 text-success",
            node.status === "failed" &&
              "bg-error/10 text-error",
            node.status === "stub" &&
              "bg-accent-dim text-accent",
            node.status === "pending" &&
              "bg-bg-tertiary text-text-muted"
          )}
        >
          {node.status}
        </span>
      </div>

      {/* ContentCreator sub-steps */}
      {node.agent_type === "ContentCreator_Agent" &&
        node.sub_steps &&
        node.sub_steps.length > 0 && (
          <div className="mt-3 flex flex-col gap-1 border-t border-border/50 pt-3">
            {node.sub_steps.map((step) => (
              <SubStepRow key={step.id} step={step} />
            ))}
          </div>
        )}

      {/* Output preview */}
      {isComplete && node.output && (
        <OutputPreview output={node.output} agentType={node.agent_type} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Layer separator — shows parallel execution grouping
// ─────────────────────────────────────────────────────────────────────

function LayerConnector({ layerIndex }: { layerIndex: number }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex items-center gap-2 text-text-muted">
        <div className="h-4 w-px bg-border" />
        <ArrowDown size={12} strokeWidth={2} className="text-border-hover" />
        <div className="h-4 w-px bg-border" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Group nodes into topo layers (mirrors Python _topo_layers)
// ─────────────────────────────────────────────────────────────────────

function topoLayers(nodes: DagNode[]): DagNode[][] {
  const nodeMap = new Map(nodes.map((n) => [n.node_id, n]));
  const completed = new Set<string>();
  const remaining = new Set(nodeMap.keys());
  const layers: DagNode[][] = [];

  while (remaining.size > 0) {
    const ready: DagNode[] = [];
    for (const nid of remaining) {
      const node = nodeMap.get(nid)!;
      const deps = new Set(node.depends_on || []);
      let allSatisfied = true;
      for (const d of deps) {
        if (!completed.has(d)) {
          allSatisfied = false;
          break;
        }
      }
      if (allSatisfied) ready.push(node);
    }

    if (ready.length === 0) {
      // Circular — force remaining
      for (const nid of remaining) ready.push(nodeMap.get(nid)!);
      remaining.clear();
    }

    for (const node of ready) {
      remaining.delete(node.node_id);
      completed.add(node.node_id);
    }

    layers.push(ready);
  }

  return layers;
}

// ─────────────────────────────────────────────────────────────────────
// Pipeline header — thesis + campaign + status
// ─────────────────────────────────────────────────────────────────────

function PipelineHeader({
  plan,
  dagStatus,
}: {
  plan: DagPlan;
  dagStatus: DagVisualizerProps["dagStatus"];
}) {
  const completedCount = plan.nodes.filter(
    (n) => n.status === "complete" || n.status === "stub"
  ).length;
  const totalCount = plan.nodes.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 md:p-5">
      {/* Campaign + Status */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap size={14} strokeWidth={2.5} className="text-accent" />
            <h2 className="text-[14px] font-bold text-text-primary md:text-[15px]">
              {plan.campaign_name}
            </h2>
          </div>
          <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-text-secondary md:text-[13px]">
            {plan.strategic_thesis}
          </p>
        </div>

        <span
          className={clsx(
            "self-start shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
            dagStatus === "running" && "bg-blue-500/10 text-blue-400",
            dagStatus === "complete" && "bg-success/10 text-success",
            dagStatus === "partial" && "bg-warning/10 text-warning",
            dagStatus === "failed" && "bg-error/10 text-error"
          )}
        >
          {dagStatus === "running" ? "Executing" : dagStatus}
        </span>
      </div>

      {/* Platforms */}
      <div className="mt-3 flex items-center gap-2">
        {plan.target_platforms.map((p) => (
          <span
            key={p}
            className="rounded-md bg-bg-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted ring-1 ring-border"
          >
            {p}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-text-muted">
            Pipeline Progress
          </span>
          <span className="font-mono text-text-muted">
            {completedCount}/{totalCount} nodes
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-700 ease-out",
              dagStatus === "failed"
                ? "bg-error"
                : dagStatus === "complete"
                  ? "bg-success"
                  : "bg-accent"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main DagVisualizer
// ─────────────────────────────────────────────────────────────────────

export default function DagVisualizer({
  plan,
  runId,
  dagStatus,
}: DagVisualizerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when nodes change status
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [plan.nodes]);

  const layers = topoLayers(plan.nodes);

  return (
    <div className="flex flex-col gap-3 px-0 py-3 md:gap-4 md:px-2 md:py-4">
      {/* Pipeline header */}
      <PipelineHeader plan={plan} dagStatus={dagStatus} />

      {/* Run ID */}
      {runId && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
            Run
          </span>
          <span className="font-mono text-[10px] text-text-muted/60">
            {runId}
          </span>
        </div>
      )}

      {/* DAG layers */}
      {layers.map((layer, layerIdx) => (
        <div key={layerIdx}>
          {layerIdx > 0 && <LayerConnector layerIndex={layerIdx} />}

          {/* Layer label */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">
              Layer {layerIdx}
            </span>
            {layer.length > 1 && (
              <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[9px] font-semibold text-text-muted ring-1 ring-border">
                Parallel ×{layer.length}
              </span>
            )}
          </div>

          {/* Node cards — grid for parallel, stack for single */}
          <div
            className={clsx(
              "gap-3",
              layer.length > 1
                ? "grid grid-cols-1 sm:grid-cols-2"
                : "flex flex-col"
            )}
          >
            {layer.map((node) => (
              <NodeCard key={node.node_id} node={node} />
            ))}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
