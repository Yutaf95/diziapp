import React, { useState } from 'react';
import { Activity, Star, Eye, MessageSquare, ThumbsUp, Send, Sparkles, UserPlus } from 'lucide-react';
import { ActivityFeedItem, Profile } from '../types';
import { UserAvatar } from './UserAvatar';

interface SocialFeedSidebarProps {
  activities: ActivityFeedItem[];
  onSelectMediaById: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  currentUser?: Profile;
  onNavigateToProfile?: (username: string) => void;
  onAddActivity?: (content: string) => void;
}

export const SocialFeedSidebar: React.FC<SocialFeedSidebarProps> = ({
  activities,
  onSelectMediaById,
  currentUser,
  onNavigateToProfile,
  onAddActivity
}) => {
  const [likedActivities, setLikedActivities] = useState<Record<string, boolean>>({});
  const [quickPostText, setQuickPostText] = useState('');

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Aramızda';
      if (diffMinutes < 60) return `${diffMinutes}d önce`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}s önce`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}g önce`;
    } catch {
      return 'Yakın zamanda';
    }
  };

  return (
    <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
      
      {/* Header Card */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center text-[#E63946]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white">Sosyal Akış</h2>
            <p className="text-[10px] text-slate-400">Arkadaşlarının canlı aktiviteleri</p>
          </div>
        </div>

        <span className="text-[10px] bg-[#E63946] text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
          Canlı
        </span>
      </div>

      {/* Quick Status / Post Input Box */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-3 shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          {currentUser?.avatar_url && (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              className="w-7 h-7 rounded-full object-cover border border-[#E63946]"
            />
          )}
          <input
            type="text"
            value={quickPostText}
            onChange={(e) => setQuickPostText(e.target.value)}
            placeholder="Ne izliyorsun? Arkadaşlarınla paylaş..."
            className="w-full bg-[#0B0C0E] border border-[#232833] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#E63946]"
          />
        </div>
        {quickPostText.trim() && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (onAddActivity) {
                  onAddActivity(quickPostText.trim());
                } else {
                  alert(`Paylaşıldı: "${quickPostText}"`);
                }
                setQuickPostText('');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#E63946] text-white text-xs font-bold rounded-lg shadow"
            >
              <Send className="w-3 h-3" /> Paylaş
            </button>
          </div>
        )}
      </div>

      {/* Activity List - Chronological Vertical Cards */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs font-bold text-slate-300">Henüz aktivite bulunmuyor</p>
            <p className="text-[11px] text-slate-500">Arkadaşlarınızın paylaşımları ve izleme hareketleri burada görünecektir.</p>
          </div>
        ) : (
          activities.map((item) => {
          const profile = item.profile;
          const isLiked = likedActivities[item.id];

          return (
            <div
              key={item.id}
              onClick={() => item.media_id && item.media_type && onSelectMediaById(item.media_id, item.media_type)}
              className="bg-[#14171D] border border-[#232833] hover:border-[#E63946]/50 rounded-2xl p-3.5 shadow-md hover:shadow-lg transition cursor-pointer group space-y-2.5"
            >
              {/* User Avatar & Header */}
              <div className="flex items-center justify-between gap-2">
                <div 
                  onClick={(e) => {
                    if (profile?.username && onNavigateToProfile) {
                      e.stopPropagation();
                      onNavigateToProfile(profile.username);
                    }
                  }}
                  className="flex items-center gap-2.5 hover:opacity-80 transition cursor-pointer p-0.5 rounded-lg hover:bg-white/5"
                  title={`${profile?.full_name || 'Kullanıcı'} profilini gör`}
                >
                  <UserAvatar
                    user={profile}
                    size="xs"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight hover:text-[#E63946] transition-colors">
                      {profile?.full_name || 'Arkadaşın'}
                    </h4>
                    <span className="text-[10px] text-[#E63946] font-semibold hover:underline">@{profile?.username || 'kullanici'}</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {formatTimestamp(item.created_at)}
                </span>
              </div>

              {/* Action Details Card */}
              <div className="bg-[#0B0C0E] border border-[#232833] rounded-xl p-2.5 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  
                  {/* Action Description */}
                  {item.action_type === 'episode_watched' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
                      <span className="truncate">
                        <strong className="text-white">{item.details?.media_title}</strong> S{item.details?.season_number?.toString().padStart(2, '0')}E{item.details?.episode_number?.toString().padStart(2, '0')} izledi
                      </span>
                    </div>
                  )}

                  {item.action_type === 'review_added' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="truncate">
                          <strong className="text-white">{item.details?.media_title}</strong> için <span className="text-amber-400 font-bold">{item.details?.rating}/10</span> verdi
                        </span>
                      </div>
                      {item.details?.review_text && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 pl-2 border-l-2 border-[#E63946]">
                          "{item.details.review_text}"
                        </p>
                      )}
                    </div>
                  )}

                  {item.action_type === 'rating_given' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-white">{item.details?.media_title}</strong> yapımına <span className="text-amber-400 font-bold">{item.details?.rating}/10</span> verdi
                      </span>
                    </div>
                  )}

                  {item.action_type === 'status_update' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
                      <span className="truncate">
                        {item.media_id ? (
                          <>
                            <strong className="text-white">{item.details?.media_title}</strong> listesine eklendi
                          </>
                        ) : (
                          <strong className="text-white">{item.details?.media_title}</strong>
                        )}
                      </span>
                    </div>
                  )}

                </div>

                {/* Poster Thumbnail */}
                {item.details?.media_poster && (
                  <img
                    src={item.details.media_poster}
                    alt={item.details?.media_title || 'Poster'}
                    className="w-9 h-12 rounded-lg object-cover border border-[#232833] shrink-0"
                  />
                )}
              </div>

              {/* Card Footer: Interaction Like / Comment */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <button
                  onClick={(e) => toggleLike(item.id, e)}
                  className={`flex items-center gap-1 hover:text-[#E63946] transition ${isLiked ? 'text-[#E63946] font-bold' : ''}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#E63946]' : ''}`} />
                  <span>{isLiked ? 'Beğendin' : 'Beğen'}</span>
                </button>

                <div className="flex items-center gap-1 hover:text-slate-200 transition">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Yorum Yap</span>
                </div>
              </div>

            </div>
          );
        }))}
      </div>

    </aside>
  );
};
