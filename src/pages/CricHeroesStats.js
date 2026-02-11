import React, { useState, useEffect } from 'react';
import { Trophy, Target, Users, TrendingUp, Award, Calendar, Star, Medal, ChevronDown } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useTournamentData } from '../hooks/useTournamentData';
import TeamDisplay from '../components/TeamDisplay';
// Season context removed

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
  const [selectedSeason, setSelectedSeason] = useState('current');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('season'); // 'season' or 'career'
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [directData, setDirectData] = useState({
    matches: [],
    standings: [],
    playerStats: [],
    teams: [],
    loading: true
  });
  
  // Season context removed - using default values
  const currentSeason = null;
  const publishedSeason = null;
  
  // Use centralized tournament data hook for consistent data
  const { topPerformers, playerStats, standings: pointsTable, loading } = useTournamentData();
  
  // Direct data fetching without season filters
  const fetchDirectData = async () => {
    try {
      console.log('🔄 Fetching stats data...');
      setDirectData(prev => ({ ...prev, loading: true }));
      
      const { fetchAllStatsData } = await import('../services/simpleStatsData');
      const data = await fetchAllStatsData();
      
      setDirectData(data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setDirectData(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Calculate top performers from player stats
  const calculateTopPerformers = (playerStats) => {
    if (viewMode === 'career') {
      // For career stats, aggregate by player name across all seasons
      const playerMap = new Map();
      
      playerStats.forEach(p => {
        const playerName = p.playerName || p.name || 'Unknown Player';
        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, {
            name: playerName,
            team: p.teamName || p.team || 'Unknown Team',
            runs: 0,
            wickets: 0,
            matches: 0,
            ballsFaced: 0,
            oversBowled: 0,
            runsConceded: 0,
            highestScore: 0
          });
        }
        
        const player = playerMap.get(playerName);
        player.runs += p.runs || 0;
        player.wickets += p.wickets || 0;
        player.matches += p.matches || 0;
        player.ballsFaced += p.ballsFaced || 0;
        player.oversBowled += p.overs || 0;
        player.runsConceded += p.runsConceded || 0;
        player.highestScore = Math.max(player.highestScore, p.highestScore || 0);
      });
      
      const aggregatedStats = Array.from(playerMap.values()).map(p => ({
        ...p,
        average: p.runs > 0 && p.matches > 0 ? (p.runs / p.matches).toFixed(2) : '0.00',
        strikeRate: p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(2) : '0.00',
        economy: p.oversBowled > 0 ? (p.runsConceded / p.oversBowled).toFixed(2) : '0.00'
      }));
      
      const topRunScorers = aggregatedStats
        .filter(p => p.runs > 0)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 10);
        
      const topWicketTakers = aggregatedStats
        .filter(p => p.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 10);
        
      const bestBatsmen = aggregatedStats
        .filter(p => p.runs >= 50 && p.matches >= 3)
        .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
        .slice(0, 5);
        
      const bestBowlers = aggregatedStats
        .filter(p => p.wickets >= 3 && p.oversBowled >= 5)
        .sort((a, b) => parseFloat(a.economy) - parseFloat(b.economy))
        .slice(0, 5);
        
      return { topRunScorers, topWicketTakers, bestBatsmen, bestBowlers };
    } else {
      // Season-specific stats
      const topRunScorers = playerStats
        .filter(p => p.runs > 0)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 10)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName || p.name || 'Unknown Player',
          team: p.teamName || p.team || 'Unknown Team',
          runs: p.runs,
          matches: p.matches,
          average: p.battingAverage,
          strikeRate: p.strikeRate,
          highestScore: p.highestScore
        }));
        
      const topWicketTakers = playerStats
        .filter(p => p.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 10)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName || p.name || 'Unknown Player',
          team: p.teamName || p.team || 'Unknown Team',
          wickets: p.wickets,
          matches: p.matches,
          economy: p.economy,
          overs: p.overs,
          bestBowling: p.bestBowling
        }));
        
      const bestBatsmen = playerStats
        .filter(p => p.runs >= 50 && p.matches >= 3)
        .sort((a, b) => parseFloat(b.battingAverage || 0) - parseFloat(a.battingAverage || 0))
        .slice(0, 5)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName || p.name || 'Unknown Player',
          team: p.teamName || p.team || 'Unknown Team',
          average: p.battingAverage,
          runs: p.runs
        }));
        
      const bestBowlers = playerStats
        .filter(p => p.wickets >= 3 && p.overs >= 5)
        .sort((a, b) => parseFloat(a.economy || 999) - parseFloat(b.economy || 999))
        .slice(0, 5)
        .map(p => ({
          playerId: p.playerId,
          name: p.playerName || p.name || 'Unknown Player',
          team: p.teamName || p.team || 'Unknown Team',
          economy: p.economy,
          wickets: p.wickets
        }));
        
      return { topRunScorers, topWicketTakers, bestBatsmen, bestBowlers };
    }
  };
  
  // Debug logging
  useEffect(() => {
    console.log('🏏 League Stats Debug:', {
      activeTab,
      hookLoading: loading,
      directLoading: directData.loading,
      hookPointsTableLength: pointsTable?.length || 0,
      directStandingsLength: directData.standings?.length || 0,
      directTeamsLength: directData.teams?.length || 0,
      directMatchesLength: directData.matches?.length || 0
    });
  }, [activeTab, loading, pointsTable, topPerformers, playerStats, directData]);

  useEffect(() => {
    fetchPlayerRegistrations();
    fetchDirectData();
  }, [activeTab]);

  // Refresh player registrations when tournament data updates
  useEffect(() => {
    if (!loading && topPerformers && playerStats) {
      fetchPlayerRegistrations();
    }
  }, [topPerformers, playerStats, loading]);

  const fetchPlayerRegistrations = async () => {
    try {
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayerRegistrations(playersData);
      console.log('✅ Player registrations refreshed:', playersData.length);
    } catch (error) {
      console.error('Error fetching player registrations:', error);
    }
  };

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName) => {
    const player = playerRegistrations.find(p => 
      p.fullName?.toLowerCase() === playerName?.toLowerCase()
    );
    return player?.photoBase64 || null;
  };
  
  // Use direct data for all tabs
  const currentData = {
    matches: directData.matches || [],
    standings: directData.standings || [],
    playerStats: directData.playerStats || [],
    topPerformers: directData.topPerformers,
    teams: directData.teams || [],
    loading: directData.loading
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
            <h1 className="text-3xl font-bold">Khajjidoni Premier League 2026</h1>
            <p className="text-white/90 mt-2">Tournament Statistics</p>
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
                    <h3 className="text-lg sm:text-2xl font-bold text-green-900">{currentData.matches.filter(m => m.status === 'completed').reduce((sum, match) => sum + (parseInt(match.team1Score?.runs) || 0) + (parseInt(match.team2Score?.runs) || 0), 0)}</h3>
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
                    <div><span className="font-medium">Teams:</span> {currentData.teams.length || currentData.standings.length || 'TBD'} teams</div>
                    <div><span className="font-medium">Matches:</span> League + Playoffs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                {currentData.loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading matches...</p>
                  </div>
                ) : (
                  <>
                    {/* Live Matches Section */}
                    {currentData.matches.filter(m => m.status === 'live').length > 0 ? (
                      <div className="bg-gradient-to-r from-red-50 to-pink-100 rounded-xl p-6 shadow-lg border border-red-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-red-800 flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                            Live Matches
                          </h3>
                          <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">LIVE</span>
                        </div>
                        <div className="space-y-4">
                          {currentData.matches.filter(m => m.status === 'live').map(match => (
                            <div key={match.id} className="bg-white rounded-lg p-4 shadow-md">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <TeamDisplay teamName={match.team1} teams={currentData.teams} size="md" />
                                  <div className="text-sm text-gray-600 mt-1 ml-13">{match.team1Score?.runs || 0}/{match.team1Score?.wickets || 0}</div>
                                </div>
                                <div className="px-4 text-red-600 font-bold">VS</div>
                                <div className="flex-1">
                                  <TeamDisplay teamName={match.team2} teams={currentData.teams} size="md" />
                                  <div className="text-sm text-gray-600 mt-1 ml-13">{match.team2Score?.runs || 0}/{match.team2Score?.wickets || 0}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-red-50 to-pink-100 rounded-xl p-6 shadow-lg border border-red-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-red-800 flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                            Live Matches
                          </h3>
                          <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">LIVE</span>
                        </div>
                        <div className="text-center py-12">
                          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Calendar className="w-10 h-10 text-red-500" />
                          </div>
                          <h4 className="text-lg font-semibold text-red-800 mb-2">No Live Matches</h4>
                          <p className="text-red-700 max-w-md mx-auto">Live match updates and real-time scores will appear here during active matches.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Recent Matches */}
                    {currentData.matches.filter(m => m.status === 'completed').length > 0 ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 sm:p-6 shadow-lg border border-green-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-green-800 flex items-center">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            Recent Matches
                          </h3>
                          <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium w-fit">Latest Results</span>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          {currentData.matches.filter(m => m.status === 'completed').slice(0, 5).map(match => (
                            <div key={match.id} className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <TeamDisplay teamName={match.team1} teams={currentData.teams} size="sm" />
                                    <div className="text-sm font-semibold text-gray-800">{match.team1Score?.runs || 0}/{match.team1Score?.wickets || 0}</div>
                                  </div>
                                </div>
                                <div className="px-2 sm:px-4 text-green-600 font-bold text-sm sm:text-base">VS</div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 sm:justify-end">
                                    <TeamDisplay teamName={match.team2} teams={currentData.teams} size="sm" />
                                    <div className="text-sm font-semibold text-gray-800">{match.team2Score?.runs || 0}/{match.team2Score?.wickets || 0}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center text-sm text-green-700 font-medium border-t border-green-100 pt-2">
                                {match.winner ? `${match.winner} won` : 'Match completed'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 sm:p-6 shadow-lg border border-green-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-green-800 flex items-center">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            Recent Matches
                          </h3>
                          <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium w-fit">Latest Results</span>
                        </div>
                        <div className="text-center py-8 sm:py-12">
                          <div className="bg-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                          </div>
                          <h4 className="text-base sm:text-lg font-semibold text-green-800 mb-2">No Recent Matches</h4>
                          <p className="text-sm sm:text-base text-green-700 max-w-md mx-auto px-4">Recent match results and scorecards will appear here once matches are completed.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Upcoming Matches */}
                    {currentData.matches.filter(m => m.status === 'upcoming').length > 0 ? (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            Upcoming Matches
                          </h3>
                          <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium w-fit">Fixtures</span>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          {currentData.matches.filter(m => m.status === 'upcoming').slice(0, 5).map(match => (
                            <div key={match.id} className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                                <div className="flex-1">
                                  <TeamDisplay teamName={match.team1} teams={currentData.teams} size="sm" />
                                </div>
                                <div className="px-2 sm:px-4 text-blue-600 font-bold text-sm sm:text-base">VS</div>
                                <div className="flex-1">
                                  <div className="sm:text-right">
                                    <TeamDisplay teamName={match.team2} teams={currentData.teams} size="sm" />
                                  </div>
                                </div>
                              </div>
                              <div className="text-center text-sm text-blue-700 border-t border-blue-100 pt-2">
                                {match.date} {match.time && `at ${match.time}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            Upcoming Matches
                          </h3>
                          <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium w-fit">Fixtures</span>
                        </div>
                        <div className="text-center py-8 sm:py-12">
                          <div className="bg-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                          </div>
                          <h4 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">No Scheduled Matches</h4>
                          <p className="text-sm sm:text-base text-blue-700 max-w-md mx-auto px-4">Tournament fixtures and match schedules will be displayed here once they are announced.</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Points Table Tab */}
            {activeTab === 'points' && (
              <div>
                {currentData.loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading points table...</p>
                  </div>
                ) : (
                  <>
                    {/* Debug Info */}
                    {console.log('Points Table Data:', { hook: pointsTable, direct: directData.standings, current: currentData.standings })}
                    
                    {currentData.standings && currentData.standings.length > 0 ? (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-blue-800 flex items-center">
                            <Trophy className="w-6 h-6 mr-2" />
                            Points Table
                          </h3>
                          <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Season {selectedSeason}</span>
                        </div>
                        
                        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                          <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white">
                              <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Pos</th>
                                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Team</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">M</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">W</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">L</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">NRR</th>
                                <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Pts</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {currentData.standings.map((team, index) => (
                                <tr key={team.teamName || index} className={`transition-all duration-300 hover:bg-blue-50 ${
                                  team.position <= 4 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white hover:bg-gray-50'
                                }`}>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md ${
                                      team.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                                      team.position <= 4 ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                      'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                    }`}>
                                      {team.position || index + 1}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div>
                                        <div className="text-sm font-bold text-gray-900">{team.teamName || 'Unknown Team'}</div>
                                        {team.position <= 4 && (
                                          <div className="text-xs text-green-600 font-semibold flex items-center">
                                            <Trophy className="w-3 h-3 mr-1" />
                                            Qualified
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold">{team.matchesPlayed || 0}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-600">{team.won || 0}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-600">{team.lost || 0}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`font-bold ${
                                      parseFloat(team.netRunRate || 0) > 0 ? 'text-green-600' : 
                                      parseFloat(team.netRunRate || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                      {team.netRunRate || '0.000'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center">
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                      {team.points || 0}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">
                            <span className="inline-flex items-center">
                              <Trophy className="w-4 h-4 mr-1 text-green-500" />
                              Top 4 teams qualify for playoffs
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-12 shadow-lg border border-gray-200">
                        <div className="text-center">
                          <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Trophy className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 mb-3">Points Table Not Available</h3>
                          <p className="text-gray-600 max-w-md mx-auto mb-4">
                            The points table will be displayed here once teams are created and matches are played.
                          </p>
                          <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
                            <p className="text-sm text-blue-700">
                              <strong>Debug Info:</strong> Hook: {pointsTable?.length || 0} teams, Direct: {directData.standings?.length || 0} teams, Teams: {directData.teams?.length || 0} teams
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Player Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* View Mode Toggle - Only in Player Stats Tab */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-md">
                      <button
                        onClick={() => setViewMode('season')}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          viewMode === 'season' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        Season Stats
                      </button>
                      <button
                        onClick={() => setViewMode('career')}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          viewMode === 'career' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        Career Stats
                      </button>
                    </div>
                    
                    {/* Season Selector - Only show for season view */}
                    {viewMode === 'season' && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                          className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-lg px-4 py-2 text-blue-700 font-medium flex items-center space-x-2 hover:bg-white transition-all duration-200 shadow-md"
                        >
                          <span>{selectedSeason === 'current' ? 'Current Season' : `Season ${selectedSeason}`}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSeasonDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showSeasonDropdown && (
                          <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[140px] z-50">
                            <button
                              onClick={() => {
                                setSelectedSeason('current');
                                setShowSeasonDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg ${
                                selectedSeason === 'current' ? 'bg-blue-600 text-white' : 'text-gray-700'
                              }`}
                            >
                              Current Season
                            </button>
                            {['1', '2'].map((season) => (
                              <button
                                key={season}
                                onClick={() => {
                                  setSelectedSeason(season);
                                  setShowSeasonDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 last:rounded-b-lg ${
                                  selectedSeason === season ? 'bg-blue-600 text-white' : 'text-gray-700'
                                }`}
                              >
                                Season {season}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {currentData.loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading player statistics...</p>
                  </div>
                ) : (
                  <>
                    {/* Top Run Scorers */}
                    <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 shadow-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center">
                          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                          Top Batsmen
                        </h3>
                        <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Leading Scorers</span>
                      </div>
                      {currentData.topPerformers?.topRunScorers?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          {currentData.topPerformers?.topRunScorers?.slice(0, 6).map((player, index) => {
                            const playerPhoto = getPlayerPhoto(player.name);
                            return (
                              <div key={player.playerId} className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 transform hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full p-0.5 flex-shrink-0 shadow-xl">
                                  {playerPhoto ? (
                                    <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-3 border-white" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-cricket-navy via-cricket-blue to-cricket-navy rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                      {getPlayerInitials(player.name)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight mb-1">{player.name}</h4>
                                  <p className="text-xs sm:text-sm text-blue-600 font-semibold mb-2">{player.team}</p>
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold shadow-sm">Avg: {player.average}</span>
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
                      {currentData.topPerformers?.topWicketTakers?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          {currentData.topPerformers?.topWicketTakers?.slice(0, 6).map((player, index) => {
                            const playerPhoto = getPlayerPhoto(player.name);
                            return (
                              <div key={player.playerId} className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-100 hover:border-red-300 transform hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-full p-0.5 flex-shrink-0 shadow-xl">
                                  {playerPhoto ? (
                                    <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-3 border-white" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-cricket-navy via-cricket-blue to-cricket-navy rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                      {getPlayerInitials(player.name)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight mb-1">{player.name}</h4>
                                  <p className="text-xs sm:text-sm text-red-600 font-semibold mb-2">{player.team}</p>
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <span className="text-xs bg-gradient-to-r from-red-100 to-red-200 text-red-800 px-2 py-1 rounded-full font-semibold shadow-sm">Econ: {player.economy}</span>
                                    <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold shadow-sm">M: {player.matches || 0}</span>
                                    <span className="text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold shadow-sm">Ov: {player.overs || 0}</span>
                                    <span className="text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-2 py-1 rounded-full font-semibold shadow-sm">Best: {player.bestBowling || '0/0'}</span>
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

                    {/* Best Averages */}
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-4 flex items-center">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Best Batting Averages
                        </h3>
                        {currentData.topPerformers?.bestBatsmen?.length > 0 ? (
                          <div className="space-y-3">
                            {currentData.topPerformers?.bestBatsmen?.slice(0, 5).map((player, index) => {
                              const playerPhoto = getPlayerPhoto(player.name);
                              return (
                                <div key={player.playerId} className="flex items-center bg-white rounded-lg p-3 space-x-3 shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full p-0.5 flex-shrink-0 shadow-md">
                                    {playerPhoto ? (
                                      <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-2 border-white" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                        {getPlayerInitials(player.name)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{player.name}</p>
                                    <p className="text-xs sm:text-sm text-blue-600 font-medium">{player.team}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-blue-700 text-lg">{player.average}</p>
                                    <p className="text-xs text-gray-500 font-medium">{player.runs} runs</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Star className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                            <p className="text-blue-700 text-sm">No qualified batsmen yet.</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-purple-800 mb-4 flex items-center">
                          <Medal className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Best Economy Rates
                        </h3>
                        {currentData.topPerformers?.bestBowlers?.length > 0 ? (
                          <div className="space-y-3">
                            {currentData.topPerformers?.bestBowlers?.slice(0, 5).map((player, index) => {
                              const playerPhoto = getPlayerPhoto(player.name);
                              return (
                                <div key={player.playerId} className="flex items-center bg-white rounded-lg p-3 space-x-3 shadow-sm hover:shadow-md transition-all duration-300 border border-purple-200">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full p-0.5 flex-shrink-0 shadow-md">
                                    {playerPhoto ? (
                                      <img src={playerPhoto} alt={player.name} className="w-full h-full object-cover rounded-full border-2 border-white" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                        {getPlayerInitials(player.name)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{player.name}</p>
                                    <p className="text-xs sm:text-sm text-purple-600 font-medium">{player.team}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-purple-700 text-lg">{player.economy}</p>
                                    <p className="text-xs text-gray-500 font-medium">{player.wickets} wickets</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Medal className="w-10 h-10 text-purple-300 mx-auto mb-3" />
                            <p className="text-purple-700 text-sm">No qualified bowlers yet.</p>
                          </div>
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