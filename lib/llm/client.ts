// ============================================
// HiveMind — LLM Client (AI/ML API)
// OpenAI-compatible API
// ============================================

const API_KEY = process.env.AIML_API_KEY;
const API_URL = process.env.AIML_API_URL ?? "https://api.aimlapi.com/v1";

if (!API_KEY) {
  throw new Error("AIML_API_KEY is not set");
}

// ============================================
// Retry helper
//
// The AI/ML API occasionally closes the TCP connection mid-request
// (undici throws `TypeError: terminated`). This helper adds a timeout
// and retries transient failures with exponential backoff.
// ============================================

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxAttempts?: number;
}

interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
}

// Fetches a URL and consumes the response BODY inside the retry loop.
// AI/ML API sometimes closes the TCP connection mid-response — reading
// the body inside this loop means those failures are retried too
// (undici throws `TypeError: terminated` when the body stream dies).
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const maxAttempts = options.maxAttempts ?? 3;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchInit: RequestInit = {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      };
      const response = await fetch(url, fetchInit);

      // Read the body here so mid-stream connection drops are retried.
      const text = await response.text();

      // Retry on transient server errors and rate limits
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          `HTTP ${response.status} from AI/ML API: ${text.slice(0, 300)}`
        );
        console.warn(
          `[LLM] Attempt ${attempt}/${maxAttempts} got HTTP ${response.status}, retrying...`
        );
        await backoff(attempt);
        continue;
      }

      return { ok: response.ok, status: response.status, text };
    } catch (error) {
      const cause =
        error instanceof Error
          ? ((error as { cause?: unknown }).cause as Error | undefined)
          : undefined;

      lastError = new Error(
        `AI/ML API request failed (attempt ${attempt}/${maxAttempts}): ${
          error instanceof Error ? error.message : String(error)
        }${cause?.message ? ` — cause: ${cause.message}` : ""}`
      );

      const isTimeout = error instanceof Error && error.name === "AbortError";

      console.warn(
        `[LLM] Attempt ${attempt}/${maxAttempts} failed${
          isTimeout ? " (timeout)" : ""
        }: ${error instanceof Error ? error.message : String(error)}${
          cause?.message ? ` [cause: ${cause.message}]` : ""
        }`
      );

      // Don't retry on abort if we're out of attempts
      if (attempt < maxAttempts) {
        await backoff(attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("AI/ML API request failed");
}

function backoff(attempt: number): Promise<void> {
  const delay = Math.min(500 * 2 ** (attempt - 1), 4000);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// ============================================
// Chat Completion
// ============================================

export async function invokeLLM(params: {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const model = process.env.AIML_CHAT_MODEL ?? "anthropic/claude-3.5-sonnet";

  // OpenAI-compatible format: system goes in the messages array
  const allMessages = [
    { role: "system" as const, content: params.systemPrompt },
    ...params.messages,
  ];

  const { ok, status, text } = await fetchWithRetry(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.3,
      messages: allMessages,
    }),
    timeoutMs: 240_000,
    maxAttempts: 3,
  });

  if (!ok) {
    throw new Error(`AI/ML API error (${status}): ${text}`);
  }

  const data = JSON.parse(text) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(`Unexpected response: ${text.slice(0, 300)}`);
  }

  return data.choices[0].message.content;
}

// ============================================
// Embeddings
// ============================================

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = process.env.AIML_EMBED_MODEL ?? "text-embedding-3-small";

  // Truncate if needed
  const truncated = text.length > 30_000 ? text.slice(0, 30_000) : text;

  try {
    return await embedWithModel(model, truncated);
  } catch (error) {
    // Fallback: if the model ID has a provider prefix (e.g. "openai/text-embedding-3-small"),
    // retry with the bare model ID in case the provider rejects the prefixed form.
    const bareModel = model.includes("/")
      ? model.split("/").slice(1).join("/")
      : null;

    if (bareModel && bareModel !== model) {
      console.warn(
        `[LLM] Embedding failed with "${model}", retrying with "${bareModel}":`,
        error instanceof Error ? error.message : String(error)
      );
      return await embedWithModel(bareModel, truncated);
    }

    throw error;
  }
}

async function embedWithModel(
  model: string,
  text: string
): Promise<number[]> {
  const { ok, status, text: bodyText } = await fetchWithRetry(`${API_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      dimensions: 1536,
    }),
    timeoutMs: 30_000,
    maxAttempts: 3,
  });

  if (!ok) {
    throw new Error(`Embedding error (${status}): ${bodyText}`);
  }

  const data = JSON.parse(bodyText) as {
    data?: Array<{ embedding?: number[] }>;
  };

  if (!data.data?.[0]?.embedding) {
    throw new Error(`Unexpected embedding response: ${bodyText.slice(0, 300)}`);
  }

  return data.data[0].embedding;
}
