import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class DebugMatchScores {
  async checkMatchScores() {
    try {
      console.log('🔍 Checking match scores vs player stats...');
      
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => match.status === 'completed');
      
      console.log(`📊 Found ${completedMatches.length} completed matches`);
      
      let tournamentTotalFromTeamScores = 0;
      let tournamentTotalFromPlayerStats = 0;
      
      for (const match of completedMatches) {
        console.log(`\n🏏 Match: ${match.team1} vs ${match.team2}`);
        
        // Team scores
        const team1Runs = parseInt(match.team1Score?.runs) || 0;
        const team2Runs = parseInt(match.team2Score?.runs) || 0;
        const matchTotalFromTeamScores = team1Runs + team2Runs;
        tournamentTotalFromTeamScores += matchTotalFromTeamScores;
        
        console.log(`Team Scores: ${match.team1} ${team1Runs}, ${match.team2} ${team2Runs} = ${matchTotalFromTeamScores} total`);
        
        // Player stats total
        let matchTotalFromPlayerStats = 0;
        if (match.battingStats) {
          for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
            if (Array.isArray(teamBatting)) {
              for (const player of teamBatting) {
                if (player.playerId !== 'extras') {
                  matchTotalFromPlayerStats += parseInt(player.runs) || 0;
                }
              }
            }
          }
        }
        tournamentTotalFromPlayerStats += matchTotalFromPlayerStats;
        
        console.log(`Player Stats Total: ${matchTotalFromPlayerStats}`);
        console.log(`Difference: ${matchTotalFromTeamScores - matchTotalFromPlayerStats}`);
      }
      
      console.log(`\n🎯 TOURNAMENT TOTALS:`);
      console.log(`From Team Scores: ${tournamentTotalFromTeamScores}`);
      console.log(`From Player Stats: ${tournamentTotalFromPlayerStats}`);
      console.log(`Difference: ${tournamentTotalFromTeamScores - tournamentTotalFromPlayerStats}`);
      
      return {
        tournamentTotalFromTeamScores,
        tournamentTotalFromPlayerStats,
        difference: tournamentTotalFromTeamScores - tournamentTotalFromPlayerStats
      };
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

export default new DebugMatchScores();