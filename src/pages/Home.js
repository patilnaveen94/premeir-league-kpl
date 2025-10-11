import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, TrendingUp, Clock, MapPin, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { formatMatchDate } from '../utils/dateUtils';
import { getMatchWinMessage } from '../utils/matchUtils';

const Home = () => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [topPerformers, setTopPerformers] = useState({ topRunScorers: [], topWicketTakers: [] });
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // Fetch all data in parallel
      const [upcomingSnapshot, recentSnapshot, statsSnapshot, standingsSnapshot, carouselSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('status', '==', 'upcoming'), orderBy('date', 'asc'), limit(3))),
        getDocs(query(collection(db, 'matches'), where('status', '==', 'completed'), orderBy('date', 'desc'), limit(3))),
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'standings')),
        getDocs(collection(db, 'carouselImages')),
        getDocs(collection(db, 'teams'))
      ]);

      // Process data
      const upcomingData = upcomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const recentData = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const statsData = statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const standingsData = standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const carouselData = carouselSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setUpcomingMatches(upcomingData);
      setRecentMatches(recentData);
      
      const topRunScorers = statsData
        .filter(player => player.runs > 0)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 5);
      
      const topWicketTakers = statsData
        .filter(player => player.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 5);
      
      setTopPerformers({ topRunScorers, topWicketTakers });

      // Filter standings to only include existing teams
      const teamNames = teamsData.map(team => team.name);
      const filteredStandings = standingsData
        .filter(standing => teamNames.includes(standing.team))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      setStandings(filteredStandings);

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
      <section className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
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
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="responsive-hero font-bold mb-4 sm:mb-6">
              Khajjidoni Premier League
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200">
              The Ultimate Cricket Experience
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
              <Link to="/teams" className="btn-secondary w-full sm:w-auto">
                Explore Teams
              </Link>
              <Link to="/stats" className="bg-white text-corporate-primary hover:bg-gray-100 active:bg-gray-200 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto shadow-sm">
                View Stats
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Winners Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Previous Season Winners</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover:shadow-xl transition-shadow border-2 border-corporate-secondary/20">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-corporate-secondary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Season 2023</h3>
              <p className="text-lg font-semibold text-corporate-primary mb-2">Mumbai Warriors</p>
              <p className="text-gray-600">Champions with 18 points</p>
              <div className="mt-4 bg-corporate-secondary/10 text-corporate-secondary px-3 py-1 rounded-full text-sm font-medium inline-block">
                Current Champions
              </div>
            </div>
            
            <div className="card text-center hover:shadow-xl transition-shadow border-2 border-primary-200">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Season 2022</h3>
              <p className="text-lg font-semibold text-corporate-primary mb-2">Delhi Capitals</p>
              <p className="text-gray-600">Champions with 16 points</p>
              <div className="mt-4 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
                Runner-up: Chennai SK
              </div>
            </div>
            
            <div className="card text-center hover:shadow-xl transition-shadow border-2 border-corporate-warning/20">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-corporate-warning" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Season 2021</h3>
              <p className="text-lg font-semibold text-corporate-primary mb-2">Chennai Super Kings</p>
              <p className="text-gray-600">Champions with 20 points</p>
              <div className="mt-4 bg-corporate-warning/10 text-corporate-warning px-3 py-1 rounded-full text-sm font-medium inline-block">
                Highest Points
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="responsive-heading font-bold text-gray-900 mb-3 sm:mb-4">
              Everything Khajjidoni Premier League
            </h2>
            <p className="responsive-text text-gray-600 max-w-2xl mx-auto">
              Your one-stop destination for all Khajjidoni Premier League content
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="mobile-card sm:card text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-3 sm:mb-4">
                  {feature.icon}
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











      {/* CTA Section */}
      <section className="bg-corporate-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join the Khajjidoni Premier League Community
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Register as a player and be part of the action
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/player-registration" 
              className="btn-secondary"
              onClick={() => {
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }}
            >
              Register Now
            </Link>
            <Link 
              to="/live-scores" 
              className="btn-secondary"
            >
              Live Scores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;