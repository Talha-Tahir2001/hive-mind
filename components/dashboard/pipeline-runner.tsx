"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlayerPlay,
  IconLoader2,
  IconCode,
  IconSearch,
  IconRocket,
  IconCheck,
  IconX,
  IconBrain,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemoryTypeBadge } from "@/components/shared/memory-type-badge";
import { AgentBadge } from "@/components/shared/agent-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { RunStep, Memory, AgentType } from "@/lib/memory/types";

const agentIcons: Record<string, typeof IconCode> = {
  coder: IconCode,
  reviewer: IconSearch,
  deployer: IconRocket,
};

const agentColors: Record<string, string> = {
  coder: "text-blue-500",
  reviewer: "text-amber-500",
  deployer: "text-green-500",
};

const stepStatusIcons: Record<string, typeof IconLoader2> = {
  pending: IconLoader2,
  thinking: IconLoader2,
  reading: IconLoader2,
  writing: IconLoader2,
  done: IconCheck,
  error: IconX,
};

export function PipelineRunner() {
  const [task, setTask] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [runStatus, setRunStatus] = useState<string>("pending");

  const startPipeline = useCallback(async () => {
    if (!task.trim()) return;

    setIsStarting(true);
    setSteps([]);
    setMemories([]);
    setRunStatus("running");

    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });

      const data = await res.json();
      if (data.runId) {
        setRunId(data.runId);
      }
    } catch (error) {
      console.error("Failed to start pipeline:", error);
      setRunStatus("failed");
    } finally {
      setIsStarting(false);
    }
  }, [task]);

  // Poll for status
  useEffect(() => {
    if (!runId) return;
    if (runStatus === "completed" || runStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/${runId}`);
        const data = await res.json();

        if (data.steps) setSteps(data.steps);
        if (data.memories) setMemories(data.memories);
        if (data.run?.status) setRunStatus(data.run.status);
      } catch (error) {
        console.error("Poll failed:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, runStatus]);

  // Auto-clear task on start
  const handleStart = () => {
    startPipeline();
  };

  const isRunning = runStatus === "running";

  return (
    <div className="space-y-4">
      {/* Task input */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder="Describe a task for the hive... e.g. 'Build a user authentication service with JWT'"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={isRunning || isStarting}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleStart}
            disabled={!task.trim() || isRunning || isStarting}
            className="w-full sm:w-auto"
          >
            {isStarting ? (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconPlayerPlay className="mr-2 h-4 w-4" />
            )}
            {isStarting
              ? "Starting..."
              : isRunning
                ? "Pipeline Running..."
                : "Run Pipeline"}
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline steps */}
      {steps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconBrain className="h-4 w-4" />
              Pipeline Steps
              <Badge
                variant={
                  runStatus === "completed"
                    ? "outline"
                    : runStatus === "failed"
                      ? "destructive"
                      : "default"
                }
                className="ml-auto text-[10px]"
              >
                {runStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step) => {
              const AgentIcon =
                agentIcons[step.agentType ?? "coder"] ?? IconCode;
              const agentColor =
                agentColors[step.agentType ?? "coder"] ?? "text-foreground";
              const StatusIcon =
                stepStatusIcons[step.status] ?? IconLoader2;

              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <AgentIcon className={`mt-0.5 h-4 w-4 shrink-0 ${agentColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {step.agentName ?? "Agent"}
                      </span>
                      <Badge
                        variant={
                          step.status === "done"
                            ? "outline"
                            : step.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className={`text-[10px] ${step.status === "thinking" || step.status === "reading" || step.status === "writing" ? "animate-pulse" : ""}`}
                      >
                        {step.status}
                      </Badge>
                      {step.durationMs && (
                        <span className="text-[10px] text-muted-foreground">
                          {(step.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    {step.inputSummary && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {step.inputSummary}
                      </p>
                    )}
                    {step.outputSummary && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        → {step.outputSummary}
                      </p>
                    )}
                  </div>
                  <StatusIcon
                    className={`h-4 w-4 shrink-0 ${
                      step.status === "done"
                        ? "text-green-500"
                        : step.status === "error"
                          ? "text-red-500"
                          : "text-muted-foreground animate-spin"
                    }`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Memories created during run */}
      {memories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Memories Created ({memories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <MemoryTypeBadge type={memory.memoryType} />
                  {memory.agentType && (
                    <AgentBadge
                      type={memory.agentType as AgentType}
                      showIcon={false}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{memory.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {memory.content.slice(0, 100)}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  <RelativeTime date={memory.createdAt} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}