import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const fetchAllStatsData = async () => {
  try {
    console.log('🔄 Fetching all stats data without season filters...');
    
    const [matchesSnapshot, teamsSnapshot, standingsSnapshot, statsSnapshot] = await Promise.all([
      getDocs(collection(db, 'matches')),
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'standings')),
      getDocs(collection(db, 'playerStats'))
    ]);
    
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const standings = standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const playerStats = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate top performers
    const topRunScorers = playerStats
      .filter(p => p.runs > 0)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10)
      .map(p => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        runs: p.runs,
        matches: p.matches,
        average: p.average,
        strikeRate: p.strikeRate,
        highestScore: p.highestScore
      }));
      
    const topWicketTakers = playerStats
      .filter(p => p.wickets > 0)
      .sort((a, b) => b.wickets - a.wickets)
      .slice(0, 10)
      .map(p => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        wickets: p.wickets,
        matches: p.matches,
        economy: p.economy,
        overs: p.overs,
        bestBowling: p.bestBowling
      }));
      
    const bestBatsmen = playerStats
      .filter(p => p.runs >= 20 && p.matches >= 1)
      .sort((a, b) => parseFloat(b.average || 0) - parseFloat(a.average || 0))
      .slice(0, 5)
      .map(p => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        average: p.average,
        runs: p.runs
      }));
      
    const bestBowlers = playerStats
      .filter(p => p.wickets >= 1 && p.overs >= 2)
      .sort((a, b) => parseFloat(a.economy || 999) - parseFloat(b.economy || 999))
      .slice(0, 5)
      .map(p => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        economy: p.economy,
        wickets: p.wickets
      }));
    
    const topPerformers = { topRunScorers, topWicketTakers, bestBatsmen, bestBowlers };
    
    console.log('✅ All stats data fetched:', {
      matches: matches.length,
      teams: teams.length,
      standings: standings.length,
      playerStats: playerStats.length,
      topRunScorers: topRunScorers.length,
      topWicketTakers: topWicketTakers.length
    });
    
    return {
      matches,
      teams,
      standings,
      playerStats,
      topPerformers,
      loading: false
    };
    
  } catch (error) {
    console.error('❌ Error fetching stats data:', error);
    return {
      matches: [],
      teams: [],
      standings: [],
      playerStats: [],
      topPerformers: { topRunScorers: [], topWicketTakers: [], bestBatsmen: [], bestBowlers: [] },
      loading: false
    };
  }
};