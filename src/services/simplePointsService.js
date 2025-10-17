import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class SimplePointsService {
  // Recalculate points table from scratch
  async recalculatePointsTable() {
    try {
      console.log('🏆 Starting fresh points table calculation...');
      
      // Step 1: Clear existing points table
      const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
      await Promise.all(pointsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
      
      // Step 2: Get all teams
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teams = teamsSnapshot.docs.map(doc => doc.data().name);
      
      // Step 3: Initialize all teams
      const teamRecords = {};
      for (const teamName of teams) {
        teamRecords[teamName] = {
          teamName,
          matchesPlayed: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          runsFor: 0,
          ballsFaced: 0,
          runsAgainst: 0,
          ballsBowled: 0,
          netRunRate: '0.000'
        };
      }
      
      // Step 4: Get completed knockout matches only
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(match => 
          match.status === 'completed' && 
          match.team1Score && 
          match.team2Score &&
          (!match.matchType || match.matchType === 'knockout')
        );
      
      console.log(`🏆 Found ${matches.length} knockout matches to process`);
      
      // Step 5: Process each match
      for (const match of matches) {
        const team1Runs = match.team1Score.runs || 0;
        const team2Runs = match.team2Score.runs || 0;
        const team1Overs = this.convertOversToDecimals(match.team1Score.oversDisplay) * 6;
        const team2Overs = this.convertOversToDecimals(match.team2Score.oversDisplay) * 6;
        
        // Update team1 record
        if (teamRecords[match.team1]) {
          const record = teamRecords[match.team1];
          record.matchesPlayed += 1;
          record.runsFor += team1Runs;
          record.ballsFaced += team1Overs;
          record.runsAgainst += team2Runs;
          record.ballsBowled += team2Overs;
          
          if (team1Runs > team2Runs) {
            record.won += 1;
            record.points += 2;
          } else if (team1Runs < team2Runs) {
            record.lost += 1;
          } else {
            record.tied += 1;
            record.points += 1;
          }
        }
        
        // Update team2 record
        if (teamRecords[match.team2]) {
          const record = teamRecords[match.team2];
          record.matchesPlayed += 1;
          record.runsFor += team2Runs;
          record.ballsFaced += team2Overs;
          record.runsAgainst += team1Runs;
          record.ballsBowled += team1Overs;
          
          if (team2Runs > team1Runs) {
            record.won += 1;
            record.points += 2;
          } else if (team2Runs < team1Runs) {
            record.lost += 1;
          } else {
            record.tied += 1;
            record.points += 1;
          }
        }
      }
      
      // Step 6: Calculate NRR and save
      for (const record of Object.values(teamRecords)) {
        const runRateFor = record.ballsFaced > 0 ? (record.runsFor / record.ballsFaced) * 6 : 0;
        const runRateAgainst = record.ballsBowled > 0 ? (record.runsAgainst / record.ballsBowled) * 6 : 0;
        record.netRunRate = (runRateFor - runRateAgainst).toFixed(3);
        
        await setDoc(doc(db, 'pointsTable', record.teamName), record);
      }
      
      console.log(`✅ Points table updated for ${teams.length} teams`);
      return { success: true, teamsProcessed: teams.length };
      
    } catch (error) {
      console.error('❌ Error in points table calculation:', error);
      return { success: false, error: error.message };
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
      const [pointsSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(collection(db, 'pointsTable')),
        getDocs(collection(db, 'teams'))
      ]);
      
      const pointsData = {};
      pointsSnapshot.docs.forEach(doc => {
        pointsData[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      const allTeams = teamsSnapshot.docs.map(doc => doc.data().name);
      
      const teams = allTeams.map(teamName => {
        return pointsData[teamName] || {
          id: teamName,
          teamName,
          matchesPlayed: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          netRunRate: '0.000'
        };
      });
      
      // Sort by points, then NRR
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.netRunRate || 0) - parseFloat(a.netRunRate || 0);
      });
      
      // Add positions
      teams.forEach((team, index) => {
        team.position = index + 1;
      });
      
      return teams;
    } catch (error) {
      console.error('Error fetching points table:', error);
      return [];
    }
  }
}

export default new SimplePointsService();