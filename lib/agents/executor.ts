import { invokeLLM, generateEmbedding } from "@/lib/llm/client";
import { getSystemPrompt } from "./prompts";
import { parseAgentOutput } from "./parser";
import {
  getAgentByType,
  updateAgentStatus,
  createRunStep,
  updateRunStep,
  getRunStep,
  createMemory,
  semanticSearchMemories,
  getMemories,
  logMemoryRead,
} from "@/lib/memory/queries";
import type {
  AgentMemoryOutput,
  Memory,
  MemoryWithSimilarity,
  RunStep,
} from "@/lib/memory/types";

// ============================================
// Build the user message with memory context
// ============================================

interface MemoryContext {
  similarMemories: MemoryWithSimilarity[];
  recentMemories: Memory[];
  currentRunMemories: Memory[];
}

// Cap memory content so prompts stay small and the LLM API doesn't
// drop long-running connections (a common cause of "terminated").
const MAX_CONTENT_CHARS = 2000;

function truncateContent(content: string, max = MAX_CONTENT_CHARS): string {
  if (content.length <= max) return content;
  return `${content.slice(0, max)}\n\n… [truncated]`;
}

function buildUserMessage(
  task: string,
  context: MemoryContext,
  agentType: string
): string {
  const parts: string[] = [];

  // Task
  parts.push(`## Task\n${task}`);

  // Current run context (what other agents produced in this run)
  if (context.currentRunMemories.length > 0) {
    parts.push(`## Current Run — Other Agents' Output`);
    for (const mem of context.currentRunMemories) {
      const agentLabel = mem.agentName ?? mem.agentType ?? "Unknown";
      parts.push(
        `### [${mem.memoryType}] ${mem.title} (by ${agentLabel})\n${truncateContent(mem.content)}`
      );
    }
  }

  // Similar memories from past runs
  if (context.similarMemories.length > 0) {
    parts.push(`## Relevant Past Memories (semantic search)`);
    for (const mem of context.similarMemories) {
      const agentLabel = mem.agentName ?? mem.agentType ?? "Unknown";
      const sim = mem.similarity
        ? ` (similarity: ${(mem.similarity * 100).toFixed(0)}%)`
        : "";
      parts.push(
        `### [${mem.memoryType}] ${mem.title} (by ${agentLabel}${sim})\n${truncateContent(mem.content)}`
      );
    }
  }

  // Recent memories (last actions from the hive)
  if (context.recentMemories.length > 0) {
    parts.push(`## Recent Hive Activity`);
    for (const mem of context.recentMemories) {
      const agentLabel = mem.agentName ?? mem.agentType ?? "Unknown";
      parts.push(
        `- [${mem.memoryType}] ${mem.title} (${agentLabel})`
      );
    }
  }

  // Agent-specific instructions
  if (agentType === "reviewer") {
    parts.push(
      `\n## Instruction\nReview the Coder's output above. If you find issues, write critiques. If the code is good, write an approval. Set parent_memory_id to the ID of the Coder memory you are reviewing.`
    );
  } else if (agentType === "deployer") {
    parts.push(
      `\n## Instruction\nCreate a deployment plan based on the approved code above. Set parent_memory_id to the ID of the approval memory.`
    );
  } else if (agentType === "coder") {
    parts.push(
      `\n## Instruction\nWrite code and document your findings as memories. If there are Reviewer critiques or injected issues above, address them.`
    );
  }

  return parts.join("\n\n");
}

// ============================================
// Execute a single agent
// ============================================

export async function executeAgent(params: {
  agentType: string;
  runId: string;
  stepOrder: number;
  task: string;
  parentMemoryHint?: string;
}): Promise<{ step: RunStep; memories: Memory[] }> {
  const { agentType, runId, stepOrder, task, parentMemoryHint } = params;

  // 1. Get agent
  const agent = await getAgentByType(agentType);
  if (!agent) throw new Error(`Agent not found: ${agentType}`);

  console.log(`[Executor] ${agent.name} starting (step ${stepOrder})`);

  // 2. Create run step
  const step = await createRunStep({
    runId,
    agentId: agent.id,
    stepOrder,
  });

  const stepStart = Date.now();

  try {
    // 3. Read memories — UPDATE STATUS: reading
    await updateAgentStatus(agent.id, "reading");
    await updateRunStep(step.id, { status: "reading" });

    // 3a. Semantic search for relevant memories
    let similarMemories: MemoryWithSimilarity[] = [];
    try {
      const taskEmbedding = await generateEmbedding(task);
      similarMemories = await semanticSearchMemories(taskEmbedding, {
        threshold: 0.3,
        limit: 5,
        excludeRunId: runId,
      });
    } catch (error) {
      console.warn(
        `[Executor] Semantic search failed, continuing without:`,
        error
      );
    }

    // 3b. Get recent memories (last 15 from other runs)
    const { memories: recentMemories } = await getMemories({
      limit: 15,
    });

    // 3c. Get current run memories (what other agents produced this run)
    const { memories: currentRunMemories } = await getMemories({
      runId,
    });

    // 3d. Log memory reads
    const allReadMemories: Memory[] = [
      ...similarMemories,
      ...recentMemories.slice(0, 10),
      ...currentRunMemories,
    ];

    for (const mem of allReadMemories) {
      try {
        await logMemoryRead({
          memoryId: mem.id,
          readByAgentId: agent.id,
          runId,
          similarityScore:
            "similarity" in mem
              ? (mem as MemoryWithSimilarity).similarity
              : undefined,
        });
      } catch {
        // Non-fatal — don't block execution
      }
    }

    // 4. Build prompt and call LLM — UPDATE STATUS: thinking
    await updateAgentStatus(agent.id, "thinking");
    await updateRunStep(step.id, { status: "thinking" });

    const systemPrompt = getSystemPrompt(agentType);
    const userMessage = buildUserMessage(
      task,
      { similarMemories, recentMemories, currentRunMemories },
      agentType
    );

    const inputSummary = `Read ${allReadMemories.length} memories (${similarMemories.length} similar, ${recentMemories.length} recent, ${currentRunMemories.length} from current run)`;

    await updateRunStep(step.id, { inputSummary });

    const rawResponse = await invokeLLM({
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 4096,
      temperature: 0.3,
    });

    // 5. Parse response
    const parsedMemories: AgentMemoryOutput[] = parseAgentOutput(
      rawResponse,
      agentType
    );

    // 6. Write memories — UPDATE STATUS: writing
    await updateAgentStatus(agent.id, "writing");
    await updateRunStep(step.id, { status: "writing" });

    const writtenMemories: Memory[] = [];

    for (const parsed of parsedMemories) {
      // Resolve parent_memory_id
      let parentId: string | undefined = parsed.parent_memory_id ?? undefined;

      // If not set explicitly, use the hint or auto-detect from current run
      if (!parentId && parentMemoryHint) {
        parentId = parentMemoryHint;
      } else if (!parentId && currentRunMemories.length > 0) {
        // Auto-link to the most recent memory from another agent in this run
        const fromOtherAgent = currentRunMemories.filter(
          (m) => m.agentType !== agentType
        );
        if (fromOtherAgent.length > 0) {
          parentId = fromOtherAgent[fromOtherAgent.length - 1].id;
        }
      }

      // Generate embedding
      let embedding: number[] | undefined;
      try {
        embedding = await generateEmbedding(
          `${parsed.title} ${parsed.content}`
        );
      } catch (error) {
        console.warn(
          `[Executor] Embedding generation failed for memory:`,
          error
        );
      }

      // Create memory
      const memory = await createMemory({
        agentId: agent.id,
        runId,
        memoryType: parsed.memory_type,
        title: parsed.title,
        content: parsed.content,
        embedding,
        metadata: parsed.metadata,
        parentMemoryId: parentId,
      });

      writtenMemories.push(memory);
      console.log(
        `[Executor] ${agent.name} wrote: [${parsed.memory_type}] ${parsed.title}`
      );
    }

    // 7. Update step and agent status — DONE
    const durationMs = Date.now() - stepStart;
    const outputSummary = `Wrote ${writtenMemories.length} memories: ${writtenMemories.map((m) => `[${m.memoryType}] ${m.title}`).join(", ")}`;

    await updateRunStep(step.id, {
      status: "done",
      outputSummary,
      durationMs,
      completedAt: new Date(),
    });

    await updateAgentStatus(agent.id, "done");

    // Return the final step state (not the stale createRunStep snapshot)
    const finalStep = (await getRunStep(step.id)) ?? step;

    console.log(
      `[Executor] ${agent.name} completed in ${durationMs}ms (${writtenMemories.length} memories)`
    );

    return { step: finalStep, memories: writtenMemories };
  } catch (error) {
    // Error handling
    const durationMs = Date.now() - stepStart;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await updateRunStep(step.id, {
      status: "error",
      outputSummary: `Error: ${errorMessage}`,
      durationMs,
      completedAt: new Date(),
    });

    await updateAgentStatus(agent.id, "error");

    console.error(`[Executor] ${agent.name} failed:`, errorMessage);
    throw error;
  }
}