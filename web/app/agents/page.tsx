import {
  AgentCard,
  SoonAgentCard,
  WorkspaceHeader,
} from "@/components/workspace/AgentWorkspace";
import { getAgents, getSoonAgents } from "@/lib/data/workspace";

export default function AgentsPage() {
  const agents = getAgents();
  const soonAgents = getSoonAgents();

  return (
    <div className="flex h-full flex-col bg-white">
      <WorkspaceHeader title="Agents" subtitle="your team" />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        <section className="mt-10 max-w-5xl">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="font-workspace-display text-[18px] font-extrabold tracking-[-0.02em] text-[#111111]">
              Coming soon
            </h2>
            <span className="font-workspace-mono text-[10px] uppercase tracking-[0.08em] text-[#999999]">
              next agents
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {soonAgents.map((agent) => (
              <SoonAgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
