import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getMatchWinMessage } from '../utils/matchUtils';

// CricHeroes Service with Firebase Integration
class CricHeroesService {
  constructor() {
    // Firebase integration
  }

  async getLeaderboard() {
    try {
      const playerStatsSnapshot = await getDocs(collection(db, 'playerStats'));
      const playerStats = playerStatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const batsmen = playerStats
        .filter(player => player.runs > 0)
        .map(player => ({
          ...player,
          playerName: player.name
        }))
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 10);

      const bowlers = playerStats
        .filter(player => player.wickets > 0)
        .map(player => ({
          ...player,
          playerName: player.name
        }))
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 10);

      return { batsmen, bowlers };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { batsmen: [], bowlers: [] };
    }
  }

  async getPastMatches() {
    try {
      const q = query(
        collection(db, 'matches'),
        where('status', '==', 'completed')
      );
      const snapshot = await getDocs(q);
      const matches = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .map(match => ({
          ...match,
          result: getMatchWinMessage(match)
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return { matches };
    } catch (error) {
      console.error('Error fetching past matches:', error);
      return { matches: [] };
    }
  }

  async getLiveMatches() {
    try {
      const q = query(
        collection(db, 'matches'),
        where('status', '==', 'live')
      );
      const snapshot = await getDocs(q);
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { matches };
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return { matches: [] };
    }
  }

  async getUpcomingMatches() {
    try {
      const q = query(
        collection(db, 'matches'),
        where('status', '==', 'upcoming')
      );
      const snapshot = await getDocs(q);
      const matches = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort in memory instead
      return { matches };
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return { matches: [] };
    }
  }

  async getPointsTable() {
    try {
      const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
      console.log('Raw points table docs:', pointsSnapshot.docs.length);
      const teams = pointsSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        position: index + 1,
        ...doc.data()
      }));
      
      console.log('Points table teams:', teams);
      
      // Sort by points, then by net run rate
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.netRunRate) - parseFloat(a.netRunRate);
      });
      
      // Update positions after sorting
      teams.forEach((team, index) => {
        team.position = index + 1;
      });
      
      return teams;
    } catch (error) {
      console.error('Error fetching points table:', error);
      return [];
    }
  }

  async getMatches() {
    try {
      const snapshot = await getDocs(collection(db, 'matches'));
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: matches };
    } catch (error) {
      console.error('Error fetching matches:', error);
      return { data: [] };
    }
  }

  async getTournamentInfo() {
    return {
      name: 'Khajjidoni Premier League 2026',
      totalTeams: 8,
      totalMatches: 28,
      format: 'T20'
    };
  }

  async getOverallStats() {
    try {
      const [matchesSnapshot, playerStatsSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'teams'))
      ]);
      
      const matches = matchesSnapshot.docs.map(doc => doc.data());
      const playerStats = playerStatsSnapshot.docs.map(doc => doc.data());
      const teams = teamsSnapshot.docs.map(doc => doc.data());
      
      const completedMatches = matches.filter(m => m.status === 'completed');
      const totalRuns = playerStats.reduce((sum, player) => sum + (player.runs || 0), 0);
      const totalWickets = playerStats.reduce((sum, player) => sum + (player.wickets || 0), 0);
      const totalPlayers = playerStats.length;
      const highestIndividualScore = Math.max(...playerStats.map(p => p.highestScore || 0), 0);
      
      return {
        tournament: {
          totalTeams: teams.length,
          totalMatches: completedMatches.length,
          totalPlayers,
          totalRuns,
          totalWickets,
          highestScore: highestIndividualScore,
          format: 'T20'
        }
      };
    } catch (error) {
      console.error('Error fetching overall stats:', error);
      return { tournament: {} };
    }
  }
}

export default new CricHeroesService();