import {
  CompetitorRow,
  WorkspaceHeader,
} from "@/components/workspace/AgentWorkspace";
import { getCompetitors } from "@/lib/data/workspace";

export default function CompetitorsPage() {
  const competitors = getCompetitors();

  return (
    <div className="flex h-full flex-col bg-white">
      <WorkspaceHeader title="Competitors" subtitle="tracked accounts" />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="max-w-5xl overflow-x-auto rounded-[14px] border border-[#e5e5e5] bg-white">
          <div className="min-w-[680px]">
            <CompetitorRow header />
            {competitors.map((competitor) => (
              <CompetitorRow key={competitor.id} competitor={competitor} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
