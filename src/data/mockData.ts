import { Profile, ActivityFeedItem, RatingReview, WatchStatus, CustomCollection } from '../types';

export const CURRENT_USER: Profile = {
  id: 'usr_me_101',
  username: 'yufus_m',
  full_name: 'Yusuf Mutaf',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
  featured_media_title: 'Severance',
  bio: 'Sinema ve dizi tutkunu 🎬 TV Time bağımlısı!'
};

export const MOCK_FRIENDS: Profile[] = [];

export const INITIAL_USER_WATCH_STATUSES: WatchStatus[] = [];

export const INITIAL_ACTIVITIES: ActivityFeedItem[] = [];

export const INITIAL_REVIEWS: RatingReview[] = [];

export const INITIAL_COLLECTIONS: CustomCollection[] = [];

export const MOCK_USER_PROFILES: Record<string, {
  profile: Profile;
  watchList: WatchStatus[];
  reviews: RatingReview[];
  collections: CustomCollection[];
  episodeProgress: any[];
  followers?: Profile[];
  following?: Profile[];
}> = {};

export function getMockProfileData(username: string) {
  if (MOCK_USER_PROFILES[username]) {
    return MOCK_USER_PROFILES[username];
  }
  const formattedName = username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    profile: {
      id: `usr_gen_${username}`,
      username: username,
      full_name: formattedName,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      bio: `Cinephile & dizi tutkunu. @${username} profili.`
    },
    watchList: [],
    reviews: [],
    collections: [],
    episodeProgress: [],
    followers: [],
    following: []
  };
}
