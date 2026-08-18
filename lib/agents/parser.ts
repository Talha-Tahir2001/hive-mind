import type { AgentMemoryOutput } from "@/lib/memory/types";

// ============================================
// Parse LLM response into structured memories
// ============================================

export function parseAgentOutput(
  rawResponse: string,
  agentType: string
): AgentMemoryOutput[] {
  // Step 1: Clean markdown fences if present
  let cleaned = rawResponse.trim();

  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?\s*```$/, "")
    .trim();

  // Step 2: Try to extract JSON array from the response
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Step 3: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    // Try to fix common JSON issues (trailing commas)
    const fixed = cleaned.replace(/,\s*([}\]])/g, "$1");
    try {
      parsed = JSON.parse(fixed);
    } catch {
      console.error("[Parser] Failed to parse agent output:");
      console.error(
        "  Raw response (first 500 chars):",
        rawResponse.slice(0, 500)
      );
      console.error(
        "  Cleaned (first 500 chars):",
        cleaned.slice(0, 500)
      );
      throw new Error(
        `Agent ${agentType} produced invalid JSON. Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
  }

  // Step 4: Validate structure — ensure we have an array
  if (!Array.isArray(parsed)) {
    if (typeof parsed === "object" && parsed !== null) {
      parsed = [parsed];
    } else {
      throw new Error(
        `Agent ${agentType} output is not a JSON array. Got: ${typeof parsed}`
      );
    }
  }

  // At this point, parsed is guaranteed to be an array
  // const parsedArray: unknown[] = parsed;
  const parsedArray: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

  // Step 5: Validate and normalize each memory
  const memories: AgentMemoryOutput[] = parsedArray.map(
    (item: unknown, index: number) => {
      if (typeof item !== "object" || item === null) {
        throw new Error(
          `Memory at index ${index} is not an object: ${JSON.stringify(item)}`
        );
      }

      const mem = item as Record<string, unknown>;

      return {
        memory_type: validateMemoryType(
          typeof mem.memory_type === "string" ? mem.memory_type : undefined,
          agentType
        ),
        title: String(mem.title ?? `Untitled ${agentType} memory`),
        content: String(mem.content ?? ""),
        metadata:
          typeof mem.metadata === "object" && mem.metadata !== null
            ? (mem.metadata as Record<string, unknown>)
            : {},
        parent_memory_id: validateParentId(mem.parent_memory_id),
      };
    }
  );

  if (memories.length === 0) {
    throw new Error(`Agent ${agentType} produced 0 memories`);
  }

  return memories;
}

function validateMemoryType(
  type: string | undefined,
  agentType: string
): AgentMemoryOutput["memory_type"] {
  const validTypes: Record<
    string,
    readonly AgentMemoryOutput["memory_type"][]
  > = {
    coder: ["finding", "fix", "context"],
    reviewer: ["critique", "approval"],
    deployer: ["plan"],
  };

  const allowed = validTypes[agentType] ?? [
    "finding",
    "critique",
    "fix",
    "approval",
    "plan",
    "issue",
    "context",
  ];

  if (type && (allowed as readonly string[]).includes(type)) {
    return type as AgentMemoryOutput["memory_type"];
  }

  const defaults: Record<string, AgentMemoryOutput["memory_type"]> = {
    coder: "finding",
    reviewer: "critique",
    deployer: "plan",
  };

  console.warn(
    `[Parser] Invalid memory_type "${type}" for ${agentType}, defaulting to "${defaults[agentType]}"`
  );

  return defaults[agentType] ?? "finding";
}

// function validateParentId(id: unknown): string | null {
//   if (id === null || id === undefined || id === "null") {
//     return null;
//   }
//   if (typeof id === "string" && id.length > 0) {
//     return id;
//   }
//   return null;
// }

function validateParentId(id: unknown): string | null {
  if (id === null || id === undefined || id === "null" || id === "") {
    return null;
  }
  if (typeof id === "string" && id.length > 0) {
    // Must be a valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      return id;
    }
    // Not a valid UUID — return null instead of passing garbage to the database
    console.warn(
      `[Parser] parent_memory_id "${id}" is not a valid UUID, ignoring`
    );
    return null;
  }
  return null;
}