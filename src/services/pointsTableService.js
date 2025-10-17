import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class PointsTableService {
  // Update points table based on match result
  async updatePointsTable(matchData) {
    try {
      const { team1, team2, team1Score, team2Score, status, matchType } = matchData;
      
      console.log('🏆 Updating points table for:', { team1, team2, team1Score, team2Score, status, matchType });
      
      if (status !== 'completed' || !team1Score || !team2Score) {
        console.log('⚠️ Points table update skipped:', { status, team1Score: !!team1Score, team2Score: !!team2Score });
        return { success: false, error: 'Match not completed or scores missing' };
      }
      
      // Only process knockout matches for points table (treat undefined as knockout for backward compatibility)
      const isPlayoffMatch = ['qualifier1', 'qualifier2', 'eliminator', 'final'].includes(matchType);
      if (matchType && matchType !== 'knockout' && isPlayoffMatch) {
        console.log('⚠️ Points table update skipped - playoff match:', { matchType });
        return { success: false, error: 'Playoff matches do not count for points table' };
      }
      
      console.log('🔍 Processing match for points table:', { matchType: matchType || 'undefined (treated as knockout)' });

      // Determine winner
      const team1Runs = team1Score.runs || 0;
      const team2Runs = team2Score.runs || 0;
      const winner = team1Runs > team2Runs ? team1 : team2Runs > team1Runs ? team2 : null;
      
      console.log('🏆 Match result:', { team1Runs, team2Runs, winner });

      // Update both teams
      await this.updateTeamRecord(team1, team1Score, team2Score, winner === team1);
      await this.updateTeamRecord(team2, team2Score, team1Score, winner === team2);
      
      console.log('✅ Points table updated successfully for both teams');
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
    const result = overs + (balls / 6);
    console.log(`Converting overs: ${oversDisplay} -> ${result} (${overs} overs + ${balls}/6 balls)`);
    return result;
  }

  // Get current points table
  async getPointsTable() {
    try {
      console.log('PointsTableService: Fetching from Firebase...');
      
      // Get all teams from teams collection to ensure all teams are shown
      const [pointsSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(collection(db, 'pointsTable')),
        getDocs(collection(db, 'teams'))
      ]);
      
      console.log('PointsTableService: Points docs:', pointsSnapshot.docs.length, 'Teams docs:', teamsSnapshot.docs.length);
      
      const pointsData = {};
      pointsSnapshot.docs.forEach(doc => {
        pointsData[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      const allTeams = teamsSnapshot.docs.map(doc => doc.data().name);
      
      // Ensure all teams are represented in points table
      const teams = allTeams.map(teamName => {
        return pointsData[teamName] || {
          id: teamName,
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
          netRunRate: '0.000'
        };
      });

      // Sort in JavaScript instead of Firebase
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.netRunRate || 0) - parseFloat(a.netRunRate || 0);
      });

      // Add positions after sorting
      teams.forEach((team, index) => {
        team.position = index + 1;
      });

      console.log('PointsTableService: Processed teams:', teams.length);
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

  // Recalculate points table from scratch based on current matches
  async recalculatePointsTable() {
    try {
      console.log('🏆 Recalculating points table...');
      
      // Clear existing points table
      const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
      const deletePromises = pointsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`🗑️ Cleared ${pointsSnapshot.docs.length} existing points table records`);
      
      // Get all teams and matches
      const [matchesSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'teams'))
      ]);
      
      const allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('🔍 All matches found:', allMatches.map(m => ({
        id: m.id,
        teams: `${m.team1} vs ${m.team2}`,
        status: m.status,
        matchType: m.matchType,
        hasScores: !!(m.team1Score && m.team2Score)
      })));
      
      const matches = allMatches.filter(match => {
        const isCompleted = match.status === 'completed';
        const hasScores = !!(match.team1Score && match.team2Score);
        const isKnockoutOrUndefined = !match.matchType || match.matchType === 'knockout';
        const isNotPlayoff = !['qualifier1', 'qualifier2', 'eliminator', 'final'].includes(match.matchType);
        
        return isCompleted && hasScores && isKnockoutOrUndefined && isNotPlayoff;
      });
      
      console.log('🔍 Filtered matches for points table:', matches.map(m => ({
        teams: `${m.team1} vs ${m.team2}`,
        matchType: m.matchType || 'undefined',
        willProcess: (m.matchType === 'knockout' || !m.matchType)
      })));
      
      const allTeams = teamsSnapshot.docs.map(doc => doc.data().name);
      
      console.log(`🏆 Found ${allTeams.length} teams and ${matches.length} completed knockout matches`);
      
      if (matches.length > 0) {
        console.log('📋 Knockout matches for points table:', matches.map(m => `${m.team1} vs ${m.team2} (${m.matchType || 'knockout'}) - ${m.team1Score?.runs}-${m.team1Score?.wickets} vs ${m.team2Score?.runs}-${m.team2Score?.wickets}`));
      } else {
        console.log('📋 No knockout matches found - initializing empty points table');
      }
      
      // Initialize ALL teams first (even those without matches)
      for (const teamName of allTeams) {
        await this.initializeTeam(teamName);
        console.log(`✅ Initialized team: ${teamName}`);
      }
      
      // Reprocess all completed knockout matches only (if any exist)
      if (matches.length > 0) {
        for (const match of matches) {
          console.log(`🏆 Processing knockout match: ${match.team1} vs ${match.team2} (${match.matchType || 'knockout'})`);
          const result = await this.updatePointsTable({
            team1: match.team1,
            team2: match.team2,
            team1Score: match.team1Score,
            team2Score: match.team2Score,
            status: 'completed',
            matchType: match.matchType || 'knockout'
          });
          console.log(`📊 Match processing result:`, result);
        }
      } else {
        console.log('📊 No matches to process - all teams initialized with zero stats');
      }
      
      // Verify final points table
      const finalPointsTable = await this.getPointsTable();
      console.log('🏆 Final points table:', finalPointsTable);
      
      console.log('✅ Points table recalculated successfully - only knockout matches processed');
      return { success: true, processedMatches: matches.length, teams: allTeams.length };
    } catch (error) {
      console.error('❌ Error recalculating points table:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PointsTableService();