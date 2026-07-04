"use client";

import { Trash2 } from "lucide-react";

const memories = [
  {
    id: "m-1",
    text: "Brand voice: direct, confident, warm. Avoid 'unleash', 'seamless', 'elevate'.",
    source: "Brand passport",
    when: "Auto",
  },
  {
    id: "m-2",
    text: "User prefers Reels-first creative for US market, TikTok-first for UAE.",
    source: "Co-Pilot · 14 Mar",
    when: "6 weeks ago",
  },
  {
    id: "m-3",
    text: "Ad budget cap: $200/day per channel. Pause auto-triggers above CPA $14.",
    source: "BudgetBrain",
    when: "12 days ago",
  },
  {
    id: "m-4",
    text: "Always credit photographer @askar.io on Instagram brand posts.",
    source: "Co-Pilot · 02 Apr",
    when: "26 days ago",
  },
];

export default function MemoryPage() {
  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Agent memory
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          What the swarm remembers between threads. Edit, prune, or wipe — the agents pick up the change on the next run.
        </p>
      </header>

      <div className="space-y-3">
        {memories.map((m) => (
          <div
            key={m.id}
            className="group flex items-start gap-4 rounded-xl border border-border bg-bg-elevated p-4 transition-colors hover:border-border-hover"
          >
            <div className="flex-1">
              <p className="text-[14px] leading-relaxed text-text-primary">
                {m.text}
              </p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                <span>{m.source}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-text-muted" />
                <span>{m.when}</span>
              </div>
            </div>
            <button
              aria-label="Forget this"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {memories.length} memories · 2.4 KB
        </span>
        <button className="text-[12.5px] font-medium text-error hover:underline">
          Wipe all memory
        </button>
      </div>
    </div>
  );
}
