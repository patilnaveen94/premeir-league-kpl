import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trophy, Users, Target, Clock, Plus, Save, RotateCcw } from 'lucide-react';

const DetailedMatchScoring = ({ match, onClose, onUpdate }) => {
  const [matchData, setMatchData] = useState({
    tossWinner: '',
    tossChoice: 'bat',
    currentInnings: 1,
    team1Score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
    team2Score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
    team1Batting: [],
    team2Batting: [],
    team1Bowling: [],
    team2Bowling: [],
    status: 'upcoming'
  });

  const [activeTab, setActiveTab] = useState('toss');
  const [currentBatsman1, setCurrentBatsman1] = useState('');
  const [currentBatsman2, setCurrentBatsman2] = useState('');
  const [currentBowler, setCurrentBowler] = useState('');
  const [ballScore, setBallScore] = useState('');

  useEffect(() => {
    if (match) {
      // Initialize match data with player stats
      const team1Players = match.team1Players?.map(player => ({
        ...player,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        status: 'not out',
        dismissalType: '',
        bowlerOut: '',
        fielderOut: ''
      })) || [];

      const team2Players = match.team2Players?.map(player => ({
        ...player,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        status: 'not out',
        dismissalType: '',
        bowlerOut: '',
        fielderOut: ''
      })) || [];

      const team1Bowlers = match.team2Players?.map(player => ({
        ...player,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        economy: 0,
        wides: 0,
        noBalls: 0
      })) || [];

      const team2Bowlers = match.team1Players?.map(player => ({
        ...player,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        maidens: 0,
        economy: 0,
        wides: 0,
        noBalls: 0
      })) || [];

      setMatchData(prev => ({
        ...prev,
        team1Batting: team1Players,
        team2Batting: team2Players,
        team1Bowling: team1Bowlers,
        team2Bowling: team2Bowlers
      }));
    }
  }, [match]);

  const handleTossUpdate = async () => {
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        tossWinner: matchData.tossWinner,
        tossChoice: matchData.tossChoice,
        status: 'live',
        updatedAt: new Date()
      });
      
      setMatchData(prev => ({ ...prev, status: 'live' }));
      setActiveTab('scoring');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating toss:', error);
      alert('Error updating toss information');
    }
  };

  const updateBallScore = (runs, extras = {}) => {
    const battingTeam = matchData.currentInnings === 1 ? 'team1' : 'team2';
    const bowlingTeam = matchData.currentInnings === 1 ? 'team2' : 'team1';
    
    // Update batsman stats
    const batsmanIndex = matchData[`${battingTeam}Batting`].findIndex(p => p.id === currentBatsman1);
    if (batsmanIndex !== -1) {
      const updatedBatting = [...matchData[`${battingTeam}Batting`]];
      updatedBatting[batsmanIndex] = {
        ...updatedBatting[batsmanIndex],
        runs: updatedBatting[batsmanIndex].runs + runs,
        balls: updatedBatting[batsmanIndex].balls + (extras.wide || extras.noBall ? 0 : 1),
        fours: updatedBatting[batsmanIndex].fours + (runs === 4 ? 1 : 0),
        sixes: updatedBatting[batsmanIndex].sixes + (runs === 6 ? 1 : 0)
      };
      
      // Calculate strike rate
      if (updatedBatting[batsmanIndex].balls > 0) {
        updatedBatting[batsmanIndex].strikeRate = 
          ((updatedBatting[batsmanIndex].runs / updatedBatting[batsmanIndex].balls) * 100).toFixed(2);
      }
      
      setMatchData(prev => ({
        ...prev,
        [`${battingTeam}Batting`]: updatedBatting
      }));
    }

    // Update bowler stats
    const bowlerIndex = matchData[`${bowlingTeam}Bowling`].findIndex(p => p.id === currentBowler);
    if (bowlerIndex !== -1) {
      const updatedBowling = [...matchData[`${bowlingTeam}Bowling`]];
      updatedBowling[bowlerIndex] = {
        ...updatedBowling[bowlerIndex],
        runs: updatedBowling[bowlerIndex].runs + runs + (extras.wide || 0) + (extras.noBall || 0),
        balls: updatedBowling[bowlerIndex].balls + (extras.wide || extras.noBall ? 0 : 1),
        wides: updatedBowling[bowlerIndex].wides + (extras.wide || 0),
        noBalls: updatedBowling[bowlerIndex].noBalls + (extras.noBall || 0)
      };
      
      // Calculate overs and economy
      updatedBowling[bowlerIndex].overs = Math.floor(updatedBowling[bowlerIndex].balls / 6);
      const remainingBalls = updatedBowling[bowlerIndex].balls % 6;
      updatedBowling[bowlerIndex].oversDisplay = `${updatedBowling[bowlerIndex].overs}.${remainingBalls}`;
      
      if (updatedBowling[bowlerIndex].balls > 0) {
        const totalOvers = updatedBowling[bowlerIndex].balls / 6;
        updatedBowling[bowlerIndex].economy = (updatedBowling[bowlerIndex].runs / totalOvers).toFixed(2);
      }
      
      setMatchData(prev => ({
        ...prev,
        [`${bowlingTeam}Bowling`]: updatedBowling
      }));
    }

    // Update team score
    const teamScore = matchData[`${battingTeam}Score`];
    const newBalls = teamScore.balls + (extras.wide || extras.noBall ? 0 : 1);
    const newOvers = Math.floor(newBalls / 6);
    const remainingBalls = newBalls % 6;
    
    setMatchData(prev => ({
      ...prev,
      [`${battingTeam}Score`]: {
        ...teamScore,
        runs: teamScore.runs + runs + (extras.wide || 0) + (extras.noBall || 0),
        balls: newBalls,
        overs: newOvers,
        oversDisplay: `${newOvers}.${remainingBalls}`
      }
    }));
  };

  const handleWicket = (dismissalType, bowlerOut, fielderOut = '') => {
    const battingTeam = matchData.currentInnings === 1 ? 'team1' : 'team2';
    const bowlingTeam = matchData.currentInnings === 1 ? 'team2' : 'team1';
    
    // Update batsman status
    const batsmanIndex = matchData[`${battingTeam}Batting`].findIndex(p => p.id === currentBatsman1);
    if (batsmanIndex !== -1) {
      const updatedBatting = [...matchData[`${battingTeam}Batting`]];
      updatedBatting[batsmanIndex] = {
        ...updatedBatting[batsmanIndex],
        status: 'out',
        dismissalType,
        bowlerOut,
        fielderOut,
        balls: updatedBatting[batsmanIndex].balls + 1
      };
      
      setMatchData(prev => ({
        ...prev,
        [`${battingTeam}Batting`]: updatedBatting,
        [`${battingTeam}Score`]: {
          ...prev[`${battingTeam}Score`],
          wickets: prev[`${battingTeam}Score`].wickets + 1,
          balls: prev[`${battingTeam}Score`].balls + 1
        }
      }));
    }

    // Update bowler wickets
    if (bowlerOut && ['bowled', 'lbw', 'caught'].includes(dismissalType)) {
      const bowlerIndex = matchData[`${bowlingTeam}Bowling`].findIndex(p => p.id === bowlerOut);
      if (bowlerIndex !== -1) {
        const updatedBowling = [...matchData[`${bowlingTeam}Bowling`]];
        updatedBowling[bowlerIndex] = {
          ...updatedBowling[bowlerIndex],
          wickets: updatedBowling[bowlerIndex].wickets + 1
        };
        
        setMatchData(prev => ({
          ...prev,
          [`${bowlingTeam}Bowling`]: updatedBowling
        }));
      }
    }

    // Reset current batsman
    setCurrentBatsman1('');
  };

  const saveMatchData = async () => {
    try {
      await updateDoc(doc(db, 'matches', match.id), {
        ...matchData,
        updatedAt: new Date()
      });
      
      // Update player statistics in separate collection
      await updatePlayerStats();
      
      onUpdate?.();
      alert('Match data saved successfully!');
    } catch (error) {
      console.error('Error saving match data:', error);
      alert('Error saving match data');
    }
  };

  const updatePlayerStats = async () => {
    try {
      // Update batting stats
      for (const player of [...matchData.team1Batting, ...matchData.team2Batting]) {
        if (player.balls > 0) {
          const statsRef = collection(db, 'playerStats');
          const q = query(statsRef, where('playerId', '==', player.id));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            // Create new stats
            await addDoc(statsRef, {
              playerId: player.id,
              playerName: player.name,
              matches: 1,
              runs: player.runs,
              balls: player.balls,
              fours: player.fours,
              sixes: player.sixes,
              average: player.runs,
              strikeRate: player.strikeRate,
              highestScore: player.runs,
              notOuts: player.status === 'not out' ? 1 : 0,
              createdAt: new Date()
            });
          } else {
            // Update existing stats
            const doc = querySnapshot.docs[0];
            const existingStats = doc.data();
            
            await updateDoc(doc.ref, {
              matches: existingStats.matches + 1,
              runs: existingStats.runs + player.runs,
              balls: existingStats.balls + player.balls,
              fours: existingStats.fours + player.fours,
              sixes: existingStats.sixes + player.sixes,
              notOuts: existingStats.notOuts + (player.status === 'not out' ? 1 : 0),
              highestScore: Math.max(existingStats.highestScore, player.runs),
              updatedAt: new Date()
            });
          }
        }
      }

      // Update bowling stats
      for (const player of [...matchData.team1Bowling, ...matchData.team2Bowling]) {
        if (player.balls > 0) {
          const statsRef = collection(db, 'bowlingStats');
          const q = query(statsRef, where('playerId', '==', player.id));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(statsRef, {
              playerId: player.id,
              playerName: player.name,
              matches: 1,
              overs: player.balls / 6,
              runs: player.runs,
              wickets: player.wickets,
              economy: player.economy,
              bestFigures: `${player.wickets}/${player.runs}`,
              createdAt: new Date()
            });
          } else {
            const doc = querySnapshot.docs[0];
            const existingStats = doc.data();
            
            await updateDoc(doc.ref, {
              matches: existingStats.matches + 1,
              overs: existingStats.overs + (player.balls / 6),
              runs: existingStats.runs + player.runs,
              wickets: existingStats.wickets + player.wickets,
              updatedAt: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  };

  const tabs = [
    { id: 'toss', name: 'Toss & Setup', icon: RotateCcw },
    { id: 'scoring', name: 'Live Scoring', icon: Target },
    { id: 'batting', name: 'Batting Stats', icon: Users },
    { id: 'bowling', name: 'Bowling Stats', icon: Trophy }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {match.team1} vs {match.team2} - Detailed Scoring
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-cricket-orange text-cricket-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Toss & Setup Tab */}
        {activeTab === 'toss' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Toss Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Who Won the Toss?</label>
                  <select
                    value={matchData.tossWinner}
                    onChange={(e) => setMatchData(prev => ({ ...prev, tossWinner: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cricket-orange focus:border-cricket-orange"
                  >
                    <option value="">Select Toss Winner</option>
                    <option value={match.team1}>{match.team1}</option>
                    <option value={match.team2}>{match.team2}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">What Did They Choose?</label>
                  <select
                    value={matchData.tossChoice}
                    onChange={(e) => setMatchData(prev => ({ ...prev, tossChoice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cricket-orange focus:border-cricket-orange"
                    disabled={!matchData.tossWinner}
                  >
                    <option value="bat">Chose to Bat First</option>
                    <option value="bowl">Chose to Bowl First</option>
                  </select>
                </div>
              </div>
              
              {matchData.tossWinner && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span className="font-semibold text-cricket-orange">{matchData.tossWinner}</span>
                    <span>won the toss and chose to</span>
                    <span className="font-semibold text-cricket-orange">
                      {matchData.tossChoice === 'bat' ? 'bat first' : 'bowl first'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {matchData.tossChoice === 'bat' 
                      ? `${matchData.tossWinner} will bat first, ${matchData.tossWinner === match.team1 ? match.team2 : match.team1} will bowl first`
                      : `${matchData.tossWinner} will bowl first, ${matchData.tossWinner === match.team1 ? match.team2 : match.team1} will bat first`
                    }
                  </div>
                </div>
              )}
              
              <button
                onClick={handleTossUpdate}
                disabled={!matchData.tossWinner}
                className="mt-4 bg-cricket-orange text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                {matchData.tossWinner ? 'Start Match' : 'Select Toss Winner First'}
              </button>
            </div>
          </div>
        )}

        {/* Live Scoring Tab */}
        {activeTab === 'scoring' && matchData.status === 'live' && (
          <div className="space-y-6">
            {/* Current Score Display */}
            <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white rounded-lg p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <h4 className="text-lg font-semibold">{match.team1}</h4>
                  <p className="text-3xl font-bold">
                    {matchData.team1Score.runs}/{matchData.team1Score.wickets}
                  </p>
                  <p className="text-sm">({matchData.team1Score.oversDisplay || '0.0'} overs)</p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold">{match.team2}</h4>
                  <p className="text-3xl font-bold">
                    {matchData.team2Score.runs}/{matchData.team2Score.wickets}
                  </p>
                  <p className="text-sm">({matchData.team2Score.oversDisplay || '0.0'} overs)</p>
                </div>
              </div>
            </div>

            {/* Current Players */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Batsman 1</label>
                <select
                  value={currentBatsman1}
                  onChange={(e) => setCurrentBatsman1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Batsman</option>
                  {matchData[matchData.currentInnings === 1 ? 'team1Batting' : 'team2Batting']
                    .filter(p => p.status === 'not out')
                    .map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Batsman 2</label>
                <select
                  value={currentBatsman2}
                  onChange={(e) => setCurrentBatsman2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Batsman</option>
                  {matchData[matchData.currentInnings === 1 ? 'team1Batting' : 'team2Batting']
                    .filter(p => p.status === 'not out' && p.id !== currentBatsman1)
                    .map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bowler</label>
                <select
                  value={currentBowler}
                  onChange={(e) => setCurrentBowler(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Bowler</option>
                  {matchData[matchData.currentInnings === 1 ? 'team2Bowling' : 'team1Bowling']
                    .map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Scoring Buttons */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Ball Scoring</h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                {[0, 1, 2, 3, 4, 6].map(runs => (
                  <button
                    key={runs}
                    onClick={() => updateBallScore(runs)}
                    className={`px-4 py-2 rounded-md font-semibold ${
                      runs === 0 ? 'bg-gray-200 text-gray-800' :
                      runs === 4 ? 'bg-green-500 text-white' :
                      runs === 6 ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}
                  >
                    {runs}
                  </button>
                ))}
                <button
                  onClick={() => updateBallScore(1, { wide: 1 })}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold"
                >
                  WD
                </button>
                <button
                  onClick={() => updateBallScore(1, { noBall: 1 })}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md font-semibold"
                >
                  NB
                </button>
              </div>

              {/* Wicket Options */}
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-2">Wicket</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['bowled', 'caught', 'lbw', 'run out', 'stumped', 'hit wicket'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleWicket(type, currentBowler)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md text-sm capitalize"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batting Stats Tab */}
        {activeTab === 'batting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">{match.team1} Batting</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Runs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Balls</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">4s/6s</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matchData.team1Batting.map(player => (
                        <tr key={player.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {player.name}
                            {player.status === 'out' && (
                              <div className="text-xs text-red-600">{player.dismissalType}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.runs}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.balls}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.fours}/{player.sixes}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.strikeRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">{match.team2} Batting</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Runs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Balls</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">4s/6s</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matchData.team2Batting.map(player => (
                        <tr key={player.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {player.name}
                            {player.status === 'out' && (
                              <div className="text-xs text-red-600">{player.dismissalType}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.runs}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.balls}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.fours}/{player.sixes}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.strikeRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bowling Stats Tab */}
        {activeTab === 'bowling' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">{match.team2} Bowling</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bowler</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Overs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Runs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Wickets</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matchData.team1Bowling.map(player => (
                        <tr key={player.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{player.name}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.oversDisplay || '0.0'}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.runs}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.wickets}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.economy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">{match.team1} Bowling</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bowler</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Overs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Runs</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Wickets</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matchData.team2Bowling.map(player => (
                        <tr key={player.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{player.name}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.oversDisplay || '0.0'}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.runs}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.wickets}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">{player.economy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
          <button
            onClick={saveMatchData}
            className="flex items-center space-x-2 bg-cricket-orange text-white px-6 py-2 rounded-md"
          >
            <Save size={16} />
            <span>Save Match Data</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedMatchScoring;