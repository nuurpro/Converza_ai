"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ArrowUpRight,
  Search,
  PenLine,
  Calendar,
  TrendingUp,
  Sparkles,
  Eye,
  Wallet,
  Crosshair,
  Send,
  ShieldCheck,
  ListFilter,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Data — replace with API once swarm telemetry is wired up
// ─────────────────────────────────────────────────────────────────────

interface LedgerEvent {
  id: number;
  time: string;
  agent: string;
  action: string;
  icon: typeof Check;
  live?: boolean;
}

const ledger: LedgerEvent[] = [
  {
    id: 1,
    time: "10:42 AM",
    agent: "Top of Funnel",
    action:
      "Scraped 45 new leads from Instagram following the Q3 launch hashtags.",
    icon: Search,
    live: true,
  },
  {
    id: 2,
    time: "10:38 AM",
    agent: "Copywriter",
    action:
      "Generated 6 hook variants for the Summer Drop reel campaign.",
    icon: PenLine,
  },
  {
    id: 3,
    time: "10:31 AM",
    agent: "Scheduler",
    action:
      "Queued 3 posts for Tuesday peak hours · 9:14 AM, 1:00 PM, 6:30 PM US-East.",
    icon: Calendar,
  },
  {
    id: 4,
    time: "10:24 AM",
    agent: "Analytics",
    action:
      "Flagged a 12% CPM drop on TikTok since 09:00 — auto-pausing the lowest-ROAS variants.",
    icon: TrendingUp,
  },
  {
    id: 5,
    time: "10:18 AM",
    agent: "Brand Voice",
    action:
      "Rejected ad-copy variant 7 — off-tone for Osman Skincare voice. Sent back for rewrite.",
    icon: Sparkles,
  },
  {
    id: 6,
    time: "10:09 AM",
    agent: "Vision Check",
    action: "Approved anchor frame for Reel #18, dispatching to render queue.",
    icon: Eye,
  },
  {
    id: 7,
    time: "09:55 AM",
    agent: "BudgetBrain",
    action:
      "Re-allocated $80 from paused 'Cold Audience v2' to 'Summer Drop' (CPA threshold met).",
    icon: Wallet,
  },
  {
    id: 8,
    time: "09:42 AM",
    agent: "Competitor Scout",
    action:
      "Detected Nike's new SS26 acquisition campaign — added to watchlist with weekly digest cadence.",
    icon: Crosshair,
  },
  {
    id: 9,
    time: "09:31 AM",
    agent: "Digest",
    action: "Morning summary delivered to nodir@converza.ai.",
    icon: Send,
  },
];

interface Approval {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  impact: string;
}

const initialApprovals: Approval[] = [
  {
    id: "ap-1",
    eyebrow: "Budget · 2 min ago",
    title: "Deploy $50 to the winning Meta variant",
    body: "Variant B is running at 4.2× ROAS over 200 impressions, $1.40 CPA. The increase is capped at $50 over 24h and will pause if ROAS drops below 2.5×.",
    impact: "+$2,800 projected weekly revenue",
  },
  {
    id: "ap-2",
    eyebrow: "Creative · 6 min ago",
    title: "Schedule Reel #14 for Tuesday 9:14 AM",
    body: "Hook test for the Summer Drop campaign cleared brand voice and vision. Posts to TikTok US, Instagram Reels US, and Meta retargeting on the same slot.",
    impact: "Earliest peak slot · Tuesday morning",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);

  function resolve(id: string) {
    setApprovals((arr) => arr.filter((a) => a.id !== id));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header — quiet, no chat input nostalgia */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            Dashboard
          </h1>
          <span className="hidden text-[13.5px] text-text-muted sm:block">
            mission control
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-success/15 bg-success-dim px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-success sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      </header>

      {/* Body — 60 / 40 split */}
      <div className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-10 md:grid-cols-[3fr_2fr] md:gap-14 md:px-10 md:py-14">

          {/* ── Column 1: Swarm Ledger ── */}
          <section>
            <header className="mb-7 flex items-baseline justify-between">
              <div>
                <h2 className="text-[15px] font-medium tracking-[-0.005em] text-text-primary">
                  The Swarm Ledger
                </h2>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
                  Live · {ledger.length} events today
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary transition-colors hover:text-text-primary">
                <ListFilter size={12} strokeWidth={1.8} />
                Filter
              </button>
            </header>

            <ol className="relative space-y-1">
              {/* 1px hairline rail */}
              <span
                aria-hidden
                className="absolute left-[7px] top-3 bottom-3 w-px bg-border"
              />
              {ledger.map((event, i) => (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.04 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group relative flex items-start gap-4 rounded-lg py-2.5 pl-5 pr-3 transition-colors hover:bg-bg-hover"
                >
                  {/* Dot on rail */}
                  <span
                    className={`absolute left-[2px] top-3.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-bg-primary ${
                      event.live ? "bg-bg-elevated" : "bg-bg-elevated"
                    }`}
                  >
                    {event.live ? (
                      <>
                        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-accent/40" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      </>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-text-muted/45" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] tabular-nums text-text-muted">
                        {event.time}
                      </span>
                      <span className="text-[12.5px] font-medium tracking-[-0.005em] text-text-primary">
                        {event.agent}
                      </span>
                      <event.icon
                        size={11}
                        strokeWidth={1.6}
                        className="text-text-muted/80"
                      />
                    </div>
                    <p className="mt-1 max-w-[60ch] text-[13.5px] leading-[1.55] text-text-secondary">
                      {event.action}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </section>

          {/* ── Column 2: Approval queue ── */}
          <section>
            <header className="mb-7 flex items-baseline justify-between">
              <div>
                <h2 className="text-[15px] font-medium tracking-[-0.005em] text-text-primary">
                  Approval queue
                </h2>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
                  {approvals.length === 0
                    ? "Caught up"
                    : `${approvals.length} waiting on you`}
                </p>
              </div>
            </header>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {approvals.map((ap, i) => (
                  <motion.article
                    key={ap.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.985 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.05 * i + 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_28px_-14px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.03),0_18px_36px_-14px_rgba(0,0,0,0.12)]"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                      {ap.eyebrow}
                    </p>
                    <h3 className="mt-2 text-[15.5px] font-medium leading-snug tracking-[-0.005em] text-text-primary">
                      {ap.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-[1.6] text-text-secondary">
                      {ap.body}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success">
                      <ArrowUpRight size={11} strokeWidth={2.2} />
                      {ap.impact}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <button className="text-[12px] text-text-secondary transition-colors hover:text-text-primary">
                        More context →
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolve(ap.id)}
                          className="rounded-full border border-border bg-bg-elevated px-4 py-1.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => resolve(ap.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-1.5 text-[12.5px] font-medium text-bg-elevated transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
                        >
                          <Check size={11} strokeWidth={2.6} />
                          Approve
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              {approvals.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-10 text-center"
                >
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.6}
                    className="mx-auto mb-3 text-text-muted"
                  />
                  <p className="text-[14px] text-text-primary">
                    Caught up.
                  </p>
                  <p className="mt-1 text-[12.5px] text-text-muted">
                    The swarm is shipping autonomously. New approvals will surface here.
                  </p>
                </motion.div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
