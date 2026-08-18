import { semanticSearchMemories } from "@/lib/memory/queries";
import { generateEmbedding } from "@/lib/llm/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, threshold, limit } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(query);
    const results = await semanticSearchMemories(embedding, {
      threshold: threshold ?? 0.5,
      limit: limit ?? 10,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API] Semantic search failed:", error);
    return NextResponse.json(
      { error: "Semantic search failed" },
      { status: 500 }
    );
  }
}