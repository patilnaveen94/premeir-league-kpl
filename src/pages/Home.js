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
  const [sponsors, setSponsors] = useState([]);
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
      const [carouselSnapshot, teamsSnapshot, allMatchesSnapshot, sponsorsSnapshot, playersSnapshot, settingsSnapshot, prizeSponsorsSnapshot] = await Promise.all([
        getDocs(collection(db, 'carouselImages')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'sponsors')),
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
      const sponsorsData = sponsorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      setSponsors(sponsorsData);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-50">
      {/* Modern Header Section - Compact & Impactful */}
      <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Sponsor Badge - Top */}
        <div className="relative mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 rounded-full border-2 border-yellow-400 shadow-lg">
            <span className="text-xl">🌾</span>
            <span className="text-white font-bold text-sm">Season 2 Powered by John Deere</span>
            <span className="text-xl">🌾</span>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 mb-4 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold">SEASON 2 - 2026</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Khajjidoni
                </span>
                <br />
                <span className="text-white">Premier League</span>
                <br />
                <span className="text-green-400 text-3xl sm:text-4xl md:text-5xl">Powered by John Deere</span>
              </h1>
              
              <p className="text-lg text-gray-300 mb-6 max-w-lg">
                The Ultimate Cricket Experience - Join thousands of cricket enthusiasts in the most exciting tournament of 2026
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="text-2xl font-bold text-yellow-400">{teams.length}</div>
                  <div className="text-xs text-gray-400">Teams</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="text-2xl font-bold text-blue-400">{totalMatches}</div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="text-2xl font-bold text-green-400">{playerRegistrations.length}</div>
                  <div className="text-xs text-gray-400">Players</div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {showRegistrationSection && (
                  <Link to="/player-registration" className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Register Now
                    </span>
                  </Link>
                )}
                <Link to="/teams" className="group relative bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-bold border-2 border-white/30 hover:border-white/60 hover:bg-white/20 transition-all duration-300 text-center">
                  <span className="flex items-center justify-center">
                    <Users className="w-5 h-5 mr-2" />
                    Explore Teams
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Right Content - Timeline (Visible on all screens now) */}
            <div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold text-lg mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-yellow-400" />
                  Season 2 Timeline
                </h3>
                
                <div className="space-y-4">
                  {/* Timeline Item 1 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div className="w-1 h-12 bg-gradient-to-b from-green-500 to-blue-500 mt-2"></div>
                    </div>
                    <div className="pb-4">
                      <div className="text-green-400 font-bold">Registration</div>
                      <div className="text-white text-sm">March 1-31, 2026</div>
                      <div className="text-gray-400 text-xs mt-1">Players & Teams</div>
                    </div>
                  </div>
                  
                  {/* Timeline Item 2 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-red-500 mt-2"></div>
                    </div>
                    <div className="pb-4">
                      <div className="text-blue-400 font-bold">Player Auction</div>
                      <div className="text-white text-sm">April 1st Week</div>
                      <div className="text-gray-400 text-xs mt-1">Team Building</div>
                    </div>
                  </div>
                  
                  {/* Timeline Item 3 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold">Matches Begin</div>
                      <div className="text-white text-sm">May 1st, 2026</div>
                      <div className="text-gray-400 text-xs mt-1">Tournament Starts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Player Registration Section - Moved to Top */}
      {showRegistrationSection && (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg animate-bounce">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Join Season 2 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Now!</span>
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Registration Open - Khajjidoni Premier League 2026
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-center shadow-2xl">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Fee: ₹50 Only</h3>
                <p className="text-gray-800 mb-6">Secure your spot in the most exciting cricket tournament of 2026</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/player-registration" 
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-pulse"
                  >
                    Register Now - ₹50
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Season Sponsor Section - Corporate Design */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-block mb-6">
              <span className="text-sm font-bold text-green-600 uppercase tracking-widest">Official Partner</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Season 2 Sponsor
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Proudly partnering with a global leader in innovation and excellence
            </p>
          </div>

          {/* Main Sponsor Card */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left - Sponsor Name & Branding */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 sm:p-12 lg:p-16 flex flex-col justify-center text-white">
                <div className="mb-8">
                  <p className="text-sm font-bold uppercase tracking-widest text-green-100 mb-4">Khajjidoni Premier League</p>
                  <h3 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4">John Deere</h3>
                  <p className="text-xl text-green-100 font-semibold">Official Season 2 Partner</p>
                </div>
                <div className="border-t border-green-500 pt-6">
                  <p className="text-sm text-green-100">Committed to excellence, innovation, and community support</p>
                </div>
              </div>

              {/* Right - Company Information */}
              <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3">About</h4>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      John Deere is a world-renowned leader in agricultural equipment, technology, and innovation. With over 190 years of heritage, the company continues to set industry standards for quality, reliability, and performance.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3">Partnership Vision</h4>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      As the official Season 2 sponsor, John Deere brings its core values of excellence, innovation, and community engagement to Khajjidoni Premier League, supporting the growth of cricket and athletic excellence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-3">190+</div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Years</p>
                <p className="text-gray-700">Of Innovation & Excellence</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-3">180+</div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Countries</p>
                <p className="text-gray-700">Global Presence & Impact</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-3">Millions</div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Customers</p>
                <p className="text-gray-700">Trusted Worldwide</p>
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 sm:p-12 border border-green-200 mb-12">
            <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why John Deere</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 text-white font-bold text-lg">✓</div>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-2">Innovation & Technology</h5>
                  <p className="text-gray-700">Pioneering solutions that drive progress and excellence across industries</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 text-white font-bold text-lg">✓</div>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-2">Quality & Reliability</h5>
                  <p className="text-gray-700">Unwavering commitment to delivering superior products and services</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 text-white font-bold text-lg">✓</div>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-2">Global Leadership</h5>
                  <p className="text-gray-700">Setting industry standards and leading transformation worldwide</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 text-white font-bold text-lg">✓</div>
                </div>
                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-2">Community Commitment</h5>
                  <p className="text-gray-700">Supporting sports, education, and community development initiatives</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <a 
              href="https://www.deere.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 sm:px-10 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Learn More About John Deere
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Tournament Info Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="responsive-container">
          <div className="text-center mobile-margin animate-fade-in-up">
            <h2 className="responsive-subheading font-bold text-gray-900 mb-3 sm:mb-4">Tournament 2026</h2>
            <p className="responsive-text text-gray-600 max-w-3xl mx-auto">
              Current Season Highlights - Experience the thrill of cricket at its finest. 7 teams, unlimited passion, one champion.
            </p>
          </div>
          
          <div className="responsive-grid mb-8 sm:mb-12">
            <div className="mobile-stat-card bg-gradient-to-br from-blue-50 to-blue-100 text-center stagger-item hover-lift">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-blue-900">{loading ? '...' : <AnimatedCounter end={teams.length} />}</h3>
              <p className="mobile-stat-label text-blue-700">Teams</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-blue-50 to-blue-100 text-center stagger-item hover-lift">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-blue-900">{loading ? '...' : <AnimatedCounter end={totalMatches} />}</h3>
              <p className="mobile-stat-label text-blue-700">Matches</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-orange-50 to-orange-100 text-center stagger-item hover-lift">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-orange-900">{loading || tournamentLoading ? '...' : <AnimatedCounter end={playerStats.filter(p => p.matches > 0).length} />}</h3>
              <p className="mobile-stat-label text-orange-700">Active Players</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-purple-50 to-purple-100 text-center stagger-item hover-lift">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-purple-900">{loading || !tournamentStats ? '...' : <AnimatedCounter end={tournamentStats.totalRuns} />}</h3>
              <p className="mobile-stat-label text-purple-700">Total Runs</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue rounded-2xl p-8 text-white text-center animate-scale-in hover-lift">
            <h3 className="text-2xl font-bold mb-4">Tournament Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-white/10 rounded-lg p-4 hover-scale transition-all duration-300">
                <h4 className="font-semibold mb-2">League Stage</h4>
                <p className="text-white/90">Round-robin format with each team playing others</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 hover-scale transition-all duration-300">
                <h4 className="font-semibold mb-2">Playoffs</h4>
                <p className="text-white/90">Top 4 teams qualify for knockout stage</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 hover-scale transition-all duration-300">
                <h4 className="font-semibold mb-2">Final</h4>
                <p className="text-white/90">Winner takes all in the championship match</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Wall of Fame Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 relative overflow-hidden">
        {/* Celebration Animation Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
          {/* Party streamers */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`streamer-${i}`}
              className="absolute w-1 h-8 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`
              }}
            />
          ))}
          {/* Sparkles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-yellow-500 text-xl animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ✨
            </div>
          ))}
          {/* Party Poppers */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`popper-${i}`}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `popperBurst ${2 + Math.random()}s ease-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              🎉
            </div>
          ))}
          {/* Confetti Burst */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className={`absolute w-1 h-3 animate-bounce opacity-80`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'][Math.floor(Math.random() * 7)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
          {/* Balloons */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`balloon-${i}`}
              className="absolute text-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `balloonFloat ${4 + Math.random() * 2}s ease-in-out infinite`
              }}
            >
              🎈
            </div>
          ))}
          {/* Fireworks */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`firework-${i}`}
              className="absolute text-2xl animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              🎆
            </div>
          ))}
          {/* Stars */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-yellow-400 text-lg animate-spin"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ⭐
            </div>
          ))}
          {/* Google Doodle Style Elements */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`doodle-${i}`}
              className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `doodleWave ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {['🎪', '🎭', '🎨', '🎯', '🎲', '🎸', '🎺', '🎻'][Math.floor(Math.random() * 8)]}
            </div>
          ))}
          {/* Bouncing Letters */}
          {['C', 'R', 'I', 'C', 'K', 'E', 'T'].map((letter, i) => (
            <div
              key={`letter-${i}`}
              className="absolute text-6xl font-bold text-yellow-500 opacity-20"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + Math.sin(i) * 30}%`,
                animation: `doodleBounce ${2 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            >
              {letter}
            </div>
          ))}
          {/* Floating Shapes */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`shape-${i}`}
              className="absolute opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `doodleFloat ${4 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              <div className={`w-3 h-3 ${
                ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]
              } ${
                ['rounded-full', 'rounded-lg', ''][Math.floor(Math.random() * 3)]
              }`}></div>
            </div>
          ))}
        </div>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes balloonFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-30px) scale(1.1); }
          }
          @keyframes popperBurst {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            20% { transform: scale(1.2) rotate(180deg); opacity: 1; }
            100% { transform: scale(0.8) rotate(360deg); opacity: 0.7; }
          }
          @keyframes doodleWave {
            0%, 100% { transform: translateY(0px) scaleY(1); }
            50% { transform: translateY(-15px) scaleY(1.2); }
          }
          @keyframes doodleBounce {
            0%, 100% { transform: translateX(0px) rotate(0deg); }
            25% { transform: translateX(-10px) rotate(-5deg); }
            75% { transform: translateX(10px) rotate(5deg); }
          }
          @keyframes doodleFloat {
            0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
            33% { transform: translateY(-20px) scale(1.1) rotate(120deg); }
            66% { transform: translateY(10px) scale(0.9) rotate(240deg); }
          }
        `}</style>
        <div className="responsive-container relative z-10">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 mr-3" />
              <h2 className="responsive-heading font-bold text-gray-900">Wall of Fame</h2>
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 ml-3" />
            </div>
            <p className="responsive-text text-gray-700 max-w-3xl mx-auto">
              Celebrating our cricket legends and outstanding performers
            </p>
          </div>
          
          {wallOfFame.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-48 shadow-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Best All-Rounder - Featured */}
              {wallOfFame.bestAllRounder && (
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-purple-800 mb-6 flex items-center justify-center">
                    <Star className="w-6 h-6 mr-2 text-purple-600" />
                    Best All-Rounder
                    <Star className="w-6 h-6 ml-2 text-purple-600" />
                  </h3>
                  <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
                      
                      <div className="relative z-10">
                        <div className="mb-4">
                          {getPlayerPhoto(wallOfFame.bestAllRounder.name) ? (
                            <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-xl">
                              <img 
                                src={getPlayerPhoto(wallOfFame.bestAllRounder.name)} 
                                alt={wallOfFame.bestAllRounder.name} 
                                className="w-full h-full object-cover rounded-full" 
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white">
                              {getPlayerInitials(wallOfFame.bestAllRounder.name)}
                            </div>
                          )}
                        </div>
                        <h4 className="text-2xl font-bold mb-2">{wallOfFame.bestAllRounder.name}</h4>
                        <p className="text-purple-100 mb-4 font-medium">Complete Player</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white bg-opacity-20 rounded-xl p-3">
                            <div className="text-2xl font-bold">{wallOfFame.bestAllRounder.totalRuns}</div>
                            <div className="text-sm text-purple-100">Runs</div>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-xl p-3">
                            <div className="text-2xl font-bold">{wallOfFame.bestAllRounder.totalWickets}</div>
                            <div className="text-sm text-purple-100">Wickets</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Top Batsmen */}
              {wallOfFame.topBatsmen.length > 0 && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center">
                    <Trophy className="w-6 h-6 mr-2 text-blue-600" />
                    Top Batsmen
                    <Trophy className="w-6 h-6 ml-2 text-blue-600" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallOfFame.topBatsmen.map((player, index) => (
                      <div key={player.name} className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        
                        <div className="relative z-10 text-center">
                          <div className="mb-4">
                            {getPlayerPhoto(player.name) ? (
                              <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-lg">
                                <img 
                                  src={getPlayerPhoto(player.name)} 
                                  alt={player.name} 
                                  className="w-full h-full object-cover rounded-full" 
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                {getPlayerInitials(player.name)}
                              </div>
                            )}
                          </div>
                          <h4 className="text-lg font-bold mb-1">{player.name}</h4>
                          <p className="text-blue-100 text-sm mb-3">Batsman</p>
                          <div className="bg-white bg-opacity-20 rounded-lg p-3">
                            <div className="text-2xl font-bold">{player.totalRuns}</div>
                            <div className="text-sm text-blue-100">Career Runs</div>
                          </div>
                          <div className="mt-2 text-xs text-blue-100">
                            Avg: {player.battingAverage} | Matches: {player.totalMatches}
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
                  <h3 className="text-xl sm:text-2xl font-bold text-red-800 mb-6 text-center flex items-center justify-center">
                    <Target className="w-6 h-6 mr-2 text-red-600" />
                    Top Bowlers
                    <Target className="w-6 h-6 ml-2 text-red-600" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallOfFame.topBowlers.map((player, index) => (
                      <div key={player.name} className="bg-gradient-to-br from-red-400 via-rose-500 to-red-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                        
                        <div className="relative z-10 text-center">
                          <div className="mb-4">
                            {getPlayerPhoto(player.name) ? (
                              <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-lg">
                                <img 
                                  src={getPlayerPhoto(player.name)} 
                                  alt={player.name} 
                                  className="w-full h-full object-cover rounded-full" 
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white">
                                {getPlayerInitials(player.name)}
                              </div>
                            )}
                          </div>
                          <h4 className="text-lg font-bold mb-1">{player.name}</h4>
                          <p className="text-red-100 text-sm mb-3">Bowler</p>
                          <div className="bg-white bg-opacity-20 rounded-lg p-3">
                            <div className="text-2xl font-bold">{player.totalWickets}</div>
                            <div className="text-sm text-red-100">Career Wickets</div>
                          </div>
                          <div className="mt-2 text-xs text-red-100">
                            Econ: {player.economy || '0.00'} | Matches: {player.totalMatches}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {wallOfFame.topBatsmen.length === 0 && wallOfFame.topBowlers.length === 0 && !wallOfFame.bestAllRounder && (
                <div className="text-center py-16">
                  <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Trophy className="w-16 h-16 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Wall of Fame Awaits</h3>
                  <p className="text-gray-600 text-lg mb-6">Play matches to earn your place among the legends!</p>
                  <Link to="/stats" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    View Current Stats
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Live Stats & Recent Matches */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="responsive-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Recent Matches */}
            <div className="card card-entrance hover-lift">
              <div className="responsive-flex justify-between mb-4 sm:mb-6">
                <h3 className="responsive-subheading font-bold text-gray-900">Recent Matches</h3>
                <Link to="/schedule" className="text-cricket-blue hover:text-cricket-navy responsive-small font-medium mobile-hidden transition-colors duration-300 hover:scale-105">
                  View All →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div className="mobile-spacing">
                  {recentMatches.map((match, index) => (
                    <div key={match.id} className="mobile-match-card mobile-hover card-hover" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="responsive-flex justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="responsive-small font-medium text-green-600 uppercase tracking-wide">Completed</span>
                        </div>
                        <div className="responsive-small text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatMatchDate(match.date)}
                        </div>
                      </div>
                      
                      <div className="mobile-match-teams">
                        <div className="flex-1 text-center">
                          <div className="responsive-small font-bold text-gray-900 truncate">{match.team1}</div>
                        </div>
                        <div className="px-2 sm:px-3">
                          <div className="responsive-small text-gray-400 font-medium">VS</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="responsive-small font-bold text-gray-900 truncate">{match.team2}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white text-center py-2 sm:py-3 rounded-lg">
                        <div className="responsive-small font-medium">
                          {getMatchWinMessage(match)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent matches</p>
                </div>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="card card-entrance hover-lift animation-delay-200">
              <div className="responsive-flex justify-between mb-4 sm:mb-6">
                <h3 className="responsive-subheading font-bold text-gray-900">Quick Stats</h3>
                <Link to="/stats" className="text-cricket-blue hover:text-cricket-navy responsive-small font-medium mobile-hidden transition-colors duration-300 hover:scale-105">
                  View All →
                </Link>
              </div>
              {loading || tournamentLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Leader */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border border-yellow-200 hover-lift transition-all duration-300">
                    <div className="flex items-center mb-3">
                      <Trophy className="w-5 h-5 text-yellow-600 mr-2 transition-transform duration-300 hover:rotate-12" />
                      <h4 className="text-sm font-bold text-yellow-800">Current Leader</h4>
                    </div>
                    {standings?.[0] ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{standings[0].teamName}</div>
                            <div className="text-sm text-yellow-700">League Leader</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-yellow-700">{standings[0].points}</div>
                          <div className="text-xs text-yellow-600">points</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-yellow-700 text-sm">Tournament not started</div>
                    )}
                  </div>
                  
                  {/* Tournament Progress */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-bold text-blue-800">Tournament Progress</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Matches Played</span>
                        <span className="font-bold text-blue-800">{recentMatches.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Active Players</span>
                        <span className="font-bold text-blue-800">{playerStats.filter(p => p.matches > 0).length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Tournament Total Runs</span>
                        <span className="font-bold text-blue-800">{tournamentStats?.totalRuns || 'Loading...'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

     











      {/* Footer with Sponsor Branding */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 border-t-2 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* League Info */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                Khajjidoni Premier League
              </h3>
              <p className="text-gray-400 text-sm">Season 2 - 2026</p>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-green-400 font-semibold text-sm">Powered by John Deere</span>
              </div>
              <p className="text-gray-400 text-sm">The Ultimate Cricket Experience</p>
            </div>
            
            {/* Sponsor Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-200 mb-2">SEASON SPONSOR</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🌾</span>
                  <p className="text-lg font-bold">John Deere</p>
                  <span className="text-2xl">🌾</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 text-gray-400 text-xs">
                <span>Proudly Powered by John Deere</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/teams" className="hover:text-yellow-400 transition">Teams</Link></li>
                <li><Link to="/stats" className="hover:text-yellow-400 transition">Statistics</Link></li>
                <li><Link to="/auction" className="hover:text-yellow-400 transition">Auction</Link></li>
                <li><Link to="/news" className="hover:text-yellow-400 transition">News</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 text-sm text-center md:text-left mb-4 md:mb-0">
                © 2026 Khajjidoni Premier League. All rights reserved.
              </p>
              <div className="flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full border border-green-600/50">
                <span className="text-lg">🌾</span>
                <span className="text-sm font-semibold">Powered by John Deere</span>
                <span className="text-lg">🌾</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;