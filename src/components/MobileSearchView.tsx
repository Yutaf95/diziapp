import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Flame, Plus, Check, Eye, Clock, CheckCircle2, Film, Tv, Star, Loader2, X } from 'lucide-react';
import { TMDBMedia, WatchStatusType, WatchStatus, MediaType } from '../types';
import { search, getTrending, getPosterUrl } from '../lib/tmdb';

interface MobileSearchViewProps {
  watchList: WatchStatus[];
  onSelectMedia: (media: TMDBMedia) => void;
  onUpdateWatchStatus: (media: TMDBMedia, status: WatchStatusType) => void;
  getUserWatchStatus: (id: number, type: MediaType) => WatchStatusType | null;
}

// Fallback recommendations if offline (expanded candidate pool)
const RECOMMENDED_BASED_ON_WATCHED: TMDBMedia[] = [
  {
    id: 110492,
    name: 'Severance',
    title: 'Severance',
    overview: 'Lumon sanayi gizem dolu iç ve dış benlik ayrımı felsefi bilimkurgusu.',
    poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-02-18',
    vote_average: 8.7,
    vote_count: 1420,
    popularity: 98.4,
    genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Gizem' }]
  },
  {
    id: 157336,
    name: 'Interstellar',
    title: 'Interstellar',
    overview: 'İnsanlığın geleceği için solucan deliğinden geçen cesur astronotların epik uzay yolculuğu.',
    poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '2014-11-05',
    vote_average: 8.6,
    vote_count: 32000,
    popularity: 180.2,
    genres: [{ id: 878, name: 'Bilim Kurgu' }, { id: 18, name: 'Drama' }]
  },
  {
    id: 114472,
    name: 'The Bear',
    title: 'The Bear',
    overview: 'Chicago lezzet dünyasında yüksek tempolu, ödüllü mutfak draması.',
    poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-06-23',
    vote_average: 8.6,
    vote_count: 2100,
    popularity: 110.5,
    genres: [{ id: 18, name: 'Drama' }, { id: 35, name: 'Komedi' }]
  },
  {
    id: 94605,
    name: 'Arcane',
    title: 'Arcane',
    overview: 'Piltover ve Zaun arasındaki çatışmada iki kız kardeşin trajik hikayesi.',
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2021-11-06',
    vote_average: 9.0,
    vote_count: 3800,
    popularity: 200.0,
    genres: [{ id: 16, name: 'Animasyon' }]
  },
  {
    id: 693134,
    name: 'Dune: Part Two',
    title: 'Dune: Part Two',
    overview: 'Paul Atreides\'in Chani ve Fremenlerle birleşerek başlattığı efsanevi intikam savaşı.',
    poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '2024-02-27',
    vote_average: 8.5,
    vote_count: 4800,
    popularity: 220.0,
    genres: [{ id: 878, name: 'Bilim Kurgu' }]
  },
  {
    id: 126308,
    name: 'Shōgun',
    title: 'Shōgun',
    overview: 'Feodal Japonya\'da taht mücadeleleri ve sürükleyici bir tarih draması.',
    poster_path: 'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1528164344705-47542687990d?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2024-02-27',
    vote_average: 8.8,
    vote_count: 1600,
    popularity: 210.0,
    genres: [{ id: 18, name: 'Drama' }]
  }
];

const RECOMMENDED_TRENDING: TMDBMedia[] = [
  {
    id: 94997,
    name: 'House of the Dragon',
    title: 'House of the Dragon',
    overview: 'Targaryen hanedanlığının ejderhalar savaşı dönemi.',
    poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-08-21',
    vote_average: 8.4,
    vote_count: 4200,
    popularity: 145.2,
    genres: [{ id: 10765, name: 'Fantastik' }]
  },
  {
    id: 550,
    name: 'Fight Club',
    title: 'Fight Club',
    overview: 'Uykusuzluk çeken bir büro çalışanının sabun satıcısı Tyler Durden ile tanışmasıyla başlayan kült başyapıt.',
    poster_path: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '1999-10-15',
    vote_average: 8.4,
    vote_count: 27000,
    popularity: 130.0,
    genres: [{ id: 18, name: 'Drama' }]
  },
  {
    id: 1396,
    name: 'Breaking Bad',
    title: 'Breaking Bad',
    overview: 'Kimya öğretmeninin efsanevi dönüşüm hikayesi.',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2008-01-20',
    vote_average: 9.3,
    vote_count: 13500,
    popularity: 180.0,
    genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Suç' }]
  },
  {
    id: 872585,
    name: 'Oppenheimer',
    title: 'Oppenheimer',
    overview: 'Atom bombasının geliştirilme süreci ve bilimsel-ahlaki çatışmalar.',
    poster_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '2023-07-19',
    vote_average: 8.9,
    vote_count: 6200,
    popularity: 190.0,
    genres: [{ id: 18, name: 'Drama' }]
  },
  {
    id: 66732,
    name: 'Stranger Things',
    title: 'Stranger Things',
    overview: '80\'lerin kasabasında kaybolan bir çocuk ve gizemli güçlere sahip bir kızın maceraları.',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2016-07-15',
    vote_average: 8.6,
    vote_count: 16000,
    popularity: 200.0,
    genres: [{ id: 10765, name: 'Sci-Fi' }]
  }
];

export const MobileSearchView: React.FC<MobileSearchViewProps> = ({
  watchList,
  onSelectMedia,
  onUpdateWatchStatus,
  getUserWatchStatus,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [watchedRecommendations, setWatchedRecommendations] = useState<TMDBMedia[]>(RECOMMENDED_BASED_ON_WATCHED);
  const [trendingRecommendations, setTrendingRecommendations] = useState<TMDBMedia[]>(RECOMMENDED_TRENDING);

  // Fetch real trending recommendations from TMDB if available
  useEffect(() => {
    let isMounted = true;
    async function fetchPopular() {
      try {
        const trend = await getTrending('all', 'week');
        if (trend.results && trend.results.length >= 3 && isMounted) {
          // Select 3 mixed items
          setTrendingRecommendations(trend.results.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load trending items:', err);
      }
    }
    fetchPopular();
    return () => { isMounted = false; };
  }, []);

  // Handle live search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await search(query.trim(), 'all');
        setSearchResults(res.results || []);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Helper to filter out any media that is already in user's watching, plan_to_watch, or watched list
  const filteredWatchedRecommendations = watchedRecommendations.filter(item => {
    const isTv = item.media_type === 'tv' || !!item.first_air_date;
    const mediaType: MediaType = isTv ? 'tv' : 'movie';
    const status = getUserWatchStatus(item.id, mediaType);
    return !status; // Strictly exclude items already in user's library
  }).slice(0, 3);

  const filteredTrendingRecommendations = trendingRecommendations.filter(item => {
    const isTv = item.media_type === 'tv' || !!item.first_air_date;
    const mediaType: MediaType = isTv ? 'tv' : 'movie';
    const status = getUserWatchStatus(item.id, mediaType);
    return !status; // Strictly exclude items already in user's library
  }).slice(0, 3);

  return (
    <div className="space-y-5 pb-6">
      
      {/* 1. EN ÜSTTE DİZİ/FİLM ARAMA ÇUBUĞU */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3.5 shadow-xl relative sticky top-16 z-30 backdrop-blur-md">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E63946]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dizi veya film ara, kütüphanene ekle..."
            className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-xl pl-11 pr-9 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition shadow-inner"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[#E63946]" />
            <span>Aranıyor...</span>
          </div>
        )}
      </div>

      {/* 2. ARAMA SONUÇLARI LİSTESİ (Arama Yapılıyorsa) */}
      {query.trim().length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Arama Sonuçları ({searchResults.length})
          </h3>

          {searchResults.length === 0 && !isSearching ? (
            <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm text-slate-300 font-bold">Sonuç Bulunamadı</p>
              <p className="text-xs text-slate-400">
                "{query}" ile eşleşen bir dizi veya film bulunamadı. Lütfen kelimeyi kontrol edin.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {searchResults.map((item) => {
                const isTv = item.media_type === 'tv' || !!item.first_air_date;
                const mediaType: MediaType = isTv ? 'tv' : 'movie';
                const status = getUserWatchStatus(item.id, mediaType);
                const title = item.title || item.name || 'İsimsiz';
                const year = (item.first_air_date || item.release_date || '').substring(0, 4);

                return (
                  <div
                    key={`${item.id}-${mediaType}`}
                    className="bg-[#14171D] border border-[#232833] hover:border-[#E63946]/50 rounded-2xl p-3 flex items-center gap-3 transition shadow-md"
                  >
                    {/* Poster */}
                    <img
                      src={getPosterUrl(item.poster_path)}
                      alt={title}
                      onClick={() => onSelectMedia({ ...item, media_type: mediaType })}
                      className="w-14 h-20 rounded-xl object-cover border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition"
                    />

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          isTv 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {isTv ? 'Dizi' : 'Film'}
                        </span>
                        {year && <span className="text-[10px] text-slate-400 font-mono">{year}</span>}
                        {item.vote_average ? (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 ml-auto">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {item.vote_average.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <h4
                        onClick={() => onSelectMedia({ ...item, media_type: mediaType })}
                        className="text-sm font-bold text-white truncate cursor-pointer hover:text-[#E63946] transition"
                      >
                        {title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                        {item.overview || 'Açıklama bulunmuyor.'}
                      </p>
                    </div>

                    {/* Hızlı Ekleme Butonları */}
                    <div className="flex flex-col gap-1.5 shrink-0 pl-1">
                      {status !== 'watching' && status !== 'plan_to_watch' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateWatchStatus({ ...item, media_type: mediaType }, 'watching')}
                            className="p-2 rounded-xl text-xs transition border flex items-center justify-center bg-[#0B0C0E] text-slate-300 border-white/10 hover:text-white"
                            title="İzliyorum"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateWatchStatus({ ...item, media_type: mediaType }, 'plan_to_watch')}
                            className="p-2 rounded-xl text-xs transition border flex items-center justify-center bg-[#0B0C0E] text-slate-300 border-white/10 hover:text-white"
                            title="İzleyeceğim"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onUpdateWatchStatus({ ...item, media_type: mediaType }, 'watched')}
                        className={`p-2 rounded-xl text-xs transition border flex items-center justify-center ${
                          status === 'watched'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                            : 'bg-[#0B0C0E] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title="Tamamlandı"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900/80 text-slate-500 border border-[#232833] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-300 font-bold text-sm">Hemen Arama Yapın</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Bulmak istediğiniz film veya dizinin adını yukarıdaki arama kutusuna yazarak keşfetmeye başlayabilirsiniz.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
