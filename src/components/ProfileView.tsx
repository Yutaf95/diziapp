import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Film, Tv, Star, Heart, Calendar, Play, Sparkles, CheckCircle2, Award, 
  Settings, MoreHorizontal, Users, UserCheck, X, Edit3, ShieldCheck, Check, ArrowLeft, Layers, UserPlus,
  Camera, Upload, Link, Image as ImageIcon, Flame, BarChart2, MessageSquare, ThumbsUp, Eye, Zap, Share2, Pin, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, WatchStatus, EpisodeProgress, RatingReview, CustomCollection } from '../types';
import { getPosterUrl } from '../lib/tmdb';
import { CURRENT_USER, DEFAULT_AVATAR_URL } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  onNavigateToProfile?: (username: string) => void;
  collections?: CustomCollection[];
  onSelectCollection?: (id: string) => void;
  currentUserId?: string;
  currentUserProfile?: Profile;
  currentUserWatchList?: WatchStatus[];
  isFollowing?: boolean;
  followingUserIds?: string[];
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
  onNavigateToProfile,
  collections = [],
  onSelectCollection,
  currentUserId = 'usr_me_101',
  currentUserProfile,
  currentUserWatchList,
  isFollowing = false,
  followingUserIds = [],
  onToggleFollowUser,
  onUpdateProfile
}) => {
  const isOwnProfile = Boolean(
    (currentUserId && user.id === currentUserId) ||
    (currentUserProfile && user.username === currentUserProfile.username) ||
    (currentUserProfile && user.id === currentUserProfile.id)
  );
  
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'movies' | 'tv' | 'reviews' | 'stats'>('profil');
  const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followerTab, setFollowerTab] = useState<'followers' | 'following'>('followers');
  const [genreTab, setGenreTab] = useState<'tv' | 'movie'>('tv');

  const tvGenreDistribution = [
    { genre: 'Bilim Kurgu & Macera', percent: 38, color: 'bg-[#00e054]' },
    { genre: 'Drama & Gizem', percent: 28, color: 'bg-blue-500' },
    { genre: 'Aksiyon & Gerilim', percent: 20, color: 'bg-amber-500' },
    { genre: 'Animasyon & Komedi', percent: 14, color: 'bg-purple-500' }
  ];

  const movieGenreDistribution = [
    { genre: 'Aksiyon & Macera', percent: 42, color: 'bg-amber-500' },
    { genre: 'Bilim Kurgu & Fantezi', percent: 26, color: 'bg-[#00e054]' },
    { genre: 'Drama & Suç', percent: 18, color: 'bg-blue-500' },
    { genre: 'Korku & Gerilim', percent: 14, color: 'bg-rose-500' }
  ];

  // Edit profile form state
  const [formUsername, setFormUsername] = useState(user.username);
  const [formFullName, setFormFullName] = useState(user.full_name || '');
  const [formBio, setFormBio] = useState(user.bio || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const threeDotsRef = useRef<HTMLDivElement>(null);
  const [isThreeDotsMenuOpen, setIsThreeDotsMenuOpen] = useState(false);

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

  const handleBannerClick = () => {
    bannerFileInputRef.current?.click();
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newBannerUrl = reader.result as string;
        if (onUpdateProfile) {
          onUpdateProfile({ banner_url: newBannerUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (threeDotsRef.current && !threeDotsRef.current.contains(event.target as Node)) {
        setIsThreeDotsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Followers / Following Lists (Loaded live from Supabase)
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSocialConnections() {
      if (!user?.id) return;

      try {
        if (isSupabaseConfigured) {
          // 1. Fetch IDs of users THIS user is following
          const { data: followRows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

          if (followRows && followRows.length > 0) {
            const targetIds = followRows.map((r: any) => r.following_id);
            const { data: pList } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, bio')
              .in('id', targetIds);

            if (isMounted && pList) {
              setFollowing(pList.map((p: any) => ({
                id: p.id,
                username: p.username,
                full_name: p.full_name || p.username,
                avatar_url: p.avatar_url || DEFAULT_AVATAR_URL,
                bio: p.bio || ''
              })));
            }
          } else if (isMounted) {
            setFollowing([]);
          }

          // 2. Fetch IDs of users that follow THIS user
          const { data: followerRows } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);

          if (followerRows && followerRows.length > 0) {
            const targetIds = followerRows.map((r: any) => r.follower_id);
            const { data: pList } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url, bio')
              .in('id', targetIds);

            if (isMounted && pList) {
              setFollowers(pList.map((p: any) => ({
                id: p.id,
                username: p.username,
                full_name: p.full_name || p.username,
                avatar_url: p.avatar_url || DEFAULT_AVATAR_URL,
                bio: p.bio || ''
              })));
            }
          } else if (isMounted) {
            setFollowers([]);
          }
        } else {
          // Local fallback
          if (isOwnProfile && currentUserProfile && followingUserIds) {
            const localFollowing = followingUserIds.map(id => ({
              id,
              username: id,
              full_name: id,
              avatar_url: DEFAULT_AVATAR_URL,
              bio: ''
            }));
            if (isMounted) setFollowing(localFollowing);
          }
          if (!isOwnProfile && isFollowing && currentUserProfile) {
            if (isMounted) setFollowers([currentUserProfile]);
          }
        }
      } catch (err) {
        console.error('Error fetching social connections:', err);
      }
    }

    loadSocialConnections();
  }, [user?.id, user?.username, isOwnProfile, isFollowing, followingUserIds, currentUserProfile]);

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
  const totalDays = Math.floor(totalMinutes / 1440);
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

  // Get Top 5 User Favorites from user's actual favorites list
  const displayedFavorites = (() => {
    const favoriteItems = (favorites && favorites.length > 0) ? favorites.slice(0, 5) : [];
    return favoriteItems.map(item => ({
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

  // Real User Reviews filtering — Strictly scoped to this profile's user only
  const userReviews = React.useMemo(() => {
    return reviews.filter(r => 
      (r.user_id && user.id && r.user_id === user.id) || 
      (r.username && user.username && r.username === user.username) ||
      (r.profile?.id && user.id && r.profile.id === user.id) ||
      (r.profile?.username && user.username && r.profile.username === user.username)
    );
  }, [reviews, user.id, user.username]);

  const displayReviews = userReviews;

  const rawAvatarUrl = user.avatar_url;
  const isDefaultOrOldAvatar = !rawAvatarUrl || rawAvatarUrl.includes('photo-1535713875002-d1d0cf377fde');
  const avatarUrl = isDefaultOrOldAvatar ? DEFAULT_AVATAR_URL : rawAvatarUrl;

  return (
    <div className="w-full min-h-screen bg-[#14181c] text-[#8a9096] font-sans pb-24">

      {/* ================================================================ */}
      {/* PROFILE HEADER — Letterboxd Overlap & Gradient Style             */}
      {/* ================================================================ */}

      {/* 1. FULL-WIDTH COVER BANNER (Desktop: ~480-540px, Mobile: ~240px) */}
      <div className="relative w-full h-[240px] sm:h-[380px] md:h-[480px] lg:h-[540px] overflow-hidden bg-[#0e1116] group/banner">
        <input
          type="file"
          ref={bannerFileInputRef}
          onChange={handleBannerFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Banner backdrop image */}
        <img
          src={user.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=90'}
          alt="Profile Cover"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/banner:scale-105"
          style={{ filter: 'grayscale(85%) brightness(0.7)', transform: 'translateZ(0)', willChange: 'transform' }}
        />

        {isOwnProfile && (
          <button
            onClick={handleBannerClick}
            className="absolute top-24 right-4 sm:top-28 sm:right-8 z-20 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-extrabold border border-white/20 flex items-center gap-2 cursor-pointer shadow-xl hover:scale-105 active:scale-95"
            title="Kapak Fotoğrafını Değiştir"
          >
            <Camera className="w-4 h-4 text-[#00e054]" />
            <span>Kapak Fotoğrafını Değiştir</span>
          </button>
        )}
        
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
                onClick={isOwnProfile ? handleAvatarClick : undefined}
                className={`relative w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden border-4 border-[#14181c] shadow-2xl ring-2 ring-white/10 bg-[#2c3440] ${isOwnProfile ? 'cursor-pointer' : ''}`}
              >
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className={`w-full h-full object-cover ${isOwnProfile ? 'transition-transform duration-300 group-hover/avatar:scale-105' : ''}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                  }}
                />

                {/* Hover overlay for changing profile photo ONLY on own profile */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-center p-2 z-20">
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1 drop-shadow" />
                    <span className="text-xs sm:text-sm font-bold text-white leading-tight px-1 drop-shadow">
                      Profil fotoğrafını değiştir
                    </span>
                  </div>
                )}
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
                  <div ref={threeDotsRef} className="relative">
                    <button
                      onClick={() => setIsThreeDotsMenuOpen(prev => !prev)}
                      className="text-[#9ab] hover:text-white transition cursor-pointer p-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 border border-transparent hover:border-[#2c3440]"
                      title="Profil Ayarları & Seçenekler"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </button>

                    {isThreeDotsMenuOpen && (
                      <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-60 bg-[#181e23] border border-[#2c3440] rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                        <button
                          onClick={() => {
                            setIsThreeDotsMenuOpen(false);
                            handleBannerClick();
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#00e054] shrink-0" />
                          <span>Kapak Fotoğrafını Değiştir</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsThreeDotsMenuOpen(false);
                            handleAvatarClick();
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-[#40bcf4] shrink-0" />
                          <span>Profil Fotoğrafını Değiştir</span>
                        </button>
                        <div className="border-t border-[#2c3440] my-1" />
                        <button
                          onClick={() => {
                            setIsThreeDotsMenuOpen(false);
                            setShowSettingsModal(true);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-3 transition cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Profili Düzenle</span>
                        </button>
                      </div>
                    )}
                  </div>
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
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 sm:self-end pb-1 border-t sm:border-t-0 border-[#2c3440]/40">
            <button
              onClick={() => setActiveSubTab('movies')}
              className="text-center hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-xl transition cursor-pointer group/stat flex-1 sm:flex-initial"
            >
              <div className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-white tabular-nums leading-none group-hover/stat:text-[#40bcf4] transition">
                {moviesWatchedCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Filmler</div>
            </button>

            <button
              onClick={() => setActiveSubTab('tv')}
              className="text-center hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-xl transition cursor-pointer group/stat flex-1 sm:flex-initial"
            >
              <div className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-white tabular-nums leading-none group-hover/stat:text-[#40bcf4] transition">
                {tvShowsWatchedCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Diziler</div>
            </button>

            <button
              onClick={() => { setFollowerTab('following'); setShowFollowersModal(true); }}
              className="text-center hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-xl transition cursor-pointer group/stat flex-1 sm:flex-initial"
            >
              <div className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-white tabular-nums leading-none group-hover/stat:text-[#40bcf4] transition">
                {following.length.toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Takip</div>
            </button>

            <button
              onClick={() => { setFollowerTab('followers'); setShowFollowersModal(true); }}
              className="text-center hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-xl transition cursor-pointer group/stat flex-1 sm:flex-initial"
            >
              <div className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-white tabular-nums leading-none group-hover/stat:text-[#40bcf4] transition">
                {(followers.length + (!isOwnProfile && isFollowing ? 1 : 0)).toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Takipçiler</div>
            </button>
          </div>

        </div>

        {/* ── TAB SWITCHER ── */}
        <div className="border-b border-[#2c3440] pb-1 pt-1">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none">
          {[
            { id: 'profil', label: 'Profil' },
            { id: 'movies', label: `Filmler (${moviesWatchedCount})` },
            { id: 'tv', label: `Diziler (${tvShowsWatchedCount})` },
            { id: 'reviews', label: `İncelemeler (${displayReviews.length})` },
            { id: 'stats', label: 'İstatistik' }
          ].map(tab => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-2.5 px-2.5 sm:px-5 text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative cursor-pointer ${
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

            {/* 3. SABİTLENEN İNCELEMELER VEYA SON İNCELEMELER */}
            {(() => {
              const pinnedReviews = displayReviews.filter(r => r.is_pinned);
              const recentReviews = [...displayReviews]
                .sort((a, b) => {
                  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return timeB - timeA;
                })
                .slice(0, 5);

              const hasPinned = pinnedReviews.length > 0;
              const reviewsToDisplay = hasPinned ? pinnedReviews : recentReviews;

              return (
                <div className="space-y-5 pt-2">
                  {/* Bölüm Başlığı Deseni */}
                  <div className="border-b border-[#2c3440]/60 pb-2.5 space-y-1">
                    <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      {hasPinned ? (
                        <>
                          <Pin className="w-4 h-4 text-amber-400" />
                          <span>SABİTLENEN İNCELEMELER</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 text-[#40bcf4]" />
                          <span>SON İNCELEMELER</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#9ab]">
                      {hasPinned ? 'Öne çıkan detaylı eleştiri ve yorumlar' : 'En son yapılan değerlendirme ve yorumlar'}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {reviewsToDisplay.length > 0 ? (
                      reviewsToDisplay.map(rev => {
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
                                  {rev.is_pinned && (
                                    <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Pin className="w-3 h-3" /> Sabitlendi
                                    </span>
                                  )}
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
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center bg-[#0e1116] border border-[#2c3440]/60 rounded-2xl p-6 space-y-3 shadow-md">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                          <Pin className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-base sm:text-lg font-extrabold text-white">Henüz sabitlenmiş bir inceleme yok</p>
                          {isOwnProfile && (
                            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                              Sol menüdeki <strong className="text-white font-bold">İncelemelerin</strong> sekmesine giderek dilediğiniz incelemenin altındaki <strong className="text-amber-400 font-bold">"Profile Sabitle"</strong> butonuna tıklayıp burada öne çıkarabilirsiniz.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* TAB 2: MOVIES (FİLMLER) */}
        {activeSubTab === 'movies' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-[#2c3440]/60 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">İzlenen Filmler ({filteredMovies.length})</h2>
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
            
            {/* SPOTIFY WRAPPED PROMINENT BUTTON BANNER (KULLANICININ KENDİSİNE ÖZEL) */}
            {isOwnProfile && (
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
            )}

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
            <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2c3440] pb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-5 h-5 text-[#00e054]" />
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                    En Çok İzlenen Tür Dağılımı
                  </h3>
                </div>

                {/* Dizi / Film Selector Boxes in Top Right Header */}
                <div className="flex items-center gap-1.5 bg-[#14181c] p-1 rounded-xl border border-[#2c3440] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setGenreTab('tv')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      genreTab === 'tv'
                        ? 'bg-[#00e054] text-slate-950 shadow-md scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" /> Dizi
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenreTab('movie')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      genreTab === 'movie'
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" /> Film
                  </button>
                </div>
              </div>

              {/* Progress bars based on selected genreTab */}
              <div className="space-y-3.5 pt-1">
                {(genreTab === 'tv' ? tvGenreDistribution : movieGenreDistribution).map(item => (
                  <div key={item.genre} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        {item.genre}
                      </span>
                      <span className="font-mono text-slate-400">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-[#14181c] rounded-full h-2.5 overflow-hidden border border-[#2c3440]">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`} 
                        style={{ width: `${item.percent}%` }} 
                      />
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
              {/* Kapak Fotoğrafı Yükle / Değiştir */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">Kapak Fotoğrafı</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      handleBannerClick();
                    }}
                    className="text-xs font-bold text-[#00e054] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Değiştir
                  </button>
                </div>
                <div 
                  onClick={() => {
                    setShowSettingsModal(false);
                    handleBannerClick();
                  }}
                  className="w-full h-24 rounded-2xl overflow-hidden border border-[#2c3440] relative group cursor-pointer shadow-inner bg-[#14181c]"
                >
                  <img
                    src={user.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80'}
                    alt="Cover Banner"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center text-xs font-extrabold text-white gap-2">
                    <Camera className="w-4 h-4 text-[#00e054]" /> Kapak Fotoğrafı Seç
                  </div>
                </div>
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
                onClick={() => setFollowerTab('following')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                  followerTab === 'following' ? 'border-[#00e054] text-white font-extrabold' : 'border-transparent text-slate-400'
                }`}
              >
                Takip Edilenler ({following.length})
              </button>
              <button
                onClick={() => setFollowerTab('followers')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                  followerTab === 'followers' ? 'border-[#00e054] text-white font-extrabold' : 'border-transparent text-slate-400'
                }`}
              >
                Takipçiler ({followers.length})
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 custom-scrollbar">
              {(followerTab === 'following' ? following : followers).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Henüz {followerTab === 'following' ? 'takip edilen kullanıcı' : 'takipçi'} bulunmuyor.
                </div>
              ) : (
                (followerTab === 'following' ? following : followers).map(person => (
                  <div 
                    key={person.id}
                    onClick={() => {
                      if (onNavigateToProfile && person.username) {
                        setShowFollowersModal(false);
                        onNavigateToProfile(person.username);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#14181c] hover:bg-[#232833] border border-[#2c3440] cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={person} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-[#40bcf4] transition truncate">
                          {person.full_name || person.username}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          @{person.username}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#40bcf4] bg-[#40bcf4]/10 px-2 py-0.5 rounded border border-[#40bcf4]/20 group-hover:bg-[#40bcf4] group-hover:text-black transition">
                      Profil →
                    </span>
                  </div>
                ))
              )}
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
