import { create } from 'zustand';
import { TMDBMedia } from '../types';

interface AppUIState {
  activeTab: string;
  searchQuery: string;
  selectedMedia: TMDBMedia | null;
  isMediaDetailOpen: boolean;
  isMonthlyRecapOpen: boolean;
  isSettingsOpen: boolean;
  isApiKeyOpen: boolean;
  isProfileBannerOpen: boolean;
  isMobileMenuOpen: boolean;
  viewingUsername: string | null;

  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMedia: (media: TMDBMedia | null) => void;
  setIsMediaDetailOpen: (open: boolean) => void;
  setIsMonthlyRecapOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsApiKeyOpen: (open: boolean) => void;
  setIsProfileBannerOpen: (open: boolean) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  setViewingUsername: (username: string | null) => void;
  openMediaDetail: (media: TMDBMedia) => void;
  closeMediaDetail: () => void;
}

export const useAppStore = create<AppUIState>((set) => ({
  activeTab: typeof window !== 'undefined' && window.location.pathname.startsWith('/user/') ? 'profile' : 'discover',
  searchQuery: '',
  selectedMedia: null,
  isMediaDetailOpen: false,
  isMonthlyRecapOpen: false,
  isSettingsOpen: false,
  isApiKeyOpen: false,
  isProfileBannerOpen: false,
  isMobileMenuOpen: false,
  viewingUsername: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedMedia: (media) => set({ selectedMedia: media }),
  setIsMediaDetailOpen: (open) => set({ isMediaDetailOpen: open }),
  setIsMonthlyRecapOpen: (open) => set({ isMonthlyRecapOpen: open }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsApiKeyOpen: (open) => set({ isApiKeyOpen: open }),
  setIsProfileBannerOpen: (open) => set({ isProfileBannerOpen: open }),
  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setViewingUsername: (username) => set({ viewingUsername: username }),
  openMediaDetail: (media) => set({ selectedMedia: media, isMediaDetailOpen: true }),
  closeMediaDetail: () => set({ isMediaDetailOpen: false, selectedMedia: null }),
}));
