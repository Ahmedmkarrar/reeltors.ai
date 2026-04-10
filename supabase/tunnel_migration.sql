-- Run this in your Supabase SQL editor to add the free video tunnel

CREATE TABLE IF NOT EXISTS tunnel_sessions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token        TEXT        UNIQUE NOT NULL,
  email                TEXT,
  ip_address           TEXT,
  device_fingerprint   TEXT,
  template_id          TEXT,
  source_images        TEXT[],
  creatomate_render_id TEXT,
  output_url           TEXT,
  thumbnail_url        TEXT,
  status               TEXT        NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'generating', 'complete', 'failed', 'blocked')),
  abuse_blocked_reason TEXT,
  has_downloaded       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tunnel_sessions_email       ON tunnel_sessions (email);
CREATE INDEX IF NOT EXISTS idx_tunnel_sessions_ip          ON tunnel_sessions (ip_address);
CREATE INDEX IF NOT EXISTS idx_tunnel_sessions_fingerprint ON tunnel_sessions (device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_tunnel_sessions_render_id   ON tunnel_sessions (creatomate_render_id);

ALTER TABLE tunnel_sessions ENABLE ROW LEVEL SECURITY;

-- All access goes through service role only (no public policies)
CREATE POLICY "deny_all_public" ON tunnel_sessions FOR ALL USING (false);
