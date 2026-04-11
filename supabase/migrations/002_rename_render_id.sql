-- Rename creatomate_render_id → render_id now that we use Shotstack.
-- Run in Supabase SQL editor before deploying the corresponding code changes.

ALTER TABLE tunnel_sessions RENAME COLUMN creatomate_render_id TO render_id;

DROP INDEX IF EXISTS idx_tunnel_sessions_render_id;
CREATE INDEX IF NOT EXISTS idx_tunnel_sessions_render_id ON tunnel_sessions (render_id);

-- videos table uses the same legacy column name
ALTER TABLE videos RENAME COLUMN creatomate_render_id TO render_id;
