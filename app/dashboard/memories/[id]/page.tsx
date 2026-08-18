import Link from "next/link";
import { IconArrowLeft, IconLink } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryTypeBadge } from "@/components/shared/memory-type-badge";
import { AgentBadge } from "@/components/shared/agent-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import { MarkdownContent } from "@/components/dashboard/markdown-content";
import { getMemoryDetail } from "@/lib/memory/queries";
import type { AgentType, Memory, MemoryDetail } from "@/lib/memory/types";

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: MemoryDetail | null = null;

  try {
    detail = await getMemoryDetail(id);
  } catch (error) {
    console.error("[MemoryDetail] Failed to fetch memory:", error);
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-muted-foreground">Memory not found</p>
        <Button variant="outline">
          <Link href="/dashboard/memories">Back to Memories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="inline-flex items-center">
        <Link href="/dashboard/memories" className="inline-flex items-center">
          <IconArrowLeft className="mr-1 h-3 w-3" />
          Back to Memories
        </Link>
      </Button>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MemoryTypeBadge type={detail.memoryType} />
                {detail.agentType && (
                  <AgentBadge type={detail.agentType as AgentType} />
                )}
              </div>
              <CardTitle className="text-lg">{detail.title}</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              <RelativeTime date={detail.createdAt} />
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MarkdownContent content={detail.content} />
        </CardContent>
      </Card>

      {/* Lineage */}
      {detail.lineage.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Lineage — what triggered this
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.lineage.map((mem: Memory) => (
              <Link
                key={mem.id}
                href={`/dashboard/memories/${mem.id}`}
                className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted/50"
              >
                <IconLink className="h-3 w-3 text-muted-foreground shrink-0" />
                <MemoryTypeBadge type={mem.memoryType} />
                {mem.agentType && (
                  <AgentBadge
                    type={mem.agentType as AgentType}
                    showIcon={false}
                  />
                )}
                <span className="truncate text-muted-foreground">
                  {mem.title}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Triggered */}
      {detail.triggered.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Triggered — {detail.triggered.length} memories resulted
              from this
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.triggered.map((mem: Memory) => (
              <Link
                key={mem.id}
                href={`/dashboard/memories/${mem.id}`}
                className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted/50"
              >
                <MemoryTypeBadge type={mem.memoryType} />
                {mem.agentType && (
                  <AgentBadge
                    type={mem.agentType as AgentType}
                    showIcon={false}
                  />
                )}
                <span className="truncate">{mem.title}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                  <RelativeTime date={mem.createdAt} />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Read trail */}
      {detail.readBy.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Read By</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {detail.readBy.map((read) => (
              <div
                key={read.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span>{read.readerAgentName ?? "Unknown"}</span>
                {read.similarityScore !== null && (
                  <span>
                    (similarity: {(read.similarityScore * 100).toFixed(0)}%)
                  </span>
                )}
                <span className="ml-auto">
                  <RelativeTime date={read.readAt} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}