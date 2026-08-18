// ============================================
// HiveMind — Agent Executor Lambda
//
// Runs a single agent step on AWS Lambda so that
// pipeline execution can scale beyond one process.
// Bundled with esbuild (see scripts/deploy-lambda.mjs).
// ============================================

import { executeAgent } from "@/lib/agents/executor";

export interface AgentExecutorEvent {
  agentType: string;
  runId: string;
  stepOrder: number;
  task: string;
  parentMemoryHint?: string;
}

export async function handler(event: AgentExecutorEvent) {
  console.log("[lambda] agent-executor invoked:", {
    agentType: event.agentType,
    runId: event.runId,
    stepOrder: event.stepOrder,
    task: event.task?.slice(0, 80),
  });

  try {
    const result = await executeAgent({
      agentType: event.agentType,
      runId: event.runId,
      stepOrder: event.stepOrder,
      task: event.task,
      parentMemoryHint: event.parentMemoryHint,
    });

    return {
      statusCode: 200,
      ok: true,
      step: result.step,
      memories: result.memories,
    };
  } catch (error) {
    console.error("[lambda] agent-executor failed:", error);
    return {
      statusCode: 500,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}