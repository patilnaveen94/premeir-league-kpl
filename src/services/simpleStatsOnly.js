import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class SimpleStatsOnly {
  // Clear all stats and recalculate from matches only
  async fixDuplicateStats() {
    try {
      console.log('🔧 Starting simple duplicate stats fix...');
      
      // Step 1: Clear all existing stats
      console.log('🗑️ Clearing all player stats...');
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      await Promise.all(statsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
      console.log(`✅ Cleared ${statsSnapshot.docs.length} player stat records`);
      
      // Step 2: Get all completed matches
      console.log('📊 Fetching completed matches...');
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => 
        match.status === 'completed' && 
        (match.battingStats || match.bowlingStats)
      );
      console.log(`📊 Found ${completedMatches.length} completed matches`);
      
      // Step 3: Count matches per player to track duplicates
      const playerMatchCount = {};
      const playerStats = {};
      
      for (const match of completedMatches) {
        console.log(`Processing: ${match.team1} vs ${match.team2}`);
        
        // Process batting stats
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (!player.playerId || player.playerId === 'extras') continue;
                
                // Track matches per player
                if (!playerMatchCount[player.playerId]) {
                  playerMatchCount[player.playerId] = new Set();
                }
                playerMatchCount[player.playerId].add(match.id);
                
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
                
                // Track matches per player
                if (!playerMatchCount[player.playerId]) {
                  playerMatchCount[player.playerId] = new Set();
                }
                playerMatchCount[player.playerId].add(match.id);
                
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
              }
            }
          }
        }
      }
      
      // Step 4: Set correct match count and calculate derived stats
      console.log('💾 Saving corrected player stats...');
      for (const [playerId, stats] of Object.entries(playerStats)) {
        // Set correct match count
        stats.matches = playerMatchCount[playerId]?.size || 0;
        
        // Calculate batting averages
        const dismissals = stats.innings - stats.notOuts;
        stats.average = dismissals > 0 ? (stats.runs / dismissals).toFixed(2) : stats.runs;
        stats.strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : 0;
        
        // Calculate bowling averages
        stats.economy = stats.overs > 0 ? (stats.bowlingRuns / stats.overs).toFixed(2) : 0;
        stats.bestBowling = stats.wickets > 0 ? `${stats.wickets}/${stats.bowlingRuns}` : '0/0';
        
        // Log player with match count for debugging
        console.log(`Player: ${stats.name} - Matches: ${stats.matches}, Runs: ${stats.runs}, Innings: ${stats.innings}`);
        
        // Save to Firebase
        await setDoc(doc(db, 'playerStats', stats.playerId), stats);
      }
      
      console.log(`✅ Fixed and saved ${Object.keys(playerStats).length} player records`);
      
      return {
        success: true,
        playersProcessed: Object.keys(playerStats).length,
        matchesProcessed: completedMatches.length,
        playerMatchCounts: Object.fromEntries(
          Object.entries(playerMatchCount).map(([id, matches]) => [id, matches.size])
        )
      };
      
    } catch (error) {
      console.error('❌ Error fixing duplicate stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SimpleStatsOnly();