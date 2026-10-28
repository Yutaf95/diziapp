import { EpisodeProgress } from '../types';

/**
 * Formats an ISO string or timestamp to Turkish readable date (e.g. '14 Eki 2026')
 */
export function formatTurkishDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats a date to Turkish short readable date (e.g. '14 Eki' or '14 Eki 2026' if different year)
 */
export function formatTurkishShortDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0];
  const currentYear = new Date().getFullYear();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (y !== currentYear) {
      return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== currentYear) {
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/**
 * Determines whether a TV episode has aired yet based on air_date and optional show status
 */
export function isEpisodeAired(airDateStr?: string | null, showStatus?: string): boolean {
  if (airDateStr) {
    const cleanDateStr = airDateStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return cleanDateStr <= todayStr;
    }
    const airDate = new Date(airDateStr);
    if (!isNaN(airDate.getTime())) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return airDate <= today;
    }
  }
  // If air_date is missing:
  // If the show has already ended or been canceled, older episodes might lack air_date in TMDB, treat as aired.
  if (showStatus === 'Ended' || showStatus === 'Canceled') {
    return true;
  }
  // If the show is running or announced and air_date is missing: not yet aired.
  return false;
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
): { startDate: string | null; finishDate: string | null; isArchived: boolean } {
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
  const createdTime = itemCreatedAt ? new Date(itemCreatedAt).getTime() : NaN;

  if (timestamps.length > 0) {
    const earliestEpTime = timestamps[0];
    // If show was added/created earlier than earliest recorded episode timestamp, prefer itemCreatedAt as true start date
    if (!isNaN(createdTime) && createdTime < earliestEpTime) {
      startDate = formatTurkishDate(itemCreatedAt);
    } else {
      startDate = formatTurkishDate(new Date(earliestEpTime).toISOString());
    }
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

  // Detect bulk archival additions:
  // If show has > 6 episodes and earliest and latest episode have identical calendar date (bulk marked in one go),
  // or marked as 'watched' directly without individual episode watches:
  const isArchived = Boolean(
    itemStatus === 'watched' && (
      (timestamps.length > 6 && startDate !== null && startDate === finishDate) ||
      (timestamps.length === 0 && (itemUpdatedAt || itemCreatedAt))
    )
  );

  return { startDate, finishDate, isArchived };
}

/**
 * Resolves finish/watched date for a movie
 */
export function getMovieFinishDate(itemUpdatedAt?: string, itemCreatedAt?: string): string | null {
  return formatTurkishDate(itemUpdatedAt || itemCreatedAt);
}
