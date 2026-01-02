import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trophy, Target } from 'lucide-react';

const TournamentStats = () => {
  const [tournamentStats, setTournamentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentStats();
  }, []);

  const fetchTournamentStats = async () => {
    try {
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => 
        match.status === 'completed' && 
        (match.team1Score?.runs !== undefined || match.team2Score?.runs !== undefined)
      );

      let totalRuns = 0;
      const matchBreakdown = [];

      for (const match of completedMatches) {
        const team1Runs = parseInt(match.team1Score?.runs) || 0;
        const team2Runs = parseInt(match.team2Score?.runs) || 0;
        const matchRuns = team1Runs + team2Runs;
        
        totalRuns += matchRuns;
        matchBreakdown.push({
          match: `${match.team1} vs ${match.team2}`,
          team1Score: team1Runs,
          team2Score: team2Runs,
          matchTotal: matchRuns
        });
      }

      setTournamentStats({
        totalRuns,
        totalMatches: completedMatches.length,
        matchBreakdown
      });
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading tournament stats...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">Tournament Statistics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Total Tournament Runs</h3>
              <p className="text-3xl font-bold text-blue-600">{tournamentStats?.totalRuns || 0}</p>
              <p className="text-sm text-gray-600">From {tournamentStats?.totalMatches || 0} matches</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Average per Match</h3>
              <p className="text-3xl font-bold text-green-600">
                {tournamentStats?.totalMatches > 0 
                  ? Math.round(tournamentStats.totalRuns / tournamentStats.totalMatches)
                  : 0}
              </p>
              <p className="text-sm text-gray-600">Runs per match</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Match Breakdown</h3>
        <div className="space-y-2">
          {tournamentStats?.matchBreakdown?.map((match, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">{match.match}</span>
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  {match.team1Score} + {match.team2Score} = 
                </span>
                <span className="ml-1 font-bold text-blue-600">{match.matchTotal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentStats;