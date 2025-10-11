import React, { useState, useEffect } from 'react';
import { collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { Play, Calendar } from 'lucide-react';
import { db } from '../firebase/firebase';

const LiveScoring = () => {
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchScheduledMatches();
  }, []);

  const fetchScheduledMatches = async () => {
    try {
      const q = query(collection(db, 'matches'), where('status', '==', 'upcoming'));
      const matchesSnapshot = await getDocs(q);
      const matchesData = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScheduledMatches(matchesData);
    } catch (error) {
      console.error('Error fetching scheduled matches:', error);
    }
  };

  const startMatch = async (match) => {
    try {
      const matchData = {
        status: 'live',
        currentInning: 'team1',
        currentOver: 0,
        currentBatsman: '',
        innings: {
          team1: { runs: 0, wickets: 0, overs: 0, balls: 0 },
          team2: { runs: 0, wickets: 0, overs: 0, balls: 0 }
        },
        startedAt: new Date()
      };
      
      await updateDoc(doc(db, 'matches', match.id), matchData);
      setSelectedMatch({ ...match, ...matchData });
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const updateScore = async (runs, isWicket = false) => {
    if (!selectedMatch) return;

    const currentInning = selectedMatch.innings[selectedMatch.currentInning];
    const newBalls = currentInning.balls + 1;
    const newOvers = Math.floor(newBalls / 6) + (newBalls % 6) / 10;
    
    const updatedMatch = {
      ...selectedMatch,
      innings: {
        ...selectedMatch.innings,
        [selectedMatch.currentInning]: {
          ...currentInning,
          runs: currentInning.runs + runs,
          wickets: currentInning.wickets + (isWicket ? 1 : 0),
          balls: newBalls,
          overs: parseFloat(newOvers.toFixed(1))
        }
      },
      currentOver: parseFloat(newOvers.toFixed(1)),
      lastUpdated: new Date()
    };

    try {
      await updateDoc(doc(db, 'matches', selectedMatch.id), updatedMatch);
      setSelectedMatch(updatedMatch);
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const endMatch = async () => {
    if (!selectedMatch) return;
    try {
      await updateDoc(doc(db, 'matches', selectedMatch.id), {
        status: 'completed',
        endedAt: new Date()
      });
      setSelectedMatch(null);
    } catch (error) {
      console.error('Error ending match:', error);
    }
  };

  if (!selectedMatch) {
    if (scheduledMatches.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Scheduled Matches</h3>
          <p className="text-gray-500 mb-4">Please schedule matches first in the Matches & Scores section</p>
          <p className="text-sm text-gray-400">Matches need to be scheduled before they can be scored live</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Select Match to Start Scoring</h3>
        {scheduledMatches.map(match => (
          <div key={match.id} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{match.team1} vs {match.team2}</h4>
                <p className="text-sm text-gray-600">{match.date} • {match.venue}</p>
              </div>
              <button
                onClick={() => startMatch(match)}
                className="bg-cricket-green hover:bg-cricket-green/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Start</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">{selectedMatch.title}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h4 className="font-semibold">{selectedMatch.team1}</h4>
            <div className="text-2xl font-bold">
              {selectedMatch.innings.team1.runs}/{selectedMatch.innings.team1.wickets}
            </div>
            <div className="text-sm">({selectedMatch.innings.team1.overs} overs)</div>
          </div>
          <div className="text-center">
            <h4 className="font-semibold">{selectedMatch.team2}</h4>
            <div className="text-2xl font-bold">
              {selectedMatch.innings.team2.runs}/{selectedMatch.innings.team2.wickets}
            </div>
            <div className="text-sm">({selectedMatch.innings.team2.overs} overs)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 6].map(runs => (
          <button
            key={runs}
            onClick={() => updateScore(runs)}
            className="bg-cricket-green hover:bg-cricket-green/90 text-white rounded-lg py-3 font-bold text-lg"
          >
            {runs}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => updateScore(0, true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 font-bold"
        >
          Wicket
        </button>
        <button
          onClick={endMatch}
          className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 font-bold"
        >
          End Match
        </button>
      </div>
    </div>
  );
};

export default LiveScoring;