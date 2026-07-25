import React, { useState } from 'react';
import { Sparkles, Flame, Play, X, ChevronRight, Zap } from 'lucide-react';

interface NewEpisodesBannerProps {
  onSelectShow?: (title: string) => void;
}

export const NewEpisodesBanner: React.FC<NewEpisodesBannerProps> = ({ onSelectShow }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14171D] via-[#1A1F29] to-[#14171D] border border-[#E63946]/40 p-4 sm:p-5 shadow-xl shadow-[#E63946]/5 animate-in fade-in duration-300">
      
      {/* Background Decorative Accent Glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#E63946]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Side: Alert Badge & Info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E63946] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#E63946]/30 animate-pulse">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#E63946] text-white text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                Yeni Bölümler Yayında!
              </span>
              <span className="text-slate-400 text-xs font-medium">Bugünün Güncellemeleri</span>
            </div>
            
            <p className="text-sm font-bold text-white mt-1 leading-snug">
              <span className="text-[#E63946]">Blue Eye Samurai</span> (Sezon 2, Bölüm 1-4) ve <span className="text-amber-400">Severance</span> (S02E03) Türkçe altyazılı eklendi!
            </p>
          </div>
        </div>

        {/* Right Side: Action Button & Close */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => onSelectShow && onSelectShow('Blue Eye Samurai')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-extrabold shadow-lg shadow-[#E63946]/25 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Hemen İzle</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#232833] rounded-xl transition"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
