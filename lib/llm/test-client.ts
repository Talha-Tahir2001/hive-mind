import "dotenv/config";
import { invokeLLM, generateEmbedding } from "./client";

async function test() {
  console.log(
    "AIML_API_KEY:",
    process.env.AIML_API_KEY
      ? `✅ Set (${process.env.AIML_API_KEY.slice(0, 10)}...)`
      : "❌ Missing"
  );
  console.log("AIML_CHAT_MODEL:", process.env.AIML_CHAT_MODEL);
  console.log("AIML_EMBED_MODEL:", process.env.AIML_EMBED_MODEL);

  // --- Test 1: Basic LLM ---
  console.log("\n🧪 Test 1: LLM basic response...");
  try {
    const response = await invokeLLM({
      systemPrompt:
        "You are a test assistant. Respond with exactly: PONG",
      messages: [{ role: "user", content: "PING" }],
      maxTokens: 50,
    });
    console.log("✅ LLM response:", response.trim());
  } catch (error) {
    console.error("❌ LLM failed:", error);
  }

  // --- Test 2: Embeddings ---
  console.log("\n🧪 Test 2: Embeddings...");
  try {
    const embedding = await generateEmbedding("Hello, hive mind!");
    console.log(`✅ Embedding: ${embedding.length} dimensions`);
    console.log(
      `   First 5: [${embedding
        .slice(0, 5)
        .map((v) => v.toFixed(6))
        .join(", ")}]`
    );
  } catch (error) {
    console.error("❌ Embedding failed:", error);
  }

  // --- Test 3: Structured JSON output (CRITICAL) ---
  console.log("\n🧪 Test 3: Structured JSON output (agents need this)...");
  try {
    const response = await invokeLLM({
      systemPrompt: `You are a test assistant. You MUST respond with ONLY a valid JSON array. No markdown fences, no explanation, just raw JSON.

Respond with exactly this array:
[{"memory_type": "finding", "title": "Test finding", "content": "This is a test memory", "metadata": {"test": true}, "parent_memory_id": null}]`,
      messages: [{ role: "user", content: "Write a test memory" }],
      maxTokens: 200,
      temperature: 0,
    });

    // Clean potential markdown fences
    const cleaned = response
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed[0].memory_type &&
      parsed[0].title
    ) {
      console.log("✅ Structured output works — agents will function correctly");
      console.log("   Parsed:", JSON.stringify(parsed[0], null, 2));
    } else {
      console.log("⚠️  JSON parsed but wrong shape:", JSON.stringify(parsed));
    }
  } catch (error) {
    console.error("❌ Structured output FAILED:", error);
    console.error("   ⚠️  Agents will break with this model — try a different one");
  }

  // --- Test 4: Coder-like prompt ---
  console.log("\n🧪 Test 4: Coder agent simulation...");
  try {
    const response = await invokeLLM({
      systemPrompt: `You are the Coder agent in a hive mind system. You write code and document technical findings.

OUTPUT FORMAT — respond with ONLY a valid JSON array of memories:
[{"memory_type": "finding", "title": "Short summary", "content": "Detailed markdown content", "metadata": {}, "parent_memory_id": null}]

Write 1-2 memories. Include code in markdown code blocks within content.`,
      messages: [
        {
          role: "user",
          content: "Build a simple health check endpoint for a Node.js API.",
        },
      ],
      maxTokens: 1024,
      temperature: 0.3,
    });

    const cleaned = response
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(
        `✅ Coder simulation: ${parsed.length} memories produced`
      );
      for (const mem of parsed) {
        console.log(
          `   — [${mem.memory_type}] ${mem.title}`
        );
      }
    } else {
      console.log("⚠️  Unexpected structure:", cleaned.slice(0, 200));
    }
  } catch (error) {
    console.error("❌ Coder simulation failed:", error);
  }
}

test();