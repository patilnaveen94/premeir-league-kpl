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
    // This would fetch from your matches collection
    return [];
  }

  async getSyncedStandings() {
    try {
      console.log('DataSync: Getting synced standings...');
      const standings = await pointsTableService.getPointsTable();
      console.log('DataSync standings received:', standings);
      console.log('DataSync standings type:', typeof standings);
      console.log('DataSync standings length:', standings?.length);
      return standings;
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  }

  async getSyncedPlayerStats() {
    try {
      return await statsService.getAllPlayerStats();
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return [];
    }
  }

  async getTopPerformers() {
    try {
      return await statsService.getTopPerformers();
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
}

export default new DataSyncService();