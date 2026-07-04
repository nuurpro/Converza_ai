"use client";

import { Crosshair } from "lucide-react";
import ConfigPageShell from "@/components/layout/ConfigPageShell";

export default function CompetitorsPage() {
  return (
    <ConfigPageShell
      title="Competitors"
      subtitle="watchlist"
      lead="The brands the swarm checks every morning. We track their ads, copy, posting cadence, and pricing — and surface anything notable in the ledger."
      icon={Crosshair}
      placeholder="Add a competitor — domain, Instagram handle, or TikTok handle. The Competitor Scout will start tracking within an hour."
    />
  );
}
