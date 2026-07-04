"use client";

import { UsersRound } from "lucide-react";
import ConfigPageShell from "@/components/layout/ConfigPageShell";

export default function AudiencePage() {
  return (
    <ConfigPageShell
      title="Target Audience"
      subtitle="who we sell to"
      lead="A clear picture of the buyer. The swarm uses this to filter creative, pick channels, and write copy that lands."
      icon={UsersRound}
      placeholder="Describe your buyer in one paragraph — who they are, what they do, what they want, what they fear, where they hang out online."
    />
  );
}
