import { useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification, NotificationSettings, WatchStatus, EpisodeProgress, TMDBMedia, TMDBSeasonDetails } from '../types';
import { getDetails, getPosterUrl, getSeasonDetails } from '../lib/tmdb';

const NOTIFICATIONS_STORAGE_KEY = 'diziapp_notifications';
const SETTINGS_STORAGE_KEY = 'diziapp_notification_settings';
const DISMISSED_STORAGE_KEY = 'diziapp_dismissed_notifications';

const DEFAULT_SETTINGS: NotificationSettings = {
  notifyNewEpisodes: true,
  notifyFriendActivity: true,
};

// 60-day lookback window for broadcast notifications (gives plenty of time if user is away for weeks)
const LOOKBACK_DAYS = 60;
const LOOKBACK_DAYS_MS = 1000 * 60 * 60 * 24 * LOOKBACK_DAYS;

// In-memory cache for TMDB details and season details during a session to avoid spamming the API
const showDetailsCache = new Map<number, { data: TMDBMedia; timestamp: number }>();
const seasonDetailsCache = new Map<string, { data: TMDBSeasonDetails; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export function useNotifications(
  watchList: WatchStatus[] = [],
  episodeProgress: EpisodeProgress[] = []
) {
  // 1. Notifications List State (auto-purges stale broadcast notifications older than LOOKBACK_DAYS)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cutoffMs = Date.now() - LOOKBACK_DAYS_MS;
            return parsed.filter(n => {
              // Custom / friend notifications are kept intact
              if (n.type !== 'new_episode' && n.type !== 'new_season') return true;
              const notifTime = new Date(n.created_at).getTime();
              return !isNaN(notifTime) && notifTime >= cutoffMs;
            });
          }
        }
      } catch (e) {
        console.error('Error loading notifications from localStorage:', e);
      }
    }
    return [];
  });

  // 2. Settings State
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Dismissed IDs State
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(DISMISSED_STORAGE_KEY);
        if (saved) return new Set(JSON.parse(saved));
      } catch (e) {}
    }
    return new Set<string>();
  });

  const [isScanning, setIsScanning] = useState(false);
  const scanInProgressRef = useRef(false);

  // Sync notifications to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      } catch (e) {}
    }
  }, [notifications]);

  // Sync settings to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {}
    }
  }, [settings]);

  // Sync dismissed IDs to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds)));
      } catch (e) {}
    }
  }, [dismissedIds]);

  // Helper: Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, is_read: true } : notif))
    );
  }, []);

  // Helper: Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
  }, []);

  // Helper: Delete single notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    setDismissedIds(prev => new Set(prev).add(id));
  }, []);

  // Helper: Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      const allIds = prev.map(n => n.id);
      setDismissedIds(dPrev => {
        const next = new Set(dPrev);
        allIds.forEach(id => next.add(id));
        return next;
      });
      return [];
    });
  }, []);

  // Helper: Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Helper: Add custom notification (e.g. friend activity)
  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'> & { id?: string }) => {
    const id = notif.id || `notif-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (dismissedIds.has(id)) return;

    setNotifications(prev => {
      if (prev.some(n => n.id === id)) return prev;
      const created: AppNotification = {
        ...notif,
        id,
        created_at: new Date().toISOString(),
        is_read: false
      };
      return [created, ...prev];
    });
  }, [dismissedIds]);

  // Core Function: Check for new seasons and episodes
  const scanForNewEpisodes = useCallback(async () => {
    if (!settings.notifyNewEpisodes) return;
    if (scanInProgressRef.current) return;

    const tvShows = watchList.filter(
      item => item.media_type === 'tv' && (item.status === 'watching' || item.status === 'watched')
    );

    if (tvShows.length === 0) return;

    scanInProgressRef.current = true;
    setIsScanning(true);

    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lookbackDate = new Date(now.getTime() - LOOKBACK_DAYS_MS);
      const lookbackDateStr = lookbackDate.toISOString().split('T')[0];
      const newlyDiscovered: AppNotification[] = [];

      await Promise.allSettled(
        tvShows.map(async showItem => {
          try {
            // Check in-memory cache
            let details: any = null;
            const cached = showDetailsCache.get(showItem.media_id);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
              details = cached.data;
            } else {
              details = await getDetails(showItem.media_id, 'tv');
              if (details) {
                showDetailsCache.set(showItem.media_id, { data: details, timestamp: Date.now() });
              }
            }

            if (!details) return;

            const showTitle = showItem.title || details.name || 'Dizi';
            const posterPath = getPosterUrl(details.poster_path || showItem.poster_path || null);
            const seasons: any[] = details.seasons || [];
            const lastEpToAir = details.last_episode_to_air;
            const lastAiredDate = lastEpToAir?.air_date || '';

            // 1. FILTER OUT HISTORICAL / ENDED SHOWS
            // If the show has ended or been canceled, and its last episode aired before our lookback window:
            // Skip completely! (e.g. Lie to Me ended in 2011)
            const isEnded = details.status === 'Ended' || details.status === 'Canceled';
            if (isEnded && (!lastAiredDate || lastAiredDate < lookbackDateStr)) {
              return;
            }

            // User's watched episodes for this show
            const watchedEps = episodeProgress.filter(
              ep => Number(ep.show_id) === Number(showItem.media_id) && ep.is_watched
            );

            // Compute user's max watched season
            const watchedSeasons = Array.from(new Set(watchedEps.map(e => Number(e.season_number)))).sort((a, b) => a - b);
            const maxWatchedSeason = watchedSeasons.length > 0 
              ? Math.max(...watchedSeasons) 
              : (showItem.status === 'watched' ? 1 : 0);

            // Filter main seasons (season_number > 0 and has episodes)
            const mainSeasons = seasons
              .filter(s => s.season_number > 0 && (s.episode_count || 0) > 0)
              .sort((a, b) => a.season_number - b.season_number);

            // Candidate seasons to inspect:
            // - The season of the last aired episode (if any)
            // - Any season with air_date >= lookbackDateStr and air_date <= todayStr
            const candidateSeasonNums = new Set<number>();
            if (lastEpToAir?.season_number && Number(lastEpToAir.season_number) > 0) {
              candidateSeasonNums.add(Number(lastEpToAir.season_number));
            }
            mainSeasons.forEach(s => {
              const sNum = Number(s.season_number);
              if (s.air_date && s.air_date >= lookbackDateStr && s.air_date <= todayStr) {
                candidateSeasonNums.add(sNum);
              }
            });

            for (const sNum of candidateSeasonNums) {
              const seasonMeta = mainSeasons.find(s => Number(s.season_number) === sNum);
              const epCount = seasonMeta?.episode_count || 0;

              // CHECK FOR NEW SEASON:
              // Season released within lookback window, user watched prior season(s), hasn't watched this season yet
              if (
                seasonMeta?.air_date &&
                seasonMeta.air_date >= lookbackDateStr &&
                seasonMeta.air_date <= todayStr &&
                sNum > maxWatchedSeason &&
                maxWatchedSeason >= 1
              ) {
                const watchedInThisSeason = watchedEps.filter(e => Number(e.season_number) === sNum).length;
                if (watchedInThisSeason === 0) {
                  const notifId = `new-season-${showItem.media_id}-s${sNum}`;
                  if (!dismissedIds.has(notifId)) {
                    newlyDiscovered.push({
                      id: notifId,
                      type: 'new_season',
                      title: `🎉 ${showTitle}: ${sNum}. Sezon Yayında!`,
                      message: `${showTitle} için beklenen ${sNum}. Sezon (${epCount} bölüm) yayınlandı. Hemen izlemeye başla!`,
                      media_id: showItem.media_id,
                      media_type: 'tv',
                      media_title: showTitle,
                      media_poster: posterPath,
                      season_number: sNum,
                      episode_number: 1,
                      created_at: `${seasonMeta.air_date}T00:00:00Z`,
                      is_read: false
                    });
                  }
                }
              }

              // CHECK FOR NEW EPISODES (EACH EPISODE INDIVIDUALLY)
              let seasonEpisodes: any[] = [];
              const seasonCacheKey = `${showItem.media_id}_${sNum}`;
              const cachedSeason = seasonDetailsCache.get(seasonCacheKey);
              if (cachedSeason && Date.now() - cachedSeason.timestamp < CACHE_TTL_MS) {
                seasonEpisodes = cachedSeason.data.episodes || [];
              } else {
                try {
                  const sData = await getSeasonDetails(showItem.media_id, sNum);
                  if (sData?.episodes && Array.isArray(sData.episodes)) {
                    seasonEpisodes = sData.episodes;
                    seasonDetailsCache.set(seasonCacheKey, { data: sData, timestamp: Date.now() });
                  }
                } catch {
                  if (lastEpToAir && Number(lastEpToAir.season_number) === sNum) {
                    seasonEpisodes = [lastEpToAir];
                  }
                }
              }

              for (const ep of seasonEpisodes) {
                const epNum = Number(ep.episode_number);
                const epAirDate = ep.air_date;
                if (!epAirDate) continue;

                // Only consider episodes that aired within our lookback window
                const isAired = epAirDate <= todayStr && epAirDate >= lookbackDateStr;
                if (!isAired) continue;

                // Has user already watched this episode?
                const isWatchedByUser = watchedEps.some(
                  w => Number(w.season_number) === sNum && Number(w.episode_number) === epNum
                );
                if (isWatchedByUser) continue;

                const notifId = `new-ep-${showItem.media_id}-s${sNum}-e${epNum}`;
                if (dismissedIds.has(notifId)) continue;

                newlyDiscovered.push({
                  id: notifId,
                  type: 'new_episode',
                  title: `📺 ${showTitle}: Yeni Bölüm Yayında!`,
                  message: `S${sNum}B${epNum} (${ep.name || 'Yeni Bölüm'}) yayınlandı.`,
                  media_id: showItem.media_id,
                  media_type: 'tv',
                  media_title: showTitle,
                  media_poster: posterPath,
                  season_number: sNum,
                  episode_number: epNum,
                  episode_name: ep.name,
                  created_at: `${epAirDate}T00:00:00Z`,
                  is_read: false
                });
              }
            }
          } catch (err) {
            console.warn(`Notification scan failed for show ${showItem.media_id}:`, err);
          }
        })
      );

      // Clean up stale broadcast notifications and merge newly discovered notifications
      const cutoffMs = Date.now() - LOOKBACK_DAYS_MS;
      setNotifications(prev => {
        let changed = false;
        const map = new Map<string, AppNotification>();
        prev.forEach(n => {
          if (n.type === 'new_episode' || n.type === 'new_season') {
            const time = new Date(n.created_at).getTime();
            if (!isNaN(time) && time < cutoffMs) {
              changed = true;
              return;
            }
          }
          map.set(n.id, n);
        });

        if (newlyDiscovered.length > 0) {
          newlyDiscovered.forEach(n => {
            if (!map.has(n.id)) {
              map.set(n.id, n);
              changed = true;
            }
          });
        }

        if (!changed) return prev;

        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } catch (e) {
      console.error('Error during notification scan:', e);
    } finally {
      setIsScanning(false);
      scanInProgressRef.current = false;
    }
  }, [settings.notifyNewEpisodes, watchList, episodeProgress, dismissedIds]);

  // Run scan when watchList or episodeProgress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scanForNewEpisodes();
    }, 1200); // Small debounce to allow initial load to settle
    return () => clearTimeout(timer);
  }, [scanForNewEpisodes]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    settings,
    isScanning,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    addNotification,
    scanForNewEpisodes
  };
}
