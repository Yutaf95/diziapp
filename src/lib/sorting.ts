/**
 * Utility functions for sorting media items:
 * Sorts alphabetically A-Z by default, but groups franchise series together 
 * and sorts franchise items chronologically by release/first air date.
 */

export const getFranchiseRoot = (title: string): string => {
  if (!title) return '';
  let cleaned = title.trim();

  // Strip subtitles after colon or dash (e.g. "John Wick: Chapter 2" -> "John Wick")
  if (cleaned.includes(':')) {
    cleaned = cleaned.split(':')[0];
  } else if (cleaned.includes(' - ')) {
    cleaned = cleaned.split(' - ')[0];
  }

  // Strip trailing numbers / parts (e.g., " 2", " 3", " Part 2", " Bölüm 3", " Vol 2")
  cleaned = cleaned.replace(/\s+(?:bölüm|part|kısım|vol\.?|volume)?\s*\d+$/i, '');
  cleaned = cleaned.replace(/\s+\d+$/i, '');

  // Strip trailing Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X)
  cleaned = cleaned.replace(/\s+(?:X|IX|VIII|VII|VI|V|IV|III|II|I)$/i, '');

  return cleaned.trim().toLowerCase();
};

export const areSameFranchise = (titleA: string, titleB: string): boolean => {
  const rootA = getFranchiseRoot(titleA);
  const rootB = getFranchiseRoot(titleB);

  // Exact root match ("arabalar" === "arabalar")
  if (rootA && rootB && rootA === rootB) return true;

  const normA = titleA.toLowerCase().trim();
  const normB = titleB.toLowerCase().trim();

  // Multi-word prefix match (e.g. "Harry Potter...", "Star Wars...", "The Lord of the Rings...")
  const wordsA = normA.split(/\s+/);
  const wordsB = normB.split(/\s+/);
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    if (wordsA[0] === wordsB[0] && wordsA[1] === wordsB[1]) {
      return true;
    }
  }

  // One title starts with the root of another (e.g., "Alacakaranlık" & "Alacakaranlık Efsanesi: Yeni Ay")
  if (rootA.length >= 4 && normB.startsWith(rootA)) return true;
  if (rootB.length >= 4 && normA.startsWith(rootB)) return true;

  return false;
};

export function sortFranchiseAlphabetical<T extends Record<string, any>>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const titleA = (a.title || a.name || '').trim();
    const titleB = (b.title || b.name || '').trim();

    // Check if both belong to the same franchise
    if (areSameFranchise(titleA, titleB)) {
      const dateA = a.release_date || a.first_air_date || '';
      const dateB = b.release_date || b.first_air_date || '';

      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // If dates are missing or equal, fall back to natural numeric sort (e.g. Arabalar 1 before Arabalar 2)
      return titleA.localeCompare(titleB, 'tr', { numeric: true, sensitivity: 'base' });
    }

    // Different franchises -> Sort alphabetically by franchise root / title
    const rootA = getFranchiseRoot(titleA);
    const rootB = getFranchiseRoot(titleB);

    const rootCompare = rootA.localeCompare(rootB, 'tr', { numeric: true, sensitivity: 'base' });
    if (rootCompare !== 0) return rootCompare;

    return titleA.localeCompare(titleB, 'tr', { numeric: true, sensitivity: 'base' });
  });
}
