---
name: supabase-sync
description: Manage and audit Supabase database schemas, migrations, RLS security policies, and PostgreSQL triggers for Dizi&Film Takip. Use when database changes or schema audits are needed.
---

# Supabase Sync & Database Migration Skill

This skill guides the agent in maintaining the Supabase PostgreSQL database schema for Dizi&Film Takip.

## Schema Source of Truth
The full canonical SQL schema is maintained in:
[src/lib/supabase-schema.sql](file:///c:/Users/yufus/OneDrive/Masaüstü/diziapp/src/lib/supabase-schema.sql)

## Managed Tables
1. `profiles`: User information (username, full_name, avatar_url, banner_url, bio).
2. `watch_status`: User watch progress (watching, plan_to_watch, watched).
3. `episode_progress`: Episode-by-episode progress for TV shows.
4. `ratings_reviews`: 1-10 scores, reviews, spoiler flag.
5. `episode_ratings`: Individual episode ratings.
6. `follows`: Social following graph.
7. `activity_feed`: Stream of user actions (JSONB details).
8. `favorites`: Pinned/favorite movies and shows.
9. `custom_collections`: Custom user lists with color and icon tags.
10. `collection_items`: Items stored in user collections.

## Schema Deployment Steps
1. Open the Supabase Project Dashboard -> SQL Editor.
2. Paste and run the contents of `src/lib/supabase-schema.sql`.
3. Verify that the `handle_new_user` trigger is attached to `auth.users`.
4. Verify RLS is enabled on all 10 tables.
