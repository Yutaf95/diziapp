import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Tv, Sparkles, Clock, Star, Play, Info, Flame, Eye, Filter, Loader2, CheckCircle2 } from 'lucide-react';
import { WatchStatus, TMDBMedia, EpisodeProgress } from '../types';
import { getDetails, getSeasonDetails, getPosterUrl, getBackdropUrl } from '../lib/tmdb';
import { EmptyState } from './EmptyState';

interface CalendarViewProps {
  watchingList: WatchStatus[];
  episodeProgress?: EpisodeProgress[];
  onSelectMedia?: (media: TMDBMedia) => void;
  onToggleEpisode?: (showId: number, seasonNum: number, epNum: number) => void;
}

export interface UpcomingEpisode {
  id: number;
  showId: number;
  showName: string;
  posterPath: string;
  backdropPath: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string; // YYYY-MM-DD
  network: string;
  networkColor: string;
  overview: string;
  voteAverage: number;
  mediaType: 'tv';
}



export const CalendarView: React.FC<CalendarViewProps> = ({
  watchingList,
  episodeProgress = [],
  onSelectMedia,
  onToggleEpisode
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [filterWatchingOnly, setFilterWatchingOnly] = useState(true);
  const [selectedDayEpisodes, setSelectedDayEpisodes] = useState<UpcomingEpisode[] | null>(null);

  const [liveEpisodes, setLiveEpisodes] = useState<UpcomingEpisode[]>([]);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);

  // Live TMDB Schedule Fetch for user's watched TV shows
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveSchedule() {
      setLoadingLive(true);
      const tvWatching = watchingList.filter(item => item.media_type === 'tv' || item.status === 'watching');
      const todayStr = new Date().toISOString().split('T')[0];
      
      const fetchedList: UpcomingEpisode[] = [];

      await Promise.all(
        tvWatching.map(async (item) => {
          try {
            const details = await getDetails(item.media_id, 'tv');
            if (!details) return;

            const networkName = (details as any).networks?.[0]?.name || 'TV';
            const poster = getPosterUrl(details.poster_path || item.poster_path || null);
            const backdrop = getBackdropUrl(details.backdrop_path || details.poster_path || null);

            const lastEp = (details as any).last_episode_to_air;
            const nextEp = (details as any).next_episode_to_air;

            // Calculate user's highest watched episode for this show
            const watchedForShow = episodeProgress.filter(e => e.show_id === item.media_id && e.is_watched);
            let maxS = 0;
            let maxE = 0;
            watchedForShow.forEach(e => {
              if (e.season_number > maxS || (e.season_number === maxS && e.episode_number > maxE)) {
                maxS = e.season_number;
                maxE = e.episode_number;
              }
            });

            // CHECK CAUGHT UP CONDITION:
            // A user is caught up if:
            // 1. Show status is 'watched' (completed)
            // 2. OR user's max watched episode >= last_episode_to_air
            // 3. OR there is no last_episode_to_air yet (brand new unreleased show)
            let isCaughtUp = false;

            if (item.status === 'watched') {
              isCaughtUp = true;
            } else if (!lastEp && nextEp) {
              isCaughtUp = true; // Brand new show premiere
            } else if (lastEp && typeof lastEp.season_number === 'number' && typeof lastEp.episode_number === 'number') {
              if (maxS > lastEp.season_number || (maxS === lastEp.season_number && maxE >= lastEp.episode_number)) {
                isCaughtUp = true;
              }
            } else if (watchedForShow.length > 0) {
              isCaughtUp = true;
            }

            // CRITICAL RULE:
            // If the user has NOT caught up to the latest currently released episode yet,
            // DO NOT display future upcoming episode/season dates on the calendar!
            if (!isCaughtUp) {
              return;
            }

            // User IS caught up! Find the future episode/season premiere to show in the calendar:
            let targetSeason = 1;
            let targetEp = 1;
            let airDate = '';
            let targetEpisodeData: any = null;

            if (nextEp && nextEp.air_date) {
              targetSeason = nextEp.season_number;
              targetEp = nextEp.episode_number;
              airDate = nextEp.air_date;
              targetEpisodeData = nextEp;
            } else {
              // Try finding next episode in current or next season with air_date >= today
              let searchSeason = lastEp ? lastEp.season_number : 1;
              let searchEp = lastEp ? lastEp.episode_number + 1 : 1;
              try {
                let sData = await getSeasonDetails(item.media_id, searchSeason);
                let epData = sData?.episodes?.find((e: any) => e.episode_number === searchEp);
                if (epData && epData.air_date) {
                  targetSeason = searchSeason;
                  targetEp = searchEp;
                  airDate = epData.air_date;
                  targetEpisodeData = epData;
                } else {
                  // Try next season episode 1
                  const nextSeasonData = await getSeasonDetails(item.media_id, searchSeason + 1);
                  if (nextSeasonData?.episodes && nextSeasonData.episodes.length > 0) {
                    targetSeason = searchSeason + 1;
                    targetEp = 1;
                    targetEpisodeData = nextSeasonData.episodes[0];
                    airDate = targetEpisodeData?.air_date || '';
                  }
                }
              } catch (e) {}
            }

            // Skip if airDate is in the past (< todayStr) or invalid
            if (!airDate || airDate < todayStr) {
              return;
            }

            const epName = targetEpisodeData?.name 
              ? (targetEp === 1 ? `${targetSeason}. Sezon Prömiyeri (${targetEpisodeData.name})` : targetEpisodeData.name)
              : `${targetSeason}. Sezon ${targetEp}. Bölüm`;

            fetchedList.push({
              id: item.media_id * 10000 + targetSeason * 100 + targetEp,
              showId: item.media_id,
              showName: details.title || details.name || item.title || 'Dizi',
              posterPath: poster,
              backdropPath: backdrop,
              seasonNumber: targetSeason,
              episodeNumber: targetEp,
              episodeName: epName,
              airDate: airDate,
              network: networkName,
              networkColor: 'bg-[#14171D] text-slate-100 border-[#232833]',
              overview: targetEpisodeData?.overview || `${details.title || item.title} dizisinin yeni bölümü.`,
              voteAverage: targetEpisodeData?.vote_average || details.vote_average || 8.5,
              mediaType: 'tv'
            });

          } catch (err) {
            console.warn(`Live schedule fetch error for show ${item.media_id}:`, err);
          }
        })
      );

      if (isMounted) {
        setLiveEpisodes(fetchedList);
        setLoadingLive(false);
      }
    }

    fetchLiveSchedule();
    return () => { isMounted = false; };
  }, [watchingList, episodeProgress]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter episodes based on user watching list and strictly ONLY future/today release dates
  const filteredEpisodes = liveEpisodes.filter(ep => {
    // Filter out past air dates (e.g. 2012, 2021, 2024 - only keep future or today air dates)
    if (ep.airDate && ep.airDate < todayStr) return false;

    if (!filterWatchingOnly) return true;
    if (watchingList.length === 0) return true;
    const watchingIds = watchingList.map(w => w.media_id);
    const watchingTitles = watchingList.map(w => (w.title || '').toLowerCase());
    const isIdMatch = watchingIds.includes(ep.showId);
    const isTitleMatch = watchingTitles.some(t => t && (t.includes(ep.showName.toLowerCase()) || ep.showName.toLowerCase().includes(t)));
    return isIdMatch || isTitleMatch;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Calendar days calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Adjusted starting day index (Monday = 0)
  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Calculate days count text
  const getCountdownBadge = (airDateStr: string) => {
    const air = new Date(airDateStr);
    const today = new Date();
    const diffTime = air.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Bugün Yayınlanıyor!', color: 'bg-[#E63946] text-white animate-pulse' };
    if (diffDays === 1) return { text: 'Yarın Yayında', color: 'bg-amber-500 text-black font-bold' };
    if (diffDays > 1 && diffDays <= 7) return { text: `${diffDays} Gün Kaldı`, color: 'bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/40' };
    if (diffDays > 7) return { text: `${diffDays} Gün Sonra`, color: 'bg-[#232833] text-slate-300' };
    return { text: 'Yayınlandı', color: 'bg-slate-800 text-slate-400' };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Header */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#232833]">
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Dizi Yayın Takvimi</span>
                <span className="text-xs font-bold bg-[#E63946]/20 text-[#E63946] px-2 py-0.5 rounded-full border border-[#E63946]/30">
                  Canlı Takip
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Takip ettiğiniz ve popüler dizilerin yeni bölüm ile sezon prömiyer tarihleri
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Filter */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={() => setFilterWatchingOnly(!filterWatchingOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterWatchingOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#0B0C0E] text-slate-300 border-[#2B313E] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{filterWatchingOnly ? 'Sadece İzlediklerim' : 'Tüm Diziler'}</span>
            </button>

            <div className="bg-[#0B0C0E] border border-[#2B313E] p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'calendar'
                    ? 'bg-[#E63946] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aylık Takvim
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'timeline'
                    ? 'bg-[#E63946] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gelecek Liste
              </button>
            </div>
          </div>

        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-[#0B0C0E] hover:bg-[#232833] text-slate-300 hover:text-white border border-[#232833] transition"
              title="Önceki Ay"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-[#0B0C0E] hover:bg-[#232833] text-slate-300 hover:text-white border border-[#232833] transition"
              title="Sonraki Ay"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-base sm:text-lg font-black text-white pl-2">
              {monthNames[month]} {year}
            </span>
          </div>

          <button
            onClick={handleToday}
            className="text-xs font-bold text-[#E63946] bg-[#E63946]/10 hover:bg-[#E63946]/20 px-3 py-1.5 rounded-xl border border-[#E63946]/30 transition"
          >
            Bugüne Git
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'calendar' ? (
        <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          
          {/* Calendar Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-2 border-b border-[#232833]">
            {dayNames.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            
            {/* Blank leading cells */}
            {Array.from({ length: startingDayIndex }).map((_, idx) => (
              <div
                key={`blank-${idx}`}
                className="h-20 sm:h-28 rounded-xl bg-[#0B0C0E]/30 border border-transparent opacity-30 pointer-events-none"
              />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const formattedDateStr = formatDateString(year, month, dayNumber);
              const now = new Date();
              const isToday = year === now.getFullYear() && month === now.getMonth() && dayNumber === now.getDate();

              // Find episodes on this date
              const dayEpisodes = filteredEpisodes.filter(
                (ep) => ep.airDate === formattedDateStr
              );

              const hasEpisodes = dayEpisodes.length > 0;

              return (
                <div
                  key={`day-${dayNumber}`}
                  onClick={() => {
                    if (hasEpisodes) {
                      setSelectedDayEpisodes(dayEpisodes);
                    }
                  }}
                  className={`relative h-20 sm:h-28 rounded-xl p-1.5 sm:p-2 border transition flex flex-col justify-between overflow-hidden group ${
                    isToday
                      ? 'bg-[#E63946]/10 border-[#E63946] ring-2 ring-[#E63946]/40 shadow-lg'
                      : hasEpisodes
                      ? 'bg-[#0B0C0E] border-[#E63946]/50 hover:border-[#E63946] cursor-pointer shadow-md'
                      : 'bg-[#0B0C0E]/60 border-[#232833] hover:border-[#2B313E]'
                  }`}
                >
                  {/* Top Bar inside cell: Day number + Today Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-extrabold rounded-lg px-1.5 py-0.5 ${
                        isToday
                          ? 'bg-[#E63946] text-white shadow'
                          : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-black uppercase text-[#E63946] hidden sm:inline-block">
                        Bugün
                      </span>
                    )}

                    {hasEpisodes && !isToday && (
                      <span className="w-2 h-2 rounded-full bg-[#E63946] animate-ping" />
                    )}
                  </div>

                  {/* Episodes inside cell */}
                  {hasEpisodes ? (
                    <div className="space-y-1 my-auto">
                      {dayEpisodes.map((ep) => (
                        <div
                          key={ep.id}
                          className="bg-[#14171D] hover:bg-[#232833] border border-[#E63946]/40 p-1 rounded-lg flex items-center gap-1.5 transition shadow"
                        >
                          <img
                            src={ep.posterPath}
                            alt={ep.showName}
                            className="w-5 h-7 sm:w-6 sm:h-8 object-cover rounded shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs font-bold text-white truncate leading-tight">
                              {ep.showName}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-amber-400 font-semibold truncate">
                              S{ep.seasonNumber}E{ep.episodeNumber}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 font-medium text-center hidden sm:block">
                      —
                    </div>
                  )}

                  {/* Cell Bottom Badge if any */}
                  {hasEpisodes && dayEpisodes.length > 1 && (
                    <span className="text-[9px] text-center font-bold text-[#E63946] bg-[#E63946]/10 rounded">
                      +{dayEpisodes.length - 1} bölüm daha
                    </span>
                  )}
                </div>
              );
            })}

          </div>

        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-4">
          {filteredEpisodes.map((ep) => {
            const badge = getCountdownBadge(ep.airDate);

            return (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#14171D] border border-[#232833] hover:border-[#E63946]/50 rounded-2xl p-4 sm:p-5 shadow-lg transition duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Show Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden border border-[#2B313E] shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <img
                      src={ep.posterPath}
                      alt={ep.showName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {ep.voteAverage}
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${ep.networkColor}`}>
                        {ep.network}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white truncate group-hover:text-[#E63946] transition">
                      {ep.showName}
                    </h3>

                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span>Sezon {ep.seasonNumber}, Bölüm {ep.episodeNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{ep.episodeName}</span>
                    </p>

                    <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
                      {ep.overview}
                    </p>
                  </div>
                </div>

                {/* Right: Date & Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#232833] shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Yayın Tarihi</span>
                    <span className="text-sm font-black text-white font-mono">
                      {ep.airDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onToggleEpisode && (
                      <button
                        onClick={() => onToggleEpisode(ep.showId, ep.seasonNumber, ep.episodeNumber)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold transition shadow-sm"
                        title="Bu bölümü izlendi olarak işaretle"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>İzlendi</span>
                      </button>
                    )}

                    {onSelectMedia && (
                      <button
                        onClick={() => onSelectMedia({
                          id: ep.showId,
                          name: ep.showName,
                          title: ep.showName,
                          poster_path: ep.posterPath,
                          backdrop_path: ep.backdropPath,
                          media_type: 'tv',
                          overview: ep.overview,
                          vote_average: ep.voteAverage,
                          vote_count: 1000,
                          popularity: 100,
                          first_air_date: ep.airDate
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0C0E] hover:bg-[#232833] border border-[#2B313E] text-slate-200 text-xs font-bold transition"
                      >
                        <Info className="w-3.5 h-3.5 text-[#E63946]" />
                        <span>Dizi Sayfası</span>
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Selected Day Episodes Modal */}
      <AnimatePresence>
        {selectedDayEpisodes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#14171D] border border-[#232833] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedDayEpisodes(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 text-[#E63946] font-extrabold text-sm">
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedDayEpisodes[0].airDate} Yayın Akışı</span>
              </div>

              <div className="space-y-3 pt-2">
                {selectedDayEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 bg-[#0B0C0E] rounded-xl border border-[#232833] flex items-center gap-3"
                  >
                    <img
                      src={ep.posterPath}
                      alt={ep.showName}
                      className="w-12 h-16 object-cover rounded-lg shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{ep.showName}</h4>
                      <p className="text-xs text-amber-400 font-semibold">
                        S{ep.seasonNumber}E{ep.episodeNumber} - {ep.episodeName}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ep.networkColor}`}>
                        {ep.network}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedDayEpisodes(null)}
                className="w-full py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white font-extrabold text-xs transition"
              >
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
