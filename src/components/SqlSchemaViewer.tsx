import React, { useState } from 'react';
import { Database, Copy, Check, FolderTree, Code, Terminal, Server, ShieldCheck, Sparkles } from 'lucide-react';

export const SqlSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- ====================================================================
-- TV TIME - FULL SUPABASE DATABASE SCHEMA
-- Supabase SQL Editor'de dogrudan calistirabilirsiniz.
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
CREATE TABLE IF NOT EXISTS public.watch_status (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id INT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'watched')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id, media_type)
);

-- 3. EPISODE PROGRESS TABLE
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
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT cant_follow_self CHECK (follower_id <> following_id)
);

-- 7. ACTIVITY FEED TABLE
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  media_id INT,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_watch_status_user ON public.watch_status(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_progress_user_show ON public.episode_progress(user_id, show_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_media ON public.ratings_reviews(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON public.activity_feed(user_id);

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert/update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Watch status viewable" ON public.watch_status FOR SELECT USING (true);
CREATE POLICY "Users manage watch status" ON public.watch_status FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Episode progress viewable" ON public.episode_progress FOR SELECT USING (true);
CREATE POLICY "Users manage episode progress" ON public.episode_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reviews viewable" ON public.ratings_reviews FOR SELECT USING (true);
CREATE POLICY "Users manage reviews" ON public.ratings_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Activity feed viewable" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users log activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

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
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Veritabanı Mimarisi</span>
          </div>
          <h1 className="text-2xl font-black text-white">Tam SQL Şeması & Proje Yapısı</h1>
          <p className="text-slate-400 text-sm mt-1">
            Supabase SQL Editor'de doğrudan çalıştırabileceğin tablolar, foreign key ilişki tanımları, RLS güvenlik kuralları ve indeksler.
          </p>
        </div>

        <button
          onClick={copyToClipboard}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
        >
          {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'SQL Kopyalandı!' : 'SQL Şemasını Kopyala'}</span>
        </button>
      </div>

      {/* Directory Structure Tree */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-amber-400" />
          Proje Kök Dizin Yapısı (Project Directory Tree)
        </h3>

        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed">
{`tv-time-app/
├── lib/
│   └── tmdb.ts               # Root import alias for TMDB API service layer
├── src/
│   ├── components/
│   │   ├── Navbar.tsx            # Navigation header & search input
│   │   ├── MediaCard.tsx         # Movie & TV show poster card
│   │   ├── MediaDetailModal.tsx  # Detailed view (Overview, Cast, Season & Episode Progress, Reviews)
│   │   ├── EpisodeTracker.tsx    # TV Time episode completion checklist & progress bar
│   │   ├── ActivityFeedView.tsx  # Social feed (Friend updates & spoiler warning blur)
│   │   ├── ProfileView.tsx       # User watch time statistics, episode count, badges
│   │   ├── SqlSchemaViewer.tsx   # Interactive Supabase SQL editor code viewer
│   │   └── ApiKeyModal.tsx       # Optional TMDB API key configuration modal
│   ├── data/
│   │   └── mockData.ts           # Demo users, seed activity feed & offline TMDB fallback dataset
│   ├── lib/
│   │   ├── tmdb.ts               # TMDB API calls (search, getTrending, getDetails, getSeasonDetails)
│   │   └── supabase-schema.sql   # Complete Supabase SQL script with RLS & triggers
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (Profile, WatchStatus, EpisodeProgress, etc.)
│   ├── App.tsx                   # Main React application shell & state coordinator
│   ├── index.css                 # Tailwind CSS styling entry
│   └── main.tsx                  # React DOM entry point
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts`}
        </pre>
      </div>

      {/* Interactive Code Editor Box for SQL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-400" />
            Supabase SQL Editor Kodu (tam metin)
          </h3>
          <span className="text-xs text-slate-400 font-mono">schema.sql</span>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 p-4 sm:p-5 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-[500px] leading-relaxed select-all">
            {sqlScript}
          </pre>
        </div>
      </div>

    </div>
  );
};
