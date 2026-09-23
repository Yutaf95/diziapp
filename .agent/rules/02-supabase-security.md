---
name: supabase-security
description: Database conventions, Row Level Security (RLS) policies, and client handling for Supabase in Dizi&Film Takip.
---

# Supabase & Database Security Rules

## 1. Client Handling & Offline Resilience
* Never assume Supabase is configured or reachable. Always check `isSupabaseConfigured` (`src/lib/supabase.ts`).
* The dummy client (`createDummyClient`) handles offline query chains gracefully without crashing.
* Avoid raw SQL in frontend components; use typed Supabase SDK client calls.

## 2. Row Level Security (RLS) Conventions
* All PostgreSQL tables must have RLS enabled: `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`.
* Public read policies must be explicit:
  * Public profiles, public collections, activity feed, reviews, and ratings are viewable by everyone (`USING (true)`).
  * Private collections: `USING (is_private = false OR auth.uid() = user_id)`.
* Mutation policies must strictly restrict write/update/delete to `auth.uid() = user_id`.

## 3. Profiles Auto-Creation
* On user sign-up via Supabase Auth (`auth.users`), the PostgreSQL trigger `handle_new_user()` automatically creates a row in `public.profiles`.
* If a profile is missing (e.g. legacy user or third-party provider), client code performs a fallback upsert.

## 4. Query Batching & Indexing
* Prevent N+1 queries by leveraging `Promise.allSettled` for batch entity fetching.
* For social feed user lookups, collect unique user IDs and perform a single batch query (`.in('id', userIds)`).
