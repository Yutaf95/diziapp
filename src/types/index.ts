export type MediaType = 'movie' | 'tv';

export type WatchStatusType = 'watching' | 'plan_to_watch' | 'watched';

export interface CollectionItem {
  media_id: number;
  media_type: MediaType;
  title?: string;
  poster_path?: string;
  vote_average?: number;
  added_at: string;
}

export interface CustomCollection {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  color?: string; // Hex or gradient key, e.g., '#E63946', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'
  icon?: string;  // Icon name e.g., 'Heart', 'Sparkles', 'Film', 'Rocket', 'Tv', 'Flame'
  created_at: string;
  items: CollectionItem[];
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  banner_url?: string;
  featured_media_title?: string;
  bio?: string;
  email?: string;
  created_at?: string;
}

export interface WatchStatus {
  user_id: string;
  media_id: number;
  media_type: MediaType;
  status: WatchStatusType;
  updated_at?: string;
  // Included metadata for UI convenience
  title?: string;
  poster_path?: string;
  vote_average?: number;
  total_episodes?: number;
  total_seasons?: number;
}

export interface EpisodeProgress {
  user_id: string;
  show_id: number;
  season_number: number;
  episode_number: number;
  is_watched: boolean;
  rating?: number; // 1-10 rating given by user
  note?: string; // Personal episode note / review
  note_has_spoiler?: boolean;
  watched_at?: string;
}

export interface RatingReview {
  id?: string;
  user_id: string;
  media_id: number;
  media_type: MediaType;
  rating: number; // 1-10
  review_text: string;
  contains_spoiler: boolean;
  created_at: string;
  profile?: Profile;
  media_title?: string;
  media_poster?: string;
  is_pinned?: boolean;
}

export interface EpisodeRating {
  user_id: string;
  show_id: number;
  season_number: number;
  episode_number: number;
  rating: number; // 1-10
  updated_at?: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at?: string;
  profile?: Profile;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  action_type: 'status_update' | 'episode_watched' | 'review_added' | 'rating_given' | 'started_following';
  media_id?: number;
  media_type?: MediaType;
  details: {
    media_title?: string;
    media_poster?: string;
    status?: WatchStatusType;
    season_number?: number;
    episode_number?: number;
    episode_name?: string;
    rating?: number;
    review_text?: string;
    contains_spoiler?: boolean;
    target_username?: string;
  };
  created_at: string;
  profile?: Profile;
}

// TMDB API Types
export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string; // TV shows use name
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: MediaType;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  cast?: { id: number; name: string; character: string; profile_path: string | null }[];
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime?: number;
}

export interface TMDBSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episodes: TMDBEpisode[];
}
