// ============================================
// HiveMind — Deploy Agent Executor to AWS Lambda
//
//   npm run deploy:lambda
//
// Bundles (scripts/build-lambda.mjs), zips, and
// creates/updates the function. Reads CRDB_/AIML_
// secrets from .env and injects them as function
// environment variables. AWS credentials come from
// the standard chain (env, shared credentials, IAM).
// ============================================

import { createWriteStream, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { buildBundle, BUNDLE_FILE, DIST_DIR } from "./build-lambda.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const FUNCTION_NAME = process.env.AGENT_EXECUTOR_LAMBDA ?? "hivemind-agent-executor";
const ROLE_ARN = process.env.AGENT_EXECUTOR_ROLE_ARN ?? process.env.LAMBDA_EXECUTION_ROLE_ARN;
const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
const TIMEOUT_SECONDS = Number(process.env.AGENT_EXECUTOR_TIMEOUT ?? 900);
const MEMORY_MB = Number(process.env.AGENT_EXECUTOR_MEMORY ?? 512);

const ZIP_FILE = join(DIST_DIR, "agent-executor.zip");

function loadEnvSecrets() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) throw new Error(".env not found — cannot read secrets");

  const secrets = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key || !value) continue;
    if (key.startsWith("CRDB_") || key.startsWith("AIML_")) {
      secrets[key] = value;
    }
  }
  return secrets;
}

function zipFile(filePath, zipPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.file(filePath, { name: "index.js" });
    archive.append(JSON.stringify({ type: "commonjs" }), { name: "package.json" });
    void archive.finalize();
  });
}

async function main() {
  const client = new LambdaClient({ region: REGION });

  await buildBundle();

  console.log("🗜 Zipping bundle...");
  await zipFile(BUNDLE_FILE, ZIP_FILE);
  console.log(`✅ Zip: ${ZIP_FILE} (${(statSync(ZIP_FILE).size / 1024).toFixed(0)} KB)`);

  const code = readFileSync(ZIP_FILE);
  const secrets = loadEnvSecrets();

  let exists = false;
  try {
    await client.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
    exists = true;
  } catch {
    exists = false;
  }

  if (exists) {
    console.log(`⬆️ Updating code for ${FUNCTION_NAME}...`);
    await client.send(
      new UpdateFunctionCodeCommand({ FunctionName: FUNCTION_NAME, ZipFile: code })
    );

    console.log("⚙️ Updating configuration...");
    await client.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: FUNCTION_NAME,
        Timeout: TIMEOUT_SECONDS,
        MemorySize: MEMORY_MB,
        Environment: { Variables: secrets },
      })
    );
  } else {
    if (!ROLE_ARN) {
      throw new Error(
        "Function does not exist and AGENT_EXECUTOR_ROLE_ARN / LAMBDA_EXECUTION_ROLE_ARN is not set."
      );
    }
    console.log(`🆕 Creating function ${FUNCTION_NAME}...`);
    await client.send(
      new CreateFunctionCommand({
        FunctionName: FUNCTION_NAME,
        Runtime: "nodejs20.x",
        Handler: "index.handler",
        Role: ROLE_ARN,
        Code: { ZipFile: code },
        Timeout: TIMEOUT_SECONDS,
        MemorySize: MEMORY_MB,
        Environment: { Variables: secrets },
      })
    );
  }

  console.log(`✅ ${FUNCTION_NAME} is live in ${REGION}.`);
  console.log(
    "Set AGENT_EXECUTOR_LAMBDA=<name> in the app's env to route pipeline steps through it (leave unset to run locally)."
  );
}

main().catch((error) => {
  console.error("❌ Deploy failed:", error);
  process.exit(1);
});