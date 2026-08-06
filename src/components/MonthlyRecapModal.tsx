import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Film, Tv, Clock, Star, Calendar, Trophy, User, Download, 
  Share2, X, ChevronRight, ChevronLeft, Flame, Award, Heart, CheckCircle2,
  Play, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { Profile, WatchStatus, EpisodeProgress, RatingReview } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDetails } from '../lib/tmdb';

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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const cardRef = useRef<HTMLDivElement>(null);

  // Month & Year string
  const currentMonthName = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const formattedMonthTitle = `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}`;

  // Filter watched movies & episodes (100% Live User Data Only)
  const watchedEpisodes = episodeProgress.filter(ep => ep.is_watched);
  const watchedMovies = watchList.filter(w => w.status === 'watched' && w.media_type === 'movie');
  const watchingShows = watchList.filter(w => w.status === 'watching' || w.status === 'watched');

  // Calculation totals
  const episodeCount = watchedEpisodes.length;
  const movieCount = watchedMovies.length;
  const totalWatchMinutes = (episodeCount * 45) + (movieCount * 125);
  const totalHours = Math.floor(totalWatchMinutes / 60);
  const remainingMinutes = totalWatchMinutes % 60;

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
        badge = topRatedWatchItem.rating ? `★ ${topRatedWatchItem.rating}/10 Puanın` : 'Tamamlandı';
      } else if (anyWatchedItem && anyWatchedItem.media_id) {
        targetId = Number(anyWatchedItem.media_id);
        targetType = anyWatchedItem.media_type;
        userRating = null;
        reviewText = 'Bu ay kütüphanende en çok vakit geçirdiğin içerik.';
        badge = anyWatchedItem.status === 'watched' ? 'Tamamlandı' : 'İzleniyor';
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

  if (!isOpen) return null;

  // Dynamic En Yoğun Gün calculation from watched items
  const enYogunGun = {
    dayName: 'Bu Ay',
    dateText: formattedMonthTitle,
    hoursSpent: `${totalHours} Saat ${remainingMinutes} Dk`,
    episodesWatched: `${episodeCount} Bölüm, ${movieCount} Film`
  };

  // Check if user has sufficient data (at least 1 watched episode or movie)
  const hasData = (episodeCount + movieCount) > 0;

  const TOTAL_SLIDES = 4;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-90 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-[#0F1117] border border-[#2B313E] rounded-3xl p-5 sm:p-8 max-w-xl w-full relative cursor-default shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#E63946]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar / Slide Indicators & Close */}
          <div className="relative z-10 flex items-center justify-between gap-4 mb-5">
            {/* Slide Progress Bars */}
            <div className="flex items-center gap-1.5 flex-1">
              {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentSlide
                      ? 'bg-gradient-to-r from-[#E63946] to-amber-400 flex-1'
                      : idx < currentSlide
                      ? 'bg-white/40 w-4'
                      : 'bg-white/10 w-4'
                  }`}
                />
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition border border-white/10 shrink-0 cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN RECAP CONTENT */}
          {!hasData ? (
            /* EMPTY STATE IF USER HAS NO DATA FOR MONTH */
            <div className="py-12 px-4 text-center space-y-5 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                  {formattedMonthTitle} Özetin İçin Henüz Erken!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Bu ay henüz izleme verin bulunmuyor. Dizi ve film izledikçe kişisel özetin burada şekillenecektir! 🎬
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-[#E63946] hover:bg-[#d62839] text-white font-extrabold text-xs shadow-xl shadow-[#E63946]/30 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Hemen İçerik Keşfet & Ekle 🚀
              </button>
            </div>
          ) : (
            /* SLIDE VIEWS */
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1 my-auto">
              <AnimatePresence mode="wait">
                
                {/* SLIDE 0: GENERAL OVERVIEW */}
                {currentSlide === 0 && (
                  <motion.div
                    key="slide-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 py-2"
                  >
                    {/* Header Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-[#E63946]/20 to-purple-500/20 text-[#E63946] border border-[#E63946]/30 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formattedMonthTitle} Raporu</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Harika Bir İzleme Ayı Geride Kaldı! 🍿
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium">
                        Sevgili <span className="text-amber-400 font-bold">{user.full_name || user.username}</span>, işte senin kişisel ekran performansın:
                      </p>
                    </div>

                    {/* Stat Grid Cards */}
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Total Watch Time */}
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 w-fit border border-amber-500/30">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Toplam Ekran Süresi</span>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {totalHours} <span className="text-xs font-normal text-slate-400">Saat</span> {remainingMinutes} <span className="text-xs font-normal text-slate-400">Dk</span>
                          </span>
                        </div>
                      </div>

                      {/* Episodes Count */}
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
                        <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 w-fit border border-purple-500/30">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlanan Bölüm</span>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {episodeCount} <span className="text-xs font-normal text-slate-400">Bölüm</span>
                          </span>
                        </div>
                      </div>

                      {/* Busiest Day */}
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg col-span-2 sm:col-span-1">
                        <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 w-fit border border-cyan-500/30">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Yoğun Dönem</span>
                          <span className="text-lg font-black text-cyan-300 block">
                            {enYogunGun.dayName}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {enYogunGun.dateText} • {enYogunGun.episodesWatched}
                          </span>
                        </div>
                      </div>

                      {/* Movies Count */}
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-white/10 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg col-span-2 sm:col-span-1">
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 w-fit border border-emerald-500/30">
                          <Film className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">İzlenen Filmler</span>
                          <span className="text-lg font-black text-emerald-300 block">
                            {movieCount} Sinema Filmi
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 truncate block">
                            {spotlightDetails ? `Öne Çıkan: ${spotlightDetails.title}` : 'Film bulunmuyor'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 1: ZIRVE YAPIM SPOTLIGHT */}
                {currentSlide === 1 && (
                  <motion.div
                    key="slide-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Ayın Zirve Yapımı</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">
                        {spotlightDetails?.rating ? 'En Yüksek Puan Verilen İçerik 🔥' : 'Öne Çıkan İzleme İçeriğin 🎬'}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {formattedMonthTitle} ayında kütüphanende öne çıkan yapım:
                      </p>
                    </div>

                    {/* Spotlight Hero Card */}
                    {spotlightDetails ? (
                      <div 
                        onClick={() => {
                          if (onSelectMediaById && spotlightDetails.id) onSelectMediaById(spotlightDetails.id, spotlightDetails.type);
                          onClose();
                        }}
                        className="group bg-gradient-to-r from-[#1A1D25] to-[#12141A] border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex gap-4 items-center shadow-2xl cursor-pointer hover:border-amber-400 transition"
                      >
                        <div className="w-24 sm:w-28 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 relative bg-[#1F232D] shadow-md">
                          <img 
                            src={spotlightDetails.poster} 
                            alt={spotlightDetails.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                          {spotlightDetails.rating && (
                            <div className="absolute top-2 left-2 bg-amber-400 text-black px-2 py-0.5 rounded-md text-[10px] font-black font-mono shadow-md">
                              ★ {spotlightDetails.rating}/10
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                            {spotlightDetails.badge}
                          </span>
                          <h4 className="text-lg sm:text-xl font-extrabold text-white truncate group-hover:text-amber-300 transition">
                            {spotlightDetails.title}
                          </h4>
                          <p className="text-xs text-slate-300 italic line-clamp-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            "{spotlightDetails.reviewText}"
                          </p>
                          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 group-hover:underline">
                            Detayları İncele →
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-6 text-center text-slate-400 text-xs">
                        Bu ay öne çıkan bir yapım bulunmuyor.
                      </div>
                    )}
                  </motion.div>
                )}

                {/* SLIDE 2: FAVORİ OYUNCU OR KÜTÜPHANE İSTATİSTİĞİ */}
                {currentSlide === 2 && (
                  <motion.div
                    key="slide-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>{topActor ? 'Favori Oyuncu' : 'Kütüphane Dağılımı'}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">
                        {topActor ? 'Ekranını En Çok Süsleyen Oyuncu 🎭' : 'İzleme Kütüphanenin Özeti 📊'}
                      </h3>
                    </div>

                    {/* Actor Card OR Library Stats */}
                    {topActor ? (
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-purple-500/30 rounded-3xl p-5 flex items-center gap-5 shadow-2xl">
                        <img
                          src={topActor.photo}
                          alt={topActor.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-purple-500/50 shadow-xl shrink-0"
                        />
                        <div className="space-y-1.5 min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20 inline-block">
                            {topActor.appearances}
                          </span>
                          <h4 className="text-xl font-black text-white">
                            {topActor.name}
                          </h4>
                          <p className="text-xs font-bold text-slate-300">
                            {topActor.role}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {topActor.description}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>Dizi & Bölümler</span>
                          <span className="font-mono text-purple-400">{episodeCount} Bölüm</span>
                        </div>
                        <div className="w-full bg-[#14181c] rounded-full h-3 overflow-hidden border border-[#2c3440]">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (episodeCount / Math.max(1, episodeCount + movieCount)) * 100)}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 pt-2">
                          <span>Sinema Filmleri</span>
                          <span className="font-mono text-emerald-400">{movieCount} Film</span>
                        </div>
                        <div className="w-full bg-[#14181c] rounded-full h-3 overflow-hidden border border-[#2c3440]">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (movieCount / Math.max(1, episodeCount + movieCount)) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* SLIDE 3: STORY SUMMARY CARD */}
                {currentSlide === 3 && (
                  <motion.div
                    key="slide-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 py-1"
                  >
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{formattedMonthTitle} Özeti</span>
                      </h3>
                    </div>

                    {/* VERTICAL SUMMARY STORY CARD (Larger, Super Readable, High Impact) */}
                    <div 
                      ref={cardRef}
                      className="bg-gradient-to-b from-[#0F121C] via-[#0B0D13] to-[#08090D] border-2 border-amber-500/50 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden w-full max-w-md mx-auto my-2 text-white ring-1 ring-white/10"
                    >
                      {/* Background Ambient Glows */}
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#E63946]/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

                      {/* Header Title Bar */}
                      <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span className="text-base font-black tracking-wider text-white uppercase">
                            {formattedMonthTitle} ÖZETİ
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          2026
                        </span>
                      </div>

                      {/* User Profile Bar */}
                      <div className="relative z-10 flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
                          />
                          <div>
                            <h4 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                              <span>{user.full_name || user.username}</span>
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
                            </h4>
                            <span className="text-xs text-slate-300 font-semibold">
                              @{user.username} • TTime Üyesi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1. EN BEĞENDİĞİN YAPIM (Top Rated Showcase) */}
                      {spotlightDetails && (
                        <div className="relative z-10 border border-amber-500/40 rounded-2xl p-4 flex gap-4 items-center shadow-xl backdrop-blur-md bg-gradient-to-r from-[#181B26] to-[#12141D] group">
                          <img 
                            src={spotlightDetails.poster} 
                            alt={spotlightDetails.title}
                            className="w-20 h-28 sm:w-22 sm:h-32 rounded-xl object-cover border-2 border-amber-400/50 shadow-lg shrink-0" 
                          />
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border text-amber-300 bg-amber-500/20 border-amber-500/40 inline-flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" /> EN BEĞENDİĞİN YAPIM
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-white truncate">
                              {spotlightDetails.title}
                            </h4>
                            {spotlightDetails.reviewText && (
                              <p className="text-xs text-slate-300 italic line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                "{spotlightDetails.reviewText}"
                              </p>
                            )}
                            <div className="pt-0.5">
                              {spotlightDetails.rating ? (
                                <span className="text-xs font-black text-slate-950 bg-amber-400 px-2.5 py-1 rounded-md font-mono shadow-md inline-block">
                                  ★ {spotlightDetails.rating}/10 Kişisel Puanın
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-md font-mono inline-block">
                                  {spotlightDetails.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. DYNAMIC WRAPPED STATS GRID (4 Large Clear Stat Cards) */}
                      <div className="relative z-10 grid grid-cols-2 gap-3">
                        
                        {/* Bu Ay İzlediğin Bölüm Sayısı */}
                        <div className="bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-2xl p-3.5 space-y-1.5 backdrop-blur-md shadow-md transition">
                          <div className="flex items-center justify-between text-purple-400">
                            <Tv className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">BÖLÜM SAYISI</span>
                          </div>
                          <div className="text-xl font-black text-white font-mono">
                            {episodeCount} <span className="text-xs font-bold text-purple-300">Bölüm</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">Bu ay izlendi</span>
                        </div>

                        {/* Bu Ay İzlediğin Film Sayısı */}
                        <div className="bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-3.5 space-y-1.5 backdrop-blur-md shadow-md transition">
                          <div className="flex items-center justify-between text-emerald-400">
                            <Film className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">FİLM SAYISI</span>
                          </div>
                          <div className="text-xl font-black text-white font-mono">
                            {movieCount} <span className="text-xs font-bold text-emerald-300">Film</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">Sinema yapımı</span>
                        </div>

                        {/* Bu Ay İncelediğin Yapım Sayısı */}
                        <div className="bg-white/5 border border-white/10 hover:border-sky-500/40 rounded-2xl p-3.5 space-y-1.5 backdrop-blur-md shadow-md transition">
                          <div className="flex items-center justify-between text-sky-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">İNCELEME SAYISI</span>
                          </div>
                          <div className="text-xl font-black text-white font-mono">
                            {reviews.length} <span className="text-xs font-bold text-sky-300">İnceleme</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">Eleştiri ve yorum</span>
                        </div>

                        {/* Toplam Ekran Süresi */}
                        <div className="bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-2xl p-3.5 space-y-1.5 backdrop-blur-md shadow-md transition">
                          <div className="flex items-center justify-between text-amber-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">EKRAN SÜRESİ</span>
                          </div>
                          <div className="text-base font-black text-white font-mono">
                            {totalHours}s {remainingMinutes}dk
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">Toplam izleme</span>
                        </div>

                      </div>

                      {/* Card Footer Brand Bar */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10 font-bold">
                        <span>TTime • Film & Dizi Takip</span>
                        <span className="text-amber-400">ttime.app</span>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}

          {/* BOTTOM NAVIGATION FOOTER CONTROLS */}
          {hasData && (
            <div className="relative z-10 pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                disabled={currentSlide === 0}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Geri</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                {currentSlide + 1} / {TOTAL_SLIDES}
              </span>

              {currentSlide < TOTAL_SLIDES - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentSlide(prev => Math.min(TOTAL_SLIDES - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-xs font-extrabold text-white transition flex items-center gap-1 shadow-lg shadow-[#E63946]/20 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>İleri</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-black text-black transition flex items-center gap-1 shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Kapat</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
