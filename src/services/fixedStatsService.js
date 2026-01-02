import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class FixedStatsService {
  async fixDuplicateStats() {
    try {
      console.log('🔧 Starting FIXED duplicate stats fix...');
      
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
      
      // Step 3: Track player performance per match (avoid duplicates)
      const playerStats = {};
      const playerMatchParticipation = {}; // Track which matches each player participated in
      
      for (const match of completedMatches) {
        console.log(`Processing: ${match.team1} vs ${match.team2} (${match.id})`);
        
        // Process batting stats
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (!player.playerId || player.playerId === 'extras') continue;
                
                // Initialize player if not exists
                if (!playerStats[player.playerId]) {
                  playerStats[player.playerId] = {
                    playerId: player.playerId,
                    name: player.name,
                    team: teamName,
                    matches: new Set(), // Use Set to track unique matches
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    innings: 0,
                    notOuts: 0,
                    highestScore: 0,
                    wickets: 0,
                    bowlingRuns: 0,
                    overs: 0,
                    battingMatches: new Set(), // Track batting participation
                    bowlingMatches: new Set()  // Track bowling participation
                  };
                  playerMatchParticipation[player.playerId] = new Set();
                }
                
                const stats = playerStats[player.playerId];
                
                // Only add batting stats if this player hasn't been processed for batting in this match
                if (!stats.battingMatches.has(match.id)) {
                  stats.runs += parseInt(player.runs) || 0;
                  stats.balls += parseInt(player.balls) || 0;
                  stats.fours += parseInt(player.fours) || 0;
                  stats.sixes += parseInt(player.sixes) || 0;
                  stats.innings += 1; // Count innings only once per match
                  stats.notOuts += player.isOut ? 0 : 1;
                  stats.highestScore = Math.max(stats.highestScore, parseInt(player.runs) || 0);
                  
                  // Mark this match as processed for batting
                  stats.battingMatches.add(match.id);
                  stats.matches.add(match.id);
                  playerMatchParticipation[player.playerId].add(match.id);
                  
                  console.log(`  🏏 ${player.name}: +${player.runs} runs (Total: ${stats.runs})`);
                } else {
                  console.log(`  ⚠️ ${player.name}: Duplicate batting entry in match ${match.id} - SKIPPED`);
                }
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
                
                // Initialize player if not exists
                if (!playerStats[player.playerId]) {
                  playerStats[player.playerId] = {
                    playerId: player.playerId,
                    name: player.name,
                    team: teamName,
                    matches: new Set(),
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    innings: 0,
                    notOuts: 0,
                    highestScore: 0,
                    wickets: 0,
                    bowlingRuns: 0,
                    overs: 0,
                    battingMatches: new Set(),
                    bowlingMatches: new Set()
                  };
                  playerMatchParticipation[player.playerId] = new Set();
                }
                
                const stats = playerStats[player.playerId];
                
                // Only add bowling stats if this player hasn't been processed for bowling in this match
                if (!stats.bowlingMatches.has(match.id)) {
                  stats.wickets += parseInt(player.wickets) || 0;
                  stats.bowlingRuns += parseInt(player.runs) || 0;
                  stats.overs += parseFloat(player.overs) || 0;
                  
                  // Mark this match as processed for bowling
                  stats.bowlingMatches.add(match.id);
                  stats.matches.add(match.id);
                  playerMatchParticipation[player.playerId].add(match.id);
                  
                  console.log(`  🎳 ${player.name}: +${player.wickets} wickets, +${player.runs} runs conceded`);
                } else {
                  console.log(`  ⚠️ ${player.name}: Duplicate bowling entry in match ${match.id} - SKIPPED`);
                }
              }
            }
          }
        }
      }
      
      // Step 4: Convert Sets to numbers and calculate derived stats
      console.log('💾 Saving corrected player stats...');
      const finalStats = {};
      
      for (const [playerId, stats] of Object.entries(playerStats)) {
        // Convert Sets to actual counts
        const finalPlayerStats = {
          playerId: stats.playerId,
          name: stats.name,
          team: stats.team,
          matches: stats.matches.size, // Unique matches count
          runs: stats.runs,
          balls: stats.balls,
          fours: stats.fours,
          sixes: stats.sixes,
          innings: stats.innings,
          notOuts: stats.notOuts,
          highestScore: stats.highestScore,
          wickets: stats.wickets,
          bowlingRuns: stats.bowlingRuns,
          overs: stats.overs
        };
        
        // Calculate batting averages
        const dismissals = finalPlayerStats.innings - finalPlayerStats.notOuts;
        finalPlayerStats.average = dismissals > 0 ? (finalPlayerStats.runs / dismissals).toFixed(2) : finalPlayerStats.runs;
        finalPlayerStats.strikeRate = finalPlayerStats.balls > 0 ? ((finalPlayerStats.runs / finalPlayerStats.balls) * 100).toFixed(2) : 0;
        
        // Calculate bowling averages
        finalPlayerStats.economy = finalPlayerStats.overs > 0 ? (finalPlayerStats.bowlingRuns / finalPlayerStats.overs).toFixed(2) : 0;
        finalPlayerStats.bestBowling = finalPlayerStats.wickets > 0 ? `${finalPlayerStats.wickets}/${finalPlayerStats.bowlingRuns}` : '0/0';
        
        // Log for debugging
        console.log(`✅ ${finalPlayerStats.name}: ${finalPlayerStats.matches} matches, ${finalPlayerStats.runs} runs, ${finalPlayerStats.innings} innings`);
        
        // Save to Firebase
        await setDoc(doc(db, 'playerStats', finalPlayerStats.playerId), finalPlayerStats);
        finalStats[playerId] = finalPlayerStats;
      }
      
      console.log(`✅ Fixed and saved ${Object.keys(finalStats).length} player records`);
      
      return {
        success: true,
        playersProcessed: Object.keys(finalStats).length,
        matchesProcessed: completedMatches.length,
        playerMatchCounts: Object.fromEntries(
          Object.entries(playerMatchParticipation).map(([id, matches]) => [id, matches.size])
        )
      };
      
    } catch (error) {
      console.error('❌ Error fixing duplicate stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FixedStatsService();