"use client";

import { Compass } from "lucide-react";
import ConfigPageShell from "@/components/layout/ConfigPageShell";

export default function StrategyPage() {
  return (
    <ConfigPageShell
      title="Strategy"
      subtitle="north star"
      lead="The single goal the swarm is optimizing toward this quarter. Set it once, every agent reads it before acting."
      icon={Compass}
      placeholder="Top-line goal — e.g. 'Acquire 1,200 first-time buyers in the US between Apr 1 and Jun 30 at a CPA below $14.'"
    />
  );
}
