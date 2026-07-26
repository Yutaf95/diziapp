import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Film, Tv, Star, Heart, Calendar, Play, Sparkles, CheckCircle2, Award, 
  Settings, MoreHorizontal, Users, UserCheck, X, Edit3, ShieldCheck, Check, ArrowLeft, Layers, UserPlus,
  Camera, Upload, Link, Image as ImageIcon, Flame, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, WatchStatus, EpisodeProgress, RatingReview, CustomCollection } from '../types';
import { getPosterUrl } from '../lib/tmdb';
import { CURRENT_USER } from '../data/mockData';
import { isSupabaseConfigured } from '../lib/supabase';
import { MonthlyRecapModal } from './MonthlyRecapModal';
import { UserAvatar } from './UserAvatar';
import { ProfileBannerModal } from './ProfileBannerModal';
import { extractDominantColor, RGBColor } from '../lib/colorExtractor';
import { sortFranchiseAlphabetical } from '../lib/sorting';

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
}

// PRESET_AVATARS removed - avatar selection is strictly from user's gallery/device

// Sample Watched items for current month (Temmuz 2026)
const JULY_2026_WATCHED = [
  {
    id: 110492,
    type: 'tv' as const,
    title: 'Severance',
    subtitle: 'S1:B09 • The We We Are',
    badge: 'S1 B09',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    rating: 9.8,
    date: '19 Temmuz 2026'
  },
  {
    id: 693134,
    type: 'movie' as const,
    title: 'Dune: Part Two',
    subtitle: 'Film • 166 dk',
    badge: '★ 9.8',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    rating: 9.8,
    date: '15 Temmuz 2026'
  },
  {
    id: 94997,
    type: 'tv' as const,
    title: 'House of the Dragon',
    subtitle: 'S2:B04 • The Red Dragon and the Gold',
    badge: 'S2 B04',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    rating: 9.2,
    date: '11 Temmuz 2026'
  },
  {
    id: 94605,
    type: 'tv' as const,
    title: 'Arcane',
    subtitle: 'S1:B09 • The Monster You Created',
    badge: 'S1 B09',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    rating: 9.9,
    date: '08 Temmuz 2026'
  },
  {
    id: 114472,
    type: 'tv' as const,
    title: 'The Bear',
    subtitle: 'S3:B10 • Forever',
    badge: 'S3 B10',
    poster: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    rating: 8.9,
    date: '03 Temmuz 2026'
  },
  {
    id: 1399,
    type: 'tv' as const,
    title: 'Game of Thrones',
    subtitle: 'S8:B06 • The Iron Throne',
    badge: 'S8 B06',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    rating: 9.3,
    date: '02 Temmuz 2026'
  },
  {
    id: 27205,
    type: 'movie' as const,
    title: 'Inception',
    subtitle: 'Film • 148 dk',
    badge: '★ 8.8',
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    rating: 8.8,
    date: '01 Temmuz 2026'
  }
];

// Top 5 Favorites Showcase
const TOP_5_FAVORITES = [
  {
    id: 110492,
    rank: 1,
    type: 'tv' as const,
    title: 'Severance',
    genre: 'Bilim Kurgu / Gizem',
    rating: 9.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 693134,
    rank: 2,
    type: 'movie' as const,
    title: 'Dune: Part Two',
    genre: 'Aksiyon / Bilim Kurgu',
    rating: 9.7,
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 94605,
    rank: 3,
    type: 'tv' as const,
    title: 'Arcane',
    genre: 'Animasyon / Drama',
    rating: 9.9,
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 157336,
    rank: 4,
    type: 'movie' as const,
    title: 'Interstellar',
    genre: 'Macera / Drama',
    rating: 9.6,
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 76331,
    rank: 5,
    type: 'tv' as const,
    title: 'Succession',
    genre: 'Drama / İş Dünyası',
    rating: 9.5,
    poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
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
  
  // Comparison Modal state & user profile references
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
  const [showAllWatchedModal, setShowAllWatchedModal] = useState(false);
  const [allWatchedTypeModal, setAllWatchedTypeModal] = useState<'movie' | 'tv' | null>(null);
  const [showAllCollectionsModal, setShowAllCollectionsModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  const bannerUrl = user.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1600&q=80';
  const featuredTitle = user.featured_media_title || 'Severance';

  // Dynamic Backdrop Glow state
  const [dominantColor, setDominantColor] = useState<RGBColor>({ r: 230, g: 57, b: 70 });

  useEffect(() => {
    const sourceImage = bannerUrl || user.avatar_url || '';
    extractDominantColor(sourceImage, user.username || featuredTitle || 'Profile', (color) => {
      setDominantColor(color);
    });
  }, [bannerUrl, user.avatar_url, user.username, featuredTitle]);

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallaxOffset({ x: x * 26, y: y * 16 });
  };

  const handleBannerMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };
  const myUser = currentUserProfile || CURRENT_USER;
  const myFirstName = (myUser.full_name || myUser.username).split(' ')[0];
  const otherFirstName = (user.full_name || user.username).split(' ')[0];

  // Current Month/Year Title
  const rawMonthStr = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const formattedMonthTitle = rawMonthStr.charAt(0).toUpperCase() + rawMonthStr.slice(1);

  // Dynamic compatibility rate calculation
  const getCompatibilityRate = (username: string) => {
    if (username === 'zeynep_k' || username === 'zeynepk') return 64;
    if (username === 'ahmet_y' || username === 'ahmety') return 84;
    if (username === 'selin_d' || username === 'selind') return 42;
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 50 + (Math.abs(hash) % 40);
  };

  const compatibilityRate = getCompatibilityRate(user.username);

  // Dynamic Taste Harmony Badge (Zevk Uyum Rozeti) Config
  const getBadgeConfig = (rate: number) => {
    if (rate >= 80) {
      return {
        label: 'Sinema İkizi',
        badgeText: '80%+ 🔥 Sinema İkizi',
        emoji: '🔥',
        colorStyle: 'bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-red-500/20 text-orange-300 border border-orange-500/40 shadow-lg shadow-orange-500/10',
        pillBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        icon: <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
      };
    } else if (rate >= 50) {
      return {
        label: 'Ortak Zevk',
        badgeText: '50-79% 🎬 Ortak Zevk',
        emoji: '🎬',
        colorStyle: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10',
        pillBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        icon: <Film className="w-4 h-4 text-emerald-400" />
      };
    } else {
      return {
        label: 'Farklı Dünyalar',
        badgeText: '<50% 🎭 Farklı Dünyalar',
        emoji: '🎭',
        colorStyle: 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10',
        pillBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        icon: <Sparkles className="w-4 h-4 text-purple-400" />
      };
    }
  };

  const badgeConfig = getBadgeConfig(compatibilityRate);

  // Shared Media Items for Comparison Modal
  const SHARED_MEDIA_ITEMS = [
    {
      id: 693134,
      media_type: 'movie' as const,
      title: 'Dune: Part Two',
      subtitle: 'Film • 2024',
      rating: 9.8,
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      tag: 'İkiniz de 10/10'
    },
    {
      id: 110492,
      media_type: 'tv' as const,
      title: 'Severance',
      subtitle: 'Dizi • 2 Sezon',
      rating: 9.7,
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      tag: 'İkiniz de İzliyorsunuz'
    },
    {
      id: 157336,
      media_type: 'movie' as const,
      title: 'Interstellar',
      subtitle: 'Film • 2014',
      rating: 9.6,
      poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      tag: 'İkiniz de Tamamladınız'
    },
    {
      id: 94997,
      media_type: 'tv' as const,
      title: 'House of the Dragon',
      subtitle: 'Dizi • 2 Sezon',
      rating: 9.2,
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      tag: 'Favorilerinizde'
    }
  ];
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followerTab, setFollowerTab] = useState<'followers' | 'following'>('followers');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directAvatarInputRef = useRef<HTMLInputElement>(null);

  // Form states for profile editing & quick avatar update
  const [formUsername, setFormUsername] = useState(user.username);
  const [formFullName, setFormFullName] = useState(user.full_name || '');
  const [formBio, setFormBio] = useState(user.bio || '');
  const [formAvatarUrl, setFormAvatarUrl] = useState(user.avatar_url || '');

  // Quick Avatar Confirm Modal state
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [showAvatarConfirmModal, setShowAvatarConfirmModal] = useState(false);

  useEffect(() => {
    setFormUsername(user.username);
    setFormFullName(user.full_name || '');
    setFormBio(user.bio || '');
    setFormAvatarUrl(user.avatar_url || '');
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Lütfen 8 MB\'tan küçük bir fotoğraf seçin.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Lütfen 8 MB\'tan küçük bir fotoğraf seçin.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPendingAvatarUrl(reader.result);
          setShowAvatarConfirmModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Click outside listener for options menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Follower list state
  const [followers, setFollowers] = useState(() => {
    if (isSupabaseConfigured) return [];
    return [
      { id: '1', name: 'Can Demir', username: 'candemir', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', isFollowing: true }
    ];
  });
  const [following, setFollowing] = useState(() => {
    if (isSupabaseConfigured) return [];
    return [
      { id: '2', name: 'Zeynep Kaya', username: 'zeynepk', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', isFollowing: true }
    ];
  });

  const useMockFallbacks = !isSupabaseConfigured && watchList.length === 0;

  const realWatchedEpisodesCount = episodeProgress.filter(ep => ep.is_watched).length;
  const realWatchedMoviesCount = watchList.filter(w => w.status === 'watched' && w.media_type === 'movie').length;
  const totalWatchedItemsCount = realWatchedEpisodesCount + realWatchedMoviesCount;

  const hasRecapData = totalWatchedItemsCount >= 2;

  const watchedEpsCount = realWatchedEpisodesCount;
  const tvShowsWatchedCount = watchList.filter(w => w.media_type === 'tv' && (w.status === 'watched' || w.status === 'watching')).length;
  const moviesWatchedCount = realWatchedMoviesCount;

  // Calculate net duration
  const totalMinutes = (moviesWatchedCount * 122) + (watchedEpsCount * 48);
  const totalDays = Math.floor(totalMinutes / (24 * 60));
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const formattedTotalTime = `${totalDays} Gün ${remainingHours} Saat`;

  const topGenreFormatted = totalWatchedItemsCount > 0 ? 'Dizi & Film' : 'Yok';

  // Explicit User Favorites Top 5 Selection (No automatic system assignment)
  const displayedFavorites = (() => {
    if (!favorites || favorites.length === 0) return [];

    return favorites.slice(0, 5).map((fav, index) => ({
      id: fav.media_id,
      rank: index + 1,
      type: fav.media_type,
      title: fav.title || 'Yapım',
      genre: fav.media_type === 'tv' ? 'Dizi' : 'Film',
      rating: fav.vote_average || 8.0,
      poster: fav.poster_path ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'
    }));
  })();

  // Dynamic monthly watched items
  const monthlyWatchedItems = (() => {
    const watchedItems = watchList.filter(w => w.status === 'watched');
    if (watchedItems.length === 0 && useMockFallbacks) return JULY_2026_WATCHED;
    
    return watchedItems.map(w => ({
      id: w.media_id,
      type: w.media_type,
      title: w.title || 'Yapım',
      subtitle: w.media_type === 'tv' ? 'Dizi' : 'Film',
      badge: w.media_type === 'tv' ? 'Tamamlandı' : 'Film',
      poster: w.poster_path ? (w.poster_path.startsWith('http') ? w.poster_path : `https://image.tmdb.org/t/p/w500${w.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      rating: w.vote_average || 8.0,
      date: 'Bu Ay'
    }));
  })();

  const toggleFollowStatus = (id: string, listType: 'followers' | 'following') => {
    if (listType === 'followers') {
      setFollowers(prev => prev.map(f => f.id === id ? { ...f, isFollowing: !f.isFollowing } : f));
    } else {
      setFollowing(prev => prev.map(f => f.id === id ? { ...f, isFollowing: !f.isFollowing } : f));
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(180deg, rgba(${Math.round(dominantColor.r * 0.38)}, ${Math.round(dominantColor.g * 0.12)}, ${Math.round(dominantColor.b * 0.22)}, 0.96) 0%, rgba(${Math.round(dominantColor.r * 0.12)}, ${Math.round(dominantColor.g * 0.05)}, ${Math.round(dominantColor.b * 0.08)}, 0.98) 40%, #0F1115 100%)`,
        transition: 'background 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 -mb-12 p-3 sm:p-6 lg:p-8 min-h-screen text-slate-100 animate-in fade-in duration-300 pb-20 overflow-x-hidden max-w-full"
    >
      <div className="w-full space-y-4 sm:space-y-10 overflow-x-hidden">
      
      {/* ========================================== */}
      {/* 1. INTERACTIVE PARALLAX PROFILE BANNER HEADER */}
      {/* ========================================== */}
      <div 
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={handleBannerMouseLeave}
        style={{
          boxShadow: `0 20px 45px -15px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.28)`,
          borderColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.22)`,
          transition: 'box-shadow 0.7s ease, border-color 0.7s ease'
        }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border shadow-2xl bg-slate-950 p-3.5 sm:p-6 md:p-8 min-h-[240px] sm:min-h-[360px] md:min-h-[400px] flex flex-col justify-end group/banner transition-all duration-500"
      >
        {/* Parallax Image Backdrop Layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={bannerUrl}
            alt={featuredTitle}
            className="w-full h-full object-cover object-center transform will-change-transform"
            style={{
              transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0) scale(1.12)`,
              transition: 'transform 0.12s ease-out'
            }}
          />
          {/* Cinematic Vignette & Gradient Blends for High Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14080A] via-[#14080A]/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>

        {/* Soft Ambient Background Blur Spotlights with Dynamic Glow Color */}
        <div 
          className="absolute -top-12 -left-20 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700"
          style={{ backgroundColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.28)` }}
        />
        <div 
          className="absolute top-10 right-0 w-80 h-80 rounded-full blur-[130px] pointer-events-none transition-all duration-700"
          style={{ backgroundColor: `rgba(${Math.min(255, dominantColor.r + 50)}, ${Math.round(dominantColor.g * 0.7)}, ${Math.min(255, dominantColor.b + 90)}, 0.2)` }}
        />

        {/* Main Hero Header Content over Banner */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-2.5 sm:gap-6 sm:pl-2 pt-2 sm:pt-4">
          
          {/* Circular Avatar */}
          <div className="relative shrink-0">
            <UserAvatar
              user={user}
              size="2xl"
              showEditCameraBadge={false}
            />
          </div>

          {/* Right Typography & Info */}
          <div className="flex-1 text-left space-y-0.5 sm:space-y-1.5 min-w-0 w-full">
            


            {/* Name and Username */}
            <div className="my-0.5">
              <h1 className="text-xs sm:text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight truncate drop-shadow-md">
                {user.full_name || user.username}
              </h1>
              <p className="text-[9px] sm:text-[11px] md:text-xs text-slate-300 font-semibold truncate drop-shadow">@{user.username}</p>
            </div>

            {/* Bio if available */}
            {user.bio && (
              <p className="text-[9px] sm:text-[11px] text-slate-200 max-w-lg italic line-clamp-1 sm:line-clamp-none drop-shadow">
                "{user.bio}"
              </p>
            )}

            {/* Followers / Following Subtitle Text */}
            <div className="flex items-center justify-start gap-1 sm:gap-2 text-[8px] sm:text-[10px] md:text-xs text-slate-200 font-bold pt-0.5 drop-shadow flex-wrap">
              <button
                onClick={() => {
                  setFollowerTab('followers');
                  setShowFollowersModal(true);
                }}
                className="hover:text-white hover:underline transition truncate"
              >
                {followers.length + (!isOwnProfile && isFollowing ? 1 : 0)} Takipçi
              </button>
              <span className="text-slate-400 font-black">•</span>
              <button
                onClick={() => {
                  setFollowerTab('following');
                  setShowFollowersModal(true);
                }}
                className="hover:text-white hover:underline transition truncate"
              >
                Takip: {following.length}
              </button>
              <span className="text-slate-400 font-black hidden sm:inline">•</span>
              <span className="text-slate-300 font-medium hidden sm:inline">{reviews.length} İnceleme</span>
            </div>

            {/* Minimalist Action Controls */}
            <div className="pt-1 sm:pt-2.5 flex items-center justify-start gap-1 sm:gap-2.5 flex-wrap">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-1 px-2 py-0.5 sm:px-4 sm:py-2 rounded-full bg-[#E63946] hover:bg-[#d62839] text-[#FFFFFF] text-[9px] sm:text-xs font-extrabold shadow-lg shadow-[#E63946]/30 transition hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  <span>Profili Düzenle</span>
                </button>
              ) : (
                <button
                  onClick={() => onToggleFollowUser && onToggleFollowUser(user.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-extrabold shadow-xl transition hover:scale-105 active:scale-95 ${
                    isFollowing
                      ? 'bg-slate-800/90 hover:bg-red-950/50 text-slate-200 hover:text-red-400 border border-slate-700 hover:border-red-500/40'
                      : 'bg-[#E63946] hover:bg-[#d62839] text-white shadow-[#E63946]/30'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Takiptesin</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Takip Et</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* MONTHLY RECAP GRADIENT BANNER              */}
      {/* ========================================== */}
      {hasRecapData && (
        <div 
          style={{
            boxShadow: `0 15px 35px -10px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.22)`,
            borderColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.35)`,
            transition: 'all 0.5s ease'
          }}
          className="relative z-10 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-900/60 via-[#E63946]/40 to-amber-900/60 border backdrop-blur-md shadow-2xl overflow-hidden flex flex-row items-center justify-between gap-3 transition-all duration-300 hover:border-amber-400/60 group"
        >
          {/* Shimmer Ambient Effects */}
          <div 
            className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition duration-500" 
            style={{ backgroundColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.25)` }}
          />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#E63946]/30 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition duration-500" />

          <div className="flex items-center gap-2.5 sm:gap-4 relative z-10 min-w-0 flex-1">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-[#E63946] to-purple-600 text-white shadow-xl shrink-0 group-hover:rotate-6 transition duration-300">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 fill-white" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-xs sm:text-lg font-black text-white tracking-tight truncate">
                ✨ {formattedMonthTitle} Özetin Hazır!
              </h3>
              <p className="text-xs text-slate-300 font-medium hidden sm:block">
                Bu ayki izleme istatistiklerin, zirve yapımın ve favori oyuncun hesaplandı.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMonthlyRecapModal(true)}
            className="relative z-10 px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] sm:text-xs shadow-xl shadow-amber-400/20 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>Özeti İncele</span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* SPOTIFY-STYLE HEADER-ADJACENT COMPATIBILITY BANNER */}
      {/* ========================================== */}
      {!isOwnProfile && (
        <div 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          className="relative z-10 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-200 hover:border-white/20"
        >
          {/* Left Avatar Group & Statement */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Overlapping Avatars */}
            <div className="flex items-center -space-x-3.5 shrink-0">
              <img
                src={myUser.avatar_url}
                alt={myFirstName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#1A080A] shadow-md"
                title={`${myFirstName} (Sen)`}
              />
              <img
                src={user.avatar_url}
                alt={otherFirstName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#1A080A] shadow-md z-10"
                title={otherFirstName}
              />
            </div>

            {/* Statement Text */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  <span className="text-[#E63946]">{myFirstName}</span> ve <span className="text-amber-400">{otherFirstName}</span> %{compatibilityRate} aynı içerikleri izliyor!
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                İzleme geçmişleriniz, incelemeleriniz ve ortak dizileriniz üzerinden hesaplandı.
              </p>
            </div>
          </div>

          {/* Right Controls: Taste Harmony Badge & Modal Trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            {/* Taste Harmony Badge (Zevk Uyum Rozeti) */}
            <div className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2 ${badgeConfig.colorStyle}`}>
              {badgeConfig.icon}
              <span>{badgeConfig.label}</span>
            </div>

            {/* Detaylı Karşılaştır Button */}
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 shadow-md hover:scale-105 active:scale-95"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Detaylı Karşılaştır</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. FAVORİ VİTRİNİ (En Üstte Top 5 Listesi) */}
      {/* ========================================== */}
      <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 space-y-2 shadow-lg">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1 sm:p-1.5 rounded-lg bg-white/5 text-amber-400 border border-white/10">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black text-white tracking-tight">Favori Vitrini</h2>
              <p className="text-[10px] text-slate-400 hidden sm:block">Profilde sergilenen En Sevilen 5 Yapım</p>
            </div>
          </div>

          <span className="text-[9px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-amber-500/20">
            Top 5 Seçkisi
          </span>
        </div>

        {/* Top 5 Compact 5-Column Grid - Always exactly 5 slots */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {Array.from({ length: 5 }).map((_, index) => {
            const rank = index + 1;
            const item = displayedFavorites[index];

            if (item) {
              let rankBadgeColor = 'bg-slate-800/80 text-slate-300 border-slate-700';
              if (item.rank === 1) rankBadgeColor = 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/30';
              if (item.rank === 2) rankBadgeColor = 'bg-slate-300 text-slate-950 font-black border-white shadow-lg shadow-slate-300/20';
              if (item.rank === 3) rankBadgeColor = 'bg-amber-700 text-amber-100 font-black border-amber-600 shadow-lg shadow-amber-700/20';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMediaById?.(item.id, item.type)}
                  className="relative bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-amber-500/50 rounded-lg sm:rounded-xl p-1 sm:p-1.5 space-y-1 transition duration-300 group cursor-pointer hover:-translate-y-0.5 shadow-md min-w-0"
                >
                  {/* Rank Badge */}
                  <div className={`absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 z-20 w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-mono text-[8px] sm:text-[10px] border ${rankBadgeColor}`}>
                    #{item.rank}
                  </div>

                  {/* Poster Image */}
                  <div className="relative h-20 sm:h-28 w-full rounded sm:rounded-lg overflow-hidden bg-black/40">
                    <img
                      src={item.poster}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Rating */}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/85 backdrop-blur-md text-amber-400 font-mono text-[7px] sm:text-[9px] font-black px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                      <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </div>
                  </div>

                  {/* Title & Genre */}
                  <div className="space-y-0.5 text-center min-w-0">
                    <h4 className="text-[9px] sm:text-xs font-black text-white truncate group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[7.5px] sm:text-[10px] text-slate-400 truncate font-medium">
                      {item.genre}
                    </p>
                  </div>

                </div>
              );
            }

            return (
              <div
                key={`empty-slot-${rank}`}
                className="relative bg-white/[0.01] border border-dashed border-white/10 rounded-lg sm:rounded-xl h-28 sm:h-36 flex flex-col items-center justify-center p-1 text-slate-600 gap-1 shadow-inner select-none"
              >
                <div className="absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-mono text-[8px] sm:text-[10px] border border-white/10 bg-white/5 text-slate-500">
                  #{rank}
                </div>
                <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/10 fill-none" />
                <span className="text-[8px] sm:text-[10px] text-slate-600 font-medium">Boş Slot</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. TÜM ZAMANLAR İSTATİSTİKLERİ GRID        */}
      {/* ========================================== */}
      <div className="space-y-2.5 sm:space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#E63946]" />
          <h2 className="text-sm sm:text-lg font-black text-white tracking-tight">Tüm Zamanlar İstatistikleri</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          
          {/* ⏱️ Toplam İzleme Süresi */}
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            className="backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition duration-300 group flex flex-col items-center justify-center text-center space-y-1 sm:space-y-2 hover:border-white/20"
          >
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-[#E63946] border border-white/10 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Toplam Süre</span>
            <div className="text-xs sm:text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-[#E63946] transition-colors truncate w-full">
              {formattedTotalTime}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Net İzleme Süresi</p>
          </div>

          {/* 🎬 Toplam Film */}
          <div
            onClick={() => setAllWatchedTypeModal('movie')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            className="backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition duration-300 group flex flex-col items-center justify-center text-center space-y-1 sm:space-y-2 hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-blue-400 border border-white/10 group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Toplam Film</span>
            <div className="text-sm sm:text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
              {moviesWatchedCount} Film
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Tamamlanan Film Sayısı</p>
          </div>

          {/* 📺 Toplam Dizi Sayısı */}
          <div
            onClick={() => setAllWatchedTypeModal('tv')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            className="backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition duration-300 group flex flex-col items-center justify-center text-center space-y-1 sm:space-y-2 hover:border-white/20 cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-emerald-400 border border-white/10 group-hover:scale-110 transition-transform">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Toplam Dizi</span>
            <div className="text-sm sm:text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
              {tvShowsWatchedCount} Dizi
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Takip Edilen / İzlenen Dizi</p>
          </div>

          {/* 🎭 En Çok İzlenen Tür */}
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            className="backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition duration-300 group flex flex-col items-center justify-center text-center space-y-1 sm:space-y-2 hover:border-white/20"
          >
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-amber-400 border border-white/10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">En Çok İzlenen Tür</span>
            <div className="text-xs sm:text-2xl font-black text-amber-400 tracking-tight group-hover:scale-105 transition-transform truncate w-full">
              {topGenreFormatted}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Kütüphane Tür Dağılımı</p>
          </div>

        </div>
      </div>

       {/* ========================================== */}
      {/* 2.5. LİSTELERİM SHOWCASE                  */}
      {/* ========================================== */}
      {collections && collections.length > 0 && (
        <div className="space-y-2.5 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#E63946]" />
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight">Listelerim</h2>
            </div>
            <button
              onClick={() => setShowAllCollectionsModal(true)}
              className="text-[11px] sm:text-xs font-bold text-[#E63946] hover:underline cursor-pointer"
            >
              Tümünü Gör ({collections.length}) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {collections.slice(0, 3).map(col => {
              const firstItemWithPoster = col.items.find(i => i.poster_path) || col.items[0];
              const posterUrl = firstItemWithPoster ? getPosterUrl(firstItemWithPoster.poster_path) : null;

              return (
                <div
                  key={col.id}
                  onClick={() => {
                    if (onSelectCollection) onSelectCollection(col.id);
                    onSelectTab('collections');
                  }}
                  style={{ borderColor: `${col.color || '#E63946'}30` }}
                  className="bg-white/[0.03] backdrop-blur-md border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg hover:border-[#E63946] transition duration-300 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group"
                >
                  {/* Random / First Item Poster Image as Collection Icon */}
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={col.title}
                      className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl object-cover shadow-md border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                      <Film className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    </div>
                  )}

                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#E63946] transition-colors truncate">
                        {col.title}
                      </h3>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-md shrink-0">
                        {col.items.length} Yapım
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                      {col.description || 'Kişisel liste kütüphanesi.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. BU AY NELER İZLEDİN? (Compact 5-Grid)  */}
      {/* ========================================== */}
      <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 space-y-2.5 sm:space-y-5 shadow-xl">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 text-[#E63946] border border-white/10">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-lg font-black text-white tracking-tight">Bu Ay Neler İzledin?</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Bu ay boyunca tamamladığın film ve diziler</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAllWatchedModal(true)}
            className="text-[9px] sm:text-xs font-bold bg-white/5 text-[#E63946] px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition flex items-center gap-1 cursor-pointer"
          >
            <span>İzleme Geçmişi ({monthlyWatchedItems.length})</span>
            <span className="font-extrabold text-[#E63946] ml-0.5">&rarr;</span>
          </button>
        </div>

        {/* Strict 5-Column Side-By-Side Grid - Exactly 5 items max without horizontal scrollbar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3.5">
          {monthlyWatchedItems.length > 0 ? (
            monthlyWatchedItems.slice(0, 5).map((item) => (
              <div
                key={item.id + item.title}
                onClick={() => onSelectMediaById?.(item.id, item.type)}
                className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-[#E63946]/70 rounded-lg sm:rounded-2xl p-1 sm:p-2.5 space-y-1 sm:space-y-2 cursor-pointer transition-all duration-300 group hover:-translate-y-1 shadow-lg min-w-0"
              >
                {/* Poster Image */}
                <div className="relative aspect-[2/3] w-full rounded sm:rounded-xl overflow-hidden bg-black/40">
                  <img
                    src={item.poster}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating or Episode Badge */}
                  <div className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1.5 bg-black/85 backdrop-blur-md text-amber-400 font-mono text-[7px] sm:text-[10px] font-black px-0.5 py-0.2 sm:px-1.5 sm:py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5 shadow-md">
                    {item.badge.includes('★') ? (
                      <Star className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 fill-amber-400 text-amber-400" />
                    ) : null}
                    {item.badge}
                  </div>

                  {/* Media Type Tag */}
                  <div className="absolute bottom-0.5 left-0.5 sm:bottom-1.5 sm:left-1.5 bg-black/80 text-white text-[6.5px] sm:text-[8.5px] font-extrabold uppercase px-0.5 py-0.2 sm:px-1.5 sm:py-0.5 rounded border border-white/10">
                    {item.type === 'tv' ? 'Dizi' : 'Film'}
                  </div>

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-full bg-[#E63946] text-white flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-[9px] sm:text-xs font-black text-white truncate group-hover:text-[#E63946] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[7.5px] sm:text-[10px] text-slate-400 truncate font-medium">
                    {item.subtitle}
                  </p>
                  <div className="pt-0.5 flex items-center justify-between text-[6.5px] sm:text-[8.5px] text-slate-500 font-mono border-t border-white/5">
                    <span className="truncate">{item.date}</span>
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-5 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl py-8 text-center text-xs text-slate-500 font-semibold">
              Bu ay henüz film veya dizi izlenmedi.
            </div>
          )}
        </div>

      </div>

      </div>

      {/* ========================================== */}
      {/* FOLLOWERS / FOLLOWING MODAL               */}
      {/* ========================================== */}
      {showFollowersModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFollowersModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#14171D] border border-[#2B313E] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 cursor-default">
            
            <div className="flex items-center justify-between border-b border-[#232833] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E63946]" />
                <h3 className="font-bold text-base text-white">Sosyal Ağ</h3>
              </div>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#232833] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center bg-[#0B0C0E] p-1 rounded-xl border border-[#232833]">
              <button
                onClick={() => setFollowerTab('followers')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  followerTab === 'followers'
                    ? 'bg-[#E63946] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Takipçiler ({followers.length})
              </button>
              <button
                onClick={() => setFollowerTab('following')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  followerTab === 'following'
                    ? 'bg-[#E63946] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Takip Edilenler ({following.length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(followerTab === 'followers' ? followers : following).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0C0E] border border-[#232833]">
                  <div className="flex items-center gap-3">
                    <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-[#232833]" />
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-400">@{item.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollowStatus(item.id, followerTab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      item.isFollowing
                        ? 'bg-[#232833] text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-[#E63946] text-white hover:bg-[#d62839]'
                    }`}
                  >
                    {item.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Takip Ediliyor</span>
                      </>
                    ) : (
                      <span>Takip Et</span>
                    )}
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SETTINGS MODAL                             */}
      {/* ========================================== */}
      {showSettingsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div className="bg-[#14171D] border border-[#2B313E] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 cursor-default my-auto max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#232833] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E63946]" />
                <h3 className="font-bold text-base text-white">Profil & Simge Ayarları</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#232833] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs overflow-y-auto pr-1 custom-scrollbar flex-1">
              
              {/* 1. Banner Selection Section (Compact) */}
              <div className="bg-[#0B0C0E] border border-[#2B313E] rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Profil Kapak Resmi</span>
                  </label>
                  <p className="text-[10px] text-slate-400 truncate">
                    Mevcut: {featuredTitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowBannerModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-[11px] shadow-sm cursor-pointer shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Değiştir</span>
                </button>
              </div>

              {/* 2. Text Fields */}

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Ad Soyad</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-xl px-3 py-2 text-white font-medium focus:border-[#E63946] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Biyografi</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-xl px-3 py-2 text-white font-medium focus:border-[#E63946] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#232833] shrink-0">
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
                      bio: formBio,
                      avatar_url: formAvatarUrl
                    });
                  }
                  setShowSettingsModal(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#E63946] hover:bg-[#d62839] text-white shadow-lg transition hover:scale-105 active:scale-95"
              >
                Kaydet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* QUICK AVATAR CONFIRMATION MODAL            */}
      {/* ========================================== */}
      {showAvatarConfirmModal && pendingAvatarUrl && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAvatarConfirmModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#14171D] border border-[#2B313E] rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-in zoom-in-95 cursor-default text-center">
            
            <div className="flex items-center justify-between border-b border-[#232833] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#E63946]" />
                <h3 className="font-bold text-sm text-white">Yeni Profil Resmi</h3>
              </div>
              <button
                onClick={() => setShowAvatarConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#232833] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-2 flex flex-col items-center">
              <div className="relative">
                <img
                  src={pendingAvatarUrl}
                  alt="Seçilen Fotoğraf Önizlemesi"
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-[#E63946] shadow-2xl"
                />
                <div className="absolute bottom-1 right-1 bg-[#E63946] text-white p-2 rounded-full shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Galerinizden seçtiğiniz fotoğraf profil resminiz olarak kaydedilsin mi?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#232833]">
              <button
                type="button"
                onClick={() => directAvatarInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#232833] hover:bg-[#2B313E] text-slate-300 hover:text-white transition"
              >
                Farklı Seç
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateProfile && pendingAvatarUrl) {
                    onUpdateProfile({ avatar_url: pendingAvatarUrl });
                    setFormAvatarUrl(pendingAvatarUrl);
                  }
                  setShowAvatarConfirmModal(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold bg-[#E63946] hover:bg-[#d62839] text-white shadow-lg transition hover:scale-105 active:scale-95"
              >
                Kaydet ve Uygula
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DETAYLI KARŞILAŞTIRMA MODAL / POP-UP       */}
      {/* ========================================== */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCompareModal(false);
            }}
            className="fixed inset-0 z-80 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#14171D] border border-[#2B313E] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b border-[#232833] pb-4">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Dostça Rekabet & Uyum Analizi
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {myFirstName} vs {otherFirstName}
                  </h3>
                </div>
              </div>

              {/* Compatibility Overview Banner Inside Modal */}
              <div 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                className="p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center -space-x-3 shrink-0">
                    <img
                      src={myUser.avatar_url}
                      alt={myFirstName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#14171D] shadow-md"
                    />
                    <img
                      src={user.avatar_url}
                      alt={otherFirstName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#14171D] shadow-md z-10"
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                      <span>%{compatibilityRate} Zevk Uyum Oranı</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {myFirstName} ve {otherFirstName} izleme alışkanlıkları karşılaştırması
                    </p>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 ${badgeConfig.colorStyle}`}>
                  {badgeConfig.icon}
                  <span>{badgeConfig.label}</span>
                </div>
              </div>

              {/* SECTION 1: Ortak İzlenen Diziler/Filmler */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#E63946]" />
                    <span>Ortak İzlenen Diziler & Filmler ({SHARED_MEDIA_ITEMS.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-semibold">İkinizin de listesindeki yapımlar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SHARED_MEDIA_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectMediaById) onSelectMediaById(item.id, item.media_type);
                        setShowCompareModal(false);
                      }}
                      className="group relative bg-[#0B0C0E] border border-[#232833] hover:border-amber-400/50 rounded-2xl p-2 cursor-pointer transition duration-200 hover:scale-[1.03] space-y-2 overflow-hidden shadow-lg"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden relative bg-[#1A1D23]">
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-black text-amber-400 border border-white/10 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: İzleme Süresi İkilemi */}
              <div className="space-y-3 pt-2 border-t border-[#232833]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>İzleme Süresi İkilemi</span>
                  </h4>
                  <span className="text-[11px] text-cyan-400 font-bold">
                    {myFirstName} (42 Gün) vs {otherFirstName} (38 Gün)
                  </span>
                </div>

                <div className="bg-[#0B0C0E] border border-[#232833] rounded-2xl p-4 space-y-3">
                  {/* Yusuf Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E63946]" />
                        {myFirstName} ({myUser.username})
                      </span>
                      <span className="text-white font-mono font-black">42 Gün 14 Saat</span>
                    </div>
                    <div className="w-full h-3 bg-[#1A1D23] rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full bg-gradient-to-r from-[#E63946] to-rose-400 rounded-full w-[85%] transition-all duration-500" />
                    </div>
                  </div>

                  {/* Zeynep Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                        {otherFirstName} ({user.username})
                      </span>
                      <span className="text-white font-mono font-black">38 Gün 06 Saat</span>
                    </div>
                    <div className="w-full h-3 bg-[#1A1D23] rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full bg-gradient-to-r from-[#3B82F6] to-cyan-400 rounded-full w-[76%] transition-all duration-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Favori Tür Çakışması */}
              <div className="space-y-3 pt-2 border-t border-[#232833]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Favori Tür Çakışması</span>
                  </h4>
                  <span className="text-[11px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                    %35+ Ortak Tür
                  </span>
                </div>

                <div className="bg-[#0B0C0E] border border-[#232833] rounded-2xl p-4 space-y-3 text-xs">
                  <p className="text-slate-300 font-semibold italic text-center sm:text-left">
                    "İkiniz de %35+ oranında Bilim Kurgu seviyorsunuz!"
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* Sci-Fi */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-cyan-300">Bilim Kurgu / Sci-Fi</span>
                        <span className="text-white font-mono">%38 Ortak Çakışma</span>
                      </div>
                      <div className="w-full h-2 bg-[#1A1D23] rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full w-[38%]" />
                      </div>
                    </div>

                    {/* Drama */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-purple-300">Drama</span>
                        <span className="text-white font-mono">%28 Ortak Çakışma</span>
                      </div>
                      <div className="w-full h-2 bg-[#1A1D23] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full w-[28%]" />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-amber-300">Aksiyon & Macera</span>
                        <span className="text-white font-mono">%22 Ortak Çakışma</span>
                      </div>
                      <div className="w-full h-2 bg-[#1A1D23] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-[22%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-[#232833] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs bg-[#232833] hover:bg-[#2B313E] text-white transition border border-white/10"
                >
                  Kapat
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MONTHLY RECAP MODAL */}
      <MonthlyRecapModal
        isOpen={showMonthlyRecapModal}
        onClose={() => setShowMonthlyRecapModal(false)}
        user={user}
        watchList={watchList}
        episodeProgress={episodeProgress}
        reviews={reviews}
        onSelectMediaById={onSelectMediaById}
      />

      {/* MONTHLY WATCHED ALL ITEMS POPUP MODAL */}
      <AnimatePresence>
        {showAllWatchedModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllWatchedModal(false);
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14171D] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      İzleme Geçmişi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Toplam {monthlyWatchedItems.length} film ve dizi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllWatchedModal(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of All Watched Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto p-1 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                {monthlyWatchedItems.length > 0 ? (
                  monthlyWatchedItems.map((item) => (
                    <div
                      key={'modal_' + item.id + item.title}
                      onClick={() => {
                        setShowAllWatchedModal(false);
                        onSelectMediaById?.(item.id, item.type);
                      }}
                      className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-[#E63946]/70 rounded-xl p-2 space-y-1.5 cursor-pointer transition group hover:-translate-y-1 shadow-md"
                    >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40">
                      <img
                        src={item.poster}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-1 right-1 bg-black/85 text-amber-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                        {item.badge.includes('★') ? (
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ) : null}
                        {item.badge}
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-white/10">
                        {item.type === 'tv' ? 'Dizi' : 'Film'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white truncate group-hover:text-[#E63946] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate font-medium">
                        {item.subtitle}
                      </p>
                      <p className="text-[8px] text-emerald-400 font-mono pt-0.5">
                        ✓ {item.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 sm:col-span-3 md:col-span-4 text-center text-slate-500 font-semibold text-xs py-10">
                  Henüz izleme geçmişi bulunmuyor.
                </div>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALL WATCHED MOVIES OR TV SHOWS MODAL */}
      <AnimatePresence>
        {allWatchedTypeModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setAllWatchedTypeModal(null);
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14171D] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                    {allWatchedTypeModal === 'movie' ? (
                      <Film className="w-5 h-5" />
                    ) : (
                      <Tv className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {allWatchedTypeModal === 'movie' ? 'İzlenen Bütün Filmler' : 'İzlenen Bütün Diziler'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {allWatchedTypeModal === 'movie'
                        ? `Kütüphanendeki toplam ${watchList.filter(w => w.media_type === 'movie' && w.status === 'watched').length} film`
                        : `Kütüphanendeki toplam ${watchList.filter(w => w.media_type === 'tv' && (w.status === 'watched' || w.status === 'watching')).length} dizi`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllWatchedTypeModal(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of All Watched Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto p-1 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                {sortFranchiseAlphabetical(
                  watchList.filter(w => {
                    if (allWatchedTypeModal === 'movie') {
                      return w.media_type === 'movie' && w.status === 'watched';
                    } else {
                      return w.media_type === 'tv' && (w.status === 'watched' || w.status === 'watching');
                    }
                  })
                )
                  .map((item) => {
                    const posterUrl = getPosterUrl(item.poster_path);
                    return (
                      <div
                        key={'all_watched_' + item.media_id}
                        onClick={() => {
                          setAllWatchedTypeModal(null);
                          onSelectMediaById?.(item.media_id, item.media_type);
                        }}
                        className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-[#E63946]/70 rounded-xl p-2 space-y-1.5 cursor-pointer transition group hover:-translate-y-1 shadow-md"
                      >
                        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/40">
                          {posterUrl ? (
                            <img
                              src={posterUrl}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-black/60 text-slate-500">
                              <Film className="w-8 h-8 text-slate-600" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1 bg-black/85 text-amber-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-white/10">
                            {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-white truncate group-hover:text-[#E63946] transition-colors">
                            {item.title || 'İsimsiz Yapım'}
                          </h4>
                          <p className="text-[9px] text-slate-400 truncate font-medium">
                            {item.media_type === 'tv' ? `${item.total_seasons || 1} Sezon` : 'Film'}
                          </p>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {item.status === 'watching' ? '⏳ İzleniyor' : '✓ Tamamlandı'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {watchList.filter(w => {
                  if (allWatchedTypeModal === 'movie') {
                    return w.media_type === 'movie' && w.status === 'watched';
                  } else {
                    return w.media_type === 'tv' && (w.status === 'watched' || w.status === 'watching');
                  }
                }).length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                    Henüz izlenmiş yapım bulunmuyor.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALL CUSTOM COLLECTIONS MODAL */}
      <AnimatePresence>
        {showAllCollectionsModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllCollectionsModal(false);
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14171D] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Özel Listeler
                    </h3>
                    <p className="text-xs text-slate-400">
                      Oluşturulan toplam {collections.length} liste
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllCollectionsModal(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of All Collections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-1 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                {collections.map(col => {
                  const firstItemWithPoster = col.items.find(i => i.poster_path) || col.items[0];
                  const posterUrl = firstItemWithPoster ? getPosterUrl(firstItemWithPoster.poster_path) : null;

                  return (
                    <div
                      key={'modal_col_' + col.id}
                      onClick={() => {
                        setShowAllCollectionsModal(false);
                        if (onSelectCollection) onSelectCollection(col.id);
                        onSelectTab('collections');
                      }}
                      style={{ borderColor: `${col.color || '#E63946'}30` }}
                      className="bg-white/[0.03] backdrop-blur-md border rounded-xl p-3 shadow-lg hover:border-[#E63946] transition duration-300 cursor-pointer flex items-center gap-3.5 group"
                    >
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={col.title}
                          className="w-10 h-14 rounded-lg object-cover shadow-md border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                          <Film className="w-4 h-4 text-slate-500" />
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#E63946] transition-colors truncate">
                            {col.title}
                          </h3>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-md shrink-0">
                            {col.items.length} Yapım
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                          {col.description || 'Kişisel liste kütüphanesi.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TMDB Interactive Banner Modal */}
      <ProfileBannerModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        currentBannerUrl={bannerUrl}
        currentFeaturedTitle={featuredTitle}
        onSaveBanner={(newBannerUrl, newFeaturedTitle) => {
          if (onUpdateProfile) {
            onUpdateProfile({
              banner_url: newBannerUrl,
              featured_media_title: newFeaturedTitle
            });
          }
        }}
      />
    </div>
  );
};
