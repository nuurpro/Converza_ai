import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  AlertTriangle,
  Rocket,
  Zap,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────
// Dummy analytics data — BudgetBrain dashboard
// ─────────────────────────────────────────────────────────────────────

const kpis = [
  {
    label: "Total Ad Spend",
    value: "$24,680",
    change: "+12.3%",
    trend: "up" as const,
    sublabel: "Last 30 days",
    icon: DollarSign,
    color: "text-accent",
    bg: "bg-accent/8",
  },
  {
    label: "Total Revenue Generated",
    value: "$83,912",
    change: "+28.7%",
    trend: "up" as const,
    sublabel: "AI-attributed",
    icon: TrendingUp,
    color: "text-success",
    bg: "bg-success/8",
  },
  {
    label: "Blended ROAS",
    value: "3.4x",
    change: "+0.6x",
    trend: "up" as const,
    sublabel: "Across all campaigns",
    icon: Target,
    color: "text-accent",
    bg: "bg-accent-dim",
  },
];

// Mock chart data (7 days)
const chartData = [
  { day: "Mon", spend: 3200, revenue: 9800 },
  { day: "Tue", spend: 2800, revenue: 8200 },
  { day: "Wed", spend: 4100, revenue: 14300 },
  { day: "Thu", spend: 3600, revenue: 12800 },
  { day: "Fri", spend: 4800, revenue: 18200 },
  { day: "Sat", spend: 3400, revenue: 11600 },
  { day: "Sun", spend: 2700, revenue: 8900 },
];

const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

// Channel breakdown
const channels = [
  { name: "TikTok", spend: "$8,240", revenue: "$32,100", roas: "3.9x", share: 42 },
  { name: "Meta (FB/IG)", spend: "$9,120", revenue: "$28,400", roas: "3.1x", share: 34 },
  { name: "Instagram Reels", spend: "$4,680", revenue: "$16,800", roas: "3.6x", share: 16 },
  { name: "YouTube Shorts", spend: "$2,640", revenue: "$6,612", roas: "2.5x", share: 8 },
];

// AI Recommendations
const recommendations = [
  {
    type: "scale" as const,
    title: "Scale \"Summer Drop\" campaign by 20%",
    reason:
      "CPA is $6.20 (52% below target). Hook rate at 8.4% indicates creative fatigue is minimal. BudgetBrain recommends reallocating $460 from Competitor Takedown.",
    impact: "+$2,800 projected weekly revenue",
    urgency: "high",
  },
  {
    type: "pause" as const,
    title: "Pause \"Cold Audience v2\" — CPA exceeds threshold",
    reason:
      "CPA spiked to $18.40 over 48h (threshold: $14). Audience saturation detected in Metro NYC segment. Recommend creative refresh before relaunch.",
    impact: "Save $640/week in wasted spend",
    urgency: "high",
  },
  {
    type: "optimize" as const,
    title: "Shift TikTok budget from 16:9 to 9:16 creatives",
    reason:
      "9:16 assets outperform 16:9 by 2.3x on hook rate and 1.8x on watch-through. 34% of current TikTok budget is still allocated to landscape.",
    impact: "+0.4x ROAS improvement projected",
    urgency: "medium",
  },
  {
    type: "insight" as const,
    title: "UGC talking-head ads outperforming B-Roll by 1.6x",
    reason:
      "Across 24 active creatives, talking-head format averages $8.20 CPA vs B-Roll at $13.10. Founder-style testimonials have the highest CTR (4.2%).",
    impact: "Shift creative mix to 70/30 UGC-to-BRoll",
    urgency: "low",
  },
];

const recConfig = {
  scale: { icon: Rocket, color: "text-success", border: "border-success/20" },
  pause: { icon: AlertTriangle, color: "text-warning", border: "border-warning/20" },
  optimize: { icon: Zap, color: "text-accent", border: "border-accent/20" },
  insight: { icon: Lightbulb, color: "text-accent", border: "border-accent/20" },
};

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            Analytics
          </h1>
          <span className="hidden font-display text-[18px] text-text-muted sm:block">
            performance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            BudgetBrain
          </span>
          <span className="rounded-full border border-border bg-bg-secondary px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Last 30 days
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-bg-primary p-4 md:p-6">
        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-bg-secondary p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium tracking-wide text-text-muted">
                  {kpi.label}
                </span>
                <div
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    kpi.bg
                  )}
                >
                  <kpi.icon size={18} className={kpi.color} />
                </div>
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight text-text-primary">
                {kpi.value}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={clsx(
                    "flex items-center gap-0.5 text-[12px] font-semibold",
                    kpi.trend === "up" ? "text-success" : "text-error"
                  )}
                >
                  {kpi.trend === "up" ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {kpi.change}
                </span>
                <span className="text-[11px] text-text-muted">{kpi.sublabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue vs Spend Chart */}
        <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-text-primary">
                Revenue vs Ad Spend
              </h2>
              <p className="mt-0.5 text-[11px] text-text-muted">
                7-day rolling view
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-[10px] text-text-muted">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[10px] text-text-muted">Spend</span>
              </div>
            </div>
          </div>

          {/* CSS bar chart */}
          <div className="flex items-end gap-3 h-48">
            {chartData.map((d) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-end justify-center gap-1 flex-1">
                  {/* Revenue bar */}
                  <div
                    className="w-5 rounded-t bg-success/70 transition-all"
                    style={{
                      height: `${(d.revenue / maxRevenue) * 100}%`,
                    }}
                  />
                  {/* Spend bar */}
                  <div
                    className="w-5 rounded-t bg-accent/50 transition-all"
                    style={{
                      height: `${(d.spend / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-text-muted">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Channel Breakdown */}
          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-[14px] font-semibold text-text-primary">
              Channel Performance
            </h2>
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-text-primary">
                      {ch.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-text-muted">
                        {ch.spend} → {ch.revenue}
                      </span>
                      <span
                        className={clsx(
                          "font-mono text-[11px] font-bold",
                          parseFloat(ch.roas) >= 3.5
                            ? "text-success"
                            : parseFloat(ch.roas) >= 3
                              ? "text-accent"
                              : "text-text-muted"
                        )}
                      >
                        {ch.roas}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#facc15]/60 to-emerald-500/60"
                      style={{ width: `${ch.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <Brain size={16} className="text-accent" />
              <h2 className="text-[14px] font-semibold text-text-primary">
                AI Recommendations
              </h2>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => {
                const cfg = recConfig[rec.type];
                const RecIcon = cfg.icon;

                return (
                  <div
                    key={i}
                    className={clsx(
                      "rounded-lg border bg-bg-primary p-3.5",
                      cfg.border
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <RecIcon
                        size={14}
                        className={clsx("mt-0.5 shrink-0", cfg.color)}
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-text-primary">
                          {rec.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                          {rec.reason}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-success">
                            {rec.impact}
                          </span>
                          <span
                            className={clsx(
                              "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              rec.urgency === "high"
                                ? "bg-error/10 text-error"
                                : rec.urgency === "medium"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-accent-dim text-accent"
                            )}
                          >
                            {rec.urgency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
