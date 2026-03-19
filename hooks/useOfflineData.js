import { useState, useEffect } from 'react';
import { 
  getCachedBooks, 
  cacheBooks, 
  isConnected, 
  queueOfflineAction,
  loadFromCache,
  saveToCache,
} from '../lib/offline';
import { supabase } from '../lib/supabase';

export const useOfflineData = (table, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const { query = '*', filters = {}, cacheKey = table } = options;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setIsOffline(false);
    
    try {
      const connected = await isConnected();
      
      if (connected) {
        // Fetch from network
        const { data: networkData, error: networkError } = await supabase
          .from(table)
          .select(query)
          .match(filters);

        if (networkError) throw networkError;

        setData(networkData || []);
        
        // Cache the data
        await saveToCache(cacheKey, networkData || []);
      } else {
        // Load from cache
        setIsOffline(true);
        const cachedData = await loadFromCache(cacheKey);
        setData(cachedData || []);
      }
    } catch (err) {
      setError(err.message);
      
      // Try to load from cache as fallback
      const cachedData = await loadFromCache(cacheKey);
      setData(cachedData || []);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchData();
  };

  const mutate = async (operation, data, options = {}) => {
    const connected = await isConnected();
    
    if (connected) {
      // Perform operation directly
      try {
        const result = await supabase
          .from(table)
          [operation](data);
        
        if (result.error) throw result.error;
        
        // Update local data
        if (options.onSuccess) {
          options.onSuccess(result.data);
        }
        
        // Refetch data
        if (options.refetch !== false) {
          await refetch();
        }
        
        return result;
      } catch (err) {
        if (options.onError) {
          options.onError(err);
        }
        throw err;
      }
    } else {
      // Queue for offline sync
      setIsOffline(true);
      await queueOfflineAction({
        type: operation.toUpperCase(),
        table,
        data,
        timestamp: Date.now(),
      });
      
      // Optimistically update local data
      if (options.optimisticUpdate) {
        setData(options.optimisticUpdate(data, table));
      }
      
      return { data: null, error: null };
    }
  };

  return {
    data,
    loading,
    error,
    isOffline,
    refetch,
    mutate,
  };
};