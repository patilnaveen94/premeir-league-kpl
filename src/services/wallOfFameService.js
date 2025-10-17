import careerStatsService from './careerStatsService';

class WallOfFameService {
  // Get Wall of Fame data with best batsmen, bowlers, and all-rounder
  async getWallOfFameData() {
    try {
      const careerStats = await careerStatsService.calculateCareerStats();
      const players = Object.values(careerStats);
      
      // Filter qualified players (minimum 1 match to show data)
      const qualifiedPlayers = players.filter(p => p.totalMatches >= 1);
      
      console.log('🏆 Wall of Fame Debug:', {
        totalPlayers: players.length,
        qualifiedPlayers: qualifiedPlayers.length,
        playersWithRuns: players.filter(p => p.totalRuns > 0).length,
        playersWithWickets: players.filter(p => p.totalWickets > 0).length
      });
      
      // Get top 3 batsmen (by total runs and average)
      const topBatsmen = qualifiedPlayers
        .filter(p => p.totalRuns > 0)
        .sort((a, b) => {
          // Primary: Total runs, Secondary: Batting average
          const aScore = (b.totalRuns * 0.7) + (parseFloat(b.battingAverage) * 0.3);
          const bScore = (a.totalRuns * 0.7) + (parseFloat(a.battingAverage) * 0.3);
          return aScore - bScore;
        })
        .slice(0, 3);
      
      // Get top 3 bowlers (by wickets and economy)
      const topBowlers = qualifiedPlayers
        .filter(p => p.totalWickets > 0)
        .sort((a, b) => {
          // Primary: Total wickets, Secondary: Economy rate (lower is better)
          const aScore = (b.totalWickets * 0.8) - (parseFloat(b.economy) * 0.2);
          const bScore = (a.totalWickets * 0.8) - (parseFloat(a.economy) * 0.2);
          return aScore - bScore;
        })
        .slice(0, 3);
      
      // Get best all-rounder (balanced runs and wickets)
      const allRounders = qualifiedPlayers
        .filter(p => p.totalRuns > 5 && p.totalWickets > 0) // Lower minimum for early tournament
        .map(p => ({
          ...p,
          allRounderScore: (p.totalRuns * 0.5) + (p.totalWickets * 10 * 0.5) // Balanced scoring
        }))
        .sort((a, b) => b.allRounderScore - a.allRounderScore);
      
      const bestAllRounder = allRounders[0] || null;
      
      return {
        topBatsmen,
        topBowlers,
        bestAllRounder,
        totalPlayers: players.length,
        qualifiedPlayers: qualifiedPlayers.length
      };
      
    } catch (error) {
      console.error('❌ Error getting Wall of Fame data:', error);
      return {
        topBatsmen: [],
        topBowlers: [],
        bestAllRounder: null,
        totalPlayers: 0,
        qualifiedPlayers: 0
      };
    }
  }
}

export default new WallOfFameService();