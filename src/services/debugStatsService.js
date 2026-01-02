import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class DebugStatsService {
  async debugPlayerRuns(playerName) {
    try {
      console.log(`🔍 Debugging runs for player: ${playerName}`);
      
      // Get all completed matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => 
        match.status === 'completed' && match.battingStats
      );
      
      console.log(`📊 Found ${completedMatches.length} completed matches with batting stats`);
      
      let totalRuns = 0;
      let matchCount = 0;
      const matchDetails = [];
      
      for (const match of completedMatches) {
        console.log(`\n🏏 Match: ${match.team1} vs ${match.team2} (${match.id})`);
        console.log('Batting stats structure:', JSON.stringify(match.battingStats, null, 2));
        
        let playerFoundInMatch = false;
        let runsInThisMatch = 0;
        
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            console.log(`  Team: ${teamName}, Batting entries: ${Array.isArray(teamBatting) ? teamBatting.length : 'Not array'}`);
            
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (player.name && player.name.toLowerCase().includes(playerName.toLowerCase())) {
                  console.log(`  ✅ Found ${player.name}:`, {
                    runs: player.runs,
                    balls: player.balls,
                    playerId: player.playerId,
                    isOut: player.isOut
                  });
                  
                  const runs = parseInt(player.runs) || 0;\n                  runsInThisMatch += runs;\n                  totalRuns += runs;\n                  playerFoundInMatch = true;\n                }\n              }\n            }\n          }\n        }\n        \n        if (playerFoundInMatch) {\n          matchCount++;\n          matchDetails.push({\n            matchId: match.id,\n            teams: `${match.team1} vs ${match.team2}`,\n            runsScored: runsInThisMatch\n          });\n          console.log(`  📊 Player runs in this match: ${runsInThisMatch}`);\n        }\n      }\n      \n      console.log(`\n🎯 SUMMARY for ${playerName}:`);\n      console.log(`Total matches played: ${matchCount}`);\n      console.log(`Total runs scored: ${totalRuns}`);\n      console.log(`Match-by-match breakdown:`);\n      matchDetails.forEach((match, index) => {\n        console.log(`  ${index + 1}. ${match.teams}: ${match.runsScored} runs`);\n      });\n      \n      return {\n        playerName,\n        totalMatches: matchCount,\n        totalRuns,\n        matchDetails\n      };\n      \n    } catch (error) {\n      console.error('❌ Error debugging player runs:', error);\n      return { error: error.message };\n    }\n  }\n  \n  async debugAllMatches() {\n    try {\n      console.log('🔍 Debugging all match data...');\n      \n      const matchesSnapshot = await getDocs(collection(db, 'matches'));\n      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n      const completedMatches = matches.filter(match => \n        match.status === 'completed' && match.battingStats\n      );\n      \n      console.log(`📊 Found ${completedMatches.length} completed matches`);\n      \n      for (const match of completedMatches) {\n        console.log(`\n🏏 Match: ${match.team1} vs ${match.team2}`);\n        console.log(`Status: ${match.status}`);\n        console.log(`Match ID: ${match.id}`);\n        \n        if (match.battingStats) {\n          console.log('Batting Stats:');\n          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {\n            console.log(`  ${teamName}:`);\n            if (Array.isArray(teamBatting)) {\n              teamBatting.forEach((player, index) => {\n                console.log(`    ${index + 1}. ${player.name}: ${player.runs} runs, ${player.balls} balls`);\n              });\n            } else {\n              console.log(`    Not an array:`, teamBatting);\n            }\n          }\n        }\n        \n        if (match.bowlingStats) {\n          console.log('Bowling Stats:');\n          for (const [teamName, teamBowling] of Object.entries(match.bowlingStats)) {\n            console.log(`  ${teamName}:`);\n            if (Array.isArray(teamBowling)) {\n              teamBowling.forEach((player, index) => {\n                console.log(`    ${index + 1}. ${player.name}: ${player.wickets} wickets, ${player.runs} runs conceded`);\n              });\n            }\n          }\n        }\n      }\n      \n    } catch (error) {\n      console.error('❌ Error debugging matches:', error);\n    }\n  }\n}\n\nexport default new DebugStatsService();