"use client";

import { useEffect, useState } from "react";

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

export default function BrandPage() {
  const [brandName, setBrandName] = useState("Osman Skincare");
  const [voice, setVoice] = useState("Direct, confident, warm. Speaks like a founder who built it themselves.");
  const [audience, setAudience] = useState(
    "DTC operators in the CIS selling premium skincare into the US and UAE.",
  );
  const [promise, setPromise] = useState("3 products in 1 bottle. No clutter on the bathroom shelf.");
  const [markets, setMarkets] = useState(["US", "UAE"]);
  const [newMarket, setNewMarket] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(BRAND_NAME_STORAGE_KEY)?.trim();
    if (stored) setBrandName(stored);
  }, []);

  useEffect(() => {
    const normalized = brandName.trim();
    if (normalized) {
      window.localStorage.setItem(BRAND_NAME_STORAGE_KEY, normalized);
      window.dispatchEvent(new Event("converza:brand-name-updated"));
    }
  }, [brandName]);

  function addMarket() {
    const v = newMarket.trim();
    if (!v) return;
    setMarkets((m) => [...m, v]);
    setNewMarket("");
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Brand passport
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          The single source of truth the swarm reads before generating anything. Captured once, reused on every run.
        </p>
      </header>

      <Field label="Brand name" hint="Shown in the sidebar and used as the workspace identity.">
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Voice & tone" hint="Three to five adjectives. The way the brand sounds in writing.">
        <textarea
          rows={2}
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Audience" hint="The buyer in one sentence — who they are, what they want.">
        <textarea
          rows={2}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Core promise" hint="What the brand actually delivers — the line on the box.">
        <input
          value={promise}
          onChange={(e) => setPromise(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
        />
      </Field>

      <Field label="Markets" hint="Where the ads should run. Each market gets its own copy register.">
        <div className="flex flex-wrap items-center gap-2">
          {markets.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-primary"
            >
              {m}
              <button
                onClick={() => setMarkets((arr) => arr.filter((x) => x !== m))}
                className="text-text-muted hover:text-error"
                aria-label={`Remove ${m}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            placeholder="Add market…"
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMarket()}
            className="rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary outline-none placeholder-text-muted/70 focus:border-text-primary"
          />
        </div>
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Auto-saved · syncs to all swarm nodes
        </span>
        <button className="rounded-full bg-text-primary px-5 py-2.5 text-[13.5px] font-medium text-bg-elevated transition-all hover:scale-[1.02] active:scale-[0.97]">
          Save changes
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.6fr] md:gap-10">
      <div>
        <div className="text-[14px] font-medium text-text-primary">{label}</div>
        {hint && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
