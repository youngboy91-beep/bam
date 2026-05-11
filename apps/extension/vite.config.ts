import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Content script build only. Background is built by scripts/build-background.mjs
// so that MV3 can load both as IIFE bundles (which Vite cannot emit in one
// pass with multiple entries).

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, "../.."), "TL_");
  const apiBase = env.TL_API_BASE ?? "http://localhost:8787";
  const buildEnv = mode === "production" ? "production" : "development";

  return {
    plugins: [react()],
    define: {
      __API_BASE__: JSON.stringify(apiBase),
      __BUILD_ENV__: JSON.stringify(buildEnv),
    },
    build: {
      emptyOutDir: false,
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
  };
});
