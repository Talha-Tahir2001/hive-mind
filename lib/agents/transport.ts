// ============================================
// HiveMind — Agent transport
//
// Runs an agent step either locally (in-process) or
// on AWS Lambda. Set AGENT_EXECUTOR_LAMBDA to the
// function name to distribute execution.
// ============================================

import { executeAgent } from "@/lib/agents/executor";
import { invokeAgentExecutorLambda } from "@/lib/aws/lambda";
import type { Memory, RunStep } from "@/lib/memory/types";

export interface AgentStepParams {
  agentType: string;
  runId: string;
  stepOrder: number;
  task: string;
  parentMemoryHint?: string;
}

export type AgentStepResult = { step: RunStep; memories: Memory[] };

export async function runAgentStep(
  params: AgentStepParams
): Promise<AgentStepResult> {
  const lambdaName = process.env.AGENT_EXECUTOR_LAMBDA;

  if (lambdaName) {
    console.log(
      `[Transport] Dispatching ${params.agentType} (step ${params.stepOrder}) to Lambda "${lambdaName}"`
    );
    const result = await invokeAgentExecutorLambda(lambdaName, params);
    return {
      step: result.step!,
      memories: result.memories ?? [],
    };
  }

  return await executeAgent(params);
}