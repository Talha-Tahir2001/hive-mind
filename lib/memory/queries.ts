import { query, queryOne } from "@/lib/db/client";
import type {
  Agent,
  Memory,
  MemoryDetail,
  MemoryDiff,
  MemoryRead,
  MemoryWithSimilarity,
  Run,
  RunStep,
} from "@/lib/memory/types";

// ============================================
// AGENTS
// ============================================

export async function getAgents(): Promise<Agent[]> {
  const { rows } = await query<Agent>(
    "SELECT id, name, type, description, system_prompt as \"systemPrompt\", status, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM agents ORDER BY name"
  );
  return rows;
}

export async function getAgentByType(type: string): Promise<Agent | null> {
  return queryOne<Agent>(
    `SELECT id, name, type, description, system_prompt as "systemPrompt", status, created_at as "createdAt", updated_at as "updatedAt" FROM agents WHERE type = $1`,
    [type]
  );
}

export async function updateAgentStatus(id: string, status: string): Promise<void> {
  await query(
    `UPDATE agents SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id]
  );
}

// ============================================
// RUNS
// ============================================

export async function createRun(data: {
  triggerType: string;
  triggerInput?: string;
}): Promise<Run> {
  return queryOne<Run>(
    `INSERT INTO runs (trigger_type, trigger_input, status, started_at) VALUES ($1, $2, 'running', now()) RETURNING id, trigger_type as "triggerType", trigger_input as "triggerInput", status, review_loop_count as "reviewLoopCount", started_at as "startedAt", completed_at as "completedAt", created_at as "createdAt"`,
    [data.triggerType, data.triggerInput ?? null]
  ) as Promise<Run>;
}

export async function getRun(id: string): Promise<Run | null> {
  return queryOne<Run>(
    `SELECT id, trigger_type as "triggerType", trigger_input as "triggerInput", status, review_loop_count as "reviewLoopCount", started_at as "startedAt", completed_at as "completedAt", created_at as "createdAt" FROM runs WHERE id = $1`,
    [id]
  );
}

export async function getRuns(limit = 20): Promise<Run[]> {
  const { rows } = await query<Run>(
    `SELECT id, trigger_type as "triggerType", trigger_input as "triggerInput", status, review_loop_count as "reviewLoopCount", started_at as "startedAt", completed_at as "completedAt", created_at as "createdAt" FROM runs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function updateRun(
  id: string,
  data: { status?: string; reviewLoopCount?: number; completedAt?: Date }
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  let idx = 2;

  if (data.status !== undefined) {
    sets.push(`status = $${idx++}`);
    params.push(data.status);
  }
  if (data.reviewLoopCount !== undefined) {
    sets.push(`review_loop_count = $${idx++}`);
    params.push(data.reviewLoopCount);
  }
  if (data.completedAt !== undefined) {
    sets.push(`completed_at = $${idx++}`);
    params.push(data.completedAt);
  }

  if (sets.length > 0) {
    await query(`UPDATE runs SET ${sets.join(", ")} WHERE id = $1`, params);
  }
}

// ============================================
// RUN STEPS
// ============================================

export async function createRunStep(data: {
  runId: string;
  agentId: string;
  stepOrder: number;
}): Promise<RunStep> {
  return queryOne<RunStep>(
    `INSERT INTO run_steps (run_id, agent_id, step_order, status, started_at) VALUES ($1, $2, $3, 'thinking', now()) RETURNING id, run_id as "runId", agent_id as "agentId", step_order as "stepOrder", status, input_summary as "inputSummary", output_summary as "outputSummary", duration_ms as "durationMs", started_at as "startedAt", completed_at as "completedAt", created_at as "createdAt"`,
    [data.runId, data.agentId, data.stepOrder]
  ) as Promise<RunStep>;
}

export async function getRunSteps(runId: string): Promise<RunStep[]> {
  const { rows } = await query<RunStep>(
    `SELECT rs.id, rs.run_id as "runId", rs.agent_id as "agentId", rs.step_order as "stepOrder", rs.status, rs.input_summary as "inputSummary", rs.output_summary as "outputSummary", rs.duration_ms as "durationMs", rs.started_at as "startedAt", rs.completed_at as "completedAt", rs.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM run_steps rs JOIN agents a ON rs.agent_id = a.id WHERE rs.run_id = $1 ORDER BY rs.step_order ASC`,
    [runId]
  );
  return rows;
}

export async function getRunStep(id: string): Promise<RunStep | null> {
  return queryOne<RunStep>(
    `SELECT rs.id, rs.run_id as "runId", rs.agent_id as "agentId", rs.step_order as "stepOrder", rs.status, rs.input_summary as "inputSummary", rs.output_summary as "outputSummary", rs.duration_ms as "durationMs", rs.started_at as "startedAt", rs.completed_at as "completedAt", rs.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM run_steps rs JOIN agents a ON rs.agent_id = a.id WHERE rs.id = $1`,
    [id]
  );
}

export async function updateRunStep(
  id: string,
  data: {
    status?: string;
    inputSummary?: string;
    outputSummary?: string;
    durationMs?: number;
    completedAt?: Date;
  }
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  let idx = 2;

  if (data.status !== undefined) {
    sets.push(`status = $${idx++}`);
    params.push(data.status);
  }
  if (data.inputSummary !== undefined) {
    sets.push(`input_summary = $${idx++}`);
    params.push(data.inputSummary);
  }
  if (data.outputSummary !== undefined) {
    sets.push(`output_summary = $${idx++}`);
    params.push(data.outputSummary);
  }
  if (data.durationMs !== undefined) {
    sets.push(`duration_ms = $${idx++}`);
    params.push(data.durationMs);
  }
  if (data.completedAt !== undefined) {
    sets.push(`completed_at = $${idx++}`);
    params.push(data.completedAt);
  }

  if (sets.length > 0) {
    await query(`UPDATE run_steps SET ${sets.join(", ")} WHERE id = $1`, params);
  }
}

// ============================================
// MEMORIES
// ============================================

export async function createMemory(data: {
  agentId?: string;
  runId?: string;
  memoryType: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  parentMemoryId?: string;
}): Promise<Memory> {
  // Format embedding as pgvector string
  const embeddingStr = data.embedding
    ? `[${data.embedding.join(",")}]`
    : null;

  return queryOne<Memory>(
    `INSERT INTO memories (agent_id, run_id, memory_type, title, content, embedding, metadata, parent_memory_id) VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8) RETURNING id, agent_id as "agentId", run_id as "runId", memory_type as "memoryType", title, content, embedding, metadata, parent_memory_id as "parentMemoryId", created_at as "createdAt"`,
    [
      data.agentId ?? null,
      data.runId ?? null,
      data.memoryType,
      data.title,
      data.content,
      embeddingStr,
      JSON.stringify(data.metadata ?? {}),
      data.parentMemoryId ?? null,
    ]
  ) as Promise<Memory>;
}

export async function getMemories(filters: {
  agentType?: string;
  memoryType?: string;
  runId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ memories: Memory[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.agentType) {
    conditions.push(`a.type = $${idx++}`);
    params.push(filters.agentType);
  }
  if (filters.memoryType) {
    conditions.push(`m.memory_type = $${idx++}`);
    params.push(filters.memoryType);
  }
  if (filters.runId) {
    conditions.push(`m.run_id = $${idx++}`);
    params.push(filters.runId);
  }
  if (filters.search) {
    conditions.push(`(m.title ILIKE $${idx} OR m.content ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  // Count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM memories m LEFT JOIN agents a ON m.agent_id = a.id ${where}`,
    params
  );
  const total = parseInt(countResult?.count ?? "0");

  // Rows
  const { rows } = await query<Memory>(
    `SELECT m.id, m.agent_id as "agentId", m.run_id as "runId", m.memory_type as "memoryType", m.title, m.content, m.metadata, m.parent_memory_id as "parentMemoryId", m.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM memories m LEFT JOIN agents a ON m.agent_id = a.id ${where} ORDER BY m.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return { memories: rows, total };
}

export async function getMemory(id: string): Promise<Memory | null> {
  return queryOne<Memory>(
    `SELECT m.id, m.agent_id as "agentId", m.run_id as "runId", m.memory_type as "memoryType", m.title, m.content, m.metadata, m.parent_memory_id as "parentMemoryId", m.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM memories m LEFT JOIN agents a ON m.agent_id = a.id WHERE m.id = $1`,
    [id]
  );
}

// ============================================
// SEMANTIC SEARCH
// ============================================

export async function semanticSearchMemories(
  embedding: number[],
  options: {
    threshold?: number;
    limit?: number;
    excludeRunId?: string;
  } = {}
): Promise<MemoryWithSimilarity[]> {
  const threshold = options.threshold ?? 0.7;
  const limit = options.limit ?? 5;
  const embeddingStr = `[${embedding.join(",")}]`;

  // Parameterized exclusion. `IS DISTINCT FROM` keeps memories with
  // NULL run_id (human-injected issues) visible to agents.
  const excludeClause = options.excludeRunId
    ? `AND m.run_id IS DISTINCT FROM $4`
    : "";

  const params: unknown[] = [embeddingStr, threshold, limit];
  if (options.excludeRunId) params.push(options.excludeRunId);

  const { rows } = await query<MemoryWithSimilarity>(
    `SELECT m.id, m.agent_id as "agentId", m.run_id as "runId", m.memory_type as "memoryType", m.title, m.content, m.metadata, m.parent_memory_id as "parentMemoryId", m.created_at as "createdAt", a.name as "agentName", a.type as "agentType", 1 - (m.embedding <=> $1::vector) AS similarity FROM memories m LEFT JOIN agents a ON m.agent_id = a.id WHERE m.embedding IS NOT NULL AND (1 - (m.embedding <=> $1::vector)) > $2 ${excludeClause} ORDER BY m.embedding <=> $1::vector LIMIT $3`,
    params
  );

  return rows;
}

// ============================================
// MEMORY LINEAGE
// ============================================

export async function getMemoryLineage(id: string): Promise<Memory[]> {
  const { rows } = await query<Memory>(
    `WITH RECURSIVE lineage AS ( SELECT m.id, m.agent_id, m.run_id, m.memory_type, m.title, m.content, m.metadata, m.parent_memory_id, m.created_at, 0 AS depth FROM memories m WHERE m.id = $1 UNION ALL SELECT m.id, m.agent_id, m.run_id, m.memory_type, m.title, m.content, m.metadata, m.parent_memory_id, m.created_at, l.depth + 1 FROM memories m JOIN lineage l ON m.id = l.parent_memory_id ) SELECT l.id, l.agent_id as "agentId", l.run_id as "runId", l.memory_type as "memoryType", l.title, l.content, l.metadata, l.parent_memory_id as "parentMemoryId", l.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM lineage l LEFT JOIN agents a ON l.agent_id = a.id ORDER BY l.depth DESC`,
    [id]
  );
  return rows;
}

export async function getTriggeredMemories(parentId: string): Promise<Memory[]> {
  const { rows } = await query<Memory>(
    `SELECT m.id, m.agent_id as "agentId", m.run_id as "runId", m.memory_type as "memoryType", m.title, m.content, m.metadata, m.parent_memory_id as "parentMemoryId", m.created_at as "createdAt", a.name as "agentName", a.type as "agentType" FROM memories m LEFT JOIN agents a ON m.agent_id = a.id WHERE m.parent_memory_id = $1 ORDER BY m.created_at ASC`,
    [parentId]
  );
  return rows;
}

// ============================================
// MEMORY READS
// ============================================

export async function logMemoryRead(data: {
  memoryId: string;
  readByAgentId: string;
  runId: string;
  similarityScore?: number;
}): Promise<void> {
  await query(
    `INSERT INTO memory_reads (memory_id, read_by_agent_id, run_id, similarity_score) VALUES ($1, $2, $3, $4)`,
    [data.memoryId, data.readByAgentId, data.runId, data.similarityScore ?? null]
  );
}

export async function getMemoryReads(memoryId: string): Promise<MemoryRead[]> {
  const { rows } = await query<MemoryRead>(
    `SELECT mr.id, mr.memory_id as "memoryId", mr.read_by_agent_id as "readByAgentId", mr.run_id as "runId", mr.similarity_score as "similarityScore", mr.read_at as "readAt", a.name as "readerAgentName" FROM memory_reads mr JOIN agents a ON mr.read_by_agent_id = a.id WHERE mr.memory_id = $1 ORDER BY mr.read_at ASC`,
    [memoryId]
  );
  return rows;
}

// ============================================
// MEMORY DIFF
// ============================================

export async function getMemoryDiff(
  interval: "5 minutes" | "1 hour" | "24 hours" = "5 minutes"
): Promise<MemoryDiff> {
  const diff = await queryOne<MemoryDiff>(
    `SELECT COUNT(*) AS total, COUNT(CASE WHEN memory_type = 'finding' THEN 1 END) AS findings, COUNT(CASE WHEN memory_type = 'critique' THEN 1 END) AS critiques, COUNT(CASE WHEN memory_type = 'fix' THEN 1 END) AS fixes, COUNT(CASE WHEN memory_type = 'approval' THEN 1 END) AS approvals, COUNT(CASE WHEN memory_type = 'plan' THEN 1 END) AS plans, COUNT(CASE WHEN memory_type = 'issue' THEN 1 END) AS issues FROM memories WHERE created_at > now() - INTERVAL '${interval}'`
  );

  const { rows: byAgent } = await query<
    { name: string; type: string; count: string }
  >(
    `SELECT a.name, a.type, COUNT(*)::text AS count FROM memories m LEFT JOIN agents a ON m.agent_id = a.id WHERE m.created_at > now() - INTERVAL '${interval}' GROUP BY a.name, a.type ORDER BY count DESC`
  );

  return {
    ...diff!,
    byAgent: byAgent.map((r) => ({
      name: r.name ?? "Human",
      type: r.type as MemoryDiff["byAgent"][number]["type"],
      count: parseInt(r.count),
    })),
  };
}

// ============================================
// FULL MEMORY DETAIL (for /memories/[id])
// ============================================

export async function getMemoryDetail(id: string): Promise<MemoryDetail | null> {
  const memory = await getMemory(id);
  if (!memory) return null;

  const [lineage, triggered, readBy] = await Promise.all([
    getMemoryLineage(id),
    getTriggeredMemories(id),
    getMemoryReads(id),
  ]);

  // Similar memories (would need embedding, skip if null)
  const similar: MemoryWithSimilarity[] = [];
  // This will be populated when we have real embeddings

  return {
    ...memory,
    lineage: lineage.filter((m) => m.id !== id),
    triggered,
    readBy,
    similar,
  };
}