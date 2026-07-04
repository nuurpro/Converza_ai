"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Plug } from "lucide-react";

const integrations = [
  { id: "shopify", label: "Shopify", note: "Catalog, orders, customer events", connected: true },
  { id: "meta", label: "Meta Ads", note: "Facebook + Instagram ad accounts", connected: true },
  { id: "tiktok", label: "TikTok Ads", note: "Spark Ads + Display & Video 360", connected: false },
  { id: "ga4", label: "GA4", note: "Site analytics + attribution", connected: true },
  { id: "klaviyo", label: "Klaviyo", note: "Email & SMS lifecycle", connected: false },
  { id: "stripe", label: "Stripe", note: "Revenue + refund signals", connected: true },
  { id: "slack", label: "Slack", note: "Approval pings + daily digest", connected: false },
  { id: "google-ads", label: "Google Ads", note: "Search, Performance Max", connected: false },
];

export default function SettingsIntegrationsPage() {
  return (
    <div>
      <div className="mb-10 flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary">
          <Plug size={16} strokeWidth={1.7} />
        </span>
        <div>
          <h2 className="text-[22px] font-medium tracking-[-0.015em] text-text-primary">
            Connect the data the swarm reads from.
          </h2>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-text-secondary">
            Each integration unlocks a different agent. More connected sources mean sharper decisions.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        {integrations.map((int, i) => (
          <motion.div
            key={int.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.04 * i,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group flex items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-bg-hover"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-secondary font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              {int.label.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium tracking-[-0.005em] text-text-primary">
                {int.label}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-text-muted">
                {int.note}
              </div>
            </div>
            {int.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success-dim px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-success">
                <Check size={10} strokeWidth={2.6} />
                Connected
              </span>
            ) : (
              <button className="rounded-full bg-text-primary px-4 py-1.5 text-[12px] font-medium text-bg-elevated transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]">
                Connect
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-[12.5px] leading-relaxed text-text-muted">
        Don&apos;t see what you need?{" "}
        <Link href="mailto:integrations@converza.ai" className="text-text-primary underline-offset-2 hover:underline">
          Tell us
        </Link>{" "}
        — we ship new connectors weekly.
      </p>
    </div>
  );
}
