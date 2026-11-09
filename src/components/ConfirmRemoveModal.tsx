import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Film, Tv, Clock, Eye, CheckCircle2 } from 'lucide-react';
import { TMDBMedia, WatchStatusType } from '../types';
import { getPosterUrl } from '../lib/tmdb';

interface ConfirmRemoveModalProps {
  isOpen: boolean;
  media: TMDBMedia | null;
  status: WatchStatusType | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmRemoveModal: React.FC<ConfirmRemoveModalProps> = ({
  isOpen,
  media,
  status,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !media) return null;

  const isTv = media.media_type === 'tv' || !!media.first_air_date;
  const title = media.title || media.name || 'Yapım';
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path ? getPosterUrl(media.poster_path) : '';

  const getStatusInfo = (st: WatchStatusType | null) => {
    switch (st) {
      case 'watching':
        return {
          name: 'İzliyorum',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          icon: Eye,
        };
      case 'plan_to_watch':
        return {
          name: 'İzlenecekler',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          icon: Clock,
        };
      case 'watched':
        return {
          name: 'İzlediklerim',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          icon: CheckCircle2,
        };
      default:
        return {
          name: 'Kütüphaneniz',
          color: 'text-slate-300 bg-slate-800 border-slate-700',
          icon: AlertTriangle,
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="bg-[#14171D] border border-[#232833] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#232833] pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white">Listeden Kaldır</h3>
              <p className="text-xs text-slate-400 font-medium">Kütüphane Onayı</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Preview Box */}
        <div className="bg-[#0B0C0E] border border-[#232833] rounded-2xl p-3.5 flex items-center gap-3.5">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-14 h-20 object-cover rounded-xl border border-[#232833] shrink-0 shadow"
            />
          ) : (
            <div className="w-14 h-20 rounded-xl bg-[#14171D] border border-[#232833] flex items-center justify-center text-slate-600 shrink-0">
              {isTv ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-bold text-sm text-white truncate">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-400 font-semibold">{isTv ? 'Dizi' : 'Film'}</span>
              {year && <span className="text-slate-500">• {year}</span>}
            </div>

            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1.5 text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-200 leading-relaxed">
            <strong className="text-white font-extrabold">"{title}"</strong> adlı yapımı{' '}
            <strong className="text-amber-400 font-extrabold">"{statusInfo.name}"</strong> listesinden kaldırmak istediğinize emin misiniz?
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bu işlem yapımı kütüphanenizden çıkaracaktır. Dilediğiniz zaman arama veya keşfet bölümünden tekrar ekleyebilirsiniz.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B0C0E] hover:bg-[#232833] text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-[#232833] transition cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Evet, Listeden Kaldır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
