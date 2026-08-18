-- ============================================
-- HiveMind — CockroachDB Distributed Vector Index
-- Semantic search across agent memories via cosine similarity (<=>)
-- ============================================

-- 1. Unlock the schema so we can add the vector index.
--    In v26.1+ tables are created with schema_locked = true (and changefeeds
--    auto-lock watched tables). CREATE VECTOR INDEX cannot auto-unlock, so we
--    unlock manually. We intentionally leave it unlocked to keep future schema
--    changes simple.
ALTER TABLE memories SET (schema_locked = false);

-- 2. Allow vector index creation on a non-empty table.
--    This permits CRDB to backfill the index over the existing rows.
--    (Session-scoped setting; applies within this script's connection.)
SET sql_safe_updates = false;

-- 3. Create the distributed vector index (HNSW-style partitions).
--    vector_cosine_ops accelerates the <=> cosine distance operator used by
--    the semantic search query in lib/memory/queries.ts.
CREATE VECTOR INDEX IF NOT EXISTS idx_memories_embedding
  ON memories (embedding vector_cosine_ops);