// Builds the background service worker into dist/background.js as a single
// self-contained bundle, copies the right manifest.json for the target env,
// and copies the popup page. Also ensures dist/ exists before Vite writes
// content.js into it.
//
// Usage:
//   node scripts/build-background.mjs               (dev)
//   node scripts/build-background.mjs --env=prod    (production)
//   node scripts/build-background.mjs --watch

import { build, context } from "esbuild";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

const isWatch = process.argv.includes("--watch");
const envArg = process.argv.find((a) => a.startsWith("--env="));
const env = envArg ? envArg.split("=")[1] : "dev";
const isProd = env === "prod" || env === "production";

const apiBase = isProd
  ? (process.env.TL_API_BASE ?? "https://api.truthlayer.app")
  : "http://localhost:8787";

// Clean dist once; Vite is configured with emptyOutDir:false.
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// Copy the appropriate manifest. Dev manifest allows localhost host perms,
// prod manifest does NOT. Keeping them separate is how we avoid shipping a
// dev origin to the Chrome Web Store.
const manifestSrc = isProd
  ? resolve(root, "manifest.prod.json")
  : resolve(root, "manifest.json");
if (!existsSync(manifestSrc)) {
  throw new Error(`manifest not found: ${manifestSrc}`);
}
copyFileSync(manifestSrc, resolve(dist, "manifest.json"));

// Copy the popup assets (HTML + compiled JS written by another step).
const popupHtmlSrc = resolve(root, "src/popup/popup.html");
if (existsSync(popupHtmlSrc)) {
  copyFileSync(popupHtmlSrc, resolve(dist, "popup.html"));
}

const defineBlock = {
  __API_BASE__: JSON.stringify(apiBase),
  __BUILD_ENV__: JSON.stringify(isProd ? "production" : "development"),
};

// Build background.
const bgOptions = {
  entryPoints: [resolve(root, "src/background/index.ts")],
  bundle: true,
  outfile: resolve(dist, "background.js"),
  format: "iife",
  target: "chrome110",
  platform: "browser",
  sourcemap: !isProd,
  minify: isProd,
  define: defineBlock,
  logLevel: "info",
};

// Build popup (separate entry).
const popupEntry = resolve(root, "src/popup/index.ts");
const popupOptions = existsSync(popupEntry)
  ? {
      entryPoints: [popupEntry],
      bundle: true,
      outfile: resolve(dist, "popup.js"),
      format: "iife",
      target: "chrome110",
      platform: "browser",
      sourcemap: !isProd,
      minify: isProd,
      define: defineBlock,
      logLevel: "info",
    }
  : null;

if (isWatch) {
  const bgCtx = await context(bgOptions);
  await bgCtx.watch();
  if (popupOptions) {
    const popupCtx = await context(popupOptions);
    await popupCtx.watch();
  }
  console.log("[build-background] watching...");
} else {
  await build(bgOptions);
  if (popupOptions) await build(popupOptions);
}
