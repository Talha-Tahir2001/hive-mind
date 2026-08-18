import { IconCode, IconSearch, IconRocket } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentStatusBadge } from "@/components/shared/agent-status-badge";
import { getAgents } from "@/lib/memory/queries";
import type { Agent, AgentStatus } from "@/lib/memory/types";

const agentDetails: Record<
  string,
  { icon: typeof IconCode; color: string; bg: string; writes: string[]; reads: string[] }
> = {
  coder: {
    icon: IconCode,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    writes: ["finding", "fix", "context"],
    reads: ["critique", "approval", "issue"],
  },
  reviewer: {
    icon: IconSearch,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    writes: ["critique", "approval"],
    reads: ["finding", "fix", "context"],
  },
  deployer: {
    icon: IconRocket,
    color: "text-green-500",
    bg: "bg-green-500/10",
    writes: ["plan"],
    reads: ["finding", "fix", "approval"],
  },
};

export default async function AgentsPage() {
  let agents: Agent[] = [];

  try {
    agents = await getAgents().catch(() => [] as Agent[]);
  } catch (error) {
    console.error("[AgentsPage] Failed to fetch agents:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground">
          The three hive agents and their memory patterns.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {agents.map((agent) => {
          const details = agentDetails[agent.type] ?? agentDetails.coder;
          const Icon = details.icon;

          return (
            <Card key={agent.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${details.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${details.color}`} />
                  </div>
                  <div>
                    <div className="text-base">{agent.name}</div>
                    <AgentStatusBadge status={agent.status as AgentStatus} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Writes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {details.writes.map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px]">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Reads from other agents
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {details.reads.map((type) => (
                      <Badge key={type} variant="secondary" className="text-[10px]">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}