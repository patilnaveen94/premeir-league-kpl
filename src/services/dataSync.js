import statsService from './statsService';
import pointsTableService from './pointsTableService';

class DataSyncService {
  // Sync all data when match is completed
  async syncMatchResult(matchData) {
    try {
      console.log('Syncing match result:', matchData.id);
      
      // Update player statistics
      const statsResult = await statsService.updatePlayerStats(matchData);
      if (!statsResult.success) {
        console.error('Failed to update player stats:', statsResult.error);
      }

      // Update points table
      const pointsResult = await pointsTableService.updatePointsTable(matchData);
      if (!pointsResult.success) {
        console.error('Failed to update points table:', pointsResult.error);
      }

      // Trigger global refresh after match sync
      try {
        const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
        await triggerGlobalRefresh(false);
        console.log('✅ Global refresh triggered after match sync');
      } catch (refreshError) {
        console.warn('⚠️ Could not trigger global refresh:', refreshError);
      }

      return {
        success: statsResult.success && pointsResult.success,
        statsUpdated: statsResult.success,
        pointsUpdated: pointsResult.success
      };
    } catch (error) {
      console.error('Error syncing match result:', error);
      return { success: false, error: error.message };
    }
  }

  // Get synchronized data for display
  async getSyncedMatches() {
    try {
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      
      const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
      const snapshot = await getDocs(matchesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  async getSyncedStandings() {
    try {
      console.log('DataSync: Getting synced standings...');
      const standings = await pointsTableService.getPointsTable();
      console.log('DataSync standings received:', standings?.length || 0, 'teams');
      return standings || [];
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  }

  async getSyncedPlayerStats() {
    try {
      const stats = await statsService.getAllPlayerStats();
      console.log('DataSync player stats received:', stats?.length || 0, 'players');
      return stats || [];
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return [];
    }
  }

  async getTopPerformers() {
    try {
      const performers = await statsService.getTopPerformers();
      console.log('DataSync top performers received:', {
        topRunScorers: performers?.topRunScorers?.length || 0,
        topWicketTakers: performers?.topWicketTakers?.length || 0,
        bestBatsmen: performers?.bestBatsmen?.length || 0,
        bestBowlers: performers?.bestBowlers?.length || 0
      });
      return performers || {
        topRunScorers: [],
        topWicketTakers: [],
        bestBatsmen: [],
        bestBowlers: []
      };
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return {
        topRunScorers: [],
        topWicketTakers: [],
        bestBatsmen: [],
        bestBowlers: []
      };
    }
  }

  // Initialize teams in points table
  async initializeTeams(teams) {
    try {
      for (const team of teams) {
        await pointsTableService.initializeTeam(team.name);
      }
      return { success: true };
    } catch (error) {
      console.error('Error initializing teams:', error);
      return { success: false, error: error.message };
    }
  }

  async syncTournamentData() {
    try {
      const standings = await this.getSyncedStandings();
      const stats = await this.getSyncedPlayerStats();
      const topPerformers = await this.getTopPerformers();
      
      // Trigger global refresh after tournament data sync
      try {
        const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
        await triggerGlobalRefresh(false);
        console.log('✅ Global refresh triggered after tournament data sync');
      } catch (refreshError) {
        console.warn('⚠️ Could not trigger global refresh:', refreshError);
      }
      
      return {
        success: true,
        data: {
          standings,
          stats,
          topPerformers
        }
      };
    } catch (error) {
      console.error('Error syncing tournament data:', error);
      return { success: false, error: error.message };
    }
  }

  // Force recalculation of all statistics from scratch
  async syncAllData() {
    try {
      console.log('🔄 Starting complete data sync...');
      
      // Clear processed matches first to ensure reprocessing
      await statsService.clearProcessedMatches();
      
      // Clear existing stats and recalculate from matches
      await statsService.recalculateAllStats();
      await pointsTableService.recalculatePointsTable();
      
      console.log('✅ Complete data sync finished');
      
      // Trigger global data refresh after sync
      try {
        const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
        await triggerGlobalRefresh(false); // Don't force sync again, just refresh data
        console.log('✅ Global refresh triggered successfully');
      } catch (refreshError) {
        console.warn('⚠️ Could not trigger global refresh:', refreshError);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error in complete data sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Force reprocess a specific match and update all related data
  async reprocessMatch(matchId) {
    try {
      console.log(`🔄 Reprocessing match: ${matchId}`);
      
      // Reprocess the match stats
      const statsResult = await statsService.reprocessMatch(matchId);
      if (!statsResult.success) {
        throw new Error(`Failed to reprocess match stats: ${statsResult.error}`);
      }
      
      // Recalculate points table
      await pointsTableService.recalculatePointsTable();
      
      // Trigger global refresh
      try {
        const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
        await triggerGlobalRefresh(false);
        console.log('✅ Global refresh triggered after match reprocessing');
      } catch (refreshError) {
        console.warn('⚠️ Could not trigger global refresh:', refreshError);
      }
      
      console.log(`✅ Match ${matchId} reprocessed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error reprocessing match ${matchId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Force refresh all cached data
  async refreshAllData() {
    try {
      console.log('🔄 Refreshing all cached data...');
      
      // Get fresh data from all services
      const [standings, stats, topPerformers, matches] = await Promise.all([
        this.getSyncedStandings(),
        this.getSyncedPlayerStats(),
        this.getTopPerformers(),
        this.getSyncedMatches()
      ]);
      
      console.log('✅ All data refreshed successfully');
      
      // Trigger global refresh to update all components
      try {
        const { triggerGlobalRefresh } = await import('../hooks/useTournamentData');
        await triggerGlobalRefresh(false);
        console.log('✅ Global refresh triggered after data refresh');
      } catch (refreshError) {
        console.warn('⚠️ Could not trigger global refresh:', refreshError);
      }
      
      return {
        success: true,
        data: { standings, stats, topPerformers, matches }
      };
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DataSyncService();