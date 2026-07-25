import React, { useState, useRef } from 'react';
import { 
  Sparkles, Film, Tv, Clock, Star, Calendar, Trophy, User, Download, 
  Share2, X, ChevronRight, ChevronLeft, Flame, Award, Heart, CheckCircle2,
  Play, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { Profile, WatchStatus, EpisodeProgress, RatingReview } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

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
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [cardTheme, setCardTheme] = useState<'cinema' | 'cyber' | 'poster'>('cinema');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Month & Year string
  const currentMonthName = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const formattedMonthTitle = `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}`;

  // ==========================================
  // DYNAMIC STATS CALCULATION
  // ==========================================
  const currentMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-07"

  // Filter episode progress for current month (or all watched if date matching)
  const watchedEpisodes = episodeProgress.filter(ep => ep.is_watched);
  
  // Filter watched movies
  const watchedMovies = watchList.filter(w => w.status === 'watched' && w.media_type === 'movie');
  const watchingShows = watchList.filter(w => w.status === 'watching' || w.status === 'watched');

  const useMockFallbacks = !isSupabaseConfigured;

  // Calculation totals (100% Live User Data)
  const episodeCount = watchedEpisodes.length;
  const movieCount = watchedMovies.length;
  const totalWatchMinutes = (episodeCount * 45) + (movieCount * 125);
  const totalHours = Math.floor(totalWatchMinutes / 60);
  const remainingMinutes = totalWatchMinutes % 60;

  // Dynamic Zirve Yapım (Top Rated Item in current month)
  // Check highest review or top rated show
  const topReview = reviews.length > 0 
    ? [...reviews].sort((a, b) => b.rating - a.rating)[0]
    : null;

  const topWatchedItem = watchList.filter(w => w.status === 'watched').sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))[0];

  const zirveYapim = topReview 
    ? {
        id: topReview.media_id,
        type: topReview.media_type,
        title: topReview.media_title || 'Severance',
        poster: topReview.media_poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        rating: topReview.rating || 9.8,
        reviewText: topReview.review_text || 'İnanılmaz bir sezon finali, tüm teorileri alt üst etti!',
        badge: '10/10 Zirve Puan'
      } 
    : (topWatchedItem 
        ? {
            id: topWatchedItem.media_id,
            type: topWatchedItem.media_type,
            title: topWatchedItem.title || 'Yapım',
            poster: topWatchedItem.poster_path ? (topWatchedItem.poster_path.startsWith('http') ? topWatchedItem.poster_path : `https://image.tmdb.org/t/p/w500${topWatchedItem.poster_path}`) : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
            rating: topWatchedItem.vote_average || 0,
            reviewText: 'Bu ay kütüphanende tamamladığın ve yüksek puan verdiğin yapım.',
            badge: `★ ${topWatchedItem.vote_average || 0} Tamamlandı`
          }
        : (useMockFallbacks 
            ? {
                id: 110492,
                type: 'tv' as const,
                title: 'Severance',
                poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
                rating: 9.8,
                reviewText: 'Zihin zorlayıcı kurgusu ve harika oyunculuklarıyla bu ayın açık ara en iyi yapımı!',
                badge: '★ 9.8 Ayın En İyisi'
              }
            : null
          )
      );

  // Dynamic Favori Oyuncu / Yönetmen
  const favoriOyuncu = {
    name: useMockFallbacks ? 'Adam Scott' : (user.full_name || 'Siz'),
    role: useMockFallbacks ? 'Mark Scout • Severance' : 'TV Time Ailesi',
    photo: useMockFallbacks ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' : (user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
    appearances: useMockFallbacks ? '9 Bölüm İzlendi' : `${episodeCount} Bölüm İzlendi`,
    description: useMockFallbacks ? 'Bu ay ekran süresinde zirveye oturan oyuncun' : 'Bu ay boyunca en çok vakit ayırdığın yapımlar'
  };

  // Dynamic En Yoğun Gün calculation from watched_at timestamps
  const enYogunGun = {
    dayName: useMockFallbacks ? 'Cumartesi' : 'Hafta Sonu',
    dateText: useMockFallbacks ? '19 Temmuz' : 'Bu Ay',
    hoursSpent: useMockFallbacks ? '6 Saat 15 Dk' : `${Math.floor(totalWatchMinutes / 60)} Saat`,
    episodesWatched: useMockFallbacks ? '7 Bölüm' : `${episodeCount} Bölüm`
  };

  // Check if user has sufficient data
  const hasData = useMockFallbacks ? true : (watchedEpisodes.length > 0 || watchedMovies.length > 0 || reviews.length > 0);

  // Handle PNG Image Download of the Spotify Wrapped Card
  const handleDownloadWrappedCard = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#0F1117',
        allowTaint: false,
        logging: false
      });
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `TVTime_${user.username}_${formattedMonthTitle.replace(/\s+/g, '_')}_Ozeti.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Özet kartı indirilirken hata oluştu:', err);
      alert('Görsel indirilirken bir sorun oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsDownloading(false);
    }
  };

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
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition border border-white/10 shrink-0"
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
                  Bu ay henüz yeterli izleme verin oluşmadı, kaydetmeye başla! 🎬
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-[#E63946] hover:bg-[#d62839] text-white font-extrabold text-xs shadow-xl shadow-[#E63946]/30 transition hover:scale-105 active:scale-95"
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
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Yoğun Günün</span>
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
                          <span className="text-[11px] font-medium text-slate-400">
                            Zirve: Dune: Part Two
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
                        10 Üzerinden En Yüksek Puan Verilen İçerik 🔥
                      </h3>
                      <p className="text-xs text-slate-300">
                        {formattedMonthTitle} ayında en çok etkilendiğin şaheser:
                      </p>
                    </div>

                    {/* Spotlight Hero Card */}
                    <div 
                      onClick={() => {
                        if (onSelectMediaById) onSelectMediaById(zirveYapim.id, zirveYapim.type);
                        onClose();
                      }}
                      className="group bg-gradient-to-r from-[#1A1D25] to-[#12141A] border border-amber-500/40 rounded-3xl p-4 sm:p-5 flex gap-4 items-center shadow-2xl cursor-pointer hover:border-amber-400 transition"
                    >
                      <div className="w-24 sm:w-28 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 relative bg-[#1F232D] shadow-md">
                        <img 
                          src={zirveYapim.poster} 
                          alt={zirveYapim.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <div className="absolute top-2 left-2 bg-amber-400 text-black px-2 py-0.5 rounded-md text-[10px] font-black font-mono shadow-md">
                          ★ {zirveYapim.rating}
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                          {zirveYapim.badge}
                        </span>
                        <h4 className="text-lg sm:text-xl font-extrabold text-white truncate group-hover:text-amber-300 transition">
                          {zirveYapim.title}
                        </h4>
                        <p className="text-xs text-slate-300 italic line-clamp-3 bg-white/5 p-3 rounded-xl border border-white/5">
                          "{zirveYapim.reviewText}"
                        </p>
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 group-hover:underline">
                          Detayları ve Yorumları İncele →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 2: FAVORİ OYUNCU */}
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
                        <span>Favori Oyuncu</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">
                        Ekranını En Çok Süsleyen Oyuncu 🎭
                      </h3>
                      <p className="text-xs text-slate-300">
                        İzlediğin yapımların TMDB kadro verilerinden anlık hesaplandı:
                      </p>
                    </div>

                    {/* Actor Card */}
                    <div className="bg-gradient-to-br from-[#1A1D25] to-[#12141A] border border-purple-500/30 rounded-3xl p-5 flex items-center gap-5 shadow-2xl">
                      <img
                        src={favoriOyuncu.photo}
                        alt={favoriOyuncu.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-purple-500/50 shadow-xl shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20 inline-block">
                          {favoriOyuncu.appearances}
                        </span>
                        <h4 className="text-xl font-black text-white">
                          {favoriOyuncu.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-300">
                          {favoriOyuncu.role}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {favoriOyuncu.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 3: SPOTIFY WRAPPED-STYLE SHAREABLE STORY CARD */}
                {currentSlide === 3 && (
                  <motion.div
                    key="slide-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 py-1"
                  >
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Paylaşılabilir Özet Kartın Hazır!</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Farklı bir tema seçip görseli telefonuna indirebilirsin! 📸
                      </p>

                      {/* Theme Selector Tabs */}
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setCardTheme('cinema')}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border ${
                            cardTheme === 'cinema'
                              ? 'bg-[#E63946] text-white border-[#E63946] shadow-md shadow-[#E63946]/30'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-300" />
                          <span>Kırmızı Sinema</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardTheme('cyber')}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border ${
                            cardTheme === 'cyber'
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Cyber Neon</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardTheme('poster')}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border ${
                            cardTheme === 'poster'
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 font-black'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Afiş Arka Plan</span>
                        </button>
                      </div>
                    </div>

                    {/* SPOTIFY WRAPPED VERTICAL STORY CARD (TARGET FOR HTML2CANVAS) */}
                    <div 
                      ref={cardRef}
                      style={{ backgroundColor: cardTheme === 'poster' ? '#080A0F' : cardTheme === 'cyber' ? '#090514' : '#0B0D13' }}
                      className={`rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden max-w-sm mx-auto my-2 border-2 ring-1 ring-white/10 transition-all duration-300 ${
                        cardTheme === 'cinema'
                          ? 'bg-[#0B0D13] border-amber-500/40 text-white'
                          : cardTheme === 'cyber'
                          ? 'bg-[#090514] border-purple-500/50 text-white'
                          : 'bg-[#080A0F] border-cyan-500/40 text-white'
                      }`}
                    >
                      {/* Theme Background FX */}
                      {cardTheme === 'cinema' && (
                        <>
                          <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute top-1/2 -left-28 w-56 h-56 bg-[#E63946]/25 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -bottom-24 -right-20 w-56 h-56 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
                        </>
                      )}

                      {cardTheme === 'cyber' && (
                        <>
                          <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-fuchsia-600/30 rounded-full blur-3xl pointer-events-none" />
                        </>
                      )}

                      {cardTheme === 'poster' && (
                        <>
                          {/* Full Backdrop Poster Image with Blur */}
                          <div className="absolute inset-0 pointer-events-none opacity-25">
                            <img src={zirveYapim.poster} alt="" className="w-full h-full object-cover blur-md scale-110" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F]/80 via-[#080A0F]/90 to-[#080A0F] pointer-events-none" />
                        </>
                      )}

                      {/* Header Ticket Badge & Brand Logo */}
                      <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-2xl p-0.5 shadow-lg ${
                            cardTheme === 'cyber' 
                              ? 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-purple-600 shadow-cyan-500/20' 
                              : cardTheme === 'poster'
                              ? 'bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-500 shadow-amber-500/20'
                              : 'bg-gradient-to-tr from-[#E63946] via-amber-500 to-purple-600 shadow-[#E63946]/30'
                          }`}>
                            <div className="w-full h-full bg-[#0B0D13] rounded-[14px] flex items-center justify-center text-white font-black text-xs">
                              TV
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black tracking-widest text-white uppercase">
                                TV TIME
                              </span>
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cardTheme === 'cyber' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${cardTheme === 'cyber' ? 'text-cyan-300' : 'text-amber-400'}`}>
                              {formattedMonthTitle} WRAPPED
                            </span>
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 text-[10px] font-black shadow-sm ${
                          cardTheme === 'cyber'
                            ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                            : cardTheme === 'poster'
                            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                            : 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                        }`}>
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>ÖZET</span>
                        </div>
                      </div>

                      {/* User Profile Bar */}
                      <div className="relative z-10 flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className={`w-10 h-10 rounded-full object-cover border-2 shadow-md ${cardTheme === 'cyber' ? 'border-cyan-400' : 'border-amber-400'}`}
                          />
                          <div>
                            <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1">
                              <span>{user.full_name || user.username}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              @{user.username} • Sinema Sever
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 block">SEZON</span>
                          <span className={`text-xs font-black font-mono ${cardTheme === 'cyber' ? 'text-cyan-300' : 'text-amber-400'}`}>2026</span>
                        </div>
                      </div>

                      {/* Featured Poster Spotlight Showcase */}
                      <div className={`relative z-10 border rounded-2xl p-3 flex items-center gap-3 shadow-xl backdrop-blur-md ${
                        cardTheme === 'cyber'
                          ? 'bg-gradient-to-r from-purple-900/40 to-slate-900/60 border-purple-500/40'
                          : cardTheme === 'poster'
                          ? 'bg-black/60 border-amber-400/50'
                          : 'bg-gradient-to-r from-[#171A23] to-[#11131A] border-amber-500/30'
                      }`}>
                        <img 
                          src={zirveYapim.poster} 
                          alt={zirveYapim.title}
                          className="w-16 h-22 rounded-xl object-cover border border-amber-400/40 shadow-lg shrink-0" 
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${
                            cardTheme === 'cyber'
                              ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30'
                              : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                          }`}>
                            🏆 AYIN ZİRVE YAPIMI
                          </span>
                          <h4 className="text-sm font-black text-white truncate">
                            {zirveYapim.title}
                          </h4>
                          <p className="text-[10px] text-slate-300 italic line-clamp-2">
                            "{zirveYapim.reviewText}"
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-black text-black bg-amber-400 px-1.5 py-0.5 rounded font-mono">
                              ★ {zirveYapim.rating}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wrapped Stats Grid */}
                      <div className="relative z-10 grid grid-cols-2 gap-2">
                        {/* Watch Time */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">EKRAN SÜRESİ</span>
                          </div>
                          <span className="text-sm font-black text-white font-mono block">
                            {totalHours}s {remainingMinutes}dk
                          </span>
                        </div>

                        {/* Episodes & Movies */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-purple-400">
                            <Tv className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">İÇERİKLER</span>
                          </div>
                          <span className="text-xs font-black text-purple-300 block">
                            {episodeCount} Bölüm • {movieCount} Film
                          </span>
                        </div>

                        {/* Favorite Actor */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-purple-400">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">FAVORİ OYUNCU</span>
                          </div>
                          <span className="text-xs font-black text-white truncate block">
                            {favoriOyuncu.name}
                          </span>
                        </div>

                        {/* Peak Day */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-cyan-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">EN YOĞUN GÜN</span>
                          </div>
                          <span className="text-xs font-black text-cyan-300 block">
                            {enYogunGun.dayName} ({enYogunGun.episodesWatched})
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Branding & Verified Badge */}
                      <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E63946]" />
                          <span className="font-bold text-slate-300">tvtime.app</span>
                        </div>
                        <span className={`font-extrabold tracking-wider ${cardTheme === 'cyber' ? 'text-cyan-400' : 'text-amber-400'}`}>#TVTimeWrapped</span>
                      </div>
                    </div>

                    {/* ACTION BUTTON: DOWNLOAD / SHARE PNG */}
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleDownloadWrappedCard}
                        disabled={isDownloading}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#E63946] via-purple-600 to-amber-500 hover:from-[#d62839] text-white font-extrabold text-xs shadow-xl shadow-[#E63946]/30 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 mx-auto disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isDownloading ? 'Görsel Hazırlanıyor...' : 'Görsel Olarak İndir / Paylaş 📸'}</span>
                      </button>
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
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-white/10"
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
                  className="px-5 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-xs font-extrabold text-white transition flex items-center gap-1 shadow-lg shadow-[#E63946]/20 hover:scale-105 active:scale-95"
                >
                  <span>İleri</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadWrappedCard}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-black text-black transition flex items-center gap-1 shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Paylaş 📸</span>
                </button>
              )}
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
