import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trophy, Star, Target, Save, X } from 'lucide-react';
import statsService from '../services/statsService';

const ComprehensiveScoring = ({ match, onClose, onUpdate }) => {
  const [matchData, setMatchData] = useState(match);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(match.tossWinner ? 'batting' : 'toss');

  // Initialize batting and bowling stats
  useEffect(() => {
    if (!matchData.battingStats) {
      const team1Batting = matchData.team1Players?.map(player => ({
        playerId: player.id,
        name: player.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        dismissalType: '',
        bowlerName: '',
        fielderName: '',
        fielder2Name: ''
      })) || [];

      const team2Batting = matchData.team2Players?.map(player => ({
        playerId: player.id,
        name: player.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        dismissalType: '',
        bowlerName: '',
        fielderName: '',
        fielder2Name: ''
      })) || [];

      // Add extras row for each team
      team1Batting.push({ playerId: 'extras', name: 'Extras (Wides, No-balls, Byes, Leg-byes)', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false, dismissalType: '', bowlerName: '', fielderName: '', fielder2Name: '' });
      team2Batting.push({ playerId: 'extras', name: 'Extras (Wides, No-balls, Byes, Leg-byes)', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false, dismissalType: '', bowlerName: '', fielderName: '', fielder2Name: '' });

      setMatchData(prev => ({
        ...prev,
        battingStats: {
          [matchData.team1]: team1Batting,
          [matchData.team2]: team2Batting
        }
      }));
    } else {
      // Ensure extras row exists for existing batting stats
      const updatedBattingStats = { ...matchData.battingStats };
      let needsUpdate = false;
      
      [matchData.team1, matchData.team2].forEach(team => {
        if (updatedBattingStats[team] && !updatedBattingStats[team].find(p => p.playerId === 'extras')) {
          updatedBattingStats[team].push({ 
            playerId: 'extras', 
            name: 'Extras (Wides, No-balls, Byes, Leg-byes)', 
            runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, 
            isOut: false, dismissalType: '', bowlerName: '', fielderName: '', fielder2Name: '' 
          });
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        setMatchData(prev => ({ ...prev, battingStats: updatedBattingStats }));
      }
    }

    if (!matchData.bowlingStats) {
      const team1Bowling = matchData.team1Players?.map(player => ({
        playerId: player.id,
        name: player.name,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0
      })) || [];

      const team2Bowling = matchData.team2Players?.map(player => ({
        playerId: player.id,
        name: player.name,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0
      })) || [];

      setMatchData(prev => ({
        ...prev,
        bowlingStats: {
          [matchData.team1]: team1Bowling,
          [matchData.team2]: team2Bowling
        }
      }));
    }
  }, [matchData.team1, matchData.team2, matchData.team1Players, matchData.team2Players]);

  const calculateStrikeRate = (runs, balls) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(2) : 0;
  };

  const calculateEconomy = (runs, overs) => {
    return overs > 0 ? (runs / overs).toFixed(2) : 0;
  };

  const getFieldingTeam = (battingTeam) => {
    return battingTeam === matchData.team1 ? matchData.team2 : matchData.team1;
  };

  const getFieldingPlayers = (battingTeam) => {
    const fieldingTeam = getFieldingTeam(battingTeam);
    return fieldingTeam === matchData.team1 ? matchData.team1Players : matchData.team2Players;
  };

  const updateBattingStats = useCallback((team, playerIndex, field, value) => {
    setMatchData(prev => {
      const newStats = { ...prev.battingStats };
      newStats[team][playerIndex][field] = value;
      
      // Auto-calculate strike rate
      if (field === 'runs' || field === 'balls') {
        const runs = field === 'runs' ? parseInt(value) || 0 : newStats[team][playerIndex].runs;
        const balls = field === 'balls' ? parseInt(value) || 0 : newStats[team][playerIndex].balls;
        newStats[team][playerIndex].strikeRate = calculateStrikeRate(runs, balls);
      }

      return { ...prev, battingStats: newStats };
    });
  }, []);

  const updateBowlingStats = useCallback((team, playerIndex, field, value) => {
    setMatchData(prev => {
      const newStats = { ...prev.bowlingStats };
      newStats[team][playerIndex][field] = value;
      
      // Auto-calculate economy
      if (field === 'runs' || field === 'overs') {
        const runs = field === 'runs' ? parseInt(value) || 0 : newStats[team][playerIndex].runs;
        const overs = field === 'overs' ? parseFloat(value) || 0 : newStats[team][playerIndex].overs;
        newStats[team][playerIndex].economy = calculateEconomy(runs, overs);
      }

      return { ...prev, bowlingStats: newStats };
    });
  }, []);

  const calculateTeamTotals = (team) => {
    const batting = matchData.battingStats?.[team] || [];
    const totalRuns = batting.reduce((sum, player) => sum + (parseInt(player.runs) || 0), 0);
    const totalWickets = batting.filter(player => player.isOut).length;
    const totalBalls = batting.reduce((sum, player) => sum + (parseInt(player.balls) || 0), 0);
    const overs = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    
    return { runs: totalRuns, wickets: totalWickets, overs: overs.toFixed(1) };
  };

  const getManOfTheMatch = () => {
    const allPlayers = [];
    
    // Add batting performances
    Object.keys(matchData.battingStats || {}).forEach(team => {
      matchData.battingStats[team].forEach(player => {
        const runs = parseInt(player.runs) || 0;
        const strikeRate = parseFloat(player.strikeRate) || 0;
        const score = runs + (strikeRate > 100 ? runs * 0.1 : 0);
        allPlayers.push({ ...player, team, score, type: 'batting' });
      });
    });

    // Add bowling performances
    Object.keys(matchData.bowlingStats || {}).forEach(team => {
      matchData.bowlingStats[team].forEach(player => {
        const wickets = parseInt(player.wickets) || 0;
        const economy = parseFloat(player.economy) || 0;
        const score = wickets * 20 + (economy < 6 ? (6 - economy) * 5 : 0);
        allPlayers.push({ ...player, team, score, type: 'bowling' });
      });
    });

    return allPlayers.sort((a, b) => b.score - a.score)[0];
  };

  const handleTossUpdate = async () => {
    try {
      await updateDoc(doc(db, 'matches', matchData.id), {
        tossWinner: matchData.tossWinner,
        tossChoice: matchData.tossChoice,
        status: 'live',
        updatedAt: new Date()
      });
      
      setActiveTab('batting');
      onUpdate?.();
      alert('Toss information updated successfully!');
    } catch (error) {
      console.error('Error updating toss:', error);
      alert('Error updating toss information');
    }
  };

  const saveMatch = async (finalStatus = null) => {
    if (saving) return;
    
    setSaving(true);
    try {
      const team1Totals = calculateTeamTotals(matchData.team1);
      const team2Totals = calculateTeamTotals(matchData.team2);
      const manOfTheMatch = getManOfTheMatch();

      const updatedMatchData = {
        ...matchData,
        battingStats: matchData.battingStats,
        bowlingStats: matchData.bowlingStats,
        team1Score: {
          runs: team1Totals.runs,
          wickets: team1Totals.wickets,
          oversDisplay: team1Totals.overs
        },
        team2Score: {
          runs: team2Totals.runs,
          wickets: team2Totals.wickets,
          oversDisplay: team2Totals.overs
        },
        manOfTheMatch: manOfTheMatch ? {
          name: manOfTheMatch.name,
          team: manOfTheMatch.team,
          performance: manOfTheMatch.type === 'batting' 
            ? `${manOfTheMatch.runs} runs (${manOfTheMatch.balls} balls, SR: ${manOfTheMatch.strikeRate})`
            : `${manOfTheMatch.wickets}/${manOfTheMatch.runs} (${manOfTheMatch.overs} overs, Econ: ${manOfTheMatch.economy})`
        } : null,
        status: finalStatus || matchData.status || 'live',
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'matches', matchData.id), updatedMatchData);
      
      // Only update stats when match is completed and not already processed
      if (finalStatus === 'completed' && matchData.status !== 'completed') {
        const { default: dataSync } = await import('../services/dataSync');
        await dataSync.syncMatchResult(updatedMatchData);
      }
      
      onUpdate?.();
      alert(finalStatus === 'completed' ? 'Match completed and stats updated!' : 'Match progress saved!');
      onClose?.();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error saving match. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{matchData.team1} vs {matchData.team2}</h2>
            <p className="text-gray-600">{matchData.date} • {matchData.venue}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Match Summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white rounded-lg p-4">
            <h3 className="font-semibold mb-2">{matchData.team1}</h3>
            <div className="text-2xl font-bold">
              {calculateTeamTotals(matchData.team1).runs}/{calculateTeamTotals(matchData.team1).wickets}
            </div>
            <div className="text-sm opacity-90">({calculateTeamTotals(matchData.team1).overs} overs)</div>
          </div>
          <div className="bg-gradient-to-r from-cricket-orange to-cricket-navy text-white rounded-lg p-4">
            <h3 className="font-semibold mb-2">{matchData.team2}</h3>
            <div className="text-2xl font-bold">
              {calculateTeamTotals(matchData.team2).runs}/{calculateTeamTotals(matchData.team2).wickets}
            </div>
            <div className="text-sm opacity-90">({calculateTeamTotals(matchData.team2).overs} overs)</div>
          </div>
        </div>

        {/* Man of the Match */}
        {getManOfTheMatch() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="text-yellow-600" size={20} />
              <h3 className="font-semibold text-yellow-800">Man of the Match</h3>
            </div>
            <p className="text-yellow-700">
              <strong>{getManOfTheMatch().name}</strong> ({getManOfTheMatch().team}) - {getManOfTheMatch().type === 'batting' 
                ? `${getManOfTheMatch().runs} runs (${getManOfTheMatch().balls} balls, SR: ${getManOfTheMatch().strikeRate})`
                : `${getManOfTheMatch().wickets}/${getManOfTheMatch().runs} (${getManOfTheMatch().overs} overs, Econ: ${getManOfTheMatch().economy})`}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('toss')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'toss'
                  ? 'border-cricket-green text-cricket-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Toss & Setup
            </button>
            <button
              onClick={() => setActiveTab('batting')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'batting'
                  ? 'border-cricket-green text-cricket-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Batting Scorecard
            </button>
            <button
              onClick={() => setActiveTab('bowling')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bowling'
                  ? 'border-cricket-green text-cricket-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bowling Figures
            </button>
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
                    value={matchData.tossWinner || ''}
                    onChange={(e) => setMatchData(prev => ({ ...prev, tossWinner: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cricket-orange focus:border-cricket-orange"
                  >
                    <option value="">Select Toss Winner</option>
                    <option value={matchData.team1}>{matchData.team1}</option>
                    <option value={matchData.team2}>{matchData.team2}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">What Did They Choose?</label>
                  <select
                    value={matchData.tossChoice || 'bat'}
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
                      ? `${matchData.tossWinner} will bat first, ${matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1} will bowl first`
                      : `${matchData.tossWinner} will bowl first, ${matchData.tossWinner === matchData.team1 ? matchData.team2 : matchData.team1} will bat first`
                    }
                  </div>
                </div>
              )}
              
              <button
                onClick={handleTossUpdate}
                disabled={!matchData.tossWinner}
                className="mt-4 bg-cricket-orange text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                {matchData.tossWinner ? 'Save Toss & Continue' : 'Select Toss Winner First'}
              </button>
            </div>
          </div>
        )}

        {/* Batting Scorecard */}
        {activeTab === 'batting' && (
          <div className="space-y-8">
            {[matchData.team1, matchData.team2].map(team => (
              <div key={team} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{team} Batting</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Batsman</th>
                        <th className="text-center py-2">Runs</th>
                        <th className="text-center py-2">Balls</th>
                        <th className="text-center py-2">4s</th>
                        <th className="text-center py-2">6s</th>
                        <th className="text-center py-2">SR</th>
                        <th className="text-center py-2">Out</th>
                        <th className="text-center py-2">Dismissal</th>
                        <th className="text-center py-2">Bowler</th>
                        <th className="text-center py-2">Fielder 1</th>
                        <th className="text-center py-2">Fielder 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matchData.battingStats?.[team] || []).map((player, index) => (
                        <tr key={player.playerId} className={`border-b border-gray-200 ${player.playerId === 'extras' ? 'bg-yellow-50' : ''}`}>
                          <td className={`py-2 font-medium ${player.playerId === 'extras' ? 'text-orange-700' : ''}`}>{player.name}</td>
                          <td className="text-center py-2">
                            <input
                              type="number"
                              value={player.runs}
                              onChange={(e) => updateBattingStats(team, index, 'runs', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <input
                                type="number"
                                value={player.balls}
                                onChange={(e) => updateBattingStats(team, index, 'balls', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                min="0"
                              />
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <input
                                type="number"
                                value={player.fours}
                                onChange={(e) => updateBattingStats(team, index, 'fours', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                min="0"
                              />
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <input
                                type="number"
                                value={player.sixes}
                                onChange={(e) => updateBattingStats(team, index, 'sixes', e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                min="0"
                              />
                            )}
                          </td>
                          <td className="text-center py-2 font-medium">
                            {player.playerId === 'extras' ? <span className="text-gray-400">-</span> : player.strikeRate}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={player.isOut}
                                onChange={(e) => updateBattingStats(team, index, 'isOut', e.target.checked)}
                                className="rounded"
                              />
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <select
                                value={player.dismissalType}
                                onChange={(e) => updateBattingStats(team, index, 'dismissalType', e.target.value)}
                                className="w-24 px-1 py-1 border rounded text-xs"
                                disabled={!player.isOut}
                              >
                                <option value="">-</option>
                                <option value="bowled">Bowled</option>
                                <option value="caught">Caught</option>
                                <option value="lbw">LBW</option>
                                <option value="runout">Run Out</option>
                                <option value="stumped">Stumped</option>
                                <option value="retired">Retired</option>
                              </select>
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <select
                                value={player.bowlerName}
                                onChange={(e) => updateBattingStats(team, index, 'bowlerName', e.target.value)}
                                className="w-20 px-1 py-1 border rounded text-xs"
                                disabled={!player.isOut || player.dismissalType === 'retired'}
                              >
                                <option value="">-</option>
                                {getFieldingPlayers(team)?.map(fieldingPlayer => (
                                  <option key={fieldingPlayer.id} value={fieldingPlayer.name}>
                                    {fieldingPlayer.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <select
                                value={player.fielderName}
                                onChange={(e) => updateBattingStats(team, index, 'fielderName', e.target.value)}
                                className="w-20 px-1 py-1 border rounded text-xs"
                                disabled={!player.isOut || !['caught', 'runout', 'stumped'].includes(player.dismissalType)}
                              >
                                <option value="">-</option>
                                {getFieldingPlayers(team)?.map(fieldingPlayer => (
                                  <option key={fieldingPlayer.id} value={fieldingPlayer.name}>
                                    {fieldingPlayer.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="text-center py-2">
                            {player.playerId === 'extras' ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <select
                                value={player.fielder2Name}
                                onChange={(e) => updateBattingStats(team, index, 'fielder2Name', e.target.value)}
                                className="w-20 px-1 py-1 border rounded text-xs"
                                disabled={!player.isOut || player.dismissalType !== 'runout'}
                              >
                                <option value="">-</option>
                                {getFieldingPlayers(team)?.map(fieldingPlayer => (
                                  <option key={fieldingPlayer.id} value={fieldingPlayer.name}>
                                    {fieldingPlayer.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-lg font-bold">
                    Total: {calculateTeamTotals(team).runs}/{calculateTeamTotals(team).wickets} ({calculateTeamTotals(team).overs} overs)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bowling Figures */}
        {activeTab === 'bowling' && (
          <div className="space-y-8">
            {[matchData.team1, matchData.team2].map(team => (
              <div key={team} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{team} Bowling</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Bowler</th>
                        <th className="text-center py-2">Overs</th>
                        <th className="text-center py-2">Maidens</th>
                        <th className="text-center py-2">Runs</th>
                        <th className="text-center py-2">Wickets</th>
                        <th className="text-center py-2">Economy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matchData.bowlingStats?.[team] || []).map((player, index) => (
                        <tr key={player.playerId} className="border-b border-gray-200">
                          <td className="py-2 font-medium">{player.name}</td>
                          <td className="text-center py-2">
                            <input
                              type="number"
                              step="0.1"
                              value={player.overs}
                              onChange={(e) => updateBowlingStats(team, index, 'overs', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="text-center py-2">
                            <input
                              type="number"
                              value={player.maidens}
                              onChange={(e) => updateBowlingStats(team, index, 'maidens', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="text-center py-2">
                            <input
                              type="number"
                              value={player.runs}
                              onChange={(e) => updateBowlingStats(team, index, 'runs', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="text-center py-2">
                            <input
                              type="number"
                              value={player.wickets}
                              onChange={(e) => updateBowlingStats(team, index, 'wickets', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="text-center py-2 font-medium">{player.economy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => !saving && saveMatch('live')}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Progress'}</span>
          </button>
          <button
            onClick={() => {
              if (!saving && window.confirm('Are you sure you want to complete this match? This will update player statistics and cannot be undone.')) {
                saveMatch('completed');
              }
            }}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trophy size={16} />
            <span>{saving ? 'Completing...' : 'Complete Match'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveScoring;