import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentStatusBadge } from "@/components/shared/agent-status-badge";
import { AgentIcon } from "@/components/shared/agent-badge";
import { MemoryFeed } from "@/components/dashboard/memory-feed";
import { getAgents, getMemories, getMemoryDiff } from "@/lib/memory/queries";
import type { Agent, AgentType, AgentStatus, Memory, MemoryDiff } from "@/lib/memory/types";

export default async function DashboardPage() {
  let agents: Agent[] = [];
  let recentMemories: Memory[] = [];
  let memoryDiff: MemoryDiff | null = null;

  try {
    const [agentsResult, memoriesResult, diffResult] = await Promise.all([
      getAgents().catch(() => [] as Agent[]),
      getMemories({ limit: 8 }).then((r) => r.memories).catch(() => [] as Memory[]),
      getMemoryDiff("1 hour").catch(() => null),
    ]);
    agents = agentsResult;
    recentMemories = memoriesResult;
    memoryDiff = diffResult;
  } catch (error) {
    console.error("[Dashboard] Failed to fetch data:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hive Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor agents, browse shared memory, and trigger pipeline runs.
          </p>
        </div>
        <Button className="inline-flex items-center">
          <Link className="flex items-center" href="/dashboard/pipeline">
            Run Pipeline
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.type}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AgentIcon type={agent.type as AgentType} />
                {agent.name}
                <AgentStatusBadge status={agent.status as AgentStatus} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Memory Diff (1h)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memoryDiff && memoryDiff.total > 0 ? (
              <>
                <div className="text-3xl font-bold">{memoryDiff.total}</div>
                <p className="text-xs text-muted-foreground">
                  memories created in the last hour
                </p>
                <div className="space-y-1.5">
                  {memoryDiff.byAgent.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{a.name}</span>
                      <span className="font-medium">{a.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Memory Feed</CardTitle>
              <Button variant="ghost" size="sm" className="inline-flex items-center" >
                <Link href="/dashboard/memories" className="inline-flex items-center">
                  View all
                  <IconArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MemoryFeed memories={recentMemories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}