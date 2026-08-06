import { Profile, ActivityFeedItem, RatingReview, WatchStatus, CustomCollection } from '../types';

export const DEFAULT_AVATAR_URL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' rx='64' fill='%231F2430'/><circle cx='64' cy='44' r='22' fill='%2364748B'/><path d='M64 76c-24 0-42 14-42 28v8h84v-8c0-14-18-28-42-28z' fill='%2364748B'/></svg>`;

export const CURRENT_USER: Profile = {
  id: 'usr_me_101',
  username: 'yufus_m',
  full_name: 'Yusuf Mutaf',
  avatar_url: DEFAULT_AVATAR_URL,
  banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
  featured_media_title: 'Severance',
  bio: 'Sinema ve dizi tutkunu 🎬 ttime bağımlısı!'
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
      avatar_url: DEFAULT_AVATAR_URL,
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
