# AGENTS.md - Antigravity Agent Guidelines

Refer to [GEMINI.md](file:///c:/Users/yufus/OneDrive/Masaüstü/diziapp/GEMINI.md) for complete technical architecture, conventions, and developer guidelines.

## Quick Summary for Autonomous Agents

1. **Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Motion, Zustand, Supabase, TMDB API.
2. **Commands:**
   - Dev Server: `npm run dev`
   - Typecheck: `npm run lint` (`tsc --noEmit`)
   - Production Build: `npm run build`
3. **Data Protocol:** Always support dual-layer persistence (LocalStorage + Supabase).
4. **Style Guide:**
   - Primary: `#E63946`
   - Background: `#0B0C0E`
   - Panels: `#14171D`
   - Borders: `#232833`
5. **Turkish Grammar:** Use `getTurkishAccusativeSuffix` & `getEpisodeAccusativeSuffix` in `src/utils/textUtils.ts` for all generated activity/notification strings.
