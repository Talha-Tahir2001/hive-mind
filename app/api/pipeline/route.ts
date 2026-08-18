import { getRuns } from "@/lib/memory/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const runs = await getRuns(50);
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("[API] Failed to list runs:", error);
    return NextResponse.json({ error: "Failed to list runs" }, { status: 500 });
  }
}