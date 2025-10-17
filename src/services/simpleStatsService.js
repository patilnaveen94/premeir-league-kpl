import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class SimpleStatsService {
  // Clear all stats and recalculate from scratch
  async recalculateAllStats() {
    try {
      console.log('🔄 Starting fresh stats calculation...');
      
      // Step 1: Clear all existing stats
      await this.clearAllStats();
      
      // Step 2: Get all completed matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(match => match.status === 'completed' && (match.battingStats || match.bowlingStats));
      
      console.log(`📊 Found ${matches.length} completed matches to process`);
      
      // Step 3: Process each match once
      const playerStats = {};
      
      for (const match of matches) {
        console.log(`Processing: ${match.team1} vs ${match.team2}`);
        
        // Process batting stats
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (!player.playerId || player.playerId === 'extras') continue;
                
                if (!playerStats[player.playerId]) {
                  playerStats[player.playerId] = {
                    playerId: player.playerId,
                    name: player.name,
                    team: teamName,
                    matches: 0,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    innings: 0,
                    notOuts: 0,
                    highestScore: 0,
                    wickets: 0,
                    bowlingRuns: 0,
                    overs: 0
                  };
                }
                
                const stats = playerStats[player.playerId];
                stats.matches = Math.max(stats.matches, 1);
                stats.runs += parseInt(player.runs) || 0;
                stats.balls += parseInt(player.balls) || 0;
                stats.fours += parseInt(player.fours) || 0;
                stats.sixes += parseInt(player.sixes) || 0;
                stats.innings += 1;
                stats.notOuts += player.isOut ? 0 : 1;
                stats.highestScore = Math.max(stats.highestScore, parseInt(player.runs) || 0);
              }
            }
          }
        }
        
        // Process bowling stats
        if (match.bowlingStats) {
          for (const [teamName, teamBowling] of Object.entries(match.bowlingStats)) {
            if (Array.isArray(teamBowling)) {
              for (const player of teamBowling) {
                if (!player.playerId) continue;
                
                if (!playerStats[player.playerId]) {
                  playerStats[player.playerId] = {
                    playerId: player.playerId,
                    name: player.name,
                    team: teamName,
                    matches: 0,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    innings: 0,
                    notOuts: 0,
                    highestScore: 0,
                    wickets: 0,
                    bowlingRuns: 0,
                    overs: 0
                  };
                }
                
                const stats = playerStats[player.playerId];
                stats.matches = Math.max(stats.matches, 1);
                stats.wickets += parseInt(player.wickets) || 0;
                stats.bowlingRuns += parseInt(player.runs) || 0;
                stats.overs += parseFloat(player.overs) || 0;
              }
            }
          }
        }
      }
      
      // Step 4: Calculate derived stats and save
      for (const stats of Object.values(playerStats)) {
        // Calculate batting averages
        const dismissals = stats.innings - stats.notOuts;
        stats.average = dismissals > 0 ? (stats.runs / dismissals).toFixed(2) : stats.runs;
        stats.strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : 0;
        
        // Calculate bowling averages
        stats.economy = stats.overs > 0 ? (stats.bowlingRuns / stats.overs).toFixed(2) : 0;
        stats.bestBowling = stats.wickets > 0 ? `${stats.wickets}/${stats.bowlingRuns}` : '0/0';
        
        // Save to Firebase
        await setDoc(doc(db, 'playerStats', stats.playerId), stats);
      }
      
      console.log(`✅ Processed ${Object.keys(playerStats).length} players`);
      return { success: true, playersProcessed: Object.keys(playerStats).length };
      
    } catch (error) {
      console.error('❌ Error in stats calculation:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Clear all existing stats
  async clearAllStats() {
    try {
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      const processedSnapshot = await getDocs(collection(db, 'processedMatches'));
      
      await Promise.all([
        ...statsSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...processedSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ]);
      
      console.log('🗑️ Cleared all existing stats');
    } catch (error) {
      console.error('Error clearing stats:', error);
    }
  }
  
  // Get all player stats
  async getAllPlayerStats() {
    try {
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      return statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      return [];
    }
  }
  
  // Get top performers
  async getTopPerformers() {
    try {
      const allStats = await this.getAllPlayerStats();
      
      return {
        topRunScorers: allStats
          .filter(p => p.runs > 0)
          .sort((a, b) => b.runs - a.runs)
          .slice(0, 10),
        topWicketTakers: allStats
          .filter(p => p.wickets > 0)
          .sort((a, b) => b.wickets - a.wickets)
          .slice(0, 10),
        bestBatsmen: allStats
          .filter(p => p.innings >= 1)
          .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
          .slice(0, 10),
        bestBowlers: allStats
          .filter(p => p.overs >= 1)
          .sort((a, b) => parseFloat(a.economy) - parseFloat(b.economy))
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting top performers:', error);
      return { topRunScorers: [], topWicketTakers: [], bestBatsmen: [], bestBowlers: [] };
    }
  }
}

export default new SimpleStatsService();