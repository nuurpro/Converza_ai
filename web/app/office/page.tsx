import { WorkspaceHeader } from "@/components/workspace/AgentWorkspace";

export default function VirtualOfficePage() {
  return (
    <div className="flex h-full flex-col bg-white">
      <WorkspaceHeader title="Virtual office" />
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-center font-workspace-sans">
        <div>
          <h1 className="font-workspace-display text-[24px] font-extrabold tracking-[-0.02em] text-[#111111]">
            Coming soon
          </h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#666666]">
            A shared visual space where Milo, Sleyz, and Vea work in real time, with active, idle, and blocked states visible at a glance.
          </p>
        </div>
      </main>
    </div>
  );
}
