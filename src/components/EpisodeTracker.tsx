import React, { useState, useEffect } from 'react';
import { CheckSquare, Play, Check, ChevronDown, ChevronUp, Sparkles, Tv, Clock, Star, CheckCircle2, X } from 'lucide-react';
import { TMDBMedia, TMDBSeasonDetails, EpisodeProgress, WatchStatus } from '../types';
import { getDetails, getSeasonDetails, getPosterUrl } from '../lib/tmdb';
import { EmptyState } from './EmptyState';

interface EpisodeTrackerProps {
  watchingList: WatchStatus[];
  episodeProgress: EpisodeProgress[];
  onToggleEpisode: (showId: number, seasonNum: number, epNum: number) => void;
  onBatchMarkEpisodes?: (showId: number, seasonNum: number, epNums: number[]) => void;
  onSelectMedia: (media: TMDBMedia) => void;
  onNavigateToDiscover?: () => void;
}

const formatMissingEpisodesText = (items: Array<{ season_number: number; episode_number: number }>): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return `S${items[0].season_number}E${items[0].episode_number} bölümünü`;
  return `önceki ${items.length} bölümü (tüm önceki sezonlar dahil)`;
};

export const EpisodeTracker: React.FC<EpisodeTrackerProps> = ({
  watchingList,
  episodeProgress,
  onToggleEpisode,
  onBatchMarkEpisodes,
  onSelectMedia,
  onNavigateToDiscover
}) => {
  const [seasonsData, setSeasonsData] = useState<Record<string, TMDBSeasonDetails>>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('diziapp_seasons_cache');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });
  const [loadingSeasons, setLoadingSeasons] = useState<boolean>(() => Object.keys(seasonsData).length === 0);

  useEffect(() => {
    if (Object.keys(seasonsData).length > 0 && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('diziapp_seasons_cache', JSON.stringify(seasonsData));
      } catch (e) {}
    }
  }, [seasonsData]);
  const [expandedShowId, setExpandedShowId] = useState<number | null>(null);
  const [selectedSeasonByShow, setSelectedSeasonByShow] = useState<Record<number, number>>({});

  // Batch Confirm Modal state
  const [batchModal, setBatchModal] = useState<{
    showId: number;
    seasonNum: number;
    targetEpNum: number;
    missingItems: Array<{ season_number: number; episode_number: number }>;
  } | null>(null);

  const [localInteractions, setLocalInteractions] = useState<Record<number, number>>({});

  const recordInteraction = (showId: number) => {
    setLocalInteractions(prev => ({ ...prev, [Number(showId)]: Date.now() }));
  };

  const safeParseDate = (d?: string | null): number => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Helper to compute show's latest interaction timestamp (from episodeProgress or watchList updated_at)
  const getShowLatestInteractionTime = (showId: number, itemUpdatedAt?: string): number => {
    const sId = Number(showId);
    const watchedEps = episodeProgress.filter(ep => Number(ep.show_id) === sId);
    let latestWatchedTime = 0;
    watchedEps.forEach(ep => {
      if (ep.watched_at) {
        const t = safeParseDate(ep.watched_at);
        if (t > latestWatchedTime) latestWatchedTime = t;
      }
    });
    const watchListTime = safeParseDate(itemUpdatedAt);
    const localTime = localInteractions[sId] || 0;
    return Math.max(latestWatchedTime, watchListTime, localTime);
  };

  // Check if specific episode is watched (with type-safe Number comparison)
  const isEpWatched = (showId: number | string, seasonNum: number | string, epNum: number | string): boolean => {
    const sId = Number(showId);
    const sNum = Number(seasonNum);
    const eNum = Number(epNum);
    return episodeProgress.some(
      ep => Number(ep.show_id) === sId &&
            Number(ep.season_number) === sNum &&
            Number(ep.episode_number) === eNum &&
            ep.is_watched
    );
  };

  // Helper to check if a show has any unwatched episode available in loaded main seasons (season > 0)
  const hasUnwatchedEpisodes = (showId: number): boolean => {
    const seasonsList = Object.keys(seasonsData)
      .filter(k => k.startsWith(`${showId}-`))
      .map(k => parseInt(k.split('-')[1], 10))
      .filter(sNum => sNum > 0)
      .sort((a, b) => a - b);

    if (seasonsList.length === 0) return true;

    for (const sNum of seasonsList) {
      const season = seasonsData[`${showId}-${sNum}`];
      if (season && season.episodes) {
        for (const ep of season.episodes) {
          if (!isEpWatched(showId, ep.season_number, ep.episode_number)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Filter TV shows in watching status that have unwatched episodes, and sort by interaction timestamp
  const tvWatching = watchingList
    .filter(item => item.media_type === 'tv')
    .filter(item => {
      if (loadingSeasons && Object.keys(seasonsData).length === 0) return true;
      return hasUnwatchedEpisodes(item.media_id);
    })
    .sort((a, b) => {
      const timeA = getShowLatestInteractionTime(a.media_id, a.updated_at);
      const timeB = getShowLatestInteractionTime(b.media_id, b.updated_at);
      if (timeA !== timeB) return timeB - timeA;
      return (a.title || '').localeCompare(b.title || '');
    });

  useEffect(() => {
    let isMounted = true;
    async function loadAllSeasons() {
      if (Object.keys(seasonsData).length === 0) {
        setLoadingSeasons(true);
      }
      const newSeasons: Record<string, TMDBSeasonDetails> = { ...seasonsData };
      const tvWatchingList = watchingList.filter(item => item.media_type === 'tv');

      await Promise.all(
        tvWatchingList.map(async (item) => {
          try {
            const details = await getDetails(item.media_id, 'tv');
            const totalSeasons = details?.number_of_seasons || item.number_of_seasons || 25;
            for (let s = 1; s <= totalSeasons; s++) {
              try {
                const sData = await getSeasonDetails(item.media_id, s);
                if (sData && sData.episodes && sData.episodes.length > 0) {
                  newSeasons[`${item.media_id}-${s}`] = sData;
                } else if (s > 1) {
                  break;
                }
              } catch (err) {
                if (s > 1) break;
              }
            }
          } catch (e) {
            console.error(e);
          }
        })
      );

      if (isMounted) {
        setSeasonsData(newSeasons);
        setLoadingSeasons(false);
      }
    }

    if (watchingList.some(item => item.media_type === 'tv')) {
      loadAllSeasons();
    } else {
      setLoadingSeasons(false);
    }

    return () => { isMounted = false; };
  }, [watchingList, episodeProgress]);



  const handleEpisodeClickWithBatch = (showId: number, seasonNum: number, epNum: number) => {
    recordInteraction(showId);
    const isWatched = isEpWatched(showId, seasonNum, epNum);
    if (isWatched) {
      onToggleEpisode(showId, seasonNum, epNum);
      return;
    }

    const missingItems: Array<{ season_number: number; episode_number: number }> = [];
    
    // 1. Check all prior seasons (s < seasonNum)
    for (let s = 1; s < seasonNum; s++) {
      const seasonData = seasonsData[`${showId}-${s}`];
      const epCount = seasonData?.episodes?.length || 10;
      for (let e = 1; e <= epCount; e++) {
        if (!isEpWatched(showId, s, e)) {
          missingItems.push({ season_number: s, episode_number: e });
        }
      }
    }

    // 2. Check current season prior episodes
    for (let i = 1; i < epNum; i++) {
      if (!isEpWatched(showId, seasonNum, i)) {
        missingItems.push({ season_number: seasonNum, episode_number: i });
      }
    }

    if (missingItems.length > 0) {
      setBatchModal({
        showId,
        seasonNum,
        targetEpNum: epNum,
        missingItems
      });
    } else {
      onToggleEpisode(showId, seasonNum, epNum);
    }
  };

  // Find next UNWATCHED episode to watch across ALL loaded seasons for a show
  const getNextEpisodeToWatch = (showId: number) => {
    const seasonsList = Object.keys(seasonsData)
      .filter(k => k.startsWith(`${showId}-`))
      .map(k => parseInt(k.split('-')[1], 10))
      .sort((a, b) => a - b);

    if (seasonsList.length === 0) return null;

    for (const sNum of seasonsList) {
      const season = seasonsData[`${showId}-${sNum}`];
      if (season && season.episodes) {
        for (const ep of season.episodes) {
          if (!isEpWatched(showId, ep.season_number, ep.episode_number)) {
            return ep;
          }
        }
      }
    }

    return null;
  };

  // Determine active season number (the season with next unwatched episode, or latest)
  const getActiveSeasonNumber = (showId: number) => {
    const nextEp = getNextEpisodeToWatch(showId);
    if (nextEp) return nextEp.season_number;

    const seasonsList = Object.keys(seasonsData)
      .filter(k => k.startsWith(`${showId}-`))
      .map(k => parseInt(k.split('-')[1], 10))
      .sort((a, b) => a - b);

    return seasonsList.length > 0 ? seasonsList[seasonsList.length - 1] : 1;
  };

  if (tvWatching.length === 0) {
    const hasTvInWatching = watchingList.some(item => item.media_type === 'tv');
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 shadow-xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {hasTvInWatching ? 'Tüm Sezonları İzledin! 🎉' : 'Takip Ettiğin Dizi Bulunmuyor'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          {hasTvInWatching
            ? 'Takip ettiğin dizilerin mevcut tüm sezon ve bölümlerini bitirdin. Yeni bir sezon veya bölüm yayınlandığında dizi otomatik olarak buraya geri gelecektir.'
            : 'Dizilerini "İzliyorum" listesine ekleyerek bölüm bölüm gelişimini takip edebilir ve izlediğin bölümleri tek tıkla işaretleyebilirsin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show List */}
      <div className="space-y-4">
        {tvWatching.map((item) => {
          const showId = item.media_id;
          const seasonsList = Object.keys(seasonsData)
            .filter(k => k.startsWith(`${showId}-`))
            .map(k => parseInt(k.split('-')[1], 10))
            .sort((a, b) => a - b);

          const activeSeasonNum = getActiveSeasonNumber(showId);
          const currentSeasonNum = selectedSeasonByShow[showId] || activeSeasonNum;
          const season = seasonsData[`${showId}-${currentSeasonNum}`] || seasonsData[`${showId}-1`];
          const nextEp = getNextEpisodeToWatch(showId);
          const isExpanded = expandedShowId === showId;

          // Compute progress stats for current active season
          const totalEpsInSeason = season?.episodes?.length || 10;
          const watchedInSeason = season?.episodes?.filter(ep => 
            isEpWatched(showId, ep.season_number, ep.episode_number)
          ).length || 0;
          
          const progressPercent = Math.round((watchedInSeason / totalEpsInSeason) * 100);

          return (
            <div 
              key={showId}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition shadow-lg"
            >
              {/* Main Card Header Row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Poster & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={item.poster_path ? getPosterUrl(item.poster_path) : 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onClick={() => onSelectMedia({ id: showId, title: item.title, name: item.title, media_type: 'tv', overview: '', poster_path: item.poster_path, backdrop_path: null, vote_average: item.vote_average || 0, vote_count: 0, popularity: 0 })}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl shadow-md cursor-pointer hover:opacity-90 transition shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 
                      onClick={() => onSelectMedia({ id: showId, title: item.title, name: item.title, media_type: 'tv', overview: '', poster_path: item.poster_path, backdrop_path: null, vote_average: item.vote_average || 0, vote_count: 0, popularity: 0 })}
                      className="text-lg font-bold text-white hover:text-amber-400 cursor-pointer transition truncate"
                    >
                      {item.title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Sezon {currentSeasonNum} İlerlemesi ({watchedInSeason}/{totalEpsInSeason} Bölüm)</span>
                        <span className="text-amber-400 font-bold">%{progressPercent}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Episode Banner */}
                    {nextEp && (
                      <div className="mt-3 flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 border border-slate-700/60 max-w-full min-w-0">
                        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-semibold text-amber-300 shrink-0">Sıradaki:</span>
                        <span className="truncate min-w-0">S{nextEp.season_number}E{nextEp.episode_number} - {nextEp.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  {nextEp && (
                    <button
                      onClick={() => handleEpisodeClickWithBatch(showId, nextEp.season_number, nextEp.episode_number)}
                      className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg min-w-0 ${
                        isEpWatched(showId, nextEp.season_number, nextEp.episode_number)
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3] shrink-0" />
                      <span className="truncate">
                        {isEpWatched(showId, nextEp.season_number, nextEp.episode_number) ? 'İzledim' : 'Sıradakini İzlendi Yap'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      recordInteraction(showId);
                      setExpandedShowId(isExpanded ? null : showId);
                    }}
                    className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 hover:bg-slate-700 transition shrink-0"
                    title="Tüm Bölümleri Gör"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* Expanded Season Episode List with Season Tabs */}
              {isExpanded && season && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-3">
                  {seasonsList.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-800/80">
                      {seasonsList.map(sNum => {
                        const isSel = currentSeasonNum === sNum;
                        const sData = seasonsData[`${showId}-${sNum}`];
                        const sTotal = sData?.episodes?.length || 0;
                        const sWatched = sData?.episodes?.filter(ep => isEpWatched(showId, sNum, ep.episode_number)).length || 0;
                        const sDone = sTotal > 0 && sWatched === sTotal;

                        return (
                          <button
                            key={sNum}
                            onClick={() => {
                              recordInteraction(showId);
                              setSelectedSeasonByShow(prev => ({ ...prev, [showId]: sNum }));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                              isSel
                                ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
                                : sDone
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            <span>Sezon {sNum}</span>
                            <span className="text-[10px] font-mono opacity-80">({sWatched}/{sTotal})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {season.name} Bölüm Listesi
                  </h4>

                  {season.episodes.map((ep) => {
                    const watched = isEpWatched(showId, ep.season_number, ep.episode_number);
                    return (
                      <div
                        key={ep.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                          watched
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleEpisodeClickWithBatch(showId, ep.season_number, ep.episode_number)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition shrink-0 ${
                              watched
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                                : 'border-slate-600 hover:border-amber-400 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-400">
                                S{ep.season_number}E{ep.episode_number}
                              </span>
                              <span className={`text-sm font-semibold truncate ${watched ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {ep.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {ep.overview || 'Bölüm özeti bulunmuyor.'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400 shrink-0 hidden sm:block">
                          {ep.runtime ? `${ep.runtime} dk` : '45 dk'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* BATCH CONFIRMATION POP-UP MODAL            */}
      {/* ========================================== */}
      {batchModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setBatchModal(null);
          }}
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-[#14171D] border border-[#2B313E] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-center relative cursor-default animate-in zoom-in-95">
            <button
              onClick={() => setBatchModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#FBBF24]/10">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-wider">
                {batchModal.seasonNum}. Sezon • {batchModal.targetEpNum}. Bölüm
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                Önceki Bölümleri İşaretle
              </h3>
            </div>

            <div className="bg-[#0B0C0E] border border-[#2B313E] rounded-2xl p-4 text-slate-200 text-xs sm:text-sm font-semibold leading-relaxed shadow-inner">
              {formatMissingEpisodesText(batchModal.missingItems)} de izlendi olarak işaretlemek ister misin?
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => {
                  const allItemsToMark = [...batchModal.missingItems, { season_number: batchModal.seasonNum, episode_number: batchModal.targetEpNum }];
                  if (onBatchMarkEpisodes) {
                    onBatchMarkEpisodes(batchModal.showId, allItemsToMark as any);
                  } else {
                    allItemsToMark.forEach(item => onToggleEpisode(batchModal.showId, item.season_number, item.episode_number));
                  }
                  setBatchModal(null);
                }}
                className="w-full py-3 px-4 rounded-xl font-extrabold text-xs text-slate-950 bg-[#4ADE80] hover:bg-[#3ec770] shadow-lg shadow-[#4ADE80]/20 transition flex items-center justify-center gap-2 uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Evet, Tümünü İşaretle</span>
              </button>

              <button
                onClick={() => {
                  onToggleEpisode(batchModal.showId, batchModal.seasonNum, batchModal.targetEpNum);
                  setBatchModal(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-[#232833] hover:bg-[#2B313E] border border-white/10 transition"
              >
                Sadece {batchModal.targetEpNum}. Bölümü İşaretle
              </button>

              <button
                onClick={() => setBatchModal(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-300 transition py-1 block mx-auto"
              >
                İptal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
