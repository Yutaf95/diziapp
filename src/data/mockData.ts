import { Profile, ActivityFeedItem, RatingReview, WatchStatus, CustomCollection } from '../types';

export const CURRENT_USER: Profile = {
  id: 'usr_me_101',
  username: 'yufus_m',
  full_name: 'Yusuf Mutaf',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
  featured_media_title: 'Severance',
  bio: 'Sinema ve dizi tutkunu 🎬 TV Time bağımlısı!'
};

export const MOCK_FRIENDS: Profile[] = [
  {
    id: 'usr_friend_1',
    username: 'zeynep_k',
    full_name: 'Zeynep Kaya',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'Sci-fi & Mystery lover 🌌'
  },
  {
    id: 'usr_friend_2',
    username: 'ahmet_y',
    full_name: 'Ahmet Yılmaz',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    bio: 'Bütün dizileri 1.5x hızda izleyen adam ⚡'
  },
  {
    id: 'usr_friend_3',
    username: 'selin_d',
    full_name: 'Selin Demir',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    bio: 'Cinephile & TV Series Critic 🍿'
  },
  {
    id: 'usr_friend_4',
    username: 'can_b',
    full_name: 'Can Bölükbaşı',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    bio: 'Anime & Drama meraklısı 🎬'
  },
  {
    id: 'usr_friend_5',
    username: 'elif_s',
    full_name: 'Elif Soylu',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    bio: 'Korku & Gerilim sineması tutkunu 👻'
  },
  {
    id: 'usr_friend_6',
    username: 'mert_k',
    full_name: 'Mert Korkmaz',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    bio: 'Marvel & DC Sinematik Evren hayranı 🦸‍♂️'
  },
  {
    id: 'usr_friend_7',
    username: 'deniz_a',
    full_name: 'Deniz Aktaş',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    bio: 'K-Drama & Asya Sineması aşığı 🇰🇷🍿'
  }
];

export const INITIAL_USER_WATCH_STATUSES: WatchStatus[] = [
  {
    user_id: CURRENT_USER.id,
    media_id: 110492, // Severance
    media_type: 'tv',
    status: 'watching',
    title: 'Severance',
    poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    vote_average: 8.7,
    total_episodes: 19,
    total_seasons: 2
  },
  {
    user_id: CURRENT_USER.id,
    media_id: 94997, // House of the Dragon
    media_type: 'tv',
    status: 'watching',
    title: 'House of the Dragon',
    poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    vote_average: 8.4,
    total_episodes: 18,
    total_seasons: 2
  },
  {
    user_id: CURRENT_USER.id,
    media_id: 693134, // Dune Part Two
    media_type: 'movie',
    status: 'watched',
    title: 'Dune: Part Two',
    poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    vote_average: 8.5
  },
  {
    user_id: CURRENT_USER.id,
    media_id: 114472, // The Bear
    media_type: 'tv',
    status: 'plan_to_watch',
    title: 'The Bear',
    poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    vote_average: 8.6,
    total_episodes: 28,
    total_seasons: 3
  }
];

export const INITIAL_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: 'act_101',
    user_id: MOCK_FRIENDS[0].id,
    profile: MOCK_FRIENDS[0],
    action_type: 'episode_watched',
    media_id: 110492,
    media_type: 'tv',
    details: {
      media_title: 'Severance',
      media_poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      season_number: 1,
      episode_number: 9,
      episode_name: 'The We We Are'
    },
    created_at: '2026-07-21T10:30:00Z'
  },
  {
    id: 'act_102',
    user_id: MOCK_FRIENDS[1].id,
    profile: MOCK_FRIENDS[1],
    action_type: 'review_added',
    media_id: 693134,
    media_type: 'movie',
    details: {
      media_title: 'Dune: Part Two',
      media_poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      rating: 10,
      review_text: 'Sinemada izlediğim en muazzam bilim kurgu görsel şölenlerinden biriydi. Paul\'ün dönüm noktası sahnesi nefes kesti!',
      contains_spoiler: true
    },
    created_at: '2026-07-21T08:15:00Z'
  },
  {
    id: 'act_103',
    user_id: MOCK_FRIENDS[2].id,
    profile: MOCK_FRIENDS[2],
    action_type: 'status_update',
    media_id: 114472,
    media_type: 'tv',
    details: {
      media_title: 'The Bear',
      media_poster: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      status: 'watching'
    },
    created_at: '2026-07-20T21:40:00Z'
  },
  {
    id: 'act_104',
    user_id: MOCK_FRIENDS[0].id,
    profile: MOCK_FRIENDS[0],
    action_type: 'rating_given',
    media_id: 872585,
    media_type: 'movie',
    details: {
      media_title: 'Oppenheimer',
      media_poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
      rating: 9
    },
    created_at: '2026-07-19T14:20:00Z'
  }
];

export const INITIAL_REVIEWS: RatingReview[] = [
  {
    id: 'rev_1',
    user_id: MOCK_FRIENDS[1].id,
    profile: MOCK_FRIENDS[1],
    media_id: 110492,
    media_type: 'tv',
    media_title: 'Severance',
    media_poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    rating: 9,
    review_text: 'Dizinin atmosferi, sinematografisi ve gizem dozu harika ayarlanmış. Lumon\'un gizemini çözmek için sabırsızlanıyorum.',
    contains_spoiler: false,
    created_at: '2026-07-18T19:00:00Z'
  },
  {
    id: 'rev_2',
    user_id: MOCK_FRIENDS[2].id,
    profile: MOCK_FRIENDS[2],
    media_id: 693134,
    media_type: 'movie',
    media_title: 'Dune: Part Two',
    media_poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    rating: 10,
    review_text: 'Chani ve Paul arasındaki çatışma ve Harkonnen sahnelerindeki siyah-beyaz gezegen çekimi efsaneydi.',
    contains_spoiler: true,
    created_at: '2026-07-15T12:00:00Z'
  }
];

export const INITIAL_COLLECTIONS: CustomCollection[] = [
  {
    id: 'col_1',
    user_id: CURRENT_USER.id,
    title: 'Favorilerim',
    description: 'Tüm zamanların en beğendiğim başyapıtları ve tekrar izlemekten bıkmadığım yapımlar.',
    color: '#E63946',
    icon: 'Heart',
    created_at: '2026-07-01T10:00:00Z',
    items: [
      {
        media_id: 110492,
        media_type: 'tv',
        title: 'Severance',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.7,
        added_at: '2026-07-02T11:00:00Z'
      },
      {
        media_id: 693134,
        media_type: 'movie',
        title: 'Dune: Part Two',
        poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.8,
        added_at: '2026-07-05T14:30:00Z'
      }
    ]
  },
  {
    id: 'col_2',
    user_id: CURRENT_USER.id,
    title: 'Bilim Kurgu Klasikleri',
    description: 'Distopya, uzay macerası ve beyin yakan bilim kurgu yapımları koleksiyonu.',
    color: '#3B82F6',
    icon: 'Sparkles',
    created_at: '2026-07-08T15:20:00Z',
    items: [
      {
        media_id: 157336,
        media_type: 'movie',
        title: 'Interstellar',
        poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.6,
        added_at: '2026-07-09T09:15:00Z'
      },
      {
        media_id: 110492,
        media_type: 'tv',
        title: 'Severance',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.7,
        added_at: '2026-07-10T16:00:00Z'
      }
    ]
  },
  {
    id: 'col_3',
    user_id: CURRENT_USER.id,
    title: 'Hafta Sonu Maratonu',
    description: 'Tek oturuşta bitirilecek yüksek tempolu mini diziler ve filmler.',
    color: '#10B981',
    icon: 'Flame',
    created_at: '2026-07-12T18:00:00Z',
    items: [
      {
        media_id: 94997,
        media_type: 'tv',
        title: 'House of the Dragon',
        poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.4,
        added_at: '2026-07-14T20:00:00Z'
      }
    ]
  }
];

export const MOCK_USER_PROFILES: Record<string, {
  profile: Profile;
  watchList: WatchStatus[];
  reviews: RatingReview[];
  collections: CustomCollection[];
  episodeProgress: any[];
}> = {
  'zeynep_k': {
    profile: MOCK_FRIENDS[0],
    watchList: [
      {
        user_id: MOCK_FRIENDS[0].id,
        media_id: 110492,
        media_type: 'tv',
        status: 'watching',
        title: 'Severance',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.7,
        total_episodes: 19,
        total_seasons: 2
      },
      {
        user_id: MOCK_FRIENDS[0].id,
        media_id: 693134,
        media_type: 'movie',
        status: 'watched',
        title: 'Dune: Part Two',
        poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.8
      },
      {
        user_id: MOCK_FRIENDS[0].id,
        media_id: 157336,
        media_type: 'movie',
        status: 'watched',
        title: 'Interstellar',
        poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.6
      },
      {
        user_id: MOCK_FRIENDS[0].id,
        media_id: 872585,
        media_type: 'movie',
        status: 'watched',
        title: 'Oppenheimer',
        poster_path: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.9
      }
    ],
    reviews: [
      {
        id: 'rev_zk_1',
        user_id: MOCK_FRIENDS[0].id,
        profile: MOCK_FRIENDS[0],
        media_id: 693134,
        media_type: 'movie',
        media_title: 'Dune: Part Two',
        media_poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        rating: 10,
        review_text: 'Sinemada izlediğim en muazzam bilim kurgu görsel şölenlerinden biriydi. Paul\'ün dönüm noktası sahnesi nefes kesti!',
        contains_spoiler: true,
        created_at: '2026-07-21T08:15:00Z'
      },
      {
        id: 'rev_zk_2',
        user_id: MOCK_FRIENDS[0].id,
        profile: MOCK_FRIENDS[0],
        media_id: 110492,
        media_type: 'tv',
        media_title: 'Severance',
        media_poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        rating: 9,
        review_text: 'Dizinin atmosferi, sinematografisi ve gizem dozu harika ayarlanmış. Lumon\'un gizemini çözmek için sabırsızlanıyorum.',
        contains_spoiler: false,
        created_at: '2026-07-18T19:00:00Z'
      }
    ],
    collections: [
      {
        id: 'col_zk_1',
        user_id: MOCK_FRIENDS[0].id,
        title: 'Uzay & Distopya',
        description: 'En sevdiğim uzay bilim kurguları ve distopik başyapıtlar.',
        color: '#3B82F6',
        icon: 'Sparkles',
        created_at: '2026-07-02T10:00:00Z',
        items: [
          {
            media_id: 157336,
            media_type: 'movie',
            title: 'Interstellar',
            poster_path: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
            vote_average: 8.6,
            added_at: '2026-07-02T10:00:00Z'
          },
          {
            media_id: 693134,
            media_type: 'movie',
            title: 'Dune: Part Two',
            poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
            vote_average: 8.8,
            added_at: '2026-07-05T14:30:00Z'
          }
        ]
      }
    ],
    episodeProgress: [
      {
        id: 'ep_zk_1',
        user_id: MOCK_FRIENDS[0].id,
        series_id: 110492,
        series_title: 'Severance',
        season_number: 1,
        episode_number: 9,
        episode_title: 'The We We Are',
        watched: true,
        watched_at: '2026-07-21T10:30:00Z'
      }
    ]
  },
  'ahmet_y': {
    profile: MOCK_FRIENDS[1],
    watchList: [
      {
        user_id: MOCK_FRIENDS[1].id,
        media_id: 94997,
        media_type: 'tv',
        status: 'watching',
        title: 'House of the Dragon',
        poster_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.4,
        total_episodes: 18,
        total_seasons: 2
      },
      {
        user_id: MOCK_FRIENDS[1].id,
        media_id: 114472,
        media_type: 'tv',
        status: 'watching',
        title: 'The Bear',
        poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.6,
        total_episodes: 28,
        total_seasons: 3
      }
    ],
    reviews: [
      {
        id: 'rev_ay_1',
        user_id: MOCK_FRIENDS[1].id,
        profile: MOCK_FRIENDS[1],
        media_id: 110492,
        media_type: 'tv',
        media_title: 'Severance',
        media_poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        rating: 9,
        review_text: 'Bölüm sonu ters köşeleri efsane!',
        contains_spoiler: false,
        created_at: '2026-07-18T19:00:00Z'
      }
    ],
    collections: [
      {
        id: 'col_ay_1',
        user_id: MOCK_FRIENDS[1].id,
        title: '1.5x Hızlı Maraton',
        description: 'Tek oturuşta bitirilen tempolu diziler.',
        color: '#10B981',
        icon: 'Flame',
        created_at: '2026-07-10T12:00:00Z',
        items: [
          {
            media_id: 114472,
            media_type: 'tv',
            title: 'The Bear',
            poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
            vote_average: 8.6,
            added_at: '2026-07-10T12:00:00Z'
          }
        ]
      }
    ],
    episodeProgress: []
  },
  'selin_d': {
    profile: MOCK_FRIENDS[2],
    watchList: [
      {
        user_id: MOCK_FRIENDS[2].id,
        media_id: 114472,
        media_type: 'tv',
        status: 'watching',
        title: 'The Bear',
        poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.6,
        total_episodes: 28,
        total_seasons: 3
      },
      {
        user_id: MOCK_FRIENDS[2].id,
        media_id: 693134,
        media_type: 'movie',
        status: 'watched',
        title: 'Dune: Part Two',
        poster_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.8
      }
    ],
    reviews: [
      {
        id: 'rev_sd_1',
        user_id: MOCK_FRIENDS[2].id,
        profile: MOCK_FRIENDS[2],
        media_id: 693134,
        media_type: 'movie',
        media_title: 'Dune: Part Two',
        media_poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        rating: 10,
        review_text: 'Chani ve Paul arasındaki çatışma ve Harkonnen sahnelerindeki siyah-beyaz gezegen çekimi efsaneydi.',
        contains_spoiler: true,
        created_at: '2026-07-15T12:00:00Z'
      }
    ],
    collections: [
      {
        id: 'col_sd_1',
        user_id: MOCK_FRIENDS[2].id,
        title: 'Eleştirmen Seçkisi',
        description: 'Derin karakter analizleri içeren dramalar.',
        color: '#8B5CF6',
        icon: 'Star',
        created_at: '2026-07-05T14:00:00Z',
        items: [
          {
            media_id: 114472,
            media_type: 'tv',
            title: 'The Bear',
            poster_path: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
            vote_average: 8.6,
            added_at: '2026-07-05T14:00:00Z'
          }
        ]
      }
    ],
    episodeProgress: []
  }
};

export function getMockProfileData(username: string) {
  if (MOCK_USER_PROFILES[username]) {
    return MOCK_USER_PROFILES[username];
  }
  const formattedName = username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    profile: {
      id: `usr_gen_${username}`,
      username: username,
      full_name: formattedName,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      bio: `Cinephile & dizi tutkunu. @${username} profili.`
    },
    watchList: [
      {
        user_id: `usr_gen_${username}`,
        media_id: 110492,
        media_type: 'tv' as const,
        status: 'watching' as const,
        title: 'Severance',
        poster_path: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        vote_average: 8.7,
        total_episodes: 19,
        total_seasons: 2
      }
    ],
    reviews: [],
    collections: [],
    episodeProgress: []
  };
}


