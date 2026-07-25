import React from 'react';
import { Home, Search, Library, Activity, Bookmark } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#12141A]/95 backdrop-blur-xl border-t border-[#232833] py-2 px-3 flex items-center justify-around md:hidden shadow-2xl ring-1 ring-white/5">
      {/* 🏠 Ana Sayfa */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('tracker');
          try { window.history.pushState({}, '', '/'); } catch(e){}
        }}
        className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${
          activeTab === 'tracker' 
            ? 'text-[#E63946] font-extrabold scale-105' 
            : 'text-slate-400 hover:text-slate-200 font-medium'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'tracker' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight">Ana Sayfa</span>
      </button>

      {/* 🔍 Arama */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('discover');
          if (onOpenSearch) onOpenSearch();
        }}
        className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${
          activeTab === 'discover' 
            ? 'text-[#E63946] font-extrabold scale-105' 
            : 'text-slate-400 hover:text-slate-200 font-medium'
        }`}
      >
        <Search className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight">Arama</span>
      </button>

      {/* 📚 Kitaplığım */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('watchlist');
        }}
        className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${
          activeTab === 'watchlist' || activeTab === 'collections' 
            ? 'text-[#E63946] font-extrabold scale-105' 
            : 'text-slate-400 hover:text-slate-200 font-medium'
        }`}
      >
        <Library className={`w-5 h-5 ${activeTab === 'watchlist' || activeTab === 'collections' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight">Kitaplığım</span>
      </button>

      {/* 📡 Akış (Feed) */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('activity');
        }}
        className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${
          activeTab === 'activity' 
            ? 'text-[#E63946] font-extrabold scale-105' 
            : 'text-slate-400 hover:text-slate-200 font-medium'
        }`}
      >
        <Activity className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] tracking-tight">Akış</span>
      </button>
    </nav>
  );
};
