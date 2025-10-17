import dataSync from '../services/dataSync';

/**
 * Comprehensive data refresh utility
 * Ensures all tournament data is synchronized and updated across all components
 */
class DataRefreshManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshQueue = [];
    this.lastRefreshTime = 0;
    this.debounceTimeout = null;
    this.DEBOUNCE_DELAY = 2000; // 2 seconds debounce
    this.MIN_REFRESH_INTERVAL = 5000; // Minimum 5 seconds between refreshes
  }

  /**
   * Trigger a complete data refresh with proper sequencing and debouncing
   * @param {boolean} forceSync - Whether to force a complete data sync
   * @param {string} source - Source of the refresh request for logging
   */
  async triggerCompleteRefresh(forceSync = true, source = 'unknown') {
    // Check if we need to debounce this request
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    
    if (timeSinceLastRefresh < this.MIN_REFRESH_INTERVAL && !forceSync) {
      console.log(`⏳ Debouncing refresh request from ${source} (${timeSinceLastRefresh}ms since last refresh)`);
      return this.debounceRefresh(forceSync, source);
    }
    
    if (this.isRefreshing) {
      console.log(`🔄 Data refresh already in progress, queuing request from ${source}`);
      return new Promise((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;
    this.lastRefreshTime = now;
    console.log(`🔄 Starting complete data refresh from ${source}...`);

    try {
      // Step 1: Sync all data if requested
      if (forceSync) {
        console.log('📊 Syncing all tournament data...');
        await dataSync.syncAllData();
      }

      // Step 2: Trigger global refresh (single call, no double refresh)
      console.log('🌐 Triggering global component refresh...');
      const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
      await triggerGlobalRefresh(false); // Don't sync again, just refresh

      console.log(`✅ Complete data refresh finished from ${source}`);

      // Process queued requests
      const queuedRequests = [...this.refreshQueue];
      this.refreshQueue = [];
      queuedRequests.forEach(resolve => resolve());

      return { success: true };
    } catch (error) {
      console.error(`❌ Error in complete data refresh from ${source}:`, error);
      
      // Process queued requests even on error
      const queuedRequests = [...this.refreshQueue];
      this.refreshQueue = [];
      queuedRequests.forEach(resolve => resolve());

      return { success: false, error: error.message };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Quick refresh without full sync - just updates components with latest data
   * @param {string} source - Source of the refresh request for logging
   */
  async triggerQuickRefresh(source = 'unknown') {
    console.log(`⚡ Quick refresh triggered from ${source}`);
    
    try {
      const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
      await triggerGlobalRefresh(false);
      
      console.log(`✅ Quick refresh completed from ${source}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error in quick refresh from ${source}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Debounced refresh to prevent multiple rapid calls
   */
  debounceRefresh(forceSync, source) {
    return new Promise((resolve) => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(async () => {
        console.log(`⚡ Executing debounced refresh from ${source}`);
        const result = await this.triggerCompleteRefresh(forceSync, `debounced-${source}`);
        resolve(result);
      }, this.DEBOUNCE_DELAY);
    });
  }

  /**
   * Refresh after match operations (create, update, delete) - with debouncing
   * @param {string} operation - The operation performed
   * @param {string} matchInfo - Information about the match
   */
  async refreshAfterMatchOperation(operation, matchInfo = '') {
    const source = `match-${operation}${matchInfo ? `: ${matchInfo}` : ''}`;
    // Use debounced refresh for match operations to prevent spam
    return await this.triggerCompleteRefresh(false, source);
  }

  /**
   * Refresh after team operations (create, update, delete)
   * @param {string} operation - The operation performed
   * @param {string} teamInfo - Information about the team
   */
  async refreshAfterTeamOperation(operation, teamInfo = '') {
    const source = `team-${operation}${teamInfo ? `: ${teamInfo}` : ''}`;
    return await this.triggerCompleteRefresh(true, source);
  }

  /**
   * Refresh after player operations (approve, reject, assign)
   * @param {string} operation - The operation performed
   * @param {string} playerInfo - Information about the player
   */
  async refreshAfterPlayerOperation(operation, playerInfo = '') {
    const source = `player-${operation}${playerInfo ? `: ${playerInfo}` : ''}`;
    return await this.triggerQuickRefresh(source);
  }

  /**
   * Check if a refresh is currently in progress
   */
  isRefreshInProgress() {
    return this.isRefreshing;
  }

  /**
   * Get the number of queued refresh requests
   */
  getQueueLength() {
    return this.refreshQueue.length;
  }

  /**
   * Clear any pending debounced refreshes
   */
  clearPendingRefreshes() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}

// Export singleton instance
const dataRefreshManager = new DataRefreshManager();
export default dataRefreshManager;

// Export convenience functions
export const refreshAfterMatchOperation = (operation, matchInfo) => 
  dataRefreshManager.refreshAfterMatchOperation(operation, matchInfo);

export const refreshAfterTeamOperation = (operation, teamInfo) => 
  dataRefreshManager.refreshAfterTeamOperation(operation, teamInfo);

export const refreshAfterPlayerOperation = (operation, playerInfo) => 
  dataRefreshManager.refreshAfterPlayerOperation(operation, playerInfo);

export const triggerCompleteRefresh = (forceSync, source) => 
  dataRefreshManager.triggerCompleteRefresh(forceSync, source);

export const triggerQuickRefresh = (source) => 
  dataRefreshManager.triggerQuickRefresh(source);