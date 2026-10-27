import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Film, Tv, Clock, Star, Calendar, Trophy, User, 
  Share2, X, ChevronRight, ChevronLeft, Flame, Award, Heart, CheckCircle2,
  Play, BarChart2, MessageSquare, Check, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, WatchStatus, EpisodeProgress, RatingReview } from '../types';
import { getDetails } from '../lib/tmdb';
import { DEFAULT_AVATAR_URL } from '../lib/constants';
import { calculateGenreDistribution } from '../utils/genreUtils';

interface MonthlyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile;
  watchList: WatchStatus[];
  episodeProgress: EpisodeProgress[];
  reviews: RatingReview[];
  onSelectMediaById?: (id: number, mediaType: 'movie' | 'tv') => void;
}

interface SpotlightItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster: string;
  rating: number | null;
  episodesWatched?: number;
  badge: string;
  subtitle: string;
}

interface TopActorItem {
  name: string;
  role: string;
  photo: string;
  appearances: string;
  description: string;
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
  const [copied, setCopied] = useState<boolean>(false);
  const [topSeriesDetails, setTopSeriesDetails] = useState<SpotlightItem | null>(null);
  const [topRatedDetails, setTopRatedDetails] = useState<SpotlightItem | null>(null);
  const [topActor, setTopActor] = useState<TopActorItem | null>(null);

  // Month & Year string
  const currentMonthName = useMemo(() => {
    const d = new Date();
    const str = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

  // 1. Filter Target User's Live Data
  const targetUserReviews = useMemo(() => {
    return reviews.filter(r => 
      (r.user_id && user.id && r.user_id === user.id) || 
      (r.username && user.username && r.username.toLowerCase() === user.username.toLowerCase())
    );
  }, [reviews, user.id, user.username]);

  const watchedEpisodes = useMemo(() => {
    return episodeProgress.filter(ep => 
      ep.is_watched && (!ep.user_id || !user.id || ep.user_id === user.id)
    );
  }, [episodeProgress, user.id]);

  const userWatchList = useMemo(() => {
    return watchList.filter(w => !w.user_id || !user.id || w.user_id === user.id);
  }, [watchList, user.id]);

  const watchedMovies = useMemo(() => {
    return userWatchList.filter(w => (w.status === 'watched' || w.status === 'watching') && w.media_type === 'movie');
  }, [userWatchList]);

  const watchedTvShows = useMemo(() => {
    return userWatchList.filter(w => (w.status === 'watched' || w.status === 'watching') && w.media_type === 'tv');
  }, [userWatchList]);

  // 2. Accurate Counts
  const movieCount = watchedMovies.length;
  const episodeCount = watchedEpisodes.length;
  const reviewCount = targetUserReviews.length;

  // 3. Dynamic Watch Minutes & Hours calculation (matching ProfileView)
  const totalWatchMinutes = useMemo(() => {
    let mins = 0;
    watchedMovies.forEach(movie => {
      mins += (movie.runtime && movie.runtime > 0) ? movie.runtime : 118;
    });
    watchedEpisodes.forEach(ep => {
      mins += (ep.runtime && ep.runtime > 0) ? ep.runtime : 45;
    });
    return mins;
  }, [watchedMovies, watchedEpisodes]);

  const totalHours = Math.floor(totalWatchMinutes / 60);
  const remainingMinutes = totalWatchMinutes % 60;

  // 4. Calculate Episodes per TV Series to find Top Watched Series
  const { topShowId, topShowEpCount } = useMemo(() => {
    const showEpCounts: Record<number, number> = {};
    watchedEpisodes.forEach(ep => {
      const sid = Number(ep.show_id);
      if (sid) {
        showEpCounts[sid] = (showEpCounts[sid] || 0) + 1;
      }
    });

    const sorted = Object.entries(showEpCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return { topShowId: Number(sorted[0][0]), topShowEpCount: sorted[0][1] };
    }

    // Fallback to first watched TV show in watchList if no episode progress records
    if (watchedTvShows.length > 0) {
      return { topShowId: Number(watchedTvShows[0].media_id), topShowEpCount: 0 };
    }

    return { topShowId: null, topShowEpCount: 0 };
  }, [watchedEpisodes, watchedTvShows]);

  // 5. Calculate Top Rated Item / Review
  const { topRatedMediaId, topRatedMediaType, topPersonalRating, topReviewText } = useMemo(() => {
    // Check user's written reviews first
    const ratedReviews = targetUserReviews.filter(r => typeof r.rating === 'number' && r.rating > 0);
    if (ratedReviews.length > 0) {
      const best = [...ratedReviews].sort((a, b) => b.rating - a.rating)[0];
      return {
        topRatedMediaId: Number(best.media_id),
        topRatedMediaType: best.media_type,
        topPersonalRating: best.rating,
        topReviewText: best.review_text || ''
      };
    }

    // Check user's watchList ratings
    const ratedWatch = userWatchList.filter(w => typeof w.rating === 'number' && w.rating > 0);
    if (ratedWatch.length > 0) {
      const best = [...ratedWatch].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      return {
        topRatedMediaId: Number(best.media_id),
        topRatedMediaType: best.media_type,
        topPersonalRating: best.rating || 10,
        topReviewText: ''
      };
    }

    // If movies watched, fallback to first watched movie
    if (watchedMovies.length > 0) {
      return {
        topRatedMediaId: Number(watchedMovies[0].media_id),
        topRatedMediaType: 'movie' as const,
        topPersonalRating: watchedMovies[0].vote_average || 8.5,
        topReviewText: ''
      };
    }

    return { topRatedMediaId: null, topRatedMediaType: 'movie' as const, topPersonalRating: null, topReviewText: '' };
  }, [targetUserReviews, userWatchList, watchedMovies]);

  // 6. Dynamic Genre Calculation using shared utility
  const genreDistribution = useMemo(() => {
    const allWatchedItems = [...watchedMovies, ...watchedTvShows];
    return calculateGenreDistribution(allWatchedItems);
  }, [watchedMovies, watchedTvShows]);

  const topGenre = genreDistribution.length > 0 ? genreDistribution[0] : { genre: 'Drama', percent: 35 };

  // 7. Real Average Rating calculation
  const realAvgRating = useMemo(() => {
    const ratings: number[] = [];
    userWatchList.forEach(w => {
      if (typeof w.rating === 'number' && w.rating > 0) ratings.push(w.rating);
    });
    targetUserReviews.forEach(r => {
      if (typeof r.rating === 'number' && r.rating > 0) ratings.push(r.rating);
    });
    watchedEpisodes.forEach(ep => {
      if (typeof ep.rating === 'number' && ep.rating > 0) ratings.push(ep.rating);
    });

    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
      return avg.toFixed(1);
    }
    return null;
  }, [userWatchList, targetUserReviews, watchedEpisodes]);

  // 8. Weekly Rhythm calculation with real timestamps
  const daysMap = [
    { short: 'Pzt', full: 'Pazartesi' },
    { short: 'Sal', full: 'Salı' },
    { short: 'Çar', full: 'Çarşamba' },
    { short: 'Per', full: 'Perşembe' },
    { short: 'Cum', full: 'Cuma' },
    { short: 'Cmt', full: 'Cumartesi' },
    { short: 'Paz', full: 'Pazar' }
  ];

  const { weeklyCounts, peakDayName, peakDayIdx } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    let realTracked = 0;

    watchedEpisodes.forEach(ep => {
      const dateStr = ep.watched_at || (ep as any).created_at || (ep as any).updated_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const dayIdx = (d.getDay() + 6) % 7;
          counts[dayIdx] += 1;
          realTracked++;
        }
      }
    });

    watchedMovies.forEach(m => {
      const dateStr = m.updated_at || (m as any).created_at || (m as any).watched_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const dayIdx = (d.getDay() + 6) % 7;
          counts[dayIdx] += 1;
          realTracked++;
        }
      }
    });

    // Fallback distribution only if no timestamps were recorded
    if (realTracked === 0 && (episodeCount + movieCount) > 0) {
      const total = episodeCount + movieCount;
      counts[0] = Math.round(total * 0.12);
      counts[1] = Math.round(total * 0.14);
      counts[2] = Math.round(total * 0.10);
      counts[3] = Math.round(total * 0.16);
      counts[4] = Math.round(total * 0.22);
      counts[5] = Math.round(total * 0.16);
      counts[6] = Math.round(total * 0.10);
    }

    let maxCnt = 0;
    let pIdx = 4; // Cuma as reasonable default
    counts.forEach((cnt, idx) => {
      if (cnt > maxCnt) {
        maxCnt = cnt;
        pIdx = idx;
      }
    });

    return {
      weeklyCounts: counts,
      peakDayName: daysMap[pIdx].full,
      peakDayIdx: pIdx
    };
  }, [watchedEpisodes, watchedMovies, episodeCount, movieCount]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Load Detailed Data for Top Series & Top Lead Actor
  useEffect(() => {
    let isMounted = true;

    async function fetchSpotlightData() {
      // 1. Resolve Top Series
      if (topShowId) {
        const localShow = userWatchList.find(w => Number(w.media_id) === topShowId && w.media_type === 'tv');
        let title = localShow?.title || 'Dizi';
        let poster = localShow?.poster_path 
          ? (localShow.poster_path.startsWith('http') ? localShow.poster_path : `https://image.tmdb.org/t/p/w500${localShow.poster_path}`)
          : defaultPoster;

        try {
          const details = await getDetails(topShowId, 'tv');
          if (details && isMounted) {
            title = details.name || details.title || title;
            if (details.poster_path) {
              poster = details.poster_path.startsWith('http') 
                ? details.poster_path 
                : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
            }

            setTopSeriesDetails({
              id: topShowId,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || (details.vote_average ? Math.round(details.vote_average * 10) / 10 : null),
              episodesWatched: topShowEpCount,
              badge: topShowEpCount > 0 ? `🔥 ${topShowEpCount} Bölüm İzlendi` : 'Takip Ediliyor',
              subtitle: 'Bu ay ekran başında en çok izlediğin dizi'
            });

            // Extract Lead Actor of this exact top series
            if (details.cast && details.cast.length > 0) {
              const lead = details.cast[0];
              const photoUrl = lead.profile_path
                ? (lead.profile_path.startsWith('http') ? lead.profile_path : `https://image.tmdb.org/t/p/w500${lead.profile_path}`)
                : poster;

              setTopActor({
                name: lead.name,
                role: `${lead.character ? `${lead.character} • ` : ''}${title}`,
                photo: photoUrl,
                appearances: `Zirve Dizinin Başrolü`,
                description: `"${title}" dizisinde sergilediği performansla bu ay ekranını en çok süsleyen oyuncu.`
              });
            } else {
              setTopActor(null);
            }
          }
        } catch (err) {
          console.warn('Error loading top series details:', err);
          if (isMounted) {
            setTopSeriesDetails({
              id: topShowId,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || null,
              episodesWatched: topShowEpCount,
              badge: topShowEpCount > 0 ? `🔥 ${topShowEpCount} Bölüm İzlendi` : 'Takip Ediliyor',
              subtitle: 'Bu ay ekran başında en çok izlediğin dizi'
            });
          }
        }
      } else {
        setTopSeriesDetails(null);
      }

      // 2. Resolve Top Rated Item (if different from top series or if high rating exists)
      if (topRatedMediaId && topRatedMediaId !== topShowId) {
        const localItem = userWatchList.find(w => Number(w.media_id) === topRatedMediaId);
        let title = localItem?.title || '';
        let poster = localItem?.poster_path 
          ? (localItem.poster_path.startsWith('http') ? localItem.poster_path : `https://image.tmdb.org/t/p/w500${localItem.poster_path}`)
          : defaultPoster;

        try {
          const details = await getDetails(topRatedMediaId, topRatedMediaType);
          if (details && isMounted) {
            title = details.title || details.name || title || 'Yapım';
            if (details.poster_path) {
              poster = details.poster_path.startsWith('http') 
                ? details.poster_path 
                : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
            }

            setTopRatedDetails({
              id: topRatedMediaId,
              type: topRatedMediaType,
              title,
              poster,
              rating: topPersonalRating,
              badge: topPersonalRating ? `★ ${topPersonalRating}/10 Puanın` : 'Favori Yapım',
              subtitle: topReviewText ? `"${topReviewText.slice(0, 75)}${topReviewText.length > 75 ? '...' : ''}"` : 'En yüksek puan verdiğin içerik'
            });

            // If no actor found from series, pick from top movie
            if (!topShowId && details.cast && details.cast.length > 0) {
              const lead = details.cast[0];
              const photoUrl = lead.profile_path
                ? (lead.profile_path.startsWith('http') ? lead.profile_path : `https://image.tmdb.org/t/p/w500${lead.profile_path}`)
                : poster;

              setTopActor({
                name: lead.name,
                role: `${lead.character ? `${lead.character} • ` : ''}${title}`,
                photo: photoUrl,
                appearances: `Zirve Filmin Başrolü`,
                description: `"${title}" yapımındaki performansıyla ayın öne çıkan oyuncusu.`
              });
            }
          }
        } catch (e) {
          if (isMounted) {
            setTopRatedDetails({
              id: topRatedMediaId,
              type: topRatedMediaType,
              title: title || 'Yapım',
              poster,
              rating: topPersonalRating,
              badge: topPersonalRating ? `★ ${topPersonalRating}/10 Puanın` : 'Favori Yapım',
              subtitle: 'En yüksek puan verdiğin içerik'
            });
          }
        }
      } else {
        setTopRatedDetails(null);
      }
    }

    if (isOpen) {
      fetchSpotlightData();
    }

    return () => { isMounted = false; };
  }, [isOpen, topShowId, topShowEpCount, topRatedMediaId, topRatedMediaType, topPersonalRating, topReviewText, userWatchList]);

  // Handle Share / Copy to Clipboard
  const handleShareRecap = () => {
    const summaryText = `✨ ${user.full_name || user.username} - ${currentMonthName} İzleme Özeti (Wrapped) ✨\n` +
      `⏱️ Toplam Ekran Süresi: ${totalHours} Saat\n` +
      `📺 İzlenen Bölümler: ${episodeCount} Bölüm\n` +
      `🍿 Tamamlanan Filmler: ${movieCount} Film\n` +
      (topSeriesDetails ? `🔥 Zirve Dizi: ${topSeriesDetails.title} (${topSeriesDetails.episodesWatched || 0} Bölüm)\n` : '') +
      `🎭 Favori Tür: ${topGenre.genre} (%${topGenre.percent})\n` +
      `📅 En Yoğun İzleme Günü: ${peakDayName}\n` +
      `🎬 ttime.app`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const hasData = (movieCount > 0 || episodeCount > 0 || watchedTvShows.length > 0 || reviewCount > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-90 bg-black/92 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 cursor-pointer select-none overscroll-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#0D0F17] border-2 border-[#2B313E] rounded-3xl p-5 sm:p-7 max-w-xl sm:max-w-2xl w-full relative cursor-default shadow-2xl overflow-y-auto overflow-x-hidden max-h-[92vh] custom-scrollbar overscroll-contain"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#E63946]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar Navigation: Title, Share & Close */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
                {currentMonthName} İzleme Özeti
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasData && (
                <button
                  type="button"
                  onClick={handleShareRecap}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Özeti Kopyala & Paylaş"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00e054]" />
                      <span className="text-[#00e054]">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Paylaş</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition border border-white/15 shrink-0 cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN RECAP CONTENT */}
          {!hasData ? (
            /* EMPTY STATE */
            <div className="py-14 px-4 text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {currentMonthName} Özetin İçin Henüz Erken!
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
            /* VERTICAL SUMMARY STORY CARD */
            <div className="bg-gradient-to-b from-[#131622] via-[#0E101A] to-[#090A10] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden w-full text-white ring-1 ring-white/10">
              
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
                  <h1 className="text-base sm:text-xl font-black tracking-wider text-amber-400 uppercase font-mono">
                    {currentMonthName}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">AYLIK WRAPPED</span>
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
                <div className="text-xs text-slate-400 font-mono">
                  ({totalWatchMinutes.toLocaleString('tr-TR')} Dakika İzleme Süresi)
                </div>
                <div className="text-sm sm:text-base italic text-slate-300 font-bold">
                  {totalHours >= 40 
                    ? '"Bu ay resmen ekran başında maraton koştun! 🚀"' 
                    : totalHours >= 15 
                      ? '"Harika bir izleme temposu yakaladın! 🍿"' 
                      : '"Kütüphaneni zenginleştirmeye devam ediyorsun! ✨"'}
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
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">{reviewCount}</span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">İNCELEME</span>
                </div>
              </div>

              {/* 4. ZİRVEDEKİ DİZİ (TOP WATCHED TV SHOW) */}
              {topSeriesDetails && (
                <div 
                  onClick={() => {
                    if (onSelectMediaById && topSeriesDetails.id) onSelectMediaById(topSeriesDetails.id, 'tv');
                    onClose();
                  }}
                  className="space-y-1.5 pt-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-amber-400" />
                      ZİRVEDEKİ DİZİN
                    </span>
                    <span className="text-[11px] text-[#00e054] font-bold">
                      {topSeriesDetails.badge}
                    </span>
                  </div>

                  <div className="bg-[#161926]/95 border-2 border-amber-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl group-hover:border-amber-400 transition">
                    <img
                      src={topSeriesDetails.poster}
                      alt={topSeriesDetails.title}
                      className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl object-cover border-2 border-amber-400/60 shrink-0 shadow-lg group-hover:scale-105 transition"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate group-hover:text-amber-300 transition">
                        {topSeriesDetails.title}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        {topSeriesDetails.subtitle}
                      </p>
                      {topSeriesDetails.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black pt-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{topSeriesDetails.rating} / 10 Puan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. ZİRVE FİLM VEYA EN YÜKSEK PUANLADIĞIN İÇERİK (If available) */}
              {topRatedDetails && (
                <div 
                  onClick={() => {
                    if (onSelectMediaById && topRatedDetails.id) onSelectMediaById(topRatedDetails.id, topRatedDetails.type);
                    onClose();
                  }}
                  className="space-y-1.5 pt-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-[#40bcf4] flex items-center gap-1.5">
                      {topRatedDetails.type === 'movie' ? <Film className="w-4 h-4 text-[#40bcf4]" /> : <Award className="w-4 h-4 text-[#40bcf4]" />}
                      {topRatedDetails.type === 'movie' ? 'ZİRVE FİLMİN' : 'EN YÜKSEK PUANLADIĞIN'}
                    </span>
                    <span className="text-[11px] text-[#40bcf4] font-bold">
                      {topRatedDetails.badge}
                    </span>
                  </div>

                  <div className="bg-[#161926]/95 border-2 border-[#40bcf4]/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl group-hover:border-[#40bcf4] transition">
                    <img
                      src={topRatedDetails.poster}
                      alt={topRatedDetails.title}
                      className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl object-cover border-2 border-[#40bcf4]/60 shrink-0 shadow-lg group-hover:scale-105 transition"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate group-hover:text-[#40bcf4] transition">
                        {topRatedDetails.title}
                      </h4>
                      <p className="text-xs text-slate-300 italic font-medium">
                        {topRatedDetails.subtitle}
                      </p>
                      {topRatedDetails.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black pt-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{topRatedDetails.rating} / 10 Kişisel Puanın</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. EKRANINI EN ÇOK SÜSLEYEN OYUNCU */}
              {topActor && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400 block">
                    EKRANINI EN ÇOK SÜSLEYEN OYUNCU
                  </span>
                  <div className="bg-[#161926]/95 border-2 border-purple-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                    <img
                      src={topActor.photo}
                      alt={topActor.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-400/60 shrink-0 shadow-lg"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate">{topActor.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-200 font-bold truncate">{topActor.role}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{topActor.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. HAFTALIK RİTİM (7-Day Cards) */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">HAFTALIK RİTİM</span>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {daysMap.map((d, idx) => {
                    const isPeak = idx === peakDayIdx;
                    const count = weeklyCounts[idx];
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
                          <span className="text-[11px] font-mono text-slate-400">{count > 0 ? count : '•'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 8. EN YOĞUN ANIN CALLOUT BANNER */}
              <div className="bg-[#2E151A]/95 border-2 border-[#E63946]/50 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                <span className="text-2xl shrink-0">🔥</span>
                <p className="leading-relaxed text-slate-100 text-xs sm:text-sm font-semibold">
                  <strong className="text-amber-400 font-extrabold">En yoğun anın:</strong> <span className="font-black text-white">{peakDayName}</span> günü yüksek tempolu izleme maratonu gerçekleştirdin.
                </p>
              </div>

              {/* 9. TÜR & ORT. PUAN GRID */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">ZİRVE TÜR</span>
                  <span className="text-base sm:text-lg font-black text-white uppercase block font-mono">
                    {topGenre.genre}
                  </span>
                  <span className="text-xs text-slate-300 font-medium block">
                    %{topGenre.percent} kütüphane ağırlığı
                  </span>
                </div>

                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">ORT. PUAN</span>
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-base">
                    ★★★★★
                  </div>
                  <span className="text-sm sm:text-base font-black text-white font-mono block">
                    {realAvgRating ? `${realAvgRating} / 10` : (topPersonalRating ? `${topPersonalRating} / 10` : '8.5 / 10')}
                  </span>
                </div>
              </div>

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
