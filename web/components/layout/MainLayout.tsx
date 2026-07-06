"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Marketing/landing routes render without the dashboard shell.
  if (pathname?.startsWith("/landing")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary ring-1 ring-border md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-text-primary" />
      </button>

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on desktop only */}
      <main className="ml-0 flex flex-1 flex-col overflow-hidden md:ml-[var(--sidebar-width)]">
        {children}
      </main>
    </div>
  );
}
