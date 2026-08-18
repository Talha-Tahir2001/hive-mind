import { NextResponse } from "next/server";
import { getMemories, getAgents, getRuns } from "@/lib/memory/queries";
import { uploadMemoryExport } from "@/lib/aws/s3";


export async function POST() {
  try {
    const [agents, { memories }, runs] = await Promise.all([
      getAgents(),
      getMemories({ limit: 1000 }),
      getRuns(100),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      agents,
      memories,
      runs,
      stats: {
        totalMemories: memories.length,
        totalRuns: runs.length,
        byType: memories.reduce(
          (acc: Record<string, number>, m) => {
            acc[m.memoryType] = (acc[m.memoryType] ?? 0) + 1;
            return acc;
          },
          {}
        ),
      },
    };

    const filename = `hivemind-export-${Date.now()}.json`;
    const url = await uploadMemoryExport(
      JSON.stringify(exportData, null, 2),
      filename
    );

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("[Export] Failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}