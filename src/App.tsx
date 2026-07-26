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
import { MediaDetailModal } from './components/MediaDetailModal';
import { EpisodeTracker } from './components/EpisodeTracker';
import { CalendarView } from './components/CalendarView';
import { ActivityFeedView } from './components/ActivityFeedView';
import { ProfileView } from './components/ProfileView';
import { CollectionsView } from './components/CollectionsView';
import { EmptyState } from './components/EmptyState';
import { MonthlyRecapModal } from './components/MonthlyRecapModal';
import { MobileSidebarDrawer } from './components/MobileSidebarDrawer';
import { SettingsModal } from './components/SettingsModal';
import { RecommendationsSection } from './components/RecommendationsSection';
import { sortFranchiseAlphabetical } from './lib/sorting';

import { TMDBMedia, WatchStatus, WatchStatusType, EpisodeProgress, RatingReview, ActivityFeedItem, MediaType, CustomCollection, CollectionItem, Profile } from './types';
import { getTrending, search, getDetails } from './lib/tmdb';
import { CURRENT_USER, INITIAL_USER_WATCH_STATUSES, INITIAL_ACTIVITIES, INITIAL_REVIEWS, INITIAL_COLLECTIONS, getMockProfileData } from './data/mockData';
import { Flame, Tv, Film, Bookmark, Eye, Clock, CheckCircle2, Heart, Plus, X, Search, Loader2, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthView } from './components/AuthView';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);

  // Global unhandled promise rejection catcher
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent crash
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

  // Fetch user data from Supabase when session is active
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (!session) {
      if (authLoading) return; // Do not clear state while auth is loading!
      return;
    }

    const fetchUserData = async () => {
      const userId = session.user.id;

      // 1. Profile
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData) {
          const profileObj = {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            banner_url: profileData.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
            featured_media_title: profileData.featured_media_title || 'Severance',
            bio: profileData.bio || '',
            email: profileData.email || session.user.email || ''
          };
          setCurrentUser(profileObj);
          setViewingUsername(profileData.username);
        }
      } catch (err) { console.warn('profiles fetch error:', err); }

      // 2. Watch Status List - Load FULLY from Supabase on login (cross-device sync)
      try {
        console.log('[SYNC] Fetching watch_status from Supabase for userId:', userId);
        const { data: wlData, error: wlError } = await supabase
          .from('watch_status')
          .select('*')
          .eq('user_id', userId);

        if (wlError) {
          console.error('[SYNC] watch_status fetch ERROR:', wlError);
        } else {
          console.log('[SYNC] watch_status fetched from Supabase:', wlData?.length, 'items', wlData);
        }

        if (wlData) {
          const supabaseItems: WatchStatus[] = wlData.map((w: any) => ({
            media_id: w.media_id,
            media_type: w.media_type as MediaType,
            status: w.status as WatchStatusType,
            title: w.title || 'Yapım',
            poster_path: w.poster_path || '',
            vote_average: w.vote_average || 0,
            updated_at: w.updated_at
          }));

          // Get local-only items that are NOT yet in Supabase, then push them up
          const localItems: WatchStatus[] = (() => {
            try {
              const saved = localStorage.getItem('diziapp_watch_list');
              return saved ? JSON.parse(saved) : [];
            } catch { return []; }
          })();

          console.log('[SYNC] localStorage items:', localItems.length);

          const localOnlyItems = localItems.filter(local =>
            !supabaseItems.some(s => s.media_id === local.media_id && s.media_type === local.media_type)
          );

          // Push local-only items to Supabase
          if (localOnlyItems.length > 0) {
            console.log('[SYNC] Pushing', localOnlyItems.length, 'local-only items to Supabase');
            const results = await Promise.allSettled(localOnlyItems.map(localItem =>
              supabase.from('watch_status').upsert({
                user_id: userId,
                media_id: localItem.media_id,
                media_type: localItem.media_type,
                status: localItem.status,
                title: localItem.title,
                poster_path: localItem.poster_path,
                vote_average: localItem.vote_average
              })
            ));
            results.forEach((r, i) => {
              if (r.status === 'rejected') console.error('[SYNC] Upsert failed for item', i, r.reason);
              else if ((r.value as any).error) console.error('[SYNC] Upsert error for item', i, (r.value as any).error);
            });
          }

          // Authoritative list = Supabase + local-only items not yet synced
          const authoritative = [...supabaseItems, ...localOnlyItems];
          console.log('[SYNC] Final authoritative list:', authoritative.length, 'items');

          setWatchList(authoritative);
          try {
            localStorage.setItem('diziapp_watch_list', JSON.stringify(authoritative));
          } catch {}
        }
      } catch (err) { console.error('[SYNC] watch_status fetch EXCEPTION:', err); }

      // 3. Episode Progress - Smart Merge
      try {
        const { data: epData } = await supabase
          .from('episode_progress')
          .select('*')
          .eq('user_id', userId);

        if (epData) {
          const supabaseEpItems: EpisodeProgress[] = epData.map((ep: any) => ({
            user_id: ep.user_id,
            show_id: ep.show_id,
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            is_watched: ep.is_watched
          }));

          setEpisodeProgress(prev => {
            const map = new Map<string, EpisodeProgress>();
            prev.forEach(item => map.set(`${item.show_id}-${item.season_number}-${item.episode_number}`, item));
            supabaseEpItems.forEach(item => map.set(`${item.show_id}-${item.season_number}-${item.episode_number}`, item));
            const merged = Array.from(map.values());

            try {
              localStorage.setItem('diziapp_episode_progress', JSON.stringify(merged));
            } catch {}

            return merged;
          });
        }
      } catch (err) { console.warn('episode_progress fetch error:', err); }

      // 4. Ratings & Reviews
      try {
        const { data: revData } = await supabase
          .from('ratings_reviews')
          .select('*, profiles(username, full_name, avatar_url)')
          .order('created_at', { ascending: false });

        if (revData) {
          setReviews(revData.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            username: r.profiles?.username || 'kullanıcı',
            user_fullname: r.profiles?.full_name || 'Kullanıcı',
            user_avatar: r.profiles?.avatar_url || '',
            media_id: r.media_id,
            media_type: r.media_type as MediaType,
            rating: r.rating,
            review_text: r.review_text,
            contains_spoiler: r.contains_spoiler,
            created_at: r.created_at,
            likes: r.likes || 0
          })));
        }
      } catch (err) { console.warn('ratings_reviews fetch error:', err); }

      // 5. Activity Feed
      try {
        const { data: actData } = await supabase
          .from('activity_feed')
          .select('*, profiles(username, full_name, avatar_url)')
          .order('created_at', { ascending: false });

        if (actData) {
          setActivityFeed(actData.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            username: a.profiles?.username || 'kullanıcı',
            user_avatar: a.profiles?.avatar_url || '',
            action_type: a.action_type as any,
            media_id: a.media_id,
            media_type: a.media_type as MediaType,
            media_title: a.details?.media_title || 'Yapım',
            poster_path: a.details?.media_poster || '',
            detail_text: a.details?.status || '',
            contains_spoiler: a.details?.contains_spoiler || false,
            created_at: a.created_at
          })));
        }
      } catch (err) { console.warn('activity_feed fetch error:', err); }

      // 6. Favorites
      try {
        const { data: favData } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', userId);

        if (favData) {
          setFavorites(favData.map((f: any) => ({
            media_id: f.media_id,
            media_type: f.media_type as MediaType,
            status: 'watched',
            title: f.title || 'Yapım',
            poster_path: f.poster_path || '',
            vote_average: f.vote_average || 0
          })));
        }
      } catch (err) { console.warn('favorites fetch error:', err); }

      // 7. Custom Collections
      try {
        const { data: collData } = await supabase
          .from('custom_collections')
          .select('*, collection_items(*)')
          .eq('user_id', userId);

        if (collData) {
          setCollections(collData.map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            title: c.name,
            description: c.description || '',
            color: 'from-blue-600 to-cyan-600',
            icon: 'Tv',
            created_at: c.created_at,
            items: (c.collection_items || []).map((ci: any) => ({
              media_id: ci.media_id,
              media_type: ci.media_type as MediaType,
              title: ci.title || 'Yapım',
              poster_path: ci.poster_path || '',
              added_at: c.created_at
            }))
          })));
        }
      } catch (err) { console.warn('custom_collections fetch error:', err); }

      // 8. Following
      try {
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);

        if (followData) {
          setFollowingUserIds(followData.map((f: any) => f.following_id));
        }
      } catch (err) { console.warn('follows fetch error:', err); }
    };

    fetchUserData();
  }, [session?.user?.id]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<TMDBMedia | null>(null);
  
  // Left Sidebar Filter States
  const [mediaFilter, setMediaFilter] = useState<'all' | 'tv' | 'movie'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watching' | 'plan_to_watch' | 'watched'>('all');

  // Dynamic Profile Navigation & Follow State
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem('cine_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch (e) {
      console.error(e);
    }

    if (isSupabaseConfigured) {
      return {
        id: '',
        username: 'kullanici',
        full_name: 'Kullanıcı',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        banner_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80',
        featured_media_title: 'Severance',
        bio: ''
      };
    }
    return CURRENT_USER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cine_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
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

  const [followingUserIds, setFollowingUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cine_following_user_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ['usr_friend_1', 'usr_friend_2', 'usr_friend_3'];
  });

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
      if (state && state.tab) {
        setActiveTab(state.tab);
        if (state.viewingUsername) {
          setViewingUsername(state.viewingUsername);
        }
      } else {
        const path = window.location.pathname;
        if (path.startsWith('/user/')) {
          const username = path.replace('/user/', '').trim();
          if (username) {
            setViewingUsername(username);
            setActiveTab('profile');
          }
        } else if (path === '/' || path === '') {
          setActiveTab('discover');
        } else {
          const cleanTab = path.replace('/', '').trim();
          if (cleanTab) setActiveTab(cleanTab);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedMedia, isDrawerOpen, isSettingsOpen]);

  const handleNavigateToProfile = (username: string) => {
    setViewingUsername(username);
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
    return INITIAL_COLLECTIONS;
  });

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Favorites State (saved in localStorage)
  const [favorites, setFavorites] = useState<WatchStatus[]>(() => {
    try {
      const stored = localStorage.getItem('tvtime_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [favSearchQuery, setFavSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('tvtime_favorites', JSON.stringify(favorites));
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
  };

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

  // Handle Search Input Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoadingMedia(true);
      try {
        const res = await search(searchQuery, mediaFilter);
        if (isMounted) {
          setSearchResults(res.results || []);
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
            item.media_id === media.id && item.media_type === type ? { ...item, status } : item
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
              vote_average: media.vote_average
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
                media_title: showItem?.title || 'Dizi',
                media_poster: showItem?.poster_path,
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
    epNums?: number[]
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

        // 3. Log activity
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
            contains_spoiler: newRev.contains_spoiler
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center text-[#E63946]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 flex flex-col font-sans selection:bg-[#E63946] selection:text-white overflow-x-hidden max-w-full">
      
      {/* 1. Header Component */}
      <Header
        user={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={loadingMedia}
        onSelectMedia={(m) => setSelectedMedia(m)}
        onOpenProfile={() => handleNavigateToProfile(currentUser.username)}
        onGoHome={() => {
          handleTabChange('tracker');
          try { window.history.pushState({}, '', '/'); } catch(e){}
        }}
        onLogout={async () => {
          localStorage.removeItem('cine_current_user');
          if (isSupabaseConfigured) {
            await supabase.auth.signOut();
          } else {
            alert('Yerel oturum kapatıldı. TV Time hesabınızdan güvenle çıkış yaptınız.');
            setCurrentUser(CURRENT_USER);
          }
        }}
        notificationCount={isSupabaseConfigured ? 0 : 3}
        mediaFilter={mediaFilter}
        setMediaFilter={handleSetMediaFilter}
        statusFilter={statusFilter}
        setStatusFilter={handleSetStatusFilter}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenStats={() => setShowRecapModal(true)}
        onOpenNotifications={() => handleTabChange('activity')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateWatchStatus={(m, st) => handleUpdateWatchStatus(m, st)}
        getUserWatchStatus={getUserWatchStatus}
      />

      {/* 2. Main Layout Container: Full-Width for Profile vs 3-Column Grid for Dashboard */}
      {activeTab === 'profile' ? (
        <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 sm:py-8 pb-20 md:pb-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`profile-${viewingUsername}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {(() => {
                const isOwnProfile = !viewingUsername || viewingUsername === currentUser.username || viewingUsername === 'me' || viewingUsername === 'yufus_m' || viewingUsername === 'yufusmutaf' || (session?.user && currentUser.id === session.user.id);
                const profileData = isOwnProfile 
                  ? {
                      profile: currentUser,
                      watchList,
                      episodeProgress,
                      reviews,
                      collections
                    }
                  : getMockProfileData(viewingUsername);

                return (
                  <ProfileView
                    user={profileData.profile}
                    watchList={profileData.watchList}
                    favorites={favorites}
                    episodeProgress={profileData.episodeProgress}
                    reviews={profileData.reviews}
                    onSelectTab={handleTabChange}
                    onSelectMediaById={handleSelectMediaById}
                    collections={profileData.collections}
                    onSelectCollection={setSelectedCollectionId}
                    currentUserId={currentUser.id}
                    currentUserProfile={currentUser}
                    currentUserWatchList={watchList}
                    isFollowing={followingUserIds.includes(profileData.profile.id)}
                    onToggleFollowUser={handleToggleFollowUser}
                    onUpdateProfile={handleUpdateProfile}
                  />
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 sm:py-8 pb-20 md:pb-8">
          
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Sol Sidebar (~240px - Hidden on mobile, handled by Spotify mobile header & bottom nav) */}
            <div className="hidden lg:block w-[240px] shrink-0 space-y-5">
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
                              ? `İzleniyor (${gridDisplayMedia.length})`
                              : statusFilter === 'plan_to_watch'
                              ? `İzlenecek (${gridDisplayMedia.length})`
                              : statusFilter === 'watched'
                              ? `Tamamlandı (${gridDisplayMedia.length})`
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
                            ? `İzleniyor (${filteredGridMedia.length})`
                            : statusFilter === 'plan_to_watch'
                            ? `İzlenecek (${filteredGridMedia.length})`
                            : statusFilter === 'watched'
                            ? `Tamamlandı (${filteredGridMedia.length})`
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
                <CalendarView
                  watchingList={watchList.filter(w => w.status === 'watching')}
                  episodeProgress={episodeProgress}
                  onToggleEpisode={handleToggleEpisode}
                  onSelectMedia={(m) => setSelectedMedia(m)}
                />
              ) : activeTab === 'activity' ? (
                <ActivityFeedView
                  activities={activityFeed}
                  onSelectMediaById={handleSelectMediaById}
                  onNavigateToProfile={handleNavigateToProfile}
                  followingUserIds={followingUserIds}
                  onToggleFollowUser={handleToggleFollowUser}
                />
              ) : activeTab === 'collections' ? (
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
              ) : null}
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Sağ Sidebar (~320px): 'Sosyal Akış' (Masaüstünde görünür, mobilde gizli) */}
            <div className="hidden lg:block w-[320px] shrink-0 space-y-4">
              <SocialFeedSidebar
                activities={activityFeed}
                onSelectMediaById={handleSelectMediaById}
                currentUser={currentUser}
                onNavigateToProfile={handleNavigateToProfile}
                onAddActivity={handlePostStatusUpdate}
              />
            </div>

          </div>

        </main>
      )}



      {/* Selected Media Detail Modal */}
      <AnimatePresence>
        {selectedMedia && (
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
        )}
      </AnimatePresence>

      {/* Monthly Recap / Stats Modal */}
      <MonthlyRecapModal
        isOpen={showRecapModal}
        onClose={() => setShowRecapModal(false)}
        user={currentUser}
        watchList={watchList}
        episodeProgress={episodeProgress}
        reviews={reviews}
        onSelectMediaById={handleSelectMediaById}
      />

      {/* Sol Panel (Sidebar Drawer) for Mobile (< 768px) - High z-index root render */}
      <MobileSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={currentUser}
        onOpenProfile={() => {
          handleNavigateToProfile(currentUser.username);
        }}
        onOpenStats={() => setShowRecapModal(true)}
        onOpenNotifications={() => handleTabChange('activity')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={() => alert('Oturum kapatıldı. TV Time hesabınızdan güvenle çıkış yaptınız.')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={currentUser}
      />

      {/* Mobile Bottom Navigation Bar (< 768px - Spotify Style) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

    </div>
  );
}
