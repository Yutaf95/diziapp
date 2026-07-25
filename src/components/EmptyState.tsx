import React from 'react';
import { motion } from 'motion/react';
import { Film, Tv, Bookmark, Search, Sparkles, Compass, Eye, Plus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  iconType?: 'film' | 'tv' | 'bookmark' | 'search' | 'eye';
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Henüz İçerik Bulunmuyor",
  description = "Aradığınız kriterlere uygun yapım bulunamadı. Filtreleri değiştirebilir veya keşfetmeye devam edebilirsiniz.",
  iconType = 'film',
  actionLabel = "Keşfe Çık",
  onAction
}) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'tv':
        return <Tv className="w-10 h-10 text-[#E63946]" />;
      case 'bookmark':
        return <Bookmark className="w-10 h-10 text-amber-400" />;
      case 'search':
        return <Search className="w-10 h-10 text-blue-400" />;
      case 'eye':
        return <Eye className="w-10 h-10 text-emerald-400" />;
      case 'film':
      default:
        return <Film className="w-10 h-10 text-[#E63946]" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-[#0B0C0E]/80 border border-[#232833] p-8 sm:p-12 text-center flex flex-col items-center justify-center my-2 shadow-inner"
    >
      {/* Background Animated Gradient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-48 h-48 bg-[#E63946] blur-[70px] rounded-full pointer-events-none -z-0"
      />

      {/* Animated SVG Icon Container (Lottie style loop) */}
      <div className="relative z-10 mb-5">
        {/* Outer Pulsing Ring */}
        <motion.div
          animate={{
            scale: [0.9, 1.2, 0.9],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-[#E63946]/20 border border-[#E63946]/40 -m-3"
        />

        {/* Orbiting Sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -top-3 -right-3 pointer-events-none text-amber-400"
        >
          <Sparkles className="w-5 h-5 fill-amber-400/30" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-2 -left-3 pointer-events-none text-blue-400"
        >
          <Compass className="w-4 h-4" />
        </motion.div>

        {/* Main Floating Icon Box */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-20 h-20 rounded-2xl bg-[#14171D] border border-[#2B313E] flex items-center justify-center shadow-xl ring-1 ring-white/10"
        >
          {renderIcon()}
        </motion.div>
      </div>

      {/* Text Content */}
      <div className="relative z-10 max-w-md space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button if provided */}
      {onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
          className="relative z-10 mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-extrabold shadow-lg shadow-[#E63946]/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </motion.button>
      )}
    </motion.div>
  );
};
