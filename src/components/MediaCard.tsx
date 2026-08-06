import React from 'react';
import { motion } from 'motion/react';
import { Star, Tv, Film, Plus, Check, Clock, Eye, Trash2 } from 'lucide-react';
import { TMDBMedia, WatchStatusType } from '../types';
import { getPosterUrl } from '../lib/tmdb';

interface MediaCardProps {
  media: TMDBMedia;
  userWatchStatus?: WatchStatusType;
  onSelect: (media: TMDBMedia) => void;
  onUpdateStatus: (media: TMDBMedia, status: WatchStatusType | null) => void;
  showQuickActions?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  userWatchStatus,
  onSelect,
  onUpdateStatus,
  showQuickActions = true
}) => {
  const isTv = media.media_type === 'tv' || !!media.first_air_date;
  const title = media.title || media.name || 'İsimsiz';
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = getPosterUrl(media.poster_path);

  const getStatusBadge = () => {
    switch (userWatchStatus) {
      case 'watching':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md shadow-md">
            <Eye className="w-3.5 h-3.5" /> İzleniyor
          </span>
        );
      case 'plan_to_watch':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-md shadow-md">
            <Clock className="w-3.5 h-3.5" /> İzlenecek
          </span>
        );
      case 'watched':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md shadow-md">
            <Check className="w-3.5 h-3.5" /> İzlendi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col h-full z-0 hover:z-10"
    >
      
      {/* Poster Image Container */}
      <div 
        onClick={() => onSelect(media)} 
        className="relative aspect-[2/3] overflow-hidden bg-slate-800 cursor-pointer"
      >
        <img
          src={poster}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Type Badge (Movie / TV) */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-slate-200 border border-slate-700/50">
          {isTv ? <Tv className="w-3 h-3 text-amber-400 shrink-0" /> : <Film className="w-3 h-3 text-blue-400 shrink-0" />}
          <span className="hidden sm:inline">{isTv ? 'Dizi' : 'Film'}</span>
        </div>

        {/* Rating Badge */}
        {media.vote_average > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-black text-amber-400 border border-amber-500/30 shadow">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 shrink-0" />
            <span>{media.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Current Watch Status Badge */}
        {userWatchStatus && (
          <div className="absolute bottom-2 left-2">
            {getStatusBadge()}
          </div>
        )}

      </div>

      {/* Info Section */}
      <div 
        onClick={() => onSelect(media)}
        className="p-3 flex flex-col justify-between cursor-pointer"
      >
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-medium">
            {year && <span>{year}</span>}
            {media.genres && media.genres.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate">{media.genres[0].name}</span>
              </>
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
};
