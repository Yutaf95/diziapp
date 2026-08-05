import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Film, Tv, Star, Heart, Calendar, Play, Sparkles, CheckCircle2, Award, 
  Settings, MoreHorizontal, Users, UserCheck, X, Edit3, ShieldCheck, Check, ArrowLeft, Layers, UserPlus,
  Camera, Upload, Link, Image as ImageIcon, Flame, BarChart2, MessageSquare, ThumbsUp, Eye, Zap, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, WatchStatus, EpisodeProgress, RatingReview, CustomCollection } from '../types';
import { getPosterUrl } from '../lib/tmdb';
import { CURRENT_USER } from '../data/mockData';
import { MonthlyRecapModal } from './MonthlyRecapModal';
import { UserAvatar } from './UserAvatar';

interface ProfileViewProps {
  user: Profile;
  watchList: WatchStatus[];
  favorites?: WatchStatus[];
  episodeProgress: EpisodeProgress[];
  reviews: RatingReview[];
  onSelectTab: (tab: string) => void;
  onSelectMediaById?: (id: number, mediaType: 'movie' | 'tv') => void;
  collections?: CustomCollection[];
  onSelectCollection?: (id: string) => void;
  currentUserId?: string;
  currentUserProfile?: Profile;
  currentUserWatchList?: WatchStatus[];
  isFollowing?: boolean;
  onToggleFollowUser?: (userId: string) => void;
  onUpdateProfile?: (updated: Partial<Profile>) => void;
  initialSubTab?: 'profil' | 'movies' | 'tv' | 'reviews' | 'stats';
}

// Default Fallback Pinned Reviews
const MOCK_PINNED_REVIEWS: RatingReview[] = [
  {
    id: 'rev_pin_1',
    user_id: 'usr_me_101',
    media_id: 157336,
    media_type: 'movie',
    media_title: 'Interstellar',
    media_poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    rating: 9.8,
    review_text: 'Christopher Nolan senaryo, görsellik ve Hans Zimmer imzalı müziklerle sinema tarihinin en güçlü bilim kurgu başyapıtlarından birini sunuyor. Kara delik sahnesi ve zaman kırılması büyüleyici.',
    contains_spoiler: false,
    created_at: '24 Temmuz 2026'
  },
  {
    id: 'rev_pin_2',
    user_id: 'usr_me_101',
    media_id: 110492,
    media_type: 'tv',
    media_title: 'Severance',
    media_poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    rating: 9.6,
    review_text: 'İş ve özel hayat ayrımını fiziksel beyin ameliyatına bağlayan harika bir konsept. Sezon finalindeki gerilim seviyesi inanılmaz yüksek.',
    contains_spoiler: false,
    created_at: '18 Temmuz 2026'
  }
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  watchList,
  favorites = [],
  episodeProgress,
  reviews,
  onSelectTab,
  onSelectMediaById,
  collections = [],
  onSelectCollection,
  currentUserId = 'usr_me_101',
  currentUserProfile,
  currentUserWatchList,
  isFollowing = false,
  onToggleFollowUser,
  onUpdateProfile
}) => {
  const isOwnProfile = !currentUserId || user.id === currentUserId || user.username === currentUserProfile?.username || user.username === 'yufus_m' || user.username === 'yufusmutaf';
  
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'movies' | 'tv' | 'reviews' | 'stats'>('profil');
  const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followerTab, setFollowerTab] = useState<'followers' | 'following'>('followers');

  // Edit profile form state
  const [formUsername, setFormUsername] = useState(user.username);
  const [formFullName, setFormFullName] = useState(user.full_name || '');
  const [formBio, setFormBio] = useState(user.bio || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string;
        if (onUpdateProfile) {
          onUpdateProfile({ avatar_url: newAvatarUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Followers / Following Lists (Initialized empty, no test data)
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  // Helper to dynamically resolve title and poster from watchList if missing on review
  const getReviewMediaInfo = (rev: RatingReview) => {
    const watchItem = watchList.find(w => Number(w.media_id) === Number(rev.media_id));
    const title = rev.media_title || watchItem?.title || (rev.media_type === 'tv' ? 'Dizi' : 'Film');
    const rawPoster = rev.media_poster || watchItem?.poster_path;
    const poster = rawPoster 
      ? (rawPoster.startsWith('http') ? rawPoster : `https://image.tmdb.org/t/p/w500${rawPoster}`) 
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
    return { title, poster };
  };

  // Real Counts & Filtered Lists (Excluding 'plan_to_watch', sorted by log/update date descending - newest first)
  const filteredMovies = [...watchList]
    .filter(w => w.media_type === 'movie' && w.status === 'watched')
    .sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return timeB - timeA;
    });

  const filteredTvShows = [...watchList]
    .filter(w => w.media_type === 'tv' && w.status === 'watched')
    .sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return timeB - timeA;
    });

  const moviesWatchedCount = filteredMovies.length;
  const tvShowsWatchedCount = filteredTvShows.length;
  const watchedEpsCount = episodeProgress.filter(ep => ep.is_watched).length;

  // Watch Time calculation
  const totalMinutes = (moviesWatchedCount * 122) + (watchedEpsCount * 48);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  // Recent Watched Activity (Top 5 sorted by log/update date descending)
  const recentWatchedActivity = (() => {
    const items = [...watchList]
      .filter(w => w.status === 'watched' || w.status === 'watching')
      .sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
        return timeB - timeA;
      });
    return items.slice(0, 5).map(item => ({
      id: item.media_id,
      type: item.media_type,
      title: item.title || 'Yapım',
      poster: item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      date: item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Son Zamanlarda'
    }));
  })();

  // Get Top 5 Recent Movies/TV Shows for Favorites
  const displayedFavorites = (() => {
    const items = [...filteredMovies, ...filteredTvShows].sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return timeB - timeA;
    });
    return items.slice(0, 5).map(item => ({
      id: item.media_id,
      type: item.media_type,
      title: item.title || 'Yapım',
      genre: item.media_type === 'tv' ? 'Dizi' : 'Film',
      rating: item.vote_average || 8.5,
      poster: item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'
    }));
  })();

  // Previous month title for Wrapped banner (e.g. "Temmuz Ayı Aylık Özetin")
  const previousMonthName = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const monthStr = d.toLocaleDateString('tr-TR', { month: 'long' });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  })();

  // Real User Reviews (No fallback to MOCK_PINNED_REVIEWS)
  const displayReviews = reviews;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-20 sm:-mt-24 -mb-12 min-h-screen bg-[#14181c] text-[#8a9096] font-sans pb-24 overflow-x-hidden">

      {/* ================================================================ */}
      {/* PROFILE HEADER — Letterboxd Overlap & Gradient Style             */}
      {/* ================================================================ */}

      {/* 1. FULL-WIDTH COVER BANNER (Desktop: ~480-540px, Mobile: ~240px) */}
      <div className="relative w-full h-[240px] sm:h-[380px] md:h-[480px] lg:h-[540px] overflow-hidden bg-[#0e1116] group/banner">
        {/* Banner backdrop image */}
        <img
          src={user.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=90'}
          alt="Profile Cover"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/banner:scale-105"
          style={{ filter: 'grayscale(85%) brightness(0.7)' }}
        />
        
        {/* Multi-stop linear gradient transition (spreads over bottom 60-70%) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(20, 24, 28, 0.4) 55%, rgba(20, 24, 28, 0.85) 80%, #14181c 100%)'
          }}
        />
        
        {/* Top vignette to ensure transparent navbar items pop cleanly */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />
      </div>

      {/* 2. CONTENT AREA — Avatar Overlaps Banner Bottom Boundary */}
      <div className="max-w-[1150px] mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Avatar Overlap + User Info + Stats Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-14 sm:-mt-20 pb-6 border-b border-[#2c3440]">

          {/* LEFT — Overlapping Avatar + User Info */}
          <div className="flex items-end gap-4 sm:gap-6">

            {/* Avatar — top half overlaps banner bottom, bottom half on content */}
            <div className="relative shrink-0 group/avatar">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <div 
                onClick={handleAvatarClick}
                className="relative w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden border-4 border-[#14181c] shadow-2xl ring-2 ring-white/10 bg-[#2c3440] cursor-pointer"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2c3440]">
                    <span className="text-4xl sm:text-6xl font-black text-white/60">
                      {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Hover overlay for changing profile photo */}
                <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-center p-2 z-20">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1 drop-shadow" />
                  <span className="text-xs sm:text-sm font-bold text-white leading-tight px-1 drop-shadow">
                    Profil fotoğrafını değiştir
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="pb-1 space-y-1 min-w-0">

              {/* Top Row: Full Name + Settings / Follow button */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-white font-black text-2xl sm:text-4xl lg:text-5xl leading-tight tracking-tight truncate max-w-[420px]">
                  {user.full_name || user.username}
                </h1>

                {isOwnProfile ? (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[#9ab] hover:text-white transition cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
                    title="Profili Düzenle"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleFollowUser && onToggleFollowUser(user.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition hover:scale-105 active:scale-95 ${
                      isFollowing
                        ? 'bg-[#2c3440] text-slate-300 border border-[#3e4856]'
                        : 'bg-[#40bcf4] text-slate-950'
                    }`}
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isFollowing ? 'Takiptesin' : 'Takip Et'}</span>
                  </button>
                )}
              </div>

              {/* Username */}
              <p className="text-[#9ab] font-medium text-xs sm:text-base tracking-wide">
                @{user.username}
              </p>

              {/* Bio */}
              {user.bio && (
                <p className="text-slate-200 text-xs sm:text-base leading-relaxed max-w-sm pt-0.5 truncate">
                  {user.bio}
                </p>
              )}

            </div>
          </div>

          {/* RIGHT — Stats (Films | Series | Following | Followers) */}
          <div className="flex items-center gap-4 sm:gap-8 pl-0 flex-wrap sm:flex-nowrap sm:self-end pb-1">
            <button
              onClick={() => setActiveSubTab('movies')}
              className="text-center hover:bg-white/5 px-2.5 py-1 rounded-xl transition cursor-pointer group/stat"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums leading-none pt-1 pb-1 group-hover/stat:text-[#40bcf4] transition font-baskerville">
                {moviesWatchedCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs sm:text-[13px] font-extrabold text-[#9ab] uppercase tracking-widest mt-1.5">Filmler</div>
            </button>

            <button
              onClick={() => setActiveSubTab('tv')}
              className="text-center hover:bg-white/5 px-2.5 py-1 rounded-xl transition cursor-pointer group/stat"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums leading-none pt-1 pb-1 group-hover/stat:text-[#40bcf4] transition font-baskerville">
                {tvShowsWatchedCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs sm:text-[13px] font-extrabold text-[#9ab] uppercase tracking-widest mt-1.5">Diziler</div>
            </button>

            <button
              onClick={() => { setFollowerTab('following'); setShowFollowersModal(true); }}
              className="text-center hover:bg-white/5 px-2.5 py-1 rounded-xl transition cursor-pointer group/stat"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums leading-none pt-1 pb-1 group-hover/stat:text-[#40bcf4] transition font-baskerville">
                {following.length.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs sm:text-[13px] font-extrabold text-[#9ab] uppercase tracking-widest mt-1.5">Takip</div>
            </button>

            <button
              onClick={() => { setFollowerTab('followers'); setShowFollowersModal(true); }}
              className="text-center hover:bg-white/5 px-2.5 py-1 rounded-xl transition cursor-pointer group/stat"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums leading-none pt-1 pb-1 group-hover/stat:text-[#40bcf4] transition font-baskerville">
                {(followers.length + (!isOwnProfile && isFollowing ? 1 : 0)).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs sm:text-[13px] font-extrabold text-[#9ab] uppercase tracking-widest mt-1.5">Takipçiler</div>
            </button>
          </div>

        </div>

        {/* ── TAB SWITCHER ── */}
        <div className="border-b border-[#2c3440] pb-4 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'profil', label: 'Profil' },
            { id: 'movies', label: `Filmler (${moviesWatchedCount})` },
            { id: 'tv', label: `Diziler (${tvShowsWatchedCount})` },
            { id: 'reviews', label: `İncelemeler (${reviews.length})` },
            { id: 'stats', label: 'İstatistik' }
          ].map(tab => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`pb-3.5 pt-5 px-5 sm:px-6 text-sm sm:text-base font-bold whitespace-nowrap transition-all relative cursor-pointer ${
                  isActive ? 'text-white font-extrabold' : 'text-[#9ab] hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#40bcf4] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── TAB CONTENT (max-width container) ── */}
      <div className="max-w-[1150px] mx-auto px-4 sm:px-6 pt-6 space-y-8">

        {/* ========================================== */}
        {/* TAB CONTENT AREAS                          */}
        {/* ========================================== */}

        {/* TAB 1: PROFIL (MAIN LANDING VIEW) */}
        {activeSubTab === 'profil' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            
            {/* 1. FAVORİLER */}
            <div className="space-y-5">
              {/* Bölüm Başlığı Deseni */}
              <div className="border-b border-[#2c3440]/60 pb-2.5 space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                  FAVORİLER
                </h2>
                <p className="text-xs sm:text-sm text-[#9ab]">
                  Profilde sergilenen en sevilen 5 yapım
                </p>
              </div>

              {/* Dinamik Poster Grid'i — Büyütüldü */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-5">
                {displayedFavorites.filter(Boolean).length > 0 ? (
                  displayedFavorites.filter(Boolean).map(item => (
                    <div
                      key={item.id}
                      onClick={() => onSelectMediaById?.(item.id, item.type)}
                      className="group cursor-pointer min-w-0 space-y-2 transition-transform duration-300 hover:-translate-y-1"
                    >
                      {/* Aspect 2:3 Poster */}
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40 shadow-md">
                        <img
                          src={item.poster}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Poster Altı Metinler */}
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#40bcf4] transition leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#9ab] truncate font-medium">
                          {item.genre}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-5 text-xs sm:text-sm text-[#9ab] italic py-2">
                    Henüz favori yapım eklenmemiş.
                  </p>
                )}
              </div>
            </div>

            {/* 2. EN SON İZLENENLER */}
            <div className="space-y-5 pt-2">
              {/* Bölüm Başlığı Deseni */}
              <div className="border-b border-[#2c3440]/60 pb-2.5 space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                  EN SON İZLENENLER
                </h2>
                <p className="text-xs sm:text-sm text-[#9ab]">
                  Yakın zamanda tamamlanan film ve bölümler
                </p>
              </div>

              {/* Poster Grid — Büyütüldü */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-5">
                {recentWatchedActivity.length > 0 ? (
                  recentWatchedActivity.map(item => (
                    <div
                      key={item.id + item.title}
                      onClick={() => onSelectMediaById?.(item.id, item.type)}
                      className="group cursor-pointer min-w-0 space-y-2 transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40 shadow-md">
                        <img
                          src={item.poster}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#40bcf4] transition leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#9ab] truncate font-medium">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-5 text-xs sm:text-sm text-[#9ab] italic py-2">
                    Henüz izlenmiş içerik bulunmuyor.
                  </p>
                )}
              </div>
            </div>

            {/* 3. SABİTLENEN İNCELEMELER */}
            <div className="space-y-5 pt-2">
              {/* Bölüm Başlığı Deseni */}
              <div className="border-b border-[#2c3440]/60 pb-2.5 space-y-1">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                  SABİTLENEN İNCELEMELER
                </h2>
                <p className="text-xs sm:text-sm text-[#9ab]">
                  Öne çıkan detaylı eleştiri ve yorumlar
                </p>
              </div>

              <div className="space-y-5">
                {displayReviews.length > 0 ? (
                  displayReviews.slice(0, 3).map(rev => {
                    const mediaInfo = getReviewMediaInfo(rev);
                    return (
                      <div
                        key={rev.id}
                        className="flex items-start gap-4 sm:gap-5 pb-5 border-b border-[#2c3440]/40 last:border-b-0 group"
                      >
                        {/* Poster Thumbnail */}
                        <div 
                          onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                          className="w-16 h-24 sm:w-20 sm:h-30 rounded-lg overflow-hidden bg-black/40 shrink-0 cursor-pointer shadow-md"
                        >
                          <img
                            src={mediaInfo.poster}
                            alt={mediaInfo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* İnceleme Detayları */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <h3 
                                onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                                className="text-sm sm:text-base font-extrabold text-white hover:text-[#40bcf4] cursor-pointer transition"
                              >
                                {mediaInfo.title}
                              </h3>
                              <span className="text-xs sm:text-sm text-[#9ab]">
                                ({rev.media_type === 'tv' ? 'Dizi' : 'Film'})
                              </span>
                            </div>

                            {/* Puan */}
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white">
                              <Star className="w-4 h-4 fill-[#00e054] text-[#00e054]" />
                              <span>{rev.rating || 10} / 10</span>
                            </div>
                          </div>

                          <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed font-normal">
                            "{rev.review_text}"
                          </p>

                          <div className="flex items-center justify-between text-xs sm:text-sm text-[#9ab] pt-1.5">
                            <span>{rev.created_at ? (rev.created_at.includes('T') ? new Date(rev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : rev.created_at) : 'Yakın Zamanda'}</span>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer font-medium">
                                <ThumbsUp className="w-4 h-4 text-[#00e054]" />
                                <span>{rev.likes_count ?? rev.likes ?? 0}</span>
                              </span>
                              <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer font-medium">
                                <MessageSquare className="w-4 h-4 text-[#9ab]" />
                                <span>{rev.comments_count ?? 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs sm:text-sm text-[#9ab] italic">Henüz eklenmiş bir inceleme yok.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MOVIES (FİLMLER) */}
        {activeSubTab === 'movies' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-[#2c3440]/60 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">İzlenen Filmler ({filteredMovies.length})</h2>
              <span className="text-xs sm:text-sm text-[#9ab] font-medium">Son eklenenden eskiye doğru sıralı</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredMovies.length > 0 ? (
                filteredMovies.map(item => (
                  <div
                    key={item.media_id}
                    onClick={() => onSelectMediaById?.(item.media_id, 'movie')}
                    className="group cursor-pointer min-w-0 space-y-2 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40 shadow-md">
                      <img
                        src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || 'Film'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-[#00e054] font-mono text-xs font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#00e054] text-[#00e054]" />
                        {item.vote_average || 8.0}
                      </div>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#40bcf4] transition leading-snug">{item.title}</h4>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Tamamlandı</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 py-12 text-center text-sm text-[#9ab] font-medium">
                  Kütüphanenizde henüz izlenmiş film bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TV (DİZİLER) */}
        {activeSubTab === 'tv' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-[#2c3440]/60 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">İzlenen Diziler ({filteredTvShows.length})</h2>
              <span className="text-xs sm:text-sm text-[#9ab] font-medium">Son eklenenden eskiye doğru sıralı</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredTvShows.length > 0 ? (
                filteredTvShows.map(item => (
                  <div
                    key={item.media_id}
                    onClick={() => onSelectMediaById?.(item.media_id, 'tv')}
                    className="group cursor-pointer min-w-0 space-y-2 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40 shadow-md">
                      <img
                        src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || 'Dizi'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-[#00e054] font-mono text-xs font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#00e054] text-[#00e054]" />
                        {item.vote_average || 8.5}
                      </div>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#40bcf4] transition leading-snug">{item.title}</h4>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Tamamlandı</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 py-12 text-center text-sm text-[#9ab] font-medium">
                  Kütüphanenizde henüz izlenmiş dizi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS (İNCELEMELER) */}
        {activeSubTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-[#2c3440]/60 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">Tüm İncelemelerin ({displayReviews.length})</h2>
              <span className="text-xs sm:text-sm text-[#9ab] font-medium">Topluluğa kattığın tüm değerlendirmeler</span>
            </div>

            <div className="space-y-5">
              {displayReviews.length > 0 ? (
                displayReviews.map(rev => {
                  const mediaInfo = getReviewMediaInfo(rev);
                  return (
                    <div
                      key={rev.id}
                      className="flex items-start gap-4 sm:gap-5 pb-5 border-b border-[#2c3440]/40 last:border-b-0 group"
                    >
                      <div 
                        onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                        className="w-16 h-24 sm:w-20 sm:h-30 rounded-lg overflow-hidden bg-black/40 shrink-0 cursor-pointer shadow-md"
                      >
                        <img
                          src={mediaInfo.poster}
                          alt={mediaInfo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <h3 
                              onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                              className="text-sm sm:text-base font-extrabold text-white hover:text-[#40bcf4] cursor-pointer transition"
                            >
                              {mediaInfo.title}
                            </h3>
                            <span className="text-xs sm:text-sm text-[#9ab]">({rev.media_type === 'tv' ? 'Dizi' : 'Film'})</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white">
                            <Star className="w-4 h-4 fill-[#00e054] text-[#00e054]" />
                            <span>{rev.rating || 10} / 10</span>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base text-slate-200 leading-relaxed italic font-normal">
                          "{rev.review_text}"
                        </p>

                        <div className="flex items-center justify-between text-xs sm:text-sm text-[#9ab] pt-1.5">
                          <span>{rev.created_at ? (rev.created_at.includes('T') ? new Date(rev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : rev.created_at) : 'Yakın Zamanda'}</span>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer font-medium">
                              <ThumbsUp className="w-4 h-4 text-[#00e054]" />
                              <span>{rev.likes_count ?? rev.likes ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer font-medium">
                              <MessageSquare className="w-4 h-4 text-[#9ab]" />
                              <span>{rev.comments_count ?? 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm text-[#9ab] font-medium">
                  Henüz bir inceleme yazmadınız.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STATS & WRAPPED (İSTATİSTİK & WRAPPED) */}
        {activeSubTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* SPOTIFY WRAPPED PROMINENT BUTTON BANNER */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#181e23] to-amber-950 border border-[#00e054]/40 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="p-3.5 rounded-2xl bg-[#00e054] text-slate-950 shadow-xl shrink-0">
                  <Sparkles className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight">✨ {previousMonthName} Ayı Aylık Özetin</h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">Bu ayki tüm izleme dakikaların, favori türlerin ve zirve yapımların animasyonlu hikaye formatında hazır!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMonthlyRecapModal(true)}
                className="px-6 py-3 rounded-xl bg-[#00e054] hover:bg-[#00c84b] text-slate-950 font-black text-xs shadow-xl shadow-[#00e054]/20 transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Aylık Özeti Aç (Wrapped)</span>
              </button>
            </div>

            {/* STAT CARDS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181e23] border border-[#2c3440] rounded-xl p-5 text-center space-y-2 shadow-lg">
                <div className="p-2.5 rounded-xl bg-[#00e054]/15 text-[#00e054] border border-[#00e054]/30 w-fit mx-auto">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam İzleme Süresi</div>
                <div className="text-xl sm:text-2xl font-black text-white">{totalDays} Gün</div>
                <div className="text-[11px] text-slate-400 font-mono">({totalHours} Saat {remainingMins} Dk)</div>
              </div>

              <div className="bg-[#181e23] border border-[#2c3440] rounded-xl p-5 text-center space-y-2 shadow-lg">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 w-fit mx-auto">
                  <Film className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tamamlanan Filmler</div>
                <div className="text-xl sm:text-2xl font-black text-white">{moviesWatchedCount} Film</div>
                <div className="text-[11px] text-slate-400 font-mono">Net Sinema Sayısı</div>
              </div>

              <div className="bg-[#181e23] border border-[#2c3440] rounded-xl p-5 text-center space-y-2 shadow-lg">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit mx-auto">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Takip Edilen Diziler</div>
                <div className="text-xl sm:text-2xl font-black text-white">{tvShowsWatchedCount} Dizi</div>
                <div className="text-[11px] text-slate-400 font-mono">({watchedEpsCount} Bölüm İzlendi)</div>
              </div>

              <div className="bg-[#181e23] border border-[#2c3440] rounded-xl p-5 text-center space-y-2 shadow-lg">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 w-fit mx-auto">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Çok İzlenen Tür</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400">Bilim Kurgu</div>
                <div className="text-[11px] text-slate-400 font-mono">%38 Kütüphane Oranı</div>
              </div>
            </div>

            {/* GENRE DISTRIBUTION PROGRESS BARS */}
            <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-white uppercase tracking-wider">En Çok İzlenen Tür Dağılımı</h3>
              
              <div className="space-y-3 pt-2">
                {[
                  { genre: 'Bilim Kurgu & Macera', percent: 38, color: 'bg-[#00e054]' },
                  { genre: 'Drama & Gizem', percent: 26, color: 'bg-blue-500' },
                  { genre: 'Aksiyon & Gerilim', percent: 20, color: 'bg-amber-500' },
                  { genre: 'Animasyon & Fantezi', percent: 16, color: 'bg-purple-500' }
                ].map(item => (
                  <div key={item.genre} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>{item.genre}</span>
                      <span className="font-mono">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-[#14181c] rounded-full h-2 overflow-hidden border border-[#2c3440]">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* EDIT PROFILE MODAL */}
      {showSettingsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#181e23] border border-[#2c3440] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 cursor-default">
            
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#00e054]" />
                <h3 className="font-bold text-sm text-white">Profili Düzenle</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#2c3440] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full bg-[#14181c] border border-[#2c3440] rounded-xl px-3 py-2 text-white font-medium focus:border-[#00e054] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Ad Soyad</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-[#14181c] border border-[#2c3440] rounded-xl px-3 py-2 text-white font-medium focus:border-[#00e054] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Biyografi</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  rows={2}
                  className="w-full bg-[#14181c] border border-[#2c3440] rounded-xl px-3 py-2 text-white font-medium focus:border-[#00e054] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#2c3440]">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateProfile) {
                    onUpdateProfile({
                      username: formUsername,
                      full_name: formFullName,
                      bio: formBio
                    });
                  }
                  setShowSettingsModal(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#00e054] hover:bg-[#00c84b] text-slate-950 shadow-lg transition hover:scale-105 active:scale-95"
              >
                Kaydet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOLLOWERS / FOLLOWING MODAL */}
      {showFollowersModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFollowersModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#181e23] border border-[#2c3440] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 cursor-default max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00e054]" />
                <h3 className="font-bold text-sm text-white">Sosyal Ağ</h3>
              </div>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#2c3440] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-[#2c3440] shrink-0">
              <button
                onClick={() => setFollowerTab('followers')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                  followerTab === 'followers' ? 'border-[#00e054] text-white font-extrabold' : 'border-transparent text-slate-400'
                }`}
              >
                Takipçiler ({followers.length + (!isOwnProfile && isFollowing ? 1 : 0)})
              </button>
              <button
                onClick={() => setFollowerTab('following')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                  followerTab === 'following' ? 'border-[#00e054] text-white font-extrabold' : 'border-transparent text-slate-400'
                }`}
              >
                Takip Edilenler ({following.length})
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 custom-scrollbar">
              {(followerTab === 'followers' ? followers : following).map(person => (
                <div key={person.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#14181c] border border-[#2c3440]">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{person.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">@{person.username}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SPOTIFY WRAPPED MODAL TRIGGER */}
      <MonthlyRecapModal
        isOpen={showMonthlyRecapModal}
        onClose={() => setShowMonthlyRecapModal(false)}
        user={user}
        watchList={watchList}
        episodeProgress={episodeProgress}
        reviews={reviews}
        onSelectMediaById={onSelectMediaById}
      />

      </div>
    </div>
  );
};
