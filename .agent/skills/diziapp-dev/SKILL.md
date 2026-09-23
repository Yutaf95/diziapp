---
name: diziapp-dev
description: Run development workflows, typecheck, lint, and build the Dizi&Film Takip application. Use whenever developing, debugging, testing, or building this project.
---

# DiziApp Development Workflow

This skill guides the agent through building, running, and verifying the Dizi&Film Takip application.

## Prerequisites
* Node.js v20+ / v22+
* npm or bun

## 1. Starting the Dev Server
To start the Vite development server with hot-module replacement on port 3000:
```bash
npm run dev
```
Accessible at: `http://localhost:3000`

## 2. Type Checking (Lint)
Run TypeScript compiler in no-emit mode to catch type regressions:
```bash
npm run lint
```
Expected output: No errors (exit code 0).

## 3. Production Build
To create a production-optimized bundle:
```bash
npm run build
```
Build output is saved to `./dist/` with PWA service worker assets.

## 4. Environment Secrets
Ensure `.env.local` exists for local credentials:
* `VITE_SUPABASE_URL`: Supabase project URL.
* `VITE_SUPABASE_ANON_KEY`: Supabase anon public key.
* `VITE_TMDB_API_KEY`: TMDB v3 API Key.
* `GEMINI_API_KEY`: (Optional) Google Gemini API key for future AI recommendations.
