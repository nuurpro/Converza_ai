import {
  FolderKanban,
  Zap,
  Film,
  TrendingUp,
  Clock,
  CheckCircle2,
  PauseCircle,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────
// Dummy data — DAG execution history
// ─────────────────────────────────────────────────────────────────────

type CampaignStatus = "running" | "completed" | "paused";

interface Campaign {
  id: string;
  name: string;
  strategy: string;
  status: CampaignStatus;
  statusDetail?: string;
  assets: number;
  roas: string;
  spend: string;
  started: string;
  platforms: string[];
}

const campaigns: Campaign[] = [
  {
    id: "dag-001",
    name: "Summer Drop — Gen Z Hook Series",
    strategy: "UGC TikTok Hook",
    status: "running",
    assets: 12,
    roas: "4.2x",
    spend: "$2,340",
    started: "2 hours ago",
    platforms: ["TikTok", "Instagram"],
  },
  {
    id: "dag-002",
    name: "Q3 Product Launch — Dyson V15",
    strategy: "Cinematic Product Demo",
    status: "running",
    assets: 8,
    roas: "—",
    spend: "$890",
    started: "45 min ago",
    platforms: ["Instagram", "YouTube"],
  },
  {
    id: "dag-003",
    name: "Flash Sale Weekend Push",
    strategy: "Urgency-Driven Retargeting",
    status: "completed",
    assets: 24,
    roas: "6.1x",
    spend: "$4,120",
    started: "3 days ago",
    platforms: ["Meta", "TikTok"],
  },
  {
    id: "dag-004",
    name: "Brand Story — Founder Series",
    strategy: "Authenticity-First Talking Head",
    status: "completed",
    assets: 16,
    roas: "3.8x",
    spend: "$1,890",
    started: "1 week ago",
    platforms: ["Instagram", "LinkedIn"],
  },
  {
    id: "dag-005",
    name: "Cold Audience Acquisition v2",
    strategy: "Broad-to-Niche Funnel",
    status: "paused",
    statusDetail: "Paused by BudgetBrain — CPA exceeded $18 threshold",
    assets: 9,
    roas: "1.2x",
    spend: "$3,200",
    started: "5 days ago",
    platforms: ["Meta"],
  },
  {
    id: "dag-006",
    name: "Holiday Gifting — Premium SKUs",
    strategy: "Luxury Unboxing B-Roll",
    status: "completed",
    assets: 32,
    roas: "5.4x",
    spend: "$6,750",
    started: "2 weeks ago",
    platforms: ["TikTok", "Instagram", "Meta"],
  },
  {
    id: "dag-007",
    name: "Competitor Takedown — Nike Response",
    strategy: "Comparison UGC",
    status: "paused",
    statusDetail: "Paused by BudgetBrain — Low engagement rate (1.1%)",
    assets: 4,
    roas: "0.8x",
    spend: "$1,400",
    started: "4 days ago",
    platforms: ["TikTok"],
  },
  {
    id: "dag-008",
    name: "Evergreen Product Education",
    strategy: "How-To Tutorial Series",
    status: "running",
    assets: 6,
    roas: "2.9x",
    spend: "$560",
    started: "6 hours ago",
    platforms: ["YouTube", "Instagram"],
  },
];

const statusConfig: Record<
  CampaignStatus,
  { label: string; icon: typeof CheckCircle2; bg: string; text: string }
> = {
  running: {
    label: "Running",
    icon: Loader2,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
};

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
  const totalAssets = campaigns.reduce((sum, c) => sum + c.assets, 0);
  const completedCampaigns = campaigns.filter(
    (c) => c.status === "completed"
  ).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#262626] px-4 pl-14 md:pl-6 md:px-6">
        <div className="flex items-center gap-2.5">
          <FolderKanban size={18} strokeWidth={1.8} className="text-[#facc15]" />
          <h1 className="text-[15px] font-semibold text-white">Projects</h1>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#facc15] px-3 py-2 text-[12px] font-bold text-black transition-colors hover:bg-[#eab308]">
          <Zap size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-4 md:p-6">
        {/* KPI Summary */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              label: "Active Campaigns",
              value: activeCampaigns.toString(),
              icon: Loader2,
              color: "text-blue-400",
              bg: "bg-blue-500/8",
            },
            {
              label: "Total Generated Assets",
              value: totalAssets.toString(),
              icon: Film,
              color: "text-[#facc15]",
              bg: "bg-[#facc15]/8",
            },
            {
              label: "Completed Campaigns",
              value: completedCampaigns.toString(),
              icon: TrendingUp,
              color: "text-emerald-400",
              bg: "bg-emerald-500/8",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-[#262626] bg-[#141414] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium tracking-wide text-gray-400">
                  {kpi.label}
                </span>
                <div
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    kpi.bg
                  )}
                >
                  <kpi.icon size={16} className={kpi.color} />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Campaign Table — desktop: grid table, mobile: card list */}
        <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
          {/* Table header — desktop only */}
          <div className="hidden border-b border-[#262626] px-5 py-3 lg:grid lg:grid-cols-[2fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:gap-4">
            {[
              "Campaign",
              "Strategy",
              "Status",
              "Assets",
              "Spend",
              "ROAS",
              "",
            ].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold uppercase tracking-wider text-gray-500"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Table rows — desktop grid / mobile card */}
          {campaigns.map((c, i) => {
            const sc = statusConfig[c.status];
            const StatusIcon = sc.icon;

            return (
              <div
                key={c.id}
                className={clsx(
                  "p-4 transition-colors hover:bg-[#1a1a1a] lg:grid lg:grid-cols-[2fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:items-center lg:gap-4 lg:px-5 lg:py-3.5",
                  i < campaigns.length - 1 && "border-b border-[#1e1e1e]"
                )}
              >
                {/* Campaign name + platforms */}
                <div>
                  <p className="text-[13px] font-medium text-white">
                    {c.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {c.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="ml-1 flex items-center gap-1 text-[10px] text-gray-600">
                      <Clock size={10} />
                      {c.started}
                    </span>
                  </div>
                </div>

                {/* Strategy — hidden on mobile (shown in mobile via row below) */}
                <span className="hidden text-[12px] text-gray-400 lg:block">{c.strategy}</span>

                {/* Mobile: strategy + metrics row */}
                <div className="mt-2 flex flex-wrap items-center gap-2 lg:hidden">
                  <span className="text-[11px] text-gray-500">{c.strategy}</span>
                  <span className="text-gray-700">·</span>
                  <span className="font-mono text-[11px] text-gray-400">{c.spend}</span>
                  <span className="text-gray-700">·</span>
                  <span
                    className={clsx(
                      "font-mono text-[11px] font-bold",
                      c.roas === "—"
                        ? "text-gray-600"
                        : parseFloat(c.roas) >= 3
                          ? "text-emerald-400"
                          : parseFloat(c.roas) >= 2
                            ? "text-[#facc15]"
                            : "text-red-400"
                    )}
                  >
                    {c.roas} ROAS
                  </span>
                </div>

                {/* Status badge */}
                <div className="mt-2 lg:mt-0">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      sc.bg,
                      sc.text
                    )}
                  >
                    <StatusIcon
                      size={12}
                      className={clsx(
                        c.status === "running" && "animate-spin"
                      )}
                    />
                    {sc.label}
                  </span>
                  {c.statusDetail && (
                    <p className="mt-1 text-[10px] leading-tight text-amber-400/70">
                      {c.statusDetail}
                    </p>
                  )}
                </div>

                {/* Assets — desktop only */}
                <span className="hidden font-mono text-[13px] font-medium text-white lg:block">
                  {c.assets}
                </span>

                {/* Spend — desktop only */}
                <span className="hidden font-mono text-[12px] text-gray-400 lg:block">
                  {c.spend}
                </span>

                {/* ROAS — desktop only */}
                <span
                  className={clsx(
                    "hidden font-mono text-[13px] font-bold lg:block",
                    c.roas === "—"
                      ? "text-gray-600"
                      : parseFloat(c.roas) >= 3
                        ? "text-emerald-400"
                        : parseFloat(c.roas) >= 2
                          ? "text-[#facc15]"
                          : "text-red-400"
                  )}
                >
                  {c.roas}
                </span>

                {/* Action — desktop only */}
                <button className="hidden h-7 w-7 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-[#262626] hover:text-gray-400 lg:flex">
                  <ArrowUpRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
