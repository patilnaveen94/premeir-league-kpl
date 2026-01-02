import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class TournamentStatsService {
  async calculateTournamentStats() {
    try {
      console.log('📊 Calculating tournament stats from match scores...');
      
      // Get all completed matches
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => 
        match.status === 'completed' && 
        (match.team1Score?.runs !== undefined || match.team2Score?.runs !== undefined)
      );
      
      console.log(`🏏 Found ${completedMatches.length} completed matches`);
      
      let totalRuns = 0;
      let totalWickets = 0;
      let totalOvers = 0;
      const matchBreakdown = [];
      
      for (const match of completedMatches) {
        const team1Runs = parseInt(match.team1Score?.runs) || 0;
        const team2Runs = parseInt(match.team2Score?.runs) || 0;
        const team1Wickets = parseInt(match.team1Score?.wickets) || 0;
        const team2Wickets = parseInt(match.team2Score?.wickets) || 0;
        
        const matchRuns = team1Runs + team2Runs;
        const matchWickets = team1Wickets + team2Wickets;
        
        totalRuns += matchRuns;
        totalWickets += matchWickets;
        
        matchBreakdown.push({
          match: `${match.team1} vs ${match.team2}`,
          team1Score: `${team1Runs}/${team1Wickets}`,
          team2Score: `${team2Runs}/${team2Wickets}`,
          matchTotal: matchRuns
        });
        
        console.log(`🏏 ${match.team1} ${team1Runs}/${team1Wickets} vs ${match.team2} ${team2Runs}/${team2Wickets} = ${matchRuns} runs`);
      }
      
      console.log(`\n🎯 TOURNAMENT TOTALS:`);
      console.log(`Total Runs: ${totalRuns}`);
      console.log(`Total Wickets: ${totalWickets}`);
      console.log(`Total Matches: ${completedMatches.length}`);
      console.log(`Average Runs per Match: ${(totalRuns / completedMatches.length).toFixed(1)}`);
      
      return {
        success: true,
        totalRuns,
        totalWickets,
        totalMatches: completedMatches.length,
        averageRunsPerMatch: (totalRuns / completedMatches.length).toFixed(1),
        matchBreakdown
      };
      
    } catch (error) {
      console.error('❌ Error calculating tournament stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new TournamentStatsService();