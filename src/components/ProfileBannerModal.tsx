import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Check, Image as ImageIcon, Upload, RefreshCw, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { search, getTrending, getBackdropUrl } from '../lib/tmdb';

interface ProfileBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl?: string;
  currentFeaturedTitle?: string;
  onSaveBanner: (bannerUrl: string, featuredTitle: string) => void;
}

interface BannerOption {
  id: string | number;
  title: string;
  mediaType?: 'movie' | 'tv';
  backdropUrl: string;
  rating?: number;
}

// Default fallback backdrops if TMDB is offline or initial state (1 TV show, 1 Movie)
const INITIAL_BACKDROPS: BannerOption[] = [
  {
    id: 110492,
    title: 'Severance',
    mediaType: 'tv',
    backdropUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1600&q=80',
    rating: 9.8
  },
  {
    id: 693134,
    title: 'Dune: Part Two',
    mediaType: 'movie',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    rating: 9.7
  }
];

export const ProfileBannerModal: React.FC<ProfileBannerModalProps> = ({
  isOpen,
  onClose,
  currentBannerUrl = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1600&q=80',
  currentFeaturedTitle = 'Severance',
  onSaveBanner
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [selectedBannerUrl, setSelectedBannerUrl] = useState<string>(currentBannerUrl);
  const [selectedFeaturedTitle, setSelectedFeaturedTitle] = useState<string>(currentFeaturedTitle);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BannerOption[]>([]);
  const [trendingResults, setTrendingResults] = useState<BannerOption[]>(INITIAL_BACKDROPS);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Device Upload state
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected banner on open & load initial recommendations
  useEffect(() => {
    if (isOpen) {
      setSelectedBannerUrl(currentBannerUrl);
      setSelectedFeaturedTitle(currentFeaturedTitle);
      loadInitialTrending();
    }
  }, [isOpen, currentBannerUrl, currentFeaturedTitle]);

  const loadInitialTrending = async () => {
    try {
      const data = await getTrending('all', 'week');
      if (data && data.results && data.results.length > 0) {
        const tvItem = data.results.find(item => item.media_type === 'tv' && (item.backdrop_path || item.poster_path));
        const movieItem = data.results.find(item => item.media_type === 'movie' && (item.backdrop_path || item.poster_path));

        const items: BannerOption[] = [];
        if (tvItem) {
          items.push({
            id: tvItem.id,
            title: tvItem.title || tvItem.name || 'Dizi',
            mediaType: 'tv',
            backdropUrl: getBackdropUrl(tvItem.backdrop_path) || getBackdropUrl(tvItem.poster_path),
            rating: tvItem.vote_average
          });
        }
        if (movieItem) {
          items.push({
            id: movieItem.id,
            title: movieItem.title || movieItem.name || 'Film',
            mediaType: 'movie',
            backdropUrl: getBackdropUrl(movieItem.backdrop_path) || getBackdropUrl(movieItem.poster_path),
            rating: movieItem.vote_average
          });
        }
        if (items.length > 0) {
          setTrendingResults(items);
          return;
        }
      }
    } catch (e) {
      console.warn('Initial TMDB trending load error', e);
    }
    setTrendingResults(INITIAL_BACKDROPS);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
  };

  // Debounced reactive search on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await search(searchQuery, 'all');
        if (data && data.results) {
          const mapped: BannerOption[] = data.results
            .filter(item => item.backdrop_path || item.poster_path)
            .map(item => ({
              id: item.id,
              title: item.title || item.name || 'Sinema Eseri',
              mediaType: item.media_type as 'movie' | 'tv',
              backdropUrl: getBackdropUrl(item.backdrop_path) || getBackdropUrl(item.poster_path),
              rating: item.vote_average
            }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('TMDB Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setUploadPreviewUrl(result);
          setSelectedBannerUrl(result);
          setSelectedFeaturedTitle('Özel Yüklenen Görsel');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedBannerUrl) {
      onSaveBanner(selectedBannerUrl, selectedFeaturedTitle);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 pb-16 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl rounded-2xl bg-[#14161D] border border-white/10 shadow-2xl text-slate-100 overflow-visible flex flex-col my-auto max-h-[78vh] sm:max-h-[90vh] cursor-default"
        >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A1D26]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#E63946] to-purple-600 text-white shadow-md">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Profil Banner'ı Değiştir
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Film/dizi arayarak veya kendi cihazından görsel yükleyerek profil arka planını ayarla
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-5 pt-4 flex gap-2 border-b border-white/10 bg-[#14161D]">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === 'search'
                  ? 'border-[#E63946] text-white bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4 text-[#E63946]" />
              <span>Dizi / Film Ara</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
                activeTab === 'upload'
                  ? 'border-[#E63946] text-white bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Cihazdan Yükle</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            
            {/* Tab 1: TMDB Search */}
            {activeTab === 'search' && (
              <div className="space-y-4 overflow-visible">
                {/* Search input wrapped in relative container for dropdown overflow */}
                <div className="relative z-30">
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Dizi veya film ismi yaz (örn: Severance, Game of Thrones, Interstellar)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#E63946] transition"
                      />
                    </div>
                  </form>

                  {/* Dropdown search predictions (Dizi & film ararken olduğu gibi) */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0C0E]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl overflow-y-auto max-h-56 z-50 divide-y divide-white/5 scrollbar-thin">
                      {isSearching && searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E63946]" />
                          <span>Aranıyor...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((option) => (
                          <div
                            key={`search-dropdown-${option.id}`}
                            onClick={() => {
                              setSelectedBannerUrl(option.backdropUrl);
                              setSelectedFeaturedTitle(option.title);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3.5 p-2.5 hover:bg-white/5 cursor-pointer transition duration-150 group"
                          >
                            <img
                              src={option.backdropUrl}
                              alt={option.title}
                              className="w-14 h-9 object-cover rounded-lg border border-white/10 shrink-0 group-hover:scale-105 transition"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E63946] transition">{option.title}</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                                {option.mediaType === 'tv' ? 'Dizi' : 'Film'}
                              </p>
                            </div>
                            {option.rating && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                ★ {option.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Eşleşen yapım bulunamadı.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Banner grid layout showing recommended / trending list */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Önerilen Kapaklar
                  </h3>
                  
                  {trendingResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {trendingResults.map((option) => {
                        const isSelected = selectedBannerUrl === option.backdropUrl;
                        return (
                          <div
                            key={`${option.id}-${option.title}`}
                            onClick={() => {
                              setSelectedBannerUrl(option.backdropUrl);
                              setSelectedFeaturedTitle(option.title);
                            }}
                            className={`relative group rounded-xl overflow-hidden border cursor-pointer transition duration-300 aspect-video bg-slate-900 ${
                              isSelected
                                ? 'border-[#E63946] ring-2 ring-[#E63946]/50 shadow-xl scale-[1.02]'
                                : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
                            }`}
                          >
                            <img
                              src={option.backdropUrl}
                              alt={option.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {isSelected && (
                              <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#E63946] text-white shadow-lg z-10">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {option.rating && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black text-amber-400 border border-white/10">
                                ★ {option.rating.toFixed(1)}
                              </div>
                            )}

                            <div className="absolute bottom-2.5 left-3 right-3">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {option.mediaType === 'tv' ? 'Dizi' : 'Film'}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate leading-snug">{option.title}</h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      Önerilen kapak bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Upload from Device */}
            {activeTab === 'upload' && (
              <div className="space-y-5 py-2">
                
                {/* Device Upload */}
                <div className="p-8 rounded-2xl bg-white/5 border-2 border-dashed border-white/15 hover:border-[#E63946]/50 transition text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#E63946]/10 text-[#E63946] flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Cihazından Görsel Yükle</h3>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP veya GIF formatında bir resim seçin</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white font-bold text-xs transition shadow-lg cursor-pointer"
                  >
                    Görsel Seç
                  </button>
                </div>

                {/* Selected Preview Thumbnail */}
                {uploadPreviewUrl && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Seçilen Yüklenen Görsel
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 h-32 bg-slate-900">
                      <img
                        src={uploadPreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 sm:py-4 border-t border-white/10 bg-[#1A1D26] flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              onClick={handleApply}
              disabled={!selectedBannerUrl}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E63946] to-purple-600 hover:from-[#d62839] hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-[#E63946]/25 transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

