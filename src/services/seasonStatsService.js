import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class SeasonStatsService {
  async fixDuplicateStats() {
    try {
      console.log('🔧 Starting season-aware stats fix...');
      
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
      const currentSeason = new Date().getFullYear().toString();
      
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
                    season: currentSeason,
                    // Career stats
                    careerMatches: new Set(),
                    careerRuns: 0,
                    careerBalls: 0,
                    careerFours: 0,
                    careerSixes: 0,
                    careerInnings: 0,
                    careerNotOuts: 0,
                    careerHighestScore: 0,
                    careerWickets: 0,
                    careerBowlingRuns: 0,
                    careerOvers: 0,
                    // Current season stats
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
                }
                
                const stats = playerStats[player.playerId];
                
                // Only add batting stats if this player hasn't been processed for batting in this match
                if (!stats.battingMatches.has(match.id)) {
                  const runs = parseInt(player.runs) || 0;
                  const balls = parseInt(player.balls) || 0;
                  const fours = parseInt(player.fours) || 0;
                  const sixes = parseInt(player.sixes) || 0;
                  
                  // Career stats (all matches)
                  stats.careerRuns += runs;
                  stats.careerBalls += balls;
                  stats.careerFours += fours;
                  stats.careerSixes += sixes;
                  stats.careerInnings += 1;
                  stats.careerNotOuts += player.isOut ? 0 : 1;
                  stats.careerHighestScore = Math.max(stats.careerHighestScore, runs);
                  stats.careerMatches.add(match.id);
                  
                  // Current season stats (same as career for now)
                  stats.runs += runs;
                  stats.balls += balls;
                  stats.fours += fours;
                  stats.sixes += sixes;
                  stats.innings += 1;
                  stats.notOuts += player.isOut ? 0 : 1;
                  stats.highestScore = Math.max(stats.highestScore, runs);
                  stats.matches.add(match.id);
                  
                  // Mark this match as processed for batting
                  stats.battingMatches.add(match.id);
                  
                  console.log(`  🏏 ${player.name}: +${runs} runs (Career: ${stats.careerRuns}, Season: ${stats.runs}) - Match: ${match.id}`);
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
                    season: currentSeason,
                    careerMatches: new Set(),
                    careerRuns: 0,
                    careerBalls: 0,
                    careerFours: 0,
                    careerSixes: 0,
                    careerInnings: 0,
                    careerNotOuts: 0,
                    careerHighestScore: 0,
                    careerWickets: 0,
                    careerBowlingRuns: 0,
                    careerOvers: 0,
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
                }
                
                const stats = playerStats[player.playerId];
                
                // Only add bowling stats if this player hasn't been processed for bowling in this match
                if (!stats.bowlingMatches.has(match.id)) {
                  const wickets = parseInt(player.wickets) || 0;
                  const bowlingRuns = parseInt(player.runs) || 0;
                  const overs = parseFloat(player.overs) || 0;
                  
                  // Career stats
                  stats.careerWickets += wickets;
                  stats.careerBowlingRuns += bowlingRuns;
                  stats.careerOvers += overs;
                  stats.careerMatches.add(match.id);
                  
                  // Current season stats
                  stats.wickets += wickets;
                  stats.bowlingRuns += bowlingRuns;
                  stats.overs += overs;
                  stats.matches.add(match.id);
                  
                  // Mark this match as processed for bowling
                  stats.bowlingMatches.add(match.id);
                  
                  console.log(`  🎳 ${player.name}: +${wickets} wickets (Career: ${stats.careerWickets}, Season: ${stats.wickets})`);
                } else {
                  console.log(`  ⚠️ ${player.name}: Duplicate bowling entry in match ${match.id} - SKIPPED`);
                }
              }
            }
          }
        }
      }
      
      // Step 4: Convert Sets to numbers and calculate derived stats
      console.log('💾 Saving season-aware player stats...');
      const finalStats = {};
      
      for (const [playerId, stats] of Object.entries(playerStats)) {
        // Convert Sets to actual counts
        const finalPlayerStats = {
          playerId: stats.playerId,
          name: stats.name,
          team: stats.team,
          season: stats.season,
          
          // Career stats
          careerMatches: stats.careerMatches.size,
          careerRuns: stats.careerRuns,
          careerBalls: stats.careerBalls,
          careerFours: stats.careerFours,
          careerSixes: stats.careerSixes,
          careerInnings: stats.careerInnings,
          careerNotOuts: stats.careerNotOuts,
          careerHighestScore: stats.careerHighestScore,
          careerWickets: stats.careerWickets,
          careerBowlingRuns: stats.careerBowlingRuns,
          careerOvers: stats.careerOvers,
          
          // Current season stats
          matches: stats.matches.size,
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
        
        // Calculate career batting averages
        const careerDismissals = finalPlayerStats.careerInnings - finalPlayerStats.careerNotOuts;
        finalPlayerStats.careerAverage = careerDismissals > 0 ? (finalPlayerStats.careerRuns / careerDismissals).toFixed(2) : finalPlayerStats.careerRuns;
        finalPlayerStats.careerStrikeRate = finalPlayerStats.careerBalls > 0 ? ((finalPlayerStats.careerRuns / finalPlayerStats.careerBalls) * 100).toFixed(2) : 0;
        
        // Calculate career bowling averages
        finalPlayerStats.careerEconomy = finalPlayerStats.careerOvers > 0 ? (finalPlayerStats.careerBowlingRuns / finalPlayerStats.careerOvers).toFixed(2) : 0;
        finalPlayerStats.careerBestBowling = finalPlayerStats.careerWickets > 0 ? `${finalPlayerStats.careerWickets}/${finalPlayerStats.careerBowlingRuns}` : '0/0';
        
        // Calculate season batting averages
        const seasonDismissals = finalPlayerStats.innings - finalPlayerStats.notOuts;
        finalPlayerStats.average = seasonDismissals > 0 ? (finalPlayerStats.runs / seasonDismissals).toFixed(2) : finalPlayerStats.runs;
        finalPlayerStats.strikeRate = finalPlayerStats.balls > 0 ? ((finalPlayerStats.runs / finalPlayerStats.balls) * 100).toFixed(2) : 0;
        
        // Calculate season bowling averages
        finalPlayerStats.economy = finalPlayerStats.overs > 0 ? (finalPlayerStats.bowlingRuns / finalPlayerStats.overs).toFixed(2) : 0;
        finalPlayerStats.bestBowling = finalPlayerStats.wickets > 0 ? `${finalPlayerStats.wickets}/${finalPlayerStats.bowlingRuns}` : '0/0';
        
        // Log for debugging
        console.log(`✅ ${finalPlayerStats.name}: Career(${finalPlayerStats.careerMatches}m, ${finalPlayerStats.careerRuns}r) Season(${finalPlayerStats.matches}m, ${finalPlayerStats.runs}r)`);
        
        // Save to Firebase
        await setDoc(doc(db, 'playerStats', finalPlayerStats.playerId), finalPlayerStats);
        finalStats[playerId] = finalPlayerStats;
      }
      
      console.log(`✅ Fixed and saved ${Object.keys(finalStats).length} player records with career and season stats`);
      
      return {
        success: true,
        playersProcessed: Object.keys(finalStats).length,
        matchesProcessed: completedMatches.length
      };
      
    } catch (error) {
      console.error('❌ Error fixing season stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SeasonStatsService();