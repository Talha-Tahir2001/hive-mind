import { getPipelineRunStatus } from "@/lib/agents/orchestrator";
import { NextResponse } from "next/server";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const status = await getPipelineRunStatus(runId);

    if (!status) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("[API] Failed to get run status:", error);
    return NextResponse.json(
      { error: "Failed to get run status" },
      { status: 500 }
    );
  }
}