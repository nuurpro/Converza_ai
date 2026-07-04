"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  Palette,
  KeyRound,
  CreditCard,
  UserRound,
  Brain,
  Cpu,
  ChevronLeft,
  UsersRound,
  Plug,
} from "lucide-react";

const groups = [
  {
    title: "Account",
    items: [
      { id: "profile", label: "Profile", href: "/settings/profile", icon: UserRound, hint: "Your name, role, avatar" },
      { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard, hint: "Plan, invoices, payment" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "brand", label: "Brand passport", href: "/settings/brand", icon: Palette, hint: "Voice, tone, audience" },
      { id: "audience", label: "Target audience", href: "/settings/audience", icon: UsersRound, hint: "Buyer profile, fears, markets" },
      { id: "integrations", label: "Integrations", href: "/settings/integrations", icon: Plug, hint: "Connectors and data sources" },
      { id: "tokens", label: "API tokens", href: "/settings/tokens", icon: KeyRound, hint: "Personal access tokens" },
    ],
  },
  {
    title: "Engine",
    items: [
      { id: "memory", label: "Agent memory", href: "/settings/memory", icon: Brain, hint: "What the swarm remembers" },
      { id: "models", label: "Models", href: "/settings/models", icon: Cpu, hint: "Default LLM per role" },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname === "/settings";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-center gap-3">
          {!isHub && (
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
              aria-label="Back to settings"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </Link>
          )}
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            Settings
          </h1>
          <span className="hidden font-display text-[18px] text-text-muted sm:block">
            {isHub ? "preferences" : "workspace"}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings rail — sub-nav (desktop only when on a leaf page) */}
        {!isHub && (
          <nav className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-border bg-bg-secondary/50 px-4 py-8 md:block">
            <Link
              href="/settings"
              className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-text-primary"
            >
              <ChevronLeft size={11} strokeWidth={2} /> All settings
            </Link>
            {groups.map((g) => (
              <div key={g.title} className="mb-6">
                <div className="mb-2 px-2 font-display text-[12px] text-text-muted">
                  {g.title}
                </div>
                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={clsx(
                          "group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-bg-active text-text-primary font-medium"
                            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="settings-rail"
                            className="absolute -left-1 top-1/2 h-3 w-[2px] -translate-y-1/2 rounded-r-full bg-accent"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <item.icon
                          size={14}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={clsx(
                            "shrink-0",
                            active ? "text-text-primary" : "text-text-muted",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        )}

        <div className="flex-1 overflow-y-auto bg-bg-primary">
          {isHub ? (
            <SettingsHub />
          ) : (
            <div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Hub view — bento grid of all settings entries
// ────────────────────────────────────────────

function SettingsHub() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-16">
      <div className="mb-10">
        <h2 className="text-[clamp(28px,3.4vw,40px)] font-medium leading-[1.05] tracking-[-0.025em] text-text-primary">
          What would you like to{" "}
          <span className="font-display text-accent">refine?</span>
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Eight rooms. Each one shapes how the swarm thinks, ships, and bills.
        </p>
      </div>

      {groups.map((g, gi) => (
        <div key={g.title} className="mb-10">
          <div className="mb-3 font-display text-[16px] text-text-secondary">
            {g.title}
          </div>
          <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg-elevated">
            {g.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.06 * (gi * 2 + i),
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  href={item.href}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-hover"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-secondary transition-all group-hover:border-border-hover group-hover:bg-bg-elevated">
                    <item.icon size={16} strokeWidth={1.7} className="text-text-secondary" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[14.5px] font-medium tracking-[-0.005em] text-text-primary">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-text-muted">
                      {item.hint}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
