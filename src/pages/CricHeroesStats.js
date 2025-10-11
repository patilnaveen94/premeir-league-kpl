import React, { useState, useEffect } from 'react';
import { Trophy, Target, Users, TrendingUp, Award, Calendar, Star, Medal } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import dataSync from '../services/dataSync';

// Helper function to generate initials from full name
const getPlayerInitials = (fullName) => {
  if (!fullName) return '??';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const CricHeroesStats = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState({
    topRunScorers: [],
    topWicketTakers: [],
    bestBatsmen: [],
    bestBowlers: []
  });
  const [playerStats, setPlayerStats] = useState([]);
  const [pointsTable, setPointsTable] = useState([]);
  const [playerRegistrations, setPlayerRegistrations] = useState([]);

  useEffect(() => {
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    try {
      const [performers, stats, standings, playersSnapshot] = await Promise.all([
        dataSync.getTopPerformers(),
        dataSync.getSyncedPlayerStats(),
        dataSync.getSyncedStandings(),
        getDocs(collection(db, 'playerRegistrations'))
      ]);
      
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTopPerformers(performers);
      setPlayerStats(stats);
      setPointsTable(standings);
      setPlayerRegistrations(playersData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
    { id: 'stats', name: 'Player Stats', icon: Users }
  ];



  return (
    <div className="min-h-screen cricket-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Header */}
        <div className="bg-gradient-to-r from-cricket-navy to-cricket-orange rounded-xl p-6 mb-8 text-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Khajjidoni Premier League 2025</h1>
            <p className="text-white/90 mt-2">Tournament Statistics</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-cricket-orange text-cricket-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-blue-900">{playerStats.filter(p => p.matches > 0).length}</h3>
                    <p className="text-blue-700">Active Players</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-green-900">{playerStats.reduce((sum, p) => sum + (p.runs || 0), 0)}</h3>
                    <p className="text-green-700">Total Runs</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 text-center">
                    <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-orange-900">{playerStats.reduce((sum, p) => sum + (p.wickets || 0), 0)}</h3>
                    <p className="text-orange-700">Total Wickets</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
                    <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-purple-900">{Math.max(...playerStats.map(p => p.highestScore || 0), 0)}</h3>
                    <p className="text-purple-700">Highest Score</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Tournament Format</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Format:</span> T20</div>
                    <div><span className="font-medium">Overs:</span> 20 per side</div>
                    <div><span className="font-medium">Teams:</span> 8 teams</div>
                    <div><span className="font-medium">Matches:</span> League + Playoffs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Matches Tab */}
            {activeTab === 'matches' && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Live Matches Coming Soon</h3>
                <p className="text-gray-600">Live match updates will be available during tournament!</p>
              </div>
            )}

            {/* Points Table Tab */}
            {activeTab === 'points' && (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading points table...</p>
                  </div>
                ) : pointsTable.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg">
                      <thead className="bg-cricket-navy text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Pos</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Team</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">M</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">W</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">L</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">NRR</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pointsTable.map((team) => (
                          <tr key={team.teamName} className={team.position <= 4 ? 'bg-green-50' : 'bg-white'}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                team.position === 1 ? 'bg-yellow-500 text-white' :
                                team.position <= 4 ? 'bg-green-500 text-white' :
                                'bg-gray-300 text-gray-700'
                              }`}>
                                {team.position}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                              {team.position <= 4 && (
                                <div className="text-xs text-green-600">Qualified</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{team.matchesPlayed || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{team.won || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{team.lost || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                              <span className={`font-medium ${
                                parseFloat(team.netRunRate || 0) > 0 ? 'text-green-600' : 
                                parseFloat(team.netRunRate || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {team.netRunRate || '0.000'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className="text-lg font-bold text-cricket-navy">{team.points || 0}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
                    <p className="text-gray-600">Points table will appear once matches are played!</p>
                  </div>
                )}
              </div>
            )}

            {/* Player Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading player statistics...</p>
                  </div>
                ) : (
                  <>
                    {/* Top Run Scorers */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                        <Trophy className="w-6 h-6 mr-2" />
                        Top Run Scorers
                      </h3>
                      {topPerformers.topRunScorers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {topPerformers.topRunScorers.slice(0, 6).map((player, index) => {
                            const playerPhoto = getPlayerPhoto(player.name);
                            return (
                              <div key={player.playerId} className="bg-white rounded-lg p-4 flex items-center space-x-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-green-600'
                                }`}>
                                  {index + 1}
                                </div>
                                {playerPhoto ? (
                                  <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5 flex-shrink-0">
                                    <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {getPlayerInitials(player.name)}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{player.name}</h4>
                                  <p className="text-sm text-gray-600">{player.team}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-700">{player.runs}</p>
                                  <p className="text-xs text-gray-500">Avg: {player.average}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-green-700">No batting statistics available yet.</p>
                      )}
                    </div>

                    {/* Top Wicket Takers */}
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                        <Target className="w-6 h-6 mr-2" />
                        Top Wicket Takers
                      </h3>
                      {topPerformers.topWicketTakers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {topPerformers.topWicketTakers.slice(0, 6).map((player, index) => {
                            const playerPhoto = getPlayerPhoto(player.name);
                            return (
                              <div key={player.playerId} className="bg-white rounded-lg p-4 flex items-center space-x-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-red-600'
                                }`}>
                                  {index + 1}
                                </div>
                                {playerPhoto ? (
                                  <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5 flex-shrink-0">
                                    <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {getPlayerInitials(player.name)}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{player.name}</h4>
                                  <p className="text-sm text-gray-600">{player.team}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-red-700">{player.wickets}</p>
                                  <p className="text-xs text-gray-500">Econ: {player.economy}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-red-700">No bowling statistics available yet.</p>
                      )}
                    </div>

                    {/* Best Averages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                          <Star className="w-5 h-5 mr-2" />
                          Best Batting Averages
                        </h3>
                        {topPerformers.bestBatsmen.length > 0 ? (
                          <div className="space-y-3">
                            {topPerformers.bestBatsmen.slice(0, 5).map((player, index) => {
                              const playerPhoto = getPlayerPhoto(player.name);
                              return (
                                <div key={player.playerId} className="flex items-center bg-white rounded p-3 space-x-3">
                                  {playerPhoto ? (
                                    <div className="w-10 h-10 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5 flex-shrink-0">
                                      <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                      {getPlayerInitials(player.name)}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{player.name}</p>
                                    <p className="text-sm text-gray-600">{player.team}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-blue-700">{player.average}</p>
                                    <p className="text-xs text-gray-500">{player.runs} runs</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-blue-700">No qualified batsmen yet.</p>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                          <Medal className="w-5 h-5 mr-2" />
                          Best Economy Rates
                        </h3>
                        {topPerformers.bestBowlers.length > 0 ? (
                          <div className="space-y-3">
                            {topPerformers.bestBowlers.slice(0, 5).map((player, index) => {
                              const playerPhoto = getPlayerPhoto(player.name);
                              return (
                                <div key={player.playerId} className="flex items-center bg-white rounded p-3 space-x-3">
                                  {playerPhoto ? (
                                    <div className="w-10 h-10 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5 flex-shrink-0">
                                      <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                      {getPlayerInitials(player.name)}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{player.name}</p>
                                    <p className="text-sm text-gray-600">{player.team}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-purple-700">{player.economy}</p>
                                    <p className="text-xs text-gray-500">{player.wickets} wickets</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-purple-700">No qualified bowlers yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CricHeroesStats;