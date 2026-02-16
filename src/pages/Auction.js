import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAdmin } from '../context/AdminContext';
import auctionService from '../services/auctionService';
import careerStatsService from '../services/careerStatsService';
// Current season service removed
import { normalizePlayerName } from '../utils/playerUtils';
import { Gavel, Users, Trophy, Target, Calendar, DollarSign, X, Edit, ArrowUp, Star, Award } from 'lucide-react';

const Auction = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({});
  const [careerStats, setCareerStats] = useState({});
  const [currentSeason, setCurrentSeason] = useState('Season 1');
  const [auctionVisible, setAuctionVisible] = useState(true);

  const { isAdminLoggedIn } = useAdmin();

  useEffect(() => {
    fetchAuctionData();
    fetchAuctionVisibility();
  }, []);

  const fetchAuctionVisibility = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      const auctionSetting = settingsSnapshot.docs.find(doc => doc.id === 'auctionSection');
      setAuctionVisible(auctionSetting?.data()?.visible !== false);
    } catch (error) {
      console.error('Error fetching auction visibility:', error);
    }
  };





  const fetchAuctionData = async () => {
    try {
      console.log('🔄 Fetching auction data...');
      
      // Fetch data including careerStats collection
      const [allPlayersSnapshot, teamsSnapshot, statsSnapshot, careerStatsSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'careerStats'))
      ]);
      
      // Process career stats from careerStats collection
      const careerStatsFromDB = {};
      careerStatsSnapshot.docs.forEach(doc => {
        const stats = doc.data();
        if (stats.name) {
          careerStatsFromDB[stats.name] = stats;
        }
      });
      
      console.log('📊 Career stats from DB:', Object.keys(careerStatsFromDB).length, 'players');
      console.log('📊 Sample career stats:', Object.values(careerStatsFromDB).slice(0, 3));
      
      setCurrentSeason('Current Season');

      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const statsData = {};
      statsSnapshot.docs.forEach(doc => {
        statsData[doc.data().name] = doc.data();
      });

      // Process ALL players with career stats (including linked stats by phone)
      const allPlayers = allPlayersSnapshot.docs.map(doc => {
        const data = doc.data();
        const normalizedName = normalizePlayerName(data.fullName);
        
        // Try to get career stats from careerStats collection
        let playerCareerStats = careerStatsFromDB[normalizedName] || careerStatsFromDB[data.fullName] || {};
        
        // If no stats found by name but has linked stats, try linked name
        if (!playerCareerStats.totalMatches && data.linkedStatsName) {
          playerCareerStats = careerStatsFromDB[data.linkedStatsName] || {};
        }
        
        // If still no stats and has phone, try to find stats by phone
        if (!playerCareerStats.totalMatches && data.phone) {
          const phoneStats = Object.values(careerStatsFromDB).find(stats => stats.phone === data.phone);
          if (phoneStats) {
            playerCareerStats = phoneStats;
          }
        }
        
        return {
          id: doc.id,
          ...data,
          auctionStatus: data.teamId ? 'sold' : 'unsold',
          soldTo: data.teamId ? teamsData.find(t => t.id === data.teamId)?.name : null,
          // Career stats (linked by phone if available)
          careerMatches: playerCareerStats.totalMatches || 0,
          careerRuns: playerCareerStats.totalRuns || 0,
          careerWickets: playerCareerStats.totalWickets || 0,
          careerAverage: playerCareerStats.battingAverage || '0.00',
          careerStrikeRate: playerCareerStats.strikeRate || '0.00',
          careerHighestScore: playerCareerStats.highestScore || 0,
          careerBestBowling: playerCareerStats.bestBowling || '0/0',
          seasonsPlayed: playerCareerStats.seasonsPlayed || [],
          hasLinkedStats: !!playerCareerStats.totalMatches
        };
      });

      console.log(`📊 Total players in database: ${allPlayers.length}`);
      console.log(`📊 Approved players: ${allPlayers.filter(p => p.status === 'approved').length}`);
      console.log(`📊 Players with linked stats: ${allPlayers.filter(p => p.hasLinkedStats).length}`);
      console.log(`📊 Players without stats: ${allPlayers.filter(p => !p.hasLinkedStats).length}`);
      
      // Show ALL approved players regardless of season
      const currentSeasonPlayers = allPlayers.filter(player => {
        return player.status === 'approved';
      });
      
      console.log(`🎯 Showing ${currentSeasonPlayers.length} approved players for auction`);
      
      setPlayers(currentSeasonPlayers);
      setTeams(teamsData);
      setPlayerStats(statsData);
      setCareerStats(careerStatsFromDB);
      
    } catch (error) {
      console.error('❌ Error fetching auction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlayersToSeason1 = async () => {
    try {
      const playersNeedingUpdate = players.filter(p => p.needsSeasonUpdate);
      console.log(`Updating ${playersNeedingUpdate.length} players to Season 1...`);
      
      const updates = playersNeedingUpdate.map(player => 
        updateDoc(doc(db, 'playerRegistrations', player.id), {
          season: 'Season 1',
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updates);
      console.log('✅ All players updated to Season 1');
      
      // Refresh data
      fetchAuctionData();
    } catch (error) {
      console.error('❌ Error updating players:', error);
    }
  };

  const handlePlayerAssignment = async (playerId, teamId) => {
    try {
      const result = await auctionService.updatePlayerAuction(playerId, teamId);
      
      if (result.success) {
        // Update local state
        setPlayers(prev => prev.map(player => 
          player.id === playerId 
            ? { 
                ...player, 
                teamId, 
                auctionStatus: teamId ? 'sold' : 'unsold',
                soldTo: teamId ? teams.find(t => t.id === teamId)?.name : null
              }
            : player
        ));

        setShowPlayerModal(false);
        alert('Player assignment updated successfully!');
      } else {
        alert('Error updating player assignment: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating player assignment:', error);
      alert('Error updating player assignment');
    }
  };

  const getPlayerInitials = (fullName) => {
    if (!fullName) return '??';
    const names = fullName.trim().split(' ');
    return names.length === 1 
      ? names[0].charAt(0).toUpperCase()
      : (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const filteredPlayers = players.filter(player => {
    const statusMatch = statusFilter === 'all' || player.auctionStatus === statusFilter;
    return statusMatch;
  });
  
  console.log(`🎯 Filtered players: ${filteredPlayers.length} (${statusFilter} status)`);

  const soldPlayers = filteredPlayers.filter(p => p.auctionStatus === 'sold');
  const unsoldPlayers = filteredPlayers.filter(p => p.auctionStatus === 'unsold');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auction data...</p>
        </div>
      </div>
    );
  }

  if (!auctionVisible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Available</h1>
            <p className="text-gray-600">The auction section is currently not available. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
          {/* Sponsor Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-green-600/80 px-4 py-2 rounded-full border-2 border-yellow-400">
              <span className="text-lg">🌾</span>
              <span className="text-sm font-bold text-white">Powered by John Deere</span>
              <span className="text-lg">🌾</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold flex items-center">
                <Gavel className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mr-2 sm:mr-3 md:mr-4" />
                Player Auction
              </h1>
              <p className="text-orange-100 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg lg:text-xl">Khajjidoni Premier League - Powered by John Deere</p>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">{filteredPlayers.length}</div>
              <div className="text-orange-100 text-xs sm:text-sm md:text-base lg:text-lg">Available Players</div>
              <div className="text-xs text-orange-200 mt-1">{filteredPlayers.filter(p => p.hasLinkedStats).length} with previous stats</div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls with Modern Design */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-100">
          <div className="space-y-8">
            {/* Status Filter Only */}
            <div>
              <label className="block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 uppercase tracking-wide">Player Status</label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { value: 'all', label: 'All Players', gradient: 'from-blue-500 to-purple-600', icon: '👥' },
                  { value: 'sold', label: 'Sold', gradient: 'from-green-500 to-emerald-600', icon: '✅' },
                  { value: 'unsold', label: 'Available', gradient: 'from-orange-500 to-red-600', icon: '🎯' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 lg:py-5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 flex-shrink-0 ${
                      statusFilter === status.value
                        ? `bg-gradient-to-r ${status.gradient} text-white shadow-xl`
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md border-2 border-gray-200'
                    }`}
                  >
                    <span className="flex items-center space-x-1 sm:space-x-2">
                      <span>{status.icon}</span>
                      <span className="whitespace-nowrap">{status.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl">👥</span>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">{players.length}</div>
                    <div className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg font-medium">Total Players</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl">✅</span>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">{soldPlayers.length}</div>
                    <div className="text-green-100 text-xs sm:text-sm md:text-base lg:text-lg font-medium">Sold</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl">⏳</span>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">{unsoldPlayers.length}</div>
                    <div className="text-gray-100 text-xs sm:text-sm md:text-base lg:text-lg font-medium">Unsold</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl">🏆</span>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">{Math.round((soldPlayers.length / filteredPlayers.length) * 100) || 0}%</div>
                    <div className="text-purple-100 text-xs sm:text-sm md:text-base lg:text-lg font-medium">Sold Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Players Grid with Colorful Professional Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {filteredPlayers.map((player) => {
            // Dynamic gradient colors based on status and career performance
            const getCardGradient = () => {
              if (player.auctionStatus === 'sold') {
                return 'from-emerald-400 via-green-500 to-teal-600';
              }
              // Color based on career performance for unsold players
              const careerRuns = player.careerRuns || 0;
              if (careerRuns > 200) return 'from-purple-400 via-pink-500 to-red-500';
              if (careerRuns > 100) return 'from-blue-400 via-indigo-500 to-purple-600';
              if (careerRuns > 50) return 'from-orange-400 via-amber-500 to-yellow-600';
              return 'from-gray-400 via-slate-500 to-gray-600';
            };
            
            return (
              <div
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player);
                  setShowPlayerModal(true);
                }}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-3 hover:rotate-1 overflow-hidden border-2 border-gray-100 hover:border-transparent"
              >
                {/* Card Header with Dynamic Gradient - Photo Focused */}
                <div className={`bg-gradient-to-br ${getCardGradient()} p-0 relative overflow-hidden`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full translate-y-8 -translate-x-8"></div>
                  
                  {/* Large Photo Section */}
                  <div className="relative z-10 flex flex-col items-center justify-center pt-6 pb-4">
                    {player.photoBase64 ? (
                      <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full border-4 sm:border-6 border-white shadow-2xl overflow-hidden ring-4 sm:ring-6 ring-white ring-opacity-40 flex-shrink-0 mb-4">
                        <img
                          src={player.photoBase64}
                          alt={player.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 sm:border-6 border-white shadow-2xl ring-4 sm:ring-6 ring-white ring-opacity-40 flex-shrink-0 mb-4">
                        <span className="text-white font-bold text-5xl sm:text-6xl lg:text-7xl">
                          {getPlayerInitials(player.fullName)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center text-white px-4 pb-4">
                      <h3 className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl leading-tight drop-shadow-lg mb-1" title={player.fullName}>
                        {player.fullName.length > 25 ? player.fullName.substring(0, 25) + '...' : player.fullName}
                      </h3>
                      <p className="text-white text-opacity-90 text-sm sm:text-base md:text-lg font-medium mb-3">{player.position}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs sm:text-sm md:text-base bg-white bg-opacity-20 px-3 py-1 rounded-full">
                          {player.careerMatches || 0} matches
                        </span>
                        {player.seasonsPlayed && player.seasonsPlayed.length > 0 && (
                          <span className="text-xs bg-white bg-opacity-30 px-3 py-1 rounded-full flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {player.seasonsPlayed.length} seasons
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body with Enhanced Design */}
                <div className="p-4 sm:p-5 lg:p-6">
                  {player.soldTo && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-200 shadow-inner">
                      <p className="text-sm font-bold text-green-800 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                        <span className="text-green-900 flex-shrink-0">Sold to: </span>
                        <span className="text-green-700 ml-1 truncate team-name-safe">{player.soldTo}</span>
                      </p>
                    </div>
                  )}

                  {/* Enhanced Career Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-blue-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{player.careerRuns || 0}</div>
                      <div className="text-blue-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Runs</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-red-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">{player.careerWickets || 0}</div>
                      <div className="text-red-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Wkts</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-purple-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-600">{player.careerMatches || 0}</div>
                      <div className="text-purple-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Mat</div>
                    </div>
                  </div>
                  
                  {/* Career Performance Indicators */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-2 border border-orange-200">
                      <div className="text-xs sm:text-sm md:text-base text-orange-600 font-bold uppercase tracking-wide mb-1">Avg</div>
                      <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-orange-700">{player.careerAverage || '0.00'}</div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg sm:rounded-xl p-2 border border-teal-200">
                      <div className="text-xs sm:text-sm md:text-base text-teal-600 font-bold uppercase tracking-wide mb-1">HS</div>
                      <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-teal-700">{player.careerHighestScore || 0}</div>
                    </div>
                  </div>
                  
                  {/* Additional Career Stats */}
                  {(player.careerMatches > 0) && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-indigo-600 font-semibold">Career SR: {player.careerStrikeRate || '0.00'}</span>
                        {player.careerBestBowling !== '0/0' && (
                          <span className="text-purple-600 font-semibold">Best: {player.careerBestBowling}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Users className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">No Players Found</h3>
            <p className="text-gray-600 text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6">No players match the selected status filter.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-blue-800 text-sm sm:text-base md:text-lg">
                💡 Try selecting "All Players" to see all available players.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Player Details Modal with Side-by-Side Layout */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-7xl shadow-2xl border border-gray-100 overflow-hidden" style={{ maxHeight: '90vh' }}>
            {/* Close Button */}
            <button
              onClick={() => setShowPlayerModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 bg-white rounded-full p-3 transition-all duration-300 hover:bg-gray-100 z-20 touch-manipulation shadow-lg"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Side - Photo Section */}
              <div className={`bg-gradient-to-br ${
                selectedPlayer.auctionStatus === 'sold' 
                  ? 'from-emerald-500 via-green-500 to-teal-600'
                  : 'from-purple-500 via-pink-500 to-red-500'
              } p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden lg:w-2/5 min-h-[400px] lg:min-h-auto`}>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center w-full">
                  {selectedPlayer.photoBase64 ? (
                    <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border-6 border-white shadow-2xl overflow-hidden ring-4 ring-white ring-opacity-40 flex-shrink-0 mb-6">
                      <img
                        src={selectedPlayer.photoBase64}
                        alt={selectedPlayer.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-6 border-white shadow-2xl ring-4 ring-white ring-opacity-40 flex-shrink-0 mb-6">
                      <span className="text-white font-bold text-8xl md:text-9xl lg:text-[120px]">
                        {getPlayerInitials(selectedPlayer.fullName)}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center w-full">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg text-white">{selectedPlayer.fullName}</h2>
                    <div className="flex flex-wrap justify-center items-center gap-2 mb-3">
                      {selectedPlayer.position && (
                        <span className="text-white text-opacity-90 text-sm md:text-base font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                          {selectedPlayer.position}
                        </span>
                      )}
                      {selectedPlayer.preferredHand && (
                        <span className="text-white text-opacity-90 text-sm md:text-base font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                          {selectedPlayer.preferredHand}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <span className={`inline-block px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg ${
                        selectedPlayer.auctionStatus === 'sold' 
                          ? 'bg-green-600 bg-opacity-90 text-white'
                          : 'bg-gray-600 bg-opacity-90 text-white'
                      }`}>
                        {selectedPlayer.auctionStatus === 'sold' ? '✅ SOLD' : '⏳ AVAILABLE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Stats Section */}
              <div className="lg:w-3/5 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 60px)' }}>
                {selectedPlayer.soldTo && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-200 shadow-md">
                    <div className="flex items-center">
                      <Trophy className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Sold to</p>
                        <p className="text-lg md:text-xl font-bold text-green-700">{selectedPlayer.soldTo}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Career Stats Grid - Compact */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 text-lg md:text-xl mb-4 flex items-center">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-2 flex-shrink-0" />
                    Career Statistics
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-2xl md:text-3xl font-bold">{selectedPlayer.careerRuns || 0}</div>
                      <div className="text-blue-100 font-bold text-xs md:text-sm uppercase tracking-wide">Runs</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-2xl md:text-3xl font-bold">{selectedPlayer.careerWickets || 0}</div>
                      <div className="text-red-100 font-bold text-xs md:text-sm uppercase tracking-wide">Wickets</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-2xl md:text-3xl font-bold">{selectedPlayer.careerMatches || 0}</div>
                      <div className="text-green-100 font-bold text-xs md:text-sm uppercase tracking-wide">Matches</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-2xl md:text-3xl font-bold">{selectedPlayer.careerAverage || '0.00'}</div>
                      <div className="text-purple-100 font-bold text-xs md:text-sm uppercase tracking-wide">Average</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-xl md:text-2xl font-bold">{selectedPlayer.careerStrikeRate || '0.00'}</div>
                      <div className="text-orange-100 font-bold text-xs md:text-sm uppercase tracking-wide">Strike Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-4 rounded-xl text-white shadow-md">
                      <div className="text-xl md:text-2xl font-bold">{selectedPlayer.careerHighestScore || 0}</div>
                      <div className="text-teal-100 font-bold text-xs md:text-sm uppercase tracking-wide">Highest Score</div>
                    </div>
                  </div>
                </div>

                {/* Career Highlights */}
                {(selectedPlayer.careerBestBowling !== '0/0' || selectedPlayer.seasonsPlayed?.length > 0) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <h5 className="font-bold text-indigo-800 text-sm md:text-base mb-3 flex items-center">
                      <Award className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                      Highlights
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPlayer.careerBestBowling !== '0/0' && (
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold text-purple-700">{selectedPlayer.careerBestBowling}</div>
                          <div className="text-xs md:text-sm text-purple-600 font-medium">Best Bowling</div>
                        </div>
                      )}
                      {selectedPlayer.seasonsPlayed?.length > 0 && (
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold text-indigo-700">{selectedPlayer.seasonsPlayed.length}</div>
                          <div className="text-xs md:text-sm text-indigo-600 font-medium">Seasons</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {isAdminLoggedIn && (
                  <div className="border-t-2 border-gray-200 pt-6">
                    <h4 className="font-bold text-gray-900 text-lg md:text-xl mb-4 flex items-center">
                      <Edit className="w-5 h-5 md:w-6 md:h-6 text-orange-600 mr-2 flex-shrink-0" />
                      Admin Actions
                    </h4>
                    <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-xl p-4 border-2 border-orange-200 shadow-md">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-orange-800 mb-2 uppercase tracking-wide">
                            🏆 Assign to Team
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePlayerAssignment(selectedPlayer.id, e.target.value);
                              }
                            }}
                            className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm md:text-base font-semibold shadow-md"
                            defaultValue=""
                          >
                            <option value="">Select Team</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {selectedPlayer.teamId && (
                          <button
                            onClick={() => handlePlayerAssignment(selectedPlayer.id, null)}
                            className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            ❌ Mark as Unsold
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowPlayerModal(false)}
                    className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Auction;