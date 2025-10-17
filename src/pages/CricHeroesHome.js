import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, TrendingUp, Clock, MapPin } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import cricHeroesService from '../services/cricHeroesService';
import { formatMatchDate } from '../utils/dateUtils';

// Helper function to generate initials from full name
const getPlayerInitials = (fullName) => {
  if (!fullName) return '??';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const CricHeroesHome = () => {
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topPerformers, setTopPerformers] = useState({ batsmen: [], bowlers: [] });
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchPlayerRegistrations();
  }, []);

  const fetchPlayerRegistrations = async () => {
    try {
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayerRegistrations(playersData);
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

  const fetchHomeData = async () => {
    try {
      const [pastMatches, upcoming, leaderboard] = await Promise.all([
        cricHeroesService.getPastMatches(),
        cricHeroesService.getUpcomingMatches(),
        cricHeroesService.getLeaderboard()
      ]);

      setRecentMatches(pastMatches.matches?.slice(0, 3) || []);
      setUpcomingMatches(upcoming.matches?.slice(0, 3) || []);
      setTopPerformers({
        batsmen: leaderboard.batsmen?.slice(0, 3) || [],
        bowlers: leaderboard.bowlers?.slice(0, 3) || []
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { name: 'Matches', path: '/stats', icon: Calendar, color: 'bg-blue-500' },
    { name: 'Leaderboard', path: '/stats', icon: Trophy, color: 'bg-yellow-500' },
    { name: 'Points Table', path: '/stats', icon: TrendingUp, color: 'bg-green-500' },
    { name: 'Stats', path: '/stats', icon: Users, color: 'bg-purple-500' }
  ];



  return (
    <div className="min-h-screen cricket-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-cricket-navy mb-4">
            Khajjidoni Premier League 2025
          </h1>
          <p className="text-xl text-gray-600">Tournament Dashboard</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`${link.color} text-white p-4 md:p-6 rounded-xl text-center hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl`}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                <p className="font-medium text-sm md:text-base">{link.name}</p>
              </Link>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-orange"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Matches */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Matches</h2>
                  <Link to="/stats" className="text-cricket-orange hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match, index) => {
                      const gradients = [
                        'from-green-500 to-emerald-600',
                        'from-blue-500 to-cyan-600', 
                        'from-purple-500 to-pink-600'
                      ];
                      const gradient = gradients[index % gradients.length];
                      
                      return (
                        <div key={match.id} className={`bg-gradient-to-r ${gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
                            <h3 className="font-bold text-lg mb-2 sm:mb-0">{match.team1} vs {match.team2}</h3>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                              {formatMatchDate(match.date)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                              <p className="text-sm font-medium">{match.team1}: <span className="font-bold">{match.team1Score?.runs || 0}/{match.team1Score?.wickets || 0}</span></p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                              <p className="text-sm font-medium">{match.team2}: <span className="font-bold">{match.team2Score?.runs || 0}/{match.team2Score?.wickets || 0}</span></p>
                            </div>
                          </div>
                          <p className="font-bold text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">{match.result || 'Match completed'}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent matches</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Matches */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Matches</h2>
                  <Link to="/stats" className="text-cricket-orange hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match, index) => {
                      const gradients = [
                        'from-blue-500 to-purple-600',
                        'from-green-500 to-teal-600', 
                        'from-orange-500 to-red-600'
                      ];
                      const gradient = gradients[index % gradients.length];
                      
                      return (
                        <div key={match.id} className={`bg-gradient-to-r ${gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
                            <h3 className="font-bold text-lg mb-2 sm:mb-0">{match.team1} vs {match.team2}</h3>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                              {formatMatchDate(match.date)}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{match.time || 'TBD'}</span>
                            </div>
                            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="truncate">{match.venue}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No upcoming matches</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Top Batsmen */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Batsmen</h2>
                  <Link to="/stats" className="text-cricket-orange hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {topPerformers.batsmen.length > 0 ? (
                    topPerformers.batsmen.map((player, index) => {
                      const playerPhoto = getPlayerPhoto(player.playerName);
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full p-0.5 flex-shrink-0 shadow-md">
                            {playerPhoto ? (
                              <img src={playerPhoto} alt={player.playerName} className="w-full h-full object-cover rounded-full border-2 border-white" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                {getPlayerInitials(player.playerName)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{player.playerName}</p>
                            <p className="text-sm text-gray-600">Team</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-cricket-orange">{player.runs} runs</p>
                            <p className="text-xs text-gray-500">Avg: {player.average} | SR: {player.strikeRate}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No batting statistics yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Bowlers */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Bowlers</h2>
                  <Link to="/stats" className="text-cricket-orange hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {topPerformers.bowlers.length > 0 ? (
                    topPerformers.bowlers.map((player, index) => {
                      const playerPhoto = getPlayerPhoto(player.playerName);
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full p-0.5 flex-shrink-0 shadow-md">
                            {playerPhoto ? (
                              <img src={playerPhoto} alt={player.playerName} className="w-full h-full object-cover rounded-full border-2 border-white" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                {getPlayerInitials(player.playerName)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{player.playerName}</p>
                            <p className="text-sm text-gray-600">Team</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-cricket-navy">{player.wickets} wickets</p>
                            <p className="text-xs text-gray-500">Avg: {player.average} | Eco: {player.economy}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No bowling statistics yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CricHeroesHome;