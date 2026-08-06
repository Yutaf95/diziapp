/**
 * Phonetic Turkish Accusative Suffix Helper for Foreign & Turkish Media Titles
 * Computes Turkish apostrophe grammar suffix based on standard pronunciation rules.
 * Examples:
 * - "Loki" -> "'yi" (Loki'yi)
 * - "Severance" -> "'ı" (Severance'ı - pronounced Sevrıns)
 * - "Justified" -> "'ı" (Justified'ı - pronounced Castifayd)
 * - "Matrix" -> "'i" (Matrix'i)
 * - "Dark" -> "'ı" (Dark'ı)
 * - "Fargo" -> "'yu" (Fargo'yu)
 */
export const getTurkishAccusativeSuffix = (title: string): string => {
  if (!title) return "'ı";
  const clean = title.trim();
  const lower = clean.toLowerCase();

  // 1. Phonetic endings for English/foreign silent 'e' or 'ed' endings
  if (lower.endsWith('justified')) return "'ı"; // Castifayd -> 'ı
  if (lower.endsWith('severance')) return "'ı"; // Sevrıns -> 'ı
  if (lower.endsWith('loki')) return "'yi";      // Loki -> 'yi

  // 2. Titles ending in 'ed' (e.g. Justified, Unforgiven, Bed) -> pronounced with /d/, last vowel /a/ or /ı/
  if (lower.endsWith('ed')) return "'ı";

  // 3. Titles ending in silent 'ance' / 'ence' / 'ce' (e.g. Severance, Office) -> pronounced /s/, last vowel /a/ or /ı/
  if (lower.endsWith('ance') || lower.endsWith('ence')) return "'ı";

  // 4. Check written vowels
  const lastChar = lower[lower.length - 1];
  const vowels = 'aıeiouöü';

  // If title ends with a vowel sound (a, i, o, u, etc.), Turkish proper noun buffer consonant is 'y' (Loki'yi, Fargo'yu, Naruto'yu)
  if (vowels.includes(lastChar)) {
    if (lastChar === 'a' || lastChar === 'ı') return "'yı";
    if (lastChar === 'e' || lastChar === 'i') return "'yi";
    if (lastChar === 'o' || lastChar === 'u') return "'yu";
    if (lastChar === 'ö' || lastChar === 'ü') return "'yü";
  }

  // 5. Consonant endings: find last spoken vowel in title
  let lastVowel = '';
  for (let i = lower.length - 1; i >= 0; i--) {
    if (vowels.includes(lower[i])) {
      lastVowel = lower[i];
      break;
    }
  }

  if (lastVowel === 'a' || lastVowel === 'ı') return "'ı";
  if (lastVowel === 'e' || lastVowel === 'i') return "'i";
  if (lastVowel === 'o' || lastVowel === 'u') return "'u";
  if (lastVowel === 'ö' || lastVowel === 'ü') return "'ü";

  return "'ı";
};

/**
 * Turkish Accusative Suffix for Episode Numbers ('i / 'yi / 'ü / 'u / 'yı)
 * Correctly computes suffix based on standard Turkish number pronunciation.
 * Examples:
 * - 1 (bir) -> "'i" (S3B1'i)
 * - 2 (iki) -> "'yi" (S3B2'yi)
 * - 3 (üç) -> "'ü" (S3B3'ü)
 * - 4 (dört) -> "'ü" (S3B4'ü)
 * - 5 (beş) -> "'i" (S3B5'i)
 * - 6 (altı) -> "'yı" (S3B6'yı)
 * - 7 (yedi) -> "'yi" (S3B7'yi)
 * - 8 (sekiz) -> "'i" (S3B8'i)
 * - 9 (dokuz) -> "'u" (S3B9'u)
 * - 10 (on) -> "'u" (S3B10'u)
 * - 12 (on iki) -> "'yi" (S3B12'yi)
 */
export const getEpisodeAccusativeSuffix = (ep: number): string => {
  const mod10 = ep % 10;
  const mod100 = ep % 100;

  if (mod100 === 10 || mod100 === 30 || mod100 === 100) return "'u";
  if (mod100 === 20 || mod100 === 50 || mod100 === 70 || mod100 === 80) return "'yi";
  if (mod100 === 40 || mod100 === 60 || mod100 === 90) return "'ı";

  switch (mod10) {
    case 1:
    case 5:
    case 8:
      return "'i";
    case 2:
    case 7:
      return "'yi";
    case 3:
    case 4:
      return "'ü";
    case 6:
      return "'yı";
    case 9:
    case 0:
      return "'u";
    default:
      return "'i";
  }
};
