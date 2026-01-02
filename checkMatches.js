// Add this to browser console to check your match data:

import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase/firebase';

const checkMatches = async () => {
  const matchesSnapshot = await getDocs(collection(db, 'matches'));
  const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const completedMatches = matches.filter(match => match.status === 'completed');
  
  console.log('=== MATCH TEAM SCORES ===');
  let tournamentTotal = 0;
  
  completedMatches.forEach(match => {
    const team1Runs = parseInt(match.team1Score?.runs) || 0;
    const team2Runs = parseInt(match.team2Score?.runs) || 0;
    const matchTotal = team1Runs + team2Runs;
    tournamentTotal += matchTotal;
    
    console.log(`${match.team1}: ${team1Runs}, ${match.team2}: ${team2Runs} = ${matchTotal}`);
  });
  
  console.log(`TOURNAMENT TOTAL: ${tournamentTotal}`);
  return tournamentTotal;
};

checkMatches();