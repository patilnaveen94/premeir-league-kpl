import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class PointsTableService {
  // Update points table based on match result
  async updatePointsTable(matchData) {
    try {
      const { team1, team2, team1Score, team2Score, status } = matchData;
      
      if (status !== 'completed' || !team1Score || !team2Score) {
        return { success: false, error: 'Match not completed or scores missing' };
      }

      // Determine winner
      const team1Runs = team1Score.runs || 0;
      const team2Runs = team2Score.runs || 0;
      const winner = team1Runs > team2Runs ? team1 : team2Runs > team1Runs ? team2 : null;

      // Update both teams
      await this.updateTeamRecord(team1, team1Score, team2Score, winner === team1);
      await this.updateTeamRecord(team2, team2Score, team1Score, winner === team2);

      return { success: true };
    } catch (error) {
      console.error('Error updating points table:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTeamRecord(teamName, teamScore, opponentScore, won) {
    const teamRef = doc(db, 'pointsTable', teamName);
    
    try {
      const teamDoc = await getDoc(teamRef);
      const currentRecord = teamDoc.exists() ? teamDoc.data() : {
        teamName,
        matchesPlayed: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        runsFor: 0,
        ballsFaced: 0,
        runsAgainst: 0,
        ballsBowled: 0,
        netRunRate: 0.00
      };

      const teamRuns = teamScore.runs || 0;
      const teamBalls = this.convertOversToDecimals(teamScore.oversDisplay) * 6 || 0;
      const opponentRuns = opponentScore.runs || 0;
      const opponentBalls = this.convertOversToDecimals(opponentScore.oversDisplay) * 6 || 0;

      const updatedRecord = {
        ...currentRecord,
        matchesPlayed: currentRecord.matchesPlayed + 1,
        won: won ? currentRecord.won + 1 : currentRecord.won,
        lost: !won && teamRuns !== opponentRuns ? currentRecord.lost + 1 : currentRecord.lost,
        tied: teamRuns === opponentRuns ? currentRecord.tied + 1 : currentRecord.tied,
        points: currentRecord.points + (won ? 2 : teamRuns === opponentRuns ? 1 : 0),
        runsFor: currentRecord.runsFor + teamRuns,
        ballsFaced: currentRecord.ballsFaced + teamBalls,
        runsAgainst: currentRecord.runsAgainst + opponentRuns,
        ballsBowled: currentRecord.ballsBowled + opponentBalls
      };

      // Calculate Net Run Rate
      const runRateFor = updatedRecord.ballsFaced > 0 ? (updatedRecord.runsFor / updatedRecord.ballsFaced) * 6 : 0;
      const runRateAgainst = updatedRecord.ballsBowled > 0 ? (updatedRecord.runsAgainst / updatedRecord.ballsBowled) * 6 : 0;
      updatedRecord.netRunRate = (runRateFor - runRateAgainst).toFixed(3);

      await setDoc(teamRef, updatedRecord, { merge: true });
    } catch (error) {
      console.error('Error updating team record:', error);
    }
  }

  convertOversToDecimals(oversDisplay) {
    if (!oversDisplay) return 0;
    const parts = oversDisplay.toString().split('.');
    const overs = parseInt(parts[0]) || 0;
    const balls = parseInt(parts[1]) || 0;
    return overs + (balls / 6);
  }

  // Get current points table
  async getPointsTable() {
    try {
      console.log('PointsTableService: Fetching from Firebase...');
      const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
      
      console.log('PointsTableService: Firebase docs count:', pointsSnapshot.docs.length);
      
      const teams = pointsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in JavaScript instead of Firebase
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.netRunRate || 0) - parseFloat(a.netRunRate || 0);
      });

      // Add positions after sorting
      teams.forEach((team, index) => {
        team.position = index + 1;
      });

      console.log('PointsTableService: Processed teams:', teams);
      return teams;
    } catch (error) {
      console.error('Error fetching points table:', error);
      return [];
    }
  }

  // Initialize team in points table
  async initializeTeam(teamName) {
    const teamRef = doc(db, 'pointsTable', teamName);
    
    try {
      const teamDoc = await getDoc(teamRef);
      if (!teamDoc.exists()) {
        await setDoc(teamRef, {
          teamName,
          matchesPlayed: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsFor: 0,
          ballsFaced: 0,
          runsAgainst: 0,
          ballsBowled: 0,
          netRunRate: 0.00
        });
      }
    } catch (error) {
      console.error('Error initializing team:', error);
    }
  }

  // Get team standings with additional stats
  async getDetailedStandings() {
    try {
      const teams = await this.getPointsTable();
      
      return teams.map(team => ({
        ...team,
        winPercentage: team.matchesPlayed > 0 ? ((team.won / team.matchesPlayed) * 100).toFixed(1) : 0,
        avgRunsFor: team.matchesPlayed > 0 ? (team.runsFor / team.matchesPlayed).toFixed(1) : 0,
        avgRunsAgainst: team.matchesPlayed > 0 ? (team.runsAgainst / team.matchesPlayed).toFixed(1) : 0,
        form: this.calculateForm(team) // Last 5 matches form
      }));
    } catch (error) {
      console.error('Error fetching detailed standings:', error);
      return [];
    }
  }

  calculateForm(team) {
    // This would require match history - simplified for now
    return 'N/A';
  }
}

export default new PointsTableService();