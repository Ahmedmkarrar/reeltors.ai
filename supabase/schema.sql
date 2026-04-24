-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'team'
  videos_used_this_month INTEGER DEFAULT 0,
  videos_limit INTEGER DEFAULT 1, -- free = 1 video/month
  billing_cycle_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  creatomate_render_id TEXT,
  template_id TEXT NOT NULL,
  listing_address TEXT,
  listing_price TEXT,
  agent_name TEXT,
  source_images TEXT[] NOT NULL,
  output_url TEXT,       -- permanent Supabase Storage URL (after webhook stores it)
  thumbnail_url TEXT,    -- permanent Supabase Storage URL
  duration_seconds INTEGER,
  format TEXT DEFAULT 'vertical', -- 'vertical' (9:16), 'square' (1:1), 'horizontal' (16:9)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own videos"   ON videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- ─── Auto-create profile on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Atomic video usage increment ─────────────────────────────────────────────
-- Called by /api/videos/generate after a render is successfully queued.
-- R2: returns TRUE if the increment succeeded (was within limit), FALSE if limit already reached.
-- The WHERE clause makes the check-and-increment atomic — no separate read needed.
CREATE OR REPLACE FUNCTION increment_videos_used(p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE profiles
  SET videos_used_this_month = videos_used_this_month + 1,
      updated_at = NOW()
  WHERE id = p_user_id
    AND videos_used_this_month < videos_limit;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Monthly usage reset ───────────────────────────────────────────────────────
-- Called by the /api/cron/reset-usage endpoint on the 1st of each month.
CREATE OR REPLACE FUNCTION reset_monthly_videos()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET videos_used_this_month = 0,
      billing_cycle_start    = NOW(),
      updated_at             = NOW()
  WHERE billing_cycle_start < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Storage: listing-images (user uploads) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Listing images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

-- ─── Storage: output-videos (Creatomate renders, stored permanently) ──────────
INSERT INTO storage.buckets (id, name, public) VALUES ('output-videos', 'output-videos', true)
  ON CONFLICT (id) DO NOTHING;

-- Only service role (webhook) may write; reads are public so video tags work
CREATE POLICY "Output videos are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'output-videos');

-- ─── Realtime: enable postgres_changes on videos ──────────────────────────────
-- Run in Supabase dashboard → Database → Replication, or via the CLI:
-- supabase db push --include-all
-- Alternatively, enable via the Supabase dashboard under Database → Replication.
-- The videos table must be in the "supabase_realtime" publication:
--   ALTER PUBLICATION supabase_realtime ADD TABLE videos;
