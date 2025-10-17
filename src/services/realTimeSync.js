import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import statsService from './statsService';
import pointsTableService from './pointsTableService';

class RealTimeSync {
  constructor() {
    this.matchListeners = new Map();
    this.lastProcessedKeys = new Map();
    this.isInitialized = false;
  }

  // Initialize real-time listeners for all matches
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing real-time sync system...');
    
    // Listen to matches collection for any changes
    const matchesRef = collection(db, 'matches');
    this.matchesListener = onSnapshot(matchesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const matchData = { id: change.doc.id, ...change.doc.data() };
          this.handleMatchUpdate(matchData);
        } else if (change.type === 'removed') {
          console.log('🗑️ Match deleted, triggering full recalculation...');
          this.handleMatchDeletion(change.doc.id);
        }
      });
    });
    
    this.isInitialized = true;
    console.log('✅ Real-time sync system initialized');
  }

  // Handle match deletion - recalculate everything
  async handleMatchDeletion(deletedMatchId) {
    try {
      console.log(`🗑️ Auto-sync: Match deleted - ${deletedMatchId}`);
      console.log('🔄 Auto-sync: Starting full recalculation...');
      
      // Force recalculate all player stats from scratch
      await statsService.recalculateAllStats();
      
      // Force recalculate points table from scratch
      await pointsTableService.recalculateFromScratch();
      
      console.log('✅ Auto-sync: Full recalculation completed after deletion');
      
      // Notify UI to refresh
      this.notifyUIRefresh({ type: 'deletion', matchId: deletedMatchId });
      
    } catch (error) {
      console.error('❌ Auto-sync deletion error:', error);
    }
  }

  // Handle match updates automatically
  async handleMatchUpdate(matchData) {
    try {
      console.log(`🔄 Auto-sync: Match updated - ${matchData.team1} vs ${matchData.team2}`);
      
      // Only process completed matches with stats
      if (matchData.status !== 'completed' || (!matchData.battingStats && !matchData.bowlingStats)) {
        console.log('⏭️ Auto-sync: Skipping - match not completed or no stats');
        return;
      }

      // Enhanced duplicate prevention - check if already processed recently
      const processKey = `${matchData.id}_${matchData.updatedAt?.getTime?.() || Date.now()}`;
      const lastProcessedKey = this.lastProcessedKeys?.get(matchData.id);
      
      if (lastProcessedKey === processKey) {
        console.log('⏭️ Auto-sync: Skipping - already processed this exact update');
        return;
      }

      // Check if this is a recent update (within last 10 minutes)
      const lastUpdate = matchData.updatedAt?.toDate?.() || new Date(0);
      const now = new Date();
      const timeDiff = (now - lastUpdate) / (1000 * 60); // minutes
      
      if (timeDiff > 10) {
        console.log('⏭️ Auto-sync: Skipping - update too old');
        return;
      }

      console.log('🚀 Auto-sync: Processing real-time update...');
      
      // Store process key to prevent duplicates
      if (!this.lastProcessedKeys) this.lastProcessedKeys = new Map();
      this.lastProcessedKeys.set(matchData.id, processKey);
      
      // Update player stats immediately with force reprocess
      await statsService.updatePlayerStats(matchData, true);
      
      // Update points table immediately (only for knockout matches)
      if (!matchData.matchType || matchData.matchType === 'knockout') {
        await pointsTableService.updatePointsTable({
          team1: matchData.team1,
          team2: matchData.team2,
          team1Score: matchData.team1Score,
          team2Score: matchData.team2Score,
          status: 'completed',
          matchType: matchData.matchType || 'knockout'
        });
      }
      
      console.log('✅ Auto-sync: Real-time update completed successfully');
      
      // Notify UI components to refresh (if needed)
      this.notifyUIRefresh(matchData);
      
    } catch (error) {
      console.error('❌ Auto-sync error:', error);
    }
  }

  // Notify UI components to refresh data
  notifyUIRefresh(matchData) {
    // Dispatch custom event for UI components to listen to
    const event = new CustomEvent('cricketDataUpdated', {
      detail: {
        type: 'match_completed',
        matchId: matchData.id,
        teams: [matchData.team1, matchData.team2],
        timestamp: new Date()
      }
    });
    window.dispatchEvent(event);
  }

  // Clean up listeners
  cleanup() {
    if (this.matchesListener) {
      this.matchesListener();
      this.matchesListener = null;
    }
    
    this.matchListeners.forEach(unsubscribe => unsubscribe());
    this.matchListeners.clear();
    this.lastProcessedKeys.clear();
    
    this.isInitialized = false;
    console.log('🧹 Real-time sync cleanup completed');
  }

  // Force sync all data (for manual triggers)
  async forceSyncAll() {
    try {
      console.log('🔄 Force sync: Starting comprehensive sync...');
      const result = await statsService.comprehensiveDataSync();
      console.log('✅ Force sync completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Force sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Fix duplicate data issues
  async fixDuplicateData() {
    try {
      console.log('🔧 Fixing duplicate data issues...');
      
      // Clear all processed match tracking
      await statsService.clearProcessedMatches();
      
      // Clear process keys cache
      this.lastProcessedKeys.clear();
      
      // Force complete recalculation
      const result = await statsService.comprehensiveDataSync();
      
      console.log('✅ Duplicate data fix completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fixing duplicate data:', error);
      return { success: false, error: error.message };
    }
  }
}

const realTimeSync = new RealTimeSync();

// Global function to fix duplicate data
window.fixDuplicateData = () => realTimeSync.fixDuplicateData();

export default realTimeSync;