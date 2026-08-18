import Link from "next/link";
import { MemoryTypeBadge } from "@/components/shared/memory-type-badge";
import { AgentBadge } from "@/components/shared/agent-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { Memory, AgentType } from "@/lib/memory/types";

export function MemoryCard({ memory }: { memory: Memory }) {
  const contentSnippet =
    memory.content.length > 150
      ? memory.content.slice(0, 150) + "..."
      : memory.content;

  return (
    <Link
      href={`/dashboard/memories/${memory.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MemoryTypeBadge type={memory.memoryType} />
          {memory.agentType && (
            <AgentBadge type={memory.agentType as AgentType} showIcon={false} />
          )}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          <RelativeTime date={memory.createdAt} />
        </span>
      </div>
      <h3 className="mt-2 text-sm font-medium leading-tight">{memory.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {contentSnippet}
      </p>
    </Link>
  );
}