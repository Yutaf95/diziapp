import React from 'react';
import { Profile } from '../types';
import { Camera } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../data/mockData';

export interface UserAvatarProps {
  user?: Partial<Profile> | null;
  avatarUrl?: string;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  showEditCameraBadge?: boolean;
  onEditCameraClick?: () => void;
  title?: string;
}

// Preset Dimensions mapping
const SIZE_CLASSES: Record<string, { container: string; img: string; badge: string }> = {
  xs: { container: 'w-6 h-6', img: 'w-6 h-6', badge: 'w-3 h-3' },
  sm: { container: 'w-8 h-8', img: 'w-8 h-8', badge: 'w-4 h-4' },
  md: { container: 'w-10 h-10', img: 'w-10 h-10', badge: 'w-5 h-5' },
  lg: { container: 'w-12 h-12', img: 'w-12 h-12', badge: 'w-6 h-6' },
  xl: { container: 'w-16 h-16', img: 'w-16 h-16', badge: 'w-7 h-7' },
  '2xl': { container: 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24', img: 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24', badge: 'w-6 h-6' },
  '3xl': { container: 'w-18 h-18 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40', img: 'w-18 h-18 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40', badge: 'w-6 h-6 sm:w-8 sm:h-8' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  avatarUrl,
  username,
  size = 'md',
  className = '',
  imgClassName = '',
  onClick,
  showEditCameraBadge = false,
  onEditCameraClick,
  title
}) => {
  const rawUrl = avatarUrl || user?.avatar_url;
  const isDefaultOrOld = !rawUrl || rawUrl.includes('photo-1535713875002-d1d0cf377fde');
  const currentAvatarUrl = isDefaultOrOld ? DEFAULT_AVATAR_URL : rawUrl;
  const currentUsername = username || user?.username || 'user';

  const isPresetSize = typeof size === 'string' && SIZE_CLASSES[size];
  const containerSizeClass = isPresetSize ? SIZE_CLASSES[size].container : size;
  const imgSizeClass = isPresetSize ? SIZE_CLASSES[size].img : 'w-full h-full';

  return (
    <div
      onClick={onClick}
      title={title || `@${currentUsername}`}
      className={`relative shrink-0 inline-flex items-center justify-center ${containerSizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Base User Avatar Image */}
      <div className={`rounded-full overflow-hidden ${imgSizeClass} border border-white/10 shadow-md`}>
        <img
          src={currentAvatarUrl}
          alt={currentUsername}
          className={`w-full h-full object-cover ${imgClassName}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR_URL;
          }}
        />
      </div>

      {/* Optional Camera Edit Badge */}
      {showEditCameraBadge && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onEditCameraClick) onEditCameraClick();
          }}
          className="absolute bottom-0 right-0 z-30 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-[#E63946] text-white shadow-xl hover:scale-110 active:scale-95 transition border-2 border-[#14161D] cursor-pointer"
          title="Fotoğraf Değiştir"
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>
      )}
    </div>
  );
};



