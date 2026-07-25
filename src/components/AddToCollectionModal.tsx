import React, { useState } from 'react';
import { X, Layers, Plus, Check, Folder, Film } from 'lucide-react';
import { CustomCollection, CollectionItem, TMDBMedia } from '../types';
import { getPosterUrl } from '../lib/tmdb';

interface AddToCollectionModalProps {
  media: TMDBMedia;
  collections: CustomCollection[];
  onClose: () => void;
  onToggleItemInCollection: (collectionId: string, item: Omit<CollectionItem, 'added_at'>) => void;
  onCreateCollection: (title: string, description: string, color: string, icon: string) => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  media,
  collections,
  onClose,
  onToggleItemInCollection,
  onCreateCollection,
}) => {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const title = media.title || media.name || 'İçerik';
  const isTv = media.media_type === 'tv' || !!media.first_air_date;
  const mediaType = isTv ? 'tv' : 'movie';

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCollection(newTitle.trim(), '', '#E63946', 'Folder');
    setNewTitle('');
    setShowQuickCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#14171D] border border-[#232833] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232833] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Listeye Ekle</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collections checklist */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {collections.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Henüz oluşturulmuş bir listeniz yok.</p>
          ) : (
            collections.map(col => {
              const isInCollection = col.items.some(
                i => i.media_id === media.id && i.media_type === mediaType
              );

              const firstItemWithPoster = col.items.find(i => i.poster_path) || col.items[0];
              const posterUrl = firstItemWithPoster ? getPosterUrl(firstItemWithPoster.poster_path) : null;

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    onToggleItemInCollection(col.id, {
                      media_id: media.id,
                      media_type: mediaType,
                      title: title,
                      poster_path: media.poster_path,
                      vote_average: media.vote_average
                    });
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left ${
                    isInCollection
                      ? 'bg-[#E63946]/15 border-[#E63946]/40 text-white font-bold'
                      : 'bg-[#0B0C0E] border-[#232833] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={col.title}
                        className="w-8 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs truncate">{col.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{col.items.length} içerik</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ml-2 shrink-0 ${
                    isInCollection ? 'bg-[#E63946] border-[#E63946] text-white' : 'border-slate-600'
                  }`}>
                    {isInCollection && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Create option */}
        {showQuickCreate ? (
          <form onSubmit={handleQuickCreate} className="space-y-2 pt-2 border-t border-[#232833]">
            <input
              type="text"
              required
              placeholder="Yeni Liste İsmi..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-[#E63946] text-white text-xs font-bold"
              >
                Oluştur
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowQuickCreate(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#E63946]" />
            <span>+ Yeni Liste Oluştur</span>
          </button>
        )}

        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};
