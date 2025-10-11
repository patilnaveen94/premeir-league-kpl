import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Activity, Clock, Users, Trash2 } from 'lucide-react';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

const LiveScoreboard = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const authContext = useAuth();
  const userRole = authContext?.userRole || null;

  useEffect(() => {
    if (!db) return;
    
    try {
      const q = query(collection(db, 'liveMatches'), where('status', '==', 'live'));
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLiveMatches(matches);
        },
        (error) => {
          console.error('Error fetching live matches:', error);
          setLiveMatches([]);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up live matches listener:', error);
      setLiveMatches([]);
    }
  }, []);

  const deleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete from liveMatches collection
      await deleteDoc(doc(db, 'liveMatches', matchId));
      
      // Find and delete from matches collection
      const matchesQuery = query(
        collection(db, 'matches'),
        where('liveMatchId', '==', matchId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      
      if (!matchesSnapshot.empty) {
        const matchDoc = matchesSnapshot.docs[0];
        await deleteDoc(doc(db, 'matches', matchDoc.id));
      }
      
      alert('Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match');
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'super';

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-6 h-6 text-red-500 animate-pulse" />
        <h2 className="text-2xl font-bold">Live Matches</h2>
        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
          LIVE
        </span>
      </div>

      {liveMatches.map(match => (
        <div key={match.id} className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{match.team1} vs {match.team2}</h3>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Over {match.currentOver || 0}</span>
              {isAdmin && (
                <button
                  onClick={() => deleteMatch(match.id)}
                  className="ml-2 bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
                  title="Delete Match"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="font-bold text-lg mb-2">{match.team1}</h4>
              <div className="text-3xl font-black">
                {match.matchData?.team1Score || 0}/{match.matchData?.team1Wickets || 0}
              </div>
              <div className="text-sm opacity-90">
                ({match.innings?.team1?.overs || 0}.{match.innings?.team1?.balls || 0} overs)
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="font-bold text-lg mb-2">{match.team2}</h4>
              <div className="text-3xl font-black">
                {match.matchData?.team2Score || 0}/{match.matchData?.team2Wickets || 0}
              </div>
              <div className="text-sm opacity-90">
                ({match.innings?.team2?.overs || 0}.{match.innings?.team2?.balls || 0} overs)
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
              Over {match.currentOver || 0}.{match.currentBall || 0}
            </span>
          </div>
        </div>
      ))}

      {liveMatches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No live matches at the moment</p>
        </div>
      )}
    </div>
  );
};

export default LiveScoreboard;