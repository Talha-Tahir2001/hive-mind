import { runPipeline } from "@/lib/agents/orchestrator";
import { createRun } from "@/lib/memory/queries";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = body.task;

    if (!task || typeof task !== "string" || task.trim().length === 0) {
      return NextResponse.json(
        { error: "Task description is required" },
        { status: 400 }
      );
    }

    // Create run FIRST so we can return the ID immediately
    const run = await createRun({
      triggerType: "pipeline",
      triggerInput: task.trim(),
    });

    console.log(
      `[API] Pipeline triggered: run ${run.id}, task: "${task.trim().slice(0, 60)}..."`
    );

    // Fire-and-forget: pipeline runs in background
    // Pass the runId so it uses the SAME run, not a duplicate
    runPipeline(task.trim(), run.id).catch((error) => {
      console.error(
        `[API] Pipeline execution error for run ${run.id}:`,
        error
      );
    });

    return NextResponse.json({
      runId: run.id,
      status: "running",
      message: "Pipeline started",
    });
  } catch (error) {
    console.error("[API] Failed to start pipeline:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start pipeline",
      },
      { status: 500 }
    );
  }
}