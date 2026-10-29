import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Film, Tv, Clock, Star, Calendar, Trophy, User, 
  Share2, X, ChevronRight, ChevronLeft, ChevronDown, Flame, Award, Heart, CheckCircle2,
  Play, BarChart2, MessageSquare, Check, Copy, Lock, Layers
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

export interface RecapPeriodOption {
  id: string;
  type: 'month' | 'all-time';
  year?: number;
  month?: number; // 0 = Ocak, 9 = Ekim
  label: string;
  badgeLabel?: string;
  isLocked: boolean;
  lockReason?: string;
}

interface SpotlightItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster: string;
  rating: number | null;
  episodesWatched?: number;
  badge: string;
  categoryLabel: string;
  subtitle: string;
}

interface TopActorItem {
  name: string;
  role: string;
  photo: string;
  appearances: string;
  description: string;
}

const TURKISH_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

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
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const [topSeriesDetails, setTopSeriesDetails] = useState<SpotlightItem | null>(null);
  const [secondaryDetails, setSecondaryDetails] = useState<SpotlightItem | null>(null);
  const [topActor, setTopActor] = useState<TopActorItem | null>(null);

  const defaultPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

  // 1. Generate Available Periods (Monthly, Year, All-Time with strict locks)
  const availablePeriods = useMemo<RecapPeriodOption[]>(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();

    const periods: RecapPeriodOption[] = [];

    // Current Month (locked if current day < 28)
    const isCurrentMonthLocked = curDay < 28;
    periods.push({
      id: `${curYear}-${curMonth}`,
      type: 'month',
      year: curYear,
      month: curMonth,
      label: `${TURKISH_MONTH_NAMES[curMonth]} ${curYear}`,
      badgeLabel: isCurrentMonthLocked ? '28\'inde Hazır' : 'Aktif Ay',
      isLocked: isCurrentMonthLocked,
      lockReason: `${TURKISH_MONTH_NAMES[curMonth]} ayı henüz tamamlanmadı. Bu ayın özeti 28 ${TURKISH_MONTH_NAMES[curMonth]} tarihinde yayınlanacaktır.`
    });

    // Previous completed months (past 5 completed months)
    for (let i = 1; i <= 5; i++) {
      let m = curMonth - i;
      let y = curYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      periods.push({
        id: `${y}-${m}`,
        type: 'month',
        year: y,
        month: m,
        label: `${TURKISH_MONTH_NAMES[m]} ${y}`,
        badgeLabel: 'Tamamlandı',
        isLocked: false
      });
    }

    // All-Time
    periods.push({
      id: 'all-time',
      type: 'all-time',
      label: 'Tüm Zamanlar',
      badgeLabel: 'Tüm Geçmiş',
      isLocked: false
    });

    return periods;
  }, []);

  // Default Period: Unlocked current month if day >= 28, else the latest completed previous month
  const defaultPeriod = useMemo(() => {
    const curM = availablePeriods[0];
    if (curM && !curM.isLocked) return curM;
    return availablePeriods[1] || availablePeriods[availablePeriods.length - 1];
  }, [availablePeriods]);

  const [selectedPeriod, setSelectedPeriod] = useState<RecapPeriodOption>(defaultPeriod);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Sync selectedPeriod with defaultPeriod whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPeriod(defaultPeriod);
      setLockedNotice(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, defaultPeriod]);

  // Helper to test if a timestamp matches the selected period
  const matchesPeriod = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (selectedPeriod.type === 'all-time') return true;
    if (selectedPeriod.type === 'month') {
      return d.getFullYear() === selectedPeriod.year && d.getMonth() === selectedPeriod.month;
    }
    return false;
  };

  // 2. Identify Archival/Bulk Additions (> 6 episodes marked on same day within 15 min)
  // These are excluded from monthly recap so old imported series (e.g. Mentalist 151 eps) won't pollute current month.
  const archivalEpisodeKeys = useMemo(() => {
    if (selectedPeriod.type === 'all-time') {
      return new Set<string>(); // All-time includes everything!
    }

    const groups: Record<string, { times: number[]; eps: EpisodeProgress[] }> = {};
    episodeProgress.forEach(ep => {
      if (!ep.is_watched) return;
      const raw = ep.watched_at || (ep as any).created_at || (ep as any).updated_at;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const dayKey = `${ep.show_id}_${d.toISOString().slice(0, 10)}`;
      if (!groups[dayKey]) groups[dayKey] = { times: [], eps: [] };
      groups[dayKey].times.push(d.getTime());
      groups[dayKey].eps.push(ep);
    });

    const archiveSet = new Set<string>();
    Object.values(groups).forEach(group => {
      if (group.eps.length > 6) {
        group.times.sort((a, b) => a - b);
        const diffMinutes = (group.times[group.times.length - 1] - group.times[0]) / (1000 * 60);
        // If > 6 episodes were marked within 15 minutes, it's an archive bulk import
        if (diffMinutes < 15) {
          group.eps.forEach(ep => {
            archiveSet.add(`${ep.show_id}_${ep.season_number}_${ep.episode_number}`);
          });
        }
      }
    });

    return archiveSet;
  }, [episodeProgress, selectedPeriod.type]);

  // 3. Filter Target User's Data STRICTLY for the Selected Period
  const userWatchList = useMemo(() => {
    return watchList.filter(w => !w.user_id || !user.id || w.user_id === user.id);
  }, [watchList, user.id]);

  const watchedEpisodes = useMemo(() => {
    return episodeProgress.filter(ep => {
      if (!ep.is_watched) return false;
      if (ep.user_id && user.id && ep.user_id !== user.id) return false;
      const raw = ep.watched_at || (ep as any).created_at || (ep as any).updated_at;
      if (!matchesPeriod(raw)) return false;
      const epKey = `${ep.show_id}_${ep.season_number}_${ep.episode_number}`;
      if (archivalEpisodeKeys.has(epKey)) return false;
      return true;
    });
  }, [episodeProgress, user.id, selectedPeriod, archivalEpisodeKeys]);

  const watchedMovies = useMemo(() => {
    return userWatchList.filter(w => {
      if (w.media_type !== 'movie') return false;
      if (w.status !== 'watched' && w.status !== 'watching') return false;
      const raw = w.updated_at || (w as any).created_at || (w as any).watched_at;
      return matchesPeriod(raw);
    });
  }, [userWatchList, selectedPeriod]);

  const targetUserReviews = useMemo(() => {
    return reviews.filter(r => {
      const isUser = (r.user_id && user.id && r.user_id === user.id) || 
        (r.username && user.username && r.username.toLowerCase() === user.username.toLowerCase());
      if (!isUser) return false;
      const raw = r.created_at || (r as any).updated_at;
      return matchesPeriod(raw);
    });
  }, [reviews, user.id, user.username, selectedPeriod]);

  // 4. Counts & Watch Time for Period
  const movieCount = watchedMovies.length;
  const episodeCount = watchedEpisodes.length;
  const reviewCount = targetUserReviews.length;

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

  // 5. Ranking TV Shows for This Period
  const rankedShows = useMemo(() => {
    const showEpCounts: Record<number, number> = {};
    watchedEpisodes.forEach(ep => {
      const sid = Number(ep.show_id);
      if (sid) {
        showEpCounts[sid] = (showEpCounts[sid] || 0) + 1;
      }
    });

    return Object.entries(showEpCounts)
      .map(([idStr, count]) => ({ id: Number(idStr), count }))
      .sort((a, b) => b.count - a.count);
  }, [watchedEpisodes]);

  const topShow = rankedShows[0] || null;
  const runnerUpShow = rankedShows[1] || null;

  // 6. Ranking Movies for This Period
  const topMovie = useMemo(() => {
    if (watchedMovies.length === 0) return null;
    const sorted = [...watchedMovies].sort((a, b) => (b.rating || b.vote_average || 0) - (a.rating || a.vote_average || 0));
    return sorted[0];
  }, [watchedMovies]);

  // 7. Dynamic Genre Distribution for Items Watched in This Period
  const genreDistribution = useMemo(() => {
    const allWatchedItems = [...watchedMovies];
    // Add representative TV show items for active shows in this period
    const activeShowIds = new Set(watchedEpisodes.map(e => Number(e.show_id)));
    userWatchList.forEach(w => {
      if (w.media_type === 'tv' && activeShowIds.has(Number(w.media_id))) {
        allWatchedItems.push(w);
      }
    });
    return calculateGenreDistribution(allWatchedItems);
  }, [watchedMovies, watchedEpisodes, userWatchList]);

  const topGenre = genreDistribution.length > 0 ? genreDistribution[0] : { genre: 'Drama', percent: 35 };

  // 8. Real Average Rating strictly for This Period
  const realAvgRating = useMemo(() => {
    const ratings: number[] = [];
    watchedMovies.forEach(w => {
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
  }, [watchedMovies, targetUserReviews, watchedEpisodes]);

  // 9. Calculate the Single Day with the Maximum Watch Activity (Binge Record Day)
  const peakMarathonDay = useMemo(() => {
    const dayStats: Record<string, {
      dateObj: Date;
      episodeCount: number;
      movieCount: number;
      totalMinutes: number;
      shows: Record<number, number>;
    }> = {};

    watchedEpisodes.forEach(ep => {
      const raw = ep.watched_at || (ep as any).created_at || (ep as any).updated_at;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const dayKey = d.toISOString().slice(0, 10);
      if (!dayStats[dayKey]) {
        dayStats[dayKey] = {
          dateObj: d,
          episodeCount: 0,
          movieCount: 0,
          totalMinutes: 0,
          shows: {}
        };
      }
      dayStats[dayKey].episodeCount += 1;
      dayStats[dayKey].totalMinutes += (ep.runtime && ep.runtime > 0) ? ep.runtime : 45;
      const sid = Number(ep.show_id);
      if (sid) {
        dayStats[dayKey].shows[sid] = (dayStats[dayKey].shows[sid] || 0) + 1;
      }
    });

    watchedMovies.forEach(m => {
      const raw = m.updated_at || (m as any).created_at || (m as any).watched_at;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const dayKey = d.toISOString().slice(0, 10);
      if (!dayStats[dayKey]) {
        dayStats[dayKey] = {
          dateObj: d,
          episodeCount: 0,
          movieCount: 0,
          totalMinutes: 0,
          shows: {}
        };
      }
      dayStats[dayKey].movieCount += 1;
      dayStats[dayKey].totalMinutes += (m.runtime && m.runtime > 0) ? m.runtime : 118;
    });

    const entries = Object.entries(dayStats);
    if (entries.length === 0) return null;

    // Sort by totalItems (or totalMinutes) descending
    entries.sort((a, b) => {
      const totalA = a[1].episodeCount + a[1].movieCount;
      const totalB = b[1].episodeCount + b[1].movieCount;
      if (totalB !== totalA) return totalB - totalA;
      return b[1].totalMinutes - a[1].totalMinutes;
    });

    const best = entries[0][1];
    const bestTotal = best.episodeCount + best.movieCount;
    if (bestTotal === 0) return null;

    let topShowIdOnDay: number | null = null;
    let topShowEpCountOnDay = 0;
    Object.entries(best.shows).forEach(([sidStr, count]) => {
      if (count > topShowEpCountOnDay) {
        topShowEpCountOnDay = count;
        topShowIdOnDay = Number(sidStr);
      }
    });

    let topShowTitle: string | null = null;
    if (topShowIdOnDay) {
      const foundShow = userWatchList.find(w => Number(w.media_id) === topShowIdOnDay && w.media_type === 'tv');
      topShowTitle = foundShow?.title || null;
    }

    const formattedDate = best.dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long'
    });

    const hours = Math.floor(best.totalMinutes / 60);
    const mins = best.totalMinutes % 60;
    const timeStr = hours > 0 ? (mins > 0 ? `${hours} sa ${mins} dk` : `${hours} saat`) : `${mins} dakika`;

    const parts: string[] = [];
    if (best.episodeCount > 0) parts.push(`${best.episodeCount} bölüm`);
    if (best.movieCount > 0) parts.push(`${best.movieCount} film`);
    const highlightText = `${parts.join(' ve ')} (${timeStr})`;

    return {
      formattedDate,
      totalItems: bestTotal,
      episodeCount: best.episodeCount,
      movieCount: best.movieCount,
      timeStr,
      highlightText,
      topShowTitle,
      topShowEpCount: topShowEpCountOnDay
    };
  }, [watchedEpisodes, watchedMovies, userWatchList]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // 10. Fetch Detailed TMDB Data for Spotlight & Actor Frequency
  useEffect(() => {
    let isMounted = true;

    async function fetchSpotlightAndActor() {
      // Data structures to aggregate actor appearances
      const actorScoreMap: Record<string, { name: string; photo: string; role: string; score: number }> = {};

      // A) Top TV Series
      if (topShow) {
        const localShow = userWatchList.find(w => Number(w.media_id) === topShow.id && w.media_type === 'tv');
        let title = localShow?.title || 'Dizi';
        let poster = localShow?.poster_path 
          ? (localShow.poster_path.startsWith('http') ? localShow.poster_path : `https://image.tmdb.org/t/p/w500${localShow.poster_path}`)
          : defaultPoster;

        try {
          const details = await getDetails(topShow.id, 'tv');
          if (details && isMounted) {
            title = details.name || details.title || title;
            if (details.poster_path) {
              poster = details.poster_path.startsWith('http') 
                ? details.poster_path 
                : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
            }

            setTopSeriesDetails({
              id: topShow.id,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || (details.vote_average ? Math.round(details.vote_average * 10) / 10 : null),
              episodesWatched: topShow.count,
              badge: `🔥 ${topShow.count} Bölüm İzledim`,
              categoryLabel: 'ZİRVEDEKİ DİZİN',
              subtitle: `${selectedPeriod.label} döneminde ekran başında en çok izlediğin dizi`
            });

            // Accumulate actor scores for Top Show (lead cast gets +topShow.count)
            if (details.cast && Array.isArray(details.cast)) {
              details.cast.slice(0, 4).forEach(actor => {
                const photo = actor.profile_path
                  ? (actor.profile_path.startsWith('http') ? actor.profile_path : `https://image.tmdb.org/t/p/w500${actor.profile_path}`)
                  : poster;
                if (!actorScoreMap[actor.name]) {
                  actorScoreMap[actor.name] = { name: actor.name, photo, role: `${actor.character ? `${actor.character} • ` : ''}${title}`, score: 0 };
                }
                actorScoreMap[actor.name].score += topShow.count;
              });
            }
          }
        } catch (err) {
          if (isMounted) {
            setTopSeriesDetails({
              id: topShow.id,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || null,
              episodesWatched: topShow.count,
              badge: `🔥 ${topShow.count} Bölüm İzledim`,
              categoryLabel: 'ZİRVEDEKİ DİZİN',
              subtitle: `${selectedPeriod.label} döneminde ekran başında en çok izlediğin dizi`
            });
          }
        }
      } else {
        setTopSeriesDetails(null);
      }

      // B) Secondary Spotlight: Zirve Film VEYA (film yoksa) 2. Dizi
      if (topMovie) {
        // We have a movie in this period!
        let title = topMovie.title || 'Film';
        let poster = topMovie.poster_path 
          ? (topMovie.poster_path.startsWith('http') ? topMovie.poster_path : `https://image.tmdb.org/t/p/w500${topMovie.poster_path}`)
          : defaultPoster;

        try {
          const details = await getDetails(topMovie.media_id, 'movie');
          if (details && isMounted) {
            title = details.title || details.name || title;
            if (details.poster_path) {
              poster = details.poster_path.startsWith('http') 
                ? details.poster_path 
                : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
            }

            setSecondaryDetails({
              id: Number(topMovie.media_id),
              type: 'movie',
              title,
              poster,
              rating: topMovie.rating || (details.vote_average ? Math.round(details.vote_average * 10) / 10 : null),
              badge: topMovie.rating ? `★ ${topMovie.rating}/10 Puanın` : 'Öne Çıkan Film',
              categoryLabel: 'ZİRVE FİLMİN',
              subtitle: `${selectedPeriod.label} döneminde tamamladığın yapım`
            });

            // Movie actors get +3 points each
            if (details.cast && Array.isArray(details.cast)) {
              details.cast.slice(0, 4).forEach(actor => {
                const photo = actor.profile_path
                  ? (actor.profile_path.startsWith('http') ? actor.profile_path : `https://image.tmdb.org/t/p/w500${actor.profile_path}`)
                  : poster;
                if (!actorScoreMap[actor.name]) {
                  actorScoreMap[actor.name] = { name: actor.name, photo, role: `${actor.character ? `${actor.character} • ` : ''}${title}`, score: 0 };
                }
                actorScoreMap[actor.name].score += 3;
              });
            }
          }
        } catch (e) {
          if (isMounted) {
            setSecondaryDetails({
              id: Number(topMovie.media_id),
              type: 'movie',
              title,
              poster,
              rating: topMovie.rating || null,
              badge: topMovie.rating ? `★ ${topMovie.rating}/10 Puanın` : 'Öne Çıkan Film',
              categoryLabel: 'ZİRVE FİLMİN',
              subtitle: `${selectedPeriod.label} döneminde tamamladığın yapım`
            });
          }
        }
      } else if (runnerUpShow) {
        // No movie watched, but user watched a second TV series!
        const localShow = userWatchList.find(w => Number(w.media_id) === runnerUpShow.id && w.media_type === 'tv');
        let title = localShow?.title || 'Dizi';
        let poster = localShow?.poster_path 
          ? (localShow.poster_path.startsWith('http') ? localShow.poster_path : `https://image.tmdb.org/t/p/w500${localShow.poster_path}`)
          : defaultPoster;

        try {
          const details = await getDetails(runnerUpShow.id, 'tv');
          if (details && isMounted) {
            title = details.name || details.title || title;
            if (details.poster_path) {
              poster = details.poster_path.startsWith('http') 
                ? details.poster_path 
                : `https://image.tmdb.org/t/p/w500${details.poster_path}`;
            }

            setSecondaryDetails({
              id: runnerUpShow.id,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || (details.vote_average ? Math.round(details.vote_average * 10) / 10 : null),
              episodesWatched: runnerUpShow.count,
              badge: `🔥 ${runnerUpShow.count} Bölüm İzledim`,
              categoryLabel: 'İKİNCİ FAVORİ DİZİN',
              subtitle: `${selectedPeriod.label} döneminde maratona devam ettiğin diğer yapım`
            });

            if (details.cast && Array.isArray(details.cast)) {
              details.cast.slice(0, 3).forEach(actor => {
                const photo = actor.profile_path
                  ? (actor.profile_path.startsWith('http') ? actor.profile_path : `https://image.tmdb.org/t/p/w500${actor.profile_path}`)
                  : poster;
                if (!actorScoreMap[actor.name]) {
                  actorScoreMap[actor.name] = { name: actor.name, photo, role: `${actor.character ? `${actor.character} • ` : ''}${title}`, score: 0 };
                }
                actorScoreMap[actor.name].score += runnerUpShow.count;
              });
            }
          }
        } catch (e) {
          if (isMounted) {
            setSecondaryDetails({
              id: runnerUpShow.id,
              type: 'tv',
              title,
              poster,
              rating: localShow?.rating || null,
              episodesWatched: runnerUpShow.count,
              badge: `🔥 ${runnerUpShow.count} Bölüm İzledim`,
              categoryLabel: 'İKİNCİ FAVORİ DİZİN',
              subtitle: `${selectedPeriod.label} döneminde maratona devam ettiğin diğer yapım`
            });
          }
        }
      } else {
        setSecondaryDetails(null);
      }

      // C) Resolve Top Actor by Mathematical Frequency
      if (isMounted) {
        const sortedActors = Object.values(actorScoreMap).sort((a, b) => b.score - a.score);
        if (sortedActors.length > 0) {
          const bestActor = sortedActors[0];
          setTopActor({
            name: bestActor.name,
            role: bestActor.role,
            photo: bestActor.photo,
            appearances: `Ekran Frekansı: Yüksek`,
            description: `${selectedPeriod.label} döneminde izlediğin yapımlarda ekranını en çok dolduran oyuncu.`
          });
        } else {
          setTopActor(null);
        }
      }
    }

    if (isOpen) {
      fetchSpotlightAndActor();
    }

    return () => { isMounted = false; };
  }, [isOpen, selectedPeriod, topShow, runnerUpShow, topMovie, userWatchList]);

  // Handle Share / Copy to Clipboard
  const handleShareRecap = () => {
    const summaryText = `✨ ${user.full_name || user.username} - ${selectedPeriod.label} İzleme Özeti (Wrapped) ✨\n` +
      `⏱️ Toplam Ekran Süresi: ${totalHours} Saat\n` +
      `📺 İzlenen Bölümler: ${episodeCount} Bölüm\n` +
      `🍿 Tamamlanan Filmler: ${movieCount} Film\n` +
      (topSeriesDetails ? `🔥 Zirve Dizi: ${topSeriesDetails.title} (${topSeriesDetails.episodesWatched || 0} Bölüm)\n` : '') +
      (secondaryDetails ? `🌟 ${secondaryDetails.categoryLabel}: ${secondaryDetails.title}\n` : '') +
      (topActor ? `🎭 En Çok İzlenen Oyuncu: ${topActor.name}\n` : '') +
      `🎨 Favori Tür: ${topGenre.genre} (%${topGenre.percent})\n` +
      (peakMarathonDay ? `🔥 Ayın Maraton Rekoru: ${peakMarathonDay.formattedDate} (${peakMarathonDay.totalItems} İçerik • ${peakMarathonDay.timeStr})\n` : '') +
      `🎬 ttime.app`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const hasData = (movieCount > 0 || episodeCount > 0 || reviewCount > 0);

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
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar Navigation: Title, Share & Close */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
                {selectedPeriod.label} İzleme Özeti
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

          {/* PERIOD SELECTOR COLLAPSIBLE DROPDOWN */}
          <div className="relative z-20 mb-4 space-y-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#141722] hover:bg-[#181C2A] border border-amber-500/35 hover:border-amber-400 transition shadow-lg cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Görüntülenen Dönem</div>
                  <div className="text-sm font-black text-white flex items-center gap-2 truncate">
                    <span>{selectedPeriod.label}</span>
                    {selectedPeriod.badgeLabel && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold shrink-0">
                        {selectedPeriod.badgeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-amber-300 transition shrink-0">
                <span className="text-xs font-semibold hidden sm:inline">Dönemi Değiştir</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </div>
            </button>

            {/* DROPDOWN MENU */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="bg-[#11131B] border-2 border-amber-500/40 rounded-2xl p-3 shadow-2xl space-y-1.5 overflow-hidden"
                >
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                    <span>İzleme Dönemi Seçin</span>
                    <span className="text-[10px] font-normal text-slate-500">Aylık veya Genel Özet</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {availablePeriods.map(p => {
                      const isSelected = p.id === selectedPeriod.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (p.isLocked) {
                              setLockedNotice(p.lockReason || 'Bu dönem henüz yayınlanmadı.');
                              setTimeout(() => setLockedNotice(null), 4500);
                            } else {
                              setSelectedPeriod(p);
                              setIsDropdownOpen(false);
                              setLockedNotice(null);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-black shadow-sm'
                              : p.isLocked
                                ? 'bg-white/5 border-transparent text-slate-500 opacity-70 hover:opacity-90'
                                : 'bg-[#161924] border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
                            ) : p.type === 'all-time' ? (
                              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0 truncate">
                              <span className="text-xs block font-bold truncate">{p.label}</span>
                              {p.badgeLabel && (
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  {p.badgeLabel}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LOCKED NOTICE BANNER */}
            {lockedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lockedNotice}</span>
              </motion.div>
            )}
          </div>

          {/* MAIN RECAP CONTENT */}
          {!hasData ? (
            /* EMPTY STATE FOR SELECTED PERIOD */
            <div className="py-14 px-4 text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {selectedPeriod.label} İçin İzleme Verisi Bulunmuyor
                </h3>
                <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
                  Bu dönemde kayıtlı bir film veya dizi bölümü izlemeniz bulunmuyor. Başka bir ayı inceleyebilir veya "Tüm Zamanlar" özetine göz atabilirsiniz! 🎬
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTime = availablePeriods.find(p => p.type === 'all-time');
                    if (allTime) setSelectedPeriod(allTime);
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xl transition cursor-pointer"
                >
                  🏆 Tüm Zamanlar Özetini Aç
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
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
                  <h1 className="text-sm sm:text-lg font-black tracking-wider text-amber-400 uppercase font-mono">
                    {selectedPeriod.label}
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">WRAPPED ÖZETİ</span>
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
                    ? '"Resmen ekran başında maraton koştun! 🚀"' 
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

              {/* 4. ZİRVEDEKİ DİZİ (SPOTLIGHT 1) */}
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
                      {topSeriesDetails.categoryLabel}
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

              {/* 5. SPOTLIGHT 2: DİNAMİK İKİNCİ KART (Zirve Film VEYA İkinci Dizi) */}
              {secondaryDetails && (
                <div 
                  onClick={() => {
                    if (onSelectMediaById && secondaryDetails.id) onSelectMediaById(secondaryDetails.id, secondaryDetails.type);
                    onClose();
                  }}
                  className="space-y-1.5 pt-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-[#40bcf4] flex items-center gap-1.5">
                      {secondaryDetails.type === 'movie' ? <Film className="w-4 h-4 text-[#40bcf4]" /> : <Award className="w-4 h-4 text-[#40bcf4]" />}
                      {secondaryDetails.categoryLabel}
                    </span>
                    <span className="text-[11px] text-[#40bcf4] font-bold">
                      {secondaryDetails.badge}
                    </span>
                  </div>

                  <div className="bg-[#161926]/95 border-2 border-[#40bcf4]/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl group-hover:border-[#40bcf4] transition">
                    <img
                      src={secondaryDetails.poster}
                      alt={secondaryDetails.title}
                      className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl object-cover border-2 border-[#40bcf4]/60 shrink-0 shadow-lg group-hover:scale-105 transition"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate group-hover:text-[#40bcf4] transition">
                        {secondaryDetails.title}
                      </h4>
                      <p className="text-xs text-slate-300 italic font-medium">
                        {secondaryDetails.subtitle}
                      </p>
                      {secondaryDetails.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black pt-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{secondaryDetails.rating} / 10 Puan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. EKRANINI EN ÇOK SÜSLEYEN OYUNCU (Gerçek Frekans Hesabı) */}
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

              {/* 7. AYIN MARATON REKORU GÜNÜ (TEK GÜNDE EN ÇOK İZLENEN GÜN) */}
              {peakMarathonDay && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      AYIN MARATON REKORU
                    </span>
                    <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Tek Günde Zirve
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-[#22131A] via-[#1A1322] to-[#141724] border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="capitalize">{peakMarathonDay.formattedDate}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          Bu tarihte ekran başına geçip tam <strong className="text-amber-400 font-bold">{peakMarathonDay.highlightText}</strong> izleyerek ayın izleme rekorunu kırdın! 🚀
                        </p>
                      </div>

                      <div className="bg-[#0D0F17]/90 border border-amber-500/30 rounded-xl px-4 py-2 text-center shrink-0 shadow-md">
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                          {peakMarathonDay.totalItems}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          İÇERİK
                        </div>
                      </div>
                    </div>

                    {/* O günün öne çıkan ana dizisi / yapımı */}
                    {peakMarathonDay.topShowTitle && (
                      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-1">
                        <span className="text-slate-400 text-[11px]">Günün ana maratonu:</span>
                        <span className="font-extrabold text-white truncate flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          <Tv className="w-3 h-3 text-amber-400" />
                          {peakMarathonDay.topShowTitle}
                          <span className="text-amber-400 font-mono text-[11px]">({peakMarathonDay.topShowEpCount} Bölüm)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 9. TÜR & ORT. PUAN VEYA ALTERNATİF METRİK GRID */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">ZİRVE TÜR</span>
                  <span className="text-base sm:text-lg font-black text-white uppercase block font-mono">
                    {topGenre.genre}
                  </span>
                  <span className="text-xs text-slate-300 font-medium block">
                    %{topGenre.percent} dönem ağırlığı
                  </span>
                </div>

                <div className="bg-[#161926]/90 border border-white/15 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                    {realAvgRating ? 'ORT. PUAN' : 'İZLEME TEMPOSU'}
                  </span>
                  {realAvgRating ? (
                    <>
                      <div className="flex items-center justify-center gap-1 text-amber-400 text-base">
                        ★★★★★
                      </div>
                      <span className="text-sm sm:text-base font-black text-white font-mono block">
                        {realAvgRating} / 10
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1 text-amber-400 text-base">
                        <Sparkles className="w-4 h-4 fill-current text-amber-400" />
                      </div>
                      <span className="text-sm sm:text-base font-black text-white font-mono block">
                        {episodeCount > 0 ? `${episodeCount} Bölüm` : `${movieCount} Film`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Aktif Takipçi
                      </span>
                    </>
                  )}
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
