import { useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification, NotificationSettings, WatchStatus, EpisodeProgress, TMDBMedia } from '../types';
import { getDetails, getPosterUrl } from '../lib/tmdb';

const NOTIFICATIONS_STORAGE_KEY = 'diziapp_notifications';
const SETTINGS_STORAGE_KEY = 'diziapp_notification_settings';
const DISMISSED_STORAGE_KEY = 'diziapp_dismissed_notifications';

const DEFAULT_SETTINGS: NotificationSettings = {
  notifyNewEpisodes: true,
  notifyFriendActivity: true,
};

// In-memory cache for TMDB details during a session to avoid spamming the API
const showDetailsCache = new Map<number, { data: TMDBMedia; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export function useNotifications(
  watchList: WatchStatus[] = [],
  episodeProgress: EpisodeProgress[] = []
) {
  // 1. Notifications List State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
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
      const todayStr = new Date().toISOString().split('T')[0];
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

            // User's watched episodes for this show
            const watchedEps = episodeProgress.filter(
              ep => Number(ep.show_id) === Number(showItem.media_id) && ep.is_watched
            );

            // Compute user's max watched season & episode
            const watchedSeasons = Array.from(new Set(watchedEps.map(e => Number(e.season_number)))).sort((a, b) => a - b);
            const maxWatchedSeason = watchedSeasons.length > 0 
              ? Math.max(...watchedSeasons) 
              : (showItem.status === 'watched' ? 1 : 0);

            // 1. CHECK FOR NEW SEASONS
            // Filter main seasons (season_number > 0 and has episodes)
            const mainSeasons = seasons
              .filter(s => s.season_number > 0 && (s.episode_count || 0) > 0)
              .sort((a, b) => a.season_number - b.season_number);

            for (const s of mainSeasons) {
              const sNum = Number(s.season_number);
              const epCount = Number(s.episode_count || 0);

              // Has this season aired?
              const seasonHasAired = Boolean(
                (s.air_date && s.air_date <= todayStr) ||
                (lastEpToAir && Number(lastEpToAir.season_number) >= sNum)
              );

              if (!seasonHasAired) continue;

              const watchedInThisSeason = watchedEps.filter(e => Number(e.season_number) === sNum).length;

              // CONDITION FOR NEW SEASON:
              // User has completed or watched prior season(s) (maxWatchedSeason >= 1),
              // and this season sNum is greater than maxWatchedSeason,
              // and user has not watched any episode in this new season yet.
              if (sNum > maxWatchedSeason && maxWatchedSeason >= 1 && watchedInThisSeason === 0) {
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
                    created_at: s.air_date ? `${s.air_date}T00:00:00Z` : new Date().toISOString(),
                    is_read: false
                  });
                }
              }

              // 2. CHECK FOR NEW EPISODES IN CURRENT WATCHED SEASON
              // If user is currently watching season sNum (sNum === maxWatchedSeason),
              // but newer episodes in this season have aired that user hasn't watched yet:
              if (sNum === maxWatchedSeason && lastEpToAir && Number(lastEpToAir.season_number) === sNum) {
                const lastAiredEpNum = Number(lastEpToAir.episode_number);
                const maxWatchedEpInSeason = watchedEps
                  .filter(e => Number(e.season_number) === sNum)
                  .reduce((max, e) => Math.max(max, Number(e.episode_number)), 0);

                const epHasAired = Boolean(lastEpToAir.air_date && lastEpToAir.air_date <= todayStr);

                if (epHasAired && lastAiredEpNum > maxWatchedEpInSeason) {
                  const notifId = `new-ep-${showItem.media_id}-s${sNum}-e${lastAiredEpNum}`;

                  if (!dismissedIds.has(notifId)) {
                    newlyDiscovered.push({
                      id: notifId,
                      type: 'new_episode',
                      title: `📺 ${showTitle}: Yeni Bölüm Yayında!`,
                      message: `S${sNum}B${lastAiredEpNum} (${lastEpToAir.name || 'Yeni Bölüm'}) yayınlandı.`,
                      media_id: showItem.media_id,
                      media_type: 'tv',
                      media_title: showTitle,
                      media_poster: posterPath,
                      season_number: sNum,
                      episode_number: lastAiredEpNum,
                      episode_name: lastEpToAir.name,
                      created_at: lastEpToAir.air_date ? `${lastEpToAir.air_date}T00:00:00Z` : new Date().toISOString(),
                      is_read: false
                    });
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`Notification scan failed for show ${showItem.media_id}:`, err);
          }
        })
      );

      // Merge newly discovered notifications with current notifications
      if (newlyDiscovered.length > 0) {
        setNotifications(prev => {
          const map = new Map<string, AppNotification>();
          // Keep existing notifications (with their is_read status intact)
          prev.forEach(n => map.set(n.id, n));
          // Add new ones
          newlyDiscovered.forEach(n => {
            if (!map.has(n.id)) {
              map.set(n.id, n);
            }
          });
          // Sort by created_at descending (newest first)
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }
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
