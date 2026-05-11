// Builds the background service worker into dist/background.js as a single
// self-contained bundle, and copies manifest.json into dist/. Also ensures the
// dist/ directory exists before Vite writes content.js into it.

import { build } from "esbuild";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

const isWatch = process.argv.includes("--watch");

// Clean dist once up front (Vite is configured with emptyOutDir:false).
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));

const options = {
  entryPoints: [resolve(root, "src/background/index.ts")],
  bundle: true,
  outfile: resolve(dist, "background.js"),
  format: "iife",
  target: "chrome110",
  platform: "browser",
  sourcemap: true,
  logLevel: "info",
};

if (isWatch) {
  const ctx = await (await import("esbuild")).context(options);
  await ctx.watch();
  console.log("[build-background] watching...");
} else {
  await build(options);
}
