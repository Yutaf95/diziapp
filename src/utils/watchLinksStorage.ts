import { CustomWatchLink } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'diziapp_watch_links';

export interface DetectedPattern {
  detectedSeason: number;
  detectedEpisode: number;
  urlTemplate: string;
  padSeason: boolean;
  padEpisode: boolean;
}

// Helper to safely get the current logged in user ID
const getCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

// Clean and extract a readable brand / site name from domain URL
export const extractCleanSiteName = (url: string): string => {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    const hostname = new URL(clean).hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    let base = parts[0] || 'İzleme Sitesi';

    const lower = base.toLowerCase();
    if (lower.startsWith('sezonlukdizi')) return 'SezonlukDizi';
    if (lower.startsWith('dizipal')) return 'Dizipal';
    if (lower.startsWith('dizibox')) return 'DiziBox';
    if (lower.startsWith('diziwatch')) return 'DiziWatch';
    if (lower.startsWith('dizilla')) return 'Dizilla';
    if (lower.startsWith('yabancidizi')) return 'YabancıDizi';
    if (lower.startsWith('sinefy')) return 'Sinefy';
    if (lower.startsWith('blutv')) return 'BluTV';
    if (lower.startsWith('netflix')) return 'Netflix';
    if (lower.startsWith('disney')) return 'Disney+';
    if (lower.startsWith('prime')) return 'Prime Video';
    if (lower.startsWith('gain')) return 'GAİN';
    if (lower.startsWith('tod')) return 'TOD';

    // Remove trailing numbers (e.g. dizipal942 -> Dizipal)
    const cleanedBase = base.replace(/\d+$/, '');
    if (cleanedBase.length >= 3) {
      base = cleanedBase;
    }

    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'İzleme Sitesi';
  }
};

// Smart URL Pattern Analyzer: Learns season & episode structure from an entered episode link
export const analyzeEpisodeUrl = (
  rawUrl: string,
  hintSeason?: number,
  hintEpisode?: number
): DetectedPattern | null => {
  if (!rawUrl) return null;
  const url = rawUrl.trim();

  // Pattern 1: e.g. "1-sezon-3-bolum" or "1.sezon-3.bolum"
  const pat1 = /([0-9]+)[-_.]*(?:sezon|season)[-_./ ]+([0-9]+)[-_.]*(?:bolum|episode)/i;
  const match1 = url.match(pat1);
  if (match1 && match1.index !== undefined) {
    const sStr = match1[1];
    const eStr = match1[2];
    const fullMatch = match1[0];
    const replaced = fullMatch.replace(sStr, '{season}').replace(eStr, '{episode}');
    const template = url.slice(0, match1.index) + replaced + url.slice(match1.index + fullMatch.length);
    return {
      detectedSeason: parseInt(sStr, 10),
      detectedEpisode: parseInt(eStr, 10),
      urlTemplate: template,
      padSeason: sStr.length > 1 && sStr.startsWith('0'),
      padEpisode: eStr.length > 1 && eStr.startsWith('0'),
    };
  }

  // Pattern 2: e.g. "sezon-1/bolum-3" or "sezon-1-bolum-3" or "season/1/episode/3"
  const pat2 = /(?:sezon|season)[-_./ ]*([0-9]+)[-_./ ]+(?:bolum|episode)[-_./ ]*([0-9]+)/i;
  const match2 = url.match(pat2);
  if (match2 && match2.index !== undefined) {
    const sStr = match2[1];
    const eStr = match2[2];
    const fullMatch = match2[0];
    const replaced = fullMatch.replace(sStr, '{season}').replace(eStr, '{episode}');
    const template = url.slice(0, match2.index) + replaced + url.slice(match2.index + fullMatch.length);
    return {
      detectedSeason: parseInt(sStr, 10),
      detectedEpisode: parseInt(eStr, 10),
      urlTemplate: template,
      padSeason: sStr.length > 1 && sStr.startsWith('0'),
      padEpisode: eStr.length > 1 && eStr.startsWith('0'),
    };
  }

  // Pattern 3: e.g. "s01e03" or "S1E3" or "s1-e3"
  const pat3 = /[sS]([0-9]+)[-_.]*[eE]([0-9]+)/;
  const match3 = url.match(pat3);
  if (match3 && match3.index !== undefined) {
    const sStr = match3[1];
    const eStr = match3[2];
    const fullMatch = match3[0];
    const replaced = fullMatch.replace(sStr, '{season}').replace(eStr, '{episode}');
    const template = url.slice(0, match3.index) + replaced + url.slice(match3.index + fullMatch.length);
    return {
      detectedSeason: parseInt(sStr, 10),
      detectedEpisode: parseInt(eStr, 10),
      urlTemplate: template,
      padSeason: sStr.length > 1 && sStr.startsWith('0'),
      padEpisode: eStr.length > 1 && eStr.startsWith('0'),
    };
  }

  // Pattern 4: e.g. "1x03" or "01x03"
  const pat4 = /([0-9]+)[xX]([0-9]+)/;
  const match4 = url.match(pat4);
  if (match4 && match4.index !== undefined) {
    const sStr = match4[1];
    const eStr = match4[2];
    const fullMatch = match4[0];
    const replaced = fullMatch.replace(sStr, '{season}').replace(eStr, '{episode}');
    const template = url.slice(0, match4.index) + replaced + url.slice(match4.index + fullMatch.length);
    return {
      detectedSeason: parseInt(sStr, 10),
      detectedEpisode: parseInt(eStr, 10),
      urlTemplate: template,
      padSeason: sStr.length > 1 && sStr.startsWith('0'),
      padEpisode: eStr.length > 1 && eStr.startsWith('0'),
    };
  }

  // Pattern 5: Hint-based pattern if provided
  if (hintSeason && hintEpisode) {
    const sNumStr = String(hintSeason);
    const eNumStr = String(hintEpisode);
    const sPadStr = sNumStr.padStart(2, '0');
    const ePadStr = eNumStr.padStart(2, '0');

    const targetS = url.includes(sPadStr) ? sPadStr : (url.includes(sNumStr) ? sNumStr : null);
    const targetE = url.includes(ePadStr) ? ePadStr : (url.includes(eNumStr) ? eNumStr : null);

    if (targetS && targetE && targetS !== targetE) {
      const sIndex = url.lastIndexOf(targetS);
      const eIndex = url.lastIndexOf(targetE);
      if (sIndex !== -1 && eIndex !== -1 && sIndex !== eIndex) {
        let template = url;
        if (sIndex < eIndex) {
          template = template.slice(0, eIndex) + '{episode}' + template.slice(eIndex + targetE.length);
          template = template.slice(0, sIndex) + '{season}' + template.slice(sIndex + targetS.length);
        } else {
          template = template.slice(0, sIndex) + '{season}' + template.slice(sIndex + targetS.length);
          template = template.slice(0, eIndex) + '{episode}' + template.slice(eIndex + targetE.length);
        }
        return {
          detectedSeason: hintSeason,
          detectedEpisode: hintEpisode,
          urlTemplate: template,
          padSeason: targetS.length > 1 && targetS.startsWith('0'),
          padEpisode: targetE.length > 1 && targetE.startsWith('0'),
        };
      }
    }
  }

  return null;
};

// Generates next episode URL using learned template
export const generateEpisodeUrl = (
  link: CustomWatchLink,
  seasonNum: number,
  episodeNum: number
): string => {
  if (!link.url_template) return link.url;
  const sStr = link.pad_season ? String(seasonNum).padStart(2, '0') : String(seasonNum);
  const eStr = link.pad_episode ? String(episodeNum).padStart(2, '0') : String(episodeNum);
  return link.url_template.replace('{season}', sStr).replace('{episode}', eStr);
};

// Helper to safely read from localStorage
export const getStoredWatchLinks = (): CustomWatchLink[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading watch links from localStorage', e);
    return [];
  }
};

// Helper to save to localStorage and dispatch update event
export const saveStoredWatchLinks = (links: CustomWatchLink[]): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    window.dispatchEvent(new CustomEvent('diziapp_watch_links_updated', { detail: links }));
  } catch (e) {
    console.error('Error saving watch links to localStorage', e);
  }
};

// Get links for a specific media ID
export const getLinksForMedia = (mediaId: number): CustomWatchLink[] => {
  const all = getStoredWatchLinks();
  return all.filter(l => Number(l.media_id) === Number(mediaId));
};

// Synchronize watch links with Supabase across all devices
export const syncWatchLinksWithSupabase = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { data, error } = await supabase
      .from('watch_links')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist yet, gracefully skip without breaking the app
      return;
    }

    const localLinks = getStoredWatchLinks();
    const remoteLinks: CustomWatchLink[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      media_id: row.media_id,
      site_name: row.site_name,
      url: row.url,
      season_number: row.season_number,
      episode_number: row.episode_number,
      url_template: row.url_template,
      pad_season: row.pad_season,
      pad_episode: row.pad_episode,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    // Intelligent 2-way Merge:
    const mergedMap = new Map<string, CustomWatchLink>();
    remoteLinks.forEach(rl => mergedMap.set(rl.id, rl));

    const localOnlyLinks: CustomWatchLink[] = [];
    localLinks.forEach(ll => {
      if (!mergedMap.has(ll.id)) {
        mergedMap.set(ll.id, { ...ll, user_id: userId });
        localOnlyLinks.push({ ...ll, user_id: userId });
      }
    });

    const mergedArray = Array.from(mergedMap.values());
    saveStoredWatchLinks(mergedArray);

    // If there were local links not yet in Supabase, upload them now
    if (localOnlyLinks.length > 0) {
      const rowsToUpsert = localOnlyLinks.map(l => ({
        id: l.id,
        user_id: userId,
        media_id: l.media_id,
        site_name: l.site_name,
        url: l.url,
        season_number: l.season_number ?? null,
        episode_number: l.episode_number ?? null,
        url_template: l.url_template ?? null,
        pad_season: l.pad_season ?? false,
        pad_episode: l.pad_episode ?? false,
        created_at: l.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      await supabase.from('watch_links').upsert(rowsToUpsert);
    }
  } catch (e) {
    console.warn('Supabase watch_links sync skipped or table not created yet:', e);
  }
};

// Auto-trigger sync on load in browser
if (typeof window !== 'undefined') {
  getCurrentUserId().then(uid => {
    if (uid) syncWatchLinksWithSupabase(uid);
  });
}

// Add a new watch link (Dual-layer: LocalStorage + Supabase)
export const addWatchLink = (
  linkData: Omit<CustomWatchLink, 'id' | 'created_at'>
): CustomWatchLink => {
  const all = getStoredWatchLinks();

  // Clean URL
  let cleanUrl = linkData.url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Derive clean site name automatically if empty
  let siteName = linkData.site_name?.trim();
  if (!siteName) {
    siteName = extractCleanSiteName(cleanUrl);
  }

  // Auto-detect pattern if not already provided
  let urlTemplate = linkData.url_template;
  let padSeason = linkData.pad_season;
  let padEpisode = linkData.pad_episode;
  let seasonNumber = linkData.season_number;
  let episodeNumber = linkData.episode_number;

  if (!urlTemplate) {
    const pattern = analyzeEpisodeUrl(cleanUrl, seasonNumber, episodeNumber);
    if (pattern) {
      urlTemplate = pattern.urlTemplate;
      padSeason = pattern.padSeason;
      padEpisode = pattern.padEpisode;
      if (seasonNumber === undefined) seasonNumber = pattern.detectedSeason;
      if (episodeNumber === undefined) episodeNumber = pattern.detectedEpisode;
    }
  }

  const now = new Date().toISOString();
  const newLink: CustomWatchLink = {
    ...linkData,
    id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url: cleanUrl,
    site_name: siteName,
    url_template: urlTemplate,
    pad_season: padSeason,
    pad_episode: padEpisode,
    season_number: seasonNumber,
    episode_number: episodeNumber,
    created_at: now,
    updated_at: now
  };

  const updated = [newLink, ...all];
  saveStoredWatchLinks(updated);

  // Background Supabase Sync
  getCurrentUserId().then(userId => {
    if (userId && isSupabaseConfigured) {
      supabase.from('watch_links').upsert({
        id: newLink.id,
        user_id: userId,
        media_id: newLink.media_id,
        site_name: newLink.site_name,
        url: newLink.url,
        season_number: newLink.season_number ?? null,
        episode_number: newLink.episode_number ?? null,
        url_template: newLink.url_template ?? null,
        pad_season: newLink.pad_season ?? false,
        pad_episode: newLink.pad_episode ?? false,
        created_at: newLink.created_at,
        updated_at: now
      }).then(({ error }) => {
        if (error) console.warn('Supabase watch_links upsert error (table may not exist):', error.message);
      }).catch(() => {});
    }
  });

  return newLink;
};

// Update an existing watch link (Dual-layer: LocalStorage + Supabase)
export const updateWatchLink = (
  id: string,
  updates: Partial<Omit<CustomWatchLink, 'id' | 'created_at'>>
): void => {
  const all = getStoredWatchLinks();
  const index = all.findIndex(l => l.id === id);
  if (index === -1) return;

  let cleanUrl = updates.url ? updates.url.trim() : all[index].url;
  if (updates.url && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let siteName = updates.site_name !== undefined ? updates.site_name.trim() : all[index].site_name;
  if (!siteName) {
    siteName = extractCleanSiteName(cleanUrl);
  }

  // Re-analyze pattern if url changed
  let urlTemplate = updates.url_template ?? all[index].url_template;
  let padSeason = updates.pad_season ?? all[index].pad_season;
  let padEpisode = updates.pad_episode ?? all[index].pad_episode;

  if (updates.url && updates.url !== all[index].url) {
    const pattern = analyzeEpisodeUrl(cleanUrl, updates.season_number, updates.episode_number);
    if (pattern) {
      urlTemplate = pattern.urlTemplate;
      padSeason = pattern.padSeason;
      padEpisode = pattern.padEpisode;
    }
  }

  const now = new Date().toISOString();
  all[index] = {
    ...all[index],
    ...updates,
    url: cleanUrl,
    site_name: siteName,
    url_template: urlTemplate,
    pad_season: padSeason,
    pad_episode: padEpisode,
    updated_at: now
  };

  saveStoredWatchLinks(all);

  // Background Supabase Sync
  getCurrentUserId().then(userId => {
    if (userId && isSupabaseConfigured) {
      supabase.from('watch_links').update({
        site_name: siteName,
        url: cleanUrl,
        season_number: all[index].season_number,
        episode_number: all[index].episode_number,
        url_template: urlTemplate,
        pad_season: padSeason ?? false,
        pad_episode: padEpisode ?? false,
        updated_at: now
      }).eq('id', id).catch(() => {});
    }
  });
};

// Delete a watch link (Dual-layer: LocalStorage + Supabase)
export const deleteWatchLink = (id: string): void => {
  const all = getStoredWatchLinks();
  const filtered = all.filter(l => l.id !== id);
  saveStoredWatchLinks(filtered);

  // Background Supabase Sync
  getCurrentUserId().then(userId => {
    if (userId && isSupabaseConfigured) {
      supabase.from('watch_links').delete().eq('id', id).catch(() => {});
    }
  });
};
