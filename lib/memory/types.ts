// ============================================
// HiveMind — Core Types
// ============================================

// Agent types
export type AgentType = "coder" | "reviewer" | "deployer";
export type AgentStatus =
  | "idle"
  | "thinking"
  | "reading"
  | "writing"
  | "done"
  | "error";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  systemPrompt: string;
  status: AgentStatus;
  createdAt: Date;
  updatedAt: Date;
  // [key: string]: unknown;
}

// Memory types
export type MemoryType =
  | "finding"
  | "critique"
  | "fix"
  | "approval"
  | "plan"
  | "issue"
  | "context";

export interface Memory {
  id: string;
  agentId: string | null;
  runId: string | null;
  memoryType: MemoryType;
  title: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  parentMemoryId: string | null;
  createdAt: Date;
  // Joined fields
  agentName?: string;
  agentType?: AgentType;
  // [key: string]: unknown;
}

// Run types
export type RunStatus = "pending" | "running" | "completed" | "failed";
export type TriggerType = "pipeline" | "issue_injection";

export interface Run {
  id: string;
  triggerType: TriggerType;
  triggerInput: string | null;
  status: RunStatus;
  reviewLoopCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  // [key: string]: unknown;
}

// Run step types
export type StepStatus =
  | "pending"
  | "thinking"
  | "reading"
  | "writing"
  | "done"
  | "error";

export interface RunStep {
  id: string;
  runId: string;
  agentId: string;
  stepOrder: number;
  status: StepStatus;
  inputSummary: string | null;
  outputSummary: string | null;
  durationMs: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  // Joined fields
  agentName?: string;
  agentType?: AgentType;
  // [key: string]: unknown;
}

// Memory read
export interface MemoryRead {
  id: string;
  memoryId: string;
  readByAgentId: string;
  runId: string;
  similarityScore: number | null;
  readAt: Date;
  // Joined fields
  readerAgentName?: string;
  // [key: string]: unknown;
}

// API response types
export interface MemoryWithSimilarity extends Memory {
  similarity: number;
}

export interface MemoryDetail extends Memory {
  lineage: Memory[];
  triggered: Memory[];
  readBy: MemoryRead[];
  similar: MemoryWithSimilarity[];
}

export interface MemoryDiff {
  total: number;
  findings: number;
  critiques: number;
  fixes: number;
  approvals: number;
  plans: number;
  issues: number;
  byAgent: { name: string; type: AgentType; count: number }[];
  // [key: string]: unknown;
}

// Agent output (parsed from Bedrock response)
export interface AgentMemoryOutput {
  memory_type: MemoryType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  parent_memory_id: string | null;
}