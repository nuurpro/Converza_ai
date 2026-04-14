"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, ShieldCheck, ShieldOff, FileText, ChevronDown } from "lucide-react";
import clsx from "clsx";

export type PermissionMode = "ask" | "auto" | "plan" | "bypass";

const MODE_CONFIG: Record<
  PermissionMode,
  { label: string; description: string; icon: typeof Shield; color: string; bgColor: string }
> = {
  ask: {
    label: "Ask",
    description: "Pause before executing high-cost actions",
    icon: Shield,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  auto: {
    label: "Auto",
    description: "Execute all actions automatically",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  plan: {
    label: "Plan",
    description: "Show the plan without executing anything",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  bypass: {
    label: "YOLO",
    description: "Skip all safety checks and execute immediately",
    icon: ShieldOff,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
  },
};

export default function PermissionPill({
  mode,
  onChange,
  disabled,
}: {
  mode: PermissionMode;
  onChange: (m: PermissionMode) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = MODE_CONFIG[mode];
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
          "bg-bg-tertiary ring-1 ring-border hover:ring-border-hover",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Icon size={13} strokeWidth={2.5} className={current.color} />
        <span className="hidden text-text-primary sm:inline">{current.label}</span>
        <ChevronDown
          size={11}
          strokeWidth={2.5}
          className={clsx(
            "text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl bg-bg-elevated shadow-2xl ring-1 ring-border">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Permission Mode
            </p>
          </div>
          {(Object.keys(MODE_CONFIG) as PermissionMode[]).map((key) => {
            const cfg = MODE_CONFIG[key];
            const ItemIcon = cfg.icon;
            const isActive = mode === key;

            return (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-accent-dim"
                    : "hover:bg-bg-hover"
                )}
              >
                <div
                  className={clsx(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    isActive ? cfg.bgColor : "bg-bg-tertiary"
                  )}
                >
                  <ItemIcon
                    size={14}
                    strokeWidth={2}
                    className={isActive ? cfg.color : "text-text-muted"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      "text-[13px] font-semibold",
                      isActive ? "text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {cfg.label}
                  </p>
                  <p className="text-[11px] leading-snug text-text-muted">
                    {cfg.description}
                  </p>
                </div>
                {isActive && (
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
