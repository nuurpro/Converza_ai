"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  Compass,
  Crosshair,
  ChevronDown,
  X,
  MessageSquareText,
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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// IA — single nav focused on data input for the AI
// ─────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "strategy", label: "Strategy", href: "/strategy", icon: Compass },
  { id: "competitors", label: "Competitors", href: "/competitors", icon: Crosshair },
];

const chatHistoryItems = [
  { id: "campaign-brief", title: "Campaign brief", meta: "Today" },
  { id: "creative-hooks", title: "Creative hooks", meta: "Yesterday" },
  { id: "competitor-review", title: "Competitor review", meta: "Mon" },
];

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [brandName, setBrandName] = useState("Osman Skincare");
  const isCopilot = pathname.startsWith("/copilot");

  useEffect(() => {
    setChatHistoryOpen(isCopilot);
  }, [isCopilot]);

  useEffect(() => {
    function readBrandName() {
      const stored = window.localStorage.getItem(BRAND_NAME_STORAGE_KEY)?.trim();
      setBrandName(stored || "Osman Skincare");
    }

    readBrandName();
    window.addEventListener("storage", readBrandName);
    window.addEventListener("converza:brand-name-updated", readBrandName);

    return () => {
      window.removeEventListener("storage", readBrandName);
      window.removeEventListener("converza:brand-name-updated", readBrandName);
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavLink({ item, index }: { item: NavItem; index: number }) {
    const active = isActive(item.href);
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      >
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
          {active && (
            <motion.span
              layoutId="active-rail"
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <item.icon
            size={16}
            strokeWidth={active ? 2.2 : 1.8}
            className={clsx(
              "shrink-0 transition-colors",
              active ? "text-text-primary" : "text-text-muted group-hover:text-text-secondary",
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.hint && (
            <kbd className="hidden font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted/70 group-hover:inline">
              {item.hint}
            </kbd>
          )}
        </Link>
      </motion.div>
    );
  }

  const sidebarContent = (
    <>
      {/* ── Workspace switcher (Claude / Linear style) ── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary text-bg-elevated">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5v11M1.5 7h11M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[13.5px] font-semibold tracking-[-0.015em] text-text-primary">
              Converza
            </span>
            <span className="max-w-[150px] truncate font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
              {brandName}
            </span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Single flat nav, focused on data input for the AI ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-4">
        {navItems.map((item, i) => (
          <NavLink key={item.id} item={item} index={i} />
        ))}

        {/* Quiet shortcut to the chat assistant — kept reachable but out of the primary IA */}
        <div className="mt-6 border-t border-border/60 pt-3">
          <Link
            href="/copilot"
            onClick={() => {
              setChatHistoryOpen(true);
              onClose();
            }}
            className={clsx(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
              isCopilot
                ? "bg-bg-active font-medium text-text-primary"
                : "text-text-muted hover:bg-bg-hover hover:text-text-secondary",
            )}
          >
            <MessageSquareText
              size={14}
              strokeWidth={isCopilot ? 2.1 : 1.8}
              className={isCopilot ? "text-text-primary" : ""}
            />
            <span className="flex-1">Co-Pilot chat</span>
            <ChevronDown
              size={12}
              strokeWidth={2}
              className={clsx(
                "text-text-muted transition-transform duration-200",
                chatHistoryOpen && isCopilot ? "rotate-180" : "-rotate-90",
              )}
            />
          </Link>

          <AnimatePresence initial={false}>
            {isCopilot && chatHistoryOpen && (
              <motion.div
                key="copilot-history"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 space-y-1 pl-6">
                  {chatHistoryItems.map((item) => (
                    <Link
                      key={item.id}
                      href="/copilot"
                      onClick={onClose}
                      className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="ml-2 shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted/70">
                        {item.meta}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ── User chip ── */}
      <div className="mx-3 mb-3">
        <Link
          href="/settings"
          onClick={onClose}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-bg-hover"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D6FE5] to-[#0070F3] text-[11px] font-medium text-white">
            NE
          </span>
          <span className="flex-1 truncate text-[13px] font-medium text-text-primary">
            Nodir
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            Free
          </span>
        </Link>
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
