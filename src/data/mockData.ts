import { Profile, ActivityFeedItem, RatingReview, WatchStatus, CustomCollection } from '../types';
import { DEFAULT_AVATAR_URL } from '../lib/constants';

export { DEFAULT_AVATAR_URL };

export const CURRENT_USER: Profile = {
  id: '',
  username: '',
  full_name: '',
  avatar_url: DEFAULT_AVATAR_URL,
  banner_url: '',
  featured_media_title: '',
  bio: ''
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

export function getMockProfileData(_username: string) {
  return null;
}
