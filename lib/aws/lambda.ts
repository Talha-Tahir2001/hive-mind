// ============================================
// HiveMind — AWS Lambda client
// ============================================

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import type { Memory, RunStep } from "@/lib/memory/types";

const client = new LambdaClient({
  region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1",
});

export interface AgentExecutorPayload {
  agentType: string;
  runId: string;
  stepOrder: number;
  task: string;
  parentMemoryHint?: string;
}

export interface AgentExecutorResult {
  ok: boolean;
  statusCode?: number;
  error?: string;
  step?: RunStep;
  memories?: Memory[];
}

// Invoke the Agent Executor Lambda (synchronous) and return its result.
export async function invokeAgentExecutorLambda(
  functionName: string,
  payload: AgentExecutorPayload
): Promise<AgentExecutorResult> {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: "RequestResponse",
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  const response = await client.send(command);

  if (response.StatusCode && response.StatusCode >= 400) {
    throw new Error(
      `Lambda "${functionName}" returned HTTP ${response.StatusCode}${response.FunctionError ? ` (${response.FunctionError})` : ""}`
    );
  }

  const payloadString = Buffer.from(response.Payload ?? "").toString("utf-8");
  let result: AgentExecutorResult;
  try {
    result = JSON.parse(payloadString) as AgentExecutorResult;
  } catch {
    throw new Error(
      `Lambda "${functionName}" returned non-JSON payload: ${payloadString.slice(0, 300)}`
    );
  }

  if (!result.ok) {
    throw new Error(
      `Agent executor failed: ${result.error ?? "unknown error"}`
    );
  }

  return result;
}