import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchView } from './components/MobileSearchView';
import { NewEpisodesBanner } from './components/NewEpisodesBanner';
import { HeroSpotlight } from './components/HeroSpotlight';
import { SocialFeedSidebar } from './components/SocialFeedSidebar';

import { MediaCard } from './components/MediaCard';
import { EpisodeTracker } from './components/EpisodeTracker';
import { EmptyState } from './components/EmptyState';
import { MobileSidebarDrawer } from './components/MobileSidebarDrawer';
import { RecommendationsSection } from './components/RecommendationsSection';

import { MediaDetailModal } from './components/MediaDetailModal';
import { CalendarView } from './components/CalendarView';
import { ActivityFeedView } from './components/ActivityFeedView';
import { ProfileView } from './components/ProfileView';
import { CollectionsView } from './components/CollectionsView';
import { MonthlyRecapModal } from './components/MonthlyRecapModal';
import { SettingsModal } from './components/SettingsModal';

// Sleek loading fallback for React.Suspense
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] w-full py-16 text-slate-400">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-500/20 animate-ping" />
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
    <span className="mt-4 text-xs font-medium tracking-wider text-slate-400 uppercase animate-pulse">
      Yükleniyor...
    </span>
  </div>
);
import { sortFranchiseAlphabetical } from './lib/sorting';

import { TMDBMedia, WatchStatus, WatchStatusType, EpisodeProgress, RatingReview, ActivityFeedItem, MediaType, CustomCollection, CollectionItem, Profile } from './types';
import { getTrending, search, getDetails, getSeasonDetails } from './lib/tmdb';
import { DEFAULT_AVATAR_URL } from './lib/constants';
import { Flame, Tv, Film, Bookmark, Eye, Clock, CheckCircle2, Heart, Plus, X, Search, Loader2, Sparkles, MessageSquare, Star, ThumbsUp, Pin } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthView } from './components/AuthView';
import { CURRENT_USER, MOCK_USER_PROFILES } from './data/mockData';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Global unhandled promise rejection logging
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/user/')) {
      return 'profile';
    }
    return 'discover';
  });

  // Listen to Supabase auth state change
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    }).catch((err: any) => {
      console.error('Supabase getSession error:', err);
      setAuthLoading(false);
    });

    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setSession(session);
      });
      subscription = data.subscription;
    } catch (err) {
      console.error('Supabase onAuthStateChange error:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Fetch user data from Supabase when session is active (Parallelized & Ultra-Fast)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsDataLoading(false);
      return;
    }

    if (!session) {
      if (!authLoading) {
        setIsDataLoading(false);
      }
      return;
    }

    const fetchUserData = async () => {
      setIsDataLoading(true);
      const userId = session.user.id;

      try {
        // Parallelized fetch of all user data tables (Single round-trip burst)
        const [
          profileRes,
          wlRes,
          epRes,
          revRes,
          actRes,
          favRes,
          collRes,
          followRes
        ] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('watch_status').select('*').eq('user_id', userId),
          supabase.from('episode_progress').select('*').eq('user_id', userId),
          supabase.from('ratings_reviews').select('*, profiles(username, full_name, avatar_url)').order('created_at', { ascending: false }).limit(30),
          supabase.from('activity_feed').select('*, profiles(username, full_name, avatar_url)').order('created_at', { ascending: false }).limit(20),
          supabase.from('favorites').select('*').eq('user_id', userId),
          supabase.from('custom_collections').select('*, collection_items(*)').eq('user_id', userId),
          supabase.from('follows').select('following_id').eq('follower_id', userId)
        ]);

        // 1. Profile
        let profileData = profileRes.status === 'fulfilled' ? profileRes.value?.data : null;

        if (!profileData && session?.user) {
          const fallbackUserStr = session.user.email ? session.user.email.split('@')[0] : `user_${session.user.id.slice(0, 6)}`;
          try {
            const { data: created } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                username: fallbackUserStr,
                full_name: fallbackUserStr,
                email: session.user.email,
                avatar_url: DEFAULT_AVATAR_URL
              })
              .select('*')
              .maybeSingle();

            if (created) profileData = created;
          } catch (e) {
            console.warn('Auto profile creation error:', e);
          }
        }

        if (profileData) {
          const profileObj = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || profileData.username,
            avatar_url: (!profileData.avatar_url || profileData.avatar_url.includes('photo-1535713875002-d1d0cf377fde')) ? DEFAULT_AVATAR_URL : profileData.avatar_url,
            banner_url: profileData.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
            featured_media_title: profileData.featured_media_title || '',
            bio: profileData.bio || '',
            email: profileData.email || session.user.email || ''
          };
          try {
            localStorage.setItem('cine_current_user', JSON.stringify(profileObj));
          } catch (e) {}
          setCurrentUser(profileObj);

          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/user/')) {
            const urlUsername = window.location.pathname.replace('/user/', '').trim();
            if (urlUsername) setViewingUsername(urlUsername);
          } else {
            setViewingUsername(profileData.username);
          }
        } else if (session?.user) {
          const fallbackUserStr = session.user.email ? session.user.email.split('@')[0] : 'kullanici';
          const fallbackObj = {
            id: session.user.id,
            username: fallbackUserStr,
            full_name: fallbackUserStr,
            avatar_url: DEFAULT_AVATAR_URL,
            banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
            featured_media_title: '',
            bio: '',
            email: session.user.email || ''
          };
          setCurrentUser(fallbackObj);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/user/')) {
            setViewingUsername(fallbackUserStr);
          }
        }

        // 2. Watch Status List
        if (wlRes.status === 'fulfilled' && wlRes.value?.data) {
          const supabaseItems: WatchStatus[] = wlRes.value.data.map((w: any) => ({
            media_id: w.media_id,
            media_type: w.media_type as MediaType,
            status: w.status as WatchStatusType,
            title: w.title || 'Yapım',
            poster_path: w.poster_path || '',
            vote_average: w.vote_average || 0,
            genre_ids: w.genre_ids || (Array.isArray(w.genres) ? w.genres.map((g: any) => g.id) : undefined),
            genres: w.genres || undefined,
            updated_at: w.updated_at
          }));

          setWatchList(supabaseItems);
        }

        // 3. Episode Progress
        if (epRes.status === 'fulfilled' && epRes.value?.data) {
          const epItems: EpisodeProgress[] = epRes.value.data.map((ep: any) => ({
            user_id: ep.user_id,
            show_id: ep.show_id,
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            is_watched: ep.is_watched
          }));
          setEpisodeProgress(epItems);
        }

        // 4. Ratings & Reviews
        if (revRes.status === 'fulfilled' && revRes.value?.data) {
          const fetchedReviews: RatingReview[] = revRes.value.data.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            username: r.profiles?.username || 'kullanıcı',
            user_fullname: r.profiles?.full_name || 'Kullanıcı',
            user_avatar: r.profiles?.avatar_url || DEFAULT_AVATAR_URL,
            media_id: r.media_id,
            media_type: r.media_type as MediaType,
            rating: r.rating,
            review_text: r.review_text,
            contains_spoiler: r.contains_spoiler,
            created_at: r.created_at,
            media_title: r.media_title || r.title,
            media_poster: r.media_poster || r.poster_path,
            is_pinned: r.is_pinned || false,
            likes: r.likes || 0,
            likes_count: r.likes_count || r.likes || 0,
            comments_count: r.comments_count || 0
          }));
          setReviews(fetchedReviews);
        }

        // 5. Activity Feed (Fast Instant Mapping)
        if (actRes.status === 'fulfilled' && actRes.value?.data) {
          const activities: ActivityFeedItem[] = actRes.value.data.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            username: a.profiles?.username || 'kullanıcı',
            user_fullname: a.profiles?.full_name || 'Kullanıcı',
            user_avatar: a.profiles?.avatar_url || DEFAULT_AVATAR_URL,
            profile: {
              id: a.user_id,
              username: a.profiles?.username || 'kullanıcı',
              full_name: a.profiles?.full_name || 'Kullanıcı',
              avatar_url: a.profiles?.avatar_url || DEFAULT_AVATAR_URL
            },
            action_type: a.action_type as any,
            media_id: a.media_id,
            media_type: a.media_type as MediaType,
            media_title: a.details?.media_title || a.media_title || 'Yapım',
            poster_path: a.details?.media_poster || a.poster_path || '',
            detail_text: a.details?.status || '',
            contains_spoiler: a.details?.contains_spoiler || false,
            details: a.details || {},
            created_at: a.created_at
          }));
          setActivityFeed(activities);
        }

        // 6. Favorites
        if (favRes.status === 'fulfilled' && favRes.value?.data) {
          setFavorites(favRes.value.data.map((f: any) => ({
            media_id: f.media_id,
            media_type: f.media_type as MediaType,
            status: 'watched',
            title: f.title || 'Yapım',
            poster_path: f.poster_path || '',
            vote_average: f.vote_average || 0
          })));
        }

        // 7. Custom Collections
        if (collRes.status === 'fulfilled' && collRes.value?.data) {
          setCollections(collRes.value.data.map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            title: c.name || c.title,
            description: c.description || '',
            color: c.color || 'from-blue-600 to-cyan-600',
            icon: c.icon || 'Tv',
            created_at: c.created_at,
            items: (c.collection_items || []).map((ci: any) => ({
              media_id: ci.media_id,
              media_type: ci.media_type as MediaType,
              title: ci.title || 'Yapım',
              poster_path: ci.poster_path || '',
              added_at: ci.created_at || c.created_at
            }))
          })));
        }

        // 8. Following
        if (followRes.status === 'fulfilled' && followRes.value?.data) {
          setFollowingUserIds(followRes.value.data.map((f: any) => f.following_id));
        }

      } catch (err) {
        console.error('fetchUserData error:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchUserData();
  }, [session?.user?.id, authLoading]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userSearchResults, setUserSearchResults] = useState<Profile[]>([]);
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<TMDBMedia | null>(null);
  
  // Left Sidebar Filter States
  const [mediaFilter, setMediaFilter] = useState<'all' | 'tv' | 'movie'>('tv');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watching' | 'plan_to_watch' | 'watched'>('all');

  // Dynamic Profile Navigation & Follow State
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('cine_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.username && parsed.username !== 'kullanici') {
            return parsed;
          }
        }

        // Synchronously check Supabase session token in localStorage for instant 0ms profile load
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const tokenStr = localStorage.getItem(key);
            if (tokenStr) {
              const tokenObj = JSON.parse(tokenStr);
              const userObj = tokenObj?.user || tokenObj?.currentSession?.user;
              if (userObj?.email) {
                const name = userObj.email.split('@')[0];
                return {
                  id: userObj.id || '',
                  username: name,
                  full_name: name,
                  avatar_url: userObj.user_metadata?.avatar_url || DEFAULT_AVATAR_URL,
                  banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
                  featured_media_title: '',
                  bio: '',
                  email: userObj.email
                };
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: '',
      username: '',
      full_name: '',
      avatar_url: DEFAULT_AVATAR_URL,
      banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
      featured_media_title: '',
      bio: ''
    };
  });

  useEffect(() => {
    if (currentUser.username && currentUser.username !== 'kullanici') {
      try {
        localStorage.setItem('cine_current_user', JSON.stringify(currentUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  const handleUpdateProfile = async (updated: Partial<Profile>) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updated
    }));

    if (session && isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({
            username: updated.username,
            full_name: updated.full_name,
            bio: updated.bio,
            avatar_url: updated.avatar_url,
            banner_url: updated.banner_url,
            featured_media_title: updated.featured_media_title
          })
          .eq('id', session.user.id);
      } catch (err) {
        console.error('Failed to update profile in Supabase:', err);
      }
    }
  };

  const [viewingUsername, setViewingUsername] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/user/')) {
        const username = window.location.pathname.replace('/user/', '').trim();
        if (username) return username;
      }
    } catch (e) {
      console.error(e);
    }
    return currentUser.username;
  });

  // External Profile Data State & Fetcher
  const [externalProfileData, setExternalProfileData] = useState<{
    profile: Profile;
    watchList: WatchStatus[];
    episodeProgress: EpisodeProgress[];
    reviews: RatingReview[];
    favorites: WatchStatus[];
    collections: CustomCollection[];
  } | null>(null);

  useEffect(() => {
    const isOwn = !viewingUsername || viewingUsername === currentUser.username || viewingUsername === 'me' || viewingUsername === currentUser.id;
    
    // RESET STALE DATA IMMEDIATELY TO PREVENT SHOWING OLD PROFILE FOR 4-5 SECONDS
    setExternalProfileData(null);

    if (isOwn) {
      return;
    }

    let isMounted = true;
    async function loadExternalProfile() {
      try {
        if (isSupabaseConfigured) {
          // Fast single OR lookup: username, id, or full_name
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.${viewingUsername},id.eq.${viewingUsername},full_name.ilike.${viewingUsername}`)
            .limit(1)
            .maybeSingle();

          if (pData && isMounted) {
            const extProfile: Profile = {
              id: pData.id,
              username: pData.username,
              full_name: pData.full_name || pData.username,
              avatar_url: (!pData.avatar_url || pData.avatar_url.includes('photo-1535713875002-d1d0cf377fde')) ? DEFAULT_AVATAR_URL : pData.avatar_url,
              banner_url: pData.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
              featured_media_title: pData.featured_media_title || 'Severance',
              bio: pData.bio || ''
            };

            // Fetch target user's watchlist, progress, reviews, favorites live from Supabase concurrently
            const [{ data: extWl }, { data: extEp }, { data: extRev }, { data: extFav }] = await Promise.all([
              supabase.from('watch_status').select('*').eq('user_id', pData.id),
              supabase.from('episode_progress').select('*').eq('user_id', pData.id),
              supabase.from('ratings_reviews').select('*').eq('user_id', pData.id),
              supabase.from('favorites').select('*').eq('user_id', pData.id)
            ]);

            // FAST INSTANT MAPPING WITHOUT BLOCKING ON 35+ TMDB HTTP CALLS
            const mappedWl: WatchStatus[] = (extWl || []).map((w: any) => ({
              media_id: w.media_id,
              media_type: w.media_type,
              status: w.status,
              title: w.title || w.media_title || 'Yapım',
              poster_path: w.poster_path || w.media_poster || '',
              vote_average: w.vote_average || 8.0,
              updated_at: w.updated_at,
              created_at: w.created_at
            }));

            // Map favorites instantly
            const mappedFavorites: WatchStatus[] = (extFav || []).map((f: any) => {
              const watchMatch = mappedWl.find(w => w.media_id === f.media_id && w.media_type === f.media_type);
              return {
                media_id: f.media_id,
                media_type: f.media_type,
                status: 'watched',
                title: f.title || watchMatch?.title || 'Yapım',
                poster_path: f.poster_path || watchMatch?.poster_path || '',
                vote_average: f.vote_average || watchMatch?.vote_average || 8.5
              };
            });

            // Map reviews instantly
            const mappedReviews: RatingReview[] = (extRev || []).map((r: any) => {
              const watchMatch = mappedWl.find(w => w.media_id === r.media_id && w.media_type === r.media_type);
              return {
                id: r.id,
                user_id: r.user_id,
                media_id: r.media_id,
                media_type: r.media_type,
                media_title: r.media_title || r.title || watchMatch?.title || 'Yapım',
                media_poster: r.media_poster || r.poster_path || watchMatch?.poster_path || '',
                rating: r.rating,
                review_text: r.review_text,
                contains_spoiler: r.contains_spoiler,
                created_at: r.created_at,
                profile: extProfile
              };
            });

            if (isMounted) {
              setExternalProfileData({
                profile: extProfile,
                watchList: mappedWl,
                episodeProgress: extEp || [],
                reviews: mappedReviews,
                favorites: mappedFavorites,
                collections: []
              });
            }
          } else if (isMounted) {
            setExternalProfileData(null);
          }
        } else if (isMounted) {
          setExternalProfileData(null);
        }
      } catch (e) {
        console.error('Error fetching external profile:', e);
        if (isMounted) {
          setExternalProfileData(null);
        }
      }
    }

    loadExternalProfile();
  }, [viewingUsername, currentUser.username, currentUser.id]);

  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('cine_following_user_ids', JSON.stringify(followingUserIds));
    } catch (e) {
      console.error(e);
    }
  }, [followingUserIds]);

  // Handle browser URL changes (back/forward & direct links)
  // Mouse Side Buttons Listener (Back = Button 4 / e.button === 3, Forward = Button 5 / e.button === 4)
  useEffect(() => {
    const handleMouseSideButtons = (e: MouseEvent) => {
      if (e.button === 3) {
        // Mouse Back Button
        e.preventDefault();
        if (selectedMedia) {
          setSelectedMedia(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          window.history.back();
        }
      } else if (e.button === 4) {
        // Mouse Forward Button
        e.preventDefault();
        window.history.forward();
      }
    };

    window.addEventListener('auxclick', handleMouseSideButtons);
    window.addEventListener('mouseup', handleMouseSideButtons);

    return () => {
      window.removeEventListener('auxclick', handleMouseSideButtons);
      window.removeEventListener('mouseup', handleMouseSideButtons);
    };
  }, [selectedMedia, isDrawerOpen, isSettingsOpen]);

  // Enhanced popstate listener for browser & mouse back/forward navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && (!window.history.state || !window.history.state.tab)) {
      window.history.replaceState({ tab: activeTab, viewingUsername }, '', window.location.pathname);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (selectedMedia) {
        setSelectedMedia(null);
        return;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }

      const state = event.state;
      const path = window.location.pathname;

      if (state && state.tab) {
        setActiveTab(state.tab);
        if (state.viewingUsername) {
          setViewingUsername(state.viewingUsername);
        }
      } else if (path.startsWith('/user/')) {
        const username = path.replace('/user/', '').trim();
        if (username) {
          setViewingUsername(username);
          setActiveTab('profile');
        }
      } else {
        setActiveTab('discover');
        setStatusFilter('all');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedMedia, isDrawerOpen, isSettingsOpen, activeTab, viewingUsername]);

  const [profileSubTab, setProfileSubTab] = useState<'profil' | 'movies' | 'tv' | 'reviews' | 'stats'>('profil');

  const handleNavigateToProfile = (username: string, subTab?: 'profil' | 'movies' | 'tv' | 'reviews' | 'stats') => {
    if (typeof window !== 'undefined' && (!window.history.state || !window.history.state.tab)) {
      const originPath = activeTab === 'discover' ? '/' : (activeTab === 'profile' ? `/user/${viewingUsername}` : `/${activeTab}`);
      window.history.replaceState({ tab: activeTab, viewingUsername }, '', originPath);
    }

    setViewingUsername(username);
    if (subTab) setProfileSubTab(subTab);
    else setProfileSubTab('profil');
    setActiveTab('profile');
    try {
      window.history.pushState({ tab: 'profile', viewingUsername: username }, '', `/user/${username}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFollowUser = async (userId: string) => {
    const isFollowing = followingUserIds.includes(userId);
    setFollowingUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );

    if (session && isSupabaseConfigured) {
      try {
        const followerId = session.user.id;
        if (isFollowing) {
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', userId);
        } else {
          await supabase
            .from('follows')
            .insert({
              follower_id: followerId,
              following_id: userId
            });
        }
      } catch (err) {
        console.error('Failed to sync follow state to Supabase:', err);
      }
    }
  };

  // TMDB Data State
  const [trendingMedia, setTrendingMedia] = useState<TMDBMedia[]>([]);
  const [searchResults, setSearchResults] = useState<TMDBMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);

  // User Interactive Application State
  const [watchList, setWatchList] = useState<WatchStatus[]>(() => {
    try {
      const saved = localStorage.getItem('diziapp_watch_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [episodeProgress, setEpisodeProgress] = useState<EpisodeProgress[]>(() => {
    try {
      const saved = localStorage.getItem('diziapp_episode_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('diziapp_watch_list', JSON.stringify(watchList));
    } catch {}
  }, [watchList]);

  useEffect(() => {
    try {
      localStorage.setItem('diziapp_episode_progress', JSON.stringify(episodeProgress));
    } catch {}
  }, [episodeProgress]);

  const [reviews, setReviews] = useState<RatingReview[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('diziapp_reviews', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  // Custom Collections State (saved in localStorage)
  const [collections, setCollections] = useState<CustomCollection[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem('cine_custom_collections');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved collections', e);
    }
    return [];
  });

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Favorites State (saved in localStorage)
  const [favorites, setFavorites] = useState<WatchStatus[]>(() => {
    try {
      const stored = localStorage.getItem('ttime_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [favSearchQuery, setFavSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('ttime_favorites', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  const handleToggleFavorite = async (media: TMDBMedia) => {
    const isTv = media.media_type === 'tv' || !!media.first_air_date;
    const type: MediaType = isTv ? 'tv' : 'movie';
    const title = media.title || media.name || 'Yapım';
    const exists = favorites.some(item => item.media_id === media.id && item.media_type === type);

    setFavorites(prev => {
      if (exists) {
        return prev.filter(item => !(item.media_id === media.id && item.media_type === type));
      } else {
        return [
          ...prev,
          {
            user_id: currentUser.id,
            media_id: media.id,
            media_type: type,
            status: 'watched',
            title,
            poster_path: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
            vote_average: media.vote_average
          }
        ];
      }
    });

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        if (exists) {
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('media_id', media.id)
            .eq('media_type', type);
        } else {
          await supabase
            .from('favorites')
            .insert({
              user_id: userId,
              media_id: media.id,
              media_type: type,
              title,
              poster_path: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
              vote_average: media.vote_average
            });
        }
      } catch (err) {
        console.error('Failed to sync favorite to Supabase:', err);
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('cine_custom_collections', JSON.stringify(collections));
    } catch (e) {
      console.error('Failed to save collections', e);
    }
  }, [collections]);

  // Collection Action Handlers
  const handleCreateCollection = async (title: string, description: string, color: string, icon: string) => {
    let localId = `col_${Date.now()}`;
    const now = new Date().toISOString();

    if (session && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('custom_collections')
          .insert({
            user_id: session.user.id,
            name: title,
            description: description,
            is_private: false
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          localId = data.id;
        }
      } catch (err) {
        console.error('Failed to create collection in Supabase:', err);
      }
    }

    const newCol: CustomCollection = {
      id: localId,
      user_id: currentUser.id,
      title,
      description,
      color,
      icon,
      created_at: now,
      items: []
    };
    setCollections(prev => [newCol, ...prev]);
    setSelectedCollectionId(localId);
  };

  const handleUpdateCollection = (collectionId: string, title: string, description: string, color: string, icon: string) => {
    setCollections(prev => prev.map(col => 
      col.id === collectionId ? { ...col, title, description, color, icon } : col
    ));
  };

  const handleDeleteCollection = async (collectionId: string) => {
    setCollections(prev => prev.filter(col => col.id !== collectionId));
    if (selectedCollectionId === collectionId) {
      setSelectedCollectionId(null);
    }

    if (session && isSupabaseConfigured) {
      try {
        await supabase
          .from('custom_collections')
          .delete()
          .eq('id', collectionId);
      } catch (err) {
        console.error('Failed to delete collection from Supabase:', err);
      }
    }
  };

  const handleAddItemToCollection = async (collectionId: string, item: Omit<CollectionItem, 'added_at'>) => {
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      const exists = col.items.some(i => i.media_id === item.media_id && i.media_type === item.media_type);
      if (exists) return col;
      return {
        ...col,
        items: [
          ...col.items,
          {
            ...item,
            added_at: new Date().toISOString()
          }
        ]
      };
    }));

    if (session && isSupabaseConfigured) {
      try {
        await supabase
          .from('collection_items')
          .insert({
            collection_id: collectionId,
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path
          });
      } catch (err) {
        console.error('Failed to add item to collection in Supabase:', err);
      }
    }
  };

  const handleRemoveItemFromCollection = async (collectionId: string, mediaId: number, mediaType: 'movie' | 'tv') => {
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      return {
        ...col,
        items: col.items.filter(i => !(i.media_id === mediaId && i.media_type === mediaType))
      };
    }));

    if (session && isSupabaseConfigured) {
      try {
        await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('media_id', mediaId)
          .eq('media_type', mediaType);
      } catch (err) {
        console.error('Failed to remove item from collection in Supabase:', err);
      }
    }
  };

  const handleToggleItemInCollection = async (collectionId: string, item: Omit<CollectionItem, 'added_at'>) => {
    let exists = false;
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      exists = col.items.some(i => i.media_id === item.media_id && i.media_type === item.media_type);
      if (exists) {
        return {
          ...col,
          items: col.items.filter(i => !(i.media_id === item.media_id && i.media_type === item.media_type))
        };
      } else {
        return {
          ...col,
          items: [
            ...col.items,
            {
              ...item,
              added_at: new Date().toISOString()
            }
          ]
        };
      }
    }));

    if (session && isSupabaseConfigured) {
      try {
        if (exists) {
          await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collectionId)
            .eq('media_id', item.media_id)
            .eq('media_type', item.media_type);
        } else {
          await supabase
            .from('collection_items')
            .insert({
              collection_id: collectionId,
              media_id: item.media_id,
              media_type: item.media_type,
              title: item.title,
              poster_path: item.poster_path
            });
        }
      } catch (err) {
        console.error('Failed to toggle collection item in Supabase:', err);
      }
    }
  };

  const handlePostStatusUpdate = async (content: string) => {
    if (!content.trim()) return;
    const newActivity: ActivityFeedItem = {
      id: `act_${Date.now()}`,
      user_id: currentUser.id,
      action_type: 'status_update',
      details: {
        media_title: content,
      },
      created_at: new Date().toISOString(),
      profile: currentUser
    };
    setActivityFeed(prev => [newActivity, ...prev]);

    if (session && isSupabaseConfigured) {
      try {
        await supabase
          .from('activity_feed')
          .insert({
            user_id: session.user.id,
            action_type: 'status_update',
            details: {
              media_title: content
            }
          });
      } catch (err) {
        console.error('Failed to log status activity in Supabase:', err);
      }
    }
  };

  // Tab Switcher Handler (closes open series detail page/modal immediately & pushes to browser history)
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSelectedMedia(null);
    try {
      const path = newTab === 'profile' ? `/user/${viewingUsername}` : `/${newTab === 'discover' ? '' : newTab}`;
      window.history.pushState({ tab: newTab, viewingUsername }, '', path);
    } catch (e) {}
  };

  const handleSetStatusFilter = (status: 'all' | 'watching' | 'plan_to_watch' | 'watched') => {
    setStatusFilter(status);
    setSelectedMedia(null);
  };

  const handleSetMediaFilter = (filter: 'all' | 'tv' | 'movie') => {
    setMediaFilter(filter);
    setSelectedMedia(null);
    if (filter === 'movie' && statusFilter === 'watching') {
      setStatusFilter('plan_to_watch');
    }
  };

  useEffect(() => {
    if (mediaFilter === 'movie' && statusFilter === 'watching') {
      setStatusFilter('plan_to_watch');
    }
  }, [mediaFilter, statusFilter]);

  // Load Trending Media on Mount & when mediaFilter changes (for library filtering)
  useEffect(() => {
    let isMounted = true;
    async function fetchTrending() {
      setLoadingMedia(true);
      try {
        const data = await getTrending(mediaFilter, 'week');
        if (isMounted) {
          setTrendingMedia(data.results || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingMedia(false);
      }
    }
    fetchTrending();
    return () => { isMounted = false; };
  }, [mediaFilter]);

  // Separate fetch: always all-type trending for Keşfet recommendations (media filter independent)
  const [discoverAllTrending, setDiscoverAllTrending] = useState<TMDBMedia[]>([]);
  useEffect(() => {
    let isMounted = true;
    async function fetchDiscoverAll() {
      try {
        const [allData, tvData, movieData] = await Promise.all([
          getTrending('all', 'week'),
          getTrending('tv', 'week'),
          getTrending('movie', 'week'),
        ]);
        if (isMounted) {
          const combined = [
            ...(allData.results || []),
            ...(tvData.results || []),
            ...(movieData.results || []),
          ];
          // Deduplicate by id
          const seen = new Set<number>();
          const deduped = combined.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setDiscoverAllTrending(deduped);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchDiscoverAll();
    return () => { isMounted = false; };
  }, []);

  // Handle Search Input Debounce (Media & User Profiles)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setUserSearchResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoadingMedia(true);
      const query = searchQuery.trim();
      try {
        const res = await search(query, mediaFilter);
        if (isMounted) {
          setSearchResults(res.results || []);
        }

        // Query registered user profiles in Supabase or local mock data
        if (isSupabaseConfigured) {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(6);
          if (isMounted) {
            setUserSearchResults(users ? users.map((u: any) => ({
              id: u.id,
              username: u.username,
              full_name: u.full_name || u.username,
              avatar_url: u.avatar_url || '',
              bio: u.bio || ''
            })) : []);
          }
        } else {
          const matches = Object.values(MOCK_USER_PROFILES).map(p => p.profile).filter(p => 
            p.username.toLowerCase().includes(query.toLowerCase()) || 
            (p.full_name || '').toLowerCase().includes(query.toLowerCase())
          );
          if (isMounted) setUserSearchResults(matches);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingMedia(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [searchQuery, mediaFilter]);

  // Scroll to top when searching new query
  useEffect(() => {
    if (searchQuery.trim()) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [searchQuery]);

  // Handle Logout
  const handleLogout = async () => {
    setIsDrawerOpen(false);
    localStorage.removeItem('cine_current_user');
    localStorage.removeItem('diziapp_watch_list');
    localStorage.removeItem('diziapp_episode_progress');
    setWatchList([]);
    setEpisodeProgress([]);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
      setSession(null);
    } else {
      setCurrentUser(CURRENT_USER);
      alert('Yerel oturum kapatıldı. ttime hesabınızdan güvenle çıkış yaptınız.');
    }
  };

  // Helper to get watch status of media
  const getUserWatchStatus = (mediaId: number, mediaType: MediaType): WatchStatusType | undefined => {
    const found = watchList.find(item => item.media_id === mediaId && item.media_type === mediaType);
    return found?.status;
  };

  // Update watch status (Watching, Plan to watch, Watched, or null to remove)
  const handleUpdateWatchStatus = async (media: TMDBMedia, status: WatchStatusType | null) => {
    const isTv = media.media_type === 'tv' || !!media.first_air_date;
    const type: MediaType = isTv ? 'tv' : 'movie';
    const title = media.title || media.name || 'Yapım';

    if (status === null) {
      setWatchList(prev => prev.filter(item => !(item.media_id === media.id && item.media_type === type)));
    } else {
      setWatchList(prev => {
        const exists = prev.some(item => item.media_id === media.id && item.media_type === type);
        if (exists) {
          return prev.map(item => 
            item.media_id === media.id && item.media_type === type 
              ? { 
                  ...item, 
                  status,
                  genre_ids: media.genre_ids || item.genre_ids,
                  genres: media.genres || item.genres
                } 
              : item
          );
        } else {
          return [
            ...prev,
            {
              user_id: currentUser.id,
              media_id: media.id,
              media_type: type,
              status,
              title,
              poster_path: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
              vote_average: media.vote_average,
              genre_ids: media.genre_ids,
              genres: media.genres
            }
          ];
        }
      });

      // Add activity log
      const newActivity: ActivityFeedItem = {
        id: `act_${Date.now()}`,
        user_id: currentUser.id,
        profile: currentUser,
        action_type: 'status_update',
        media_id: media.id,
        media_type: type,
        details: {
          media_title: title,
          media_poster: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
          status
        },
        created_at: new Date().toISOString()
      };
      setActivityFeed(prev => [newActivity, ...prev]);

      // If a TV show is marked as 'watched', automatically mark all episodes as watched
      if (status === 'watched' && isTv) {
        (async () => {
          try {
            const details = await getDetails(media.id, 'tv');
            const totalSeasons = details?.number_of_seasons || media.number_of_seasons || 1;
            const seasonPromises = [];
            for (let s = 1; s <= totalSeasons; s++) {
              seasonPromises.push(getSeasonDetails(media.id, s));
            }
            const seasonsData = await Promise.all(seasonPromises);
            const allEpisodes: Array<{ season_number: number; episode_number: number }> = [];
            seasonsData.forEach(sData => {
              if (sData?.episodes && Array.isArray(sData.episodes)) {
                sData.episodes.forEach(ep => {
                  allEpisodes.push({
                    season_number: ep.season_number,
                    episode_number: ep.episode_number
                  });
                });
              }
            });
            if (allEpisodes.length > 0) {
              await handleBatchMarkEpisodes(media.id, allEpisodes, undefined, true);
            }
          } catch (err) {
            console.error('Failed to auto-mark all episodes as watched:', err);
          }
        })();
      }
    }

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        if (status === null) {
          await supabase
            .from('watch_status')
            .delete()
            .eq('user_id', userId)
            .eq('media_id', media.id)
            .eq('media_type', type);
        } else {
          await supabase
            .from('watch_status')
            .upsert({
              user_id: userId,
              media_id: media.id,
              media_type: type,
              status,
              title,
              poster_path: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
              vote_average: media.vote_average,
              updated_at: new Date().toISOString()
            });

          await supabase
            .from('activity_feed')
            .insert({
              user_id: userId,
              action_type: 'status_update',
              media_id: media.id,
              media_type: type,
              details: {
                media_title: title,
                media_poster: media.poster_path ? (media.poster_path.startsWith('http') ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`) : undefined,
                status
              }
            });
        }
      } catch (err) {
        console.error('Failed to update watch status in Supabase:', err);
      }
    }
  };

  // Toggle Episode Watched Progress
  const handleToggleEpisode = async (showId: number, seasonNum: number, epNum: number) => {
    let isMarkingAsWatched = false;

    setEpisodeProgress(prev => {
      const existing = prev.find(
        e => e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
      );
      const isCurrentlyWatched = existing ? existing.is_watched : false;
      isMarkingAsWatched = !isCurrentlyWatched;

      if (!isMarkingAsWatched) {
        // UNWATCHING: Mark target episode AND ALL SUBSEQUENT EPISODES of this show as unwatched
        return prev.map(e => {
          if (e.show_id === showId) {
            const isAfterOrEqual = e.season_number > seasonNum || (e.season_number === seasonNum && e.episode_number >= epNum);
            if (isAfterOrEqual) {
              return { ...e, is_watched: false };
            }
          }
          return e;
        });
      } else {
        // WATCHING: Mark target episode as watched
        if (existing) {
          return prev.map(e => 
            e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
              ? { ...e, is_watched: true, watched_at: new Date().toISOString() }
              : e
          );
        } else {
          return [
            ...prev,
            {
              user_id: currentUser.id,
              show_id: showId,
              season_number: seasonNum,
              episode_number: epNum,
              is_watched: true,
              watched_at: new Date().toISOString()
            }
          ];
        }
      }
    });

    if (isMarkingAsWatched) {
      // Automatically move show to 'watching' if it was in 'plan_to_watch'
      setWatchList(prev => {
        const show = prev.find(w => w.media_id === showId && w.media_type === 'tv');
        if (show && show.status === 'plan_to_watch') {
          return prev.map(w =>
            w.media_id === showId && w.media_type === 'tv' ? { ...w, status: 'watching' as WatchStatusType } : w
          );
        }
        return prev;
      });

      const showItem = watchList.find(w => w.media_id === showId);
      let resolvedShowTitle = showItem?.title || (selectedMedia?.id === showId ? (selectedMedia.name || selectedMedia.title) : undefined);
      let resolvedShowPoster = showItem?.poster_path || (selectedMedia?.id === showId ? selectedMedia.poster_path : undefined);

      if (!resolvedShowTitle || resolvedShowTitle === 'Dizi' || resolvedShowTitle === 'Yapım') {
        try {
          const details = await getDetails(showId, 'tv');
          if (details) {
            resolvedShowTitle = details.name || details.title || resolvedShowTitle || 'Dizi';
            resolvedShowPoster = resolvedShowPoster || details.poster_path;
          }
        } catch (e) {}
      }

      const newActivity: ActivityFeedItem = {
        id: `act_${Date.now()}`,
        user_id: currentUser.id,
        profile: currentUser,
        action_type: 'episode_watched',
        media_id: showId,
        media_type: 'tv',
        details: {
          media_title: resolvedShowTitle || 'Dizi',
          media_poster: resolvedShowPoster,
          season_number: seasonNum,
          episode_number: epNum
        },
        created_at: new Date().toISOString()
      };
      setActivityFeed(prev => [newActivity, ...prev]);

      if (session && isSupabaseConfigured) {
        try {
          const userId = session.user.id;
          const show = watchList.find(w => w.media_id === showId && w.media_type === 'tv');
          if (show && show.status === 'plan_to_watch') {
            await supabase
              .from('watch_status')
              .update({ status: 'watching' })
              .eq('user_id', userId)
              .eq('media_id', showId)
              .eq('media_type', 'tv');
          }

          await supabase
            .from('episode_progress')
            .upsert({
              user_id: userId,
              show_id: showId,
              season_number: seasonNum,
              episode_number: epNum,
              is_watched: true
            });

          await supabase
            .from('activity_feed')
            .insert({
              user_id: userId,
              action_type: 'episode_watched',
              media_id: showId,
              media_type: 'tv',
              details: {
                media_title: resolvedShowTitle || 'Dizi',
                media_poster: resolvedShowPoster,
                season_number: seasonNum,
                episode_number: epNum
              }
            });
        } catch (err) {
          console.error('Failed to sync episode watched progress in Supabase:', err);
        }
      }
    } else {
      // UNWATCHING: Sync unwatched state for target episode and all subsequent episodes to Supabase
      if (session && isSupabaseConfigured) {
        try {
          const userId = session.user.id;
          await supabase
            .from('episode_progress')
            .update({ is_watched: false })
            .eq('user_id', userId)
            .eq('show_id', showId)
            .eq('season_number', seasonNum)
            .gte('episode_number', epNum);

          await supabase
            .from('episode_progress')
            .update({ is_watched: false })
            .eq('user_id', userId)
            .eq('show_id', showId)
            .gt('season_number', seasonNum);
        } catch (err) {
          console.error('Failed to sync unwatched episodes in Supabase:', err);
        }
      }
    }
  };

  // Batch Mark Multiple Episodes as Watched across seasons
  const handleBatchMarkEpisodes = async (
    showId: number,
    seasonNumOrItems: number | Array<{ season_number: number; episode_number: number }>,
    epNums?: number[],
    skipActivity?: boolean
  ) => {
    let itemsToMark: Array<{ season_number: number; episode_number: number }> = [];

    if (Array.isArray(seasonNumOrItems)) {
      itemsToMark = seasonNumOrItems;
    } else if (typeof seasonNumOrItems === 'number' && epNums) {
      itemsToMark = epNums.map(epNum => ({ season_number: seasonNumOrItems, episode_number: epNum }));
    }

    if (itemsToMark.length === 0) return;

    const now = new Date().toISOString();
    setEpisodeProgress(prev => {
      let nextState = [...prev];
      for (const item of itemsToMark) {
        const idx = nextState.findIndex(
          e => e.show_id === showId && e.season_number === item.season_number && e.episode_number === item.episode_number
        );
        if (idx >= 0) {
          nextState[idx] = { ...nextState[idx], is_watched: true };
        } else {
          nextState.push({
            user_id: currentUser.id,
            show_id: showId,
            season_number: item.season_number,
            episode_number: item.episode_number,
            is_watched: true,
            watched_at: now
          });
        }
      }
      return nextState;
    });

    // Automatically move show to 'watching' if it was in 'plan_to_watch'
    setWatchList(prev => {
      const show = prev.find(w => w.media_id === showId && w.media_type === 'tv');
      if (show && show.status === 'plan_to_watch') {
        return prev.map(w =>
          w.media_id === showId && w.media_type === 'tv' ? { ...w, status: 'watching' as WatchStatusType } : w
        );
      }
      return prev;
    });

    if (!skipActivity) {
      // Add activity for batch
      const showItem = watchList.find(w => w.media_id === showId);
      const lastItem = itemsToMark[itemsToMark.length - 1];
      const newActivity: ActivityFeedItem = {
        id: `act_${Date.now()}`,
        user_id: currentUser.id,
        profile: currentUser,
        action_type: 'episode_watched',
        media_id: showId,
        media_type: 'tv',
        details: {
          media_title: showItem?.title || 'Dizi',
          media_poster: showItem?.poster_path,
          season_number: lastItem.season_number,
          episode_number: lastItem.episode_number
        },
        created_at: now
      };
      setActivityFeed(prev => [newActivity, ...prev]);
    }

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        
        // 1. Move to watching status if plan_to_watch
        const show = watchList.find(w => w.media_id === showId && w.media_type === 'tv');
        if (show && show.status === 'plan_to_watch') {
          await supabase
            .from('watch_status')
            .update({ status: 'watching' })
            .eq('user_id', userId)
            .eq('media_id', showId)
            .eq('media_type', 'tv');
        }

        // 2. Batch upsert episodes progress in Supabase
        const upsertData = itemsToMark.map(item => ({
          user_id: userId,
          show_id: showId,
          season_number: item.season_number,
          episode_number: item.episode_number,
          is_watched: true
        }));
        await supabase
          .from('episode_progress')
          .upsert(upsertData);

        // 3. Log activity if not skipped
        if (!skipActivity) {
          const showItem = watchList.find(w => w.media_id === showId);
          const lastItem = itemsToMark[itemsToMark.length - 1];
          await supabase
            .from('activity_feed')
            .insert({
              user_id: userId,
              action_type: 'episode_watched',
              media_id: showId,
              media_type: 'tv',
              details: {
                media_title: showItem?.title || 'Dizi',
                media_poster: showItem?.poster_path,
                season_number: lastItem.season_number,
                episode_number: lastItem.episode_number
              }
            });
        }
      } catch (err) {
        console.error('Failed to sync batch episode progress to Supabase:', err);
      }
    }
  };

  // Rate Episode & Mark as Watched
  const handleRateEpisode = async (showId: number, seasonNum: number, epNum: number, rating: number) => {
    setEpisodeProgress(prev => {
      const existing = prev.find(
        e => e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
      );
      if (existing) {
        return prev.map(e =>
          e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
            ? { ...e, is_watched: true, rating, watched_at: new Date().toISOString() }
            : e
        );
      } else {
        return [
          ...prev,
          {
            user_id: currentUser.id,
            show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            is_watched: true,
            rating,
            watched_at: new Date().toISOString()
          }
        ];
      }
    });

    // Automatically move show to 'watching' if it was in 'plan_to_watch'
    setWatchList(prev => {
      const show = prev.find(w => w.media_id === showId && w.media_type === 'tv');
      if (show && show.status === 'plan_to_watch') {
        return prev.map(w =>
          w.media_id === showId && w.media_type === 'tv' ? { ...w, status: 'watching' as WatchStatusType } : w
        );
      }
      return prev;
    });

    const showItem = watchList.find(w => w.media_id === showId);
    const newActivity: ActivityFeedItem = {
      id: `act_${Date.now()}`,
      user_id: currentUser.id,
      profile: currentUser,
      action_type: 'episode_watched',
      media_id: showId,
      media_type: 'tv',
      details: {
        media_title: showItem?.title || 'Dizi',
        media_poster: showItem?.poster_path,
        season_number: seasonNum,
        episode_number: epNum,
        rating
      },
      created_at: new Date().toISOString()
    };
    setActivityFeed(prev => [newActivity, ...prev]);

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        await supabase
          .from('episode_progress')
          .upsert({
            user_id: userId,
            show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            is_watched: true
          });

        await supabase
          .from('episode_ratings')
          .upsert({
            user_id: userId,
            show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            rating
          });

        await supabase
          .from('activity_feed')
          .insert({
            user_id: userId,
            action_type: 'episode_watched',
            media_id: showId,
            media_type: 'tv',
            details: {
              media_title: showItem?.title || 'Dizi',
              media_poster: showItem?.poster_path,
              season_number: seasonNum,
              episode_number: epNum,
              rating
            }
          });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save Episode Note/Review
  const handleSaveEpisodeNote = async (showId: number, seasonNum: number, epNum: number, note: string, hasSpoiler: boolean = false) => {
    setEpisodeProgress(prev => {
      const existing = prev.find(
        e => e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
      );
      if (existing) {
        return prev.map(e =>
          e.show_id === showId && e.season_number === seasonNum && e.episode_number === epNum
            ? { ...e, is_watched: true, note, note_has_spoiler: hasSpoiler }
            : e
        );
      } else {
        return [
          ...prev,
          {
            user_id: currentUser.id,
            show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            is_watched: true,
            note,
            note_has_spoiler: hasSpoiler,
            watched_at: new Date().toISOString()
          }
        ];
      }
    });

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        await supabase
          .from('episode_progress')
          .upsert({
            user_id: userId,
            show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            is_watched: true
          });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Add Review
  const handleAddReview = async (newRev: Omit<RatingReview, 'id' | 'created_at'>) => {
    const fullRev: RatingReview = {
      ...newRev,
      id: `rev_${Date.now()}`,
      created_at: new Date().toISOString(),
      profile: currentUser
    };
    setReviews(prev => [fullRev, ...prev]);

    const newActivity: ActivityFeedItem = {
      id: `act_${Date.now()}`,
      user_id: currentUser.id,
      profile: currentUser,
      action_type: 'review_added',
      media_id: newRev.media_id,
      media_type: newRev.media_type,
      details: {
        media_title: newRev.media_title,
        media_poster: newRev.media_poster,
        rating: newRev.rating,
        review_text: newRev.review_text,
        contains_spoiler: newRev.contains_spoiler
      },
      created_at: new Date().toISOString()
    };
    setActivityFeed(prev => [newActivity, ...prev]);

    if (session && isSupabaseConfigured) {
      try {
        const userId = session.user.id;
        await supabase
          .from('ratings_reviews')
          .insert({
            user_id: userId,
            media_id: newRev.media_id,
            media_type: newRev.media_type,
            rating: newRev.rating,
            review_text: newRev.review_text,
            contains_spoiler: newRev.contains_spoiler,
            media_title: newRev.media_title,
            media_poster: newRev.media_poster
          });

        await supabase
          .from('activity_feed')
          .insert({
            user_id: userId,
            action_type: 'review_added',
            media_id: newRev.media_id,
            media_type: newRev.media_type,
            details: {
              media_title: newRev.media_title,
              media_poster: newRev.media_poster,
              rating: newRev.rating,
              review_text: newRev.review_text,
              contains_spoiler: newRev.contains_spoiler
            }
          });
      } catch (err) {
        console.error('Failed to save review in Supabase:', err);
      }
    }
  };

  // Toggle Pin Review
  const handleTogglePinReview = async (reviewId: string) => {
    let nextPinnedState = false;

    setReviews(prev => prev.map(r => {
      const isMatch = r.id === reviewId || `rev_${r.media_id}` === reviewId || String(r.media_id) === reviewId;
      if (isMatch) {
        nextPinnedState = !r.is_pinned;
        return { ...r, is_pinned: nextPinnedState };
      }
      return r;
    }));

    if (session && isSupabaseConfigured) {
      try {
        const targetRev = reviews.find(r => r.id === reviewId || `rev_${r.media_id}` === reviewId || String(r.media_id) === reviewId);
        if (targetRev && targetRev.id) {
          await supabase
            .from('ratings_reviews')
            .update({ is_pinned: nextPinnedState })
            .eq('id', targetRev.id);
        }
      } catch (err) {
        console.warn('Pin review error:', err);
      }
    }
  };

  // Select media by id for Activity Feed item or grid clicks
  const handleSelectMediaById = async (mediaId: number, type: MediaType) => {
    try {
      const full = await getDetails(mediaId, type);
      setSelectedMedia(full);
    } catch (e) {
      console.error(e);
      // Fallback
      setSelectedMedia({
        id: mediaId,
        title: 'Yapım Detayı',
        name: 'Yapım Detayı',
        overview: 'TMDB veri sunucusundan ayrıntılar yükleniyor...',
        poster_path: null,
        backdrop_path: null,
        media_type: type,
        vote_average: 8.0,
        vote_count: 100,
        popularity: 50
      });
    }
  };

  // Construct combined list of media items (trendingMedia + watchList mapped to TMDBMedia)
  // Recommendations (trendingMedia) are only included when statusFilter is 'all'
  const allAvailableMedia: TMDBMedia[] = statusFilter === 'all' ? [...trendingMedia] : [];

  watchList.forEach(w => {
    const exists = allAvailableMedia.some(
      m => m.id === w.media_id && ((m.media_type === 'tv' || !!m.first_air_date) ? 'tv' : 'movie') === w.media_type
    );
    if (!exists) {
      allAvailableMedia.push({
        id: w.media_id,
        title: w.title || 'Yapım',
        name: w.title || 'Yapım',
        media_type: w.media_type,
        poster_path: w.poster_path || null,
        backdrop_path: null,
        vote_average: w.vote_average || 8.0,
        vote_count: 100,
        popularity: 100,
        overview: ''
      });
    }
  });

  // Filter Activity Feed strictly to followed users and own activities
  const followedActivities = activityFeed.filter(a => {
    if (a.user_id === currentUser.id) return true;
    if (followingUserIds && followingUserIds.includes(a.user_id)) return true;
    return false;
  });

  const rawFilteredGridMedia = allAvailableMedia.filter(item => {
    const isTv = item.media_type === 'tv' || !!item.first_air_date;
    const type: MediaType = isTv ? 'tv' : 'movie';

    // 1. Filter by media type (all | tv | movie)
    if (mediaFilter === 'tv' && type !== 'tv') return false;
    if (mediaFilter === 'movie' && type !== 'movie') return false;

    // 2. Filter by watch status
    const userStatus = getUserWatchStatus(item.id, type);
    if (statusFilter === 'watching' && userStatus !== 'watching') return false;
    if (statusFilter === 'plan_to_watch' && userStatus !== 'plan_to_watch') return false;
    if (statusFilter === 'watched' && userStatus !== 'watched') return false;

    // 3. In Keşfet (discover) view, exclude any content already in any of the user's categories
    if (activeTab === 'discover' && statusFilter === 'all' && userStatus !== null) return false;

    if (activeTab === 'watchlist' && statusFilter === 'all' && !userStatus) return false;

    return true;
  });

  // For Keşfet recommendations: pick 18 random items from ALL trending (media-filter independent),
  // excluding anything already in the user's library.
  const discoverRandomRecommendations = React.useMemo(() => {
    const pool = discoverAllTrending.filter(item => {
      const isTv = item.media_type === 'tv' || !!item.first_air_date;
      const type: MediaType = isTv ? 'tv' : 'movie';
      const status = getUserWatchStatus(item.id, type);
      return status === null || status === undefined;
    });
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, 18);
  }, [discoverAllTrending.length, watchList.length]);

  const gridDisplayMedia = (activeTab === 'discover' && statusFilter === 'all')
    ? discoverRandomRecommendations
    : sortFranchiseAlphabetical(rawFilteredGridMedia);

  // Alias for watchlist grid (sorted, full)
  const filteredGridMedia = sortFranchiseAlphabetical(rawFilteredGridMedia);

  if (isSupabaseConfigured && !session && !authLoading) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 flex flex-col font-sans selection:bg-[#E63946] selection:text-white overflow-x-hidden max-w-full">
      {(authLoading || isDataLoading) && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-amber-500 to-indigo-500 animate-pulse z-50" />
      )}
      
      {/* 1. Header Component */}
      <Header
        user={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        userSearchResults={userSearchResults}
        isSearching={loadingMedia}
        onSelectMedia={(m) => setSelectedMedia(m)}
        onNavigateToProfile={handleNavigateToProfile}
        onOpenProfile={() => handleNavigateToProfile(currentUser.username)}
        onGoHome={() => {
          setActiveTab('discover');
          setStatusFilter('all');
          try { window.history.pushState({ tab: 'discover' }, '', '/'); } catch(e){}
        }}
        onLogout={handleLogout}
        notificationCount={isSupabaseConfigured ? 0 : 3}
        mediaFilter={mediaFilter}
        setMediaFilter={handleSetMediaFilter}
        statusFilter={statusFilter}
        setStatusFilter={handleSetStatusFilter}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenStats={() => handleNavigateToProfile(currentUser.username, 'stats')}
        onOpenNotifications={() => handleTabChange('activity')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateWatchStatus={(m, st) => handleUpdateWatchStatus(m, st)}
        getUserWatchStatus={getUserWatchStatus}
      />

      {/* 2. Main Layout Container: Full-Width for Profile vs 3-Column Grid for Dashboard */}
      {activeTab === 'profile' ? (
        <main className="flex-1 w-full pb-20 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`profile-${viewingUsername}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {(() => {
                const isOwnProfile = !viewingUsername || 
                  (currentUser.username && viewingUsername.toLowerCase() === currentUser.username.toLowerCase()) || 
                  viewingUsername === 'me' || 
                  viewingUsername === currentUser.id ||
                  (session?.user?.id && viewingUsername === session.user.id);
                
                const isExternalLoading = !isOwnProfile && !externalProfileData;
                const profileData = isOwnProfile 
                  ? {
                      profile: currentUser,
                      watchList,
                      episodeProgress,
                      reviews,
                      favorites,
                      collections
                    }
                  : (externalProfileData || {
                      profile: {
                        id: viewingUsername || '',
                        username: viewingUsername || 'kullanici',
                        full_name: viewingUsername || 'Kullanıcı',
                        avatar_url: DEFAULT_AVATAR_URL,
                        banner_url: '',
                        bio: ''
                      },
                      watchList: [],
                      episodeProgress: [],
                      reviews: [],
                      favorites: [],
                      collections: []
                    });

                return (
                  <React.Suspense fallback={<PageLoader />}>
                    <ProfileView
                      user={profileData.profile}
                      watchList={profileData.watchList}
                      favorites={profileData.favorites}
                      episodeProgress={profileData.episodeProgress}
                      reviews={profileData.reviews}
                      onSelectTab={handleTabChange}
                      onSelectMediaById={handleSelectMediaById}
                      onNavigateToProfile={handleNavigateToProfile}
                      collections={profileData.collections}
                      onSelectCollection={setSelectedCollectionId}
                      currentUserId={currentUser.id}
                      currentUserProfile={currentUser}
                      currentUserWatchList={watchList}
                      isFollowing={followingUserIds.includes(profileData.profile.id)}
                      followingUserIds={followingUserIds}
                      onToggleFollowUser={handleToggleFollowUser}
                      onUpdateProfile={handleUpdateProfile}
                      initialSubTab={profileSubTab}
                      isLoading={isExternalLoading}
                    />
                  </React.Suspense>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 sm:py-8 pb-20 md:pb-8">
          
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Sol Sidebar (270px - Hidden on mobile) */}
            <div className="hidden lg:block w-[270px] shrink-0 space-y-5">
              <LeftSidebar
                user={currentUser}
                activeMediaType={mediaFilter}
                setActiveMediaType={handleSetMediaFilter}
                activeStatusFilter={statusFilter}
                setActiveStatusFilter={handleSetStatusFilter}
                watchList={watchList}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                collections={collections}
                favorites={favorites}
                reviews={reviews}
                onSelectCollection={setSelectedCollectionId}
                onNavigateToProfile={handleNavigateToProfile}
              />
            </div>

            {/* Orta Alan (Main Content) */}
            <div className="flex-1 w-full min-w-0 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${statusFilter}-${mediaFilter}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
              {activeTab === 'discover' ? (
                <div>
                  {/* Mobil Arama Görünümü (En üstte arama çubuğu + 2 Öneri Kutusu) */}
                  <div className="block md:hidden">
                    <MobileSearchView
                      watchList={watchList}
                      onSelectMedia={(m) => setSelectedMedia(m)}
                      onUpdateWatchStatus={(m, st) => handleUpdateWatchStatus(m, st)}
                      getUserWatchStatus={getUserWatchStatus}
                    />
                  </div>

                  {/* Masaüstü Keşfet Görünümü */}
                  <div className="hidden md:block space-y-6">

                    {/* Bunları da Beğenebilirsin (Sadece Keşfet / Tüm Liste seçili iken gösterilir) */}
                    {statusFilter === 'all' && (
                      <RecommendationsSection
                        watchList={watchList}
                        onSelectMedia={(m) => setSelectedMedia(m)}
                        onUpdateWatchStatus={(m, st) => handleUpdateWatchStatus(m, st)}
                        getUserWatchStatus={getUserWatchStatus}
                      />
                    )}

                    <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
                        <div className="flex items-center gap-2">
                          {statusFilter === 'watching' ? (
                            <Eye className="w-5 h-5 text-[#E63946]" />
                          ) : statusFilter === 'plan_to_watch' ? (
                            <Clock className="w-5 h-5 text-amber-400" />
                          ) : statusFilter === 'watched' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-[#E63946]" />
                          )}
                          <h2 className="text-lg font-bold text-white">
                            {statusFilter === 'watching'
                              ? `İzliyorum (${gridDisplayMedia.length})`
                              : statusFilter === 'plan_to_watch'
                              ? `İzlenecek (${gridDisplayMedia.length})`
                              : statusFilter === 'watched'
                              ? `İzledim (${gridDisplayMedia.length})`
                              : 'Dizi & Film Önerileri'}
                          </h2>
                        </div>
                        <span className="text-xs text-slate-400 font-medium bg-[#0B0C0E] px-2.5 py-1 rounded-lg border border-[#232833]">
                          {mediaFilter === 'tv' ? 'Diziler' : mediaFilter === 'movie' ? 'Filmler' : 'Tüm Yapımlar'}
                        </span>
                      </div>

                      {loadingMedia ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
                          {Array.from({ length: 12 }).map((_, idx) => (
                            <div key={idx} className="bg-[#0B0C0E] aspect-[2/3] rounded-2xl animate-pulse border border-[#232833]" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
                          {gridDisplayMedia.map((item) => {
                            const isTv = item.media_type === 'tv' || !!item.first_air_date;
                            const type: MediaType = isTv ? 'tv' : 'movie';
                            const userStatus = getUserWatchStatus(item.id, type);

                            return (
                              <MediaCard
                                key={`${item.id}-${type}`}
                                media={item}
                                userWatchStatus={userStatus}
                                showQuickActions={true}
                                onSelect={(m) => setSelectedMedia(m)}
                                onUpdateStatus={(m, st) => handleUpdateWatchStatus(m, st)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'watchlist' ? (
                <div className="space-y-6">
                  {/* Dynamic Single-Category Grid for Watchlist */}
                  <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
                      <div className="flex items-center gap-2">
                        {statusFilter === 'watching' ? (
                          <Eye className="w-5 h-5 text-[#E63946]" />
                        ) : statusFilter === 'plan_to_watch' ? (
                          <Clock className="w-5 h-5 text-amber-400" />
                        ) : statusFilter === 'watched' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-[#E63946]" />
                        )}
                        <h2 className="text-lg font-bold text-white">
                          {statusFilter === 'watching'
                            ? `İzliyorum (${filteredGridMedia.length})`
                            : statusFilter === 'plan_to_watch'
                            ? `İzlenecek (${filteredGridMedia.length})`
                            : statusFilter === 'watched'
                            ? `İzledim (${filteredGridMedia.length})`
                            : `Kitaplığım (${filteredGridMedia.length})`}
                        </h2>
                      </div>

                      <span className="text-xs text-slate-400 font-medium bg-[#0B0C0E] px-2.5 py-1 rounded-lg border border-[#232833]">
                        {mediaFilter === 'tv' ? 'Diziler' : mediaFilter === 'movie' ? 'Filmler' : 'Tüm Yapımlar'}
                      </span>
                    </div>

                    {loadingMedia ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-3.5">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div key={idx} className="bg-[#0B0C0E] aspect-[2/3] rounded-2xl animate-pulse border border-[#232833]" />
                        ))}
                      </div>
                    ) : filteredGridMedia.length === 0 ? (
                      <EmptyState
                        title="Bu Kategoride Henüz Yapım Bulunmuyor"
                        description={
                          statusFilter === 'watching'
                            ? "Şu anda takip ettiğiniz bir film veya dizi bulunmuyor. Keşfet sekmesinden yeni yapımlar ekleyebilirsiniz."
                            : statusFilter === 'plan_to_watch'
                            ? "İzleme listenize henüz kaydedilmiş bir yapım yok."
                            : statusFilter === 'watched'
                            ? "Henüz tamamlanan bir film veya dizi bulunmuyor."
                            : "Seçilen filtrelere uygun bir dizi veya film bulunamadı."
                        }
                        iconType={
                          statusFilter === 'watching'
                            ? 'eye'
                            : statusFilter === 'plan_to_watch'
                            ? 'bookmark'
                            : statusFilter === 'watched'
                            ? 'tv'
                            : mediaFilter === 'tv'
                            ? 'tv'
                            : 'film'
                        }
                        actionLabel="Filtreleri Temizle"
                        onAction={() => {
                          setStatusFilter('all');
                          setMediaFilter('all');
                        }}
                      />
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-3.5">
                        {filteredGridMedia.map((item) => {
                          const isTv = item.media_type === 'tv' || !!item.first_air_date;
                          const type: MediaType = isTv ? 'tv' : 'movie';
                          const userStatus = getUserWatchStatus(item.id, type);

                          return (
                            <MediaCard
                              key={`${item.id}-${type}`}
                              media={item}
                              userWatchStatus={userStatus}
                              showQuickActions={statusFilter === 'all'}
                              onSelect={(m) => setSelectedMedia(m)}
                              onUpdateStatus={(m, st) => handleUpdateWatchStatus(m, st)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'tracker' ? (
                <EpisodeTracker
                  watchingList={watchList.filter(w => w.status === 'watching')}
                  episodeProgress={episodeProgress}
                  onToggleEpisode={handleToggleEpisode}
                  onBatchMarkEpisodes={handleBatchMarkEpisodes}
                  onSelectMedia={(m) => setSelectedMedia(m)}
                />
              ) : activeTab === 'calendar' ? (
                <React.Suspense fallback={<PageLoader />}>
                  <CalendarView
                    watchingList={watchList.filter(w => w.status === 'watching')}
                    episodeProgress={episodeProgress}
                    onToggleEpisode={handleToggleEpisode}
                    onSelectMedia={(m) => setSelectedMedia(m)}
                  />
                </React.Suspense>
              ) : activeTab === 'activity' ? (
                <React.Suspense fallback={<PageLoader />}>
                  <ActivityFeedView
                    activities={followedActivities}
                    onSelectMediaById={handleSelectMediaById}
                    onNavigateToProfile={handleNavigateToProfile}
                    followingUserIds={followingUserIds}
                    onToggleFollowUser={handleToggleFollowUser}
                  />
                </React.Suspense>
              ) : activeTab === 'collections' ? (
                <React.Suspense fallback={<PageLoader />}>
                  <CollectionsView
                    collections={collections}
                    onCreateCollection={handleCreateCollection}
                    onUpdateCollection={handleUpdateCollection}
                    onDeleteCollection={handleDeleteCollection}
                    onRemoveItemFromCollection={handleRemoveItemFromCollection}
                    onAddItemToCollection={handleAddItemToCollection}
                    onSelectMediaById={handleSelectMediaById}
                    userWatchList={watchList}
                    selectedCollectionId={selectedCollectionId}
                    onSelectCollectionId={setSelectedCollectionId}
                  />
                </React.Suspense>
              ) : activeTab === 'favorites' ? (
                <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#232833] gap-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <h2 className="text-lg font-bold text-white">Favorilerim</h2>
                    </div>

                    {/* Search Bar for Adding from Watched Library */}
                    <div className="relative z-30 w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={favSearchQuery}
                        onChange={(e) => setFavSearchQuery(e.target.value)}
                        placeholder="İzlediğiniz yapımlardan favori ekleyin..."
                        className="w-full bg-[#0B0C0E] border border-[#232833] focus:border-[#E63946] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                      {favSearchQuery && (
                        <button
                          onClick={() => setFavSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition"
                          title="Aramayı temizle"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Results Dropdown */}
                      {favSearchQuery.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0C0E]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-56 z-50 divide-y divide-white/5 scrollbar-thin">
                          {watchList
                            .filter(w => w.status === 'watched' && (w.title || '').toLowerCase().includes(favSearchQuery.toLowerCase()) && !favorites.some(f => f.media_id === w.media_id && f.media_type === w.media_type))
                            .length > 0 ? (
                            watchList
                              .filter(w => w.status === 'watched' && (w.title || '').toLowerCase().includes(favSearchQuery.toLowerCase()) && !favorites.some(f => f.media_id === w.media_id && f.media_type === w.media_type))
                              .map((item) => {
                                const mediaItem: any = {
                                  id: item.media_id,
                                  title: item.media_type === 'movie' ? item.title || '' : undefined,
                                  name: item.media_type === 'tv' ? item.title || '' : undefined,
                                  poster_path: item.poster_path,
                                  media_type: item.media_type,
                                  vote_average: item.vote_average || 0,
                                  release_date: item.media_type === 'movie' ? '2024' : undefined,
                                  first_air_date: item.media_type === 'tv' ? '2024' : undefined,
                                  overview: '',
                                  genre_ids: []
                                };

                                return (
                                  <div
                                    key={`fav-search-res-${item.media_id}-${item.media_type}`}
                                    onClick={() => {
                                      handleToggleFavorite(mediaItem);
                                      setFavSearchQuery('');
                                    }}
                                    className="flex items-center gap-3.5 p-2 hover:bg-white/5 cursor-pointer transition duration-150 group text-left"
                                  >
                                    {item.poster_path ? (
                                      <img
                                        src={item.poster_path}
                                        alt={item.title}
                                        className="w-8 h-12 object-cover rounded-lg border border-white/10 shrink-0 group-hover:scale-105 transition"
                                      />
                                    ) : (
                                      <div className="w-8 h-12 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                                        <Film className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E63946] transition">
                                        {item.title}
                                      </h4>
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        {item.media_type === 'tv' ? 'Dizi' : 'Film'}
                                      </p>
                                    </div>
                                    <span className="p-1 rounded bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 group-hover:bg-[#E63946] group-hover:text-white transition flex items-center justify-center shrink-0">
                                      <Plus className="w-3 h-3" />
                                    </span>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-500">
                              Eşleşen izlenmiş yapım bulunamadı.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 font-medium bg-[#0B0C0E] px-2.5 py-1 rounded-lg border border-[#232833] self-start sm:self-auto">
                      {favorites.length} Yapım
                    </span>
                  </div>

                  {favorites.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                        <Heart className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-200 font-bold">Henüz favori yapımınız yok</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Yukarıdaki arama çubuğunu kullanarak veya Keşfet sayfasındaki yapımların detay modalından favorilerinize ekleme yapabilirsiniz.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabChange('discover')}
                        className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-bold transition cursor-pointer"
                      >
                        Yapımları Keşfet
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-3.5">
                      {favorites.map((item) => {
                        const mediaItem: any = {
                          id: item.media_id,
                          title: item.media_type === 'movie' ? item.title || '' : undefined,
                          name: item.media_type === 'tv' ? item.title || '' : undefined,
                          poster_path: item.poster_path,
                          media_type: item.media_type,
                          vote_average: item.vote_average || 0,
                          release_date: item.media_type === 'movie' ? '2024' : undefined,
                          first_air_date: item.media_type === 'tv' ? '2024' : undefined,
                          overview: '',
                          genre_ids: []
                        };
                        return (
                          <div key={`${item.media_id}-${item.media_type}`} className="relative group">
                            <MediaCard
                              media={mediaItem}
                              userWatchStatus={getUserWatchStatus(item.media_id, item.media_type)}
                              showQuickActions={false}
                              onSelect={(m) => setSelectedMedia(m)}
                              onUpdateStatus={(m, st) => handleUpdateWatchStatus(m, st)}
                            />
                            {/* Quick Remove Heart Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(mediaItem);
                              }}
                              className="absolute top-2.5 left-2.5 bg-rose-500 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                              title="Favorilerden Çıkar"
                            >
                              <Heart className="w-3.5 h-3.5 fill-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeTab === 'reviews' ? (
                <div className="bg-[#14171D] border border-[#232833] rounded-2xl p-5 space-y-5 shadow-lg">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#232833]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
                        <MessageSquare className="w-5 h-5 fill-amber-400/20" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-white">İncelemelerim</h2>
                        <p className="text-xs text-slate-400">Değerlendirdiğiniz ve yorum yaptığınız tüm yapımlar</p>
                      </div>
                    </div>

                    <span className="text-xs text-slate-300 font-bold bg-[#0B0C0E] px-3 py-1.5 rounded-xl border border-[#232833]">
                      {reviews.length} İnceleme
                    </span>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-200 font-bold text-base">Henüz bir inceleme yazmadınız</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          İzlediğiniz dizi veya filmler için puan ve detaylı yorum ekleyerek burada kendi incelemelerinizi oluşturabilirsiniz.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabChange('discover')}
                        className="px-5 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white text-xs font-extrabold transition cursor-pointer shadow-md"
                      >
                        Yapımları Keşfet
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => {
                        const watchItem = watchList.find(w => Number(w.media_id) === Number(rev.media_id));
                        const title = rev.media_title || watchItem?.title || (rev.media_type === 'tv' ? 'Dizi' : 'Film');
                        const rawPoster = rev.media_poster || watchItem?.poster_path;
                        const poster = rawPoster 
                          ? (rawPoster.startsWith('http') ? rawPoster : `https://image.tmdb.org/t/p/w500${rawPoster}`) 
                          : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

                        return (
                          <div
                            key={rev.id || `rev-${rev.media_id}`}
                            className="bg-[#0B0C0E] border border-[#232833] hover:border-[#333a4a] rounded-xl p-4 transition shadow-sm space-y-3"
                          >
                            <div className="flex items-start gap-4">
                              {/* Poster Thumbnail */}
                              <div
                                onClick={() => handleSelectMediaById(rev.media_id, rev.media_type)}
                                className="w-16 h-24 sm:w-20 sm:h-30 rounded-lg overflow-hidden bg-black/40 shrink-0 cursor-pointer shadow-md group relative"
                              >
                                <img
                                  src={poster}
                                  alt={title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                              </div>

                              {/* İnceleme İçeriği */}
                              <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <h3
                                      onClick={() => handleSelectMediaById(rev.media_id, rev.media_type)}
                                      className="text-sm sm:text-base font-extrabold text-white hover:text-[#E63946] cursor-pointer transition"
                                    >
                                      {title}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                      {rev.media_type === 'tv' ? 'Dizi' : 'Film'}
                                    </span>
                                    {rev.contains_spoiler && (
                                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                                        Spoiler İçerir
                                      </span>
                                    )}
                                  </div>

                                  {/* Puan Rozeti */}
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                                    <Star className="w-3.5 h-3.5 fill-emerald-400" />
                                    <span>{rev.rating} / 10</span>
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic font-normal bg-[#14171D]/60 p-3 rounded-xl border border-[#232833]">
                                  "{rev.review_text}"
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                  <span>
                                    {rev.created_at ? (rev.created_at.includes('T') ? new Date(rev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : rev.created_at) : 'Yakın zamanda'}
                                  </span>

                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleTogglePinReview(rev.id || `rev_${rev.media_id}`)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        rev.is_pinned
                                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm'
                                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                      }`}
                                      title={rev.is_pinned ? 'Profilinizden sabitlemeyi kaldırın' : 'Profilinize sabitleyin'}
                                    >
                                      <Pin className={`w-3.5 h-3.5 ${rev.is_pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                                      <span>{rev.is_pinned ? 'Profilde Sabitlendi' : 'Profile Sabitle'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Sağ Sidebar (390px - 420px): 'Sosyal Akış' (Masaüstünde görünür, mobilde gizli) */}
            <div className="hidden lg:block w-[390px] xl:w-[420px] shrink-0 space-y-4 sticky top-24 h-fit">
              <SocialFeedSidebar
                activities={followedActivities}
                onSelectMediaById={handleSelectMediaById}
                currentUser={currentUser}
                onNavigateToProfile={handleNavigateToProfile}
                onAddActivity={handlePostStatusUpdate}
                isLoading={isDataLoading}
              />
            </div>

          </div>

        </main>
      )}



      {/* Selected Media Detail Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <React.Suspense fallback={<PageLoader />}>
            <MediaDetailModal
              media={selectedMedia}
              onClose={() => setSelectedMedia(null)}
              userWatchStatus={getUserWatchStatus(selectedMedia.id, selectedMedia.media_type === 'tv' || !!selectedMedia.first_air_date ? 'tv' : 'movie')}
              onUpdateWatchStatus={handleUpdateWatchStatus}
              episodeProgress={episodeProgress}
              onToggleEpisode={handleToggleEpisode}
              onBatchMarkEpisodes={handleBatchMarkEpisodes}
              onRateEpisode={handleRateEpisode}
              onSaveEpisodeNote={handleSaveEpisodeNote}
              onAddReview={handleAddReview}
              reviews={reviews}
              currentUserId={currentUser.id}
              collections={collections}
              onToggleItemInCollection={handleToggleItemInCollection}
              onCreateCollection={handleCreateCollection}
              isFavorited={favorites.some(f => f.media_id === selectedMedia.id && f.media_type === (selectedMedia.media_type === 'tv' || !!selectedMedia.first_air_date ? 'tv' : 'movie'))}
              onToggleFavorite={handleToggleFavorite}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Monthly Recap / Stats Modal */}
      {showRecapModal && (
        <React.Suspense fallback={<PageLoader />}>
          <MonthlyRecapModal
            isOpen={showRecapModal}
            onClose={() => setShowRecapModal(false)}
            user={currentUser}
            watchList={watchList}
            episodeProgress={episodeProgress}
            reviews={reviews}
            onSelectMediaById={handleSelectMediaById}
          />
        </React.Suspense>
      )}

      {/* Sol Panel (Sidebar Drawer) for Mobile (< 768px) - High z-index root render */}
      <MobileSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={currentUser}
        onOpenProfile={() => {
          handleNavigateToProfile(currentUser.username);
        }}
        onOpenStats={() => handleNavigateToProfile(currentUser.username, 'stats')}
        onOpenCalendar={() => handleTabChange('calendar')}
        onOpenFavorites={() => handleTabChange('favorites')}
        onOpenNotifications={() => handleTabChange('activity')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <React.Suspense fallback={<PageLoader />}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={currentUser}
          />
        </React.Suspense>
      )}

      {/* Mobile Bottom Navigation Bar (< 768px - Spotify Style) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

    </div>
  );
}
