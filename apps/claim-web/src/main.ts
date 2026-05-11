// Orchestrator for the /claim flow.
//
// State machine:
//   step1_handle   -> user enters X handle
//   step2_wallet   -> user connects wallet (EVM or Solana)
//   step3_sign     -> fetch nonce, display message, sign, submit claim
//   success        -> A-tier badge confirmed
//
// Invariants:
//   - The signed message string is the server's canonical one (from /claim/nonce).
//     We NEVER build the message client-side with our own template.
//   - On any API/wallet error we keep the user on the current step with a
//     toast. No silent failures.

import type { Chain } from "@truthlayer/shared";
import { ensureSession } from "./session";
import { requestNonce, submitClaim } from "./api";
import { connectEvm, signEvmMessage } from "./wallets/evm";
import { connectSolana, signSolanaMessage } from "./wallets/solana";

interface State {
  token: string;
  handle: string;
  chain?: Chain;
  address?: string;
  nonce?: string;
  message?: string;
}

const state: State = { token: "", handle: "" };

// ---------- DOM helpers ----------

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function show(id: string, on: boolean) {
  $(id).style.display = on ? "" : "none";
}

function setStep(active: 1 | 2 | 3 | "done") {
  for (const n of [1, 2, 3]) {
    const el = $(`step-${n}`);
    el.classList.remove("active", "done");
    if (active === "done" || (typeof active === "number" && active > n)) {
      el.classList.add("done");
    } else if (active === n) {
      el.classList.add("active");
    }
  }
}

function toast(msg: string, kind: "ok" | "err" = "ok") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast ${kind}`;
  t.style.display = "block";
  setTimeout(() => {
    t.style.display = "none";
  }, 4500);
}

// ---------- Step 1: handle ----------

function wireStep1() {
  const input = $("handle-input") as HTMLInputElement;
  input.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") ($("handle-continue") as HTMLButtonElement).click();
  });
  $("handle-continue").addEventListener("click", () => {
    const raw = input.value.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(raw)) {
      toast("Enter a valid X handle (letters, digits, underscore)", "err");
      return;
    }
    state.handle = raw.toLowerCase();
    show("panel-1", false);
    show("panel-2", true);
    setStep(2);
  });
}

// ---------- Step 2: wallet ----------

function renderConnected(address: string, chain: Chain) {
  const wrap = $("wallet-connected");
  const tag = chain === "solana" ? "Solana" : "Ethereum";
  const short = address.slice(0, 6) + "\u2026" + address.slice(-4);
  wrap.innerHTML = `
    <div class="connected">
      <div class="check">\u2713</div>
      <div class="info">
        <div class="name">Wallet connected</div>
        <div class="addr">${short}</div>
      </div>
      <span class="chain-tag">${tag}</span>
    </div>
  `;
  show("wallet-connected", true);
  ($("wallet-continue") as HTMLButtonElement).disabled = false;
}

function wireStep2() {
  $("connect-evm").addEventListener("click", async () => {
    const res = await connectEvm();
    if (!res.ok) {
      toast(
        res.reason === "no_provider"
          ? "No EVM wallet detected. Install MetaMask, Rabby, or similar."
          : "Connection rejected.",
        "err",
      );
      return;
    }
    state.chain = "ethereum";
    state.address = res.address;
    renderConnected(res.address, "ethereum");
  });

  $("connect-solana").addEventListener("click", async () => {
    const res = await connectSolana();
    if (!res.ok) {
      toast(
        res.reason === "no_provider"
          ? "No Solana wallet detected. Install Phantom, Backpack, or similar."
          : "Connection rejected.",
        "err",
      );
      return;
    }
    state.chain = "solana";
    state.address = res.address;
    renderConnected(res.address, "solana");
  });

  $("wallet-continue").addEventListener("click", async () => {
    if (!state.address || !state.chain) return;
    show("panel-2", false);
    show("panel-3", true);
    setStep(3);
    await prepareStep3();
  });
}

// ---------- Step 3: sign & claim ----------

async function prepareStep3() {
  if (!state.address || !state.chain || !state.handle) return;
  $("sig-preview").textContent = "Requesting nonce\u2026";
  try {
    const nonce = await requestNonce({
      handle: state.handle,
      chain: state.chain,
      address: state.address,
    });
    state.nonce = nonce.nonce;
    state.message = nonce.message;
    $("sig-preview").textContent = nonce.message;
    ($("sign-submit") as HTMLButtonElement).disabled = false;
  } catch (e) {
    $("sig-preview").textContent = "Failed to request nonce.";
    toast((e as Error).message ?? "API error", "err");
  }
}

function wireStep3() {
  $("sign-submit").addEventListener("click", async () => {
    if (!state.address || !state.chain || !state.nonce || !state.message) return;
    const btn = $("sign-submit") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Signing\u2026";
    try {
      const sig =
        state.chain === "solana"
          ? await signSolanaMessage(state.message)
          : await signEvmMessage(state.address, state.message);
      if (!sig.ok) {
        toast(
          sig.reason === "rejected" ? "Signature rejected." : "Signing failed.",
          "err",
        );
        btn.disabled = false;
        btn.textContent = "Sign and claim A-tier badge";
        return;
      }
      btn.textContent = "Submitting\u2026";
      await submitClaim(state.token, {
        handle: state.handle,
        chain: state.chain,
        address: state.address,
        nonce: state.nonce,
        message: state.message,
        signature: sig.signature,
      });
      showSuccess();
    } catch (e) {
      toast((e as Error).message ?? "Submission failed", "err");
      btn.disabled = false;
      btn.textContent = "Sign and claim A-tier badge";
    }
  });
}

// ---------- Success ----------

function showSuccess() {
  setStep("done");
  show("panel-3", false);
  $("success").classList.add("on");
  toast("Verified. Welcome aboard.", "ok");
  $("claim-another").addEventListener(
    "click",
    () => {
      // reset everything except the token + handle
      state.chain = undefined;
      state.address = undefined;
      state.nonce = undefined;
      state.message = undefined;
      $("success").classList.remove("on");
      $("wallet-connected").innerHTML = "";
      show("wallet-connected", false);
      ($("wallet-continue") as HTMLButtonElement).disabled = true;
      ($("sign-submit") as HTMLButtonElement).disabled = true;
      $("sig-preview").textContent = "Requesting nonce\u2026";
      show("panel-2", true);
      setStep(2);
    },
    { once: true },
  );
}

// ---------- Init ----------

async function init() {
  try {
    state.token = await ensureSession();
  } catch (e) {
    toast("Cannot reach the API. Check the server is running.", "err");
    return;
  }
  wireStep1();
  wireStep2();
  wireStep3();
}

void init();
