import "dotenv/config";
import { pool, query } from "./client";
import { generateEmbedding } from "@/lib/llm/client";

async function backfill() {
  console.log("🔄 Backfilling embeddings for memories with NULL embeddings...\n");

  const { rows } = await query<{ id: string; title: string; content: string }>(
    `SELECT id, title, content FROM memories WHERE embedding IS NULL ORDER BY created_at ASC`
  );

  console.log(`Found ${rows.length} memories without embeddings\n`);

  for (let i = 0; i < rows.length; i++) {
    const mem = rows[i];
    console.log(
      `  [${i + 1}/${rows.length}] Embedding: ${mem.title.slice(0, 50)}...`
    );

    try {
      const embedding = await generateEmbedding(`${mem.title} ${mem.content}`);
      const embeddingStr = `[${embedding.join(",")}]`;

      await pool.query(
        `UPDATE memories SET embedding = $1::vector WHERE id = $2`,
        [embeddingStr, mem.id]
      );
    } catch (error) {
      console.error(`  ❌ Failed: ${error}`);
    }
  }

  console.log("\n✅ Done!");

  const { rows: check } = await query<{ count: string }>(
    `SELECT count(*) as count FROM memories WHERE embedding IS NOT NULL`
  );
  console.log(`Memories with embeddings: ${check[0]?.count}`);

  await pool.end();
}

backfill();