"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Check,
  X,
  Loader2,
  Zap,
  DollarSign,
  Globe,
  Send as SendIcon,
} from "lucide-react";
import clsx from "clsx";

export interface ApprovalRequest {
  action_id: string;
  action_type: "generate" | "scrape" | "publish" | "api_call" | "other";
  title: string;
  description: string;
  estimated_cost?: string;
  platforms?: string[];
  reversible: boolean;
}

const ACTION_ICONS: Record<ApprovalRequest["action_type"], typeof Zap> = {
  generate: Zap,
  scrape: Globe,
  publish: SendIcon,
  api_call: DollarSign,
  other: ShieldAlert,
};

const ACTION_COLORS: Record<ApprovalRequest["action_type"], string> = {
  generate: "text-amber-400",
  scrape: "text-blue-400",
  publish: "text-red-400",
  api_call: "text-purple-400",
  other: "text-text-muted",
};

export default function ApprovalCard({
  request,
  onApprove,
  onReject,
  resolved,
}: {
  request: ApprovalRequest;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  resolved?: "approved" | "rejected";
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const Icon = ACTION_ICONS[request.action_type] ?? ShieldAlert;
  const iconColor = ACTION_COLORS[request.action_type] ?? "text-text-muted";

  const handleApprove = () => {
    setLoading("approve");
    onApprove(request.action_id);
  };

  const handleReject = () => {
    setLoading("reject");
    onReject(request.action_id);
  };

  const isResolved = !!resolved;

  return (
    <div className="flex w-full justify-start gap-3">
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
        <ShieldAlert size={13} className="text-amber-400" strokeWidth={2} />
      </div>

      {/* Card */}
      <div
        className={clsx(
          "max-w-[85%] md:max-w-[75%] overflow-hidden rounded-2xl rounded-tl-sm ring-1",
          isResolved
            ? resolved === "approved"
              ? "bg-emerald-500/5 ring-emerald-500/20"
              : "bg-red-500/5 ring-red-500/20"
            : "bg-bg-elevated ring-amber-500/30"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-2.5">
          <div
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-md",
              isResolved ? "bg-bg-tertiary" : "bg-amber-400/10"
            )}
          >
            <Icon size={12} strokeWidth={2.5} className={isResolved ? "text-text-muted" : iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {request.title}
            </p>
          </div>
          {isResolved && (
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                resolved === "approved"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              )}
            >
              {resolved}
            </span>
          )}
          {!isResolved && !request.reversible && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              Irreversible
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[13px] leading-relaxed text-text-secondary">
            {request.description}
          </p>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2">
            {request.estimated_cost && (
              <span className="flex items-center gap-1 rounded-md bg-bg-tertiary px-2 py-1 text-[11px] font-medium text-text-muted ring-1 ring-border">
                <DollarSign size={10} strokeWidth={2.5} />
                {request.estimated_cost}
              </span>
            )}
            {request.platforms?.map((p) => (
              <span
                key={p}
                className="rounded-md bg-bg-tertiary px-2 py-1 text-[11px] font-medium text-text-muted ring-1 ring-border"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!isResolved && (
          <div className="flex gap-2 border-t border-border/50 px-4 py-3">
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors",
                "bg-bg-tertiary text-text-secondary ring-1 ring-border",
                "hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/30",
                loading !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading === "reject" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <X size={13} strokeWidth={2.5} />
              )}
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors",
                "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
                "hover:bg-emerald-500/25",
                loading !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading === "approve" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} strokeWidth={2.5} />
              )}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
