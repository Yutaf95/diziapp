import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Sparkles, Check, Info } from 'lucide-react';
import { getStoredTmdbApiKey, setTmdbApiKey } from '../lib/tmdb';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [keyInput, setKeyInput] = useState<string>(getStoredTmdbApiKey());
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTmdbApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl relative"
          >
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">TMDB API Anahtarı</h3>
                <p className="text-xs text-slate-400">Canlı film ve dizi verileri için isteğe bağlı</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>Bilgilendirme</span>
              </div>
              <p className="leading-relaxed">
                API anahtarı girmediğiniz takdirde uygulama otomatik olarak entegre edilmiş zengin demo veri setiyle kesintisiz çalışmaya devam eder.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  TMDB v3 API Key
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Örn: 1a2b3c4d5e6f7g8h9i0j..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  {saved ? <Check className="w-4 h-4 stroke-[3]" /> : <Sparkles className="w-4 h-4" />}
                  <span>{saved ? 'Kaydedildi!' : 'Kaydet & Yenile'}</span>
                </button>
              </div>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
