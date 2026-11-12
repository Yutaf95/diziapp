import { GoogleGenAI } from '@google/genai';
import { TMDBEpisode } from '../types';

const TRANSLATIONS_CACHE_KEY = 'diziapp_translations_cache';
const GEMINI_KEY_STORAGE = 'tvtime_gemini_key';

// Retrieve stored or env Gemini API key
export const getStoredGeminiApiKey = (): string => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(GEMINI_KEY_STORAGE);
    if (saved) return saved;
  }
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    ''
  );
};

export const setStoredGeminiApiKey = (key: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
};

// Memory & LocalStorage Cache
const memoryCache: Record<string, string> = (() => {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return {};
})();

const saveMemoryCache = () => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(memoryCache));
    } catch {}
  }
};

// Simple deterministic hash for text
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

/**
 * High-quality translation with Google Gemini AI
 */
async function translateWithGemini(
  text: string,
  apiKey: string,
  showTitle?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Sen profesyonel bir dizi ve film bülteni çevirmenisin. Aşağıdaki dizi/film bölüm özetini anlamını bozmadan, akıcı, edebi ve sürükleyici bir Türkçe dizi bülteni diliyle çevir.

Önemli Kurallar:
1. Karakter isimlerini, mekan adlarını veya diziye özel terimleri aynen koru, Türkçeye çevirme (Örn: Neal Caffrey, FBI, Manhattan, Mozzie aynen kalsın).
2. Doğal, profesyonel bir Türkçe dizi tanıtım dili kullan.
3. SADECE çevrilmiş Türkçe metni döndür. Başına, sonuna hiçbir açıklama, etiket (Örn: "Çeviri:", "AI") veya tırnak işareti EKLEME.

${showTitle ? `Dizi Adı: ${showTitle}\n` : ''}
İngilizce Özet:
${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  const output = response.text?.trim() || '';
  return output.replace(/^["'«»]|["'«»]$/g, '').trim();
}

/**
 * Free Google Translate Client fallback (Zero configuration, runs directly in browser)
 */
async function translateWithGoogleFree(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate client error: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const combined = data[0].map((item: any) => item[0]).join('').trim();
    if (combined) return combined;
  }
  throw new Error('Empty translation output');
}

export interface TranslationContext {
  showTitle?: string;
  showId?: number;
  seasonNum?: number;
  episodeNum?: number;
}

/**
 * Translate an English overview into high-quality Turkish.
 * Automatically checks cache first, then attempts Gemini AI, then Google Translate free client,
 * and finally falls back to original English if all services fail.
 */
export async function translateOverview(
  text: string,
  context?: TranslationContext
): Promise<string> {
  if (!text || text.trim() === '') return '';

  const cleanText = text.trim();

  // 1. Check Cache
  const epKey = context?.showId && context?.seasonNum && context?.episodeNum
    ? `ep_${context.showId}_${context.seasonNum}_${context.episodeNum}`
    : null;
  const hashKey = `text_${hashString(cleanText)}`;

  if (epKey && memoryCache[epKey]) {
    return memoryCache[epKey];
  }
  if (memoryCache[hashKey]) {
    return memoryCache[hashKey];
  }

  // 2. Perform translation
  let translatedText = '';
  const geminiKey = getStoredGeminiApiKey();

  if (geminiKey) {
    try {
      translatedText = await translateWithGemini(cleanText, geminiKey, context?.showTitle);
    } catch (err) {
      console.warn('Gemini translation failed, falling back to Google client:', err);
    }
  }

  if (!translatedText) {
    try {
      translatedText = await translateWithGoogleFree(cleanText);
    } catch (err) {
      console.warn('Google client translation failed, using original English overview:', err);
      translatedText = cleanText;
    }
  }

  // 3. Save to Cache
  if (translatedText) {
    if (epKey) memoryCache[epKey] = translatedText;
    memoryCache[hashKey] = translatedText;
    saveMemoryCache();
  }

  return translatedText || cleanText;
}

/**
 * Batch translate episodes for a season concurrently without overloading the browser.
 */
export async function translateEpisodesBatch(
  episodes: TMDBEpisode[],
  context: { showId: number; showTitle?: string; seasonNum: number }
): Promise<TMDBEpisode[]> {
  const batchSize = 5;
  const result: TMDBEpisode[] = [...episodes];

  for (let i = 0; i < result.length; i += batchSize) {
    const chunk = result.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (ep, idx) => {
        const globalIdx = i + idx;
        if (ep.overview && ep.overview.trim() !== '') {
          // If overview is still in English (or fallback from en-US), translate it
          const translated = await translateOverview(ep.overview, {
            showId: context.showId,
            showTitle: context.showTitle,
            seasonNum: context.seasonNum,
            episodeNum: ep.episode_number
          });
          result[globalIdx] = {
            ...result[globalIdx],
            overview: translated
          };
        }
      })
    );
  }

  return result;
}
