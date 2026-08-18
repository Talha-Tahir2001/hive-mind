import { injectIssue } from "@/lib/agents/orchestrator";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, severity } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const result = await injectIssue({
      title: title.trim(),
      description: description.trim(),
      severity: severity ?? "medium",
    });

    return NextResponse.json({
      memoryId: result.memoryId,
      message: "Issue injected into shared memory",
    });
  } catch (error) {
    console.error("[API] Failed to inject issue:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to inject issue",
      },
      { status: 500 }
    );
  }
}