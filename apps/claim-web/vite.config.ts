import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, "../.."), "TL_");
  const apiBase = env.TL_API_BASE ?? "http://localhost:8787";

  return {
    define: {
      __API_BASE__: JSON.stringify(apiBase),
    },
    server: {
      port: 5173,
    },
  };
});
