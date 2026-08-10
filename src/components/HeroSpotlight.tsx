import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Star, Sparkles, Flame, Info } from 'lucide-react';
import { TMDBMedia, WatchStatusType, MediaType } from '../types';

export interface SpotlightShowItem extends TMDBMedia {
  spotlightCategory: 'recommendation' | 'trending';
  categoryLabel: string;
  reasonBadge: string;
  seasonsCount: string;
}

export const SPOTLIGHT_SHOWS: SpotlightShowItem[] = [
  // --- Group 1: İzlediklerine Göre Sevebileceklerin (3 adet dizi) ---
  {
    id: 110492,
    name: 'Severance',
    title: 'Severance',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Severance & Black Mirror Sevenlere',
    seasonsCount: '2 Sezon • 19 Bölüm',
    overview: 'Lumon Industries\'de çalışan Mark, anılarının iş ve özel hayatı arasında cerrahi olarak ayrıldığı gizemli bir ameliyat geçirmiştir. Ancak mesai arkadaşının ansızın kaybolmasıyla iş yerindeki ürkütücü gerçekler aralanır.',
    backdrop_path: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2022-02-18',
    vote_average: 8.7,
    vote_count: 1850,
    popularity: 210,
    genres: [
      { id: 878, name: 'Bilim Kurgu' },
      { id: 9648, name: 'Gizem' },
      { id: 53, name: 'Gerilim' }
    ]
  },
  {
    id: 94605,
    name: 'Arcane',
    title: 'Arcane',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Blue Eye Samurai & Animasyon Severlere',
    seasonsCount: '2 Sezon • 18 Bölüm',
    overview: 'Ütopik zengin Piltover şehri ile yeraltı şehri Zaun arasındaki derin uçurumda geçen iki ikonik şampiyon kardeş Vi ve Jinx\'in trajik ayrılığı ve teknoloji-büyü savaşı.',
    backdrop_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2021-11-06',
    vote_average: 9.0,
    vote_count: 3820,
    popularity: 290,
    genres: [
      { id: 16, name: 'Animasyon' },
      { id: 10759, name: 'Aksiyon & Macera' },
      { id: 18, name: 'Dram' }
    ]
  },
  {
    id: 100088,
    name: 'The Last of Us',
    title: 'The Last of Us',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Kıyamet Sonrası Dram & Macera',
    seasonsCount: '2 Sezon • 16 Bölüm',
    overview: 'Salgının çökerttiği kıyamet sonrası dünyada, sertleşmiş bir hayatta kalan olan Joel, insanlığın tek mantarlı bağışıklık umudu olabilecek 14 yaşındaki Ellie\'yi karantina bölgesinden kaçırır.',
    backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2023-01-15',
    vote_average: 8.8,
    vote_count: 4200,
    popularity: 350,
    genres: [
      { id: 18, name: 'Dram' },
      { id: 10759, name: 'Aksiyon & Macera' },
      { id: 878, name: 'Bilim Kurgu' }
    ]
  },

  // --- Group 2: Gündemde Popüler Olan Diziler (3 adet dizi) ---
  {
    id: 94997,
    name: 'House of the Dragon',
    title: 'House of the Dragon',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Diziler',
    reasonBadge: '🔥 #1 Trend • Targaryen Hanesi',
    seasonsCount: '2 Sezon • 18 Bölüm',
    overview: 'Game of Thrones olaylarından 200 yıl önce geçen dizi, Targaryen Hanesi\'nin taht kavgalarını ve Westeros\'u kasıp kavuran kanlı iç savaş Ejderhaların Dansı\'nı anlatıyor.',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2022-08-21',
    vote_average: 8.4,
    vote_count: 3900,
    popularity: 420,
    genres: [
      { id: 10765, name: 'Sci-Fi & Fantasy' },
      { id: 18, name: 'Dram' },
      { id: 10759, name: 'Aksiyon' }
    ]
  },
  {
    id: 114472,
    name: 'The Bear',
    title: 'The Bear',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Diziler',
    reasonBadge: '🔥 Popüler Kaos • Altın Küre Ödüllü',
    seasonsCount: '3 Sezon • 28 Bölüm',
    overview: 'İnce zevklerin genç şefi Carmy Berzatto, ailesindeki trajik bir kaybın ardından Chicago\'daki mütevazı aile dükkanını ve asi mutfak ekibini dönüştürmek için geri döner.',
    backdrop_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2022-06-23',
    vote_average: 8.5,
    vote_count: 2100,
    popularity: 310,
    genres: [
      { id: 18, name: 'Dram' },
      { id: 35, name: 'Komedi' }
    ]
  },
  {
    id: 126308,
    name: 'Shōgun',
    title: 'Shōgun',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Diziler',
    reasonBadge: '🔥 Rekor Kıran • 18 Emmy Adayı',
    seasonsCount: '1 Sezon • 10 Bölüm',
    overview: '1600\'lerin Feodal Japonya\'sında iç savaşın eşiğindeki Lord Yoshii Toranaga, karaya oturan gizemli bir İngiliz denizcisinde siyasi rakiplerini yok edecek ölümcül kozu bulur.',
    backdrop_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    media_type: 'tv',
    first_air_date: '2024-02-27',
    vote_average: 8.8,
    vote_count: 1640,
    popularity: 380,
    genres: [
      { id: 18, name: 'Dram' },
      { id: 36, name: 'Tarih' },
      { id: 10759, name: 'Aksiyon & Macera' }
    ]
  }
];

export const SPOTLIGHT_MOVIES: SpotlightShowItem[] = [
  // --- Group 1: İzlediklerine Göre Sevebileceklerin (3 adet film) ---
  {
    id: 693134,
    name: 'Dune: Part Two',
    title: 'Dune: Çöl Gezegeni Bölüm İki',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Sci-Fi & Sinematik Şaheser',
    seasonsCount: '2s 46dk • 2024',
    overview: 'Paul Atreides, Chani ve Fremenlerle birleşerek ailesini yok eden komplo kurucularına karşı intikam savaşı başlatır. Hayatının aşkı ile bilinen evrenin kaderi arasında seçim yapmak zorundadır.',
    backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2024-02-27',
    vote_average: 8.5,
    vote_count: 4850,
    popularity: 410,
    genres: [
      { id: 878, name: 'Bilim Kurgu' },
      { id: 12, name: 'Macera' }
    ]
  },
  {
    id: 872585,
    name: 'Oppenheimer',
    title: 'Oppenheimer',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Christopher Nolan Sineması',
    seasonsCount: '3s 00dk • 2023',
    overview: 'Fizikçi J. Robert Oppenheimer\'ın Manhattan Projesi kapsamında ilk atom bombasını geliştirmesi ve dünyayı sonsuza dek değiştiren bilimsel ve ahlaki çatışması.',
    backdrop_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2023-07-19',
    vote_average: 8.9,
    vote_count: 6200,
    popularity: 390,
    genres: [
      { id: 18, name: 'Dram' },
      { id: 36, name: 'Tarih' }
    ]
  },
  {
    id: 157336,
    name: 'Interstellar',
    title: 'Yıldızlararası (Interstellar)',
    spotlightCategory: 'recommendation',
    categoryLabel: 'İzlediklerine Göre Sevebileceklerin',
    reasonBadge: '✨ Uzay & Zamanda Yolculuk',
    seasonsCount: '2s 49dk • 2014',
    overview: 'İnsanlığın sonunun yaklaştığı bir gelecekte, bir grup kaşif insan türünün devamını sağlayacak yeni bir yaşanabilir gezegen bulmak için bir solucan deliğinden geçer.',
    backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2014-11-05',
    vote_average: 8.7,
    vote_count: 11200,
    popularity: 310,
    genres: [
      { id: 878, name: 'Bilim Kurgu' },
      { id: 18, name: 'Dram' }
    ]
  },

  // --- Group 2: Gündemde Popüler Olan Filmler (3 adet film) ---
  {
    id: 558449,
    name: 'Gladiator II',
    title: 'Gladyatör II',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Filmler',
    reasonBadge: '🔥 #1 Vizyonda Popüler',
    seasonsCount: '2s 28dk • 2024',
    overview: 'Lucilla\'nın oğlu Lucius, evinin zalim imparatorlar tarafından fethedilmesinin ardından Roma\'nın gücünü ve ihtişamını halkına geri kazandırmak için Kolezyum\'a girer.',
    backdrop_path: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2024-11-13',
    vote_average: 7.8,
    vote_count: 1950,
    popularity: 450,
    genres: [
      { id: 28, name: 'Aksiyon' },
      { id: 12, name: 'Macera' }
    ]
  },
  {
    id: 569094,
    name: 'Spider-Man: Across the Spider-Verse',
    title: 'Örümcek-Adam: Örümcek Evrenine Geçiş',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Filmler',
    reasonBadge: '🔥 Görsel Şölen & Animasyon',
    seasonsCount: '2s 20dk • 2023',
    overview: 'Miles Morales, Çoklu Evren boyunca fırlatılır ve burada varlığını korumakla görevli Örümcek-Varlıklardan oluşan bir ekiple karşılaşır.',
    backdrop_path: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2023-05-31',
    vote_average: 8.4,
    vote_count: 5800,
    popularity: 380,
    genres: [
      { id: 16, name: 'Animasyon' },
      { id: 28, name: 'Aksiyon' }
    ]
  },
  {
    id: 414906,
    name: 'The Batman',
    title: 'The Batman',
    spotlightCategory: 'trending',
    categoryLabel: 'Gündemde Popüler Olan Filmler',
    reasonBadge: '🔥 Karanlık Polisiye & Dedektiflik',
    seasonsCount: '2s 56dk • 2022',
    overview: 'Riddler adındaki sadist bir seri katil Gotham\'ın kilit siyasi figürlerini hedef almaya başladığında, Batman şehrin gizli yolsuzluklarını araştırmak ve adil bir ceza kesmek zorundadır.',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    media_type: 'movie',
    release_date: '2022-03-01',
    vote_average: 7.7,
    vote_count: 8900,
    popularity: 320,
    genres: [
      { id: 80, name: 'Suç' },
      { id: 9648, name: 'Gizem' }
    ]
  }
];

interface HeroSpotlightProps {
  mediaType?: MediaType | 'all';
  onSelectMedia?: (media: TMDBMedia) => void;
  onUpdateStatus?: (media: TMDBMedia, status: WatchStatusType) => void;
  getUserWatchStatus?: (mediaId: number, mediaType: MediaType) => WatchStatusType | undefined;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  mediaType = 'all',
  onSelectMedia,
  onUpdateStatus,
  getUserWatchStatus
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Pick list based on mediaType filter
  const rawList = mediaType === 'movie' ? SPOTLIGHT_MOVIES : SPOTLIGHT_SHOWS;

  // Filter out items that are already in user's watchlist (watching, plan_to_watch, or watched)
  const itemsList = rawList.filter(show => {
    if (!getUserWatchStatus) return true;
    const isMovie = show.media_type === 'movie';
    const status = getUserWatchStatus(show.id, isMovie ? 'movie' : 'tv');
    return !status; // Only keep items that are NOT in user's watchlist
  });

  // Reset index when filter or list length changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [mediaType, itemsList.length]);

  if (itemsList.length === 0) {
    return (
      <div className="rounded-2xl bg-[#14171D] border border-[#232833] p-6 text-center space-y-2 shadow-xl animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Harika! Tüm Öneriler Listenizde</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Önerilen tüm {mediaType === 'movie' ? 'filmleri' : mediaType === 'tv' ? 'dizileri' : 'yapımları'} izleme listenize eklediniz. Aşağıdaki kütüphanenizden tüm içerikleri takip edebilirsiniz.
        </p>
      </div>
    );
  }

  const currentShow = itemsList[currentIndex] || itemsList[0];
  const displayTitle = currentShow.title || currentShow.name;
  const isMovie = currentShow.media_type === 'movie';

  const recItems = itemsList.filter(item => item.spotlightCategory === 'recommendation');
  const trendingItems = itemsList.filter(item => item.spotlightCategory === 'trending');

  const firstRecIndex = itemsList.findIndex(item => item.spotlightCategory === 'recommendation');
  const firstTrendingIndex = itemsList.findIndex(item => item.spotlightCategory === 'trending');

  // Auto rotation timer
  useEffect(() => {
    if (isPaused || itemsList.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % itemsList.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, itemsList.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + itemsList.length) % itemsList.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % itemsList.length);
  };

  const userStatus = getUserWatchStatus
    ? getUserWatchStatus(currentShow.id, isMovie ? 'movie' : 'tv')
    : undefined;

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-2xl overflow-hidden bg-[#14171D] border border-[#232833] shadow-xl group transition-all"
    >
      
      {/* Category Tabs & Slider Controls Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-4 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        
        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {recItems.length > 0 && (
            <button
              onClick={() => setCurrentIndex(firstRecIndex !== -1 ? firstRecIndex : 0)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-md ${
                currentShow.spotlightCategory === 'recommendation'
                  ? 'bg-[#E63946] text-white ring-2 ring-[#E63946]/50'
                  : 'bg-[#0B0C0E]/70 hover:bg-[#232833] text-slate-300 border border-[#2B313E]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>İzlediklerine Göre ({recItems.length})</span>
            </button>
          )}

          {trendingItems.length > 0 && (
            <button
              onClick={() => setCurrentIndex(firstTrendingIndex !== -1 ? firstTrendingIndex : 0)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-md ${
                currentShow.spotlightCategory === 'trending'
                  ? 'bg-[#E63946] text-white ring-2 ring-[#E63946]/50'
                  : 'bg-[#0B0C0E]/70 hover:bg-[#232833] text-slate-300 border border-[#2B313E]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Gündemde Popüler ({trendingItems.length})</span>
            </button>
          )}
        </div>

        {/* Prev / Next Navigation Arrows */}
        <div className="flex items-center gap-1.5 shrink-0 bg-[#0B0C0E]/80 backdrop-blur-md p-1 rounded-full border border-[#2B313E]">
          <button
            onClick={handlePrev}
            title={isMovie ? "Önceki Film" : "Önceki Dizi"}
            className="p-1 rounded-full hover:bg-[#232833] text-slate-300 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-extrabold text-slate-300 px-1.5 min-w-[32px] text-center">
            {currentIndex + 1} / {itemsList.length}
          </span>

          <button
            onClick={handleNext}
            title={isMovie ? "Sonraki Film" : "Sonraki Dizi"}
            className="p-1 rounded-full hover:bg-[#232833] text-slate-300 hover:text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Backdrop Image Container */}
      <div className="relative h-[220px] sm:h-[250px] lg:h-[270px] w-full overflow-hidden">
        <img
          key={currentShow.id}
          src={currentShow.backdrop_path}
          alt={displayTitle}
          className="w-full h-full object-cover object-center transition-all duration-700 brightness-90 animate-in fade-in duration-500"
        />

        {/* Multi-stage Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14171D] via-[#14171D]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14171D] via-[#14171D]/85 to-transparent w-full sm:w-2/3" />
      </div>

      {/* Content Container */}
      <div className="relative -mt-36 sm:-mt-32 p-4 sm:p-5 z-20 flex items-center gap-4">
        
        {/* Left: Poster Box */}
        <div className="w-20 sm:w-28 shrink-0 rounded-xl overflow-hidden border-2 border-[#E63946]/40 shadow-xl bg-[#0B0C0E] hidden xs:block group-hover:scale-105 transition-transform duration-300">
          <img
            src={currentShow.poster_path}
            alt={displayTitle}
            className="w-full aspect-[2/3] object-cover"
          />
        </div>

        {/* Right: Info & Metadata */}
        <div className="flex-1 min-w-0 space-y-2">
          
          {/* Reason Badge & Category Tag */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
            <span className="bg-[#E63946] text-white px-2.5 py-0.5 rounded-md font-extrabold shadow-md flex items-center gap-1">
              {currentShow.reasonBadge}
            </span>

            <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {currentShow.vote_average.toFixed(1)} / 10
            </span>

            <span className="text-slate-300 bg-[#0B0C0E]/80 px-2 py-0.5 rounded border border-[#232833]">
              {currentShow.seasonsCount}
            </span>

            {currentShow.genres?.slice(0, 2).map(g => (
              <span key={g.id} className="text-slate-400 bg-[#0B0C0E]/50 px-2 py-0.5 rounded border border-[#232833] hidden sm:inline-block">
                {g.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
            {displayTitle}
          </h1>

          {/* Overview */}
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed max-w-xl drop-shadow">
            {currentShow.overview}
          </p>

          {/* Action Buttons */}
          <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              {onUpdateStatus && (
                <button
                  onClick={() => onUpdateStatus(currentShow, userStatus === 'watching' ? 'watched' : 'watching')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition shadow-md ${
                    userStatus === 'watching'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-[#E63946] border-[#E63946] text-white hover:bg-[#d62839]'
                  }`}
                >
                  {userStatus === 'watching' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Listede ({isMovie ? 'İzledim/İzliyorum' : 'İzliyorum'})</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>İzleme Listeme Ekle</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => onSelectMedia && onSelectMedia(currentShow)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B0C0E]/90 hover:bg-[#232833] border border-[#2B313E] text-slate-200 hover:text-white text-xs font-extrabold transition shadow"
              >
                <Info className="w-3.5 h-3.5 text-[#E63946]" />
                <span>Detayları İncele</span>
              </button>
            </div>

            {/* Slide Pagination Dots */}
            <div className="flex items-center gap-1.5 pr-1">
              {itemsList.map((show, idx) => (
                <button
                  key={show.id}
                  onClick={() => setCurrentIndex(idx)}
                  title={show.title}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-[#E63946]'
                      : 'w-2 bg-[#2B313E] hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
