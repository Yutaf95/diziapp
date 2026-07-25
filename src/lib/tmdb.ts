import { TMDBMedia, TMDBSeasonDetails, TMDBEpisode, MediaType } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

let tmdbApiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TMDB_API_KEY) || (typeof process !== 'undefined' && process.env?.TMDB_API_KEY) || '62346a06c8b987069ad26a3fec8054a3';

export const setTmdbApiKey = (key: string) => {
  tmdbApiKey = key;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tvtime_tmdb_key', key);
  }
};

export const getStoredTmdbApiKey = (): string => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('tvtime_tmdb_key') || tmdbApiKey;
  }
  return tmdbApiKey;
};

// Helper for image URLs
export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500'): string => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=600&q=80';
  }
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null): string => getImageUrl(path, 'w500');
export const getBackdropUrl = (path: string | null): string => getImageUrl(path, 'original');

// Mock data store for instant offline/demo experience when no API key is set
const MOCK_TRENDING_SHOWS: TMDBMedia[] = [
  {
    id: 110492,
    name: 'Severance',
    title: 'Severance',
    overview: 'Mark, iş ve özel hayat anılarını cerrahi müdahaleyle birbirinden ayıran Lumon Industries şirketinde çalışan bir takıma liderlik etmektedir.',
    poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-02-18',
    vote_average: 8.7,
    vote_count: 1420,
    popularity: 98.4,
    number_of_seasons: 2,
    number_of_episodes: 19,
    genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Gizem' }, { id: 10765, name: 'Bilim Kurgu' }],
    status: 'Returning Series',
    tagline: 'Lumon sanayi hayatınızı değiştirecek.'
  },
  {
    id: 94997,
    name: 'House of the Dragon',
    title: 'House of the Dragon',
    overview: 'Game of Thrones olaylarından 200 yıl önce geçen dizi, Targaryen Hanedanı\'nın altın çağını ve Ejderhaların Dansı olarak bilinen iç savaşı konu alıyor.',
    poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-08-21',
    vote_average: 8.4,
    vote_count: 4200,
    popularity: 145.2,
    number_of_seasons: 2,
    number_of_episodes: 18,
    genres: [{ id: 10765, name: 'Aksiyon & Fantastik' }, { id: 18, name: 'Drama' }],
    status: 'Returning Series'
  },
  {
    id: 114472,
    name: 'The Bear',
    title: 'The Bear',
    overview: 'Fine-dining dünyasından genç bir şef olan Carmen "Carmy" Berzatto, aile trajedisinden sonra aile restoranını işletmek üzere Chicago\'ya geri döner.',
    poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2022-06-23',
    vote_average: 8.6,
    vote_count: 2100,
    popularity: 110.5,
    number_of_seasons: 3,
    number_of_episodes: 28,
    genres: [{ id: 18, name: 'Drama' }, { id: 35, name: 'Komedi' }],
    status: 'Returning Series'
  },
  {
    id: 1396,
    name: 'Breaking Bad',
    title: 'Breaking Bad',
    overview: 'Kanser olduğunu öğrenen bir kimya öğretmeni, ailesinin geleceğini güvence altına almak için eski bir öğrencisiyle metamfetamin üretip satmaya karar verir.',
    poster_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    media_type: 'tv',
    first_air_date: '2008-01-20',
    vote_average: 9.3,
    vote_count: 13500,
    popularity: 180.0,
    number_of_seasons: 5,
    number_of_episodes: 62,
    genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Suç' }],
    status: 'Ended'
  },
  {
    id: 693134,
    title: 'Dune: Part Two',
    name: 'Dune: Part Two',
    overview: 'Paul Atreides, ailesini yok eden komplo kurucularından intikam almak için Chani ve Fremenler ile birleşir.',
    poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    release_date: '2024-02-27',
    vote_average: 8.5,
    vote_count: 5100,
    popularity: 210.3,
    genres: [{ id: 878, name: 'Bilim Kurgu' }, { id: 12, name: 'Macera' }]
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    name: 'Oppenheimer',
    overview: 'Amerikalı bilim insanı J. Robert Oppenheimer ve atom bombasının geliştirilmesindeki rolünü anlatan biyografik drama.',
    poster_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
    backdrop_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    media_type: 'movie',
    release_date: '2023-07-19',
    vote_average: 8.1,
    vote_count: 8900,
    popularity: 165.8,
    genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'Tarih' }]
  }
];

const MOCK_SEASON_EPISODES: Record<string, TMDBSeasonDetails> = {
  '110492-1': {
    id: 1,
    season_number: 1,
    name: 'Sezon 1',
    overview: 'Severance 1. Sezon',
    poster_path: null,
    air_date: '2022-02-18',
    episodes: [
      { id: 101, episode_number: 1, season_number: 1, name: 'Good News About Hell', overview: 'Mark, Helly adında yeni bir çalışanın oryantasyon sürecini yönetir.', still_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', air_date: '2022-02-18', vote_average: 8.4, runtime: 57 },
      { id: 102, episode_number: 2, season_number: 1, name: 'Half Loop', overview: 'Ekip Macrodata Refinement departmanındaki hedeflerini tamamlamaya çalışır.', still_path: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', air_date: '2022-02-18', vote_average: 8.6, runtime: 53 },
      { id: 103, episode_number: 3, season_number: 1, name: 'In Perpetuity', overview: 'Mark ekibini Lumon\'un kurucularının sergilendiği kanat odasına götürür.', still_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', air_date: '2022-02-25', vote_average: 8.8, runtime: 54 },
      { id: 104, episode_number: 4, season_number: 1, name: 'The You You Are', overview: 'Helly departmandan kaçış planları yapmaya devam eder.', still_path: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', air_date: '2022-03-04', vote_average: 8.9, runtime: 52 },
      { id: 105, episode_number: 5, season_number: 1, name: 'The Grim Barbarity of Optics and Design', overview: 'Mark ile Irving diğer departmanlarla iletişim kurma yollarını arar.', still_path: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80', air_date: '2022-03-11', vote_average: 9.1, runtime: 55 },
      { id: 106, episode_number: 6, season_number: 1, name: 'Hide and Seek', overview: 'Cobel ekibin gizli planlarından şüphelenmeye başlar.', still_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', air_date: '2022-03-18', vote_average: 8.7, runtime: 48 },
      { id: 107, episode_number: 7, season_number: 1, name: 'Defiant Jazz', overview: 'Müzikli dans molası beklenmedik olaylara yol açar.', still_path: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', air_date: '2022-03-25', vote_average: 9.4, runtime: 50 },
      { id: 108, episode_number: 8, season_number: 1, name: 'What\'s for Dinner?', overview: 'Ekip aşırı mesai mekanizmasını aktive etmek için hazırlanır.', still_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', air_date: '2022-04-01', vote_average: 9.2, runtime: 45 },
      { id: 109, episode_number: 9, season_number: 1, name: 'The We We Are', overview: 'Nefes kesici sezon finali: Dış dünyadaki benlikler uyanır.', still_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80', air_date: '2022-04-08', vote_average: 9.7, runtime: 40 }
    ]
  },
  '110492-2': {
    id: 2,
    season_number: 2,
    name: 'Sezon 2',
    overview: 'Severance 2. Sezon',
    poster_path: null,
    air_date: '2025-01-17',
    episodes: [
      { id: 201, episode_number: 1, season_number: 2, name: 'Hello, Lumon', overview: 'Iç benlikler uyandıktan sonra Lumon şaşırtıcı tedbirler alır.', still_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', air_date: '2025-01-17', vote_average: 9.0, runtime: 56 },
      { id: 202, episode_number: 2, season_number: 2, name: 'Attainable Eudaimonia', overview: 'Mark yeni getirilen departman kurallarıyla mücadele eder.', still_path: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', air_date: '2025-01-24', vote_average: 8.9, runtime: 51 }
    ]
  }
};

/**
 * TMDB API Call: Search movies and TV shows
 */
export async function search(
  query: string,
  type: 'movie' | 'tv' | 'all' = 'all',
  page: number = 1
): Promise<{ results: TMDBMedia[]; total_results: number; page: number }> {
  const apiKey = getStoredTmdbApiKey();
  if (!apiKey || !query.trim()) {
    // Local filter search fallback
    const q = query.toLowerCase().trim();
    const filtered = MOCK_TRENDING_SHOWS.filter((item) => {
      const matchName = (item.title || item.name || '').toLowerCase().includes(q);
      const matchOverview = item.overview.toLowerCase().includes(q);
      const matchType = type === 'all' || item.media_type === type;
      return (matchName || matchOverview) && matchType;
    });
    return { results: filtered, total_results: filtered.length, page: 1 };
  }

  try {
    const endpoint = type === 'all' ? `${TMDB_BASE_URL}/search/multi` : `${TMDB_BASE_URL}/search/${type}`;
    const res = await fetch(`${endpoint}?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(query)}&page=${page}`);
    if (!res.ok) throw new Error(`TMDB Search failed with status ${res.status}`);
    const data = await res.json();
    
    const formattedResults: TMDBMedia[] = (data.results || []).map((item: any) => ({
      ...item,
      media_type: item.media_type || (type === 'all' ? (item.first_air_date ? 'tv' : 'movie') : type),
      title: item.title || item.name,
      name: item.name || item.title,
    }));

    return {
      results: formattedResults,
      total_results: data.total_results || formattedResults.length,
      page: data.page || page
    };
  } catch (error) {
    console.warn('TMDB API call failed, using fallback search.', error);
    const q = query.toLowerCase().trim();
    const filtered = MOCK_TRENDING_SHOWS.filter((item) => 
      (item.title || item.name || '').toLowerCase().includes(q)
    );
    return { results: filtered, total_results: filtered.length, page: 1 };
  }
}

/**
 * TMDB API Call: Get Trending Media
 */
export async function getTrending(
  type: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<{ results: TMDBMedia[]; page: number }> {
  const apiKey = getStoredTmdbApiKey();
  if (!apiKey) {
    const filtered = MOCK_TRENDING_SHOWS.filter((item) => type === 'all' || item.media_type === type);
    return { results: filtered, page: 1 };
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/${type}/${timeWindow}?api_key=${apiKey}&language=tr-TR&page=${page}`);
    if (!res.ok) throw new Error(`TMDB Trending failed with status ${res.status}`);
    const data = await res.json();

    const formatted: TMDBMedia[] = (data.results || []).map((item: any) => ({
      ...item,
      media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
      title: item.title || item.name,
      name: item.name || item.title,
    }));

    return { results: formatted, page: data.page || 1 };
  } catch (error) {
    console.warn('TMDB Trending failed, fallback to mock trending list.', error);
    const filtered = MOCK_TRENDING_SHOWS.filter((item) => type === 'all' || item.media_type === type);
    return { results: filtered, page: 1 };
  }
}

/**
 * TMDB API Call: Get Media Details by ID and Type
 */
export async function getDetails(
  id: number,
  type: MediaType
): Promise<TMDBMedia> {
  const apiKey = getStoredTmdbApiKey();
  if (!apiKey) {
    const found = MOCK_TRENDING_SHOWS.find((m) => m.id === id && m.media_type === type) || MOCK_TRENDING_SHOWS[0];
    return {
      ...found,
      id,
      media_type: type
    };
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${apiKey}&language=tr-TR&append_to_response=credits`);
    if (!res.ok) throw new Error(`TMDB Details failed with status ${res.status}`);
    const data = await res.json();

    const cast = (data.credits?.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path
    }));

    return {
      ...data,
      media_type: type,
      title: data.title || data.name,
      name: data.name || data.title,
      cast
    };
  } catch (error) {
    console.warn('TMDB getDetails error, fallback used.', error);
    const found = MOCK_TRENDING_SHOWS.find((m) => m.id === id) || MOCK_TRENDING_SHOWS[0];
    return { ...found, id, media_type: type };
  }
}

/**
 * TMDB API Call: Get Season Details with Episodes
 */
export async function getSeasonDetails(
  showId: number,
  seasonNumber: number
): Promise<TMDBSeasonDetails> {
  const apiKey = getStoredTmdbApiKey();
  const mockKey = `${showId}-${seasonNumber}`;

  if (!apiKey) {
    if (MOCK_SEASON_EPISODES[mockKey]) {
      return MOCK_SEASON_EPISODES[mockKey];
    }
    // Generate mock season data if not explicitly stored
    return generateFallbackSeason(showId, seasonNumber);
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${apiKey}&language=tr-TR`);
    if (!res.ok) throw new Error(`TMDB Season details failed for show ${showId} S${seasonNumber}`);
    const data = await res.json();
    return {
      id: data.id,
      season_number: data.season_number || seasonNumber,
      name: data.name || `Sezon ${seasonNumber}`,
      overview: data.overview || '',
      poster_path: data.poster_path,
      air_date: data.air_date || '',
      episodes: (data.episodes || []).map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        season_number: ep.season_number,
        name: ep.name,
        overview: ep.overview,
        still_path: ep.still_path,
        air_date: ep.air_date,
        vote_average: ep.vote_average,
        runtime: ep.runtime || 45
      }))
    };
  } catch (error) {
    console.warn('TMDB getSeasonDetails error, fallback mock season used.', error);
    return MOCK_SEASON_EPISODES[mockKey] || generateFallbackSeason(showId, seasonNumber);
  }
}

// Fallback generator for unlisted seasons
function generateFallbackSeason(showId: number, seasonNumber: number): TMDBSeasonDetails {
  const episodesCount = 10;
  const episodes: TMDBEpisode[] = [];
  for (let i = 1; i <= episodesCount; i++) {
    episodes.push({
      id: showId * 1000 + seasonNumber * 100 + i,
      episode_number: i,
      season_number: seasonNumber,
      name: `Bölüm ${i}`,
      overview: `Sezon ${seasonNumber} Bölüm ${i} heyecan dolu gelişmelerle devam ediyor.`,
      still_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      air_date: '2024-01-01',
      vote_average: 8.2 + (i % 3) * 0.3,
      runtime: 50
    });
  }
  return {
    id: showId * 10 + seasonNumber,
    season_number: seasonNumber,
    name: `Sezon ${seasonNumber}`,
    overview: `${seasonNumber}. Sezon bölümleri`,
    poster_path: null,
    air_date: '2024-01-01',
    episodes
  };
}
