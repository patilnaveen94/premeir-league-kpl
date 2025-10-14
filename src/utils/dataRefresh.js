import dataSync from '../services/dataSync';

/**
 * Comprehensive data refresh utility
 * Ensures all tournament data is synchronized and updated across all components
 */
class DataRefreshManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshQueue = [];
  }

  /**
   * Trigger a complete data refresh with proper sequencing
   * @param {boolean} forceSync - Whether to force a complete data sync
   * @param {string} source - Source of the refresh request for logging
   */
  async triggerCompleteRefresh(forceSync = true, source = 'unknown') {
    if (this.isRefreshing) {
      console.log(`🔄 Data refresh already in progress, queuing request from ${source}`);
      return new Promise((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;
    console.log(`🔄 Starting complete data refresh from ${source}...`);

    try {
      // Step 1: Sync all data if requested
      if (forceSync) {
        console.log('📊 Syncing all tournament data...');
        await dataSync.syncAllData();
      }

      // Step 2: Trigger global refresh
      console.log('🌐 Triggering global component refresh...');
      const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
      await triggerGlobalRefresh(false); // Don't sync again, just refresh

      // Step 3: Force component updates
      console.log('🔄 Forcing component updates...');
      const { forceRefreshAllComponents } = await import('../hooks/useTournamentData');
      forceRefreshAllComponents();

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
   * Refresh after match operations (create, update, delete)
   * @param {string} operation - The operation performed
   * @param {string} matchInfo - Information about the match
   */
  async refreshAfterMatchOperation(operation, matchInfo = '') {
    const source = `match-${operation}${matchInfo ? `: ${matchInfo}` : ''}`;
    return await this.triggerCompleteRefresh(true, source);
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