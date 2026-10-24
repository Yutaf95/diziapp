import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Plus, Trash2, Edit2, Globe, Search, Play, Check, X, Tv, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomWatchLink } from '../types';
import {
  getLinksForMedia,
  addWatchLink,
  updateWatchLink,
  deleteWatchLink,
  analyzeEpisodeUrl,
  generateEpisodeUrl,
  extractCleanSiteName,
} from '../utils/watchLinksStorage';

interface WatchLinksBoxProps {
  mediaId: number;
  mediaTitle: string;
  isTv: boolean;
  nextEpisode?: {
    seasonNumber: number;
    episodeNumber: number;
    name?: string;
  } | null;
  currentSeasonNum?: number;
}

export const WatchLinksBox: React.FC<WatchLinksBoxProps> = ({
  mediaId,
  mediaTitle,
  isTv,
  nextEpisode,
  currentSeasonNum,
}) => {
  const [links, setLinks] = useState<CustomWatchLink[]>(() => getLinksForMedia(mediaId));
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Form states - Only URL is required, siteName is automatically extracted!
  const [url, setUrl] = useState('');
  const [isEpisodeSpecific, setIsEpisodeSpecific] = useState(false);
  const [specSeason, setSpecSeason] = useState<number>(nextEpisode?.seasonNumber || currentSeasonNum || 1);
  const [specEpisode, setSpecEpisode] = useState<number>(nextEpisode?.episodeNumber || 1);
  const [formError, setFormError] = useState('');

  // Sync state on updates or mediaId change
  useEffect(() => {
    setLinks(getLinksForMedia(mediaId));

    const handleUpdate = () => {
      setLinks(getLinksForMedia(mediaId));
    };

    window.addEventListener('diziapp_watch_links_updated', handleUpdate);
    return () => {
      window.removeEventListener('diziapp_watch_links_updated', handleUpdate);
    };
  }, [mediaId]);

  // Real-time URL analysis preview in form
  const liveAnalysis = useMemo(() => {
    if (!url.trim()) return null;
    const siteName = extractCleanSiteName(url);
    const pattern = isTv ? analyzeEpisodeUrl(url, isEpisodeSpecific ? specSeason : undefined, isEpisodeSpecific ? specEpisode : undefined) : null;
    return { siteName, pattern };
  }, [url, isTv, isEpisodeSpecific, specSeason, specEpisode]);

  const openAddForm = (forNextEp: boolean = false) => {
    setEditingLinkId(null);
    setUrl('');
    setFormError('');
    setIsExpanded(true);
    if (forNextEp && nextEpisode) {
      setIsEpisodeSpecific(true);
      setSpecSeason(nextEpisode.seasonNumber);
      setSpecEpisode(nextEpisode.episodeNumber);
    } else {
      setIsEpisodeSpecific(false);
      setSpecSeason(nextEpisode?.seasonNumber || currentSeasonNum || 1);
      setSpecEpisode(nextEpisode?.episodeNumber || 1);
    }
    setIsFormOpen(true);
  };

  const openEditForm = (link: CustomWatchLink) => {
    setEditingLinkId(link.id);
    setUrl(link.url);
    setFormError('');
    setIsExpanded(true);
    if (link.season_number !== undefined && link.episode_number !== undefined) {
      setIsEpisodeSpecific(true);
      setSpecSeason(link.season_number);
      setSpecEpisode(link.episode_number);
    } else {
      setIsEpisodeSpecific(false);
      setSpecSeason(nextEpisode?.seasonNumber || currentSeasonNum || 1);
      setSpecEpisode(nextEpisode?.episodeNumber || 1);
    }
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setFormError('Lütfen bir site linki veya URL girin.');
      return;
    }

    const autoSiteName = extractCleanSiteName(url);
    const pattern = isTv ? analyzeEpisodeUrl(url, isEpisodeSpecific ? specSeason : undefined, isEpisodeSpecific ? specEpisode : undefined) : null;

    if (editingLinkId) {
      updateWatchLink(editingLinkId, {
        site_name: autoSiteName,
        url: url,
        url_template: pattern?.urlTemplate,
        pad_season: pattern?.padSeason,
        pad_episode: pattern?.padEpisode,
        season_number: isEpisodeSpecific ? Number(specSeason) : pattern?.detectedSeason,
        episode_number: isEpisodeSpecific ? Number(specEpisode) : pattern?.detectedEpisode,
      });
    } else {
      addWatchLink({
        media_id: mediaId,
        site_name: autoSiteName,
        url: url,
        url_template: pattern?.urlTemplate,
        pad_season: pattern?.padSeason,
        pad_episode: pattern?.padEpisode,
        season_number: isEpisodeSpecific ? Number(specSeason) : pattern?.detectedSeason,
        episode_number: isEpisodeSpecific ? Number(specEpisode) : pattern?.detectedEpisode,
      });
    }

    setIsFormOpen(false);
    setEditingLinkId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWatchLink(id);
  };

  const openLink = (linkUrl: string) => {
    let target = linkUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const openGoogleSearch = () => {
    let query = '';
    if (isTv && nextEpisode) {
      query = `${mediaTitle} ${nextEpisode.seasonNumber}. Sezon ${nextEpisode.episodeNumber}. Bölüm izle`;
    } else if (isTv) {
      query = `${mediaTitle} izle`;
    } else {
      query = `${mediaTitle} filmi izle`;
    }
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // Find smart template link for the next episode
  const smartLink = useMemo(() => {
    return links.find(l => !!l.url_template) || null;
  }, [links]);

  const smartNextEpisodeUrl = useMemo(() => {
    if (!smartLink || !nextEpisode) return null;
    return generateEpisodeUrl(smartLink, nextEpisode.seasonNumber, nextEpisode.episodeNumber);
  }, [smartLink, nextEpisode]);

  return (
    <div className="bg-[#14171D] border border-[#232833] hover:border-slate-700/80 rounded-2xl shadow-lg overflow-hidden transition-all">
      {/* 1. Header Row - Clickable Accordion Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none transition bg-[#14171D] hover:bg-[#1A1D24]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E63946]/10 border border-[#E63946]/20 flex items-center justify-center text-[#E63946] shrink-0 shadow-sm">
            <Tv className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#E63946] flex items-center gap-2">
              <span>Buradan İzleyebilirsin</span>
              {links.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-[#232833] text-slate-300 px-2 py-0.5 rounded-full">
                  {links.length} {links.length === 1 ? 'Link' : 'Link'}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm sm:max-w-md">
              {isExpanded 
                ? 'İzleme linkini yapıştırın; sonraki bölümler otomatik hazırlanır'
                : links.length > 0
                ? `${links.map(l => l.site_name).join(', ')} • Görmek ve yönetmek için tıklayın`
                : 'Özel izleme sitelerini eklemek için tıklayın'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openAddForm(false)}
            className="text-xs font-bold text-slate-200 hover:text-white bg-[#1A1D24] hover:bg-[#232833] border border-[#232833] hover:border-[#E63946]/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#E63946]" />
            <span className="hidden sm:inline">Link Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white transition rounded-xl hover:bg-[#232833] cursor-pointer"
            title={isExpanded ? 'Gizle' : 'Genişlet'}
          >
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Collapsible Expanded Body Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-t border-[#232833] p-4 sm:p-5 space-y-4 bg-[#14171D]"
          >
            {/* Add / Edit Single-Input Form */}
            <AnimatePresence>
              {isFormOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleSave}
                    className="bg-[#0B0C0E] border border-[#232833] rounded-xl p-4 space-y-3 shadow-inner"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[#232833]">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#E63946]" />
                        <span>{editingLinkId ? 'İzleme Linkini Düzenle' : 'İzleme Linki Yapıştır'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {formError && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {formError}
                      </div>
                    )}

                    {/* Single URL Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          İzleme Sitesi Linki / URL <span className="text-[#E63946]">*</span>
                        </label>
                        {liveAnalysis && (
                          <span className="text-[10px] font-bold bg-[#14171D] text-slate-300 border border-[#232833] px-2 py-0.5 rounded-md">
                            Site: <strong className="text-white">{liveAnalysis.siteName}</strong>
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            setUrl(e.target.value);
                            if (formError) setFormError('');
                          }}
                          placeholder="https://... (Örn: https://sezonlukdizi.vip/... veya dizipal...)"
                          required
                          autoFocus
                          className="w-full bg-[#14171D] border border-[#232833] focus:border-[#E63946] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition"
                        />
                      </div>
                    </div>

                    {/* Real-time Pattern Detection Badge */}
                    {liveAnalysis?.pattern && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold">
                            ✨ Bölüm Yapısı Algılandı ({liveAnalysis.pattern.detectedSeason}. Sezon {liveAnalysis.pattern.detectedEpisode}. Bölüm)
                          </div>
                          <div className="text-[11px] text-amber-400/80">
                            Sıradaki bölümler bu bağlantı şablonuna göre otomatik olarak açılacaktır.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Optional Episode Hint Settings (if not auto-detected) */}
                    {isTv && !liveAnalysis?.pattern && (
                      <div className="pt-2 border-t border-[#232833]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isEpisodeSpecific}
                            onChange={(e) => setIsEpisodeSpecific(e.target.checked)}
                            className="rounded accent-[#E63946] w-4 h-4 bg-[#14171D] border-[#232833]"
                          />
                          <span className="text-xs text-slate-300">
                            Bu link belirli bir bölüme mi ait? (Şablon öğrenimi için)
                          </span>
                        </label>

                        {isEpisodeSpecific && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-bold">Sezon:</span>
                              <input
                                type="number"
                                min="1"
                                value={specSeason}
                                onChange={(e) => setSpecSeason(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 bg-[#14171D] border border-[#232833] focus:border-[#E63946] focus:outline-none rounded-lg px-2 py-1 text-xs text-white text-center"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-bold">Bölüm:</span>
                              <input
                                type="number"
                                min="1"
                                value={specEpisode}
                                onChange={(e) => setSpecEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 bg-[#14171D] border border-[#232833] focus:border-[#E63946] focus:outline-none rounded-lg px-2 py-1 text-xs text-white text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-[#14171D] hover:bg-[#232833] transition cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E63946] hover:bg-[#D62828] transition shadow-md shadow-[#E63946]/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingLinkId ? 'Güncelle' : 'Kaydet'}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Episode Quick Bar with Auto-Learned Target Link */}
            {isTv && nextEpisode && (
              <div className="bg-[#0B0C0E]/80 border border-[#232833] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-amber-300 truncate flex items-center gap-1.5">
                      <span>Sıradaki: S{nextEpisode.seasonNumber}E{nextEpisode.episodeNumber}</span>
                      {nextEpisode.name && <span className="opacity-80 truncate">• {nextEpisode.name}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {smartNextEpisodeUrl && smartLink
                        ? `Otomatik Şablon: ${smartLink.site_name} üzerinden doğrudan açılır`
                        : 'Tek tıkla internette ara veya doğrudan izle'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  {/* If smart template exists, direct 1-click button for the next episode! */}
                  {smartNextEpisodeUrl && smartLink ? (
                    <button
                      type="button"
                      onClick={() => openLink(smartNextEpisodeUrl)}
                      className="group flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer select-none"
                      title={`${smartLink.site_name} üzerinde S${nextEpisode.seasonNumber}B${nextEpisode.episodeNumber} bölümünü aç`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current transition-transform duration-150 ease-out group-hover:scale-90 group-active:scale-75" />
                      <span>S{nextEpisode.seasonNumber}B{nextEpisode.episodeNumber}'ü {smartLink.site_name}'da Aç</span>
                    </button>
                  ) : null}

                  {/* Google Search Fallback */}
                  <button
                    type="button"
                    onClick={openGoogleSearch}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                      smartNextEpisodeUrl
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
                        : 'flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                    }`}
                    title="Google'da bu bölümü ara"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>{smartNextEpisodeUrl ? 'Ara' : `S${nextEpisode.seasonNumber}B${nextEpisode.episodeNumber} Ara`}</span>
                  </button>

                  {/* Quick Add Episode Link Button */}
                  <button
                    type="button"
                    onClick={() => openAddForm(true)}
                    className="p-1.5 bg-[#14171D] hover:bg-[#232833] text-slate-300 hover:text-white border border-[#232833] rounded-xl transition cursor-pointer"
                    title="Bu bölüme ait link yapıştır"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Saved Links Grid */}
            {links.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {links.map((link) => {
                  const hasTemplate = !!link.url_template;
                  const targetClickUrl = (hasTemplate && nextEpisode)
                    ? generateEpisodeUrl(link, nextEpisode.seasonNumber, nextEpisode.episodeNumber)
                    : link.url;

                  return (
                    <div
                      key={link.id}
                      onClick={() => openLink(targetClickUrl)}
                      className={`group relative bg-[#0B0C0E] hover:bg-[#1A1D24] border rounded-xl px-3.5 py-2.5 transition flex items-center gap-3 cursor-pointer shadow-sm select-none ${
                        hasTemplate
                          ? 'border-amber-500/30 hover:border-amber-400'
                          : 'border-[#232833] hover:border-[#E63946]/50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        hasTemplate
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-[#14171D] text-[#E63946] border-[#232833]'
                      }`}>
                        {hasTemplate ? <Sparkles className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate max-w-[150px]">
                            {link.site_name}
                          </span>
                          {hasTemplate && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/25 px-1.5 py-0.5 rounded">
                              Akıllı
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                          {hasTemplate && nextEpisode
                            ? `Sıradaki: S${nextEpisode.seasonNumber}E${nextEpisode.episodeNumber}`
                            : link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </div>
                      </div>

                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0 ml-1" />

                      {/* Edit/Delete Actions */}
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditForm(link)}
                          className="p-1 text-slate-400 hover:text-amber-400 rounded transition cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(link.id, e)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded transition cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="p-4 rounded-xl bg-[#0B0C0E]/50 border border-dashed border-[#232833] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    Bu yapım için henüz izleme linki eklemedin.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    İzlediğin herhangi bir bölümün linkini yapıştır; sonraki bölümler otomatik açılır.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAddForm(false)}
                    className="px-3.5 py-1.5 bg-[#E63946] hover:bg-[#D62828] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#E63946]/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Yapıştır</span>
                  </button>

                  <button
                    type="button"
                    onClick={openGoogleSearch}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Web'de ara"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>Web'de Ara</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
