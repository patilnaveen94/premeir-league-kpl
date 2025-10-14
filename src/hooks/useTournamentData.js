import { useState, useEffect, useCallback } from 'react';
import dataSync from '../services/dataSync';

// Global state for tournament data to ensure consistency
let globalTournamentData = {
  topPerformers: {
    topRunScorers: [],
    topWicketTakers: [],
    bestBatsmen: [],
    bestBowlers: []
  },
  standings: [],
  playerStats: [],
  matches: [],
  loading: true,
  error: null,
  lastUpdated: null
};

// Global subscribers for data updates
let subscribers = new Set();

// Notify all subscribers of data changes
const notifySubscribers = (newData) => {
  globalTournamentData = newData;
  subscribers.forEach(callback => callback(newData));
};

// Global refresh function
const globalRefreshData = async (forceSync = false) => {
  try {
    console.log('🔄 Global tournament data refresh starting...', { forceSync, subscriberCount: subscribers.size });
    
    // Notify loading state
    notifySubscribers({ ...globalTournamentData, loading: true, error: null });
    
    // Force complete data sync if requested
    if (forceSync) {
      console.log('🔄 Forcing complete data sync...');
      await dataSync.syncAllData();
    }
    
    // Add retry mechanism for data fetching
    let retryCount = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        const [topPerformers, standings, playerStats, matches] = await Promise.all([
          dataSync.getTopPerformers(),
          dataSync.getSyncedStandings(),
          dataSync.getSyncedPlayerStats(),
          dataSync.getSyncedMatches()
        ]);

        console.log('✅ Global tournament data refreshed successfully', {
          topPerformersCount: topPerformers?.topRunScorers?.length || 0,
          standingsCount: standings?.length || 0,
          playerStatsCount: playerStats?.length || 0,
          matchesCount: matches?.length || 0,
          retryAttempt: retryCount
        });

        const newData = {
          topPerformers: topPerformers || {
            topRunScorers: [],
            topWicketTakers: [],
            bestBatsmen: [],
            bestBowlers: []
          },
          standings: standings || [],
          playerStats: playerStats || [],
          matches: matches || [],
          loading: false,
          error: null,
          lastUpdated: new Date()
        };
        
        notifySubscribers(newData);
        return { success: true };
      } catch (fetchError) {
        lastError = fetchError;
        retryCount++;
        console.warn(`⚠️ Data fetch attempt ${retryCount} failed:`, fetchError.message);
        
        if (retryCount < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch data after retries');
  } catch (error) {
    console.error('❌ Error in global tournament data refresh:', error);
    const errorData = { ...globalTournamentData, loading: false, error: error.message };
    notifySubscribers(errorData);
    return { success: false, error: error.message };
  }
};

// Custom hook for consistent tournament data across all components
export const useTournamentData = (autoRefresh = true) => {
  const [data, setData] = useState(globalTournamentData);

  const refreshData = useCallback(async (forceSync = false) => {
    return await globalRefreshData(forceSync);
  }, []);

  useEffect(() => {
    // Subscribe to global data changes
    const unsubscribe = (newData) => {
      setData(newData);
    };
    
    subscribers.add(unsubscribe);
    
    // Initial data load if not already loaded
    if (globalTournamentData.loading && globalTournamentData.lastUpdated === null) {
      refreshData();
    } else {
      setData(globalTournamentData);
    }
    
    return () => {
      subscribers.delete(unsubscribe);
    };
  }, [refreshData]);

  // Auto-refresh every 60 seconds if enabled (reduced frequency for better performance)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Only auto-refresh if data is older than 30 seconds
      const now = new Date();
      const lastUpdate = globalTournamentData.lastUpdated;
      if (!lastUpdate || (now - lastUpdate) > 30000) {
        refreshData(false);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  return {
    ...data,
    refresh: refreshData,
    forceRefresh: () => refreshData(true)
  };
};

export default useTournamentData;

// Global refresh function for external use
export const triggerGlobalRefresh = (forceSync = true) => {
  console.log('🔄 Triggering global tournament data refresh from external call...', { forceSync });
  return globalRefreshData(forceSync);
};

// Force immediate refresh for all subscribers
export const forceRefreshAllComponents = () => {
  console.log('🔄 Force refreshing all components with current data...');
  notifySubscribers({ ...globalTournamentData, lastUpdated: new Date() });
};

// Get current global data without subscribing
export const getCurrentTournamentData = () => globalTournamentData;