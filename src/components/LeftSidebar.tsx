import React from 'react';
import { Tv, Film, Eye, Clock, CheckCircle2, Bookmark, CheckSquare, Activity, Compass, Calendar, Layers, Plus, Folder, Heart, Sparkles, Flame, Star } from 'lucide-react';
import { Profile, WatchStatus, CustomCollection } from '../types';

interface LeftSidebarProps {
  user: Profile;
  activeMediaType: 'all' | 'tv' | 'movie';
  setActiveMediaType: (type: 'all' | 'tv' | 'movie') => void;
  activeStatusFilter: 'all' | 'watching' | 'plan_to_watch' | 'watched';
  setActiveStatusFilter: (status: 'all' | 'watching' | 'plan_to_watch' | 'watched') => void;
  watchList: WatchStatus[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collections?: CustomCollection[];
  favorites?: WatchStatus[];
  onSelectCollection?: (id: string | null) => void;
  onNavigateToProfile?: (username: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  user,
  activeMediaType,
  setActiveMediaType,
  activeStatusFilter,
  setActiveStatusFilter,
  watchList,
  activeTab,
  setActiveTab,
  collections = [],
  favorites = [],
  onSelectCollection,
  onNavigateToProfile
}) => {
  // Count items based on active mediaType toggle if desired or total
  const filteredList = activeMediaType === 'all' 
    ? watchList 
    : watchList.filter(w => w.media_type === activeMediaType);

  const watchingCount = filteredList.filter(w => w.status === 'watching').length;
  const planToWatchCount = filteredList.filter(w => w.status === 'plan_to_watch').length;
  const watchedCount = filteredList.filter(w => w.status === 'watched').length;
  const totalCount = filteredList.length;

  return (
    <aside className="w-full lg:w-[240px] shrink-0 space-y-5">
      
      {/* 1. Aktif Profil Kartı ('Yusuf') */}
      <div 
        onClick={() => {
          if (onNavigateToProfile && user.username) {
            onNavigateToProfile(user.username);
          } else {
            setActiveTab('profile');
          }
        }}
        className={`bg-[#14171D] border rounded-2xl p-4 shadow-lg relative group cursor-pointer transition ${
          activeTab === 'profile' ? 'border-[#E63946] ring-1 ring-[#E63946]' : 'border-[#232833] hover:border-[#2B313E]'
        }`}
        title="Profil Sayfasına Git"
      >
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#E63946]/10 rounded-full blur-xl group-hover:bg-[#E63946]/20 transition-all pointer-events-none rounded-2xl overflow-hidden" />
        
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#E63946] shadow-md group-hover:scale-102 transition"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#14171D]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-white truncate group-hover:text-[#E63946] transition">{user.full_name}</h3>
            <p className="text-[11px] text-[#E63946] font-medium truncate">@{user.username}</p>
          </div>
        </div>

        {user.bio && (
          <p className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-[#232833] line-clamp-2 leading-relaxed">
            {user.bio}
          </p>
        )}
      </div>

      {/* 2. [Diziler] / [Filmler] Switch Toggle */}
      <div className="bg-[#14171D] border border-[#232833] p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-inner">
        <button
          onClick={() => setActiveMediaType('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition text-center ${
            activeMediaType === 'all'
              ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0B0C0E]/50'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setActiveMediaType('tv')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
            activeMediaType === 'tv'
              ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0B0C0E]/50'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Diziler</span>
        </button>
        <button
          onClick={() => setActiveMediaType('movie')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
            activeMediaType === 'movie'
              ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#0B0C0E]/50'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Filmler</span>
        </button>
      </div>

      {/* 3. İzleniyor / İzlenecek / Tamamlandı Sayaçlı Filtre Menüsü */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3 space-y-1 shadow-lg">
        <div className="px-2 py-1 mb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
          <span>Kütüphane Filtresi</span>
          <span className="text-slate-500 font-mono text-[9px]">{totalCount} kayıt</span>
        </div>

        {/* Tümü Filtresi */}
        <button
          onClick={() => {
            setActiveStatusFilter('all');
            if (activeTab !== 'discover' && activeTab !== 'watchlist') setActiveTab('watchlist');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeStatusFilter === 'all'
              ? 'bg-[#E63946]/15 text-white border border-[#E63946]/40 font-bold'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className={`w-4 h-4 ${activeStatusFilter === 'all' ? 'text-[#E63946]' : 'text-slate-400'}`} />
            <span>Tüm Liste</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeStatusFilter === 'all' ? 'bg-[#E63946] text-white' : 'bg-[#0B0C0E] text-slate-400'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* İzleniyor Filtresi */}
        <button
          onClick={() => {
            setActiveStatusFilter('watching');
            if (activeTab !== 'discover' && activeTab !== 'watchlist') setActiveTab('watchlist');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeStatusFilter === 'watching'
              ? 'bg-[#E63946]/15 text-white border border-[#E63946]/40 font-bold'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#E63946]" />
            <span>İzleniyor</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E63946]/20 text-[#E63946]">
            {watchingCount}
          </span>
        </button>

        {/* İzlenecek Filtresi */}
        <button
          onClick={() => {
            setActiveStatusFilter('plan_to_watch');
            if (activeTab !== 'discover' && activeTab !== 'watchlist') setActiveTab('watchlist');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeStatusFilter === 'plan_to_watch'
              ? 'bg-[#E63946]/15 text-white border border-[#E63946]/40 font-bold'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>İzlenecek</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-400">
            {planToWatchCount}
          </span>
        </button>

        {/* Tamamlandı Filtresi */}
        <button
          onClick={() => {
            setActiveStatusFilter('watched');
            if (activeTab !== 'discover' && activeTab !== 'watchlist') setActiveTab('watchlist');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeStatusFilter === 'watched'
              ? 'bg-[#E63946]/15 text-white border border-[#E63946]/40 font-bold'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tamamlandı</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-400">
            {watchedCount}
          </span>
        </button>
      </div>

      {/* 4. Navigation Links */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3 space-y-1 shadow-lg">
        <div className="px-2 py-1 mb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Sayfalar
        </div>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'tracker'
              ? 'bg-[#E63946] text-white font-bold shadow-md shadow-[#E63946]/20'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Bölüm Takipçisi</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'calendar'
              ? 'bg-[#E63946] text-white font-bold shadow-md shadow-[#E63946]/20'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Yayın Takvimi</span>
        </button>

        <button
          onClick={() => {
            if (onSelectCollection) onSelectCollection(null);
            setActiveTab('collections');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'collections'
              ? 'bg-[#E63946] text-white font-bold shadow-md shadow-[#E63946]/20'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            <span>Listelerim</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300">
            {collections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'favorites'
              ? 'bg-[#E63946] text-white font-bold shadow-md shadow-[#E63946]/20'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Favorilerim</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300">
            {favorites.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'activity'
              ? 'bg-[#E63946] text-white font-bold shadow-md shadow-[#E63946]/20'
              : 'text-slate-300 hover:bg-[#0B0C0E] hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Sosyal Aktivite</span>
        </button>
      </div>

    </aside>
  );
};
