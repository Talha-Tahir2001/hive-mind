import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Singleton client
const globalForBedrock = globalThis as unknown as {
  bedrockClient: BedrockRuntimeClient | undefined;
};

export const bedrockClient =
  globalForBedrock.bedrockClient ??
  new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForBedrock.bedrockClient = bedrockClient;
}

// ============================================
// Claude — Agent Reasoning
// ============================================

export async function invokeClaude(params: {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const modelId =
    process.env.BEDROCK_CLAUDE_MODEL_ID ??
    "anthropic.claude-3-5-sonnet-20241022-v2:0";

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.3,
      system: params.systemPrompt,
      messages: params.messages,
    }),
  });

  const response = await bedrockClient.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));

  if (body.stop_reason === "max_tokens") {
    console.warn("[Bedrock] Claude hit max_tokens limit");
  }

  return body.content[0].text;
}

// ============================================
// Titan — Embeddings
// ============================================

export async function generateEmbedding(text: string): Promise<number[]> {
  const modelId =
    process.env.BEDROCK_TITAN_EMBED_MODEL_ID ??
    "amazon.titan-embed-text-v2:0";

  // Titan has a max input of 8192 tokens
  // Truncate if needed (rough: 1 token ≈ 4 chars)
  const truncated = text.length > 32_000 ? text.slice(0, 32_000) : text;

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inputText: truncated,
      dimensions: 1536,
      embeddingTypes: { float: true },
    }),
  });

  const response = await bedrockClient.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));

  return body.embedding;
}