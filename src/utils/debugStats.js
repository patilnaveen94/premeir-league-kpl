import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const debugStatsIssue = async () => {
  try {
    console.log('🔍 Debugging stats issue...');
    
    // Get all matches
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const completedMatches = matches.filter(match => 
      match.status === 'completed' && 
      (match.battingStats || match.bowlingStats)
    );
    
    console.log(`Found ${completedMatches.length} completed matches`);
    
    // Debug specific players
    const targetPlayers = ['anil vasanand', 'vinayak lalng'];
    const playerData = {};
    
    for (const match of completedMatches) {
      console.log(`\n📊 Match: ${match.team1} vs ${match.team2} (${match.id})`);
      
      // Check batting stats
      if (match.battingStats) {
        for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
          if (Array.isArray(teamBatting)) {
            for (const player of teamBatting) {
              const playerName = player.name?.toLowerCase();
              if (targetPlayers.some(target => playerName?.includes(target.toLowerCase()))) {
                if (!playerData[playerName]) {
                  playerData[playerName] = {
                    matches: [],
                    totalRuns: 0,
                    totalInnings: 0
                  };
                }
                
                playerData[playerName].matches.push({
                  matchId: match.id,
                  team: teamName,
                  runs: player.runs,
                  balls: player.balls,
                  isOut: player.isOut
                });
                playerData[playerName].totalRuns += parseInt(player.runs) || 0;
                playerData[playerName].totalInnings += 1;
                
                console.log(`  🏏 ${player.name}: ${player.runs} runs, ${player.balls} balls`);
              }
            }
          }
        }
      }
    }
    
    // Show results
    console.log('\n📈 Player Analysis:');
    for (const [playerName, data] of Object.entries(playerData)) {
      console.log(`\n👤 ${playerName.toUpperCase()}:`);
      console.log(`  Unique matches: ${new Set(data.matches.map(m => m.matchId)).size}`);
      console.log(`  Total innings recorded: ${data.totalInnings}`);
      console.log(`  Total runs: ${data.totalRuns}`);
      console.log(`  Match details:`);
      data.matches.forEach(match => {
        console.log(`    - Match ${match.matchId}: ${match.runs} runs for ${match.team}`);
      });
    }
    
    // Check for duplicate match IDs
    const allMatchIds = [];
    for (const [playerName, data] of Object.entries(playerData)) {
      allMatchIds.push(...data.matches.map(m => m.matchId));
    }
    const duplicateMatches = allMatchIds.filter((id, index) => allMatchIds.indexOf(id) !== index);
    if (duplicateMatches.length > 0) {
      console.log('\n⚠️ Duplicate match processing detected:', duplicateMatches);
    }
    
    return playerData;
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};