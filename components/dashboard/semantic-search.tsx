"use client";

import { useState } from "react";
import {
  IconSearch,
  IconLoader2,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemoryTypeBadge } from "@/components/shared/memory-type-badge";
import { AgentBadge } from "@/components/shared/agent-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { AgentType, Memory } from "@/lib/memory/types";

export function SemanticSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    (Memory & { similarity: number })[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/memories/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          threshold: 0.3,
          limit: 10,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch (error) {
      console.error("Semantic search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger >
        <Button variant="outline" size="sm">
          <IconSearch className="mr-2 h-3 w-3" />
          Semantic Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search the Hive&apos;s Brain</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Describe what you're looking for..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSearch className="h-4 w-4" />
            )}
          </Button>
        </div>

        {hasSearched && !isSearching && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No similar memories found. Try a different query.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {results.map((memory) => (
              <div
                key={memory.id}
                className="rounded-lg border p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <MemoryTypeBadge type={memory.memoryType} />
                  {memory.agentType && (
                    <AgentBadge
                      type={memory.agentType as AgentType}
                      showIcon={false}
                    />
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {(memory.similarity * 100).toFixed(0)}% similar
                  </span>
                </div>
                <p className="text-sm font-medium">{memory.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {memory.content.slice(0, 150)}...
                </p>
                <span className="text-[10px] text-muted-foreground">
                  <RelativeTime date={memory.createdAt} />
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}