import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAdmin } from '../context/AdminContext';
import auctionService from '../services/auctionService';
import { Gavel, Users, Trophy, Target, Calendar, DollarSign, X, Edit, ArrowUp } from 'lucide-react';

const Auction = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('Season 1');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({});

  const { isAdminLoggedIn } = useAdmin();

  useEffect(() => {
    fetchAuctionData();
  }, [selectedSeason]);





  const fetchAuctionData = async () => {
    try {
      console.log('🔄 Fetching auction data...');
      
      // Fetch ALL players directly from Firebase to debug count issue
      const [allPlayersSnapshot, teamsSnapshot, statsSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'playerStats'))
      ]);

      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const statsData = {};
      statsSnapshot.docs.forEach(doc => {
        statsData[doc.data().name] = doc.data();
      });

      // Process ALL players and assign default season
      const allPlayers = allPlayersSnapshot.docs.map(doc => {
        const data = doc.data();
        const playerStats = statsData[data.fullName] || {};
        return {
          id: doc.id,
          ...data,
          season: data.season || 'Season 1', // Default all to Season 1
          needsSeasonUpdate: !data.season, // Flag for players needing season update
          auctionStatus: data.teamId ? 'sold' : 'unsold',
          soldTo: data.teamId ? teamsData.find(t => t.id === data.teamId)?.name : null,
          matches: playerStats.matches || 0,
          runs: playerStats.runs || 0,
          wickets: playerStats.wickets || 0,
          average: playerStats.average || '0.00',
          strikeRate: playerStats.strikeRate || '0.00'
        };
      });

      console.log('🔍 DETAILED PLAYER COUNT DEBUG:');
      console.log(`📊 Total players in database: ${allPlayers.length}`);
      console.log(`✅ Approved players: ${allPlayers.filter(p => p.status === 'approved').length}`);
      console.log(`⏳ Pending players: ${allPlayers.filter(p => p.status === 'pending').length}`);
      console.log(`❌ Rejected players: ${allPlayers.filter(p => p.status === 'rejected').length}`);
      console.log(`🏆 Season 1 players: ${allPlayers.filter(p => (p.season || 'Season 1') === 'Season 1').length}`);
      console.log(`🏆 Season 2 players: ${allPlayers.filter(p => p.season === 'Season 2').length}`);
      console.log(`👥 Players with teams: ${allPlayers.filter(p => p.teamId).length}`);
      console.log(`🆓 Players without teams: ${allPlayers.filter(p => !p.teamId).length}`);
      
      // For Season 1, show ALL players (including those without season assigned)
      const seasonPlayers = selectedSeason === 'Season 1' 
        ? allPlayers // Show all players for Season 1
        : allPlayers.filter(player => player.season === selectedSeason);
      
      console.log(`🎯 Final result: Showing ${seasonPlayers.length} players for ${selectedSeason}`);
      
      setPlayers(seasonPlayers);
      setTeams(teamsData);
      setPlayerStats(statsData);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold flex items-center">
                <Gavel className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mr-2 sm:mr-3 md:mr-4" />
                Player Auction
              </h1>
              <p className="text-orange-100 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg lg:text-xl">Khajjidoni Premier League Player Auction System</p>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">{filteredPlayers.length}</div>
              <div className="text-orange-100 text-xs sm:text-sm md:text-base lg:text-lg">Total Players</div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls with Modern Design */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-100">
          {/* Season Update Notice */}
          {players.filter(p => p.needsSeasonUpdate).length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-800 font-medium">
                    📋 {players.filter(p => p.needsSeasonUpdate).length} players need season assignment
                  </p>
                  <p className="text-yellow-600 text-sm">Click to assign all unassigned players to Season 1</p>
                </div>
                <button
                  onClick={updatePlayersToSeason1}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Update All to Season 1
                </button>
              </div>
            </div>
          )}
          <div className="space-y-8">
            {/* Season & Status Selection Row */}
            <div className="space-y-6">
              {/* Season Selection with Gradient Buttons */}
              <div>
                <label className="block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 uppercase tracking-wide">Tournament Season</label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {['Season 1', 'Season 2'].map(season => (
                    <button
                      key={season}
                      onClick={() => setSelectedSeason(season)}
                      className={`px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 lg:py-5 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-300 flex-shrink-0 ${
                        selectedSeason === season
                          ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white shadow-xl'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-lg'
                      }`}
                    >
                      <span className="flex items-center space-x-1 sm:space-x-2">
                        <span>🏆</span>
                        <span className="whitespace-nowrap">{season}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter with Colorful Buttons */}
              <div>
                <label className="block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 uppercase tracking-wide">Player Status</label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { value: 'all', label: 'All', gradient: 'from-blue-500 to-purple-600', icon: '👥' },
                    { value: 'sold', label: 'Sold', gradient: 'from-green-500 to-emerald-600', icon: '✅' },
                    { value: 'unsold', label: 'Unsold', gradient: 'from-gray-500 to-slate-600', icon: '⏳' }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredPlayers.map((player) => {
            const stats = playerStats[player.fullName] || {};
            
            // Dynamic gradient colors based on status and performance
            const getCardGradient = () => {
              if (player.auctionStatus === 'sold') {
                return 'from-emerald-400 via-green-500 to-teal-600';
              }
              // Color based on performance for unsold players
              const totalRuns = stats.runs || 0;
              if (totalRuns > 100) return 'from-purple-400 via-pink-500 to-red-500';
              if (totalRuns > 50) return 'from-blue-400 via-indigo-500 to-purple-600';
              if (totalRuns > 20) return 'from-orange-400 via-amber-500 to-yellow-600';
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
                {/* Card Header with Dynamic Gradient */}
                <div className={`bg-gradient-to-br ${getCardGradient()} p-6 relative overflow-hidden`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full translate-y-8 -translate-x-8"></div>
                  

                  
                  <div className="flex items-center space-x-3 sm:space-x-4 relative z-10">
                    {player.photoBase64 ? (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full border-3 sm:border-4 border-white shadow-2xl overflow-hidden ring-2 sm:ring-4 ring-white ring-opacity-30 flex-shrink-0">
                        <img
                          src={player.photoBase64}
                          alt={player.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-3 sm:border-4 border-white shadow-2xl ring-2 sm:ring-4 ring-white ring-opacity-30 flex-shrink-0">
                        <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">
                          {getPlayerInitials(player.fullName)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 text-white">
                      <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl leading-tight drop-shadow-lg" title={player.fullName}>
                        {player.fullName.length > 20 ? player.fullName.substring(0, 20) + '...' : player.fullName}
                      </h3>
                      <p className="text-white text-opacity-90 text-sm sm:text-base md:text-lg font-medium truncate">{player.position}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs sm:text-sm md:text-base bg-white bg-opacity-20 px-2 py-1 rounded-full truncate">
                          {stats.matches || 0} matches
                        </span>
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

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-blue-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{stats.runs || 0}</div>
                      <div className="text-blue-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Runs</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-red-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">{stats.wickets || 0}</div>
                      <div className="text-red-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Wkts</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 border border-purple-200 shadow-sm">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-600">{stats.matches || 0}</div>
                      <div className="text-purple-500 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide">Mat</div>
                    </div>
                  </div>
                  
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-2 border border-orange-200">
                      <div className="text-xs sm:text-sm md:text-base text-orange-600 font-bold uppercase tracking-wide mb-1">Avg</div>
                      <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-orange-700">{stats.average || '0.00'}</div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg sm:rounded-xl p-2 border border-teal-200">
                      <div className="text-xs sm:text-sm md:text-base text-teal-600 font-bold uppercase tracking-wide mb-1">SR</div>
                      <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-teal-700">{stats.strikeRate || '0.00'}</div>
                    </div>
                  </div>
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
            <p className="text-gray-600 text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6">No players match the selected criteria for {selectedSeason}.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-blue-800 text-sm sm:text-base md:text-lg">
                💡 Try selecting a different season or status filter to see more players.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Player Details Modal with Professional Design */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header with Dynamic Gradient */}
            <div className={`bg-gradient-to-br ${
              selectedPlayer.auctionStatus === 'sold' 
                ? 'from-emerald-500 via-green-500 to-teal-600'
                : 'from-purple-500 via-pink-500 to-red-500'
            } p-8 text-white relative overflow-hidden`}>
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <button
                onClick={() => setShowPlayerModal(false)}
                className="absolute top-6 right-6 text-white hover:text-gray-200 bg-black bg-opacity-30 rounded-full p-3 transition-all duration-300 hover:bg-opacity-50 z-10"
                style={{ minWidth: '48px', minHeight: '48px', touchAction: 'manipulation' }}
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-8 relative z-10">
                {selectedPlayer.photoBase64 ? (
                  <div className="w-40 h-40 rounded-full border-6 border-white shadow-2xl overflow-hidden ring-4 ring-white ring-opacity-30">
                    <img
                      src={selectedPlayer.photoBase64}
                      alt={selectedPlayer.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-6 border-white shadow-2xl ring-4 ring-white ring-opacity-30">
                    <span className="text-white font-bold text-5xl">
                      {getPlayerInitials(selectedPlayer.fullName)}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 drop-shadow-lg truncate">{selectedPlayer.fullName}</h2>
                  <p className="text-white text-opacity-90 text-lg sm:text-xl md:text-2xl lg:text-3xl mb-3 font-medium truncate">{selectedPlayer.position}</p>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full text-sm sm:text-base md:text-lg font-bold shadow-lg ${
                      selectedPlayer.auctionStatus === 'sold' 
                        ? 'bg-green-600 bg-opacity-90 text-white'
                        : 'bg-gray-600 bg-opacity-90 text-white'
                    }`}>
                      {selectedPlayer.auctionStatus === 'sold' ? '✅ SOLD' : '⏳ AVAILABLE'}
                    </span>
                    <span className="inline-block px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full text-sm sm:text-base md:text-lg font-medium bg-white bg-opacity-20">
                      {playerStats[selectedPlayer.fullName]?.matches || 0} Matches Played
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10">
              {selectedPlayer.soldTo && (
                <div className="mb-10 p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl border-2 border-green-200 shadow-xl">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-6">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-xl sm:text-2xl md:text-3xl mb-2">Team Assignment</h4>
                      <p className="text-green-800 text-lg sm:text-xl md:text-2xl">Currently playing for: <span className="font-bold text-xl sm:text-2xl md:text-3xl text-green-700">{selectedPlayer.soldTo}</span></p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Enhanced Statistics Section */}
                <div>
                  <h4 className="font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    Performance Statistics
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.runs || 0}</div>
                      <div className="text-blue-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Total Runs</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.wickets || 0}</div>
                      <div className="text-red-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Wickets</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.matches || 0}</div>
                      <div className="text-green-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Matches</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.average || '0.00'}</div>
                      <div className="text-purple-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Average</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.strikeRate || '0.00'}</div>
                      <div className="text-orange-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Strike Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{playerStats[selectedPlayer.fullName]?.economy || '0.00'}</div>
                      <div className="text-teal-100 font-bold uppercase tracking-wide text-sm sm:text-base md:text-lg">Economy</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Personal Information */}
                <div>
                  <h4 className="font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    Personal Information
                  </h4>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="text-sm sm:text-base md:text-lg text-gray-500 font-bold uppercase tracking-wide mb-2">Email Address</div>
                      <div className="text-gray-900 font-bold text-lg sm:text-xl md:text-2xl email-safe" title={selectedPlayer.email}>{selectedPlayer.email}</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-sm">
                      <div className="text-sm sm:text-base md:text-lg text-blue-600 font-bold uppercase tracking-wide mb-2">Phone Number</div>
                      <div className="text-blue-900 font-bold text-lg sm:text-xl md:text-2xl break-all" title={selectedPlayer.phone}>{selectedPlayer.phone}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200 shadow-sm">
                      <div className="text-sm sm:text-base md:text-lg text-green-600 font-bold uppercase tracking-wide mb-2">Playing Position</div>
                      <div className="text-green-900 font-bold text-lg sm:text-xl md:text-2xl">{selectedPlayer.position}</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200 shadow-sm">
                      <div className="text-sm sm:text-base md:text-lg text-purple-600 font-bold uppercase tracking-wide mb-2">Preferred Hand</div>
                      <div className="text-purple-900 font-bold text-lg sm:text-xl md:text-2xl">{selectedPlayer.preferredHand || 'Not specified'}</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-100 p-6 rounded-2xl border border-orange-200 shadow-sm">
                      <div className="text-sm sm:text-base md:text-lg text-orange-600 font-bold uppercase tracking-wide mb-2">Registration Status</div>
                      <div className={`font-bold text-lg sm:text-xl md:text-2xl ${
                        selectedPlayer.status === 'approved' ? 'text-green-700' :
                        selectedPlayer.status === 'pending' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {selectedPlayer.status?.charAt(0).toUpperCase() + selectedPlayer.status?.slice(1) || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isAdminLoggedIn && (
                <div className="mt-12 border-t-2 border-gray-200 pt-10">
                  <h4 className="font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                      <Edit className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    Admin Actions
                  </h4>
                  <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-3xl p-8 border-2 border-orange-200 shadow-xl">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm sm:text-base md:text-lg lg:text-xl font-bold text-orange-800 mb-4 uppercase tracking-wide">
                          🏆 Assign Player to Team
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handlePlayerAssignment(selectedPlayer.id, e.target.value);
                            }
                          }}
                          className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 border-2 border-orange-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500 focus:border-orange-500 bg-white text-base sm:text-lg md:text-xl font-semibold shadow-lg"
                          defaultValue=""
                        >
                          <option value="">Select Team to Assign</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedPlayer.teamId && (
                        <button
                          onClick={() => handlePlayerAssignment(selectedPlayer.id, null)}
                          className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-2xl font-bold text-base sm:text-lg md:text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                          ❌ Mark as Unsold
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setShowPlayerModal(false)}
                  className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 text-white px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 rounded-2xl font-bold text-base sm:text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Close Player Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Auction;