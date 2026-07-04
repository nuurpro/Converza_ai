"use client";

import { useState } from "react";
import { Copy, Plus, KeyRound } from "lucide-react";

const tokens = [
  {
    id: "tk_live_4Q",
    label: "Production swarm",
    last4: "··· 4Q9F",
    created: "Mar 18, 2026",
    lastUsed: "12 min ago",
  },
  {
    id: "tk_live_8X",
    label: "Webhook ingestion",
    last4: "··· 8XnL",
    created: "Feb 02, 2026",
    lastUsed: "yesterday",
  },
];

export default function TokensPage() {
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          API tokens
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Personal access tokens for scripts, webhooks, and agent runners. Treat them like passwords.
        </p>
      </header>

      <div className="flex justify-end">
        <button className="group inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-[13px] font-medium text-bg-elevated transition-all hover:scale-[1.02] active:scale-[0.97]">
          <Plus size={13} strokeWidth={2.4} />
          New token
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          <span>Label</span>
          <span>Created</span>
          <span>Last used</span>
          <span></span>
        </div>
        {tokens.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-bg-hover"
          >
            <div>
              <div className="text-[14px] font-medium text-text-primary">{t.label}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <code className="font-mono text-[11px] text-text-muted">
                  {revealed === t.id ? `tk_live_xxxx_${t.last4.slice(-4)}` : t.last4}
                </code>
                <button
                  onClick={() => setRevealed((r) => (r === t.id ? null : t.id))}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary hover:text-text-primary"
                >
                  {revealed === t.id ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
            <span className="text-[13px] text-text-secondary">{t.created}</span>
            <span className="text-[13px] text-text-muted">{t.lastUsed}</span>
            <div className="flex items-center gap-1">
              <button
                aria-label="Copy token"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-active hover:text-text-primary"
              >
                <Copy size={13} strokeWidth={2} />
              </button>
              <button className="text-[12px] font-medium text-text-muted hover:text-error">
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-warning/15 bg-warning-dim/40 p-5">
        <div className="flex items-start gap-3">
          <KeyRound size={16} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-[13px] leading-relaxed text-text-secondary">
            Tokens grant full API access to your workspace. If a token leaks, revoke it
            immediately and rotate any dependent integrations. Converza never displays a
            full token after creation.
          </div>
        </div>
      </div>
    </div>
  );
}
