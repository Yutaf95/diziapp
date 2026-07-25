import React, { useState } from 'react';
import { 
  FolderPlus, Heart, Sparkles, Flame, Film, Tv, Folder, Star, Rocket, 
  Clapperboard, Plus, Trash2, Edit3, ArrowLeft, X, Search, Check, 
  Bookmark, ShieldAlert, Layers
} from 'lucide-react';
import { CustomCollection, CollectionItem, TMDBMedia, WatchStatus } from '../types';
import { getPosterUrl } from '../lib/tmdb';

interface CollectionsViewProps {
  collections: CustomCollection[];
  onCreateCollection: (title: string, description: string, color: string, icon: string) => void;
  onUpdateCollection: (collectionId: string, title: string, description: string, color: string, icon: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onRemoveItemFromCollection: (collectionId: string, mediaId: number, mediaType: 'movie' | 'tv') => void;
  onAddItemToCollection: (collectionId: string, item: Omit<CollectionItem, 'added_at'>) => void;
  onSelectMediaById: (id: number, type: 'movie' | 'tv') => void;
  userWatchList: WatchStatus[];
  selectedCollectionId?: string | null;
  onSelectCollectionId: (id: string | null) => void;
}

const COLOR_OPTIONS = [
  { name: 'Kırmızı', value: '#E63946', bgClass: 'bg-[#E63946]' },
  { name: 'Mavi', value: '#3B82F6', bgClass: 'bg-blue-500' },
  { name: 'Yeşil', value: '#10B981', bgClass: 'bg-emerald-500' },
  { name: 'Kehribar', value: '#F59E0B', bgClass: 'bg-amber-500' },
  { name: 'Mor', value: '#8B5CF6', bgClass: 'bg-purple-500' },
  { name: 'Gül', value: '#EC4899', bgClass: 'bg-pink-500' },
  { name: 'Turkuaz', value: '#06B6D4', bgClass: 'bg-cyan-500' },
];

const ICON_OPTIONS = [
  { id: 'Heart', label: 'Kalp', Icon: Heart },
  { id: 'Sparkles', label: 'Işıltı', Icon: Sparkles },
  { id: 'Flame', label: 'Alev', Icon: Flame },
  { id: 'Film', label: 'Film', Icon: Film },
  { id: 'Tv', label: 'Dizi', Icon: Tv },
  { id: 'Star', label: 'Yıldız', Icon: Star },
  { id: 'Rocket', label: 'Roket', Icon: Rocket },
  { id: 'Folder', label: 'Klasör', Icon: Folder },
];

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onRemoveItemFromCollection,
  onAddItemToCollection,
  onSelectMediaById,
  userWatchList,
  selectedCollectionId,
  onSelectCollectionId,
}) => {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CustomCollection | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#E63946');
  const [formIcon, setFormIcon] = useState('Folder');

  // Search filter for adding items modal
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const activeCollection = collections.find(c => c.id === selectedCollectionId) || null;

  const handleOpenCreateModal = () => {
    setEditingCollection(null);
    setFormTitle('');
    setFormDesc('');
    setFormColor('#E63946');
    setFormIcon('Folder');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (col: CustomCollection) => {
    setEditingCollection(col);
    setFormTitle(col.title);
    setFormDesc(col.description || '');
    setFormColor(col.color || '#E63946');
    setFormIcon(col.icon || 'Folder');
    setShowCreateModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingCollection) {
      onUpdateCollection(editingCollection.id, formTitle.trim(), formDesc.trim(), formColor, formIcon);
    } else {
      onCreateCollection(formTitle.trim(), formDesc.trim(), formColor, formIcon);
    }

    setShowCreateModal(false);
  };

  const renderIcon = (iconName?: string, className: string = "w-5 h-5") => {
    switch (iconName) {
      case 'Heart': return <Heart className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Film': return <Film className={className} />;
      case 'Tv': return <Tv className={className} />;
      case 'Star': return <Star className={className} />;
      case 'Rocket': return <Rocket className={className} />;
      default: return <Folder className={className} />;
    }
  };

  // Filter user's watchlist for adding items modal
  const activeCollectionMediaKeys = new Set(
    activeCollection?.items.map(i => `${i.media_type}_${i.media_id}`) || []
  );

  const filteredWatchlistForAdding = userWatchList.filter(item => {
    const isAlreadyAdded = activeCollectionMediaKeys.has(`${item.media_type}_${item.media_id}`);
    if (isAlreadyAdded) return false;
    if (!itemSearchQuery.trim()) return true;
    return (item.title || '').toLowerCase().includes(itemSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14171D] border border-[#232833] rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Listelerim</h1>
          </div>
          <p className="text-xs text-slate-400 pl-1">
            İzleme listenizdeki dizi ve filmleri tematik listelerde (Örn: Favorilerim, Bilim Kurgu, Hafta Sonu) gruplayın.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-bold shadow-lg shadow-[#E63946]/20 transition hover:scale-105 active:scale-95 shrink-0"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Yeni Liste</span>
        </button>
      </div>

      {/* SINGLE COLLECTION DETAIL VIEW */}
      {activeCollection ? (
        <div className="space-y-6">
          
          {/* Collection Hero Banner */}
          <div 
            style={{ borderColor: `${activeCollection.color || '#E63946'}40` }}
            className="relative bg-[#14171D] border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl overflow-hidden"
          >
            {/* Soft Ambient Background Blur */}
            <div 
              style={{ backgroundColor: activeCollection.color || '#E63946' }}
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none" 
            />

            <div className="flex items-center justify-between relative z-10">
              <button
                onClick={() => onSelectCollectionId(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-slate-200 hover:text-white text-xs font-bold transition border border-white/10 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#E63946]" />
                <span>Tüm Listelerime Dön</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(activeCollection)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10 text-xs font-semibold flex items-center gap-1.5"
                  title="Listeyi Düzenle"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Düzenle</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`"${activeCollection.title}" listesini silmek istediğinizden emin misiniz?`)) {
                      onDeleteCollection(activeCollection.id);
                      onSelectCollectionId(null);
                    }
                  }}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition border border-red-500/20 text-xs font-semibold flex items-center gap-1.5"
                  title="Listeyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sil</span>
                </button>
              </div>
            </div>

            {/* Title & Info */}
            <div className="flex items-start gap-4 relative z-10 pt-2">
              {(() => {
                const itemWithPoster = activeCollection.items.find(i => i.poster_path) || activeCollection.items[0];
                const posterUrl = itemWithPoster ? getPosterUrl(itemWithPoster.poster_path) : null;

                return posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={activeCollection.title}
                    className="w-14 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 shrink-0"
                  />
                ) : (
                  <div 
                    style={{ backgroundColor: `${activeCollection.color || '#E63946'}20`, color: activeCollection.color || '#E63946', borderColor: `${activeCollection.color || '#E63946'}40` }}
                    className="p-3.5 rounded-2xl border shrink-0 shadow-lg"
                  >
                    <Folder className="w-8 h-8" />
                  </div>
                );
              })()}

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeCollection.title}
                  </h2>
                  <span 
                    style={{ backgroundColor: `${activeCollection.color || '#E63946'}20`, color: activeCollection.color || '#E63946' }}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border border-white/10"
                  >
                    {activeCollection.items.length} İçerik
                  </span>
                </div>
                {activeCollection.description && (
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {activeCollection.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5 relative z-10">
              <span className="text-xs text-slate-400 font-medium">
                Bu listedeki dizi ve filmler ({activeCollection.items.length})
              </span>

              <button
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 shadow-md"
              >
                <Plus className="w-4 h-4 text-[#E63946]" />
                <span>İçerik Ekle</span>
              </button>
            </div>
          </div>

          {/* Items Grid */}
          {activeCollection.items.length === 0 ? (
            <div className="bg-[#14171D] border border-[#232833] rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Folder className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">Bu Liste Henüz Boş</h3>
                <p className="text-xs text-slate-400">
                  Kütüphanenizdeki dizi ve filmleri bu listeye ekleyerek sayfanızı kişiselleştirin.
                </p>
              </div>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E63946] text-white text-xs font-bold hover:bg-[#d62839] transition shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Kütüphanemden Ekle</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {activeCollection.items.map((item) => (
                <div
                  key={`${item.media_type}_${item.media_id}`}
                  className="bg-[#14171D] border border-[#232833] hover:border-[#E63946]/50 rounded-2xl p-2.5 space-y-2 group transition shadow-lg relative flex flex-col justify-between"
                >
                  <div 
                    onClick={() => onSelectMediaById(item.media_id, item.media_type)}
                    className="cursor-pointer space-y-2"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/40">
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={item.title || 'Poster'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-400 flex items-center gap-1 border border-white/10">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{item.vote_average ? item.vote_average.toFixed(1) : '8.0'}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-white/10">
                        {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                      </div>
                    </div>

                    <div className="px-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E63946] transition">
                        {item.title || 'İçerik İsmi'}
                      </h4>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItemFromCollection(activeCollection.id, item.media_id, item.media_type)}
                    className="w-full py-1.5 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold transition border border-red-500/20 flex items-center justify-center gap-1"
                    title="Listeden Çıkar"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Çıkar</span>
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* COLLECTIONS GRID LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => {
            const itemCount = col.items.length;
            const previewPosters = col.items.slice(0, 3);
            const firstItemWithPoster = col.items.find(i => i.poster_path) || col.items[0];
            const coverPosterUrl = firstItemWithPoster ? getPosterUrl(firstItemWithPoster.poster_path) : null;

            return (
              <div
                key={col.id}
                onClick={() => onSelectCollectionId(col.id)}
                style={{ borderColor: `${col.color || '#E63946'}30` }}
                className="bg-[#14171D] border rounded-3xl p-5 space-y-4 shadow-xl hover:border-[#E63946] transition duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Glow Effect */}
                <div 
                  style={{ backgroundColor: col.color || '#E63946' }}
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none" 
                />

                <div className="space-y-3 relative z-10">
                  {/* Top Bar with Random/First Movie Poster as Icon */}
                  <div className="flex items-center justify-between">
                    {coverPosterUrl ? (
                      <img
                        src={coverPosterUrl}
                        alt={col.title}
                        className="w-10 h-14 rounded-xl object-cover shadow-md border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div 
                        style={{ backgroundColor: `${col.color || '#E63946'}20`, color: col.color || '#E63946', borderColor: `${col.color || '#E63946'}30` }}
                        className="p-2.5 rounded-2xl border shrink-0"
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                    )}

                    <span className="text-xs font-mono font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                      {itemCount} Yapım
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#E63946] transition">
                      {col.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {col.description || 'Kişisel listeniz.'}
                    </p>
                  </div>
                </div>

                {/* Poster Collage Preview */}
                <div className="pt-2 border-t border-white/5 relative z-10 flex items-center justify-between">
                  <div className="flex items-center -space-x-3 overflow-hidden py-1">
                    {previewPosters.length > 0 ? (
                      previewPosters.map((item, idx) => (
                        <img
                          key={item.media_id + '_' + idx}
                          src={getPosterUrl(item.poster_path)}
                          alt={item.title || 'Poster'}
                          className="w-9 h-12 rounded-lg object-cover border-2 border-[#14171D] shadow-md shrink-0"
                        />
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium italic">Henüz içerik eklenmedi</span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#E63946] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    İncele &rarr;
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT COLLECTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#14171D] border border-[#232833] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#232833] pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                  <FolderPlus className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingCollection ? 'Listeyi Düzenle' : 'Yeni Liste Oluştur'}
                </h3>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Liste Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Favorilerim, Marvel Maratonu, Başyapıtlar"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Bu listedeki yapımlar hakkında kısa notlar..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition resize-none"
                />
              </div>

              {/* Color Theme */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Renk Teması
                </label>
                <div className="flex items-center gap-3">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setFormColor(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        formColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-bold transition shadow-lg shadow-[#E63946]/20"
                >
                  {editingCollection ? 'Kaydet' : 'Oluştur'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD ITEM FROM WATCHLIST MODAL */}
      {showAddItemModal && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#14171D] border border-[#232833] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#232833] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">İçerik Ekle</h3>
                <p className="text-xs text-slate-400">"{activeCollection.title}" koleksiyonuna takip listenizden ekleyin</p>
              </div>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Takip listenizde ara..."
                value={itemSearchQuery}
                onChange={e => setItemSearchQuery(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1 scrollbar-thin scrollbar-thumb-white/10">
              {filteredWatchlistForAdding.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Eklenebilecek uygun içerik bulunamadı.
                </div>
              ) : (
                filteredWatchlistForAdding.map((item) => (
                  <div
                    key={`${item.media_type}_${item.media_id}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0B0C0E] border border-[#232833] hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={item.title || 'Poster'}
                        className="w-10 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddItemToCollection(activeCollection.id, {
                          media_id: item.media_id,
                          media_type: item.media_type,
                          title: item.title,
                          poster_path: item.poster_path,
                          vote_average: item.vote_average
                        });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-bold transition shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ekle</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#232833] flex justify-end">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Tamam
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
