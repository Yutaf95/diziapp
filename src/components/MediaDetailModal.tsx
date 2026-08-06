import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, Eye, Clock, Check, Tv, Film, MessageSquare, AlertTriangle, Heart, 
  Send, User, ArrowLeft, Play, Sparkles, CheckCircle2, ChevronRight, ChevronDown, Zap, Info, ShieldAlert, Layers, Pencil, Trash2
} from 'lucide-react';
import { TMDBMedia, TMDBSeasonDetails, TMDBEpisode, WatchStatusType, RatingReview, EpisodeProgress, CustomCollection, CollectionItem } from '../types';
import { getDetails, getSeasonDetails, getBackdropUrl, getPosterUrl } from '../lib/tmdb';
import { AddToCollectionModal } from './AddToCollectionModal';

interface MediaDetailModalProps {
  media: TMDBMedia | null;
  onClose: () => void;
  userWatchStatus?: WatchStatusType | null;
  onUpdateWatchStatus: (media: TMDBMedia, status: WatchStatusType | null) => void;
  episodeProgress: EpisodeProgress[];
  onToggleEpisode: (showId: number, seasonNum: number, epNum: number) => void;
  onBatchMarkEpisodes?: (showId: number, seasonNum: number, epNums: number[]) => void;
  onRateEpisode?: (showId: number, seasonNum: number, epNum: number, rating: number) => void;
  onSaveEpisodeNote?: (showId: number, seasonNum: number, epNum: number, note: string, hasSpoiler?: boolean) => void;
  onAddReview: (review: Omit<RatingReview, 'id' | 'created_at'>) => void;
  reviews: RatingReview[];
  currentUserId: string;
  collections?: CustomCollection[];
  onToggleItemInCollection?: (collectionId: string, item: Omit<CollectionItem, 'added_at'>) => void;
  onCreateCollection?: (title: string, description: string, color: string, icon: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (media: TMDBMedia) => void;
}

const formatMissingEpisodesText = (items: Array<{ season_number: number; episode_number: number }>): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return `S${items[0].season_number}E${items[0].episode_number} bölümünü`;
  return `önceki ${items.length} bölümü (tüm önceki sezonlar dahil)`;
};

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  onClose,
  userWatchStatus,
  onUpdateWatchStatus,
  episodeProgress,
  onToggleEpisode,
  onBatchMarkEpisodes,
  onRateEpisode,
  onSaveEpisodeNote,
  onAddReview,
  reviews,
  currentUserId,
  collections = [],
  onToggleItemInCollection,
  onCreateCollection,
  isFavorited = false,
  onToggleFavorite
}) => {
  if (!media) return null;

  const reviewSectionRef = useRef<HTMLDivElement>(null);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState<boolean>(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState<boolean>(false);
  const [prevWatchStatus, setPrevWatchStatus] = useState<WatchStatusType>('watching');

  const [details, setDetails] = useState<TMDBMedia>(media);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (userWatchStatus && userWatchStatus !== 'watched') {
      setPrevWatchStatus(userWatchStatus);
    }
  }, [userWatchStatus]);
  const [isEpisodesExpanded, setIsEpisodesExpanded] = useState<boolean>(() => userWatchStatus !== 'watched');

  useEffect(() => {
    setIsEpisodesExpanded(userWatchStatus !== 'watched');
  }, [userWatchStatus, media?.id]);

  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(1);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);

  // Quick Rating Hover state (ep.id -> hovered score)
  const [hoveredQuickScore, setHoveredQuickScore] = useState<Record<number, number>>({});

  // Episode Personal Note Modal state
  const [noteModalEp, setNoteModalEp] = useState<TMDBEpisode | null>(null);
  const [noteInputText, setNoteInputText] = useState<string>('');
  const [noteHasSpoiler, setNoteHasSpoiler] = useState<boolean>(false);

  const openNoteModal = (ep: TMDBEpisode) => {
    const prog = getEpisodeProgress(media.id, ep.season_number, ep.episode_number);
    setNoteInputText(prog?.note || '');
    setNoteHasSpoiler(prog?.note_has_spoiler || false);
    setNoteModalEp(ep);
  };

  const handleSaveNote = () => {
    if (!noteModalEp) return;
    if (onSaveEpisodeNote) {
      onSaveEpisodeNote(media.id, noteModalEp.season_number, noteModalEp.episode_number, noteInputText.trim(), noteHasSpoiler);
    }
    setNoteModalEp(null);
  };

  // Quick 1-10 Rating Modal for Episode
  const [ratingEpisodeModal, setRatingEpisodeModal] = useState<TMDBEpisode | null>(null);
  const [selectedEpScore, setSelectedEpScore] = useState<number>(8);

  // General Review Form State
  const [userGeneralRating, setUserGeneralRating] = useState<number>(9);
  const [reviewText, setReviewText] = useState<string>('');
  const [containsSpoiler, setContainsSpoiler] = useState<boolean>(false);
  const [showReviewSubmitted, setShowReviewSubmitted] = useState<boolean>(false);

  // Revealed Spoilers state
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const isTv = media.media_type === 'tv' || !!media.first_air_date;

  const [loadingSeason, setLoadingSeason] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchFullData() {
      setLoading(true);
      if (isTv) setSeasonDetails(null);
      try {
        const full = await getDetails(media.id, isTv ? 'tv' : 'movie');
        if (isMounted) setDetails(full);

        if (isTv) {
          setSelectedSeasonNum(1);
          setLoadingSeason(true);
          const s1 = await getSeasonDetails(media.id, 1);
          if (isMounted) setSeasonDetails(s1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingSeason(false);
        }
      }
    }
    fetchFullData();
    return () => { isMounted = false; };
  }, [media.id, isTv]);

  const handleSeasonChange = async (seasonNum: number) => {
    setSelectedSeasonNum(seasonNum);
    setLoadingSeason(true);
    try {
      const seasonData = await getSeasonDetails(media.id, seasonNum);
      setSeasonDetails(seasonData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSeason(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    onAddReview({
      user_id: currentUserId,
      media_id: media.id,
      media_type: isTv ? 'tv' : 'movie',
      rating: userGeneralRating,
      review_text: reviewText,
      contains_spoiler: containsSpoiler,
      media_title: media.title || media.name,
      media_poster: media.poster_path ? getPosterUrl(media.poster_path) : undefined
    });

    setReviewText('');
    setShowReviewSubmitted(true);
    setTimeout(() => setShowReviewSubmitted(false), 3500);
  };

  // Helper to check if an episode is watched
  const getEpisodeProgress = (showId: number, seasonNum: number, epNum: number): EpisodeProgress | undefined => {
    return episodeProgress.find(
      ep => ep.show_id === showId && ep.season_number === seasonNum && ep.episode_number === epNum
    );
  };

  // Determine next episode to watch
  const getNextEpisodeNumber = (): number => {
    if (!seasonDetails || !seasonDetails.episodes) return 1;
    for (const ep of seasonDetails.episodes) {
      const prog = getEpisodeProgress(media.id, selectedSeasonNum, ep.episode_number);
      if (!prog || !prog.is_watched) {
        return ep.episode_number;
      }
    }
    return -1; // All watched
  };

  const nextEpNum = getNextEpisodeNumber();

  // Batch Confirmation Modal State
  const [batchConfirmModal, setBatchConfirmModal] = useState<{
    showId: number;
    seasonNum: number;
    targetEp: TMDBEpisode;
    missingItems: Array<{ season_number: number; episode_number: number }>;
    rating?: number;
  } | null>(null);

  // Helper to find missing prior episodes across ALL seasons up to target season/episode
  const getMissingPriorEpisodes = (targetSeasonNum: number, targetEpNum: number): Array<{ season_number: number; episode_number: number }> => {
    const missing: Array<{ season_number: number; episode_number: number }> = [];
    const availableSeasons = details.seasons || media.seasons || [];

    // 1. All prior seasons (s < targetSeasonNum)
    for (let s = 1; s < targetSeasonNum; s++) {
      const seasonObj = availableSeasons.find(sec => sec.season_number === s);
      const epCount = seasonObj?.episode_count || 10;
      for (let epNum = 1; epNum <= epCount; epNum++) {
        const prog = getEpisodeProgress(media.id, s, epNum);
        if (!prog || !prog.is_watched) {
          missing.push({ season_number: s, episode_number: epNum });
        }
      }
    }

    // 2. Current season prior episodes (epNum < targetEpNum)
    for (let epNum = 1; epNum < targetEpNum; epNum++) {
      const prog = getEpisodeProgress(media.id, targetSeasonNum, epNum);
      if (!prog || !prog.is_watched) {
        missing.push({ season_number: targetSeasonNum, episode_number: epNum });
      }
    }

    return missing;
  };

  // Trigger watching an episode (with prior episode check)
  const triggerEpisodeWatch = (ep: TMDBEpisode, rating?: number) => {
    const isAlreadyWatched = getEpisodeProgress(media.id, ep.season_number, ep.episode_number)?.is_watched;
    if (isAlreadyWatched) {
      onToggleEpisode(media.id, ep.season_number, ep.episode_number);
      setRatingEpisodeModal(null);
      return;
    }

    const missingItems = getMissingPriorEpisodes(ep.season_number, ep.episode_number);
    if (missingItems.length > 0) {
      setRatingEpisodeModal(null);
      setBatchConfirmModal({
        showId: media.id,
        seasonNum: ep.season_number,
        targetEp: ep,
        missingItems,
        rating
      });
    } else {
      if (rating && onRateEpisode) {
        onRateEpisode(media.id, ep.season_number, ep.episode_number, rating);
      } else {
        onToggleEpisode(media.id, ep.season_number, ep.episode_number);
      }
      setRatingEpisodeModal(null);
    }
  };

  // Handle direct episode card click -> Auto mark watched without asking (auto batch mark previous missing eps)
  const handleDirectEpisodeClick = (ep: TMDBEpisode) => {
    const isAlreadyWatched = getEpisodeProgress(media.id, ep.season_number, ep.episode_number)?.is_watched;
    if (isAlreadyWatched) {
      onToggleEpisode(media.id, ep.season_number, ep.episode_number);
      return;
    }

    const missingItems = getMissingPriorEpisodes(ep.season_number, ep.episode_number);
    if (missingItems.length > 0) {
      const allItemsToMark = [...missingItems, { season_number: ep.season_number, episode_number: ep.episode_number }];
      if (onBatchMarkEpisodes) {
        onBatchMarkEpisodes(media.id, allItemsToMark as any);
      } else {
        allItemsToMark.forEach(item => onToggleEpisode(media.id, item.season_number, item.episode_number));
      }
    } else {
      onToggleEpisode(media.id, ep.season_number, ep.episode_number);
    }
  };

  // Handle episode click -> Open 1-10 Rating Modal
  const handleOpenEpisodeModal = (ep: TMDBEpisode) => {
    const prog = getEpisodeProgress(media.id, ep.season_number, ep.episode_number);
    setSelectedEpScore(prog?.rating || 8);
    setRatingEpisodeModal(ep);
  };

  // Save Episode Rating & Mark as Watched
  const handleSaveEpisodeRating = () => {
    if (!ratingEpisodeModal) return;
    triggerEpisodeWatch(ratingEpisodeModal, selectedEpScore);
  };

  const toggleSpoilerReveal = (reviewId: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const mediaReviews = reviews.filter(r => r.media_id === media.id);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B0C0E]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 cursor-pointer"
    >
      
      {/* Outer Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl bg-[#0B0C0E] border border-[#232833] rounded-3xl overflow-y-auto shadow-2xl text-white max-h-[94vh] cursor-default scrollbar-thin scrollbar-thumb-white/10"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 py-20 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-[#E63946]"
            />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Detaylar Yükleniyor...</p>
          </div>
        ) : (
          <>
        
        {/* 1. HERO BANNER */}
        <div className="relative h-72 sm:h-96 shrink-0 bg-[#14171D] overflow-hidden group">
          
          {/* Backdrop Image */}
          <img
            src={getBackdropUrl(details.backdrop_path || details.poster_path)}
            alt={details.title || details.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-50 group-hover:scale-105 transition-transform duration-700"
          />

          {/* Dark Gradients for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0E] via-[#0B0C0E]/60 to-transparent" />

          {/* Top Bar Navigation: Sol Üstte 'Geri' Butonu & Right Exit */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
            {/* SOL ÜSTTE 'GERİ' BUTONU */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0B0C0E]/80 hover:bg-[#E63946] text-white border border-[#232833] hover:border-[#E63946] transition-all shadow-xl backdrop-blur-md group/btn"
              title="Geri Dön"
            >
              <ArrowLeft className="w-4 h-4 text-[#E63946] group-hover/btn:text-white transition-colors" />
              <span className="text-xs font-black uppercase tracking-wider">Geri</span>
            </button>

            {/* Right Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-[#0B0C0E]/80 text-slate-300 hover:text-white hover:bg-[#E63946] transition border border-[#232833] backdrop-blur-md shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hero Banner Content (Bottom Overlay) */}
          <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Title & Info */}
            <div className="flex items-end gap-5">
              
              {/* Poster Thumbnail */}
              <img
                src={getPosterUrl(details.poster_path)}
                alt={details.title || details.name}
                referrerPolicy="no-referrer"
                className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-2xl border-2 border-[#E63946]/50 shadow-2xl shrink-0 hidden sm:block bg-[#14171D]"
              />

              <div className="space-y-2">
                
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
                  <span className="bg-[#E63946] text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">
                    {isTv ? 'Diziler' : 'Filmler'}
                  </span>

                  {(details.release_date || details.first_air_date) && (
                    <span className="bg-[#14171D] text-slate-300 px-2.5 py-0.5 rounded-md border border-[#232833] text-[11px]">
                      {(details.release_date || details.first_air_date || '').substring(0, 4)}
                    </span>
                  )}

                  {details.vote_average > 0 && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-md border border-amber-500/30 text-[11px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {details.vote_average.toFixed(1)} / 10
                    </span>
                  )}

                  {isTv && details.number_of_seasons && (
                    <span className="bg-[#14171D] text-slate-300 px-2.5 py-0.5 rounded-md border border-[#232833] text-[11px]">
                      {details.number_of_seasons} Sezon
                    </span>
                  )}
                </div>

                {/* Başlık */}
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                  {details.title || details.name}
                </h1>

                {details.tagline && (
                  <p className="text-xs sm:text-sm text-slate-300 italic font-light drop-shadow">
                    "{details.tagline}"
                  </p>
                )}

              </div>
            </div>

            {/* Actions Bar: Durum Değiştirici & Favori */}
            <div className="p-2 sm:p-2.5 rounded-2xl bg-[#14171D]/90 backdrop-blur-md border border-[#232833] shadow-2xl">
              
              {/* Üst Satır: Durum Değiştirici & Favori Butonu */}
              <div className="flex items-center justify-between gap-2 w-full">
                
                {/* Durum Değiştirici Capsule */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-[#0B0C0E] p-1 rounded-xl border border-[#232833] flex-1 min-w-0 justify-between sm:justify-start">
                  {/* İzliyorum — only for TV shows */}
                  {isTv && (
                    <button
                      onClick={() => onUpdateWatchStatus(details, userWatchStatus === 'watching' ? null : 'watching')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        userWatchStatus === 'watching'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold'
                          : 'text-slate-400 hover:text-white hover:bg-[#232833]'
                      }`}
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" /> İzleniyor
                    </button>
                  )}

                  {/* İzleyeceğim */}
                  <button
                    onClick={() => onUpdateWatchStatus(details, userWatchStatus === 'plan_to_watch' ? null : 'plan_to_watch')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      userWatchStatus === 'plan_to_watch'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-extrabold'
                        : 'text-slate-400 hover:text-white hover:bg-[#232833]'
                    }`}
                  >
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" /> İzlenecek
                  </button>

                  {/* İzlendi */}
                  <button
                    onClick={() => {
                      if (userWatchStatus === 'watched') {
                        onUpdateWatchStatus(details, null);
                      } else {
                        setShowCompleteConfirmModal(true);
                      }
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      userWatchStatus === 'watched'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#232833]'
                    }`}
                  >
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> İzlendi
                  </button>

                  {/* Trash */}
                  {userWatchStatus !== null && (
                    <button
                      onClick={() => onUpdateWatchStatus(details, null)}
                      className="flex items-center justify-center p-1.5 sm:p-1 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                      title="Listemden Tamamen Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Favori Butonu — Sadece kullanıcı yapımı 'İzlendi' olarak işaretlediğinde gösterilir */}
                {onToggleFavorite && userWatchStatus === 'watched' && (
                  <button
                    onClick={() => onToggleFavorite(details)}
                    className={`p-2.5 sm:p-2 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                      isFavorited
                        ? 'bg-rose-500/20 border-rose-500 text-rose-500 hover:bg-rose-500/30'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={isFavorited ? "Favorilerimden Çıkar" : "Favorilerime Ekle"}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* Koleksiyona Ekle Modal */}
        {showAddToCollectionModal && onToggleItemInCollection && onCreateCollection && (
          <AddToCollectionModal
            media={details}
            collections={collections}
            onClose={() => setShowAddToCollectionModal(false)}
            onToggleItemInCollection={onToggleItemInCollection}
            onCreateCollection={onCreateCollection}
          />
        )}

        {/* 2. BODY CONTENT */}
        <div className="p-4 sm:p-8 space-y-8">
          
          {/* Özet & Hikaye - Sadece yapım henüz bitirilmediyse gösterilir */}
          {userWatchStatus !== 'watched' && (
            <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 shadow-lg space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#E63946]">Özet & Hikaye</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {details.overview || 'Açıklama bulunmuyor.'}
              </p>
            </div>
          )}

          {/* 3. SEZON BUTONLARI & BÖLÜM KARTLARI GRID'I (Tamamlanan dizilerde varsayılan kapalı, diğerlerinde açık gösterilir) */}
          {isTv && (
            <div className="bg-[#14171D] border border-[#232833] rounded-3xl shadow-xl transition-all overflow-hidden">
              
              {/* Header Bar - Tıklanabilir (Tamamlanan dizilerde tek sıra kapalı kalır, tıklanınca açılır) */}
              <div 
                onClick={() => setIsEpisodesExpanded(!isEpisodesExpanded)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition select-none ${
                  isEpisodesExpanded ? 'border-b border-[#232833] bg-[#14171D]' : 'bg-[#14171D] hover:bg-[#1A1E26]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    userWatchStatus === 'watched'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20'
                  }`}>
                    {userWatchStatus === 'watched' ? <CheckCircle2 className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">Bölüm Listesi & Takibi</h3>
                      {userWatchStatus === 'watched' && (
                        <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          Tamamlandı
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isEpisodesExpanded 
                        ? 'Bölümleri gizlemek için tıklayın' 
                        : userWatchStatus === 'watched'
                        ? 'Tüm bölümler tamamlandı • Bölüm detaylarını görmek için tıklayın'
                        : 'Puan vermek ve izlendi işaretlemek için tıklayın'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  {/* SEZON BUTONLARI (Sadece Açık Olduğunda Gösterilir) */}
                  {isEpisodesExpanded && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" onClick={(e) => e.stopPropagation()}>
                      {Array.from({ length: details.number_of_seasons || 2 }).map((_, idx) => {
                        const sNum = idx + 1;
                        const isActive = selectedSeasonNum === sNum;
                        return (
                          <button
                            key={sNum}
                            onClick={() => handleSeasonChange(sNum)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shadow-md ${
                              isActive
                                ? 'bg-[#E63946] text-white border border-[#E63946] shadow-[#E63946]/25 scale-105'
                                : 'bg-[#0B0C0E] text-slate-300 hover:text-white border border-[#232833] hover:border-[#E63946]/50'
                            }`}
                          >
                            Season {sNum}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* AÇ/KAPAT OK İKONU */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0 ml-auto sm:ml-0">
                    <span className="hidden sm:inline-block">{isEpisodesExpanded ? 'Gizle' : 'Bölümleri Göster'}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isEpisodesExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* BÖLÜM KARTLARI GRID'I (Sadece Açık Olduğunda Gösterilir) */}
              {isEpisodesExpanded && (
                <div className="p-4 sm:p-6 space-y-5 bg-[#14171D]">
                  {loadingSeason ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-8 h-8 rounded-full border-3 border-slate-800 border-t-[#E63946]"
                      />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">Bölümler Yükleniyor...</p>
                    </div>
                  ) : seasonDetails && seasonDetails.episodes ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {seasonDetails.episodes.map(ep => {
                        const prog = getEpisodeProgress(details.id, ep.season_number, ep.episode_number);
                        const isWatched = prog?.is_watched;
                        const userScore = prog?.rating;
                        const isNextToWatch = !isWatched && ep.episode_number === nextEpNum;

                        let cardBorderClass = '';
                        let topText = `${ep.season_number}. SEZON ${ep.episode_number}. BÖLÜM`;
                        let statusIcon = null;
                        let bottomBadge = null;

                        if (isWatched) {
                          cardBorderClass = 'border-2 border-[#4ADE80] bg-[#4ADE80]/10 hover:bg-[#4ADE80]/15 shadow-md shadow-[#4ADE80]/10';
                          statusIcon = (
                            <div className="w-5 h-5 rounded-full bg-[#4ADE80] text-[#0B0C0E] flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          );
                          bottomBadge = (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4ADE80] flex items-center gap-1">
                              <span>İZLEDİM</span>
                              {userScore ? <span className="text-amber-300 font-mono font-bold">★ {userScore}</span> : null}
                            </span>
                          );
                        } else if (isNextToWatch) {
                          cardBorderClass = 'border-2 border-[#FBBF24] bg-[#FBBF24]/10 hover:bg-[#FBBF24]/15 shadow-md shadow-[#FBBF24]/10';
                          statusIcon = (
                            <div className="w-5 h-5 rounded-full bg-[#FBBF24] text-[#0B0C0E] flex items-center justify-center shrink-0 shadow-sm">
                              <Zap className="w-3 h-3 fill-current" />
                            </div>
                          );
                          bottomBadge = (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FBBF24] bg-[#FBBF24]/20 px-2 py-0.5 rounded-md border border-[#FBBF24]/30">
                              SIRADAKİ
                            </span>
                          );
                        } else {
                          cardBorderClass = 'bg-[#1A1D23] border border-[#232833] hover:border-slate-500';
                          statusIcon = (
                            <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0 group-hover:border-slate-400 transition-colors" />
                          );
                          bottomBadge = (
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              İZLENMEDİ
                            </span>
                          );
                        }

                        const epNote = prog?.note;
                        const epNoteSpoiler = prog?.note_has_spoiler;

                        return (
                          <div
                            key={ep.id}
                            onClick={() => handleDirectEpisodeClick(ep)}
                            className={`p-2.5 sm:p-3 rounded-2xl ${cardBorderClass} transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[116px] overflow-hidden hover:scale-[1.02] select-none`}
                          >
                            {/* Üstte küçük metin: 3. SEZON 1. BÖLÜM & Sağ üstte Not İkonu & Dairesel durum ikonu */}
                            <div className="flex items-center justify-between gap-1 z-10">
                              <span className={`text-[10px] font-black font-mono uppercase tracking-wider truncate ${
                                isWatched ? 'text-[#4ADE80]' : isNextToWatch ? 'text-[#FBBF24]' : 'text-slate-400'
                              }`}>
                                {topText}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Kişisel Not Gösterge İkonu & Tooltip */}
                                {epNote && (
                                  <div className="relative group/note z-30">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); openNoteModal(ep); }}
                                      className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 transition"
                                      title="Kişisel Notu Oku/Düzenle"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    {/* Tooltip Bilgi Baloncuğu */}
                                    <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 rounded-xl bg-[#0B0C0E] border border-amber-500/50 text-white text-[11px] shadow-2xl opacity-0 group-hover/note:opacity-100 transition-all duration-200 pointer-events-none z-50">
                                      <div className="flex items-center justify-between mb-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                        <span>Kişisel Notun</span>
                                        {epNoteSpoiler && (
                                          <span className="text-[#E63946] flex items-center gap-0.5">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Spoiler
                                          </span>
                                        )}
                                      </div>
                                      <p className="line-clamp-4 leading-relaxed text-slate-200 italic font-medium">
                                        "{epNote}"
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {statusIcon}
                              </div>
                            </div>

                            {/* Ortada bold/koyu başlık: Episode Name */}
                            <h4 className={`font-black text-xs sm:text-sm line-clamp-2 uppercase tracking-wide leading-tight my-1 ${
                              isWatched ? 'text-white' : isNextToWatch ? 'text-white' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {ep.name}
                            </h4>

                            {/* Alt tarafta minik durum etiketi & Sağ altta Puanla Butonu */}
                            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-white/10 mt-auto min-w-0 w-full overflow-hidden">
                              <div className="min-w-0 flex-1 truncate">
                                {bottomBadge}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEpisodeModal(ep);
                                }}
                                className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-500/30 transition shadow-sm shrink-0 whitespace-nowrap hover:scale-105 active:scale-95"
                                title="Bölümü Puanla"
                              >
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 shrink-0" />
                                <span className="whitespace-nowrap">{userScore ? `★ ${userScore}` : 'Puanla'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">Bölüm bilgileri yükleniyor...</div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* 4. GENEL İNCELEME & YORUM ALANI */}
          <div ref={reviewSectionRef} className="bg-[#14171D] border border-[#232833] rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Genel İnceleme & Yorumlar</h3>
                  <p className="text-[11px] text-slate-400">Bu yapım hakkındaki puanını ver, eleştirini yaz</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold bg-[#0B0C0E] text-slate-300 px-3 py-1 rounded-xl border border-[#232833]">
                {mediaReviews.length} Değerlendirme
              </span>
            </div>

            {/* WRITE REVIEW FORM: Sadece yapım 'İzlendi' olarak işaretlendiğinde aktif olur */}
            {userWatchStatus === 'watched' ? (
              <form onSubmit={handleReviewSubmit} className="bg-[#0B0C0E] border border-[#232833] rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                
                {/* Genel 1-10 Puan Seçimi */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Genel Puanınız (1 - 10)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const val = idx + 1;
                      const isSelected = userGeneralRating === val;
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setUserGeneralRating(val)}
                          className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#E63946] text-white shadow-lg shadow-[#E63946]/30 scale-110 border-2 border-[#E63946]'
                              : 'bg-[#14171D] text-slate-300 hover:text-white hover:bg-[#232833] border border-[#232833]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Yazılı Yorum Kutusu */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Yazılı Yorum & Değerlendirme
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Bu yapım hakkındaki detaylı düşüncelerinizi, senaryo ve oyunculuk yorumlarınızı yazın..."
                    rows={3}
                    className="w-full bg-[#14171D] border border-[#232833] rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition"
                  />
                </div>

                {/* Spoiler Toggle & Submit */}
                <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                  
                  {/* 'Spoiler İçerir' toggle seçeneği */}
                  <label className="flex items-center gap-2.5 text-xs text-amber-400 cursor-pointer select-none font-bold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition">
                    <input
                      type="checkbox"
                      checked={containsSpoiler}
                      onChange={(e) => setContainsSpoiler(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#0B0C0E] border-[#232833] text-[#E63946] focus:ring-0 cursor-pointer"
                    />
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Spoiler</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!reviewText.trim()}
                    className="px-6 py-2.5 bg-[#E63946] hover:bg-[#d62839] disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-[#E63946]/30 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Yorumu Paylaş
                  </button>

                </div>

                {showReviewSubmitted && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center animate-in fade-in">
                    ✓ İncelemeniz ve puanınız başarıyla kaydedildi!
                  </div>
                )}

              </form>
            ) : (
              <div className="bg-[#0B0C0E] border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-inner">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>İnceleme & Puan Kısıtlaması</span>
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Puan vermek ve inceleme yazmak için bu yapımı öncelikle <strong className="text-emerald-400 font-extrabold">"İzlendi"</strong> olarak işaretlemelisiniz.
                </p>
              </div>
            )}

            {/* REVIEWS LIST: Spoiler'lı Yorumlar Blur Gösterimi */}
            <div className="space-y-4">
              {mediaReviews.length === 0 ? (
                <div className="text-center py-8 bg-[#0B0C0E] rounded-2xl border border-[#232833] p-4">
                  <p className="text-xs text-slate-400">Henüz bu yapım için kaleme alınmış bir inceleme bulunmuyor. İlk yorumu sen paylaş!</p>
                </div>
              ) : (
                mediaReviews.map((rev) => {
                  const revId = rev.id || `rev_${Math.random()}`;
                  const isRevealed = revealedSpoilers[revId];
                  const isSpoiler = rev.contains_spoiler;

                  return (
                    <div
                      key={revId}
                      className="bg-[#0B0C0E] border border-[#232833] rounded-2xl p-4 space-y-3 shadow-md"
                    >
                      {/* Review User & Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={rev.profile?.username}
                            className="w-8 h-8 rounded-full object-cover border border-[#E63946]"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">
                              {rev.profile?.full_name || rev.profile?.username}
                            </span>
                            <span className="text-[10px] text-slate-400">@{rev.profile?.username || 'kullanici'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 px-3 py-1 rounded-xl text-xs font-extrabold border border-amber-500/30">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating} / 10
                        </div>
                      </div>

                      {/* Review Text Area: SPOILER BLUR EFFECT (backdrop-filter: blur(8px)) */}
                      <div className="relative overflow-hidden rounded-xl">
                        {isSpoiler && !isRevealed ? (
                          <div
                            onClick={() => toggleSpoilerReveal(revId)}
                            className="relative cursor-pointer group"
                          >
                            {/* Blurred Text Preview */}
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed blur-md select-none opacity-40 p-3 bg-[#14171D] rounded-xl border border-[#232833]">
                              {rev.review_text}
                            </p>

                            {/* Spoiler Warning Overlay */}
                            <div className="absolute inset-0 bg-amber-950/80 border border-amber-500/40 rounded-xl flex items-center justify-center gap-2 p-3 text-amber-400 font-bold text-xs group-hover:bg-amber-950/90 transition">
                              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>⚠️ SPOILER İÇERİR - Görmek İçin Tıklayın</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-[#14171D] rounded-xl border border-[#232833] space-y-1">
                            {isSpoiler && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 inline-block mb-1">
                                ⚠️ SPOILER İÇERİR
                              </span>
                            )}
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                              "{rev.review_text}"
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
          </>
        )}

      </motion.div>

      {/* 5. QUICK 1-10 RATING POPUP / MODAL FOR EPISODE */}
      <AnimatePresence>
        {ratingEpisodeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setRatingEpisodeModal(null);
            }}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#14171D] border border-[#E63946] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center relative cursor-default"
            >
              
              <button
                onClick={() => setRatingEpisodeModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 fill-current" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#E63946]">
                  S{ratingEpisodeModal.season_number}E{ratingEpisodeModal.episode_number}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {ratingEpisodeModal.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bu bölüm için 1-10 arasında bir puan verin:
                </p>
              </div>

              {/* 1-10 Rating Selector Buttons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const score = idx + 1;
                  const isSel = selectedEpScore === score;
                  return (
                    <button
                      key={score}
                      onClick={() => setSelectedEpScore(score)}
                      className={`py-2 rounded-xl font-mono text-xs font-extrabold transition-all ${
                        isSel
                          ? 'bg-[#4ADE80] text-slate-950 font-black shadow-lg shadow-[#4ADE80]/30 scale-105'
                          : 'bg-[#0B0C0E] text-slate-300 hover:text-white hover:bg-[#232833] border border-[#232833]'
                      }`}
                    >
                      ★ {score}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSaveEpisodeRating}
                  className="w-full py-3 bg-[#4ADE80] hover:bg-[#3ec770] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#4ADE80]/25 transition"
                >
                  Puanı Kaydet & İzlendi İşaretle
                </button>

                <button
                  onClick={() => triggerEpisodeWatch(ratingEpisodeModal)}
                  className="w-full py-2 bg-[#0B0C0E] hover:bg-[#232833] text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-[#232833] transition"
                >
                  Sadece Durumu Değiştir
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* BATCH CONFIRMATION POP-UP MODAL            */}
      {/* ========================================== */}
      <AnimatePresence>
        {batchConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setBatchConfirmModal(null);
            }}
            className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#14171D] border border-[#2B313E] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-center relative cursor-default"
            >
              <button
                onClick={() => setBatchConfirmModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#FBBF24]/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-wider">
                  {batchConfirmModal.seasonNum}. Sezon • {batchConfirmModal.targetEp.episode_number}. Bölüm
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Önceki Bölümleri İşaretle
                </h3>
              </div>

              <div className="bg-[#0B0C0E] border border-[#2B313E] rounded-2xl p-4 text-slate-200 text-xs sm:text-sm font-semibold leading-relaxed shadow-inner">
                {formatMissingEpisodesText(batchConfirmModal.missingItems)} de izlendi olarak işaretlemek ister misin?
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() => {
                    const allItemsToMark = [...batchConfirmModal.missingItems, { season_number: batchConfirmModal.targetEp.season_number, episode_number: batchConfirmModal.targetEp.episode_number }];
                    if (onBatchMarkEpisodes) {
                      onBatchMarkEpisodes(batchConfirmModal.showId, allItemsToMark as any);
                    } else {
                      allItemsToMark.forEach(item => onToggleEpisode(batchConfirmModal.showId, item.season_number, item.episode_number));
                    }
                    if (batchConfirmModal.rating && onRateEpisode) {
                      onRateEpisode(batchConfirmModal.showId, batchConfirmModal.seasonNum, batchConfirmModal.targetEp.episode_number, batchConfirmModal.rating);
                    }
                    setBatchConfirmModal(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs text-slate-950 bg-[#4ADE80] hover:bg-[#3ec770] shadow-lg shadow-[#4ADE80]/20 transition flex items-center justify-center gap-2 uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Evet, Tümünü İşaretle</span>
                </button>

                <button
                  onClick={() => {
                    if (batchConfirmModal.rating && onRateEpisode) {
                      onRateEpisode(batchConfirmModal.showId, batchConfirmModal.seasonNum, batchConfirmModal.targetEp.episode_number, batchConfirmModal.rating);
                    } else {
                      onToggleEpisode(batchConfirmModal.showId, batchConfirmModal.seasonNum, batchConfirmModal.targetEp.episode_number);
                    }
                    setBatchConfirmModal(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-[#232833] hover:bg-[#2B313E] border border-white/10 transition"
                >
                  Sadece {batchConfirmModal.targetEp.episode_number}. Bölümü İşaretle
                </button>

                <button
                  onClick={() => setBatchConfirmModal(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-300 transition py-1 block mx-auto"
                >
                  İptal
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* PERSONAL EPISODE NOTE / REVIEW MODAL        */}
      {/* ========================================== */}
      <AnimatePresence>
        {noteModalEp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setNoteModalEp(null);
            }}
            className="fixed inset-0 z-80 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#14171D] border border-[#2B313E] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative cursor-default"
            >
              <button
                onClick={() => setNoteModalEp(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-[#232833] pb-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    {noteModalEp.season_number}. Sezon • {noteModalEp.episode_number}. Bölüm
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">
                    {noteModalEp.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Kişisel Notun & Yorumun:
                </label>
                <textarea
                  value={noteInputText}
                  onChange={(e) => setNoteInputText(e.target.value)}
                  placeholder="Bu bölüm hakkında düşüncelerin, unutmak istemediğin sahneler veya notların..."
                  rows={4}
                  className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none custom-scrollbar leading-relaxed"
                />

                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={noteHasSpoiler}
                    onChange={(e) => setNoteHasSpoiler(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2B313E] bg-[#0B0C0E] text-[#E63946] focus:ring-[#E63946]"
                  />
                  <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E63946]" />
                    <span>Bu not spoiler içeriyor</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#232833]">
                <button
                  type="button"
                  onClick={() => setNoteModalEp(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#232833] hover:bg-[#2B313E] text-slate-300 transition"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-black shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Notu Kaydet
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tamamlandı / İzlendi Onay Modalı */}
      <AnimatePresence>
        {showCompleteConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14171D] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">
                  Kategoriyi Değiştir
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isTv ? 'Diziyi' : 'Yapımı'} tamamlandı kategorisine taşımak istiyor musunuz?
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateWatchStatus(details, 'watched');
                    setShowCompleteConfirmModal(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                >
                  Evet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
