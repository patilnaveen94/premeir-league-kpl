import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const rebuildPointsTableFromMatches = async () => {
  try {
    console.log('Rebuilding points table from completed matches...');
    
    // Get all teams and completed matches
    const [teamsSnapshot, matchesSnapshot] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'matches'))
    ]);
    
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const completedMatches = matches.filter(m => m.status === 'completed');
    
    console.log(`Found ${teams.length} teams and ${completedMatches.length} completed matches`);
    
    // Initialize points table for all teams
    const pointsTable = {};
    teams.forEach(team => {
      pointsTable[team.name] = {
        teamName: team.name,
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
    });
    
    // Process each completed match
    completedMatches.forEach(match => {
      const { team1, team2, team1Score, team2Score } = match;
      
      if (!team1Score || !team2Score) return;
      
      const team1Runs = parseInt(team1Score.runs) || 0;
      const team2Runs = parseInt(team2Score.runs) || 0;
      const team1Wickets = parseInt(team1Score.wickets) || 0;
      const team2Wickets = parseInt(team2Score.wickets) || 0;
      const team1Overs = parseFloat(team1Score.oversDisplay) || 0;
      const team2Overs = parseFloat(team2Score.oversDisplay) || 0;
      
      // Convert overs to balls
      const team1Balls = Math.floor(team1Overs) * 6 + ((team1Overs % 1) * 10);
      const team2Balls = Math.floor(team2Overs) * 6 + ((team2Overs % 1) * 10);
      
      // Update team1 stats
      if (pointsTable[team1]) {
        pointsTable[team1].matchesPlayed++;
        pointsTable[team1].runsFor += team1Runs;
        pointsTable[team1].ballsFaced += team1Balls;
        pointsTable[team1].runsAgainst += team2Runs;
        pointsTable[team1].ballsBowled += team2Balls;
        
        if (team1Runs > team2Runs) {
          pointsTable[team1].won++;
          pointsTable[team1].points += 2;
        } else if (team1Runs < team2Runs) {
          pointsTable[team1].lost++;
        } else {
          pointsTable[team1].tied++;
          pointsTable[team1].points += 1;
        }
      }
      
      // Update team2 stats
      if (pointsTable[team2]) {
        pointsTable[team2].matchesPlayed++;
        pointsTable[team2].runsFor += team2Runs;
        pointsTable[team2].ballsFaced += team2Balls;
        pointsTable[team2].runsAgainst += team1Runs;
        pointsTable[team2].ballsBowled += team1Balls;
        
        if (team2Runs > team1Runs) {
          pointsTable[team2].won++;
          pointsTable[team2].points += 2;
        } else if (team2Runs < team1Runs) {
          pointsTable[team2].lost++;
        } else {
          pointsTable[team2].tied++;
          pointsTable[team2].points += 1;
        }
      }
    });
    
    // Calculate NRR and save to Firestore
    let updatedTeams = 0;
    for (const teamName in pointsTable) {
      const team = pointsTable[teamName];
      
      // Calculate Net Run Rate
      const runRateFor = team.ballsFaced > 0 ? (team.runsFor / team.ballsFaced) * 6 : 0;
      const runRateAgainst = team.ballsBowled > 0 ? (team.runsAgainst / team.ballsBowled) * 6 : 0;
      team.netRunRate = (runRateFor - runRateAgainst).toFixed(3);
      
      // Save to Firestore
      await setDoc(doc(db, 'pointsTable', teamName), team);
      updatedTeams++;
    }
    
    console.log(`Updated points table for ${updatedTeams} teams`);
    return { success: true, message: `Rebuilt points table for ${updatedTeams} teams from ${completedMatches.length} matches` };
  } catch (error) {
    console.error('Error rebuilding points table:', error);
    return { success: false, error: error.message };
  }
};