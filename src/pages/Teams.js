import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { XCircle, ChevronDown } from 'lucide-react';
import { db } from '../firebase/firebase';
import { useSeason } from '../context/SeasonContext';

// Helper function to generate initials from full name
const getPlayerInitials = (fullName) => {
  if (!fullName) return '??';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Helper function to generate initials from team name
const getTeamInitials = (teamName) => {
  if (!teamName) return '??';
  const names = teamName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('1');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const { publishedSeason, currentSeason } = useSeason();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchData = async () => {
      try {
        // Get teams for selected season or teams without season field (legacy data)
        const teamsQuery = selectedSeason === '1' 
          ? collection(db, 'teams') // For season 1, get all teams (including legacy without season field)
          : query(collection(db, 'teams'), where('season', '==', selectedSeason));
        
        const playersQuery = selectedSeason === '1'
          ? collection(db, 'playerRegistrations') // For season 1, get all players (including legacy)
          : query(collection(db, 'playerRegistrations'), where('season', '==', selectedSeason));
        
        const [teamsSnapshot, playersSnapshot] = await Promise.all([
          getDocs(teamsQuery),
          getDocs(playersQuery)
        ]);
        
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTeams(teamsData);
        setPlayerRegistrations(playersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedSeason]);

  // Default teams if none in database
  const defaultTeams = [
    { name: 'Mumbai Indians', city: 'Mumbai', founded: 2008, stadium: 'Wankhede Stadium' },
    { name: 'Chennai Super Kings', city: 'Chennai', founded: 2008, stadium: 'M. A. Chidambaram Stadium' },
    { name: 'Royal Challengers', city: 'Bangalore', founded: 2008, stadium: 'M. Chinnaswamy Stadium' },
    { name: 'Delhi Capitals', city: 'Delhi', founded: 2008, stadium: 'Arun Jaitley Stadium' },
    { name: 'Kolkata Knight Riders', city: 'Kolkata', founded: 2008, stadium: 'Eden Gardens' },
    { name: 'Rajasthan Royals', city: 'Jaipur', founded: 2008, stadium: 'Sawai Mansingh Stadium' }
  ];

  const displayTeams = teams.length > 0 ? teams : (selectedSeason === '1' ? defaultTeams : []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="mt-4 text-gray-600 responsive-text">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="responsive-heading font-bold text-gray-900 mb-3 sm:mb-4">Khajjidoni Premier League Teams</h1>
          <p className="responsive-text text-gray-600">Meet the teams competing in the Khajjidoni Premier League</p>
          
          {/* Season Selector */}
          <div className="mt-6 flex justify-center">
            <div className="relative">
              <button
                onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                className="bg-gradient-to-r from-cricket-navy to-cricket-orange text-white rounded-lg px-6 py-3 font-medium flex items-center space-x-2 hover:shadow-lg transition-all duration-200"
              >
                <span>Season {selectedSeason}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSeasonDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSeasonDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[120px] z-50">
                  {['1', '2'].map((season) => (
                    <button
                      key={season}
                      onClick={() => {
                        setSelectedSeason(season);
                        setShowSeasonDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                        selectedSeason === season ? 'bg-cricket-orange text-white' : 'text-gray-700'
                      }`}
                    >
                      Season {season}
                      {season === currentSeason && <span className="text-xs ml-2 opacity-75">(Current)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {displayTeams.map((team, index) => (
            <div key={team.id || index} className="mobile-card sm:card hover:shadow-lg transition-shadow">
              <div className="h-36 sm:h-48 bg-gradient-to-br from-cricket-navy to-cricket-orange rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg sm:text-2xl font-bold">{getTeamInitials(team.name)}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold px-2 truncate">{team.name}</h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base flex-shrink-0">City:</span>
                  <span className="font-semibold text-sm sm:text-base truncate ml-2">{team.city}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base flex-shrink-0">Founded:</span>
                  <span className="font-semibold text-sm sm:text-base truncate ml-2">{team.founded}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 text-sm sm:text-base flex-shrink-0">Stadium:</span>
                  <span className="font-semibold text-xs sm:text-sm text-right flex-1 ml-2 truncate">{team.stadium}</span>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowTeamDetails(true);
                  }}
                  className="w-full btn-primary text-sm touch-btn"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Team Details Modal */}
        {showTeamDetails && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-5xl w-full max-h-[95vh] overflow-y-auto">
              {/* Header with gradient background */}
              <div className="relative bg-gradient-to-r from-cricket-navy via-cricket-blue to-cricket-orange rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white overflow-hidden">
                <div className="flex justify-between items-start sm:items-center">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 pr-4">
                    {selectedTeam.logoURL && (
                      <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white/20 rounded-full p-1 sm:p-2 backdrop-blur-sm flex-shrink-0">
                        <img src={selectedTeam.logoURL} alt="Team Logo" className="w-full h-full object-cover rounded-full" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{selectedTeam.name}</h3>
                      <p className="text-white/90 text-sm sm:text-base lg:text-lg truncate">{selectedTeam.city}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTeamDetails(false)}
                    className="text-white/80 hover:text-white bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all touch-btn flex-shrink-0"
                  >
                    <XCircle size={20} className="sm:w-7 sm:h-7" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Team Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200/50">
                  <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-cricket-navy to-cricket-blue rounded-full mr-3"></span>
                    Team Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/70 rounded-lg p-4 shadow-sm">
                        <span className="font-semibold text-cricket-navy text-sm">Founded</span>
                        <p className="text-lg font-bold text-gray-800 truncate">{selectedTeam.founded}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 shadow-sm">
                        <span className="font-semibold text-cricket-navy text-sm">Stadium</span>
                        <p className="text-lg font-bold text-gray-800 truncate">{selectedTeam.stadium}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Team Management */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 shadow-lg border border-gray-200/50">
                  <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                    <span className="w-2 h-8 bg-gradient-to-b from-cricket-orange to-cricket-navy rounded-full mr-3"></span>
                    Team Management
                  </h4>
                  <div className="space-y-4">
                    {/* Captain */}
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 shadow-md border border-yellow-200">
                      <div className="flex items-center space-x-4">
                        {selectedTeam.captainPhotoURL && (
                          <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                            <img src={selectedTeam.captainPhotoURL} alt="Captain" className="w-full h-full object-cover rounded-full" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-orange-800 text-sm">👑 CAPTAIN</p>
                          <p className="text-lg font-semibold text-gray-800 truncate">{selectedTeam.captain}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 shadow-md border border-purple-200">
                      <div className="flex items-center space-x-4">
                        {selectedTeam.ownerPhotoURL && (
                          <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                            <img src={selectedTeam.ownerPhotoURL} alt="Owner" className="w-full h-full object-cover rounded-full" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-purple-800 text-sm">💼 OWNER</p>
                          <p className="text-lg font-semibold text-gray-800 truncate">{selectedTeam.owner}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sponsor */}
                    {selectedTeam.sponsorPhotoURL && (
                      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 shadow-md border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                            <img src={selectedTeam.sponsorPhotoURL} alt="Sponsor" className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-blue-800 text-sm truncate">🤝 SPONSOR</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Players List */}
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 shadow-lg border border-gray-200/50">
                <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-cricket-blue to-cricket-orange rounded-full mr-3"></span>
                  Team Squad ({selectedTeam.players?.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length || 0} Players)
                </h4>
                {selectedTeam.players && selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).map(playerId => {
                      const player = playerRegistrations.find(p => p.id === playerId);
                      return (
                        <div key={playerId} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
                          <div className="flex items-center space-x-3">
                            {player.photoBase64 ? (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5 flex-shrink-0">
                                <img src={player.photoBase64} alt={player.fullName} className="w-full h-full object-cover rounded-full" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {getPlayerInitials(player.fullName)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 text-sm sm:text-base truncate">{player.fullName}</p>
                              <p className="text-xs sm:text-sm font-semibold text-cricket-navy">{player.position}</p>
                              <p className="text-xs text-gray-500 truncate">{player.email}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏏</div>
                    <p className="text-gray-500 text-lg">No players assigned to this team yet.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 sm:mt-8 flex justify-end">
                <button
                  onClick={() => setShowTeamDetails(false)}
                  className="btn-primary px-6 sm:px-8 touch-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;