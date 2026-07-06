"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

const roles = [
  { id: "strategist", label: "Strategist", hint: "Co-Pilot conversations + plan compilation" },
  { id: "copywriter", label: "Copywriter", hint: "Hooks, captions, ad variants" },
  { id: "video", label: "Video editor", hint: "Cut sequencing + B-roll selection" },
  { id: "analyst", label: "Analyst", hint: "BudgetBrain, performance reads" },
];

const models = [
  {
    id: "openai/gpt-oss-20b",
    label: "OpenAI GPT-OSS 20B",
    tag: "Default",
    speed: "~1000 t/s",
    context: "131k ctx",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "OpenAI GPT-OSS 120B",
    tag: "Deep reasoning",
    speed: "~500 t/s",
    context: "131k ctx",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B Versatile",
    tag: "General",
    speed: "~280 t/s",
    context: "131k ctx",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    tag: "Fast bulk",
    speed: "~560 t/s",
    context: "131k ctx",
  },
];

export default function ModelsPage() {
  const [picks, setPicks] = useState<Record<string, string>>({
    strategist: "openai/gpt-oss-120b",
    copywriter: "openai/gpt-oss-20b",
    video: "openai/gpt-oss-20b",
    analyst: "openai/gpt-oss-120b",
  });

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Models
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Default Groq model per role. Pick the smallest model that still does the job, the swarm runs faster and cheaper.
        </p>
      </header>

      {roles.map((role) => (
        <div key={role.id} className="grid grid-cols-1 gap-4 border-b border-border pb-8 last:border-b-0 md:grid-cols-[1fr_1.6fr] md:gap-10">
          <div>
            <div className="text-[14px] font-medium text-text-primary">{role.label}</div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
              {role.hint}
            </div>
          </div>
          <div className="space-y-2">
            {models.map((model) => {
              const active = picks[role.id] === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() =>
                    setPicks((p) => ({ ...p, [role.id]: model.id }))
                  }
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    active
                      ? "border-text-primary bg-bg-elevated shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      : "border-border bg-bg-elevated hover:border-border-hover",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      active
                        ? "border-text-primary bg-text-primary text-bg-elevated"
                        : "border-border",
                    )}
                  >
                    {active && <Check size={11} strokeWidth={2.6} />}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[14px] font-medium text-text-primary">
                        {model.label}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                        {model.tag}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-text-muted">
                      {model.id}
                    </div>
                  </div>
                  <span className="text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
                    {model.speed} · {model.context}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
