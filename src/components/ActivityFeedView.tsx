import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Eye, 
  CheckCircle2, 
  MessageSquare, 
  AlertTriangle, 
  UserPlus, 
  UserCheck, 
  Flame, 
  Heart, 
  Search, 
  X, 
  Users, 
  ArrowRight, 
  Loader2,
  Clock,
  RefreshCw,
  Sparkles,
  Globe
} from 'lucide-react';
import { ActivityFeedItem, Profile, WatchStatus } from '../types';
import { EmptyState } from './EmptyState';
import { getTurkishAccusativeSuffix, getEpisodeAccusativeSuffix } from '../utils/textUtils';
import { DEFAULT_AVATAR_URL } from '../lib/constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAvatar } from './UserAvatar';

interface ActivityFeedViewProps {
  activities: ActivityFeedItem[];
  allActivities?: ActivityFeedItem[];
  onSelectMediaById: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  onNavigateToProfile?: (username: string) => void;
  followingUserIds?: string[];
  onToggleFollowUser?: (userId: string) => void;
  watchList?: WatchStatus[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({
  activities,
  allActivities = [],
  onSelectMediaById,
  onNavigateToProfile,
  followingUserIds = [],
  onToggleFollowUser,
  watchList = [],
  onRefresh,
  isRefreshing = false
}) => {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [likedActivities, setLikedActivities] = useState<Record<string, boolean>>({});
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [matchingUsers, setMatchingUsers] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [feedTab, setFeedTab] = useState<'following' | 'all'>('following');

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLike = (id: string) => {
    setLikedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Live query for user search in Supabase
  useEffect(() => {
    const query = friendSearchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!query) {
      setMatchingUsers([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(10);
          if (isMounted && data) {
            setMatchingUsers(data.map(u => ({
              id: u.id,
              username: u.username,
              full_name: u.full_name || u.username,
              avatar_url: u.avatar_url || '',
              bio: u.bio || ''
            })));
          }
        } else {
          if (isMounted) setMatchingUsers([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsSearchingUsers(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [friendSearchQuery]);

  // Strict 48-Hour Filter
  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const filterLast48Hours = (list: ActivityFeedItem[]) => {
    return list.filter(item => {
      if (!item.created_at) return false;
      const t = new Date(item.created_at).getTime();
      if (isNaN(t) || (now - t) > FORTY_EIGHT_HOURS_MS) return false;
      const hasMedia = item.details?.media_title || (item as any).media_title || item.action_type === 'status_update';
      return !!hasMedia;
    });
  };

  const validFollowingActivities = filterLast48Hours(activities);
  const validAllActivities = filterLast48Hours(allActivities.length > 0 ? allActivities : activities);

  const currentDisplayList = feedTab === 'following' ? validFollowingActivities : validAllActivities;

  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return 'Az önce';
    try {
      const time = new Date(dateStr).getTime();
      const diffMs = now - time;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 2) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHours < 24) return `${diffHours} sa önce`;
      return `Dün ${new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Yakın zamanda';
    }
  };

  const renderActionBadge = (item: ActivityFeedItem) => {
    switch (item.action_type) {
      case 'episode_watched':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Bölüm İzledi
          </span>
        );
      case 'review_added':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <MessageSquare className="w-3 h-3" /> Yorum Yazdı
          </span>
        );
      case 'status_update':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            <Eye className="w-3 h-3" /> Listesine Ekledi
          </span>
        );
      case 'rating_given':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
            <Star className="w-3 h-3" /> Puan Verdi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      
      {/* 1. HEADER & ARKADAŞ ARAMA ÇUBUĞU */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">Sosyal Akış</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" /> Son 48 Saat
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Arkadaşlarının ve topluluğun son 48 saatteki güncel aktiviteleri</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/40 text-xs font-bold text-slate-200 hover:text-white transition disabled:opacity-50 cursor-pointer"
                title="Akışı şimdi yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#E63946] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Seçici: Takip Ettiklerim vs Tüm Topluluk */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#232833]/60">
          <button
            type="button"
            onClick={() => setFeedTab('following')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              feedTab === 'following'
                ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/20'
                : 'bg-[#0B0C0E] text-slate-400 hover:text-white border border-[#232833]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Takip Ettiklerim</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              feedTab === 'following' ? 'bg-black/25 text-white font-black' : 'bg-[#232833] text-slate-300'
            }`}>
              {validFollowingActivities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              feedTab === 'all'
                ? 'bg-white text-black shadow-md font-extrabold'
                : 'bg-[#0B0C0E] text-slate-400 hover:text-white border border-[#232833]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tüm Topluluk</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              feedTab === 'all' ? 'bg-black/15 text-black font-black' : 'bg-[#232833] text-slate-300'
            }`}>
              {validAllActivities.length}
            </span>
          </button>
        </div>

        {/* Arama Input Kutusu */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            placeholder="Kullanıcı adı veya isim ara... (@zeynep_k, Ahmet, Selin...)"
            className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition shadow-inner"
          />
          {friendSearchQuery && (
            <button
              onClick={() => setFriendSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
              title="Aramayı temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Canlı Arama Sonuçları */}
        {friendSearchQuery.trim() && (
          <div className="border border-slate-800 bg-[#0B0C0E] rounded-xl p-3 divide-y divide-slate-800">
            {isSearchingUsers ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#E63946]" />
                <span>Kullanıcılar aranıyor...</span>
              </div>
            ) : matchingUsers.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                "{friendSearchQuery}" ile eşleşen kullanıcı bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {matchingUsers.map((user) => {
                  const isFollowing = followingUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 transition"
                    >
                      <div 
                        onClick={() => onNavigateToProfile && onNavigateToProfile(user.username)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <UserAvatar user={user} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white hover:text-[#E63946] transition truncate">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-[11px] font-semibold text-[#E63946] truncate">
                            @{user.username}
                          </div>
                          {user.bio && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {user.bio}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Follow Button */}
                      <button
                        onClick={() => onToggleFollowUser && onToggleFollowUser(user.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                          isFollowing
                            ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30'
                            : 'bg-[#E63946] text-white hover:bg-[#d62839] shadow-md shadow-[#E63946]/20'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Takipte</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Takip Et</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. FEED LİSTESİ (SON 48 SAAT) */}
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {(() => {
          if (currentDisplayList.length === 0) {
            if (feedTab === 'following' && validAllActivities.length > 0) {
              return (
                <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0C0E] border border-[#232833] flex items-center justify-center text-slate-500 mx-auto">
                    <Clock className="w-6 h-6 stroke-[1.5] text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Takip Ettiğin Kişilerden Son 48 Saatte Aktivite Yok</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Takip ettiğin kullanıcıların son 48 saatte henüz bir aktivitesi bulunmuyor. Topluluk akışına göz atabilirsin:
                  </p>
                  <button
                    type="button"
                    onClick={() => setFeedTab('all')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-extrabold transition shadow-lg shadow-[#E63946]/20 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Tüm Topluluk Akışına Bak ({validAllActivities.length} Aktivite)</span>
                  </button>
                </div>
              );
            }

            return (
              <EmptyState
                title="Son 48 Saatte Aktivite Yok"
                description="Sizin veya takip ettiğiniz kişilerin son 48 saatte izlediği bölümler ve yazdığı incelemeler burada canlı olarak listelenir."
                iconType="eye"
              />
            );
          }

          return currentDisplayList.map((item) => {
            const profile = item.profile || { username: 'Kullanıcı', full_name: 'ttime Üyesi', avatar_url: '' };
            const details = item.details || {};

            let resolvedTitle = details.media_title || (item as any).media_title;
            if (!resolvedTitle || resolvedTitle === 'Dizi' || resolvedTitle === 'Yapım' || resolvedTitle === 'Film') {
              const watchMatch = watchList?.find(w => Number(w.media_id) === Number(item.media_id));
              if (watchMatch?.title && watchMatch.title !== 'Dizi' && watchMatch.title !== 'Yapım') {
                resolvedTitle = watchMatch.title;
              }
            }
            details.media_title = resolvedTitle || details.media_title || 'Dizi';

            const isSpoiler = details.contains_spoiler;
            const isRevealed = revealedSpoilers[item.id];
            const isLiked = likedActivities[item.id];

            return (
              <div 
                key={item.id}
                className="bg-[#14171D] border border-[#232833] hover:border-[#2E3544] rounded-2xl p-5 space-y-3.5 transition shadow-lg"
              >
                {/* Header Profile Row */}
                <div className="flex items-center justify-between gap-3">
                  <div 
                    onClick={() => profile.username && onNavigateToProfile && onNavigateToProfile(profile.username)}
                    className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-lg hover:bg-white/5 transition min-w-0"
                    title={`${profile.full_name || profile.username} profilini gör`}
                  >
                    <img
                      src={profile.avatar_url || DEFAULT_AVATAR_URL}
                      alt={profile.username}
                      className="w-10 h-10 rounded-full object-cover border border-[#232833] group-hover:border-[#E63946] transition shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white leading-tight group-hover:text-[#E63946] transition truncate">
                        {profile.full_name || profile.username}
                      </div>
                      <div className="text-[11px] text-[#E63946] font-semibold hover:underline truncate">
                        @{profile.username}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderActionBadge(item)}
                  </div>
                </div>

                {/* Main Media Card inside feed */}
                {item.media_id ? (
                  <div 
                    onClick={() => item.media_id && onSelectMediaById(item.media_id, item.media_type || 'tv')}
                    className="bg-[#0B0C0E] border border-[#232833] rounded-xl p-3 flex items-center gap-3.5 cursor-pointer hover:border-[#E63946]/40 transition group"
                  >
                    {details.media_poster && (
                      <img
                        src={details.media_poster}
                        alt={details.media_title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-16 object-cover rounded-lg shrink-0 shadow group-hover:scale-105 transition duration-200"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-white group-hover:text-[#E63946] transition truncate">
                        {details.media_title || 'İsimsiz Yapım'}
                      </h4>

                      {details.season_number && details.episode_number && (
                        <div className="text-xs text-slate-300 font-bold mt-0.5">
                          S{details.season_number}B{details.episode_number}{getEpisodeAccusativeSuffix(details.episode_number)} izledi
                          {details.episode_name && <span className="text-slate-400 font-normal"> - "{details.episode_name}"</span>}
                        </div>
                      )}

                      {details.rating && (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {details.rating} / 10 Verildi
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B0C0E] border border-[#232833] p-4 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {details.media_title}
                  </div>
                )}

                {/* Review Text Body */}
                {details.review_text && (
                  <div className="pt-1">
                    {isSpoiler && !isRevealed ? (
                      <div 
                        onClick={() => toggleSpoiler(item.id)}
                        className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-center cursor-pointer hover:bg-amber-950/40 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span>SPOILER İÇERİR - Görmek İçin Tıkla</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0B0C0E] p-3 rounded-xl border border-[#232833]">
                        "{details.review_text}"
                      </p>
                    )}
                  </div>
                )}

                {/* Footer action bar (Timestamp with Clock icon & Like button) */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-[#232833]">
                  <div 
                    className="flex items-center gap-1.5 text-xs text-slate-400"
                    title={item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : ''}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#E63946]" />
                    <span>{formatActivityTime(item.created_at)}</span>
                  </div>

                  <button
                    onClick={() => toggleLike(item.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-semibold text-xs cursor-pointer ${
                      isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                    <span>{isLiked ? 'Beğenildi' : 'Beğen'}</span>
                  </button>
                </div>

              </div>
            );
          });
        })()}
      </div>

    </div>
  );
};
