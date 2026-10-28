import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Sparkles, 
  Tv, 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  BellOff,
  Flame,
  Zap,
  ChevronRight,
  MessageSquare,
  Users
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onSelectNotification: (notification: AppNotification) => void;
  onScanNow?: () => void;
  isScanning?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onSelectNotification,
  onScanNow,
  isScanning = false
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read;
    return true;
  });

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Yeni';
    try {
      const now = new Date().getTime();
      const time = new Date(dateStr).getTime();
      const diffMs = now - time;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 5) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHours < 24) return `${diffHours} sa önce`;
      if (diffDays === 1) return 'Dün';
      if (diffDays < 60) return `${diffDays} gün önce`;
      
      const dateObj = new Date(dateStr);
      const isCurrentYear = dateObj.getFullYear() === new Date().getFullYear();
      return dateObj.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short',
        ...(isCurrentYear ? {} : { year: 'numeric' })
      });
    } catch {
      return 'Yakın zamanda';
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_season':
        return <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />;
      case 'new_episode':
        return <Tv className="w-3.5 h-3.5 text-[#E63946]" />;
      case 'friend_activity':
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />;
    }
  };

  return (
    <>
      {/* Backdrop overlay for clicking outside & focus management */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
      />

      {/* Main Notification Panel Container */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed top-16 right-3 sm:right-6 md:right-8 lg:right-12 z-50 w-[calc(100vw-24px)] sm:w-96 max-h-[82vh] bg-[#14171D] border border-[#232833] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-[#232833] bg-[#14171D] sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E63946]/10 border border-[#E63946]/20 flex items-center justify-center text-[#E63946]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#E63946] text-white px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} yeni
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onScanNow && (
                <button
                  type="button"
                  onClick={onScanNow}
                  disabled={isScanning}
                  title="Yeni bölümleri tara"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-[#232833] rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#E63946]' : ''}`} />
                </button>
              )}

              {notifications.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    title="Tümünü okundu işaretle"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#232833] rounded-lg transition"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={onClearAll}
                    title="Tümünü temizle"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#232833] rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#232833] rounded-lg transition ml-1"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#232833]/60">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#0B0C0E] text-slate-400 hover:text-white border border-[#232833]'
              }`}
            >
              <span>Tümü</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === 'all' ? 'bg-black/10 text-black font-extrabold' : 'bg-[#232833] text-slate-300'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'unread'
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#0B0C0E] text-slate-400 hover:text-white border border-[#232833]'
              }`}
            >
              <span>Okunmamış</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'unread' ? 'bg-black/20 text-white font-extrabold' : 'bg-[#E63946]/30 text-[#E63946]'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-[#232833]/40">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0B0C0E] border border-[#232833] flex items-center justify-center text-slate-500 mb-3">
                <BellOff className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                {activeFilter === 'unread' ? 'Okunmamış Bildirim Yok' : 'Yeni Bildiriminiz Yok'}
              </h4>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                İzlediğiniz dizilere yeni sezon veya bölümler yayınlandığında anında burada haber verilecektir.
              </p>
              {onScanNow && (
                <button
                  type="button"
                  onClick={onScanNow}
                  disabled={isScanning}
                  className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0C0E] border border-[#232833] hover:border-[#E63946]/40 text-xs text-slate-200 font-semibold transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#E63946] ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Şimdi Kontrol Et</span>
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  onSelectNotification(notification);
                }}
                className={`group relative p-3 rounded-xl transition cursor-pointer flex items-start gap-3 pt-3 first:pt-2 ${
                  notification.is_read
                    ? 'bg-[#14171D] hover:bg-[#1A1F29]/60 opacity-80 hover:opacity-100'
                    : 'bg-[#181C24] border border-[#E63946]/30 shadow-md shadow-[#E63946]/5 hover:border-[#E63946]/60'
                }`}
              >
                {/* Poster or Icon Thumbnail */}
                <div className="relative shrink-0 w-11 h-15 rounded-lg overflow-hidden bg-[#0B0C0E] border border-[#232833]">
                  {notification.media_poster ? (
                    <img
                      src={notification.media_poster}
                      alt={notification.media_title || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Tv className="w-5 h-5" />
                    </div>
                  )}
                  {/* Category icon badge on poster */}
                  <div className="absolute bottom-0 right-0 p-0.5 bg-black/80 rounded-tl-md">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0B0C0E] border border-[#232833] text-slate-300">
                      {notification.type === 'new_season' ? 'Yeni Sezon' : notification.type === 'new_episode' ? 'Yeni Bölüm' : 'Bildirim'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug group-hover:text-[#E63946] transition truncate">
                    {notification.title}
                  </h4>

                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-extrabold text-[#E63946] group-hover:underline">
                    <span>Hemen İncele & İzle</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                {/* Unread indicator dot */}
                {!notification.is_read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#E63946] ring-4 ring-[#E63946]/20" />
                )}

                {/* Delete / Dismiss Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(notification.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-[#232833] rounded-lg transition absolute bottom-2 right-2"
                  title="Bildirimi sil"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Panel Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-[#0B0C0E] border-t border-[#232833] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dizilerinize yeni bölümler geldikçe otomatik güncellenir.</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[#E63946] hover:underline font-bold"
              >
                Tümünü Okundu Yap
              </button>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};
