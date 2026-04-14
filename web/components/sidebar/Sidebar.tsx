"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  Terminal,
  MessageSquare,
  GitBranch,
  FolderKanban,
  Package,
  BarChart3,
  CalendarDays,
  Settings,
  Palette,
  KeyRound,
  CreditCard,
  User,
  Brain,
  Cpu,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface SubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  children?: SubItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────

const primaryNav: NavItem[] = [
  {
    id: "command-center",
    label: "Command Center",
    href: "/",
    icon: Terminal,
    children: [
      { label: "Recent Chats", href: "/chats", icon: MessageSquare },
      { label: "Agent Threads", href: "/threads", icon: GitBranch },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    id: "products",
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    id: "calendar",
    label: "Content Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
];

const settingsNav: NavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
  children: [
    { label: "Brand Passport", href: "/settings/brand", icon: Palette },
    { label: "API Tokens", href: "/settings/tokens", icon: KeyRound },
    { label: "Billing & Payments", href: "/settings/billing", icon: CreditCard },
    { label: "Personal Profile", href: "/settings/profile", icon: User },
    { label: "Agent Memory", href: "/settings/memory", icon: Brain },
    { label: "LLM Model Selection", href: "/settings/models", icon: Cpu },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "command-center": true,
  });

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function handleLinkClick() {
    onClose();
  }

  // ── Render a single nav item ──
  function renderItem(item: NavItem) {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = expanded[item.id];

    return (
      <div key={item.id}>
        {/* Parent item */}
        <div className="flex items-center">
          <Link
            href={item.href}
            onClick={handleLinkClick}
            className={clsx(
              "group flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 md:py-2 text-[14px] md:text-[13.5px] font-medium transition-all duration-150",
              active
                ? "bg-accent-dim text-accent"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <item.icon
              size={18}
              strokeWidth={1.8}
              className={clsx(
                "shrink-0 transition-colors",
                active ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>

          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.id)}
              className={clsx(
                "mr-1 flex h-8 w-8 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              )}
              aria-label={`Toggle ${item.label} submenu`}
            >
              {isOpen ? (
                <ChevronDown size={14} strokeWidth={2} />
              ) : (
                <ChevronRight size={14} strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        {/* Sub-items */}
        {hasChildren && isOpen && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {item.children!.map((sub) => {
              const subActive = isActive(sub.href);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 md:py-[6px] text-[13px] md:text-[12.5px] font-medium transition-all duration-150",
                    subActive
                      ? "bg-accent-dim text-accent"
                      : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                  )}
                >
                  <sub.icon
                    size={14}
                    strokeWidth={1.8}
                    className={clsx(
                      "shrink-0 transition-colors",
                      subActive
                        ? "text-accent"
                        : "text-text-muted group-hover:text-text-secondary"
                    )}
                  />
                  <span className="truncate">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* ── Brand ── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <Zap size={15} strokeWidth={2.5} className="text-text-on-accent" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-text-primary">
            Converza
          </span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Primary nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {primaryNav.map((item) => renderItem(item))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-border" />

      {/* ── Settings (bottom anchor) ── */}
      <nav className="shrink-0 space-y-1 px-3 py-3">
        {renderItem(settingsNav)}
      </nav>

      {/* ── Status bar ── */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="text-[11px] font-medium text-text-muted">
          All systems operational
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Desktop sidebar (always visible) ── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col",
          "border-r border-border bg-bg-secondary",
          "hidden md:flex"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer (slide-in) ── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-border bg-bg-secondary",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
