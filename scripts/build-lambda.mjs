// ============================================
// HiveMind — Build Agent Executor Lambda bundle
//
//   npm run lambda:build
//   → dist/agent-executor/index.js
// ============================================

import { build } from "esbuild";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

export const DIST_DIR = join(root, "dist", "agent-executor");
export const BUNDLE_FILE = join(DIST_DIR, "index.cjs");

export async function buildBundle() {
  console.log("📦 Bundling handler with esbuild...");
  rmSync(DIST_DIR, { recursive: true, force: true });
  mkdirSync(DIST_DIR, { recursive: true });

  await build({
    entryPoints: [join(root, "lambda", "agent-executor", "handler.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: BUNDLE_FILE,
    sourcemap: false,
    minify: true,
    external: ["pg-native"],
    alias: {
      "@": join(root),
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

  const kb = (statSync(BUNDLE_FILE).size / 1024).toFixed(0);
  console.log(`✅ Bundle: ${BUNDLE_FILE} (${kb} KB)`);
}

// Allow running directly: `node scripts/build-lambda.mjs`
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  buildBundle().catch((error) => {
    console.error("❌ Build failed:", error);
    process.exit(1);
  });
}