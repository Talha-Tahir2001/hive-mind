import { runAgentStep } from "@/lib/agents/transport";
import {
  createRun,
  updateRun,
  getRun,
  getRunSteps,
  getMemories,
  createMemory,
} from "@/lib/memory/queries";
import { generateEmbedding } from "@/lib/llm/client";
import type { Memory, Run } from "@/lib/memory/types";

// ============================================
// Run the full pipeline
// ============================================

export async function runPipeline(
  task: string,
  existingRunId?: string
): Promise<Run> {
  // 1. Get or create run record
  let run: Run;

  if (existingRunId) {
    const existingRun = await getRun(existingRunId);
    if (!existingRun) throw new Error(`Run ${existingRunId} not found`);
    run = existingRun;
    console.log(
      `[Pipeline] Using existing run ${run.id}: "${task.slice(0, 60)}..."`
    );
  } else {
    run = await createRun({
      triggerType: "pipeline",
      triggerInput: task,
    });
    console.log(
      `[Pipeline] Created run ${run.id}: "${task.slice(0, 60)}..."`
    );
  }

  try {
    // 2. Execute Coder
    let stepOrder = 1;
    console.log(`[Pipeline] Step ${stepOrder}: Coder`);
    await runAgentStep({
      agentType: "coder",
      runId: run.id,
      stepOrder,
      task,
    });

    // 3. Review loop (max 2 iterations)
    const maxReviewLoops = 2;
    let reviewLoopCount = 0;

    while (reviewLoopCount < maxReviewLoops) {
      stepOrder++;
      console.log(`[Pipeline] Step ${stepOrder}: Reviewer (loop ${reviewLoopCount + 1})`);

      const reviewerResult = await runAgentStep({
        agentType: "reviewer",
        runId: run.id,
        stepOrder,
        task,
      });

      const lastReviewerMemory: Memory | undefined =
        reviewerResult.memories[reviewerResult.memories.length - 1];

      const isApproved = lastReviewerMemory?.memoryType === "approval";

      if (isApproved) {
        console.log(`[Pipeline] Reviewer approved. Moving to Deployer.`);
        break;
      }

      reviewLoopCount++;
      await updateRun(run.id, { reviewLoopCount });

      console.log(
        `[Pipeline] Reviewer critiqued. Coder fix loop ${reviewLoopCount}/${maxReviewLoops}`
      );

      stepOrder++;
      console.log(`[Pipeline] Step ${stepOrder}: Coder (fix)`);
      await runAgentStep({
        agentType: "coder",
        runId: run.id,
        stepOrder,
        task: `Fix the issues identified by the Reviewer. Original task: ${task}`,
        parentMemoryHint: lastReviewerMemory?.id,
      });

      if (reviewLoopCount === maxReviewLoops) {
        stepOrder++;
        console.log(`[Pipeline] Step ${stepOrder}: Reviewer (final)`);
        await runAgentStep({
          agentType: "reviewer",
          runId: run.id,
          stepOrder,
          task,
        });
        break;
      }
    }

    // 4. Execute Deployer
    stepOrder++;
    console.log(`[Pipeline] Step ${stepOrder}: Deployer`);

    const { memories: runMemories } = await getMemories({
      runId: run.id,
    });
    const approvalMemory: Memory | undefined = runMemories.find(
      (m) => m.memoryType === "approval"
    );

    await runAgentStep({
      agentType: "deployer",
      runId: run.id,
      stepOrder,
      task,
      parentMemoryHint: approvalMemory?.id,
    });

    // 5. Mark run complete
    await updateRun(run.id, {
      status: "completed",
      completedAt: new Date(),
    });

    console.log(`[Pipeline] ✅ Run ${run.id} completed successfully`);
  } catch (error) {
    await updateRun(run.id, {
      status: "failed",
      completedAt: new Date(),
    });

    console.error(
      `[Pipeline] ❌ Run ${run.id} failed:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  const finalRun = await getRun(run.id);
  return finalRun!;
}

// ============================================
// Inject an issue into shared memory
// ============================================

export async function injectIssue(params: {
  title: string;
  description: string;
  severity: string;
}): Promise<{ memoryId: string }> {
  let embedding: number[] | undefined;
  try {
    embedding = await generateEmbedding(
      `${params.title} ${params.description}`
    );
  } catch (error) {
    console.warn("[Inject] Embedding generation failed:", error);
  }

  const memory = await createMemory({
    memoryType: "issue",
    title: params.title,
    content: params.description,
    embedding,
    metadata: { severity: params.severity, source: "human" },
  });

  console.log(`[Inject] ✅ Issue injected: "${params.title}"`);

  return { memoryId: memory.id };
}

// ============================================
// Get pipeline run status
// ============================================

export async function getPipelineRunStatus(runId: string) {
  const run = await getRun(runId);
  if (!run) return null;

  const steps = await getRunSteps(runId);
  const { memories } = await getMemories({ runId });

  return { run, steps, memories };
}