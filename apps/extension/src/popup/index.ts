// Popup controller. Loads session state from storage, asks the background
// worker for quota info, and wires up the static links. Any branding or
// numeric display here MUST come from the server or from build-time config;
// no business thresholds are defined in this file.

import { FOUNDER_COMMUNITY_URL } from "../background/config";

type Plan = "anonymous" | "free" | "pro";

interface SessionSnapshot {
  plan: Plan;
  handle?: string;
  wallets_count?: number;
  usage_today?: number;
  usage_limit?: number | null; // null -> unlimited
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`element #${id} missing`);
  return el;
}

function setPlan(plan: Plan) {
  const badge = $("plan-badge");
  badge.className = `plan plan-${plan === "anonymous" ? "anon" : plan}`;
  badge.textContent =
    plan === "anonymous" ? "Anonymous" : plan === "free" ? "Free" : "Pro";
}

function renderUsage(s: SessionSnapshot) {
  const usage = s.usage_today ?? 0;
  const limit = s.usage_limit;

  if (limit === null || limit === undefined) {
    $("usage-count").textContent = `${usage.toLocaleString()} \u00B7 unlimited`;
    ($("usage-bar") as HTMLDivElement).style.width = "100%";
    return;
  }

  $("usage-count").textContent = `${usage.toLocaleString()} / ${limit.toLocaleString()}`;
  const pct = limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;
  ($("usage-bar") as HTMLDivElement).style.width = `${pct}%`;
}

function renderIdentity(s: SessionSnapshot) {
  const avatar = $("id-avatar");
  const handle = $("id-handle");
  const meta = $("id-meta");
  const ctas = $("auth-ctas");

  if (s.plan === "anonymous" || !s.handle) {
    avatar.textContent = "?";
    handle.textContent = "Not connected";
    meta.textContent = "Claim wallets to get a verified badge";
    ctas.style.display = "flex";
    return;
  }

  avatar.textContent = s.handle.slice(0, 1).toUpperCase();
  handle.textContent = `@${s.handle}`;
  const walletsText = s.wallets_count
    ? `${s.wallets_count} wallet${s.wallets_count === 1 ? "" : "s"} linked`
    : "No wallets linked";
  meta.textContent = walletsText;
  ctas.style.display = "none";
}

async function loadSnapshot(): Promise<SessionSnapshot> {
  try {
    const res = await chrome.runtime.sendMessage({ type: "TL_SESSION_SNAPSHOT" });
    if (res?.ok && res.data) return res.data as SessionSnapshot;
  } catch {
    // fall through to default
  }
  return { plan: "anonymous", usage_today: 0, usage_limit: null };
}

function wireLinks() {
  ($("community-link") as HTMLAnchorElement).href = FOUNDER_COMMUNITY_URL;

  $("claim-cta").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://truthlayer.app/claim" });
  });
  $("signin-cta").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://truthlayer.app/signin" });
  });
  $("report-issue").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "TL_REPORT_ISSUE_OPEN" });
  });
  $("settings-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage?.();
  });
}

async function main() {
  wireLinks();
  const snap = await loadSnapshot();
  setPlan(snap.plan);
  renderUsage(snap);
  renderIdentity(snap);
}

void main();
