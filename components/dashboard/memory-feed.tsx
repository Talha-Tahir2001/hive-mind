import { MemoryCard } from "./memory-card";
import type { Memory } from "@/lib/memory/types";

export function MemoryFeed({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No memories yet. Run a pipeline to see activity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}