import Link from "next/link";
import { IconDatabase } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { MemoryFeed } from "@/components/dashboard/memory-feed";
import { SemanticSearch } from "@/components/dashboard/semantic-search";
import { getMemories } from "@/lib/memory/queries";
import type { Memory } from "@/lib/memory/types";
import { MemoryExport } from "@/components/dashboard/memory-export";

interface Props {
  searchParams: Promise<{
    agent?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function MemoriesPage({ searchParams }: Props) {
  let memories: Memory[] = [];
  let total = 0;

  try {
    const params = await searchParams;
    const { agent, type, search, page } = params;
    const pageNum = parseInt(page ?? "1");
    const limit = 20;

    const result = await getMemories({
      agentType: agent && agent !== "all" ? agent : undefined,
      memoryType: type && type !== "all" ? type : undefined,
      search,
      limit,
      offset: (pageNum - 1) * limit,
    });

    memories = result.memories;
    total = result.total;
  } catch (error) {
    console.error("[MemoriesPage] Failed to fetch memories:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Shared Memories
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{`${total} `}</span> memories in the hive&apos;s collective brain
          </p>
        </div>
        <div className="flex gap-4">
          <SemanticSearch />
          <MemoryExport />
        </div>
      </div>

      {memories.length > 0 ? (
        <MemoryFeed memories={memories} />
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <IconDatabase className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No memories found. Run a pipeline to create some.
          </p>
          <Button variant="outline" size="sm">
            <Link href="/dashboard/pipeline">Run Pipeline</Link>
          </Button>
        </div>
      )}
    </div>
  );
}