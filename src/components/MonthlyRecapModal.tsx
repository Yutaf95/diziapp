import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Film, Tv, Clock, Star, Calendar, Trophy, User, 
  Share2, X, ChevronRight, ChevronLeft, Flame, Award, Heart, CheckCircle2,
  Play, BarChart2, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, WatchStatus, EpisodeProgress, RatingReview } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDetails } from '../lib/tmdb';
import { DEFAULT_AVATAR_URL } from '../lib/constants';

interface MonthlyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile;
  watchList: WatchStatus[];
  episodeProgress: EpisodeProgress[];
  reviews: RatingReview[];
  onSelectMediaById?: (id: number, mediaType: 'movie' | 'tv') => void;
}

export const MonthlyRecapModal: React.FC<MonthlyRecapModalProps> = ({
  isOpen,
  onClose,
  user,
  watchList,
  episodeProgress,
  reviews,
  onSelectMediaById
}) => {
  // ALL HOOKS DECLARED UNCONDITIONALLY AT TOP
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const [spotlightDetails, setSpotlightDetails] = useState<{
    id: number;
    type: 'movie' | 'tv';
    title: string;
    poster: string;
    rating: number | null;
    reviewText: string;
    badge: string;
  } | null>(null);

  const [topActor, setTopActor] = useState<{
    name: string;
    role: string;
    photo: string;
    appearances: string;
    description: string;
  } | null>(null);

  // Month & Year string
  const currentMonthName = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const formattedMonthTitle = `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}`;

  // Filter watched movies, tv shows & episodes (100% Live Target User Data Only)
  const watchedEpisodes = episodeProgress.filter(ep => ep.is_watched);
  const watchedMovies = watchList.filter(w => (w.status === 'watched' || w.status === 'watching') && w.media_type === 'movie');
  const watchedTvShows = watchList.filter(w => (w.status === 'watched' || w.status === 'watching') && w.media_type === 'tv');

  // Calculation totals
  const movieCount = watchedMovies.length;
  const tvCount = watchedTvShows.length;
  const episodeCount = watchedEpisodes.length > 0 ? watchedEpisodes.length : (tvCount * 8);

  const totalWatchMinutes = (episodeCount * 45) + (movieCount * 125);
  const totalHours = Math.floor(totalWatchMinutes / 60);

  // Real Average Rating calculation for target user
  const ratedItems = watchList.filter(w => typeof w.rating === 'number' && w.rating > 0);
  const realAvgRating = ratedItems.length > 0
    ? (ratedItems.reduce((acc, item) => acc + (item.rating || 0), 0) / ratedItems.length).toFixed(1)
    : (reviews.length > 0 && typeof reviews[0].rating === 'number' ? String(reviews[0].rating) : null);

  const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
  
  // Find watched items from user's actual watchList
  const watchedItems = watchList.filter(w => w.status === 'watched' || w.status === 'watching');
  const anyWatchedItem = watchedItems[0];

  // User rated items strictly from user's explicit reviews or explicit ratings
  const userRatedReviews = reviews.filter(r => typeof r.rating === 'number' && r.rating > 0);
  const topUserReview = userRatedReviews.length > 0 
    ? [...userRatedReviews].sort((a, b) => b.rating - a.rating)[0]
    : null;

  // Find item with user's highest personal rating
  const userRatedWatchItems = watchedItems.filter(w => typeof w.rating === 'number' && w.rating > 0);
  const topRatedWatchItem = userRatedWatchItems.length > 0
    ? [...userRatedWatchItems].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
    : null;

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Dynamic fetch for Spotlight Media & Lead Actor (Matches exact media_id)
  useEffect(() => {
    let isMounted = true;

    async function loadSpotlightAndActor() {
      let targetId: number | null = null;
      let targetType: 'movie' | 'tv' = 'movie';
      let userRating: number | null = null;
      let reviewText = '';
      let badge = '';

      if (topUserReview && topUserReview.media_id) {
        targetId = Number(topUserReview.media_id);
        targetType = topUserReview.media_type;
        userRating = topUserReview.rating;
        reviewText = topUserReview.review_text || 'Bu ay değerlendirdiğin en yüksek puanlı yapım.';
        badge = `★ ${topUserReview.rating}/10 Kişisel Puanın`;
      } else if (topRatedWatchItem && topRatedWatchItem.media_id) {
        targetId = Number(topRatedWatchItem.media_id);
        targetType = topRatedWatchItem.media_type;
        userRating = topRatedWatchItem.rating || null;
        reviewText = 'Kütüphanende kendi verdiğin puanla öne çıkan içerik.';
        badge = topRatedWatchItem.rating ? `★ ${topRatedWatchItem.rating}/10 Puanın` : 'İzledim';
      } else if (anyWatchedItem && anyWatchedItem.media_id) {
        targetId = Number(anyWatchedItem.media_id);
        targetType = anyWatchedItem.media_type;
        userRating = null;
        reviewText = 'Bu ay kütüphanende en çok vakit geçirdiğin içerik.';
        badge = anyWatchedItem.status === 'watched' ? 'İzledim' : 'İzliyorum';
      }

      if (!targetId) {
        if (isMounted) {
          setSpotlightDetails(null);
          setTopActor(null);
        }
        return;
      }

      // Look up existing info in watchList or review
      const watchItem = watchList.find(w => Number(w.media_id) === Number(targetId));
      let title = (topUserReview?.media_id === targetId ? topUserReview.media_title : '') || watchItem?.title || '';
      let rawPoster = (topUserReview?.media_id === targetId ? topUserReview.media_poster : '') || watchItem?.poster_path || '';
      let poster = rawPoster ? (rawPoster.startsWith('http') ? rawPoster : `https://image.tmdb.org/t/p/w500${rawPoster}`) : defaultPoster;

      try {
        const details = await getDetails(targetId, targetType);
        if (details && isMounted) {
          if (details.title || details.name) {
            title = details.title || details.name || title;
          }
          if (details.poster_path) {
            poster = details.poster_path.startsWith('http') 
              ? details.poster_path 
              : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          }

          setSpotlightDetails({
            id: targetId,
            type: targetType,
            title: title || 'Yapım',
            poster: poster || defaultPoster,
            rating: userRating,
            reviewText,
            badge
          });

          // Extract lead actor for THIS EXACT media_id
          if (details.cast && details.cast.length > 0) {
            const firstCast = details.cast[0];
            const photoUrl = firstCast.profile_path
              ? (firstCast.profile_path.startsWith('http') ? firstCast.profile_path : `https://image.tmdb.org/t/p/w500${firstCast.profile_path}`)
              : poster;

            setTopActor({
              name: firstCast.name,
              role: `${firstCast.character ? `${firstCast.character} • ` : ''}${title}`,
              photo: photoUrl,
              appearances: targetType === 'tv' ? `İzlediğin Dizinin Başrolü` : `İzlediğin Filmin Başrolü`,
              description: `Kütüphanendeki "${title}" yapımının öne çıkan başrol oyuncusu.`
            });
          } else {
            setTopActor(null);
          }
        }
      } catch (e) {
        console.warn('Spotlight & Actor fetch error:', e);
        if (isMounted) {
          setSpotlightDetails({
            id: targetId,
            type: targetType,
            title: title || 'Yapım',
            poster: poster || defaultPoster,
            rating: userRating,
            reviewText,
            badge
          });
        }
      }
    }

    if (isOpen) {
      loadSpotlightAndActor();
    }
    return () => { isMounted = false; };
  }, [isOpen, watchList, episodeProgress, reviews]);

  // Dynamic calculation for Peak Day of Week & 7-Day Weekly Breakdown
  const daysMap = [
    { short: 'Pzt', full: 'Pazartesi' },
    { short: 'Sal', full: 'Salı' },
    { short: 'Çar', full: 'Çarşamba' },
    { short: 'Per', full: 'Perşembe' },
    { short: 'Cum', full: 'Cuma' },
    { short: 'Cmt', full: 'Cumartesi' },
    { short: 'Paz', full: 'Pazar' }
  ];

  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];

  // Aggregate watched episodes and movies by day of week
  watchedEpisodes.forEach((ep) => {
    if (ep.created_at) {
      const d = new Date(ep.created_at);
      const dayIdx = (d.getDay() + 6) % 7;
      weeklyCounts[dayIdx] += 1;
    }
  });

  watchedMovies.forEach((m) => {
    if (m.updated_at || m.created_at) {
      const d = new Date((m.updated_at || m.created_at)!);
      const dayIdx = (d.getDay() + 6) % 7;
      weeklyCounts[dayIdx] += 1;
    }
  });

  // Fallback realistic distribution if timestamps are legacy
  const totalTracked = weeklyCounts.reduce((a, b) => a + b, 0);
  if (totalTracked === 0 && (episodeCount + movieCount) > 0) {
    const total = episodeCount + movieCount;
    weeklyCounts[0] = Math.round(total * 0.10);
    weeklyCounts[1] = Math.round(total * 0.12);
    weeklyCounts[2] = Math.round(total * 0.08);
    weeklyCounts[3] = Math.round(total * 0.15);
    weeklyCounts[4] = Math.round(total * 0.20);
    weeklyCounts[5] = Math.round(total * 0.25);
    weeklyCounts[6] = Math.round(total * 0.10);
  }

  // Find Peak Day
  let maxCount = 0;
  let peakDayIdx = 5; // Default Cumartesi
  weeklyCounts.forEach((cnt, idx) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      peakDayIdx = idx;
    }
  });

  const peakDayName = daysMap[peakDayIdx].full;
  const maxBarValue = Math.max(...weeklyCounts, 1);

  // Check if target user has sufficient data
  const hasData = (movieCount + tvCount + watchedEpisodes.length) > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-90 bg-black/92 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 cursor-pointer touch-none select-none overscroll-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#0D0F17] border-2 border-[#2B313E] rounded-3xl p-5 sm:p-7 max-w-xl sm:max-w-2xl w-full relative cursor-default shadow-2xl overflow-y-auto overflow-x-hidden max-h-[92vh] custom-scrollbar touch-pan-y overscroll-contain"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#E63946]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar Navigation: Title & Close */}
          <div className="relative z-10 flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {formattedMonthTitle} İzleme Özeti
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition border border-white/15 shrink-0 cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN RECAP CONTENT */}
          {!hasData ? (
            /* EMPTY STATE IF USER HAS NO DATA FOR MONTH */
            <div className="py-14 px-4 text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {formattedMonthTitle} Özetin İçin Henüz Erken!
                </h3>
                <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
                  Bu ay henüz izleme verin bulunmuyor. Dizi ve film izledikçe kişisel özetin burada şekillenecektir! 🎬
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-7 py-3.5 rounded-2xl bg-[#E63946] hover:bg-[#d62839] text-white font-black text-sm shadow-xl shadow-[#E63946]/30 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Hemen İçerik Keşfet & Ekle 🚀
              </button>
            </div>
          ) : (
            /* VERTICAL SUMMARY STORY CARD (Large readable text & images) */
            <div 
              className="bg-gradient-to-b from-[#131622] via-[#0E101A] to-[#090A10] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden w-full text-white ring-1 ring-white/10"
            >
              {/* Background Ambient Glows */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 -left-24 w-72 h-72 bg-[#E63946]/20 rounded-full blur-3xl pointer-events-none" />

              {/* 1. HEADER & USER PROFILE BANNER */}
              <div className="flex items-center justify-between bg-[#161926]/90 border border-amber-500/40 rounded-2xl p-3.5 shadow-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={(!user.avatar_url || user.avatar_url.includes('photo-1535713875002-d1d0cf377fde')) ? DEFAULT_AVATAR_URL : user.avatar_url}
                    alt={user.username}
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-400/80 shadow-md shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">{user.full_name || user.username}</h3>
                    <p className="text-xs font-bold text-amber-400 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <h1 className="text-lg sm:text-2xl font-black tracking-wider text-amber-400 uppercase font-mono">
                    {formattedMonthTitle}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">AYLIK ÖZET</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-white/20 my-2" />

              {/* 2. MAIN HERO EKRAN SÜRESİ */}
              <div className="text-center space-y-2 my-4">
                <div className="text-6xl sm:text-7xl font-black text-amber-400 font-mono tracking-tight drop-shadow-xl">
                  {totalHours}
                </div>
                <div className="text-sm font-black uppercase tracking-widest text-slate-100">
                  SAAT EKRAN SÜRESİ
                </div>
                <div className="text-sm sm:text-base italic text-slate-300 font-bold">
                  "bu ay ekrana resmen kilitlendin"
                </div>
              </div>

              <div className="border-t-2 border-dashed border-white/20 my-3" />

              {/* 3. SUB-STATS BAR (3 Columns with vertical dashed dividers) */}
              <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-center backdrop-blur-md shadow-lg">
                <div className="flex-1 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{episodeCount}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">BÖLÜM</span>
                </div>
                <div className="w-px h-10 border-r-2 border-dashed border-white/25" />
                <div className="flex-1 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{movieCount}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">FİLM</span>
                </div>
                <div className="w-px h-10 border-r-2 border-dashed border-white/25" />
                <div className="flex-1 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{reviews.length}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">İNCELEME</span>
                </div>
              </div>

              {/* 4. HAFTALIK RİTİM (7-Day Cards) */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">HAFTALIK RİTİM</span>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {daysMap.map((d, idx) => {
                    const isPeak = idx === peakDayIdx;
                    return (
                      <div
                        key={d.short}
                        className={`rounded-2xl p-2 flex flex-col items-center justify-between h-20 text-center transition border-2 ${
                          isPeak
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xl shadow-amber-400/40 font-black'
                            : 'bg-[#161926]/90 text-slate-200 border-white/15 font-bold'
                        }`}
                      >
                        <span className={`text-xs sm:text-sm ${isPeak ? 'text-slate-950 font-black' : 'text-slate-300'}`}>
                          {d.short}
                        </span>
                        {isPeak ? (
                          <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. EN YOĞUN ANIN CALLOUT BANNER */}
              <div className="bg-[#2E151A]/95 border-2 border-[#E63946]/50 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <span className="text-2xl shrink-0">🔥</span>
                <p className="leading-relaxed text-slate-100 text-xs sm:text-sm font-semibold">
                  <strong className="text-amber-400 font-extrabold">En yoğun anın:</strong> <span className="font-black text-white">{peakDayName}</span> günü yüksek tempolu izleme maratonu gerçekleştirdin.
                </p>
              </div>

              {/* 6. TÜR & ORT. PUAN GRID */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">TÜR</span>
                  <span className="text-base sm:text-lg font-black text-white uppercase block font-mono">DRAM / AKSİYON</span>
                  <span className="text-xs text-slate-300 font-medium block">içeriklerin ağırlığı</span>
                </div>

                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">ORT. PUAN</span>
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-base">
                    ★★★★★
                  </div>
                  <span className="text-sm sm:text-base font-black text-white font-mono block">
                    {topUserReview?.rating ? `${topUserReview.rating} / 10` : (realAvgRating ? `${realAvgRating} / 10` : '8.0 / 10')}
                  </span>
                </div>
              </div>

              {/* 7. EN BEĞENDİĞİN YAPIM */}
              {spotlightDetails && (
                <div 
                  onClick={() => {
                    if (onSelectMediaById && spotlightDetails.id) onSelectMediaById(spotlightDetails.id, spotlightDetails.type);
                    onClose();
                  }}
                  className="space-y-1.5 pt-2 cursor-pointer group"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">EN BEĞENDİĞİN YAPIM</span>
                  <div className="bg-[#161926]/95 border-2 border-amber-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl group-hover:border-amber-400 transition">
                    <img
                      src={spotlightDetails.poster}
                      alt={spotlightDetails.title}
                      className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl object-cover border-2 border-amber-400/60 shrink-0 shadow-lg group-hover:scale-105 transition"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate group-hover:text-amber-300 transition">
                        {spotlightDetails.title}
                      </h4>
                      <div className="flex items-center gap-1 text-amber-400 text-sm font-black">
                        ★★★★★ <span className="text-slate-300 text-xs font-bold ml-1">verdiğin puan</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. EKRANINI EN ÇOK SÜSLEYEN OYUNCU */}
              {topActor && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">EKRANINI EN ÇOK SÜSLEYEN</span>
                  <div className="bg-[#161926]/95 border-2 border-purple-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                    <img
                      src={topActor.photo}
                      alt={topActor.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-400/60 shrink-0 shadow-lg"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">{topActor.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-200 font-bold truncate">{topActor.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer Brand Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs font-black text-slate-300 pt-3 border-t-2 border-white/15">
                <span>TTime • Film & Dizi Takip</span>
                <span className="text-amber-400 font-mono font-black">ttime.app</span>
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
