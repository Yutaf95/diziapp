import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Flame } from 'lucide-react';
import { TMDBMedia, WatchStatusType, WatchStatus, MediaType } from '../types';
import { getTrending } from '../lib/tmdb';
import { MediaCard } from './MediaCard';

interface RecommendationsSectionProps {
  watchList: WatchStatus[];
  onSelectMedia: (media: TMDBMedia) => void;
  onUpdateWatchStatus: (media: TMDBMedia, status: WatchStatusType) => void;
  getUserWatchStatus: (id: number, type: MediaType) => WatchStatusType | undefined | null;
}

// Fallback pool of high quality popular and recommended media
const POPULAR_POOL: TMDBMedia[] = [
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
    popularity: 240.0,
    genres: [{ id: 18, name: 'Drama' }]
  },
  {
    id: 155,
    name: 'The Dark Knight',
    title: 'The Dark Knight',
    overview: 'Gotham şehrinde Joker ile Batman arasındaki epik adalet mücadelesi.',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '2008-07-16',
    vote_average: 8.5,
    vote_count: 31000,
    popularity: 190.0,
    genres: [{ id: 28, name: 'Aksiyon' }]
  },
  {
    id: 27205,
    name: 'Inception',
    title: 'Inception',
    overview: 'Rüyalar içinde rüya görerek bilinçaltından fikir çalma operasyonu.',
    poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    first_air_date: '2010-07-15',
    vote_average: 8.4,
    vote_count: 35000,
    popularity: 175.0,
    genres: [{ id: 878, name: 'Bilim Kurgu' }]
  }
];

const BASED_ON_WATCHED_POOL: TMDBMedia[] = [
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
    overview: 'Paul Atreides\'in Chani ve Fremenlerle birleşerek başlattığı intikam savaşı.',
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
    poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2024-02-27',
    vote_average: 8.8,
    vote_count: 1600,
    popularity: 210.0,
    genres: [{ id: 18, name: 'Drama' }]
  }
];

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  watchList,
  onSelectMedia,
  onUpdateWatchStatus,
  getUserWatchStatus
}) => {
  const [popularList, setPopularList] = useState<TMDBMedia[]>([]);
  const [basedOnWatchedList, setBasedOnWatchedList] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRealTMDBRecommendations() {
      setLoading(true);
      try {
        const trend = await getTrending('all');
        if (trend?.results && trend.results.length > 0 && isMounted) {
          setPopularList(trend.results);
        }
      } catch (e) {}

      try {
        const trendTv = await getTrending('tv');
        if (trendTv?.results && trendTv.results.length > 0 && isMounted) {
          setBasedOnWatchedList(trendTv.results);
        }
      } catch (e) {}

      if (isMounted) {
        setLoading(false);
      }
    }

    loadRealTMDBRecommendations();
    return () => { isMounted = false; };
  }, []);

  // Filter 1: 3 random Popular items not in user's library (shuffled each render)
  const popularFiltered = useMemo(() =>
    [...popularList]
      .sort(() => 0.5 - Math.random())
      .filter(item => {
        const isTv = item.media_type === 'tv' || !!item.first_air_date;
        const mediaType: MediaType = isTv ? 'tv' : 'movie';
        return !getUserWatchStatus(item.id, mediaType);
      })
      .slice(0, 3),
  [popularList, watchList.length]);

  // Filter 2: 3 random Based On Watched items not in user's library (shuffled each render)
  const basedOnWatchedFiltered = useMemo(() =>
    [...basedOnWatchedList]
      .sort(() => 0.5 - Math.random())
      .filter(item => {
        const isTv = item.media_type === 'tv' || !!item.first_air_date;
        const mediaType: MediaType = isTv ? 'tv' : 'movie';
        if (getUserWatchStatus(item.id, mediaType)) return false;
        if (popularFiltered.some(p => p.id === item.id)) return false;
        return true;
      })
      .slice(0, 3),
  [basedOnWatchedList, watchList.length, popularFiltered]);

  if (loading) {
    return (
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3.5 space-y-3.5 shadow-lg">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#232833]">
          <div className="w-7 h-7 rounded-lg bg-[#0B0C0E] animate-pulse" />
          <div className="space-y-1">
            <div className="w-40 h-4 bg-[#0B0C0E] rounded animate-pulse" />
            <div className="w-56 h-3 bg-[#0B0C0E] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="grid grid-cols-3 gap-2 bg-[#0B0C0E]/70 border border-[#232833] rounded-xl p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-[#0B0C0E] rounded-xl animate-pulse border border-[#232833]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 bg-[#0B0C0E]/70 border border-[#232833] rounded-xl p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-[#0B0C0E] rounded-xl animate-pulse border border-[#232833]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (popularFiltered.length === 0 && basedOnWatchedFiltered.length === 0) return null;

  return (
    <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3.5 space-y-3.5 shadow-lg">
      
      {/* Header: Bunları da Beğenebilirsin */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#232833]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>Bunları da Beğenebilirsin</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Sizin için özel seçilmiş popüler ve benzeri yapım önerileri
            </p>
          </div>
        </div>
      </div>

      {/* Grid containing 2 recommendation categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* Category 1: Popüler Yapımlar */}
        {popularFiltered.length > 0 && (
          <div className="space-y-2 bg-[#0B0C0E]/70 border border-[#232833] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-white uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-[#E63946]" />
                <span>Popüler Yapımlar</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {popularFiltered.map(item => {
                const isTv = item.media_type === 'tv' || !!item.first_air_date;
                const mediaType: MediaType = isTv ? 'tv' : 'movie';
                return (
                  <MediaCard
                    key={`rec-pop-${item.id}`}
                    media={item}
                    userWatchStatus={null}
                    showQuickActions={true}
                    onSelect={onSelectMedia}
                    onUpdateStatus={onUpdateWatchStatus}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Category 2: İzlediklerinize Göre */}
        {basedOnWatchedFiltered.length > 0 && (
          <div className="space-y-2 bg-[#0B0C0E]/70 border border-[#232833] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-white uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>İzlediklerinize Göre</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {basedOnWatchedFiltered.map(item => {
                const isTv = item.media_type === 'tv' || !!item.first_air_date;
                const mediaType: MediaType = isTv ? 'tv' : 'movie';
                return (
                  <MediaCard
                    key={`rec-watched-${item.id}`}
                    media={item}
                    userWatchStatus={null}
                    showQuickActions={true}
                    onSelect={onSelectMedia}
                    onUpdateStatus={onUpdateWatchStatus}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
