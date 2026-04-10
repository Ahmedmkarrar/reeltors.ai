-- OTP-based email verification codes
CREATE TABLE IF NOT EXISTS email_verifications (
  id         UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT         NOT NULL,
  code_hash  TEXT         NOT NULL,  -- SHA-256 of the 6-digit OTP
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  attempts   INTEGER      DEFAULT 0,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_email      ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_ev_expires_at ON email_verifications(expires_at);

-- Audit log: every free-tier generation with IP + device fingerprint
CREATE TABLE IF NOT EXISTS free_generation_logs (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ip_address     TEXT,
  fingerprint_id TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fgl_ip          ON free_generation_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_fgl_fingerprint ON free_generation_logs(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_fgl_user        ON free_generation_logs(user_id);

-- Add abuse-protection columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified               BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS session_fingerprint          TEXT,
  ADD COLUMN IF NOT EXISTS session_fingerprint_updated_at TIMESTAMPTZ;

-- RLS: email_verifications is server-only (service role bypasses RLS)
ALTER TABLE email_verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_generation_logs ENABLE ROW LEVEL SECURITY;

-- Block direct user access to verification codes
CREATE POLICY "No user access to email_verifications"
  ON email_verifications FOR ALL USING (false);

-- Users can only view their own generation logs
CREATE POLICY "Users view own generation logs"
  ON free_generation_logs FOR SELECT USING (auth.uid() = user_id);
