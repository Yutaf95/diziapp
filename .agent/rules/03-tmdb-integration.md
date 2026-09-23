---
name: tmdb-integration
description: TMDB API conventions, caching, rate limiting, and fallback behavior for Dizi&Film Takip.
---

# TMDB API Integration Guidelines

## 1. API Keys & Fallback Mode
* The app reads TMDB API key from:
  1. `localStorage.getItem('tvtime_tmdb_key')`
  2. `import.meta.env.VITE_TMDB_API_KEY`
  3. Default fallback hardcoded key in `src/lib/tmdb.ts`
* If no network or key is invalid, fallback mock data (`MOCK_TRENDING_SHOWS`, `MOCK_SEASON_EPISODES`, `generateFallbackSeason`) must be returned so the UI never breaks.

## 2. Localization
* Always pass `language=tr-TR` to TMDB endpoints so Turkish titles, overviews, and episode descriptions are fetched.
* When sorting titles, use Turkish locale sensitivity: `localeCompare(titleB, 'tr', { numeric: true, sensitivity: 'base' })`.

## 3. Caching & PWA Service Worker
* Image URLs from `https://image.tmdb.org/` are cached with a `CacheFirst` strategy in `vite.config.ts` Workbox settings (30 days expiration, max 100 entries).
* Do not bypass image URLs with random query params that break service worker caching.
* Use `getImageUrl(path, 'w500')` for posters and `getImageUrl(path, 'original')` for high-resolution backdrops.

## 4. Franchise Sorting
* Always use `sortFranchiseAlphabetical` from `src/lib/sorting.ts` when displaying lists so sequels and prequels are grouped and ordered chronologically by release date.
