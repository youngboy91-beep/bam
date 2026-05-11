import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Vite builds ONLY the content script (React + JSX + Shadow DOM).
// The background service worker is built separately via esbuild in scripts/build-background.mjs
// because MV3 content scripts must be a single self-contained IIFE (no code-splitting),
// which Vite cannot produce with multiple entry points in one invocation.

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false, // background/manifest are written by a separate step
    outDir: "dist",
    rollupOptions: {
      input: resolve(__dirname, "src/content/index.tsx"),
      output: {
        entryFileNames: "content.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
