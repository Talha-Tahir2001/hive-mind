import { getAgents } from "@/lib/memory/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[API] Failed to get agents:", error);
    return NextResponse.json({ error: "Failed to get agents" }, { status: 500 });
  }
}