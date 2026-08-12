import { GoogleGenAI } from '@google/genai';
import { search } from './tmdb';
import { TMDBMedia, WatchStatus } from '../types';

const apiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

/**
 * Generate AI-powered personalized recommendations based on the user's watching list
 */
export async function getSmartRecommendations(watchList: WatchStatus[]): Promise<TMDBMedia[]> {
  const watchedTitles = watchList
    .filter(w => w.status === 'watched' || w.status === 'watching')
    .map(w => w.title)
    .filter(Boolean) as string[];

  if (watchedTitles.length === 0) {
    return [];
  }

  // 1. Try Gemini AI if API key is present
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Based on a user who loves these TV shows and movies: ${watchedTitles.slice(0, 10).join(', ')}. Recommend 5 distinct high-quality movies or TV shows they would thoroughly enjoy. Return ONLY a JSON array of exact titles, example: ["Show 1", "Movie 2"]. Do not add markdown or extra text.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const recommendedTitleStrings: string[] = JSON.parse(cleanJson);

      if (Array.isArray(recommendedTitleStrings) && recommendedTitleStrings.length > 0) {
        const fetchedMedia: TMDBMedia[] = [];
        for (const titleStr of recommendedTitleStrings.slice(0, 5)) {
          const searchRes = await search(titleStr, 'all', 1);
          if (searchRes.results && searchRes.results.length > 0) {
            // Pick first non-duplicate result
            const match = searchRes.results[0];
            if (!watchList.some(w => w.media_id === match.id) && !fetchedMedia.some(m => m.id === match.id)) {
              fetchedMedia.push(match);
            }
          }
        }
        if (fetchedMedia.length > 0) {
          return fetchedMedia;
        }
      }
    } catch (err) {
      console.warn('Gemini AI generation failed, falling back to smart genre-based recommendation engine:', err);
    }
  }

  // 2. Fallback Smart Recommendation Engine (TMDB search by user's top watched titles)
  const recommendations: TMDBMedia[] = [];
  const sampleWatched = watchedTitles.slice(0, 3);
  
  for (const title of sampleWatched) {
    try {
      const res = await search(title, 'all', 1);
      if (res.results && res.results.length > 1) {
        // Pick related items from search results
        for (const item of res.results.slice(1, 3)) {
          if (!watchList.some(w => w.media_id === item.id) && !recommendations.some(m => m.id === item.id)) {
            recommendations.push(item);
          }
        }
      }
    } catch (e) {}
  }

  return recommendations;
}
