import { getRuns } from "@/lib/memory/queries";
import { RelativeTime } from "@/components/shared/relative-time";
import { PipelineRunner } from "@/components/dashboard/pipeline-runner";
import { IssueInjector } from "@/components/dashboard/issue-injector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Run } from "@/lib/memory/types";

export default async function PipelinePage() {
  let runs: Run[] = [];

  try {
    runs = await getRuns(10).catch(() => [] as Run[]);
  } catch (error) {
    console.error("[PipelinePage] Failed to fetch runs:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Trigger pipeline runs and inject issues into shared memory.
        </p>
      </div>

      <div className="flex gap-2">
        <IssueInjector />
      </div>

      <PipelineRunner />

      {runs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Run History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <Badge
                  variant={
                    run.status === "completed"
                      ? "outline"
                      : run.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px] shrink-0"
                >
                  {run.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {run.triggerInput ?? "No description"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {run.triggerType} · loop {run.reviewLoopCount}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  <RelativeTime date={run.createdAt} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}