import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { TMDBMedia, WatchStatusType, WatchStatus, MediaType } from '../types';
import { search, getTrending } from '../lib/tmdb';
import { RecommendationsSection } from './RecommendationsSection';
import { MediaCard } from './MediaCard';

interface MobileSearchViewProps {
  watchList: WatchStatus[];
  onSelectMedia: (media: TMDBMedia) => void;
  onUpdateWatchStatus: (media: TMDBMedia, status: WatchStatusType | null) => void;
  getUserWatchStatus: (id: number, type: MediaType) => WatchStatusType | undefined | null;
}

export const MobileSearchView: React.FC<MobileSearchViewProps> = ({
  watchList,
  onSelectMedia,
  onUpdateWatchStatus,
  getUserWatchStatus,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [discoverMedia, setDiscoverMedia] = useState<TMDBMedia[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState<boolean>(true);

  // Load real trending media for mobile recommendations pool
  useEffect(() => {
    let isMounted = true;
    async function fetchDiscoverItems() {
      setLoadingDiscover(true);
      try {
        const [allData, tvData, movieData] = await Promise.all([
          getTrending('all', 'week'),
          getTrending('tv', 'week'),
          getTrending('movie', 'week'),
        ]);
        if (isMounted) {
          const combined = [
            ...(allData.results || []),
            ...(tvData.results || []),
            ...(movieData.results || []),
          ];
          const seen = new Set<number>();
          const deduped = combined.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setDiscoverMedia(deduped);
        }
      } catch (err) {
        console.warn('Failed to load discover media:', err);
      } finally {
        if (isMounted) setLoadingDiscover(false);
      }
    }
    fetchDiscoverItems();
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

  // Pick 12 random recommendations not in user watchlist
  const randomDiscoverRecommendations = useMemo(() => {
    const pool = discoverMedia.filter(item => {
      const isTv = item.media_type === 'tv' || !!item.first_air_date;
      const type: MediaType = isTv ? 'tv' : 'movie';
      const status = getUserWatchStatus(item.id, type);
      return !status;
    });
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, 12);
  }, [discoverMedia, watchList.length]);

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. EN ÜSTTE DİZİ/FİLM ARAMA ÇUBUĞU */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3.5 shadow-xl sticky top-16 z-30 backdrop-blur-md">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E63946]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dizi veya film ara, kütüphanene ekle..."
            className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-xl pl-11 pr-9 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition shadow-inner"
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

      {/* 2. ARAMA YAPILIYORSA: ARAMA SONUÇLARI */}
      {query.trim().length > 0 ? (
        <div className="space-y-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {searchResults.map((item) => {
                const isTv = item.media_type === 'tv' || !!item.first_air_date;
                const type: MediaType = isTv ? 'tv' : 'movie';
                const status = getUserWatchStatus(item.id, type) || undefined;

                return (
                  <MediaCard
                    key={`${item.id}-${type}`}
                    media={{ ...item, media_type: type }}
                    userWatchStatus={status}
                    showQuickActions={true}
                    onSelect={(m) => onSelectMedia(m)}
                    onUpdateStatus={(m, st) => onUpdateWatchStatus(m, st)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 3. ARAMA KUTUSU BOŞ İKEN: MASAÜSTÜ KEŞFET YAPISI */
        <div className="space-y-6">
          
          {/* Bunları da Beğenebilirsin Öneri Bloğu */}
          <RecommendationsSection
            watchList={watchList}
            onSelectMedia={onSelectMedia}
            onUpdateWatchStatus={onUpdateWatchStatus}
            getUserWatchStatus={getUserWatchStatus}
          />

          {/* Dizi & Film Önerileri Grid Vitrini */}
          <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E63946]" />
                <h2 className="text-base font-bold text-white">
                  Dizi & Film Önerileri
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-medium bg-[#0B0C0E] px-2 py-1 rounded-lg border border-[#232833]">
                Keşfet
              </span>
            </div>

            {loadingDiscover ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-[#0B0C0E] aspect-[2/3] rounded-2xl animate-pulse border border-[#232833]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {randomDiscoverRecommendations.map((item) => {
                  const isTv = item.media_type === 'tv' || !!item.first_air_date;
                  const type: MediaType = isTv ? 'tv' : 'movie';
                  const status = getUserWatchStatus(item.id, type) || undefined;

                  return (
                    <MediaCard
                      key={`${item.id}-${type}`}
                      media={{ ...item, media_type: type }}
                      userWatchStatus={status}
                      showQuickActions={true}
                      onSelect={(m) => onSelectMedia(m)}
                      onUpdateStatus={(m, st) => onUpdateWatchStatus(m, st)}
                    />
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
