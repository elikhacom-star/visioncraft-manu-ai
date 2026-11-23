CREATE TABLE IF NOT EXISTS users (
  email_id TEXT PRIMARY KEY,
  verified_at INTEGER NOT NULL,
  daily_count INTEGER NOT NULL DEFAULT 0,
  daily_started_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
  email_id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  replicate_id TEXT NOT NULL,
  status TEXT NOT NULL,
  output_url TEXT,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS generations_email_idempotency ON generations(email_id, idempotency_key);
CREATE INDEX IF NOT EXISTS generations_email ON generations(email_id);
CREATE INDEX IF NOT EXISTS sessions_email ON sessions(email_id);
