import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trophy, Target, Users, Activity, Calendar, Star, Medal, TrendingUp } from 'lucide-react';
import { useTournamentData } from '../hooks/useTournamentData';
import TeamDisplay from '../components/TeamDisplay';

// Helper function to generate initials from full name
const getPlayerInitials = (fullName) => {
  if (!fullName) return '??';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const CombinedStatsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('season'); // 'season' or 'career'
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [directData, setDirectData] = useState({
    matches: [],
    standings: [],
    teams: [],
    loading: true
  });
  
  const { topPerformers, standings: pointsTable, loading } = useTournamentData();
  const currentSeason = new Date().getFullYear().toString();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [playersSnapshot, statsSnapshot, matchesSnapshot, teamsSnapshot, standingsSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'standings'))
      ]);

      const playersData = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const statsData = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const matchesData = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const standingsData = standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setPlayerRegistrations(playersData);
      setPlayerStats(statsData);
      setDirectData({
        matches: matchesData,
        teams: teamsData,
        standings: standingsData,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setDirectData(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName) => {
    const player = playerRegistrations.find(p => 
      p.fullName?.toLowerCase() === playerName?.toLowerCase()
    );
    return player?.photoBase64 || null;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Trophy },
    { id: 'matches', name: 'Live Matches', icon: Calendar },
    { id: 'points', name: 'Points Table', icon: Target },
    { id: 'table', name: 'Player Table', icon: TrendingUp },
    { id: 'stats', name: 'Top Performers', icon: Users }
  ];

  if (directData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cricket-navy to-cricket-orange rounded-xl p-6 mb-8 text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Khajjidoni Premier League 2025</h1>
            <p className="text-white/90 mt-2">Complete Tournament Statistics</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto space-x-2 sm:space-x-8 px-2 sm:px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-cricket-orange text-cricket-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-6 text-center">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-lg sm:text-2xl font-bold text-blue-900">{playerStats.filter(p => p.matches > 0).length}</h3>
                    <p className="text-xs sm:text-sm text-blue-700">Active Players</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-6 text-center">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg sm:text-2xl font-bold text-green-900">{directData.matches.filter(m => m.status === 'completed').reduce((sum, match) => sum + (parseInt(match.team1Score?.runs) || 0) + (parseInt(match.team2Score?.runs) || 0), 0)}</h3>
                    <p className="text-xs sm:text-sm text-green-700">Total Runs</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-6 text-center">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="text-lg sm:text-2xl font-bold text-orange-900">{playerStats.reduce((sum, p) => sum + (p.wickets || 0), 0)}</h3>
                    <p className="text-xs sm:text-sm text-orange-700">Total Wickets</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-6 text-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-lg sm:text-2xl font-bold text-purple-900">{Math.max(...playerStats.map(p => p.highestScore || 0), 0)}</h3>
                    <p className="text-xs sm:text-sm text-purple-700">Highest Score</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Tournament Format</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div><span className="font-medium">Format:</span> Tennis Ball Cricket</div>
                    <div><span className="font-medium">Overs:</span> 8 per side</div>
                    <div><span className="font-medium">Teams:</span> {directData.teams.length || directData.standings.length || 'TBD'} teams</div>
                    <div><span className="font-medium">Matches:</span> League + Playoffs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                {/* Live Matches */}
                {directData.matches.filter(m => m.status === 'live').length > 0 ? (
                  <div className="bg-gradient-to-r from-red-50 to-pink-100 rounded-xl p-4 sm:p-6 shadow-lg border border-red-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                      <h3 className="text-lg sm:text-xl font-bold text-red-800 flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        Live Matches
                      </h3>
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse w-fit">LIVE</span>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {directData.matches.filter(m => m.status === 'live').map(match => (
                        <div key={match.id} className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <TeamDisplay teamName={match.team1} teams={directData.teams} size="sm" />
                                <div className="text-sm font-semibold text-gray-800">{match.team1Score?.runs || 0}/{match.team1Score?.wickets || 0}</div>
                              </div>
                            </div>
                            <div className="px-2 sm:px-4 text-red-600 font-bold text-sm sm:text-base">VS</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 sm:justify-end">
                                <TeamDisplay teamName={match.team2} teams={directData.teams} size="sm" />
                                <div className="text-sm font-semibold text-gray-800">{match.team2Score?.runs || 0}/{match.team2Score?.wickets || 0}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-red-50 to-pink-100 rounded-xl p-4 sm:p-6 shadow-lg border border-red-200">
                    <div className="text-center py-8 sm:py-12">
                      <div className="bg-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-red-800 mb-2">No Live Matches</h4>
                      <p className="text-sm sm:text-base text-red-700 max-w-md mx-auto px-4">Live match updates will appear here during active matches.</p>
                    </div>
                  </div>
                )}

                {/* Recent & Upcoming Matches */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Matches */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 sm:p-6 shadow-lg border border-green-200">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Recent Matches
                    </h3>
                    {directData.matches.filter(m => m.status === 'completed').slice(0, 3).map(match => (
                      <div key={match.id} className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="text-center">
                          <div className="text-sm font-semibold">{match.team1} vs {match.team2}</div>
                          <div className="text-xs text-gray-600 mt-1">{match.winner ? `${match.winner} won` : 'Completed'}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upcoming Matches */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Upcoming Matches
                    </h3>
                    {directData.matches.filter(m => m.status === 'upcoming').slice(0, 3).map(match => (
                      <div key={match.id} className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="text-center">
                          <div className="text-sm font-semibold">{match.team1} vs {match.team2}</div>
                          <div className="text-xs text-gray-600 mt-1">{match.date} {match.time && `at ${match.time}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Points Table Tab */}
            {activeTab === 'points' && (
              <div>
                {pointsTable && pointsTable.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-cricket-navy to-cricket-blue">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <Trophy className="mr-2" size={24} />
                        Points Table
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NRR</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pointsTable.map((team, index) => (
                            <tr key={team.teamName || index} className={`hover:bg-gray-50 ${
                              (index + 1) <= 4 ? 'bg-green-50 border-l-4 border-green-500' : ''
                            }`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-white' :
                                  index < 4 ? 'bg-green-500 text-white' :
                                  'bg-gray-400 text-white'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{team.teamName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{team.matchesPlayed || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600">{team.won || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">{team.lost || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{team.netRunRate || '0.000'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-xl font-bold text-cricket-navy">{team.points || 0}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Points Table Not Available</h3>
                    <p className="text-gray-500">Points table will appear once matches are played.</p>
                  </div>
                )}
              </div>
            )}

            {/* Player Table Tab */}
            {activeTab === 'table' && (
              <div>
                {/* View Mode Toggle */}
                <div className="bg-white rounded-lg shadow-lg mb-8">
                  <div className="border-b border-gray-200">
                    <nav className="flex justify-center space-x-8 p-4">
                      <button
                        onClick={() => setViewMode('season')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          viewMode === 'season'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Activity size={20} />
                        <span>Current Season ({currentSeason})</span>
                      </button>
                      <button
                        onClick={() => setViewMode('career')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          viewMode === 'career'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Trophy size={20} />
                        <span>Career Stats</span>
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Batsmen Section */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Trophy className="mr-2" size={24} /> Batsmen
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SR</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">4s/6s</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {playerStats
                          .filter(p => {
                            const runs = viewMode === 'season' ? (p.runs || 0) : (p.careerRuns || 0);
                            return runs > 0; // Show all players with runs
                          })
                          .sort((a, b) => {
                            const runsA = viewMode === 'season' ? (a.runs || 0) : (a.careerRuns || 0);
                            const runsB = viewMode === 'season' ? (b.runs || 0) : (b.careerRuns || 0);
                            return runsB - runsA;
                          })
                          .slice(0, 5) // Top 5 batsmen
                          .map((player, index) => {
                            const isCareer = viewMode === 'career';
                            const matches = isCareer ? (player.careerMatches || 0) : (player.matches || 0);
                            const runs = isCareer ? (player.careerRuns || 0) : (player.runs || 0);
                            const average = isCareer ? (player.careerAverage || (runs > 0 && matches > 0 ? (runs / matches).toFixed(2) : '0.00')) : (player.battingAverage || (runs > 0 && matches > 0 ? (runs / matches).toFixed(2) : '0.00'));
                            const strikeRate = isCareer ? (player.careerStrikeRate || '0.00') : (player.strikeRate || '0.00');
                            const fours = isCareer ? (player.careerFours || 0) : (player.fours || 0);
                            const sixes = isCareer ? (player.careerSixes || 0) : (player.sixes || 0);
                            const highestScore = isCareer ? (player.careerHighestScore || 0) : (player.highestScore || 0);
                            
                            return (
                              <tr key={player.id} className={`hover:bg-gray-50 ${
                                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                              }`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {index < 3 && (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2 ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        'bg-orange-600'
                                      }`}>
                                        {index + 1}
                                      </div>
                                    )}
                                    {index >= 3 && (
                                      <span className="text-gray-600 font-medium">{index + 1}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{player.name || player.playerName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {player.team || player.teamName}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{matches}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Target className="w-4 h-4 text-cricket-green mr-1" />
                                    <span className="font-semibold text-cricket-navy">{runs}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{average}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{strikeRate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="text-green-600 font-medium">{fours}</span>
                                  <span className="text-gray-400 mx-1">/</span>
                                  <span className="text-blue-600 font-medium">{sixes}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{highestScore}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bowlers Section */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                  <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-800">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Target className="mr-2" size={24} /> Bowlers
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wickets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Economy</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overs</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {playerStats
                          .filter(p => {
                            const wickets = viewMode === 'season' ? (p.wickets || 0) : (p.careerWickets || 0);
                            return wickets > 0; // Show all players with wickets
                          })
                          .sort((a, b) => {
                            const wicketsA = viewMode === 'season' ? (a.wickets || 0) : (a.careerWickets || 0);
                            const wicketsB = viewMode === 'season' ? (b.wickets || 0) : (b.careerWickets || 0);
                            return wicketsB - wicketsA;
                          })
                          .slice(0, 5) // Top 5 bowlers
                          .map((player, index) => {
                            const isCareer = viewMode === 'career';
                            const matches = isCareer ? (player.careerMatches || 0) : (player.matches || 0);
                            const wickets = isCareer ? (player.careerWickets || 0) : (player.wickets || 0);
                            const economy = isCareer ? (player.careerEconomy || '0.00') : (player.economy || '0.00');
                            const overs = isCareer ? (player.careerOvers || 0) : (player.overs || 0);
                            const bestBowling = isCareer ? (player.careerBestBowling || '0/0') : (player.bestBowling || '0/0');
                            
                            return (
                              <tr key={player.id} className={`hover:bg-gray-50 ${
                                index < 3 ? 'bg-gradient-to-r from-red-50 to-pink-50' : ''
                              }`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {index < 3 && (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2 ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        'bg-orange-600'
                                      }`}>
                                        {index + 1}
                                      </div>
                                    )}
                                    {index >= 3 && (
                                      <span className="text-gray-600 font-medium">{index + 1}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{player.name || player.playerName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    {player.team || player.teamName}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{matches}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Target className="w-4 h-4 text-red-600 mr-1" />
                                    <span className="font-semibold text-red-700">{wickets}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{economy}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{overs}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{bestBowling}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* All-Rounders Section */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-800">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Star className="mr-2" size={24} /> All-Rounders
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runs</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wickets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Economy</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {playerStats
                          .filter(p => {
                            const runs = viewMode === 'season' ? (p.runs || 0) : (p.careerRuns || 0);
                            const wickets = viewMode === 'season' ? (p.wickets || 0) : (p.careerWickets || 0);
                            return runs > 0 && wickets > 0; // Show all players with both runs and wickets
                          })
                          .sort((a, b) => {
                            const runsA = viewMode === 'season' ? (a.runs || 0) : (a.careerRuns || 0);
                            const wicketsA = viewMode === 'season' ? (a.wickets || 0) : (a.careerWickets || 0);
                            const runsB = viewMode === 'season' ? (b.runs || 0) : (b.careerRuns || 0);
                            const wicketsB = viewMode === 'season' ? (b.wickets || 0) : (b.careerWickets || 0);
                            return (runsB + wicketsB * 10) - (runsA + wicketsA * 10); // Combined contribution
                          })
                          .slice(0, 5) // Top 5 all-rounders
                          .map((player, index) => {
                            const isCareer = viewMode === 'career';
                            const matches = isCareer ? (player.careerMatches || 0) : (player.matches || 0);
                            const runs = isCareer ? (player.careerRuns || 0) : (player.runs || 0);
                            const average = isCareer ? (player.careerAverage || (runs > 0 && matches > 0 ? (runs / matches).toFixed(2) : '0.00')) : (player.battingAverage || (runs > 0 && matches > 0 ? (runs / matches).toFixed(2) : '0.00'));
                            const wickets = isCareer ? (player.careerWickets || 0) : (player.wickets || 0);
                            const economy = isCareer ? (player.careerEconomy || '0.00') : (player.economy || '0.00');
                            
                            return (
                              <tr key={player.id} className={`hover:bg-gray-50 ${
                                index < 3 ? 'bg-gradient-to-r from-green-50 to-emerald-50' : ''
                              }`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {index < 3 && (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2 ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        'bg-orange-600'
                                      }`}>
                                        {index + 1}
                                      </div>
                                    )}
                                    {index >= 3 && (
                                      <span className="text-gray-600 font-medium">{index + 1}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{player.name || player.playerName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    {player.team || player.teamName}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{matches}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Target className="w-4 h-4 text-cricket-green mr-1" />
                                    <span className="font-semibold text-cricket-navy">{runs}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{average}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Target className="w-4 h-4 text-red-600 mr-1" />
                                    <span className="font-semibold text-red-700">{wickets}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{economy}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  
                  {playerStats.filter(p => {
                    const runs = viewMode === 'season' ? (p.runs || 0) : (p.careerRuns || 0);
                    const wickets = viewMode === 'season' ? (p.wickets || 0) : (p.careerWickets || 0);
                    return runs > 0 && wickets > 0;
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <Star className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No all-rounders yet</h3>
                      <p className="mt-1 text-sm text-gray-500">All-rounders will appear here once players contribute with both bat and ball.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Performers Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Top Run Scorers */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 shadow-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      Top Batsmen
                    </h3>
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Leading Scorers</span>
                  </div>
                  {playerStats.filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 6).length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {playerStats.filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 6).map((player, index) => {
                        const playerPhoto = getPlayerPhoto(player.name || player.playerName);
                        return (
                          <div key={player.id} className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 transform hover:-translate-y-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full p-0.5 flex-shrink-0 shadow-xl">
                              {playerPhoto ? (
                                <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-3 border-white" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cricket-navy via-cricket-blue to-cricket-navy rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                  {getPlayerInitials(player.name || player.playerName)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight mb-1">{player.name || player.playerName}</h4>
                              <p className="text-xs sm:text-sm text-blue-600 font-semibold mb-2">{player.team || player.teamName}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold shadow-sm">Avg: {player.battingAverage || '0.00'}</span>
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold shadow-sm">M: {player.matches || 0}</span>
                                <span className="text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold shadow-sm">HS: {player.highestScore || 0}</span>
                                <span className="text-xs bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 px-2 py-1 rounded-full font-semibold shadow-sm">SR: {player.strikeRate || 0}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{player.runs}</p>
                              <p className="text-xs text-gray-500 font-bold tracking-wider">RUNS</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Trophy className="w-10 h-10 text-blue-500" />
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-2">No Batting Stats Yet</h4>
                      <p className="text-blue-700">Batting statistics will appear once matches are played!</p>
                    </div>
                  )}
                </div>

                {/* Top Wicket Takers */}
                <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 rounded-xl p-4 sm:p-6 shadow-xl border border-red-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-red-800 flex items-center">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      Top Bowlers
                    </h3>
                    <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Leading Wicket Takers</span>
                  </div>
                  {playerStats.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 6).length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {playerStats.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 6).map((player, index) => {
                        const playerPhoto = getPlayerPhoto(player.name || player.playerName);
                        return (
                          <div key={player.id} className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-100 hover:border-red-300 transform hover:-translate-y-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-full p-0.5 flex-shrink-0 shadow-xl">
                              {playerPhoto ? (
                                <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-3 border-white" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cricket-navy via-cricket-blue to-cricket-navy rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                  {getPlayerInitials(player.name || player.playerName)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight mb-1">{player.name || player.playerName}</h4>
                              <p className="text-xs sm:text-sm text-red-600 font-semibold mb-2">{player.team || player.teamName}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-xs bg-gradient-to-r from-red-100 to-red-200 text-red-800 px-2 py-1 rounded-full font-semibold shadow-sm">Econ: {player.economy || '0.00'}</span>
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold shadow-sm">M: {player.matches || 0}</span>
                                <span className="text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold shadow-sm">Ov: {player.overs || 0}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">{player.wickets}</p>
                              <p className="text-xs text-gray-500 font-bold tracking-wider">WICKETS</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Target className="w-10 h-10 text-red-500" />
                      </div>
                      <h4 className="text-lg font-semibold text-red-800 mb-2">No Bowling Stats Yet</h4>
                      <p className="text-red-700">Bowling statistics will appear once matches are played!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedStatsPage;