"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  MessageSquareText,
  Workflow,
  FolderKanban,
  Package,
  BarChart3,
  CalendarDays,
  Settings2,
  Palette,
  KeyRound,
  CreditCard,
  UserRound,
  Brain,
  Cpu,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  hint?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Information architecture — three meaningful sections
// ─────────────────────────────────────────────────────────────────────

const sections: NavSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      { id: "chat", label: "Co-Pilot", href: "/", icon: MessageSquareText, hint: "⌘K" },
      { id: "threads", label: "Agent threads", href: "/threads", icon: Workflow },
      { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
      { id: "products", label: "Products", href: "/products", icon: Package },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [
      { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
      { id: "calendar", label: "Content calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
];

const settingsItems: NavItem[] = [
  { id: "brand", label: "Brand passport", href: "/settings/brand", icon: Palette },
  { id: "tokens", label: "API tokens", href: "/settings/tokens", icon: KeyRound },
  { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard },
  { id: "profile", label: "Profile", href: "/settings/profile", icon: UserRound },
  { id: "memory", label: "Agent memory", href: "/settings/memory", icon: Brain },
  { id: "models", label: "Models", href: "/settings/models", icon: Cpu },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={clsx(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150",
          active
            ? "bg-bg-active text-text-primary font-medium"
            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
        )}
      >
        <item.icon
          size={16}
          strokeWidth={active ? 2.2 : 1.8}
          className={clsx(
            "shrink-0 transition-colors",
            active ? "text-accent" : "text-text-muted group-hover:text-text-secondary",
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted/70">
            {item.hint}
          </span>
        )}
      </Link>
    );
  }

  function SectionHeader({ title }: { title: string }) {
    return (
      <div className="px-3 pb-1.5 pt-1">
        <span className="font-display text-[13px] text-text-muted">
          {title}
        </span>
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* ── Brand ── */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link
          href="/"
          onClick={onClose}
          className="group flex items-center gap-2.5"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary text-bg-elevated">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5v11M1.5 7h11M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {/* Brand-coded accent dot — a single beat of color on an otherwise mono mark */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg-secondary" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.015em] text-text-primary">
            Converza
          </span>
        </Link>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── New chat CTA ── */}
      <div className="px-3 pb-3">
        <Link
          href="/"
          onClick={onClose}
          className="group flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-[13.5px] font-medium text-text-primary transition-all duration-150 hover:border-border-hover hover:bg-bg-secondary"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-text-on-accent">
            <Plus size={13} strokeWidth={2.4} />
          </span>
          <span>New chat</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            ⌘N
          </span>
        </Link>
      </div>

      {/* ── Sectioned nav ── */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-0.5">
            <SectionHeader title={section.title} />
            {section.items.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </div>
        ))}

        {/* Settings — collapsible */}
        <div className="space-y-0.5">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-bg-hover"
          >
            <span className="font-display flex-1 text-[13px] text-text-muted group-hover:text-text-secondary">
              Settings
            </span>
            <ChevronDown
              size={13}
              strokeWidth={2}
              className={clsx(
                "text-text-muted transition-transform duration-200",
                settingsOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>
          {settingsOpen &&
            settingsItems.map((item) => <NavLink key={item.id} item={item} />)}
        </div>
      </nav>

      {/* ── Status — soft success-tinted card ── */}
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-success/15 bg-success-dim px-3 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.18em] text-success">
          All systems operational
        </span>
      </div>
    </>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-width)] flex-col",
          "border-r border-border bg-bg-secondary md:flex",
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-border bg-bg-secondary",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
