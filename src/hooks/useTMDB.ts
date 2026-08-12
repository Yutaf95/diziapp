import { useQuery } from '@tanstack/react-query';
import { getTrending, search, getDetails, getSeasonDetails } from '../lib/tmdb';
import { MediaType } from '../types';

/**
/ * Hook to fetch and cache trending movies/TV shows
/ */
export function useTrendingQuery(
  type: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
) {
  return useQuery({
    queryKey: ['tmdb', 'trending', type, timeWindow, page],
    queryFn: () => getTrending(type, timeWindow, page),
    staleTime: 1000 * 60 * 10, // Cache trending for 10 mins
  });
}

/**
/ * Hook to fetch and cache TMDB search results
/ */
export function useSearchQuery(
  query: string,
  type: 'movie' | 'tv' | 'all' = 'all',
  page: number = 1
) {
  return useQuery({
    queryKey: ['tmdb', 'search', query, type, page],
    queryFn: () => search(query, type, page),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // Cache search for 5 mins
  });
}

/**
/ * Hook to fetch and cache TMDB Media Details
/ */
export function useMediaDetailsQuery(id: number | null, type: MediaType | null) {
  return useQuery({
    queryKey: ['tmdb', 'details', id, type],
    queryFn: () => getDetails(id!, type!),
    enabled: !!id && !!type,
    staleTime: 1000 * 60 * 15, // Cache details for 15 mins
  });
}

/**
/ * Hook to fetch and cache Season Details
/ */
export function useSeasonDetailsQuery(showId: number | null, seasonNumber: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'season', showId, seasonNumber],
    queryFn: () => getSeasonDetails(showId!, seasonNumber!),
    enabled: !!showId && seasonNumber !== null && seasonNumber !== undefined,
    staleTime: 1000 * 60 * 15, // Cache season details for 15 mins
  });
}
