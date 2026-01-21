import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class CorrectStatsService {
  async fixDuplicateStats() {
    try {
      console.log('🔧 Starting CORRECT stats fix...');
      
      // Clear existing stats
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      await Promise.all(statsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
      console.log(`✅ Cleared ${statsSnapshot.docs.length} player stat records`);
      
      // Get completed matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => 
        match.status === 'completed' && (match.battingStats || match.bowlingStats)
      );
      console.log(`📊 Found ${completedMatches.length} completed matches`);
      
      const playerStats = {};
      
      for (const match of completedMatches) {
        console.log(`Processing: ${match.team1} vs ${match.team2}`);
        const processedPlayers = new Set(); // Track players processed in this match
        
        // Process batting stats - only once per player per match
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (!player.playerId || player.playerId === 'extras' || processedPlayers.has(player.playerId)) continue;
                
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
                stats.runs += parseInt(player.runs) || 0;
                stats.balls += parseInt(player.balls) || 0;
                stats.fours += parseInt(player.fours) || 0;
                stats.sixes += parseInt(player.sixes) || 0;
                stats.innings += 1;
                stats.notOuts += player.isOut ? 0 : 1;
                stats.highestScore = Math.max(stats.highestScore, parseInt(player.runs) || 0);
                stats.matches += 1;
                
                processedPlayers.add(player.playerId);
                console.log(`  🏏 ${player.name}: ${player.runs} runs`);
              }
            }
          }
        }
        
        // Process bowling stats - for all players with bowling data
        if (match.bowlingStats) {
          for (const [teamName, teamBowling] of Object.entries(match.bowlingStats)) {
            if (Array.isArray(teamBowling)) {
              for (const player of teamBowling) {
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
                stats.wickets += parseInt(player.wickets) || 0;
                stats.bowlingRuns += parseInt(player.runs) || 0;
                stats.overs += parseFloat(player.overs) || 0;
                
                // Only increment matches if this player wasn't already processed in this match
                if (!processedPlayers.has(player.playerId)) {
                  stats.matches += 1;
                  processedPlayers.add(player.playerId);
                }
                
                console.log(`  🎳 ${player.name}: ${player.wickets} wickets, ${player.overs} overs`);
              }
            }
          }
        }
      }
      
      // Save final stats
      for (const [playerId, stats] of Object.entries(playerStats)) {
        // Calculate averages
        const dismissals = stats.innings - stats.notOuts;
        stats.average = dismissals > 0 ? (stats.runs / dismissals).toFixed(2) : stats.runs;
        stats.strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : 0;
        stats.economy = stats.overs > 0 ? (stats.bowlingRuns / stats.overs).toFixed(2) : 0;
        stats.bestBowling = stats.wickets > 0 ? `${stats.wickets}/${stats.bowlingRuns}` : '0/0';
        
        console.log(`✅ ${stats.name}: ${stats.matches} matches, ${stats.runs} runs`);
        await setDoc(doc(db, 'playerStats', stats.playerId), stats);
      }
      
      console.log(`✅ Saved ${Object.keys(playerStats).length} player records`);
      
      return {
        success: true,
        playersProcessed: Object.keys(playerStats).length,
        matchesProcessed: completedMatches.length
      };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new CorrectStatsService();