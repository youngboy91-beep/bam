// Build-time configuration injected by Vite via import.meta.env / define.
// Production builds point at the real API; dev builds point at localhost.
//
// Do NOT put internal thresholds or scoring parameters here. This file only
// carries environment-level constants.

declare const __API_BASE__: string;
declare const __BUILD_ENV__: "development" | "production";

export const API_BASE: string =
  typeof __API_BASE__ !== "undefined" ? __API_BASE__ : "http://localhost:8787";

export const BUILD_ENV: "development" | "production" =
  typeof __BUILD_ENV__ !== "undefined" ? __BUILD_ENV__ : "development";

// Short-lived in-worker cache. TTL is intentionally small so that tier
// demotions propagate quickly; the server-side scoring version is in the
// cache key, so scoring upgrades invalidate instantly.
export const CACHE_TTL_MS = 5 * 60 * 1000;

// Founder community link shown in the popup. Kept as a constant so the URL
// is part of the build, not hot-swapped from the server.
export const FOUNDER_COMMUNITY_URL = "https://t.me/truthlayer";
