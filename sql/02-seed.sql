-- ============================================
-- HiveMind — Seed Data
-- 3 past pipeline runs with full memory chains
-- ============================================

-- ============================================
-- RUN 1: Build user authentication service
-- ============================================
INSERT INTO runs (id, trigger_type, trigger_input, status, review_loop_count, started_at, completed_at, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'pipeline', 'Build a user authentication service with JWT, supporting login, logout, and token refresh.',
 'completed', 1, now() - INTERVAL '3 hours', now() - INTERVAL '3 hours' + INTERVAL '2 minutes', now() - INTERVAL '3 hours');

-- Run 1 Steps
INSERT INTO run_steps (id, run_id, agent_id, step_order, status, input_summary, output_summary, duration_ms, started_at, completed_at, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='coder'), 1, 'done',
 'Read task: Build user authentication service', 'Wrote 2 findings: auth architecture and implementation', 8000,
 now() - INTERVAL '3 hours', now() - INTERVAL '3 hours' + INTERVAL '8 seconds', now() - INTERVAL '3 hours'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='reviewer'), 2, 'done',
 'Read Coder findings. Searched memory for similar auth implementations.', 'Found 1 issue: missing token expiry. Wrote critique.', 6000,
 now() - INTERVAL '3 hours' + INTERVAL '9 seconds', now() - INTERVAL '3 hours' + INTERVAL '15 seconds', now() - INTERVAL '3 hours' + INTERVAL '9 seconds'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='coder'), 3, 'done',
 'Read Reviewer critique: missing token expiry', 'Fixed: Added 24h access token expiry and 7-day refresh rotation', 5000,
 now() - INTERVAL '3 hours' + INTERVAL '16 seconds', now() - INTERVAL '3 hours' + INTERVAL '21 seconds', now() - INTERVAL '3 hours' + INTERVAL '16 seconds'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='reviewer'), 4, 'done',
 'Read Coder fix. Verified token expiry and refresh flow.', 'Approved. Security check passed.', 3000,
 now() - INTERVAL '3 hours' + INTERVAL '22 seconds', now() - INTERVAL '3 hours' + INTERVAL '25 seconds', now() - INTERVAL '3 hours' + INTERVAL '22 seconds'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='deployer'), 5, 'done',
 'Read approval. Searched memory for past deployment patterns.', 'Deployed auth-service v1.0 to us-east-1', 7000,
 now() - INTERVAL '3 hours' + INTERVAL '26 seconds', now() - INTERVAL '3 hours' + INTERVAL '33 seconds', now() - INTERVAL '3 hours' + INTERVAL '26 seconds');

-- Run 1 Memories
INSERT INTO memories (id, agent_id, run_id, memory_type, title, content, embedding, metadata, parent_memory_id, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000001', 'finding',
 'Auth service architecture: JWT with RS256 signing',
 E'# Auth Service Architecture\n\nDesigned the authentication service with the following components:\n\n- **Token Strategy**: JWT with RS256 asymmetric signing\n- **Token Storage**: httpOnly secure cookies (not localStorage)\n- **Token Types**: Access token + Refresh token pair\n- **Session Management**: Stateless sessions with token rotation\n\n```typescript\nconst authConfig = {\n  algorithm: "RS256",\n  accessTokenExpiry: "TODO", // needs definition\n  refreshTokenExpiry: "TODO", // needs definition\n  cookieOptions: {\n    httpOnly: true,\n    secure: true,\n    sameSite: "strict"\n  }\n};\n```\n\n**Endpoints**: `/auth/login`, `/auth/logout`, `/auth/refresh`',
 NULL, '{"code_snippet": "const authConfig = {...}", "file_path": "src/auth/config.ts", "language": "typescript"}', NULL,
 now() - INTERVAL '3 hours' + INTERVAL '4 seconds'),

('c0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000001', 'finding',
 'Implemented login, logout, and refresh endpoints',
 E'# Auth Endpoints Implementation\n\nImplemented the three core auth endpoints:\n\n```typescript\n// POST /auth/login\nasync function login(req: Request): Promise<Response> {\n  const { email, password } = await req.json();\n  const user = await verifyCredentials(email, password);\n  const tokens = await generateTokenPair(user.id);\n  setAuthCookies(tokens);\n  return json({ success: true });\n}\n\n// POST /auth/logout\nasync function logout(req: Request): Promise<Response> {\n  clearAuthCookies();\n  return json({ success: true });\n}\n\n// POST /auth/refresh\nasync function refresh(req: Request): Promise<Response> {\n  const refreshToken = getCookie("refresh_token");\n  const tokens = await rotateTokens(refreshToken);\n  setAuthCookies(tokens);\n  return json({ success: true });\n}\n```\n\nAll endpoints use input validation via Zod schemas. Error responses follow RFC 7807.',
 NULL, '{"code_snippet": "async function login...", "file_path": "src/auth/routes.ts", "language": "typescript"}', 'c0000000-0000-0000-0000-000000000001',
 now() - INTERVAL '3 hours' + INTERVAL '6 seconds'),

('c0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000001', 'critique',
 'Missing token expiry configuration — security risk',
 E'# Security Review: Missing Token Expiry\n\n## Issue\nThe auth config defines `accessTokenExpiry` and `refreshTokenExpiry` as `"TODO"` — **no TTL is set on session tokens**.\n\n## Impact\n- Sessions never expire → indefinite access if token is compromised\n- No refresh token rotation → replay attack vulnerability\n- Violates OWASP Session Management guidelines (M7: Insufficient Session Expiration)\n\n## Recommendation\n- Access token: **15-30 minutes** (short-lived)\n- Refresh token: **7 days** with rotation on use\n- Add `maxAge` to cookie options\n\n## Severity\n**HIGH** — This is a security vulnerability, not a code style issue.',
 NULL, '{"severity": "high", "file_path": "src/auth/config.ts", "line_range": "7-8", "category": "security"}', 'c0000000-0000-0000-0000-000000000002',
 now() - INTERVAL '3 hours' + INTERVAL '12 seconds'),

('c0000000-0000-0000-0000-000000000004', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000001', 'fix',
 'Added 24h access token expiry and 7-day refresh token rotation',
 E'# Fix: Token Expiry Configuration\n\nAddressed the security issue flagged by Reviewer.\n\n```typescript\nconst authConfig = {\n  algorithm: "RS256",\n  accessTokenExpiry: "24h",        // was: "TODO"\n  refreshTokenExpiry: "7d",        // was: "TODO"\n  cookieOptions: {\n    httpOnly: true,\n    secure: true,\n    sameSite: "strict",\n    maxAge: 7 * 24 * 60 * 60       // 7 days in seconds\n  },\n  rotation: {\n    enabled: true,                  // rotate refresh token on each use\n    reuseGracePeriod: "5m"          // allow brief reuse window\n  }\n};\n```\n\nAlso added token expiry validation middleware:\n```typescript\nfunction validateTokenExpiry(token: JwtPayload): void {\n  if (!token.exp) throw new AuthError("Token missing expiry");\n  if (token.exp < Date.now() / 1000) throw new AuthError("Token expired");\n}\n```',
 NULL, '{"code_snippet": "const authConfig = {...}", "file_path": "src/auth/config.ts", "language": "typescript", "fix_type": "security"}', 'c0000000-0000-0000-0000-000000000003',
 now() - INTERVAL '3 hours' + INTERVAL '18 seconds'),

('c0000000-0000-0000-0000-000000000005', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000001', 'approval',
 'Approved — token expiry and refresh flow are correct',
 E'# Review: Approved ✅\n\nThe Coder has addressed the security issue:\n\n- ✅ Access token expiry set to 24h (reasonable for API access)\n- ✅ Refresh token expiry set to 7d with rotation\n- ✅ Cookie maxAge set to match refresh token lifetime\n- ✅ Token expiry validation middleware added\n- ✅ Refresh token rotation prevents replay attacks\n\n**Note**: Consider shortening access token to 15m for higher-security contexts, but 24h is acceptable for this service.\n\n**Verdict**: Ready for deployment.',
 NULL, '{"severity": "low", "category": "security", "verdict": "approved"}', 'c0000000-0000-0000-0000-000000000004',
 now() - INTERVAL '3 hours' + INTERVAL '23 seconds'),

('c0000000-0000-0000-0000-000000000006', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000001', 'plan',
 'Deploy auth-service v1.0 to us-east-1',
 E'# Deployment Plan: auth-service v1.0\n\n## Target\n- **Environment**: production\n- **Region**: us-east-1\n- **Service**: auth-service\n- **Version**: v1.0\n\n## Steps\n1. Build Docker image: `docker build -t auth-service:v1.0 .`\n2. Push to ECR: `docker push <account>.dkr.ecr.us-east-1.amazonaws.com/auth-service:v1.0`\n3. Update ECS task definition with new image tag\n4. Rolling deploy via ECS: `aws ecs update-service --cluster prod --service auth-service`\n5. Wait for stable: monitor health check `/health` for 200 OK\n6. Verify: test `/auth/login` with test credentials\n\n## Required Environment Variables\n```env\nJWT_PRIVATE_KEY=<from-secrets-manager>\nJWT_PUBLIC_KEY=<from-secrets-manager>\nDATABASE_URL=<from-secrets-manager>\n```\n\n## Health Check\n```\nGET https://auth-service.internal/health\nExpected: 200 OK, { "status": "healthy" }\n```\n\n## Rollback\nIf deployment fails:\n1. `aws ecs update-service --cluster prod --service auth-service --task-definition auth-service:v0.9`\n2. Verify health check on previous version\n3. Alert on-call via PagerDuty',
 NULL, '{"target_env": "production", "region": "us-east-1", "service_name": "auth-service", "version": "v1.0"}', 'c0000000-0000-0000-0000-000000000005',
 now() - INTERVAL '3 hours' + INTERVAL '30 seconds');


-- ============================================
-- RUN 2: Build payment processing module
-- ============================================
INSERT INTO runs (id, trigger_type, trigger_input, status, review_loop_count, started_at, completed_at, created_at) VALUES
('a0000000-0000-0000-0000-000000000002', 'pipeline', 'Build a payment processing module with Stripe integration, supporting charges, refunds, and webhook handling.',
 'completed', 1, now() - INTERVAL '2 hours', now() - INTERVAL '2 hours' + INTERVAL '2 minutes', now() - INTERVAL '2 hours');

-- Run 2 Steps
INSERT INTO run_steps (id, run_id, agent_id, step_order, status, input_summary, output_summary, duration_ms, started_at, completed_at, created_at) VALUES
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='coder'), 1, 'done',
 'Read task: Build payment processing module', 'Wrote 2 findings: payment architecture and implementation', 9000,
 now() - INTERVAL '2 hours', now() - INTERVAL '2 hours' + INTERVAL '9 seconds', now() - INTERVAL '2 hours'),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='reviewer'), 2, 'done',
 'Read Coder findings. Checked against past review patterns.', 'Found 1 issue: no idempotency key validation. Wrote critique.', 7000,
 now() - INTERVAL '2 hours' + INTERVAL '10 seconds', now() - INTERVAL '2 hours' + INTERVAL '17 seconds', now() - INTERVAL '2 hours' + INTERVAL '10 seconds'),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='coder'), 3, 'done',
 'Read Reviewer critique: missing idempotency', 'Fixed: Added idempotency key validation with Redis dedup', 6000,
 now() - INTERVAL '2 hours' + INTERVAL '18 seconds', now() - INTERVAL '2 hours' + INTERVAL '24 seconds', now() - INTERVAL '2 hours' + INTERVAL '18 seconds'),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='reviewer'), 4, 'done',
 'Read Coder fix. Verified idempotency pattern.', 'Approved. Duplicate charge risk mitigated.', 4000,
 now() - INTERVAL '2 hours' + INTERVAL '25 seconds', now() - INTERVAL '2 hours' + INTERVAL '29 seconds', now() - INTERVAL '2 hours' + INTERVAL '25 seconds'),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='deployer'), 5, 'done',
 'Read approval. Searched memory for past payment deployments.', 'Deployed payment-service v1.0 to us-east-1', 8000,
 now() - INTERVAL '2 hours' + INTERVAL '30 seconds', now() - INTERVAL '2 hours' + INTERVAL '38 seconds', now() - INTERVAL '2 hours' + INTERVAL '30 seconds');

-- Run 2 Memories
INSERT INTO memories (id, agent_id, run_id, memory_type, title, content, embedding, metadata, parent_memory_id, created_at) VALUES
('c0000000-0000-0000-0000-000000000007', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000002', 'finding',
 'Payment module architecture: Stripe integration with webhook handlers',
 E'# Payment Module Architecture\n\nDesigned the payment processing service:\n\n- **Payment Provider**: Stripe (server-side SDK)\n- **Idempotency**: TODO — needs idempotency key handling\n- **Webhook**: Stripe webhook handler with signature verification\n- **Error Handling**: Retry with exponential backoff for transient failures\n\n```typescript\nconst paymentConfig = {\n  provider: "stripe",\n  apiVersion: "2024-06-20",\n  webhookTolerance: 300, // 5 min clock skew tolerance\n  retry: {\n    maxAttempts: 3,\n    backoffMs: 1000,\n    maxBackoffMs: 10000\n  }\n};\n```\n\n**Endpoints**: `/payments/charge`, `/payments/refund`, `/payments/webhook`',
 NULL, '{"code_snippet": "const paymentConfig = {...}", "file_path": "src/payments/config.ts", "language": "typescript"}', NULL,
 now() - INTERVAL '2 hours' + INTERVAL '4 seconds'),

('c0000000-0000-0000-0000-000000000008', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000002', 'finding',
 'Implemented charge, refund, and webhook endpoints',
 E'# Payment Endpoints Implementation\n\n```typescript\n// POST /payments/charge\nasync function charge(req: Request): Promise<Response> {\n  const { amount, currency, customerId, idempotencyKey } = await req.json();\n  const result = await stripe.paymentIntents.create({\n    amount: Math.round(amount * 100),\n    currency,\n    customer: customerId,\n    // idempotency key NOT being validated yet\n  });\n  return json({ chargeId: result.id, status: result.status });\n}\n\n// POST /payments/refund\nasync function refund(req: Request): Promise<Response> {\n  const { chargeId, amount, reason } = await req.json();\n  const result = await stripe.refunds.create({\n    payment_intent: chargeId,\n    amount: amount ? Math.round(amount * 100) : undefined,\n    reason\n  });\n  return json({ refundId: result.id, status: result.status });\n}\n```\n\nWebhook handler verifies Stripe signature before processing events.',
 NULL, '{"code_snippet": "async function charge...", "file_path": "src/payments/routes.ts", "language": "typescript"}', 'c0000000-0000-0000-0000-000000000007',
 now() - INTERVAL '2 hours' + INTERVAL '7 seconds'),

('c0000000-0000-0000-0000-000000000009', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 'critique',
 'No idempotency key validation — risk of duplicate charges',
 E'# Review: Missing Idempotency Key Validation\n\n## Issue\nThe charge endpoint accepts an `idempotencyKey` parameter but **never validates or deduplicates** it.\n\n```typescript\n// Current: idempotency key is accepted but ignored\nconst result = await stripe.paymentIntents.create({\n  amount: Math.round(amount * 100),\n  currency,\n  customer: customerId,\n  // idempotency key NOT being validated yet  ← PROBLEM\n});\n```\n\n## Impact\n- Network retries create **duplicate charges**\n- Customer gets charged twice for the same operation\n- This is a **financial correctness bug** — the most critical type\n\n## Recommendation\n- Store idempotency keys in Redis with TTL matching the operation window\n- Before creating a charge, check if the key exists → return cached result\n- Pass the key to Stripe as the `Idempotency-Key` header\n\n## Severity\n**CRITICAL** — Duplicate charges are a financial and legal risk.',
 NULL, '{"severity": "critical", "file_path": "src/payments/routes.ts", "line_range": "5-10", "category": "correctness"}', 'c0000000-0000-0000-0000-000000000008',
 now() - INTERVAL '2 hours' + INTERVAL '14 seconds'),

('c0000000-0000-0000-0000-000000000010', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000002', 'fix',
 'Added idempotency key validation with Redis-backed dedup cache',
 E'# Fix: Idempotency Key Validation\n\nAddressed the critical issue flagged by Reviewer.\n\n```typescript\n// Idempotency middleware\nasync function withIdempotency(\n  key: string,\n  handler: () => Promise<Response>\n): Promise<Response> {\n  // Check if we already processed this request\n  const cached = await redis.get(`idem:${key}`);\n  if (cached) {\n    return json(JSON.parse(cached), { status: 200 }); // return cached result\n  }\n\n  // Execute and cache\n  const result = await handler();\n  const body = await result.clone().json();\n  await redis.set(`idem:${key}`, JSON.stringify(body), "EX", 86400); // 24h TTL\n  return result;\n}\n\n// Updated charge endpoint\nasync function charge(req: Request): Promise<Response> {\n  const { amount, currency, customerId, idempotencyKey } = await req.json();\n  return withIdempotency(idempotencyKey, async () => {\n    const result = await stripe.paymentIntents.create(\n      { amount: Math.round(amount * 100), currency, customer: customerId },\n      { idempotencyKey }  // also pass to Stripe\n    );\n    return json({ chargeId: result.id, status: result.status });\n  });\n}\n```',
 NULL, '{"code_snippet": "async function withIdempotency...", "file_path": "src/payments/idempotency.ts", "language": "typescript", "fix_type": "correctness"}', 'c0000000-0000-0000-0000-000000000009',
 now() - INTERVAL '2 hours' + INTERVAL '20 seconds'),

('c0000000-0000-0000-0000-000000000011', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 'approval',
 'Approved — idempotency pattern correctly handles duplicates',
 E'# Review: Approved ✅\n\nThe Coder has addressed the critical idempotency issue:\n\n- ✅ Redis-backed dedup cache with 24h TTL\n- ✅ Returns cached result on duplicate key\n- ✅ Idempotency key also passed to Stripe API\n- ✅ Middleware pattern is reusable for other endpoints\n\n**Minor note**: Consider adding idempotency key validation (format/length) before Redis lookup to prevent abuse, but this is not blocking.\n\n**Verdict**: Ready for deployment.',
 NULL, '{"severity": "low", "category": "correctness", "verdict": "approved"}', 'c0000000-0000-0000-0000-000000000010',
 now() - INTERVAL '2 hours' + INTERVAL '27 seconds'),

('c0000000-0000-0000-0000-000000000012', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000002', 'plan',
 'Deploy payment-service v1.0 to us-east-1',
 E'# Deployment Plan: payment-service v1.0\n\n## Target\n- **Environment**: production\n- **Region**: us-east-1\n- **Service**: payment-service\n- **Version**: v1.0\n\n## Steps\n1. Build Docker image: `docker build -t payment-service:v1.0 .`\n2. Push to ECR\n3. Update ECS task definition\n4. Rolling deploy with 50% minimum healthy percent\n5. Verify: test `/payments/charge` with test Stripe key in sandbox mode\n6. Monitor Stripe dashboard for test charge\n\n## Required Environment Variables\n```env\nSTRIPE_API_KEY=<from-secrets-manager>\nSTRIPE_WEBHOOK_SECRET=<from-secrets-manager>\nREDIS_URL=<from-secrets-manager>\nDATABASE_URL=<from-secrets-manager>\n```\n\n## Rollback\n1. Revert ECS task to payment-service:v0.9\n2. Verify no charges are processing\n3. Alert finance team if any duplicate charges detected',
 NULL, '{"target_env": "production", "region": "us-east-1", "service_name": "payment-service", "version": "v1.0"}', 'c0000000-0000-0000-0000-000000000011',
 now() - INTERVAL '2 hours' + INTERVAL '35 seconds');


-- ============================================
-- RUN 3: Build rate limiter middleware
-- ============================================
INSERT INTO runs (id, trigger_type, trigger_input, status, review_loop_count, started_at, completed_at, created_at) VALUES
('a0000000-0000-0000-0000-000000000003', 'pipeline', 'Build a rate limiter middleware with per-IP and per-user limits using a sliding window counter.',
 'completed', 0, now() - INTERVAL '1 hour', now() - INTERVAL '1 hour' + INTERVAL '1 minute', now() - INTERVAL '1 hour');

-- Run 3 Steps
INSERT INTO run_steps (id, run_id, agent_id, step_order, status, input_summary, output_summary, duration_ms, started_at, completed_at, created_at) VALUES
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='coder'), 1, 'done',
 'Read task: Build rate limiter middleware', 'Wrote 2 findings: rate limiter design and implementation', 7000,
 now() - INTERVAL '1 hour', now() - INTERVAL '1 hour' + INTERVAL '7 seconds', now() - INTERVAL '1 hour'),
('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='reviewer'), 2, 'done',
 'Read Coder findings. Checked rate limiter patterns.', 'Clean implementation. Approved.', 5000,
 now() - INTERVAL '1 hour' + INTERVAL '8 seconds', now() - INTERVAL '1 hour' + INTERVAL '13 seconds', now() - INTERVAL '1 hour' + INTERVAL '8 seconds'),
('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='deployer'), 3, 'done',
 'Read approval. Searched for past middleware deployments.', 'Deployed rate-limiter v1.0 as shared middleware', 6000,
 now() - INTERVAL '1 hour' + INTERVAL '14 seconds', now() - INTERVAL '1 hour' + INTERVAL '20 seconds', now() - INTERVAL '1 hour' + INTERVAL '14 seconds');

-- Run 3 Memories
INSERT INTO memories (id, agent_id, run_id, memory_type, title, content, embedding, metadata, parent_memory_id, created_at) VALUES
('c0000000-0000-0000-0000-000000000013', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000003', 'finding',
 'Rate limiter design: sliding window counter with per-IP and per-user limits',
 E'# Rate Limiter Design\n\nDesigned a rate limiting middleware using the sliding window counter algorithm:\n\n- **Algorithm**: Sliding window counter (hybrid of fixed window + sliding log)\n- **Storage**: Redis sorted sets for O(1) counter operations\n- **Limits**: Per-IP (100 req/min) and per-user (1000 req/min)\n- **Response**: 429 Too Many Requests with Retry-After header\n\n```typescript\ninterface RateLimitConfig {\n  windowMs: number;       // window size in ms\n  maxRequests: number;    // max requests per window\n  keyPrefix: string;      // "ip" or "user"\n}\n\nconst limits = {\n  ip: { windowMs: 60_000, maxRequests: 100, keyPrefix: "rl:ip" },\n  user: { windowMs: 60_000, maxRequests: 1000, keyPrefix: "rl:user" }\n};\n```',
 NULL, '{"code_snippet": "interface RateLimitConfig {...}", "file_path": "src/middleware/rate-limiter.ts", "language": "typescript"}', NULL,
 now() - INTERVAL '1 hour' + INTERVAL '3 seconds'),

('c0000000-0000-0000-0000-000000000014', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000003', 'finding',
 'Implemented rateLimiter middleware with configurable windows',
 E'# Rate Limiter Implementation\n\n```typescript\nasync function rateLimiter(\n  req: Request,\n  config: RateLimitConfig,\n  identifier: string\n): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {\n  const now = Date.now();\n  const windowStart = now - config.windowMs;\n  const key = `${config.keyPrefix}:${identifier}`;\n\n  // Remove expired entries and add current request\n  const pipeline = redis.pipeline();\n  pipeline.zremrangebyscore(key, 0, windowStart);\n  pipeline.zadd(key, now, `${now}:${Math.random()}`);\n  pipeline.zcard(key);\n  pipeline.expire(key, Math.ceil(config.windowMs / 1000));\n\n  const results = await pipeline.exec();\n  const count = results[2][1] as number;\n\n  return {\n    allowed: count <= config.maxRequests,\n    remaining: Math.max(0, config.maxRequests - count),\n    resetAt: now + config.windowMs\n  };\n}\n```\n\nReturns 429 with `Retry-After` header when rate limit exceeded.',
 NULL, '{"code_snippet": "async function rateLimiter...", "file_path": "src/middleware/rate-limiter.ts", "language": "typescript"}', 'c0000000-0000-0000-0000-000000000013',
 now() - INTERVAL '1 hour' + INTERVAL '5 seconds'),

('c0000000-0000-0000-0000-000000000015', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000003', 'approval',
 'Approved — clean implementation with proper 429 responses and good defaults',
 E'# Review: Approved ✅\n\nThe rate limiter implementation is clean and correct:\n\n- ✅ Sliding window algorithm properly removes expired entries\n- ✅ Redis pipeline minimizes round trips (4 commands in 1 pipeline)\n- ✅ Returns useful metadata: `remaining`, `resetAt`\n- ✅ 429 response includes `Retry-After` header\n- ✅ Configurable limits per key type (IP vs user)\n- ✅ Key expiration prevents Redis memory bloat\n\n**No issues found.** The implementation follows established rate limiting patterns seen in past reviews.\n\n**Verdict**: Ready for deployment.',
 NULL, '{"severity": null, "category": "architecture", "verdict": "approved"}', 'c0000000-0000-0000-0000-000000000014',
 now() - INTERVAL '1 hour' + INTERVAL '11 seconds'),

('c0000000-0000-0000-0000-000000000016', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000003', 'plan',
 'Deploy rate-limiter v1.0 as shared middleware',
 E'# Deployment Plan: rate-limiter v1.0\n\n## Target\n- **Environment**: production\n- **Region**: us-east-1\n- **Type**: Shared middleware (applied to all services)\n- **Version**: v1.0\n\n## Configuration\n```env\nRATE_LIMIT_IP_MAX=100         # requests per minute per IP\nRATE_LIMIT_USER_MAX=1000      # requests per minute per user\nRATE_LIMIT_WINDOW_MS=60000    # 1 minute sliding window\nREDIS_URL=<from-secrets-manager>\n```\n\n## Steps\n1. Deploy as standalone middleware service\n2. Configure API gateway to route all requests through rate-limiter\n3. Apply to: auth-service, payment-service, and all future services\n4. Monitor Redis memory usage and rate limit counter distribution\n\n## Rollback\n1. Remove rate-limiter from API gateway routing\n2. Services continue without rate limiting (acceptable short-term)',
 NULL, '{"target_env": "production", "region": "us-east-1", "service_name": "rate-limiter", "version": "v1.0", "type": "middleware"}', 'c0000000-0000-0000-0000-000000000015',
 now() - INTERVAL '1 hour' + INTERVAL '17 seconds');


-- ============================================
-- MEMORY READS
-- Show that agents read each other's memories
-- ============================================

-- Run 1: Reviewer reads Coder's findings
INSERT INTO memory_reads (memory_id, read_by_agent_id, run_id, similarity_score, read_at) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000001', 0.92, now() - INTERVAL '3 hours' + INTERVAL '9 seconds'),
('c0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000001', 0.95, now() - INTERVAL '3 hours' + INTERVAL '9 seconds'),
-- Coder reads Reviewer's critique (for the fix)
('c0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000001', 0.88, now() - INTERVAL '3 hours' + INTERVAL '16 seconds'),
-- Reviewer reads Coder's fix
('c0000000-0000-0000-0000-000000000004', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000001', 0.91, now() - INTERVAL '3 hours' + INTERVAL '22 seconds'),
-- Deployer reads approval + Coder's findings
('c0000000-0000-0000-0000-000000000005', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000001', 0.85, now() - INTERVAL '3 hours' + INTERVAL '26 seconds'),
('c0000000-0000-0000-0000-000000000002', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000001', 0.78, now() - INTERVAL '3 hours' + INTERVAL '26 seconds');

-- Run 2: Same pattern
INSERT INTO memory_reads (memory_id, read_by_agent_id, run_id, similarity_score, read_at) VALUES
('c0000000-0000-0000-0000-000000000007', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 0.93, now() - INTERVAL '2 hours' + INTERVAL '10 seconds'),
('c0000000-0000-0000-0000-000000000008', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 0.94, now() - INTERVAL '2 hours' + INTERVAL '10 seconds'),
('c0000000-0000-0000-0000-000000000009', (SELECT id FROM agents WHERE type='coder'), 'a0000000-0000-0000-0000-000000000002', 0.89, now() - INTERVAL '2 hours' + INTERVAL '18 seconds'),
('c0000000-0000-0000-0000-000000000010', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 0.92, now() - INTERVAL '2 hours' + INTERVAL '25 seconds'),
('c0000000-0000-0000-0000-000000000011', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000002', 0.86, now() - INTERVAL '2 hours' + INTERVAL '30 seconds'),
('c0000000-0000-0000-0000-000000000008', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000002', 0.79, now() - INTERVAL '2 hours' + INTERVAL '30 seconds');

-- Run 3: Same pattern
INSERT INTO memory_reads (memory_id, read_by_agent_id, run_id, similarity_score, read_at) VALUES
('c0000000-0000-0000-0000-000000000013', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000003', 0.91, now() - INTERVAL '1 hour' + INTERVAL '8 seconds'),
('c0000000-0000-0000-0000-000000000014', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000003', 0.93, now() - INTERVAL '1 hour' + INTERVAL '8 seconds'),
('c0000000-0000-0000-0000-000000000015', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000003', 0.87, now() - INTERVAL '1 hour' + INTERVAL '14 seconds'),
('c0000000-0000-0000-0000-000000000014', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000003', 0.80, now() - INTERVAL '1 hour' + INTERVAL '14 seconds');

-- Cross-run reads: agents also read memories from PREVIOUS runs
-- This is the HIVE MIND concept — agents benefit from past runs
INSERT INTO memory_reads (memory_id, read_by_agent_id, run_id, similarity_score, read_at) VALUES
-- Run 2 Reviewer reads Run 1 security critique (learns from past review patterns)
('c0000000-0000-0000-0000-000000000003', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000002', 0.72, now() - INTERVAL '2 hours' + INTERVAL '10 seconds'),
-- Run 3 Reviewer reads Run 1 and Run 2 approval patterns
('c0000000-0000-0000-0000-000000000005', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000003', 0.68, now() - INTERVAL '1 hour' + INTERVAL '8 seconds'),
('c0000000-0000-0000-0000-000000000011', (SELECT id FROM agents WHERE type='reviewer'), 'a0000000-0000-0000-0000-000000000003', 0.71, now() - INTERVAL '1 hour' + INTERVAL '8 seconds'),
-- Run 3 Deployer reads Run 1 and Run 2 deployment plans (learns deployment patterns)
('c0000000-0000-0000-0000-000000000006', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000003', 0.83, now() - INTERVAL '1 hour' + INTERVAL '14 seconds'),
('c0000000-0000-0000-0000-000000000012', (SELECT id FROM agents WHERE type='deployer'), 'a0000000-0000-0000-0000-000000000003', 0.81, now() - INTERVAL '1 hour' + INTERVAL '14 seconds');