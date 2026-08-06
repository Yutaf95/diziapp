import React, { useState, useEffect, useRef } from 'react';
import { Tv, Search, Bell, LogOut, Star, Loader2, X, Film, Eye, Clock, CheckCircle2, Settings, Plus, User } from 'lucide-react';
import { Profile, TMDBMedia, WatchStatusType } from '../types';
import { getPosterUrl } from '../lib/tmdb';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';
import { SettingsModal } from './SettingsModal';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  user: Profile;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults?: TMDBMedia[];
  userSearchResults?: Profile[];
  isSearching?: boolean;
  onSelectMedia?: (media: TMDBMedia) => void;
  onNavigateToProfile?: (username: string) => void;
  onOpenProfile?: () => void;
  onGoHome?: () => void;
  onLogout?: () => void;
  notificationCount?: number;
  
  // Mobile Filter Props
  mediaFilter?: 'all' | 'tv' | 'movie';
  setMediaFilter?: (type: 'all' | 'tv' | 'movie') => void;
  statusFilter?: 'all' | 'watching' | 'plan_to_watch' | 'watched';
  setStatusFilter?: (status: 'all' | 'watching' | 'plan_to_watch' | 'watched') => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;

  // Drawer Callbacks
  onOpenDrawer?: () => void;
  onOpenStats?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onUpdateWatchStatus?: (media: TMDBMedia, status: WatchStatusType) => void;
  getUserWatchStatus?: (id: number, type: 'tv' | 'movie') => WatchStatusType | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery,
  searchResults = [],
  userSearchResults = [],
  isSearching = false,
  onSelectMedia,
  onNavigateToProfile,
  onOpenProfile,
  onGoHome,
  onLogout,
  notificationCount = 0,
  mediaFilter = 'all',
  setMediaFilter,
  statusFilter = 'all',
  setStatusFilter,
  activeTab = 'discover',
  setActiveTab,
  onOpenDrawer,
  onOpenStats,
  onOpenNotifications,
  onOpenSettings,
  onUpdateWatchStatus,
  getUserWatchStatus
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMobileSearchInput, setShowMobileSearchInput] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchScrollRef = useRef<HTMLDivElement>(null);

  // Reset search dropdown scroll position when searching new query
  useEffect(() => {
    if (searchScrollRef.current) {
      searchScrollRef.current.scrollTop = 0;
    }
  }, [searchQuery, searchResults]);

  const handleSelectMediaFilter = (type: 'all' | 'tv' | 'movie') => {
    if (setMediaFilter) setMediaFilter(type);
    if (setActiveTab && activeTab !== 'discover' && activeTab !== 'watchlist') {
      setActiveTab('watchlist');
    }
  };

  const handleSelectStatusFilter = (status: 'all' | 'watching' | 'plan_to_watch' | 'watched') => {
    if (setStatusFilter) setStatusFilter(status);
    if (setActiveTab && activeTab !== 'discover' && activeTab !== 'watchlist') {
      setActiveTab('watchlist');
    }
  };

  // Automatically open search dropdown when typing
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  // Click outside to close search dropdown & notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedSearch = searchContainerRef.current?.contains(event.target as Node);
      const clickedMobileSearch = mobileSearchContainerRef.current?.contains(event.target as Node);
      if (!clickedSearch && !clickedMobileSearch) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSearchDropdown = () => {
    if (!isSearchOpen || !searchQuery.trim()) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2.5 bg-[#14171D]/98 backdrop-blur-xl border border-[#2B313E] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/50">
        
        {/* Header section of dropdown */}
        <div className="p-3.5 sm:p-4 border-b border-[#232833] flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-400 bg-[#0B0C0E]/50">
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#E63946]" />
            <span className="text-white tracking-wider">ARAMA SONUÇLARI</span>
          </span>
          {isSearching ? (
            <span className="flex items-center gap-2 text-[#E63946] font-semibold text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>TMDB'de aranıyor...</span>
            </span>
          ) : (
            <span className="text-xs bg-[#232833] text-slate-200 px-3 py-1 rounded-full font-black border border-[#2B313E]">
              {searchResults.length} Yapım
            </span>
          )}
        </div>

        {/* Results List */}
        <div ref={searchScrollRef} className="max-h-[32rem] overflow-y-auto p-2.5 sm:p-3 space-y-2.5 custom-scrollbar">
          
          {/* USER SEARCH RESULTS SECTION */}
          {userSearchResults && userSearchResults.length > 0 && (
            <div className="space-y-2 pb-3 mb-2 border-b border-[#232833]">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#40bcf4]">
                  <User className="w-3.5 h-3.5" />
                  <span>KULLANICILAR ({userSearchResults.length})</span>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {userSearchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      if (onNavigateToProfile) onNavigateToProfile(u.username);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0B0C0E]/90 hover:bg-[#232833] border border-[#232833] hover:border-[#40bcf4]/50 cursor-pointer transition group"
                  >
                    <UserAvatar user={u} size="sm" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-white group-hover:text-[#40bcf4] transition truncate">
                        {u.full_name || u.username}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        @{u.username}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#40bcf4] bg-[#40bcf4]/10 px-2 py-0.5 rounded border border-[#40bcf4]/20 group-hover:bg-[#40bcf4] group-hover:text-black transition">
                      Profil →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSearching && searchResults.length === 0 && userSearchResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-300 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-[#E63946] animate-spin" />
              <span className="font-semibold">TMDB veritabanında film ve diziler taranıyor...</span>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => {
              const isTv = item.media_type === 'tv' || !!item.first_air_date;
              const title = item.title || item.name || 'Yapım';
              const year = (item.release_date || item.first_air_date || '').substring(0, 4);
              const poster = item.poster_path
                ? getPosterUrl(item.poster_path)
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';

              return (
                <div
                  key={`${item.id}-${item.media_type || (isTv ? 'tv' : 'movie')}`}
                  className="relative flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#0B0C0E]/80 hover:bg-[#232833] border border-[#232833] hover:border-[#E63946]/50 cursor-pointer transition-all duration-200 group shadow-md"
                >
                  {/* Clickable overlay for opening detail */}
                  <div
                    className="absolute inset-0 z-0"
                    onClick={() => {
                      if (onSelectMedia) onSelectMedia(item);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  />

                  {/* Poster Thumbnail */}
                  <div className="relative shrink-0 z-10 pointer-events-none">
                    <img
                      src={poster}
                      alt={title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl border border-[#232833] group-hover:scale-105 transition-transform duration-300 shadow-md"
                    />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                  </div>

                  {/* Information Details */}
                  <div className="min-w-0 flex-1 space-y-1.5 z-10 pointer-events-none">
                    <div className="flex items-center justify-between gap-2.5">
                      <h4 className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-[#E63946] transition-colors leading-snug">
                        {title}
                      </h4>
                      {item.vote_average && item.vote_average > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    {item.overview && (
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 font-normal leading-relaxed">
                        {item.overview}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs pt-1 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-black uppercase text-xs tracking-wider ${
                          isTv 
                            ? 'bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30' 
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {isTv ? 'Dizi' : 'Film'}
                      </span>
                      {year && (
                        <span className="text-slate-300 font-bold bg-[#14171D] px-2 py-0.5 rounded-lg border border-[#232833]">
                          {year}
                        </span>
                      )}
                      {(() => {
                        const status = getUserWatchStatus ? getUserWatchStatus(item.id, isTv ? 'tv' : 'movie') : null;
                        if (status === 'watching') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-lg font-black uppercase text-xs tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              İzleniyor
                            </span>
                          );
                        }
                        if (status === 'plan_to_watch') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-lg font-black uppercase text-xs tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              İzlenecek
                            </span>
                          );
                        }
                        if (status === 'watched') {
                          return (
                            <span className="px-2.5 py-0.5 rounded-lg font-black uppercase text-xs tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Tamamlandı
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Quick Action Buttons (visible on hover) */}
                  {onUpdateWatchStatus && (
                    <div className="absolute right-3 bottom-3 z-20 hidden group-hover:flex items-center gap-1.5">
                      {isTv && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateWatchStatus(item, 'watching');
                          }}
                          className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all duration-150 active:scale-90 shadow-md"
                          title="İzleniyor"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateWatchStatus(item, 'plan_to_watch');
                        }}
                        className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 transition-all duration-150 active:scale-90 shadow-md"
                        title="İzlenecek"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateWatchStatus(item, 'watched');
                        }}
                        className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all duration-150 active:scale-90 shadow-md"
                        title="Tamamlandı"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Film className="w-8 h-8 text-slate-600" />
              <span>"{searchQuery}" aramasına uygun yapım bulunamadı.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <header 
      style={{ transform: 'translateZ(0)' }}
      className={`sticky top-0 z-50 transition-all pt-[env(safe-area-inset-top,0px)] ${
        activeTab === 'profile'
          ? 'bg-black/20 backdrop-blur-md border-b border-white/5'
          : 'bg-[#14171D]/95 backdrop-blur-md border-b border-[#232833]'
      }`}
    >
      {/* ========================================== */}
      {/* DESKTOP HEADER (MD & UP)                   */}
      {/* ========================================== */}
      <div className="hidden md:block w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Sol taraf: Logo / Ana Sayfa */}
          <div 
            onClick={() => {
              if (onGoHome) onGoHome();
            }}
            className="flex items-center gap-3 shrink-0 group transition cursor-pointer hover:opacity-95"
            title="Ana Sayfaya Dön"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E63946] flex items-center justify-center text-white font-bold shadow-lg shadow-[#E63946]/30 group-hover:scale-105 transition">
              <Tv className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              {activeTab === 'profile' ? (
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 group-hover:text-slate-100 transition">
                  Ana Sayfa
                </span>
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 group-hover:text-slate-100 transition">
                  TTime <span className="text-xs font-semibold text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 rounded border border-[#E63946]/30 uppercase tracking-widest">TR</span>
                </span>
              )}
            </div>
          </div>

          {/* Orta alan: 'Film veya dizi ara...' arama çubuğu (Profil sayfasında gizlenir) */}
          {activeTab !== 'profile' ? (
            <div ref={searchContainerRef} className="flex-1 max-w-lg relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                placeholder="Film veya dizi ara..."
                className="w-full bg-[#0B0C0E] border border-[#2B313E] focus:border-[#E63946] rounded-full pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E63946] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-[#232833] hover:bg-[#E63946] w-5 h-5 rounded-full flex items-center justify-center transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Pop-up Search Results */}
              {renderSearchDropdown()}
            </div>
          ) : (
            <div className="flex-1 max-w-lg" />
          )}

          {/* Sağ taraf: Bildirim zili, Profil simgesi ve Çıkış Yap (Log Out) */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Bildirim zili */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-[#0B0C0E] rounded-xl border border-[#232833] transition"
                title="Bildirimler"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E63946] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#14171D]">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Bildirim Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#14171D] border border-[#2B313E] rounded-2xl shadow-2xl py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232833]">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#E63946]" /> Bildirimler
                    </span>
                    <span className="text-[10px] bg-[#E63946]/20 text-[#E63946] px-2 py-0.5 rounded-full font-bold">
                      {notificationCount} yeni
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {notificationCount > 0 ? (
                      <>
                        <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/40 transition cursor-pointer">
                          <p className="font-semibold text-slate-200">🔥 Blue Eye Samurai 2. Sezon duyuruldu!</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">10 dakika önce</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/40 transition cursor-pointer">
                          <p className="font-semibold text-slate-200">💬 Can, Dune: Part Two incelemeni beğendi</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">1 saat önce</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/40 transition cursor-pointer">
                          <p className="font-semibold text-slate-200">📺 Severance S02E03 yayında!</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">3 saat önce</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500 font-medium">
                        Yeni bildiriminiz yok.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profil simgesi */}
            <div 
              onClick={() => onOpenProfile && onOpenProfile()} 
              className="flex items-center gap-3 pl-3 border-l border-[#232833] cursor-pointer group hover:opacity-90 transition"
              title="Profil Sayfasına Git"
            >
              <div className="relative group shrink-0">
                <UserAvatar user={user} size="md" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#14171D] z-20" />
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-sm sm:text-base font-extrabold text-white leading-none truncate group-hover:text-[#E63946] transition">{user.full_name}</p>
                <p className="text-xs text-slate-300 font-medium leading-tight mt-1 truncate">@{user.username}</p>
              </div>
            </div>

            {/* Ayarlar (⚙️) butonu */}
            <button
              onClick={() => {
                if (onOpenSettings) {
                  onOpenSettings();
                } else {
                  setIsSettingsOpen(true);
                }
              }}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#232833] transition ml-1.5 flex items-center justify-center border border-[#232833] bg-[#0B0C0E] hover:border-[#E63946]/50 cursor-pointer shadow-md"
              title="Ayarlar (⚙️)"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Çıkış Yap (Log Out) butonu */}
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  alert("Çıkış yapıldı (Oturum kapatıldı).");
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946] hover:bg-[#E63946]/10 transition ml-1"
              title="Çıkış Yap"
            >
              <LogOut className="w-4.5 h-4.5 text-[#E63946]" />
              <span className="hidden md:inline">Çıkış Yap</span>
            </button>

          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* SPOTIFY MOBILE HEADER (< 768px)            */}
      {/* ========================================== */}
      <div className="block md:hidden px-3 py-2.5 space-y-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        {/* 1. KATMAN: Sol Profil İkonu + Yan Yana Kaydırılabilir Tip Filtreleri */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Sol üst küçük dairesel Profil İkonu (Tıklandığında Soldan Açılan Sidebar Drawer Görünür) */}
          <button
            type="button"
            onClick={() => onOpenDrawer ? onOpenDrawer() : setIsDrawerOpen(true)}
            className="shrink-0 relative focus:outline-none group active:scale-95 transition cursor-pointer"
            title="Menüyü Aç"
          >
            <UserAvatar user={user} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#14171D] z-20" />
          </button>

          {/* Yan Yana Tip Filtreleri (Pill Buttons): ONLY ON WATCHLIST (Kütüphane) PAGE */}
          {activeTab !== 'watchlist' ? (
            <div className="flex-1 min-w-0 px-2 flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight">
                {activeTab === 'profile'
                  ? 'Profilim'
                  : activeTab === 'activity'
                  ? 'Akış'
                  : activeTab === 'tracker'
                  ? 'Bölüm Takipçisi'
                  : activeTab === 'calendar'
                  ? 'Takvim'
                  : 'Arama & Keşfet'}
              </span>
              {activeTab === 'profile' && (
                <span className="text-[10px] bg-[#E63946]/20 text-[#E63946] px-2 py-0.5 rounded-full font-bold">
                  @{user.username}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-1 py-0.5">
              <button
                type="button"
                onClick={() => handleSelectMediaFilter('tv')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 font-bold ${
                  mediaFilter === 'tv'
                    ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/30 ring-1 ring-[#E63946]'
                    : 'bg-[#181A22] text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span>Diziler</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMediaFilter('movie')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 font-bold ${
                  mediaFilter === 'movie'
                    ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/30 ring-1 ring-[#E63946]'
                    : 'bg-[#181A22] text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5 shrink-0" />
                <span>Filmler</span>
              </button>
            </div>
          )}

          {/* Bildirim kısayolu */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-slate-300 hover:text-white rounded-full bg-[#181A22] border border-white/10 relative active:scale-95 transition"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#E63946] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. KATMAN: Durum Filtreleri (İzleniyor | İzlenecek | Tamamlandı) - ONLY ON KÜTÜPHANE (WATCHLIST) PAGE */}
        {activeTab === 'watchlist' && (
          <div className={`grid ${mediaFilter === 'movie' ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 border-t border-white/10 pt-2`}>
            {mediaFilter !== 'movie' && (
              <button
                type="button"
                onClick={() => handleSelectStatusFilter(statusFilter === 'watching' ? 'all' : 'watching')}
                className={`py-1.5 px-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 w-full ${
                  statusFilter === 'watching'
                    ? 'bg-white text-black font-extrabold shadow-md ring-2 ring-white/50'
                    : 'bg-[#181A22] text-slate-300 font-medium border border-white/10 hover:text-white'
                }`}
              >
                <Eye className={`w-3.5 h-3.5 ${statusFilter === 'watching' ? 'text-[#E63946]' : 'text-slate-400'}`} />
                <span>İzleniyor</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectStatusFilter(statusFilter === 'plan_to_watch' ? 'all' : 'plan_to_watch')}
              className={`py-1.5 px-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 w-full ${
                statusFilter === 'plan_to_watch'
                  ? 'bg-white text-black font-extrabold shadow-md ring-[#ffffff]/50'
                  : 'bg-[#181A22] text-slate-300 font-medium border border-white/10 hover:text-white'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${statusFilter === 'plan_to_watch' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>İzlenecek</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectStatusFilter(statusFilter === 'watched' ? 'all' : 'watched')}
              className={`py-1.5 px-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 w-full ${
                statusFilter === 'watched'
                  ? 'bg-white text-black font-extrabold shadow-md ring-2 ring-white/50'
                  : 'bg-[#181A22] text-slate-300 font-medium border border-white/10 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'watched' ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>Tamamlandı</span>
            </button>
          </div>
        )}

        {/* Mobil Arama Girdisi (Tıklandığında ya da Arama Yapılırken Açılır) */}
        {(showMobileSearchInput || searchQuery.trim().length > 0) && (
          <div ref={mobileSearchContainerRef} className="pt-1 relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                placeholder="Film veya dizi ara..."
                className="w-full bg-[#0B0C0E] border border-[#2B313E] rounded-full pl-10 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#E63946]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {renderSearchDropdown()}
          </div>
        )}
      </div>

      {/* Fallback Sol Panel (Sidebar Drawer) for Mobile if not rendered at root */}
      {!onOpenDrawer && (
        <>
          <MobileSidebarDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            user={user}
            onOpenProfile={() => {
              if (onOpenProfile) onOpenProfile();
            }}
            onOpenStats={() => {
              if (onOpenStats) {
                onOpenStats();
              } else if (onOpenProfile) {
                onOpenProfile();
              }
            }}
            onOpenNotifications={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else if (setActiveTab) {
                setActiveTab('activity');
              }
            }}
            onOpenSettings={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setIsSettingsOpen(true);
              }
            }}
            onLogout={() => {
              if (onLogout) onLogout();
            }}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
          />
        </>
      )}
    </header>
  );
};

