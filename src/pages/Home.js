import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, TrendingUp, Clock, MapPin, ChevronLeft, ChevronRight, Target, Star } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { formatMatchDate } from '../utils/dateUtils';
import { getMatchWinMessage } from '../utils/matchUtils';
import { useTournamentData } from '../hooks/useTournamentData';
import wallOfFameService from '../services/wallOfFameService';
import { normalizePlayerName, findPlayerByName } from '../utils/playerUtils';
import AnimatedCounter from '../components/AnimatedCounter';

const Home = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timelineSlide, setTimelineSlide] = useState(0);
  const [teams, setTeams] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [prizeSponsors, setPrizeSponsors] = useState([]);
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [showRegistrationSection, setShowRegistrationSection] = useState(false);
  const [tournamentStats, setTournamentStats] = useState(null);
  
  // Use centralized tournament data hook for consistent data
  const { topPerformers, standings, playerStats, loading: tournamentLoading } = useTournamentData();
  
  // Wall of Fame data
  const [wallOfFame, setWallOfFame] = useState({
    topBatsmen: [],
    topBowlers: [],
    bestAllRounder: null,
    loading: true
  });

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName) => {
    const player = findPlayerByName(playerRegistrations, playerName, 'fullName');
    return player?.photoBase64 || null;
  };

  // Helper function to generate initials from full name
  const getPlayerInitials = (fullName) => {
    if (!fullName) return '??';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchTournamentStats();
  }, []);

  // Refresh home data when tournament data updates
  useEffect(() => {
    if (!tournamentLoading && topPerformers && standings) {
      // Refresh basic data when tournament data changes
      fetchHomeData();
      fetchWallOfFame();
    }
  }, [topPerformers, standings, tournamentLoading]);
  
  // Fetch Wall of Fame data
  const fetchWallOfFame = async () => {
    try {
      setWallOfFame(prev => ({ ...prev, loading: true }));
      const wallOfFameData = await wallOfFameService.getWallOfFameData();
      console.log('🏆 Wall of Fame Data:', wallOfFameData);
      setWallOfFame({
        ...wallOfFameData,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching Wall of Fame data:', error);
      setWallOfFame(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Initial Wall of Fame fetch
  useEffect(() => {
    fetchWallOfFame();
  }, []);

  const fetchTournamentStats = async () => {
    try {
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedMatches = matches.filter(match => match.status === 'completed');

      let totalRuns = 0;
      for (const match of completedMatches) {
        const team1Runs = parseInt(match.team1Score?.runs) || 0;
        const team2Runs = parseInt(match.team2Score?.runs) || 0;
        totalRuns += team1Runs + team2Runs;
      }
      
      setTournamentStats({ totalRuns });
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
    }
  };

  const fetchHomeData = async () => {
    try {
      // Fetch basic data that doesn't need sync
      const [carouselSnapshot, teamsSnapshot, allMatchesSnapshot, playersSnapshot, settingsSnapshot, prizeSponsorsSnapshot] = await Promise.all([
        getDocs(collection(db, 'carouselImages')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'settings')),
        getDocs(collection(db, 'prizeSponsors2026'))
      ]);
      
      const playersData = playersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get registration section visibility setting
      const registrationSetting = settingsSnapshot.docs.find(doc => doc.id === 'playerRegistration');
      setShowRegistrationSection(registrationSetting?.data()?.visible !== false);

      // Process basic data
      const carouselData = carouselSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allMatchesData = allMatchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const prizeSponsorsData = prizeSponsorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter matches manually and sort by date
      const sortedMatches = allMatchesData.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB - dateA; // Most recent first
      });
      
      const upcomingData = sortedMatches.filter(match => match.status === 'upcoming').slice(0, 3);
      const recentData = sortedMatches.filter(match => match.status === 'completed').slice(0, 3);
      
      setUpcomingMatches(upcomingData);
      setRecentMatches(recentData);
      setTeams(teamsData);
      setTotalMatches(allMatchesData.length);
      setPrizeSponsors(prizeSponsorsData);
      setPlayerRegistrations(playersData);

      const sortedCarousel = carouselData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCarouselImages(sortedCarousel);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  useEffect(() => {
    if (carouselImages.length > 0) {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }
  }, [carouselImages.length]);

  const features = [
    {
      icon: <Trophy className="w-8 h-8 text-corporate-secondary" />,
      title: "Live Scores & Results",
      description: "Get real-time match updates and comprehensive results"
    },
    {
      icon: <Calendar className="w-8 h-8 text-corporate-secondary" />,
      title: "Fixtures & Schedule",
      description: "Never miss a match with our complete fixture list"
    },
    {
      icon: <Users className="w-8 h-8 text-corporate-secondary" />,
      title: "Team Profiles",
      description: "Detailed information about all Cricket League teams"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-corporate-secondary" />,
      title: "Points Table",
      description: "Track team standings and league progression"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section - Minimal & Impactful */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">


          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Khajjidoni
            </span>
            <br />
            <span className="text-white">Premier League</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
            The Ultimate Cricket Experience - Season 2 2026
          </p>

          {/* Quick Stats - Minimal */}
          <div className="flex justify-center gap-8 mb-12 flex-wrap">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">{teams.length}</div>
              <div className="text-sm text-gray-400 mt-1">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">{totalMatches}</div>
              <div className="text-sm text-gray-400 mt-1">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">{playerRegistrations.length}</div>
              <div className="text-sm text-gray-400 mt-1">Players</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showRegistrationSection && (
              <Link 
                to="/player-registration" 
                className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Register Now
                </span>
              </Link>
            )}
            <Link 
              to="/stats" 
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/30 hover:border-white/60 hover:bg-white/20 transition-all duration-300"
            >
              View Stats
            </Link>
          </div>
        </div>
      </section>

      {/* Wall of Fame Section - Simplified */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              <Trophy className="w-12 h-12 inline-block mr-3 text-yellow-400" />
              Wall of Fame
              <Trophy className="w-12 h-12 inline-block ml-3 text-yellow-400" />
            </h2>
            <p className="text-gray-300 text-lg">Celebrating our cricket legends</p>
          </div>
          
          {wallOfFame.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl h-48 shadow-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Last Year Champion Team */}
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-yellow-300 mb-8">🏆 Last Year Champion</h3>
                <div className="max-w-sm mx-auto">
                  <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105">
                    <div className="mb-6">
                      <div className="text-6xl mb-4">🏅</div>
                      <h4 className="text-3xl font-bold mb-2">SLV Strikers</h4>
                      <p className="text-yellow-100 font-semibold text-lg">Season 1 Champions</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 border border-white/30">
                      <p className="text-sm text-yellow-50">Defending their title in Season 2</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Best All-Rounder */}
              {wallOfFame.bestAllRounder && (
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-purple-300 mb-8">⭐ Best All-Rounder</h3>
                  <div className="max-w-sm mx-auto">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                      <div className="mb-4">
                        {getPlayerPhoto(wallOfFame.bestAllRounder.name) ? (
                          <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-lg">
                            <img src={getPlayerPhoto(wallOfFame.bestAllRounder.name)} alt={wallOfFame.bestAllRounder.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-3 border-white">
                            {getPlayerInitials(wallOfFame.bestAllRounder.name)}
                          </div>
                        )}
                      </div>
                      <h4 className="text-2xl font-bold mb-1">{wallOfFame.bestAllRounder.name}</h4>
                      <p className="text-purple-200 mb-4">Complete Player</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/15 rounded-lg p-3">
                          <div className="text-2xl font-bold text-yellow-300">{wallOfFame.bestAllRounder.totalRuns}</div>
                          <div className="text-xs text-purple-200">Runs</div>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3">
                          <div className="text-2xl font-bold text-pink-300">{wallOfFame.bestAllRounder.totalWickets}</div>
                          <div className="text-xs text-purple-200">Wickets</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Batsmen & Bowlers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Top Batsmen */}
                {wallOfFame.topBatsmen.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-blue-300 mb-6 text-center">🏏 Top Batsmen</h3>
                    <div className="space-y-4">
                      {wallOfFame.topBatsmen.map((player, idx) => (
                        <div key={player.name} className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:bg-blue-500/30">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-yellow-400 w-10 text-center">{idx + 1}</div>
                            {/* Player Photo */}
                            <div className="w-12 h-12 flex-shrink-0">
                              {getPlayerPhoto(player.name) ? (
                                <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-full h-full object-cover rounded-full border-2 border-blue-300" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-blue-300">
                                  {getPlayerInitials(player.name)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white">{player.name}</h4>
                              <p className="text-sm text-gray-300">{player.totalRuns} runs • Avg: {player.battingAverage}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Bowlers */}
                {wallOfFame.topBowlers.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-red-300 mb-6 text-center">🎯 Top Bowlers</h3>
                    <div className="space-y-4">
                      {wallOfFame.topBowlers.map((player, idx) => (
                        <div key={player.name} className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/30 hover:border-red-400/60 transition-all duration-300 hover:bg-red-500/30">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-yellow-400 w-10 text-center">{idx + 1}</div>
                            {/* Player Photo */}
                            <div className="w-12 h-12 flex-shrink-0">
                              {getPlayerPhoto(player.name) ? (
                                <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-full h-full object-cover rounded-full border-2 border-red-300" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-red-300">
                                  {getPlayerInitials(player.name)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white">{player.name}</h4>
                              <p className="text-sm text-gray-300">{player.totalWickets} wickets • Econ: {player.economy || '0.00'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Empty State */}
              {wallOfFame.topBatsmen.length === 0 && wallOfFame.topBowlers.length === 0 && !wallOfFame.bestAllRounder && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400 text-lg">Play matches to earn your place in the Wall of Fame</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Live Stats & Recent Matches - Simplified */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Recent Matches */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-8">Recent Matches</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-700 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-400 font-bold">✓ Completed</span>
                        <span className="text-xs text-gray-400">{formatMatchDate(match.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{match.team1}</span>
                        <span className="text-gray-400 text-sm">vs</span>
                        <span className="text-white font-semibold">{match.team2}</span>
                      </div>
                      <div className="text-sm text-yellow-400 mt-2">{getMatchWinMessage(match)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recent matches</p>
              )}
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-8">Tournament Stats</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">League Leader</span>
                    <span className="text-xl font-bold text-yellow-400">{standings?.[0]?.teamName || 'TBD'}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{standings?.[0]?.points || 0} points</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Matches Played</span>
                    <span className="text-xl font-bold text-blue-400">{recentMatches.length}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Players</span>
                    <span className="text-xl font-bold text-green-400">{playerStats.filter(p => p.matches > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;