import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { normalizePlayerName } from '../utils/playerUtils';

class CareerStatsService {
  // Calculate career stats for all players across all seasons
  async calculateCareerStats() {
    try {
      console.log('🔄 Calculating career stats across all seasons...');
      
      // Fetch all player stats from all seasons
      const [statsSnapshot, playersSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'playerRegistrations'))
      ]);
      
      const allStats = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allPlayers = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Create phone to player mapping
      const phoneToPlayer = {};
      allPlayers.forEach(player => {
        if (player.phone) {
          phoneToPlayer[player.phone] = player;
        }
      });
      
      // Group stats by mobile number (primary) or player name (fallback)
      const careerStats = {};
      
      allStats.forEach(stat => {
        const originalName = stat.name;
        if (!originalName) return;
        
        // Try to find phone number from player registration first
        const playerReg = allPlayers.find(p => 
          normalizePlayerName(p.fullName) === normalizePlayerName(originalName) || 
          p.fullName === originalName
        );
        
        // Use phone number as primary key, fallback to normalized name
        const playerKey = playerReg?.phone || normalizePlayerName(originalName);
        if (!playerKey) return;
        
        if (!careerStats[playerKey]) {
          careerStats[playerKey] = {
            name: originalName,
            phone: playerReg?.phone || null,
            totalMatches: 0,
            totalRuns: 0,
            totalWickets: 0,
            totalBallsFaced: 0,
            totalBallsBowled: 0,
            totalRunsConceded: 0,
            highestScore: 0,
            bestBowling: '0/0',
            seasons: new Set(),
            lastUpdated: new Date()
          };
        }
        
        const career = careerStats[playerKey];
        
        // Aggregate stats
        career.totalMatches += stat.matches || 0;
        career.totalRuns += stat.runs || 0;
        career.totalWickets += stat.wickets || 0;
        career.totalBallsFaced += stat.balls || stat.ballsFaced || 0;
        career.totalBallsBowled += stat.ballsBowled || stat.oversBowled * 6 || 0;
        career.totalRunsConceded += stat.runsConceded || stat.runsGiven || 0;
        
        // Store economy directly if available
        if (stat.economy && parseFloat(stat.economy) > 0) {
          career.economyRate = stat.economy;
        }
        
        // Track highest score
        if ((stat.highestScore || 0) > career.highestScore) {
          career.highestScore = stat.highestScore || 0;
        }
        
        // Track best bowling (simplified - just take the one with most wickets)
        if (stat.bestBowling && stat.bestBowling !== '0/0') {
          const currentWickets = parseInt(career.bestBowling.split('/')[0]) || 0;
          const statWickets = parseInt(stat.bestBowling.split('/')[0]) || 0;
          if (statWickets > currentWickets) {
            career.bestBowling = stat.bestBowling;
          }
        }
        
        // Track seasons played
        if (stat.season) {
          career.seasons.add(stat.season);
        }
      });
      
      // Calculate derived stats
      Object.values(careerStats).forEach(career => {
        // Batting average
        career.battingAverage = career.totalMatches > 0 && career.totalRuns > 0 
          ? (career.totalRuns / career.totalMatches).toFixed(2)
          : '0.00';
        
        // Strike rate
        career.strikeRate = career.totalBallsFaced > 0 
          ? ((career.totalRuns / career.totalBallsFaced) * 100).toFixed(2)
          : '0.00';
        
        // Bowling average
        career.bowlingAverage = career.totalWickets > 0 
          ? (career.totalRunsConceded / career.totalWickets).toFixed(2)
          : '0.00';
        
        // Economy rate - use stored value or calculate
        if (career.economyRate) {
          career.economy = career.economyRate;
        } else if (career.totalBallsBowled > 0) {
          career.economy = ((career.totalRunsConceded / career.totalBallsBowled) * 6).toFixed(2);
        } else {
          career.economy = '0.00';
        }
        
        // Debug logging for bowlers
        if (career.totalWickets > 0) {
          console.log(`🏏 ${career.name}: Wickets=${career.totalWickets}, RunsConceded=${career.totalRunsConceded}, BallsBowled=${career.totalBallsBowled}, Economy=${career.economy}`);
        }
        
        // Convert seasons set to array
        career.seasonsPlayed = Array.from(career.seasons);
        delete career.seasons;
      });
      
      console.log(`✅ Career stats calculated for ${Object.keys(careerStats).length} players`);
      return careerStats;
      
    } catch (error) {
      console.error('❌ Error calculating career stats:', error);
      return {};
    }
  }
  
  // Get career stats for a specific player
  async getPlayerCareerStats(playerName) {
    const allCareerStats = await this.calculateCareerStats();
    return allCareerStats[playerName] || null;
  }
  
  // Get top performers across career
  async getCareerTopPerformers() {
    const careerStats = await this.calculateCareerStats();
    const players = Object.values(careerStats);
    
    return {
      topRunScorers: players
        .filter(p => p.totalRuns > 0)
        .sort((a, b) => b.totalRuns - a.totalRuns)
        .slice(0, 10),
      
      topWicketTakers: players
        .filter(p => p.totalWickets > 0)
        .sort((a, b) => b.totalWickets - a.totalWickets)
        .slice(0, 10),
      
      bestBatsmen: players
        .filter(p => p.totalMatches >= 3 && p.totalRuns > 0)
        .sort((a, b) => parseFloat(b.battingAverage) - parseFloat(a.battingAverage))
        .slice(0, 10),
      
      bestBowlers: players
        .filter(p => p.totalWickets >= 3)
        .sort((a, b) => parseFloat(a.bowlingAverage) - parseFloat(b.bowlingAverage))
        .slice(0, 10)
    };
  }
}

export default new CareerStatsService();