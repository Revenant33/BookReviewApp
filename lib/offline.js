import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';

// Cache keys
const CACHE_KEYS = {
  BOOKS: 'cached_books',
  REVIEWS: 'cached_reviews',
  USER_DATA: 'cached_user_data',
  FAVORITES: 'cached_favorites',
  LAST_SYNC: 'last_sync_timestamp',
};

// Check network connectivity
export const isConnected = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected;
};

// Save data to cache
export const saveToCache = async (key, data) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Load data from cache
export const loadFromCache = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

// Cache books
export const cacheBooks = async (books) => {
  await saveToCache(CACHE_KEYS.BOOKS, books);
};

// Get cached books
export const getCachedBooks = async () => {
  return await loadFromCache(CACHE_KEYS.BOOKS);
};

// Cache user data
export const cacheUserData = async (userData) => {
  await saveToCache(CACHE_KEYS.USER_DATA, userData);
};

// Get cached user data
export const getCachedUserData = async () => {
  return await loadFromCache(CACHE_KEYS.USER_DATA);
};

// Sync offline data when back online
export const syncOfflineData = async () => {
  try {
    const isOnline = await isConnected();
    if (!isOnline) return;

    // Get offline actions (you'll need to implement this)
    const offlineActions = await loadFromCache('offline_actions') || [];
    
    for (const action of offlineActions) {
      try {
        switch (action.type) {
          case 'ADD_REVIEW':
            await supabase.from('reviews').insert(action.data);
            break;
          case 'TOGGLE_FAVORITE':
            if (action.data.isFavorite) {
              await supabase.from('favorites').insert(action.data);
            } else {
              await supabase.from('favorites')
                .delete()
                .eq('user_id', action.data.user_id)
                .eq('book_id', action.data.book_id);
            }
            break;
          case 'ADD_BOOK':
            await supabase.from('books').insert(action.data);
            break;
          // Add more action types as needed
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }

    // Clear synced actions
    await AsyncStorage.removeItem('offline_actions');
    
    // Refresh cache
    await refreshCache();
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
};

// Queue offline action
export const queueOfflineAction = async (action) => {
  try {
    const offlineActions = await loadFromCache('offline_actions') || [];
    offlineActions.push({
      ...action,
      timestamp: Date.now(),
    });
    await saveToCache('offline_actions', offlineActions);
  } catch (error) {
    console.error('Error queuing offline action:', error);
  }
};

// Refresh all cached data
export const refreshCache = async () => {
  try {
    const isOnline = await isConnected();
    if (!isOnline) return;

    // Fetch and cache books
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .limit(50);
    await cacheBooks(books);

    // Cache user-specific data if logged in
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const [favorites, reviews] = await Promise.all([
        supabase.from('favorites').select('*').eq('user_id', userData.user.id),
        supabase.from('reviews').select('*').eq('user_id', userData.user.id).limit(20),
      ]);
      
      await saveToCache(CACHE_KEYS.FAVORITES, favorites.data);
      await saveToCache(CACHE_KEYS.REVIEWS, reviews.data);
      await cacheUserData(userData);
    }
  } catch (error) {
    console.error('Error refreshing cache:', error);
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Get last sync time
export const getLastSyncTime = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

// Check if cache is stale (older than 1 hour)
export const isCacheStale = async () => {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;
  
  const oneHour = 60 * 60 * 1000;
  return Date.now() - lastSync > oneHour;
};