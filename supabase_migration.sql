-- Ramadhan Tracker — Supabase Database Migration
-- Jalankan script ini di Supabase SQL Editor: https://supabase.com/dashboard
-- Project: oalulbixxtutuyyubfcc

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url   TEXT,
  onboarding_level INT NOT NULL DEFAULT 0,
  quran_target_pages INT NOT NULL DEFAULT 20,
  quran_target_juz   INT NOT NULL DEFAULT 1,
  charity_target     BIGINT NOT NULL DEFAULT 100000,
  city               TEXT,
  latitude           DECIMAL(9,6),
  longitude          DECIMAL(9,6),
  privacy_setting    TEXT NOT NULL DEFAULT 'private' CHECK (privacy_setting IN ('private', 'public')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own profile" ON public.profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Table: daily_logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  fasting_status TEXT CHECK (fasting_status IN ('full', 'partial', 'skip')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own daily_logs" ON public.daily_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Table: prayer_logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  prayer_name  TEXT NOT NULL CHECK (prayer_name IN ('fajr','dhuhr','asr','maghrib','isha','tarawih','witir','dhuha','qiyam')),
  status       TEXT CHECK (status IN ('ontime','qadha','skipped')),
  on_time      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date, prayer_name)
);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own prayer_logs" ON public.prayer_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Table: quran_logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.quran_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  pages_read   INT NOT NULL DEFAULT 0,
  juz_read     INT NOT NULL DEFAULT 0,
  minutes      INT NOT NULL DEFAULT 0,
  last_surah   TEXT,
  last_ayah    INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.quran_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own quran_logs" ON public.quran_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Table: charity_logs
-- =============================================
CREATE TABLE IF NOT EXISTS public.charity_logs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  amount    BIGINT NOT NULL DEFAULT 0,
  channel   TEXT NOT NULL DEFAULT '',
  note      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.charity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own charity_logs" ON public.charity_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Table: habit_streaks
-- =============================================
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_key         TEXT NOT NULL,
  current_streak    INT NOT NULL DEFAULT 0,
  best_streak       INT NOT NULL DEFAULT 0,
  last_logged_date  DATE,
  UNIQUE (user_id, habit_key)
);

ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own habit_streaks" ON public.habit_streaks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Table: badges
-- =============================================
CREATE TABLE IF NOT EXISTS public.badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🏅'
);

-- Seed default badges
INSERT INTO public.badges (code, title, description, icon) VALUES
  ('streak_7',       '7 Hari Berturut',    'Konsisten 7 hari penuh',           '🔥'),
  ('streak_14',      '2 Minggu Konsisten', 'Konsisten 14 hari berturut',        '⚡'),
  ('streak_30',      'Ramadhan Penuh',     'Konsisten seluruh 30 hari',         '🌙'),
  ('khatam',         'Khatam Al-Qur\'an', 'Menyelesaikan tilawah 30 juz',      '📖'),
  ('fasting_10',     'Puasa 10 Hari',      'Berpuasa penuh 10 hari',            '✨'),
  ('charity_first',  'Dermawan Pertama',   'Mencatat sedekah pertama kali',     '💛'),
  ('qiyam_first',    'Qiyamul Lail',       'Sholat malam pertama kali dicatat', '🌟'),
  ('all_prayer',     'Sempurna',           'Semua sholat wajib dalam satu hari','🕌')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- Table: user_badges
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own badges" ON public.user_badges
  USING (auth.uid() = user_id);

-- =============================================
-- Table: auth_sessions (tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.login_activities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.login_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own login_activities" ON public.login_activities
  USING (auth.uid() = user_id);
