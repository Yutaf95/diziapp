---
name: architecture-and-state
description: Guidelines for component structure, Zustand UI state management, and dual-layer persistence in Dizi&Film Takip.
---

# Architecture & State Management Guidelines

## 1. State Management Split
* **UI & Modal State (`src/store/useAppStore.ts`)**:
  * Tab navigation (`activeTab`), active search queries, modal visibility (`isMediaDetailOpen`, `isSettingsOpen`, `isMonthlyRecapOpen`), selected media.
  * Use Zustand hooks inside components rather than drilling props through dozens of layers.
* **Persistent Media Data (`watchList`, `episodeProgress`, `customCollections`, `favorites`)**:
  * Dual-layer persistence: State -> `localStorage` -> `Supabase`.
  * Optimistic UI updates: Update local state immediately, sync to Supabase in the background.

## 2. Smart Merging Protocol
When loading data after user login:
* Do NOT wipe local items.
* Merge items matching `media_id` + `media_type`.
* Prefer the entity with the newer `updated_at` / `watched_at` timestamp.
* Automatically upsert missing local items into Supabase to prevent data loss.

## 3. Component Architecture
* Keep `App.tsx` manageable: Extract complex stateful flows into dedicated custom hooks (`src/hooks/`) or feature components.
* Wrap list cards in `React.memo` (as in `MediaCard.tsx`) to avoid re-rendering entire grids on single-item updates.
* Use `lazyWithRetry` (`src/lib/lazyWithRetry.ts`) for dynamic modal chunks to avoid stale chunk errors on deployment.
