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

  // Followers / Following Lists
  const [followers, setFollowers] = useState([
    { id: 'f1', name: 'Zeynep Kaya', username: 'zeynep_k', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', isFollowing: true },
    { id: 'f2', name: 'Ahmet Yılmaz', username: 'ahmet_y', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', isFollowing: false },
    { id: 'f3', name: 'Selin Demir', username: 'selin_d', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', isFollowing: true },
    { id: 'f4', name: 'Can Arslan', username: 'can_arslan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', isFollowing: true }
  ]);

  const [following, setFollowing] = useState([
    { id: 'g1', name: 'Can Arslan', username: 'can_arslan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', isFollowing: true },
    { id: 'g2', name: 'Elif Şahin', username: 'elif_s', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', isFollowing: true },
    { id: 'g3', name: 'Mert Aksoy', username: 'mert_a', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', isFollowing: true }
  ]);

  // Real Counts
  const moviesWatchedCount = watchList.filter(w => w.media_type === 'movie' && w.status === 'watched').length;
  const tvShowsWatchedCount = watchList.filter(w => w.media_type === 'tv' && (w.status === 'watched' || w.status === 'watching')).length;
  const watchedEpsCount = episodeProgress.filter(ep => ep.is_watched).length;

  // Watch Time calculation
  const totalMinutes = (moviesWatchedCount * 122) + (watchedEpsCount * 48);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalDays = (totalHours / 24).toFixed(1);

  // User Favorites Top 5 Selection
  const displayedFavorites = (() => {
    if (!favorites || favorites.length === 0) return [];
    return favorites.slice(0, 5).map((fav, index) => ({
      id: fav.media_id,
      rank: index + 1,
      type: fav.media_type,
      title: fav.title || 'Yapım',
      genre: fav.media_type === 'tv' ? 'Dizi' : 'Film',
      rating: fav.vote_average || 8.5,
      poster: fav.poster_path ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'
    }));
  })();

  // Recent Watched Activity (Top 4-5)
  const recentWatchedActivity = (() => {
    const items = watchList.filter(w => w.status === 'watched' || w.status === 'watching');
    return items.slice(0, 5).map(item => ({
      id: item.media_id,
      type: item.media_type,
      title: item.title || 'Yapım',
      rating: item.vote_average || 8.5,
      poster: item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      date: item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Son Zamanlarda'
    }));
  })();

  // User Reviews / Pinned Reviews
  const displayReviews = reviews.length > 0 ? reviews : MOCK_PINNED_REVIEWS;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 -mb-12 min-h-screen bg-[#14181c] text-[#9ab] font-sans pb-24 overflow-x-hidden">
      
      {/* Centered Main Layout Container (Max-Width 1100px) */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* ========================================== */}
        {/* 1. LETTERBOXD STYLE HEADER & PROFILE CARD */}
        {/* ========================================== */}
        <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6">
          
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            
            {/* Left: Avatar, Username, Verified Badge & Bio */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left min-w-0 flex-1">
              <div className="relative shrink-0">
                <UserAvatar user={user} size="2xl" showEditCameraBadge={false} />
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight truncate">
                    {user.full_name || user.username}
                  </h1>
                  <span className="p-0.5 rounded-full bg-[#00e054]/15 text-[#00e054] border border-[#00e054]/30" title="Onaylı Profil">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-400 font-semibold truncate">@{user.username}</p>

                {user.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 italic max-w-lg leading-relaxed pt-0.5">
                    "{user.bio}"
                  </p>
                )}

                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2c3440] hover:bg-[#363f4e] text-white text-xs font-bold transition border border-[#3e4856] shadow cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00e054]" />
                      <span>Profili Düzenle</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleFollowUser && onToggleFollowUser(user.id)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition ${
                        isFollowing
                          ? 'bg-[#2c3440] text-slate-300 border border-[#3e4856]'
                          : 'bg-[#00e054] hover:bg-[#00c84b] text-slate-950 font-extrabold'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-4 h-4 text-[#00e054]" /> : <UserPlus className="w-4 h-4" />}
                      <span>{isFollowing ? 'Takiptesin' : 'Takip Et'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Big Counter Stats (Filmler | Diziler | İncelemeler | Takipçiler) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-6 bg-[#14181c] border border-[#2c3440] rounded-xl p-3 sm:p-4 shrink-0 text-center w-full md:w-auto">
              <div className="px-2">
                <div className="text-lg sm:text-2xl font-black text-white">{moviesWatchedCount}</div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Filmler</div>
              </div>
              <div className="px-2 border-l border-[#2c3440]">
                <div className="text-lg sm:text-2xl font-black text-white">{tvShowsWatchedCount}</div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Diziler</div>
              </div>
              <div className="px-2 border-l border-[#2c3440]">
                <div className="text-lg sm:text-2xl font-black text-white">{reviews.length}</div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">İncelemeler</div>
              </div>
              <div className="px-2 border-l border-[#2c3440]">
                <button
                  onClick={() => { setFollowerTab('followers'); setShowFollowersModal(true); }}
                  className="hover:opacity-80 transition cursor-pointer"
                >
                  <div className="text-lg sm:text-2xl font-black text-[#00e054]">{followers.length + (!isOwnProfile && isFollowing ? 1 : 0)}</div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Takipçiler</div>
                </button>
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* 2. LETTERBOXD TAB SWITCHER NAVIGATION      */}
          {/* ========================================== */}
          <div className="border-b border-[#2c3440] flex items-center gap-1 sm:gap-6 overflow-x-auto scrollbar-none pt-2">
            {[
              { id: 'profil', label: 'Profil' },
              { id: 'movies', label: `Filmler (${moviesWatchedCount})` },
              { id: 'tv', label: `Diziler (${tvShowsWatchedCount})` },
              { id: 'reviews', label: `İncelemeler (${reviews.length})` },
              { id: 'stats', label: 'İstatistik & Wrapped' }
            ].map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`pb-3 px-2 sm:px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative cursor-pointer ${
                    isActive ? 'text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e054] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* ========================================== */}
        {/* TAB CONTENT AREAS                          */}
        {/* ========================================== */}

        {/* TAB 1: PROFIL (MAIN LANDING VIEW) */}
        {activeSubTab === 'profil' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* 1. FAVORİLER (TOP 5 SHOWCASE) */}
            <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#ff8000]/15 text-[#ff8000] border border-[#ff8000]/30">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Favoriler</h2>
                    <p className="text-[11px] text-slate-400">Profilde sergilenen En Sevilen 5 Yapım</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#00e054] bg-[#00e054]/10 px-2.5 py-1 rounded-lg border border-[#00e054]/20">
                  Top 5 Seçkisi
                </span>
              </div>

              {/* 5-Column Compact Grid */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {Array.from({ length: 5 }).map((_, index) => {
                  const rank = index + 1;
                  const item = displayedFavorites[index];

                  if (item) {
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectMediaById?.(item.id, item.type)}
                        className="relative bg-[#14181c] border border-[#2c3440] hover:border-[#00e054] rounded-xl p-1.5 sm:p-2 space-y-1.5 transition duration-300 group cursor-pointer hover:-translate-y-1 shadow-lg min-w-0 flex flex-col justify-between"
                      >
                        {/* Rank Badge */}
                        <div className="absolute -top-1.5 -left-1.5 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#00e054] text-slate-950 font-mono font-black text-[9px] sm:text-xs flex items-center justify-center border border-[#00e054] shadow">
                          #{rank}
                        </div>

                        {/* Aspect 2:3 Poster */}
                        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/50">
                          <img
                            src={item.poster}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-md text-[#00e054] font-mono text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5 shadow-md">
                            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#00e054] text-[#00e054]" />
                            {item.rating}
                          </div>
                        </div>

                        <div className="space-y-0.5 text-center min-w-0 pt-0.5">
                          <h4 className="text-[10px] sm:text-xs font-black text-white truncate group-hover:text-[#00e054] transition-colors leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[8.5px] sm:text-[10px] text-slate-400 truncate font-medium">
                            {item.genre}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`empty-fav-${rank}`}
                      className="relative bg-[#14181c]/50 border border-dashed border-[#2c3440] rounded-xl p-1.5 sm:p-2 space-y-1.5 flex flex-col justify-between shadow-inner select-none"
                    >
                      <div className="absolute -top-1.5 -left-1.5 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#2c3440] text-slate-400 font-mono text-[9px] sm:text-xs flex items-center justify-center border border-[#3e4856]">
                        #{rank}
                      </div>
                      <div className="relative aspect-[2/3] w-full rounded-lg bg-black/20 border border-[#2c3440] flex flex-col items-center justify-center gap-1.5 text-slate-600">
                        <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600 fill-none" />
                        <span className="text-[8.5px] sm:text-[10.5px] text-slate-500 font-bold">Boş Slot</span>
                      </div>
                      <div className="text-center py-0.5">
                        <span className="text-[7px] sm:text-[9px] text-slate-600">• • •</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. EN SON İZLENENLER (RECENT ACTIVITY) */}
            <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#00e054]/15 text-[#00e054] border border-[#00e054]/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">En Son İzlenenler</h2>
                    <p className="text-[11px] text-slate-400">Yakın zamanda tamamlanan film ve bölümler</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {recentWatchedActivity.length > 0 ? (
                  recentWatchedActivity.map(item => (
                    <div
                      key={item.id + item.title}
                      onClick={() => onSelectMediaById?.(item.id, item.type)}
                      className="bg-[#14181c] border border-[#2c3440] hover:border-[#00e054] rounded-xl p-1.5 sm:p-2 space-y-1.5 transition duration-300 group cursor-pointer hover:-translate-y-1 shadow-lg min-w-0 flex flex-col justify-between"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/50">
                        <img
                          src={item.poster}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-md text-[#00e054] font-mono text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5 shadow-md">
                          <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#00e054] text-[#00e054]" />
                          {item.rating}
                        </div>
                      </div>

                      <div className="space-y-0.5 text-center min-w-0 pt-0.5">
                        <h4 className="text-[10px] sm:text-xs font-black text-white truncate group-hover:text-[#00e054] transition-colors leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-[8.5px] sm:text-[10px] text-slate-400 truncate font-medium">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-5 bg-[#14181c]/40 border border-dashed border-[#2c3440] rounded-xl p-6 text-center text-xs text-slate-400">
                    Henüz izlenmiş içerik bulunmuyor.
                  </div>
                )}
              </div>
            </div>

            {/* 3. SABİTLENEN İNCELEMELER (PINNED REVIEWS) */}
            <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Sabitlenen İncelemeler</h2>
                    <p className="text-[11px] text-slate-400">Öne çıkan detaylı eleştiri ve yorumlar</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {displayReviews.slice(0, 3).map(rev => (
                  <div
                    key={rev.id}
                    className="bg-[#14181c] border border-[#2c3440] hover:border-[#00e054]/60 rounded-xl p-4 transition duration-300 flex flex-col sm:flex-row items-start gap-4 shadow-lg group"
                  >
                    {/* Small Poster Thumbnail */}
                    <div 
                      onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                      className="w-16 h-24 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-[#2c3440] cursor-pointer group-hover:border-[#00e054] transition"
                    >
                      <img
                        src={rev.media_poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                        alt={rev.media_title || 'Yapım'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Review Details */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 
                            onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                            className="text-sm sm:text-base font-black text-white hover:text-[#00e054] cursor-pointer transition"
                          >
                            {rev.media_title || 'Yapım'}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">({rev.media_type === 'tv' ? 'Dizi' : 'Film'})</span>
                        </div>

                        {/* Green Rating Stars */}
                        <div className="flex items-center gap-1 bg-[#00e054]/10 border border-[#00e054]/30 px-2 py-0.5 rounded-lg text-[#00e054] font-mono text-xs font-black">
                          <Star className="w-3.5 h-3.5 fill-[#00e054] text-[#00e054]" />
                          <span>{rev.rating || 9.5} / 10</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic font-normal">
                        "{rev.review_text}"
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#2c3440]/60">
                        <span>{rev.created_at || 'Yakın Zamanda'}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                            <ThumbsUp className="w-3.5 h-3.5 text-[#00e054]" />
                            <span>{rev.likes_count || 12}</span>
                          </span>
                          <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rev.comments_count || 3}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MOVIES (FİLMLER) */}
        {activeSubTab === 'movies' && (
          <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in duration-300 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider">İzlenen Filmler ({moviesWatchedCount})</h2>
              <span className="text-xs text-slate-400 font-medium">Toplam {moviesWatchedCount} film kütüphanede</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {watchList.filter(w => w.media_type === 'movie').length > 0 ? (
                watchList.filter(w => w.media_type === 'movie').map(item => (
                  <div
                    key={item.media_id}
                    onClick={() => onSelectMediaById?.(item.media_id, 'movie')}
                    className="bg-[#14181c] border border-[#2c3440] hover:border-[#00e054] rounded-xl p-2 space-y-2 cursor-pointer transition duration-300 group hover:-translate-y-1 shadow-lg"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/50">
                      <img
                        src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || 'Film'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-[#00e054] font-mono text-xs font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-[#00e054] text-[#00e054]" />
                        {item.vote_average || 8.0}
                      </div>
                    </div>
                    <div className="text-center min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[#00e054] transition">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate uppercase font-bold">{item.status === 'watched' ? 'Tamamlandı' : 'İzlenecek'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 py-12 text-center text-xs text-slate-400 font-semibold">
                  Kütüphanenizde henüz film bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TV (DİZİLER) */}
        {activeSubTab === 'tv' && (
          <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in duration-300 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider">İzlenen & Takip Edilen Diziler ({tvShowsWatchedCount})</h2>
              <span className="text-xs text-slate-400 font-medium">Toplam {tvShowsWatchedCount} dizi kütüphanede</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {watchList.filter(w => w.media_type === 'tv').length > 0 ? (
                watchList.filter(w => w.media_type === 'tv').map(item => (
                  <div
                    key={item.media_id}
                    onClick={() => onSelectMediaById?.(item.media_id, 'tv')}
                    className="bg-[#14181c] border border-[#2c3440] hover:border-[#00e054] rounded-xl p-2 space-y-2 cursor-pointer transition duration-300 group hover:-translate-y-1 shadow-lg"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-black/50">
                      <img
                        src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || 'Dizi'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-[#00e054] font-mono text-xs font-black px-1.5 py-0.5 rounded border border-[#00e054]/30 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-[#00e054] text-[#00e054]" />
                        {item.vote_average || 8.5}
                      </div>
                    </div>
                    <div className="text-center min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[#00e054] transition">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate uppercase font-bold">{item.status === 'watched' ? 'Tamamlandı' : 'İzleniyor'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 py-12 text-center text-xs text-slate-400 font-semibold">
                  Kütüphanenizde henüz dizi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS (İNCELEMELER) */}
        {activeSubTab === 'reviews' && (
          <div className="bg-[#181e23] border border-[#2c3440] rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in duration-300 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Tüm İncelemelerin ({displayReviews.length})</h2>
              <span className="text-xs text-slate-400 font-medium">Topluluğa kattığın tüm değerlendirmeler</span>
            </div>

            <div className="space-y-4">
              {displayReviews.map(rev => (
                <div
                  key={rev.id}
                  className="bg-[#14181c] border border-[#2c3440] hover:border-[#00e054]/60 rounded-xl p-4 transition duration-300 flex flex-col sm:flex-row items-start gap-4 shadow-lg group"
                >
                  <div 
                    onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                    className="w-16 h-24 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-[#2c3440] cursor-pointer group-hover:border-[#00e054] transition"
                  >
                    <img
                      src={rev.media_poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                      alt={rev.media_title || 'Yapım'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 
                          onClick={() => onSelectMediaById?.(rev.media_id, rev.media_type)}
                          className="text-sm sm:text-base font-black text-white hover:text-[#00e054] cursor-pointer transition"
                        >
                          {rev.media_title || 'Yapım'}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">({rev.media_type === 'tv' ? 'Dizi' : 'Film'})</span>
                      </div>

                      <div className="flex items-center gap-1 bg-[#00e054]/10 border border-[#00e054]/30 px-2.5 py-0.5 rounded-lg text-[#00e054] font-mono text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-[#00e054] text-[#00e054]" />
                        <span>{rev.rating || 9.0} / 10</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic font-normal">
                      "{rev.review_text}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#2c3440]/60">
                      <span>{rev.created_at || 'Yakın Zamanda'}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                          <ThumbsUp className="w-3.5 h-3.5 text-[#00e054]" />
                          <span>{rev.likes_count || 8}</span>
                        </span>
                        <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rev.comments_count || 2}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight">✨ Spotify Wrapped Tarzı Aylık Özetin</h3>
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
  );
};
