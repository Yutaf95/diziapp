-- ====================================================================
-- TV TIME - FULL SUPABASE DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor
-- ====================================================================

-- DROP TABLES IF THEY EXIST TO PREVENT CONFLICTS (FRESH START)
DROP TABLE IF EXISTS public.collection_items CASCADE;
DROP TABLE IF EXISTS public.custom_collections CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.activity_feed CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.episode_ratings CASCADE;
DROP TABLE IF EXISTS public.ratings_reviews CASCADE;
DROP TABLE IF EXISTS public.episode_progress CASCADE;
DROP TABLE IF EXISTS public.watch_status CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with public profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  featured_media_title TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WATCH STATUS TABLE
-- Tracks user status for movies and TV shows (watching, plan_to_watch, watched)
CREATE TABLE IF NOT EXISTS public.watch_status (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id INT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'watched')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id, media_type)
);

-- 3. EPISODE PROGRESS TABLE
-- Tracks episode-by-episode progress for TV shows
CREATE TABLE IF NOT EXISTS public.episode_progress (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id INT NOT NULL,
  season_number INT NOT NULL,
  episode_number INT NOT NULL,
  is_watched BOOLEAN DEFAULT TRUE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, show_id, season_number, episode_number)
);

-- 4. RATINGS & REVIEWS TABLE
-- Stores ratings (1-10) and reviews with spoiler flag
CREATE TABLE IF NOT EXISTS public.ratings_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id INT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  rating INT CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  contains_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EPISODE RATINGS TABLE
-- Allows rating individual TV show episodes
CREATE TABLE IF NOT EXISTS public.episode_ratings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id INT NOT NULL,
  season_number INT NOT NULL,
  episode_number INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, show_id, season_number, episode_number)
);

-- 6. FOLLOWS TABLE
-- Social graph: followers and following relationships
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT cant_follow_self CHECK (follower_id <> following_id)
);

-- 7. ACTIVITY FEED TABLE
-- Stream of user updates (status updates, watched episodes, reviews, follows)
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'status_update', 'episode_watched', 'review_added', 'rating_given', 'started_following'
  media_id INT,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_watch_status_user ON public.watch_status(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_status_media ON public.watch_status(media_id, media_type);

CREATE INDEX IF NOT EXISTS idx_episode_progress_user_show ON public.episode_progress(user_id, show_id);
CREATE INDEX IF NOT EXISTS idx_episode_progress_season ON public.episode_progress(show_id, season_number);

CREATE INDEX IF NOT EXISTS idx_ratings_reviews_media ON public.ratings_reviews(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_user ON public.ratings_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- Automatically populates profiles table when a new user signs up in Auth
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Watch Status Policies
CREATE POLICY "Watch status is viewable by everyone" ON public.watch_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert/update their watch status" ON public.watch_status
  FOR ALL USING (auth.uid() = user_id);

-- 3. Episode Progress Policies
CREATE POLICY "Episode progress is viewable by everyone" ON public.episode_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their episode progress" ON public.episode_progress
  FOR ALL USING (auth.uid() = user_id);

-- 4. Ratings & Reviews Policies
CREATE POLICY "Ratings and reviews are viewable by everyone" ON public.ratings_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.ratings_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete own reviews" ON public.ratings_reviews
  FOR ALL USING (auth.uid() = user_id);

-- 5. Episode Ratings Policies
CREATE POLICY "Episode ratings are viewable by everyone" ON public.episode_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can rate episodes" ON public.episode_ratings
  FOR ALL USING (auth.uid() = user_id);

-- 6. Follows Policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their followings" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- 7. Activity Feed Policies
CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can log activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- NEW TABLES: FAVORITES, CUSTOM COLLECTIONS & COLLECTION ITEMS
-- ====================================================================

-- 8. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id INT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT,
  poster_path TEXT,
  vote_average FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id, media_type)
);

-- 9. CUSTOM COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.custom_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COLLECTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID REFERENCES public.custom_collections(id) ON DELETE CASCADE,
  media_id INT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT,
  poster_path TEXT,
  PRIMARY KEY (collection_id, media_id, media_type)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Favorites viewable by everyone" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Collections viewable by everyone" ON public.custom_collections FOR SELECT USING (is_private = false OR auth.uid() = user_id);
CREATE POLICY "Users manage own collections" ON public.custom_collections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Collection items viewable by everyone" ON public.collection_items FOR SELECT USING (true);
CREATE POLICY "Users manage own collection items" ON public.collection_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.custom_collections
    WHERE id = collection_id AND user_id = auth.uid()
  )
);
