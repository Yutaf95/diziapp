import React, { useRef } from 'react';
import { Eye, Clock, CheckCircle2, ChevronLeft, ChevronRight, Star, Play, Plus, Check } from 'lucide-react';
import { WatchStatus, TMDBMedia, WatchStatusType } from '../types';
import { EmptyState } from './EmptyState';

interface HorizontalPosterGridProps {
  title: string;
  type: 'watching' | 'plan_to_watch' | 'watched';
  items: WatchStatus[];
  onSelectMediaById: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  onUpdateStatus?: (media: TMDBMedia, status: WatchStatusType) => void;
}

export const HorizontalPosterGrid: React.FC<HorizontalPosterGridProps> = ({
  title,
  type,
  items,
  onSelectMediaById,
  onUpdateStatus
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getBadgeColor = () => {
    if (type === 'watching') return 'text-[#E63946] bg-[#E63946]/10 border-[#E63946]/30';
    if (type === 'plan_to_watch') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
  };

  const getIcon = () => {
    if (type === 'watching') return <Eye className="w-4 h-4 text-[#E63946]" />;
    if (type === 'plan_to_watch') return <Clock className="w-4 h-4 text-amber-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-3.5 bg-[#14171D] border border-[#232833] rounded-2xl p-4 sm:p-5 shadow-lg">
      
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232833]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0B0C0E] border border-[#232833]">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${getBadgeColor()}`}>
                {items.length}
              </span>
            </h2>
          </div>
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg bg-[#0B0C0E] text-slate-400 hover:text-white hover:border-[#E63946] border border-[#232833] transition"
            title="Sola kaydır"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg bg-[#0B0C0E] text-slate-400 hover:text-white hover:border-[#E63946] border border-[#232833] transition"
            title="Sağa kaydır"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      {items.length === 0 ? (
        <EmptyState
          title="Bu Liste Henüz Boş"
          description={`"${title}" listenizde herhangi bir film veya dizi bulunmuyor.`}
          iconType={type === 'watching' ? 'eye' : type === 'plan_to_watch' ? 'bookmark' : 'film'}
        />
      ) : (
        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <div
              key={`${item.media_id}-${item.media_type}`}
              style={{ scrollSnapAlign: 'start' }}
              className="w-36 sm:w-44 shrink-0 bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/60 rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-[#E63946]/10 cursor-pointer flex flex-col justify-between"
              onClick={() => onSelectMediaById(item.media_id, item.media_type)}
            >
              {/* Poster Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#14171D]">
                <img
                  src={item.poster_path || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'}
                  alt={item.title || 'Yapım'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                {item.vote_average && (
                  <div className="absolute top-2 right-2 bg-[#0B0C0E]/90 backdrop-blur-md text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-[#232833]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2 bg-[#E63946] text-white px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider">
                  {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                </div>

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 bg-[#0B0C0E]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#E63946] text-white flex items-center justify-center shadow-lg shadow-[#E63946]/40 transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="font-bold text-xs text-white truncate group-hover:text-[#E63946] transition-colors">
                    {item.title || 'Yapım'}
                  </h3>
                  
                  {item.media_type === 'tv' && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                      {item.total_episodes ? `${item.total_episodes} Bölüm` : 'Aktif Sezon'}
                    </p>
                  )}
                </div>

                <div className="pt-1 border-t border-[#14171D] flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold">
                    {type === 'watching' ? 'Devam Ediyor' : type === 'plan_to_watch' ? 'Sırada' : 'Tamamlandı'}
                  </span>

                  <span className="text-[#E63946] font-bold group-hover:underline">
                    Detay →
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
