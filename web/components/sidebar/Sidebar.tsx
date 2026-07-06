"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  UsersRound,
  MessagesSquare,
  Crosshair,
  Building2,
  X,
  Settings,
} from "lucide-react";
import {
  getWorkspaceNavItems,
  type WorkspaceNavItem,
} from "@/lib/data/workspace";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface NavItem {
  id: WorkspaceNavItem["id"];
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  placement: WorkspaceNavItem["placement"];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// IA — approved Agent Workspace model
// ─────────────────────────────────────────────────────────────────────

const navIconMap: Record<WorkspaceNavItem["id"], React.ElementType> = {
  dashboard: LayoutDashboard,
  agents: UsersRound,
  squad: MessagesSquare,
  competitors: Crosshair,
  office: Building2,
  settings: Settings,
};

const navItems: NavItem[] = getWorkspaceNavItems().map((item) => ({
  ...item,
  icon: navIconMap[item.id],
}));

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [brandName, setBrandName] = useState("Osman Skincare");

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
            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] font-workspace-sans text-[13px] transition-colors duration-150",
            active
              ? "bg-[#f4f4f5] font-medium text-black"
              : "text-[#666666] hover:bg-[#f4f4f5] hover:text-[#111111]",
          )}
        >
          {active && (
            <motion.span
              layoutId="active-rail"
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-converza-blue"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <item.icon
            size={16}
            strokeWidth={active ? 2.2 : 1.8}
            className={clsx(
              "shrink-0 transition-colors",
              active ? "text-black" : "text-[#999999] group-hover:text-[#666666]",
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-[#ececec] px-2 py-0.5 font-workspace-mono text-[8px] uppercase tracking-[0.04em] text-[#999999]">
              {item.badge}
            </span>
          )}
        </Link>
      </motion.div>
    );
  }

  const sidebarContent = (
    <>
      <div className="flex shrink-0 items-center justify-between px-2 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-black font-workspace-display text-[15px] font-extrabold text-white">
            C
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="font-workspace-display text-[14px] font-extrabold tracking-[-0.01em] text-black">
              Converza
            </span>
            <span className="max-w-[150px] truncate font-workspace-mono text-[10px] uppercase tracking-[0.03em] text-[#999999]">
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

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.filter((item) => item.placement === "main").map((item, i) => (
          <NavLink key={item.id} item={item} index={i} />
        ))}
      </nav>

      <div className="mt-2 border-t border-[#e5e5e5] pt-3">
        {navItems.filter((item) => item.placement === "footer").map((item, i) => (
          <NavLink key={item.id} item={item} index={i} />
        ))}
        <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-workspace-sans">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-medium text-white">
            N
          </span>
          <span className="text-[12px] text-[#111111]">
            Nodir
          </span>
          <span className="ml-auto font-workspace-mono text-[9px] uppercase tracking-[0.06em] text-[#999999]">
            Free
          </span>
        </div>
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
          "border-r border-[#e5e5e5] bg-white px-3.5 py-5 md:flex",
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col",
          "border-r border-[#e5e5e5] bg-white px-3.5 py-5",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
