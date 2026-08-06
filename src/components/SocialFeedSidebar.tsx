import React, { useState } from 'react';
import { Activity, Star, Eye, MessageSquare, ThumbsUp, Send, Sparkles, UserPlus } from 'lucide-react';
import { ActivityFeedItem, Profile } from '../types';
import { UserAvatar } from './UserAvatar';
import { getTurkishAccusativeSuffix, getEpisodeAccusativeSuffix } from '../utils/textUtils';

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
    <aside className="w-full space-y-4">
      
      {/* Header Card */}
      <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-4.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center text-[#E63946] shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base text-white tracking-tight">Sosyal Akış</h2>
            <p className="text-xs text-slate-400 font-medium">Arkadaşlarının canlı aktiviteleri</p>
          </div>
        </div>

        <span className="text-xs bg-[#E63946] text-white font-black px-2.5 py-1 rounded-full shadow-md tracking-wide">
          Canlı
        </span>
      </div>



      {/* Activity List - Scrollable Dedicated Container (Max ~6 cards height, independent inner scroll) */}
      <div className="max-h-[620px] xl:max-h-[680px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar">
        {(() => {
          const now = new Date().getTime();
          const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

          const validActivities = activities
            .filter(a => {
              const hasMedia = a.details?.media_title || a.media_title || a.action_type === 'status_update';
              if (!hasMedia) return false;

              // Filter out activities older than 2 days
              if (a.created_at) {
                const actTime = new Date(a.created_at).getTime();
                if (!isNaN(actTime) && (now - actTime) > TWO_DAYS_MS) {
                  return false;
                }
              }
              return true;
            })
            .slice(0, 30);

          if (validActivities.length === 0) {
            return (
              <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-6 text-center space-y-2">
                <p className="text-sm font-bold text-slate-200">Henüz aktivite bulunmuyor</p>
                <p className="text-xs text-slate-400">Arkadaşlarınızın paylaşımları ve izleme hareketleri burada görünecektir.</p>
              </div>
            );
          }

          return validActivities.map((item) => {
            const displayFullName = item.profile?.full_name || item.user_fullname || (currentUser && item.user_id === currentUser.id ? currentUser.full_name : 'Kullanıcı');
            const displayUsername = item.profile?.username || item.username || (currentUser && item.user_id === currentUser.id ? currentUser.username : 'kullanici');
            const displayAvatar = item.profile?.avatar_url || item.user_avatar || (currentUser && item.user_id === currentUser.id ? currentUser.avatar_url : '');
            const mediaTitle = item.details?.media_title || item.media_title || 'Yapım';
            const mediaPoster = item.details?.media_poster || item.poster_path;
            const isLiked = likedActivities[item.id];

            return (
              <div
                key={item.id}
                onClick={() => item.media_id && item.media_type && onSelectMediaById(item.media_id, item.media_type)}
                className="bg-[#14171D] border border-[#232833] hover:border-[#E63946]/50 rounded-2xl p-3.5 sm:p-4 shadow-md hover:shadow-lg transition cursor-pointer group space-y-3"
              >
                {/* User Avatar & Header */}
                <div className="flex items-center justify-between gap-2.5">
                  <div 
                    onClick={(e) => {
                      if (displayUsername && onNavigateToProfile) {
                        e.stopPropagation();
                        onNavigateToProfile(displayUsername);
                      }
                    }}
                    className="flex items-center gap-2.5 hover:opacity-90 transition cursor-pointer p-1 rounded-xl hover:bg-white/5"
                    title={`${displayFullName} profilini gör`}
                  >
                    <UserAvatar
                      user={{
                        full_name: displayFullName,
                        username: displayUsername,
                        avatar_url: displayAvatar
                      }}
                      size="sm"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight hover:text-[#E63946] transition-colors">
                        {displayFullName}
                      </h4>
                      <span className="text-xs text-[#E63946] font-bold hover:underline">@{displayUsername}</span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {formatTimestamp(item.created_at)}
                  </span>
                </div>

                {/* Action Details Card */}
                <div className="bg-[#0B0C0E] border border-[#232833] rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1 min-w-0 flex-1">
                    
                    {/* Action Description */}
                    {item.action_type === 'episode_watched' && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                        <Eye className="w-4 h-4 text-[#E63946] shrink-0" />
                        <span className="truncate">
                          <strong className="text-white font-bold">{mediaTitle}</strong>
                          {item.details?.season_number && item.details?.episode_number
                            ? ` S${item.details.season_number}B${item.details.episode_number}${getEpisodeAccusativeSuffix(item.details.episode_number)} izledi`
                            : `${getTurkishAccusativeSuffix(mediaTitle)} bir bölümünü izledi`}
                        </span>
                      </div>
                    )}

                    {item.action_type === 'review_added' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-white font-bold">{mediaTitle}</strong> <span className="text-amber-400 font-black">{item.details?.rating || 10}/10</span>
                          </span>
                        </div>
                        {item.details?.review_text && (
                          <p className="text-xs text-slate-300 italic line-clamp-2 pl-2 border-l-2 border-[#E63946] font-normal">
                            "{item.details.review_text}"
                          </p>
                        )}
                      </div>
                    )}

                    {item.action_type === 'rating_given' && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="truncate">
                          <strong className="text-white font-bold">{mediaTitle}</strong> <span className="text-amber-400 font-black">{item.details?.rating}/10</span>
                        </span>
                      </div>
                    )}

                    {item.action_type === 'status_update' && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                        <Sparkles className="w-4 h-4 text-[#E63946] shrink-0" />
                        <span className="truncate">
                          {item.details?.status === 'watched' ? (
                            <>
                              <strong className="text-white font-bold">{mediaTitle}</strong>{getTurkishAccusativeSuffix(mediaTitle)} izledi
                            </>
                          ) : item.details?.status === 'watching' ? (
                            <>
                              <strong className="text-white font-bold">{mediaTitle}</strong> izlemeye başladı
                            </>
                          ) : (
                            <>
                              <strong className="text-white font-bold">{mediaTitle}</strong> izlenecekler listesine ekledi
                            </>
                          )}
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Poster Thumbnail */}
                  {mediaPoster && (
                    <img
                      src={mediaPoster}
                      alt={mediaTitle}
                      className="w-10 h-14 sm:w-11 sm:h-16 rounded-lg object-cover border border-[#232833] shrink-0 shadow-md group-hover:scale-105 transition duration-300"
                    />
                  )}
                </div>

              {/* Card Footer: Interaction Like / Comment */}
              <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                <button
                  onClick={(e) => toggleLike(item.id, e)}
                  className={`flex items-center gap-1 hover:text-[#E63946] transition ${isLiked ? 'text-[#E63946] font-bold' : ''}`}
                >
                  <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-[#E63946]' : ''}`} />
                  <span>{isLiked ? 'Beğendin' : 'Beğen'}</span>
                </button>

                <div className="flex items-center gap-1 hover:text-slate-200 transition">
                  <MessageSquare className="w-3 h-3" />
                  <span>Yorum</span>
                </div>
              </div>

            </div>
          );
        })
      })()}
      </div>

    </aside>
  );
};
