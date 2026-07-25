import React, { useState } from 'react';
import { Star, Eye, CheckCircle2, MessageSquare, AlertTriangle, UserPlus, UserCheck, Flame, Heart, Search, X, Users, ArrowRight } from 'lucide-react';
import { ActivityFeedItem, Profile } from '../types';
import { EmptyState } from './EmptyState';

interface ActivityFeedViewProps {
  activities: ActivityFeedItem[];
  onSelectMediaById: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  onNavigateToProfile?: (username: string) => void;
  followingUserIds?: string[];
  onToggleFollowUser?: (userId: string) => void;
}

export const ActivityFeedView: React.FC<ActivityFeedViewProps> = ({
  activities,
  onSelectMediaById,
  onNavigateToProfile,
  followingUserIds = [],
  onToggleFollowUser
}) => {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [likedActivities, setLikedActivities] = useState<Record<string, boolean>>({});
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLike = (id: string) => {
    setLikedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter friends based on query
  const normalizedQuery = friendSearchQuery.trim().toLowerCase().replace(/^@/, '');
  
  let matchingUsers: Profile[] = [];



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
      
      {/* 1. ARKADAŞ ARAMA ÇUBUĞU & KEŞFET PANELİ */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">Arkadaş Bul & Takip Et</h2>
              <p className="text-xs text-slate-400">Sinema sever kullanıcı adlarını aratarak profillerini incele veya takip et</p>
            </div>
          </div>
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



        {/* Arama Sonuçları VEYA Önerilen Kullanıcı Kartları */}
        {friendSearchQuery.trim().length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-[#232833]">
            <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>Arama Sonuçları ({matchingUsers.length})</span>
              <button 
                onClick={() => setFriendSearchQuery('')}
                className="text-[11px] text-[#E63946] hover:underline font-semibold cursor-pointer"
              >
                Aramayı Temizle
              </button>
            </div>

            {matchingUsers.length === 0 ? (
              <div className="text-center py-6 bg-[#0B0C0E] rounded-xl border border-[#232833] space-y-1">
                <p className="text-xs text-slate-400 font-medium">"{friendSearchQuery}" ile eşleşen kullanıcı bulunamadı.</p>
                <p className="text-[11px] text-slate-500">Lütfen farklı bir kullanıcı adı veya isim deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchingUsers.map(user => {
                  const isFollowing = followingUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="bg-[#0B0C0E] border border-[#232833] hover:border-[#323947] rounded-xl p-3 flex items-center justify-between gap-3 transition shadow-md"
                    >
                      {/* Profile Click */}
                      <div 
                        onClick={() => onNavigateToProfile && onNavigateToProfile(user.username)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                        title={`${user.full_name || user.username} profilini gör`}
                      >
                        <img
                          src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-[#E63946] transition shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-[#E63946] transition truncate">
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

      {/* Feed List */}
      <div className="space-y-4">
        {(() => {
          const validActivities = activities.filter(a => 
            (a.details?.media_title || a.media_title) && 
            (a.profile?.username || (a.username && a.username !== 'kullanıcı'))
          );

          if (validActivities.length === 0) {
            return (
              <EmptyState
                title="Sosyal Akış Henüz Boş"
                description="Takip ettiğiniz arkadaşlarınızın aktivite ve değerlendirmeleri burada görünecektir."
                iconType="eye"
              />
            );
          }

          return validActivities.map((item) => {
          const profile = item.profile || { username: 'Kullanıcı', full_name: 'TV Time Üyesi', avatar_url: '' };
          const details = item.details || {};
          const isSpoiler = details.contains_spoiler;
          const isRevealed = revealedSpoilers[item.id];
          const isLiked = likedActivities[item.id];

          return (
            <div 
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 space-y-3 transition shadow-lg"
            >
              {/* Header Profile Row */}
              <div className="flex items-center justify-between">
                <div 
                  onClick={() => profile.username && onNavigateToProfile && onNavigateToProfile(profile.username)}
                  className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-lg hover:bg-slate-800/60 transition"
                  title={`${profile.full_name || profile.username} profilini gör`}
                >
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={profile.username}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-[#E63946] transition"
                  />
                  <div>
                    <div className="text-sm font-bold text-white leading-tight group-hover:text-[#E63946] transition">
                      {profile.full_name || profile.username}
                    </div>
                    <div className="text-[11px] text-[#E63946] font-semibold hover:underline">
                      @{profile.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderActionBadge(item)}
                </div>
              </div>

              {/* Main Media Card inside feed */}
              {item.media_id ? (
                <div 
                  onClick={() => item.media_id && onSelectMediaById(item.media_id, item.media_type || 'tv')}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-4 cursor-pointer hover:border-slate-700 transition"
                >
                  {details.media_poster && (
                    <img
                      src={details.media_poster}
                      alt={details.media_title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-16 object-cover rounded-lg shrink-0 shadow"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-amber-300 hover:underline truncate">
                      {details.media_title || 'İsimsiz Yapım'}
                    </h4>

                    {details.season_number && details.episode_number && (
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        Sezon {details.season_number}, Bölüm {details.episode_number}
                        {details.episode_name && <span className="text-slate-400"> - "{details.episode_name}"</span>}
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
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {details.media_title}
                </div>
              )}

              {/* Review Text Body */}
              {details.review_text && (
                <div className="pt-1">
                  {isSpoiler && !isRevealed ? (
                    <div 
                      onClick={() => toggleSpoiler(item.id)}
                      className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-center cursor-pointer hover:bg-amber-950/50 transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>SPOILER İÇERİR - Görmek İçin Tıkla</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      "{details.review_text}"
                    </p>
                  )}
                </div>
              )}

              {/* Footer action bar (Like button, timestamp) */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                <span>{new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>

                <button
                  onClick={() => toggleLike(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-semibold text-xs ${
                    isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                  <span>{isLiked ? 'Beğenildi' : 'Beğen'}</span>
                </button>
              </div>

            </div>
          );
        })
      })()}
      </div>

    </div>
  );
};
