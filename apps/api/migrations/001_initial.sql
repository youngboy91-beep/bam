-- TruthLayer initial schema. Idempotent (IF NOT EXISTS everywhere).
-- Runs automatically on API startup when DATABASE_URL is set.

CREATE TABLE IF NOT EXISTS identities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle        TEXT NOT NULL,
  platform      TEXT NOT NULL DEFAULT 'x',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(handle, platform)
);

CREATE TABLE IF NOT EXISTS wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain         TEXT NOT NULL,
  address       TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chain, address)
);

CREATE TABLE IF NOT EXISTS links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL DEFAULT 'C',
  source          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, wallet_id)
);

CREATE INDEX IF NOT EXISTS idx_links_identity ON links(identity_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  plan          TEXT NOT NULL DEFAULT 'anonymous',
  handle        TEXT,
  wallets_count INTEGER NOT NULL DEFAULT 0,
  usage_today   INTEGER NOT NULL DEFAULT 0,
  usage_limit   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
