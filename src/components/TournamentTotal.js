import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const TournamentTotal = () => {
  const [tournamentTotal, setTournamentTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateTournamentTotal();
  }, []);

  const calculateTournamentTotal = async () => {
    try {
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => match.status === 'completed');

      let total = 0;
      for (const match of completedMatches) {
        const team1Runs = parseInt(match.team1Score?.runs) || 0;
        const team2Runs = parseInt(match.team2Score?.runs) || 0;
        total += team1Runs + team2Runs;
        console.log(`${match.team1} ${team1Runs} + ${match.team2} ${team2Runs} = ${team1Runs + team2Runs}`);
      }
      
      console.log(`Tournament Total: ${total}`);
      setTournamentTotal(total);
    } catch (error) {
      console.error('Error calculating tournament total:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-blue-100 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-blue-900">Tournament Total Runs</h3>
      <p className="text-3xl font-bold text-blue-600">{tournamentTotal}</p>
      <p className="text-sm text-blue-700">From team scores in completed matches</p>
    </div>
  );
};

export default TournamentTotal;