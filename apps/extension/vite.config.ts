import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";

// Build three entry points (content, background, popup-less for now) into dist/.
// Copy manifest.json next to them so `dist/` can be loaded as unpacked.
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      closeBundle() {
        mkdirSync(resolve(__dirname, "dist"), { recursive: true });
        copyFileSync(
          resolve(__dirname, "manifest.json"),
          resolve(__dirname, "dist/manifest.json"),
        );
      },
    },
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.tsx"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        format: "iife",
        inlineDynamicImports: false,
      },
    },
  },
});
