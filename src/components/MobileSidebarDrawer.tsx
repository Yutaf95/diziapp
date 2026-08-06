import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  TrendingUp, 
  Bell, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight, 
  BarChart2, 
  Sparkles, 
  ShieldCheck,
  Bookmark,
  Tv,
  Film,
  Calendar,
  Heart
} from 'lucide-react';
import { Profile } from '../types';
import { UserAvatar } from './UserAvatar';

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile;
  onOpenProfile: () => void;
  onOpenStats: () => void;
  onOpenFavorites?: () => void;
  onOpenCalendar?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onOpenProfile,
  onOpenStats,
  onOpenFavorites,
  onOpenCalendar,
  onOpenNotifications,
  onOpenSettings,
  onLogout
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Touch Swipe Left Handler to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = Math.abs(currentY - touchStartY);

    // If swiping left and horizontal movement is dominant
    if (diffX < -35 && Math.abs(diffX) > diffY) {
      onClose();
      setTouchStartX(null);
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. Backdrop overlay with blur & darken - clicking empty space closes drawer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9998] md:hidden cursor-pointer pointer-events-auto"
          />

          {/* 2. Sol taraftan pürüzsüzce kayan Drawer (%82 genişlik) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40 || info.velocity.x < -150) {
                onClose();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed top-0 left-0 bottom-0 w-[82vw] max-w-[320px] bg-[#121212] border-r border-neutral-800/80 z-[9999] md:hidden flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl touch-pan-y"
          >
            <div className="p-5 space-y-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              
              {/* Drawer Top Header & Close Button */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-black tracking-widest text-[#E63946] uppercase bg-[#E63946]/10 border border-[#E63946]/20 px-2.5 py-1 rounded-full">
                  ttime
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 active:bg-white/10 transition cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2. Menü Üst Alanı (Profil Kimliği) */}
              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="w-full text-left flex items-center gap-3.5 p-2 -mx-2 rounded-2xl hover:bg-white/5 active:bg-white/10 transition cursor-pointer group border-none bg-transparent"
                >
                  <div className="relative shrink-0">
                    <UserAvatar user={user} size="lg" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#121212] z-20" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide truncate group-hover:text-[#E63946] transition">
                      {user.full_name || user.username}
                    </h3>
                    <div className="text-[11px] font-bold text-[#E63946] truncate">
                      @{user.username}
                    </div>
                    <div className="text-[11px] text-neutral-400 group-hover:text-white transition flex items-center gap-1 mt-0.5">
                      <span>Profili görüntüle</span>
                      <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:text-white transition" />
                    </div>
                  </div>
                </button>

                {/* Yatay ince ayraç çizgisi */}
                <div className="border-b border-neutral-800" />
              </div>

              {/* 3. Menü İçerik Listesi (İkonlu Seçenekler) */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 pb-1">
                  Kişisel Menü
                </div>

                {/* 📈 İzleme İstatistikleri */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStats();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition border border-transparent hover:border-neutral-800 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-amber-500/30 text-white shrink-0">
                      <BarChart2 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        İzleme İstatistikleri
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Aylık ve yıllık wrapped özeti
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition shrink-0" />
                </button>

                {/* 📅 Yayın Takvimi */}
                {onOpenCalendar && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCalendar();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition border border-transparent hover:border-neutral-800 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-rose-500/30 text-white shrink-0">
                        <Calendar className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                          Yayın Takvimi
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          Gelecek tüm dizi ve film yayınları
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition shrink-0" />
                  </button>
                )}

                {/* ❤️ Favorilerim */}
                {onOpenFavorites && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFavorites();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition border border-transparent hover:border-neutral-800 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-pink-500/30 text-white shrink-0">
                        <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-pink-400 transition">
                          Favorilerim
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          Favorilerinize eklediğiniz özel yapımlar
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition shrink-0" />
                  </button>
                )}

                {/* ⚙️ Ayarlar ve Gizlilik */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-neutral-200 hover:text-white hover:bg-white/5 active:bg-white/10 transition border border-transparent hover:border-neutral-800 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-blue-500/30 text-white shrink-0">
                      <Settings className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                        Ayarlar ve Gizlilik
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Hesap ayarları ve bildirim tercihleri
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition shrink-0" />
                </button>

              </div>
            </div>

            {/* Alt Çıkış Yap Butonu & Versiyon Bilgisi */}
            <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-900/60 mt-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 active:scale-95 border border-rose-500/20 hover:border-rose-600 transition font-extrabold text-xs cursor-pointer shadow-lg group"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-400 group-hover:text-white transition" />
                <span>Çıkış Yap</span>
              </button>

              <div className="text-[10px] text-neutral-500 text-center font-medium">
                ttime Mobile v2.4.0 • Türkiye
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
