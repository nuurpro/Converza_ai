"use client";

import { useEffect, useState } from "react";
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
import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/workspace/AgentWorkspace";
import { getDashboardStats, type DashboardStat, type SquadMessageData } from "@/lib/data/workspace";
import {
  createSquadEventSource,
  fetchDashboardStats,
  isHitlDecisionMessage,
  mapSquadMessage,
  parseSquadStreamEvent,
  resolveHitlDraft,
  type AgentRunStepRow,
} from "@/lib/api/workspace";

interface LedgerEvent {
  id: string;
  time: string;
  agent: string;
  action: string;
  icon: LucideIcon;
  live?: boolean;
}

interface Approval {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  impact: string;
}

const agentLabels: Record<string, string> = {
  milo: "Milo",
  sleyz: "Sleyz",
  vea: "Vea",
};

const agentIcons: Record<string, LucideIcon> = {
  milo: PenLine,
  sleyz: Send,
  vea: Eye,
};

function formatTime(value?: string) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ledgerEventFromStep(row: AgentRunStepRow): LedgerEvent {
  const detail = row.detail ? ` — ${row.detail}` : "";
  const status =
    row.step_status === "started"
      ? "Started"
      : row.step_status === "completed"
        ? "Finished"
        : row.step_status === "failed"
          ? "Failed"
          : row.step_status;

  return {
    id: row.id,
    time: formatTime(row.created_at),
    agent: agentLabels[row.agent_slug] ?? row.agent_slug,
    action: `${status} ${row.step_label.toLowerCase()}${detail}`,
    icon: row.step_status === "failed" ? ShieldCheck : agentIcons[row.agent_slug] ?? Sparkles,
    live: row.step_status === "started",
  };
}

function approvalFromMessage(message: SquadMessageData): Approval | null {
  if (!message.hitlCard || message.hitlCard.status !== "pending") return null;

  return {
    id: message.hitlCard.id,
    eyebrow: `${message.sender} · ${message.timestamp}`,
    title: message.text.includes("Video")
      ? "Review generated video asset"
      : "Review agent draft",
    body: message.hitlCard.content,
    impact: "Human approval required before release",
  };
}

export default function DashboardPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>(() => getDashboardStats());

  useEffect(() => {
    void fetchDashboardStats().then(setStats).catch(() => undefined);

    const source = createSquadEventSource();
    source.onmessage = (event) => {
      const payload = parseSquadStreamEvent(event.data);
      if (!payload || payload.type === "error") return;

      if (payload.type === "agent_run_step") {
        const next = ledgerEventFromStep(payload.row);
        setLedger((current) => {
          if (current.some((item) => item.id === next.id)) return current;
          return [next, ...current].slice(0, 9);
        });
      }

      if (payload.type === "squad_message") {
        const message = mapSquadMessage(payload.row);
        if (isHitlDecisionMessage(message) && message.hitlCard) {
          setApprovals((current) =>
            current.filter((approval) => approval.id !== message.hitlCard!.id),
          );
          void fetchDashboardStats().then(setStats).catch(() => undefined);
          return;
        }

        const approval = approvalFromMessage(message);
        if (approval) {
          setApprovals((current) => {
            if (current.some((item) => item.id === approval.id)) return current;
            return [approval, ...current];
          });
        }
      }
    };

    return () => source.close();
  }, []);

  async function resolve(id: string, action: "approve" | "reject") {
    await resolveHitlDraft(id, action);
    setApprovals((arr) => arr.filter((a) => a.id !== id));
    void fetchDashboardStats().then(setStats).catch(() => undefined);
  }

  return (
    <div className="flex h-full flex-col bg-white font-workspace-sans">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-4 pl-14 md:pl-8 md:px-10">
        <div className="flex items-baseline gap-3">
          <h1 className="font-workspace-display text-[22px] font-extrabold tracking-[-0.02em] text-[#111111]">
            Dashboard
          </h1>
          <span className="hidden font-workspace-mono text-[12px] italic text-[#999999] sm:block">
            mission control
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 font-workspace-mono text-[10px] uppercase tracking-[0.12em] text-[#666666] sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-converza-blue/40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-converza-blue" />
            </span>
            Live
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-8 md:px-10 md:py-12">
          <section className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </section>

          <div className="grid gap-10 md:grid-cols-[3fr_2fr] md:gap-14">
          <section>
            <header className="mb-7 flex items-baseline justify-between">
              <div>
                <h2 className="font-workspace-display text-[18px] font-bold tracking-[-0.02em] text-[#111111]">
                  The Swarm Ledger
                </h2>
                <p className="mt-1 font-workspace-mono text-[10px] uppercase tracking-[0.1em] text-[#999999]">
                  Live · {ledger.length} events today
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 text-[12px] text-[#666666] transition-colors hover:bg-[#f4f4f5] hover:text-[#111111]">
                <ListFilter size={12} strokeWidth={1.8} />
                Filter
              </button>
            </header>

            <ol className="relative space-y-1">
              <span
                aria-hidden
                className="absolute bottom-3 left-[7px] top-3 w-px bg-[#e5e5e5]"
              />
              {ledger.length === 0 && (
                <li className="rounded-2xl border border-dashed border-[#e5e5e5] bg-white p-8 text-[13px] text-[#999999]">
                  Waiting for live agent steps...
                </li>
              )}
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
                  className="group relative flex items-start gap-4 rounded-lg py-2.5 pl-5 pr-3 transition-colors hover:bg-[#f4f4f5]"
                >
                  <span className="absolute left-[2px] top-3.5 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-4 ring-white">
                    {event.live ? (
                      <>
                        <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-converza-blue/40" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-converza-blue" />
                      </>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#999999]/50" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-workspace-mono text-[10px] uppercase tracking-[0.1em] text-[#999999] tabular-nums">
                        {event.time}
                      </span>
                      <span className="text-[12.5px] font-medium tracking-[-0.005em] text-[#111111]">
                        {event.agent}
                      </span>
                      <event.icon
                        size={11}
                        strokeWidth={1.6}
                        className="text-[#999999]"
                      />
                    </div>
                    <p className="mt-1 max-w-[60ch] text-[13.5px] leading-[1.55] text-[#666666]">
                      {event.action}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </section>

          <section>
            <header className="mb-7 flex items-baseline justify-between">
              <div>
                <h2 className="font-workspace-display text-[18px] font-bold tracking-[-0.02em] text-[#111111]">
                  Approval queue
                </h2>
                <p className="mt-1 font-workspace-mono text-[10px] uppercase tracking-[0.1em] text-[#999999]">
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
                    className="rounded-2xl border border-[#e5e5e5] bg-white p-5 transition-colors hover:bg-[#fafafa]"
                  >
                    <p className="font-workspace-mono text-[10px] uppercase tracking-[0.12em] text-[#999999]">
                      {ap.eyebrow}
                    </p>
                    <h3 className="mt-2 text-[15.5px] font-medium leading-snug tracking-[-0.005em] text-[#111111]">
                      {ap.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-[1.6] text-[#666666]">
                      {ap.body}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 font-workspace-mono text-[10px] uppercase tracking-[0.12em] text-sleyz">
                      <ArrowUpRight size={11} strokeWidth={2.2} />
                      {ap.impact}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <button className="text-[12px] text-[#666666] transition-colors hover:text-[#111111]">
                        More context →
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void resolve(ap.id, "reject")}
                          className="rounded-full border border-[#e5e5e5] bg-white px-4 py-1.5 text-[12.5px] font-medium text-[#666666] transition-colors hover:bg-[#f4f4f5] hover:text-[#111111]"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => void resolve(ap.id, "approve")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-[12.5px] font-medium text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
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
                  className="rounded-2xl border border-dashed border-[#e5e5e5] bg-white p-10 text-center"
                >
                  <ShieldCheck
                    size={22}
                    strokeWidth={1.6}
                    className="mx-auto mb-3 text-[#999999]"
                  />
                  <p className="text-[14px] text-[#111111]">Caught up.</p>
                  <p className="mt-1 text-[12.5px] text-[#999999]">
                    The swarm is shipping autonomously. New approvals will surface here.
                  </p>
                </motion.div>
              )}
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
