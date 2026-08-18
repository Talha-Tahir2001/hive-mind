// import "dotenv/config"; // ← Add this at the very top
// import { invokeClaude, generateEmbedding } from "./bedrock";

// async function test() {
//   // Verify env vars are loaded
//   console.log("AWS_REGION:", process.env.AWS_REGION);
//   console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? `✅ Set (${process.env.AWS_ACCESS_KEY_ID.slice(0, 4)}...)` : "❌ Missing");
//   console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing");

//   console.log("\n🧪 Testing Bedrock Claude...");
//   try {
//     const response = await invokeClaude({
//       systemPrompt: "You are a test assistant. Respond with exactly: PONG",
//       messages: [{ role: "user", content: "PING" }],
//       maxTokens: 50,
//     });
//     console.log("✅ Claude response:", response.trim());
//   } catch (error) {
//     console.error("❌ Claude failed:", error);
//   }

//   console.log("\n🧪 Testing Bedrock Titan Embeddings...");
//   try {
//     const embedding = await generateEmbedding("Hello, hive mind!");
//     console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
//     console.log(`   First 5 values: [${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}]`);
//   } catch (error) {
//     console.error("❌ Titan failed:", error);
//   }
// }

// test();

import "dotenv/config";
import { runPipeline } from "../agents/orchestrator";


async function test() {
  console.log("=".repeat(60));
  console.log("🧪 PIPELINE END-TO-END TEST");
  console.log("=".repeat(60));

  // Verify env
  console.log("\n1. Environment:");
  console.log(
    "   CRDB_CONNECTION_STRING:",
    process.env.CRDB_CONNECTION_STRING
      ? `✅ Set (${process.env.CRDB_CONNECTION_STRING.split("@")[1]?.slice(0, 30)}...)`
      : "❌ Missing"
  );
  console.log(
    "   AIML_API_KEY:",
    process.env.AIML_API_KEY
      ? `✅ Set (${process.env.AIML_API_KEY.slice(0, 10)}...)`
      : "❌ Missing"
  );
  console.log("   AIML_CHAT_MODEL:", process.env.AIML_CHAT_MODEL);
  console.log("   AIML_EMBED_MODEL:", process.env.AIML_EMBED_MODEL);

  // Test DB connection
  console.log("\n2. Database:");
  try {
    const { testConnection } = await import("@/lib/db/client");
    const dbOk = await testConnection();
    if (!dbOk) {
      console.error("   ❌ Database connection failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("   ❌ Database test failed:", error);
    process.exit(1);
  }

  // Test LLM
  console.log("\n3. LLM:");
  try {
    const { invokeLLM } = await import("@/lib/llm/client");
    const response = await invokeLLM({
      systemPrompt: "Respond with exactly: PONG",
      messages: [{ role: "user", content: "PING" }],
      maxTokens: 50,
    });
    console.log("   ✅ LLM response:", response.trim());
  } catch (error) {
    console.error("   ❌ LLM test failed:", error);
    process.exit(1);
  }

  // Run pipeline
  console.log("\n4. Pipeline:");
  console.log("   Starting pipeline...");

  try {
    const run = await runPipeline(
      "Build a simple health check endpoint for a Node.js Express API. It should return { status: 'ok', timestamp } on GET /health."
    );

    console.log("\n   ✅ Pipeline completed!");
    console.log("   Run ID:", run.id);
    console.log("   Status:", run.status);
    console.log("   Duration:", run.completedAt && run.startedAt
      ? `${((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
      : "unknown"
    );

    // Get the memories created
    const { getMemories, getRunSteps } = await import(
      "@/lib/memory/queries"
    );
    const { memories } = await getMemories({ runId: run.id });
    const steps = await getRunSteps(run.id);

    console.log(`\n   Steps: ${steps.length}`);
    for (const step of steps) {
      console.log(
        `     ${step.stepOrder}. ${step.agentName} — ${step.status} (${step.durationMs ? (step.durationMs / 1000).toFixed(1) + "s" : "?"})`
      );
    }

    console.log(`\n   Memories: ${memories.length}`);
    for (const mem of memories) {
      console.log(`     [${mem.memoryType}] ${mem.title}`);
    }
  } catch (error) {
    console.error(
      "\n   ❌ Pipeline failed:",
      error instanceof Error ? error.message : String(error)
    );
  }

  process.exit(0);
}

test();