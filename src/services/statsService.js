import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class StatsService {
  // Update player stats based on match result
  async updatePlayerStats(matchData) {
    try {
      const { battingStats, bowlingStats, team1, team2, id: matchId } = matchData;
      
      // Check if this match has already been processed
      const processedMatchRef = doc(db, 'processedMatches', matchId);
      const processedDoc = await getDoc(processedMatchRef);
      
      if (processedDoc.exists()) {
        console.log('Match already processed, skipping stats update');
        return { success: true, message: 'Already processed' };
      }
      
      // Update batting stats
      if (battingStats) {
        for (const team of [team1, team2]) {
          const teamBatting = battingStats[team] || [];
          for (const player of teamBatting) {
            await this.updatePlayerBattingStats(player, team, matchId);
          }
        }
      }

      // Update bowling stats
      if (bowlingStats) {
        for (const team of [team1, team2]) {
          const teamBowling = bowlingStats[team] || [];
          for (const player of teamBowling) {
            await this.updatePlayerBowlingStats(player, team, matchId);
          }
        }
      }
      
      // Mark match as processed
      await setDoc(processedMatchRef, {
        matchId,
        processedAt: new Date(),
        team1,
        team2
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating player stats:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePlayerBattingStats(playerData, team, matchId) {
    const { playerId, name, runs, balls, fours, sixes, isOut } = playerData;
    
    // Skip extras row
    if (playerId === 'extras' || name.includes('Extras')) {
      return;
    }
    
    // Use name as ID if playerId is not available
    const statId = playerId || name.replace(/\s+/g, '_').toLowerCase();
    const statsRef = doc(db, 'playerStats', statId);
    
    try {
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.exists() ? statsDoc.data() : {
        playerId: statId,
        name,
        team,
        matches: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        innings: 0,
        notOuts: 0,
        highestScore: 0,
        average: 0,
        strikeRate: 0,
        wickets: 0,
        bowlingRuns: 0,
        overs: 0,
        economy: 0,
        bestBowling: '0/0'
      };

      const newRuns = parseInt(runs) || 0;
      const newBalls = parseInt(balls) || 0;
      const newFours = parseInt(fours) || 0;
      const newSixes = parseInt(sixes) || 0;

      const updatedStats = {
        ...currentStats,
        matches: currentStats.matches + 1,
        runs: currentStats.runs + newRuns,
        balls: currentStats.balls + newBalls,
        fours: currentStats.fours + newFours,
        sixes: currentStats.sixes + newSixes,
        innings: currentStats.innings + 1,
        notOuts: isOut ? currentStats.notOuts : currentStats.notOuts + 1,
        highestScore: Math.max(currentStats.highestScore, newRuns)
      };

      // Calculate average and strike rate
      const totalInnings = updatedStats.innings;
      const dismissals = totalInnings - updatedStats.notOuts;
      updatedStats.average = dismissals > 0 ? (updatedStats.runs / dismissals).toFixed(2) : updatedStats.runs;
      updatedStats.strikeRate = updatedStats.balls > 0 ? ((updatedStats.runs / updatedStats.balls) * 100).toFixed(2) : 0;

      await setDoc(statsRef, updatedStats, { merge: true });
    } catch (error) {
      console.error('Error updating batting stats:', error);
    }
  }

  async updatePlayerBowlingStats(playerData, team, matchId) {
    const { playerId, name, overs, runs, wickets } = playerData;
    
    // Use name as ID if playerId is not available
    const statId = playerId || name.replace(/\s+/g, '_').toLowerCase();
    const statsRef = doc(db, 'playerStats', statId);
    
    try {
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.exists() ? statsDoc.data() : {
        playerId: statId,
        name,
        team,
        matches: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        innings: 0,
        notOuts: 0,
        highestScore: 0,
        average: 0,
        strikeRate: 0,
        wickets: 0,
        bowlingRuns: 0,
        overs: 0,
        economy: 0,
        bestBowling: '0/0'
      };

      const newOvers = parseFloat(overs) || 0;
      const newRuns = parseInt(runs) || 0;
      const newWickets = parseInt(wickets) || 0;

      if (newOvers > 0) {
        const updatedStats = {
          ...currentStats,
          wickets: currentStats.wickets + newWickets,
          bowlingRuns: currentStats.bowlingRuns + newRuns,
          overs: currentStats.overs + newOvers
        };

        // Calculate economy
        updatedStats.economy = updatedStats.overs > 0 ? (updatedStats.bowlingRuns / updatedStats.overs).toFixed(2) : 0;

        // Update best bowling figures
        const currentBest = currentStats.bestBowling.split('/');
        const currentBestWickets = parseInt(currentBest[0]) || 0;
        const currentBestRuns = parseInt(currentBest[1]) || 999;

        if (newWickets > currentBestWickets || (newWickets === currentBestWickets && newRuns < currentBestRuns)) {
          updatedStats.bestBowling = `${newWickets}/${newRuns}`;
        }

        await setDoc(statsRef, updatedStats, { merge: true });
      }
    } catch (error) {
      console.error('Error updating bowling stats:', error);
    }
  }

  // Get all player stats
  async getAllPlayerStats() {
    try {
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      return statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return [];
    }
  }

  // Get team-wise player stats
  async getTeamStats(teamName) {
    try {
      const q = query(collection(db, 'playerStats'), where('team', '==', teamName));
      const statsSnapshot = await getDocs(q);
      return statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return [];
    }
  }

  // Get top performers
  async getTopPerformers() {
    try {
      const allStats = await this.getAllPlayerStats();
      
      return {
        topRunScorers: allStats
          .filter(player => player.runs > 0)
          .sort((a, b) => b.runs - a.runs)
          .slice(0, 10),
        topWicketTakers: allStats
          .filter(player => player.wickets > 0)
          .sort((a, b) => b.wickets - a.wickets)
          .slice(0, 10),
        bestBatsmen: allStats
          .filter(player => player.innings >= 3)
          .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
          .slice(0, 10),
        bestBowlers: allStats
          .filter(player => player.overs >= 5)
          .sort((a, b) => parseFloat(a.economy) - parseFloat(b.economy))
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return {
        topRunScorers: [],
        topWicketTakers: [],
        bestBatsmen: [],
        bestBowlers: []
      };
    }
  }
}

export default new StatsService();