import { EpisodeProgress } from '../types';

/**
 * Formats an ISO string or timestamp to Turkish readable date (e.g. '14 Eki 2026')
 */
export function formatTurkishDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Resolves start date (earliest episode watched) and finish date for a TV show
 */
export function getShowDates(
  showId: number,
  episodeProgress: EpisodeProgress[],
  itemStatus?: string,
  itemUpdatedAt?: string,
  itemCreatedAt?: string
): { startDate: string | null; finishDate: string | null } {
  const showEps = episodeProgress.filter(ep => Number(ep.show_id) === Number(showId) && ep.is_watched);

  const timestamps: number[] = [];
  showEps.forEach(ep => {
    const raw = ep.watched_at || (ep as any).created_at || (ep as any).updated_at;
    if (raw) {
      const t = new Date(raw).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
  });

  timestamps.sort((a, b) => a - b);

  let startDate: string | null = null;
  if (timestamps.length > 0) {
    startDate = formatTurkishDate(new Date(timestamps[0]).toISOString());
  } else if (itemCreatedAt) {
    startDate = formatTurkishDate(itemCreatedAt);
  }

  let finishDate: string | null = null;
  if (itemStatus === 'watched') {
    if (timestamps.length > 0) {
      finishDate = formatTurkishDate(new Date(timestamps[timestamps.length - 1]).toISOString());
    } else if (itemUpdatedAt || itemCreatedAt) {
      finishDate = formatTurkishDate(itemUpdatedAt || itemCreatedAt);
    }
  }

  return { startDate, finishDate };
}

/**
 * Resolves finish/watched date for a movie
 */
export function getMovieFinishDate(itemUpdatedAt?: string, itemCreatedAt?: string): string | null {
  return formatTurkishDate(itemUpdatedAt || itemCreatedAt);
}
