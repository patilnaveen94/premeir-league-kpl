import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, TrendingUp, Clock, MapPin, ChevronLeft, ChevronRight, Target, Star } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { formatMatchDate } from '../utils/dateUtils';
import { getMatchWinMessage } from '../utils/matchUtils';
import { useTournamentData } from '../hooks/useTournamentData';

const Home = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [teams, setTeams] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [sponsors, setSponsors] = useState([]);
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [showRegistrationSection, setShowRegistrationSection] = useState(true);
  
  // Use centralized tournament data hook for consistent data
  const { topPerformers, standings, playerStats, loading: tournamentLoading } = useTournamentData();

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName) => {
    const player = playerRegistrations.find(p => 
      p.fullName?.toLowerCase() === playerName?.toLowerCase()
    );
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
  }, []);

  // Refresh home data when tournament data updates
  useEffect(() => {
    if (!tournamentLoading && topPerformers && standings) {
      // Refresh basic data when tournament data changes
      fetchHomeData();
    }
  }, [topPerformers, standings, tournamentLoading]);

  const fetchHomeData = async () => {
    try {
      // Fetch basic data that doesn't need sync
      const [carouselSnapshot, teamsSnapshot, allMatchesSnapshot, sponsorsSnapshot, playersSnapshot, settingsSnapshot] = await Promise.all([
        getDocs(collection(db, 'carouselImages')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'sponsors')),
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'settings'))
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
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <section className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden animate-fade-in">
        {carouselImages.length > 0 ? (
          <>
            <div className="relative h-full">
              {carouselImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.title || 'Cricket League'}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows - Hidden on mobile */}
            {carouselImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden sm:block absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-2 rounded-full transition-colors touch-btn"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden sm:block absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-2 rounded-full transition-colors touch-btn"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
            
            {/* Dots Indicator */}
            {carouselImages.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors touch-btn ${
                      index === currentSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="gradient-bg h-full"></div>
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white responsive-container">
            <h1 className="responsive-heading font-bold mobile-margin drop-shadow-lg animate-fade-in-up">
              Khajjidoni Premier League
            </h1>
            <p className="responsive-text mb-6 sm:mb-8 text-gray-200 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              The Ultimate Cricket Experience
            </p>
            <div className="responsive-flex justify-center max-w-md mx-auto animate-fade-in-up animation-delay-300">
              <Link to="/teams" className="mobile-button bg-cricket-green text-white hover:bg-cricket-green/90 shadow-lg mobile-hover w-full sm:w-auto text-center btn-animate">
                Explore Teams
              </Link>
              <Link to="/stats" className="mobile-button bg-white text-cricket-navy hover:bg-gray-100 shadow-lg mobile-hover w-full sm:w-auto text-center btn-animate">
                View Stats
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Info Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="responsive-container">
          <div className="text-center mobile-margin animate-fade-in-up">
            <h2 className="responsive-subheading font-bold text-gray-900 mb-3 sm:mb-4">Tournament 2025</h2>
            <p className="responsive-text text-gray-600 max-w-3xl mx-auto">
              Experience the thrill of cricket at its finest. 7 teams, unlimited passion, one champion.
            </p>
          </div>
          
          <div className="responsive-grid mb-8 sm:mb-12">
            <div className="mobile-stat-card bg-gradient-to-br from-blue-50 to-blue-100 text-center stagger-item hover-lift">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-blue-900">{loading ? '...' : teams.length}</h3>
              <p className="mobile-stat-label text-blue-700">Teams</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-green-50 to-green-100 text-center stagger-item hover-lift">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-green-900">{loading ? '...' : totalMatches}</h3>
              <p className="mobile-stat-label text-green-700">Matches</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-orange-50 to-orange-100 text-center stagger-item hover-lift">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-orange-900">{loading || tournamentLoading ? '...' : playerStats.filter(p => p.matches > 0).length}</h3>
              <p className="mobile-stat-label text-orange-700">Active Players</p>
            </div>
            <div className="mobile-stat-card bg-gradient-to-br from-purple-50 to-purple-100 text-center stagger-item hover-lift">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600 mx-auto mb-2 sm:mb-3 transition-transform duration-300 hover:scale-110" />
              <h3 className="mobile-stat-value text-purple-900">{loading || tournamentLoading ? '...' : playerStats.reduce((sum, p) => sum + (p.runs || 0), 0)}</h3>
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
            
            {/* Top Performers */}
            <div className="card card-entrance hover-lift animation-delay-200">
              <div className="responsive-flex justify-between mb-4 sm:mb-6">
                <h3 className="responsive-subheading font-bold text-gray-900">Top Performers</h3>
                <Link to="/stats" className="text-cricket-blue hover:text-cricket-navy responsive-small font-medium mobile-hidden transition-colors duration-300 hover:scale-105">
                  View Stats →
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
                  {/* Top Run Scorer */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200 hover-lift transition-all duration-300">
                    <div className="flex items-center mb-3">
                      <Trophy className="w-5 h-5 text-green-600 mr-2 transition-transform duration-300 hover:rotate-12" />
                      <h4 className="text-sm font-bold text-green-800">Top Run Scorer</h4>
                    </div>
                    {topPerformers?.topRunScorers?.[0] ? (
                      <div className="flex items-center space-x-3">
                        {getPlayerPhoto(topPerformers.topRunScorers[0].name) ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full p-0.5 flex-shrink-0">
                            <img 
                              src={getPlayerPhoto(topPerformers.topRunScorers[0].name)} 
                              alt={topPerformers.topRunScorers[0].name} 
                              className="w-full h-full object-cover rounded-full" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {getPlayerInitials(topPerformers.topRunScorers[0].name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{topPerformers.topRunScorers[0].name}</div>
                          <div className="text-sm text-green-700">{topPerformers.topRunScorers[0].team}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-700">{topPerformers.topRunScorers[0].runs}</div>
                          <div className="text-xs text-green-600">runs</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-green-700 text-sm">No data available</div>
                    )}
                  </div>
                  
                  {/* Top Wicket Taker */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200 hover-lift transition-all duration-300">
                    <div className="flex items-center mb-3">
                      <Target className="w-5 h-5 text-red-600 mr-2 transition-transform duration-300 hover:rotate-12" />
                      <h4 className="text-sm font-bold text-red-800">Top Wicket Taker</h4>
                    </div>
                    {topPerformers?.topWicketTakers?.[0] ? (
                      <div className="flex items-center space-x-3">
                        {getPlayerPhoto(topPerformers.topWicketTakers[0].name) ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full p-0.5 flex-shrink-0">
                            <img 
                              src={getPlayerPhoto(topPerformers.topWicketTakers[0].name)} 
                              alt={topPerformers.topWicketTakers[0].name} 
                              className="w-full h-full object-cover rounded-full" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {getPlayerInitials(topPerformers.topWicketTakers[0].name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{topPerformers.topWicketTakers[0].name}</div>
                          <div className="text-sm text-red-700">{topPerformers.topWicketTakers[0].team}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-700">{topPerformers.topWicketTakers[0].wickets}</div>
                          <div className="text-xs text-red-600">wickets</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-700 text-sm">No data available</div>
                    )}
                  </div>
                  
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
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <h2 className="responsive-heading font-bold text-gray-900 mb-3 sm:mb-4">
              Everything Cricket
            </h2>
            <p className="responsive-text text-gray-600 max-w-2xl mx-auto">
              Your complete cricket experience - from live scores to player stats
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="mobile-card sm:card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 stagger-item card-hover">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="transition-transform duration-300 hover:scale-110 hover:rotate-6">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="responsive-text text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Sponsors Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Sponsors</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Proud partners supporting Khajjidoni Premier League
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          ) : sponsors.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {sponsors.filter(s => s.type === 'title').map((sponsor, index) => (
                  <div key={sponsor.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center border-2 border-yellow-200 hover-lift stagger-item">
                    {sponsor.photoBase64 && (
                      <img src={sponsor.photoBase64} alt={sponsor.name} className="w-16 h-16 object-contain mx-auto mb-3 rounded transition-transform duration-300 hover:scale-110" />
                    )}
                    <h3 className="font-bold text-yellow-800 mb-1">{sponsor.name}</h3>
                    <p className="text-xs text-yellow-600 uppercase font-medium">Title Sponsor</p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {sponsors.filter(s => s.type !== 'title').slice(0, 12).map((sponsor, index) => (
                  <div key={sponsor.id} className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-all duration-300 hover-scale stagger-item">
                    {sponsor.photoBase64 ? (
                      <img src={sponsor.photoBase64} alt={sponsor.name} className="w-12 h-12 object-contain mx-auto mb-2 rounded transition-transform duration-300 hover:scale-110" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                        <Star className="w-6 h-6 text-gray-400 transition-transform duration-300 hover:rotate-12" />
                      </div>
                    )}
                    <h4 className="text-sm font-medium text-gray-900 truncate">{sponsor.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{sponsor.type}</p>
                  </div>
                ))}
              </div>
              
              {sponsors.length > 12 && (
                <div className="text-center mt-6">
                  <p className="text-gray-600">And {sponsors.length - 12} more amazing sponsors!</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Become Our Sponsor</h3>
              <p className="text-gray-600">Join us in supporting cricket excellence</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Heroes Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-cricket-navy via-cricket-blue to-cricket-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Cricket Heroes</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Celebrating the legends who make cricket beautiful
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white hover-lift stagger-item">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
                <Trophy className="w-10 h-10 text-white transition-transform duration-300 hover:rotate-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tournament MVP</h3>
              <p className="text-white/90 mb-4">Outstanding performance across all matches</p>
              <div className="bg-white/20 rounded-lg p-3">
                {loading || tournamentLoading ? (
                  <p className="font-semibold">Loading...</p>
                ) : topPerformers?.topRunScorers?.[0] && topPerformers?.topWicketTakers?.[0] ? (
                  <>
                    <p className="font-semibold">{topPerformers?.topRunScorers?.[0]?.runs > (topPerformers?.topWicketTakers?.[0]?.wickets || 0) * 10 ? topPerformers?.topRunScorers?.[0]?.name : topPerformers?.topWicketTakers?.[0]?.name}</p>
                    <p className="text-sm text-white/80">Current leader</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Tournament starting</p>
                    <p className="text-sm text-white/80">Play matches to compete</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white hover-lift stagger-item">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
                <Target className="w-10 h-10 text-white transition-transform duration-300 hover:rotate-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">Best Bowler</h3>
              <p className="text-white/90 mb-4">Most wickets with best economy rate</p>
              <div className="bg-white/20 rounded-lg p-3">
                {loading || tournamentLoading ? (
                  <p className="font-semibold">Loading...</p>
                ) : topPerformers?.topWicketTakers?.[0] ? (
                  <>
                    <p className="font-semibold">{topPerformers?.topWicketTakers?.[0]?.name}</p>
                    <p className="text-sm text-white/80">{topPerformers?.topWicketTakers?.[0]?.wickets} wickets</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">No wickets yet</p>
                    <p className="text-sm text-white/80">Tournament starting</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white hover-lift stagger-item">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
                <Users className="w-10 h-10 text-white transition-transform duration-300 hover:rotate-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">Best Batsman</h3>
              <p className="text-white/90 mb-4">Highest runs with best average</p>
              <div className="bg-white/20 rounded-lg p-3">
                {loading || tournamentLoading ? (
                  <p className="font-semibold">Loading...</p>
                ) : topPerformers?.topRunScorers?.[0] ? (
                  <>
                    <p className="font-semibold">{topPerformers?.topRunScorers?.[0]?.name}</p>
                    <p className="text-sm text-white/80">{topPerformers?.topRunScorers?.[0]?.runs} runs</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">No runs yet</p>
                    <p className="text-sm text-white/80">Tournament starting</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>











      {/* Player Registration Section */}
      {showRegistrationSection && (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600">
          <div className="responsive-container">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 text-white text-center">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join the League</h2>
                  <p className="text-xl text-white/90 mb-8">
                    Register now for Khajjidoni Premier League 2025 and be part of cricket history
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 rounded-xl p-6">
                    <Trophy className="w-8 h-8 text-white mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Prize Money</h3>
                    <p className="text-white/90">₹50,000 total prize pool</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <Calendar className="w-8 h-8 text-white mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Tournament</h3>
                    <p className="text-white/90">March 2025</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <MapPin className="w-8 h-8 text-white mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Venue</h3>
                    <p className="text-white/90">Nutan Vidyalaya Khajjidoni</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Open to all cricket enthusiasts</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Professional tournament format</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Live scoring and statistics</span>
                  </div>
                </div>
                
                <div className="responsive-flex justify-center animate-fade-in-up animation-delay-500">
                  <Link 
                    to="/player-registration" 
                    className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-center btn-animate"
                  >
                    Register as Player
                  </Link>
                  <Link 
                    to="/teams" 
                    className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 w-full sm:w-auto text-center btn-animate"
                  >
                    View Teams
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white py-12 sm:py-16">
        <div className="responsive-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="responsive-subheading font-bold mobile-margin">
                Be Part of the Action
              </h2>
              <p className="responsive-text mb-4 sm:mb-6 text-white/90">
                Join Khajjidoni Premier League and showcase your cricket skills on the biggest stage
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cricket-orange rounded-full"></div>
                  <span>Professional tournament experience</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cricket-orange rounded-full"></div>
                  <span>Live scoring and statistics tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cricket-orange rounded-full"></div>
                  <span>Prize money and recognition</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cricket-orange rounded-full"></div>
                  <span>Network with cricket enthusiasts</span>
                </div>
              </div>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
                <h3 className="text-2xl font-bold mb-4">Tournament 2025</h3>
                <div className="space-y-2 text-white/90">
                  <p>📅 Registration: Open Now</p>
                  <p>🏏 Tournament: March 2025</p>
                  <p>🏆 Prize Pool: ₹50,000</p>
                  <p>📍 Venue: Nutan Vidyalaya Khajjidoni</p>
                </div>
              </div>
              
              <div className="responsive-flex justify-center lg:justify-end animate-fade-in-up animation-delay-300">
                <Link 
                  to="/player-registration" 
                  className="mobile-button bg-cricket-orange hover:bg-cricket-orange/90 text-white shadow-lg mobile-hover w-full sm:w-auto text-center btn-animate"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Register Now
                </Link>
                <Link 
                  to="/stats" 
                  className="mobile-button bg-white/20 hover:bg-white/30 text-white mobile-hover w-full sm:w-auto text-center btn-animate"
                >
                  View Stats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;