import { WatchStatus } from '../types';

export const TMDB_GENRE_NAMES: Record<number, string> = {
  28: 'Aksiyon',
  12: 'Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Drama',
  10751: 'Aile',
  14: 'Fantastik',
  36: 'Tarih',
  27: 'Korku',
  10402: 'Müzik',
  9648: 'Gizem',
  10749: 'Romantik',
  878: 'Bilim Kurgu',
  10770: 'TV Filmi',
  53: 'Gerilim',
  10752: 'Savaş',
  37: 'Vahşi Batı',
  10759: 'Aksiyon & Macera',
  10762: 'Çocuk',
  10763: 'Haber',
  10764: 'Reality',
  10765: 'Bilim Kurgu & Fantastik',
  10766: 'Pembe Dizi',
  10767: 'Talk Show',
  10768: 'Savaş & Politika'
};

export const GENRE_COLOR_PALETTE = [
  'bg-[#00e054]',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-emerald-500'
];

export const DEFAULT_TV_GENRE_DISTRIBUTION = [
  { genre: 'Bilim Kurgu & Macera', percent: 25, color: 'bg-[#00e054]' },
  { genre: 'Drama & Gizem', percent: 25, color: 'bg-blue-500' },
  { genre: 'Aksiyon & Gerilim', percent: 25, color: 'bg-amber-500' },
  { genre: 'Animasyon & Komedi', percent: 25, color: 'bg-purple-500' }
];

export const DEFAULT_MOVIE_GENRE_DISTRIBUTION = [
  { genre: 'Aksiyon & Macera', percent: 25, color: 'bg-amber-500' },
  { genre: 'Bilim Kurgu & Fantezi', percent: 25, color: 'bg-[#00e054]' },
  { genre: 'Drama & Suç', percent: 25, color: 'bg-blue-500' },
  { genre: 'Korku & Gerilim', percent: 25, color: 'bg-rose-500' }
];

export interface GenreItem {
  genre: string;
  percent: number;
  color: string;
}

/**
 * Calculates genre distribution from a list of watched items.
 */
export function calculateGenreDistribution(
  watchedList: WatchStatus[],
  defaultFallback: GenreItem[] = DEFAULT_TV_GENRE_DISTRIBUTION
): GenreItem[] {
  if (!watchedList || watchedList.length === 0) {
    return defaultFallback;
  }

  const counts: Record<string, number> = {};
  let totalOccurrences = 0;

  watchedList.forEach(item => {
    const itemGenres: string[] = [];

    if (item.genres && item.genres.length > 0) {
      item.genres.forEach(g => {
        if (g.name) itemGenres.push(g.name);
      });
    } else if (item.genre_ids && item.genre_ids.length > 0) {
      item.genre_ids.forEach(id => {
        if (TMDB_GENRE_NAMES[id]) itemGenres.push(TMDB_GENRE_NAMES[id]);
      });
    } else if ((item as any).genre) {
      itemGenres.push((item as any).genre);
    }

    if (itemGenres.length === 0) {
      const titleLower = (item.title || '').toLowerCase();

      // Animasyon & Anime
      if (
        titleLower.includes('bleach') ||
        titleLower.includes('futurama') ||
        titleLower.includes('one piece') ||
        titleLower.includes('lucky') ||
        titleLower.includes('minion') ||
        titleLower.includes('rick') ||
        titleLower.includes('simpson') ||
        titleLower.includes('arcane') ||
        titleLower.includes('naruto') ||
        titleLower.includes('titan') ||
        titleLower.includes('dragon ball') ||
        titleLower.includes('anime') ||
        titleLower.includes('animasyon')
      ) {
        itemGenres.push('Animasyon');
      }

      // Bilim Kurgu
      if (
        titleLower.includes('severance') ||
        titleLower.includes('interstellar') ||
        titleLower.includes('dune') ||
        titleLower.includes('backrooms') ||
        titleLower.includes('sci-fi') ||
        titleLower.includes('star') ||
        titleLower.includes('matrix') ||
        titleLower.includes('kurgu') ||
        titleLower.includes('black mirror')
      ) {
        itemGenres.push('Bilim Kurgu');
      }

      // Komedi
      if (
        titleLower.includes('ted lasso') ||
        titleLower.includes('gervais') ||
        titleLower.includes('alley cats') ||
        titleLower.includes('office') ||
        titleLower.includes('friends') ||
        titleLower.includes('brooklyn') ||
        titleLower.includes('komedi') ||
        titleLower.includes('comedy') ||
        titleLower.includes('himym')
      ) {
        itemGenres.push('Komedi');
      }

      // Aksiyon & Macera
      if (
        titleLower.includes('lanterns') ||
        titleLower.includes('furious') ||
        titleLower.includes('fury') ||
        titleLower.includes('batman') ||
        titleLower.includes('marvel') ||
        titleLower.includes('avengers') ||
        titleLower.includes('spider') ||
        titleLower.includes('action') ||
        titleLower.includes('aksiyon') ||
        titleLower.includes('fast') ||
        titleLower.includes('macera')
      ) {
        itemGenres.push('Aksiyon & Macera');
      }

      // Suç & Gizem
      if (
        titleLower.includes('breaking bad') ||
        titleLower.includes('better call saul') ||
        titleLower.includes('dexter') ||
        titleLower.includes('sherlock') ||
        titleLower.includes('mindhunter') ||
        titleLower.includes('suç') ||
        titleLower.includes('crime') ||
        titleLower.includes('gizem') ||
        titleLower.includes('mystery')
      ) {
        itemGenres.push('Suç');
      }

      // Korku & Gerilim
      if (
        titleLower.includes('alien') ||
        titleLower.includes('conjuring') ||
        titleLower.includes('saw') ||
        titleLower.includes('halloween') ||
        titleLower.includes('korku') ||
        titleLower.includes('horror') ||
        titleLower.includes('gerilim') ||
        titleLower.includes('thriller')
      ) {
        itemGenres.push('Korku');
      }

      // Dram / Drama
      if (
        titleLower.includes('dragon') ||
        titleLower.includes('bear') ||
        titleLower.includes('shogun') ||
        titleLower.includes('crown') ||
        titleLower.includes('succession') ||
        titleLower.includes('drama') ||
        titleLower.includes('dram')
      ) {
        itemGenres.push('Drama');
      }

      // Fallback default based on media_type
      if (itemGenres.length === 0) {
        if (item.media_type === 'tv') {
          itemGenres.push('Aksiyon & Macera');
        } else {
          itemGenres.push('Bilim Kurgu');
        }
      }
    }

    itemGenres.forEach(gName => {
      counts[gName] = (counts[gName] || 0) + 1;
      totalOccurrences++;
    });
  });

  if (totalOccurrences === 0) {
    return defaultFallback;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topGenres = sorted.slice(0, 4);
  const topSum = topGenres.reduce((sum, [, c]) => sum + c, 0);

  let remainingPercent = 100;
  return topGenres.map(([genreName, count], idx) => {
    let percent: number;
    if (idx === topGenres.length - 1) {
      percent = remainingPercent;
    } else {
      percent = Math.round((count / topSum) * 100);
      remainingPercent -= percent;
    }
    return {
      genre: genreName,
      percent: Math.max(percent, 1),
      color: GENRE_COLOR_PALETTE[idx % GENRE_COLOR_PALETTE.length]
    };
  });
}
