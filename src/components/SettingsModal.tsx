import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Bell, Shield, User, Smartphone, Moon, Lock, Check } from 'lucide-react';
import { Profile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'password'>('account');
  const [notifyNewEpisodes, setNotifyNewEpisodes] = useState(true);
  const [notifyFriendActivity, setNotifyFriendActivity] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!isSupabaseConfigured) {
      setPassError('Çevrimdışı modda şifre güncellenemez!');
      return;
    }

    if (!currentPassword) {
      setPassError('Lütfen mevcut şifrenizi girin.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Şifreler uyuşmuyor.');
      return;
    }

    setPassLoading(true);
    try {
      // 1. Verify current password by signing in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword
      });

      if (verifyError) {
        setPassError('Mevcut şifreniz hatalı. Lütfen kontrol edin.');
        setPassLoading(false);
        return;
      }

      // 2. If verification is successful, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      
      setPassSuccess('Şifreniz başarıyla güncellendi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setPassError(err.message || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#121212] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E63946]/10 border border-[#E63946]/20 rounded-xl text-[#E63946]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ayarlar ve Gizlilik</h3>
                <p className="text-xs text-neutral-400">Hesap tercihlerinizi yönetin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'account'
                  ? 'border-[#E63946] text-[#E63946]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Hesap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'notifications'
                  ? 'border-[#E63946] text-[#E63946]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Bildirimler</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'password'
                  ? 'border-[#E63946] text-[#E63946]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Şifre Değiştir</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#E63946]"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{user.full_name || user.username}</div>
                    <div className="text-xs text-neutral-400">@{user.username}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      readOnly
                      value={`@${user.username}`}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-300 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      readOnly
                      value={user.email || `${user.username}@tvtime.app`}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-300 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div>
                    <div className="text-xs font-bold text-white">Yeni Sezon & Bölüm Uyarıları</div>
                    <div className="text-[11px] text-neutral-400">İzlediğin dizilere yeni bölüm geldiğinde anında haber ver.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNewEpisodes}
                    onChange={(e) => setNotifyNewEpisodes(e.target.checked)}
                    className="w-4 h-4 accent-[#E63946] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div>
                    <div className="text-xs font-bold text-white">Takip Edilen Arkadaş Bildirimleri</div>
                    <div className="text-[11px] text-neutral-400">Arkadaşların yeni inceleme yazdığında veya puanladığında bildir.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyFriendActivity}
                    onChange={(e) => setNotifyFriendActivity(e.target.checked)}
                    className="w-4 h-4 accent-[#E63946] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {passError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    {passError}
                  </div>
                )}

                {passSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                    {passSuccess}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">Mevcut Şifre</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-[#E63946] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none mb-3"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">Yeni Şifre</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-[#E63946] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-[#E63946] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white font-extrabold transition text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {passLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E63946] text-white hover:bg-[#d62839] active:scale-95 transition flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Kaydedildi</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
