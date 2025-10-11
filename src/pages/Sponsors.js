import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Award, Heart, Trophy, Gift, Star, Users, Building, Sparkles, Crown, Medal, Zap } from 'lucide-react';
import { db } from '../firebase/firebase';

// Helper function to generate initials from sponsor name
const getSponsorInitials = (sponsorName) => {
  if (!sponsorName) return '??';
  const names = sponsorName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Sponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const sponsorsSnapshot = await getDocs(query(collection(db, 'sponsors'), orderBy('createdAt', 'desc')));
      const sponsorsData = sponsorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSponsors(sponsorsData);
      
      // Extract unique seasons
      const uniqueSeasons = [...new Set(sponsorsData.map(s => s.season))].filter(Boolean);
      setSeasons(uniqueSeasons.sort().reverse());
      
      if (uniqueSeasons.length > 0 && !selectedSeason) {
        setSelectedSeason(uniqueSeasons[0]);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    }
    setLoading(false);
  };

  const getSponsorIcon = (type) => {
    switch (type) {
      case 'title': return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'prize': return <Award className="w-8 h-8 text-purple-500" />;
      case 'food': return <Heart className="w-8 h-8 text-red-500" />;
      case 'team': return <Users className="w-8 h-8 text-green-500" />;
      case 'organization': return <Building className="w-8 h-8 text-indigo-500" />;
      default: return <Gift className="w-8 h-8 text-blue-500" />;
    }
  };

  const getSponsorTypeColor = (type) => {
    switch (type) {
      case 'title': return 'from-yellow-300 via-orange-400 to-red-500';
      case 'prize': return 'from-purple-400 via-pink-400 to-rose-500';
      case 'food': return 'from-red-400 via-pink-400 to-orange-500';
      case 'team': return 'from-green-400 via-emerald-400 to-teal-500';
      case 'organization': return 'from-indigo-400 via-purple-400 to-pink-500';
      case 'equipment': return 'from-blue-400 via-cyan-400 to-teal-500';
      default: return 'from-violet-400 via-purple-400 to-indigo-500';
    }
  };

  const getSponsorBadgeColor = (type) => {
    switch (type) {
      case 'title': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/50';
      case 'prize': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/50';
      case 'food': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50';
      case 'team': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50';
      case 'organization': return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/50';
      case 'equipment': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/50';
      default: return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/50';
    }
  };

  const filteredSponsors = selectedSeason 
    ? sponsors.filter(sponsor => sponsor.season === selectedSeason)
    : sponsors;

  const groupedSponsors = filteredSponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.type]) acc[sponsor.type] = [];
    acc[sponsor.type].push(sponsor);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-navy mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-spin-slow"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full p-6">
              <Crown className="w-12 h-12 text-white animate-bounce" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" />
            <Zap className="absolute -bottom-2 -left-2 w-5 h-5 text-pink-300 animate-pulse" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 relative">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent animate-gradient-x">
              OUR AMAZING
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x animation-delay-1000">
              SPONSORS
            </span>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-bounce"></div>
          </h1>
          <div className="relative">
            <p className="text-xl md:text-2xl text-white/90 max-w-5xl mx-auto leading-relaxed font-medium">
              🌟 Meet the incredible partners who power our cricket dreams! 🏏 
              <br className="hidden md:block" />
              From world-class equipment to delicious treats, they make every match magical! ✨
            </p>
            <div className="absolute -top-2 left-1/4 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 right-1/4 w-3 h-3 bg-pink-300 rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Season Filter */}
        {seasons.length > 0 && (
          <div className="mb-16 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl p-1">
                <div className="bg-white rounded-3xl px-8 py-4">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="bg-transparent border-none outline-none text-xl font-bold text-gray-800 cursor-pointer"
                  >
                    <option value="">🏆 All Seasons</option>
                    {seasons.map(season => (
                      <option key={season} value={season}>🎯 {season}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Star className="absolute -top-3 -right-3 w-6 h-6 text-yellow-300 animate-spin" />
            </div>
          </div>
        )}

        {/* Sponsors Sections */}
        {Object.keys(groupedSponsors).length > 0 ? (
          <div className="space-y-16">
            {Object.entries(groupedSponsors).map(([type, typeSponsors], sectionIndex) => (
              <div key={type} className="relative">
                {/* Section Header */}
                <div className={`bg-gradient-to-r ${getSponsorTypeColor(type)} rounded-3xl p-10 mb-10 text-white relative overflow-hidden shadow-2xl`} style={{animationDelay: `${sectionIndex * 200}ms`}}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
                  <div className="absolute inset-0 animate-pulse">
                    <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full animate-pulse animation-delay-1000"></div>
                    <div className="absolute top-1/2 left-8 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-1/3 w-4 h-4 bg-white/30 rounded-full animate-bounce animation-delay-500"></div>
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-center text-center md:text-left">
                    <div className="bg-white/20 rounded-full p-6 mb-4 md:mb-0 md:mr-6 backdrop-blur-sm shadow-xl animate-float">
                      {getSponsorIcon(type)}
                      <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-spin" />
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black capitalize mb-3 drop-shadow-lg">
                        ✨ {type} Sponsors ✨
                      </h2>
                      <p className="text-white/95 text-xl font-semibold">
                        🎆 {typeSponsors.length} Amazing {typeSponsors.length === 1 ? 'Partner' : 'Partners'} 🎆
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sponsors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {typeSponsors.map((sponsor, index) => (
                    <div 
                      key={sponsor.id} 
                      className="group relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden transform hover:-translate-y-4 hover:rotate-1 animate-fade-in-up"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      {/* Glowing Border */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${getSponsorTypeColor(type)} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`}></div>
                      <div className="relative bg-white rounded-3xl m-1">
                        {/* Sponsor Image */}
                        <div className="relative h-52 overflow-hidden rounded-t-3xl">
                          {sponsor.photoBase64 ? (
                            <img 
                              src={sponsor.photoBase64} 
                              alt={sponsor.name}
                              className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getSponsorTypeColor(type)} flex items-center justify-center relative overflow-hidden`}>
                              <div className="text-white text-7xl font-black opacity-30 animate-pulse">
                                {getSponsorInitials(sponsor.name)}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          
                          {/* Floating Badges */}
                          <div className="absolute top-4 right-4 animate-bounce">
                            <span className={`px-4 py-2 rounded-full text-sm font-black ${getSponsorBadgeColor(type)} animate-pulse`}>
                              ✨ {type.toUpperCase()}
                            </span>
                          </div>
                          {sponsor.prizePosition && (
                            <div className="absolute top-4 left-4 animate-float">
                              <span className="px-3 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/50 flex items-center">
                                <Crown className="w-4 h-4 mr-1 animate-spin-slow" />
                                {sponsor.prizePosition}
                              </span>
                            </div>
                          )}
                          
                          {/* Sparkle Effects */}
                          <Sparkles className="absolute top-2 left-1/2 w-4 h-4 text-yellow-300 animate-ping" />
                          <Star className="absolute bottom-2 right-2 w-3 h-3 text-pink-300 animate-pulse" />
                        </div>
                      
                        {/* Sponsor Content */}
                        <div className="p-8 relative">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getSponsorTypeColor(type)}"></div>
                          
                          <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:${getSponsorTypeColor(type)} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                            🎆 {sponsor.name}
                          </h3>
                          
                          <p className="text-gray-700 text-base mb-6 line-clamp-3 leading-relaxed">
                            {sponsor.description}
                          </p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 font-bold flex items-center">
                                📅 Season:
                              </span>
                              <span className={`bg-gradient-to-r ${getSponsorTypeColor(type)} text-white px-4 py-2 rounded-full font-bold shadow-lg`}>
                                {sponsor.season}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 font-bold flex items-center">
                                🎁 Contribution:
                              </span>
                              <span className="text-gray-900 font-black text-lg">
                                {sponsor.contribution}
                              </span>
                            </div>
                          </div>
                          
                          {/* Decorative Elements */}
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r ${getSponsorTypeColor(type)} rounded-full opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏏</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sponsors Found</h3>
            <p className="text-gray-600">
              {selectedSeason ? `No sponsors found for ${selectedSeason}` : 'No sponsors have been added yet.'}
            </p>
          </div>
        )}

        {/* Thank You Section */}
        <div className="mt-24 relative">
          <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-cyan-500 rounded-3xl p-16 text-white text-center overflow-hidden shadow-3xl">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
            <div className="absolute inset-0">
              <div className="absolute top-8 left-8 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
              <div className="absolute bottom-8 right-8 w-24 h-24 bg-white/10 rounded-full animate-float animation-delay-1000"></div>
              <div className="absolute top-1/2 left-12 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
              <div className="absolute top-12 right-1/4 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
              <div className="absolute bottom-12 left-1/4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
            </div>
            
            <div className="relative z-10">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
                <div className="relative bg-white/20 rounded-full p-8 backdrop-blur-sm animate-float">
                  <Heart className="w-12 h-12 text-white animate-pulse" />
                </div>
                <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-300 animate-spin" />
                <Medal className="absolute -bottom-3 -left-3 w-6 h-6 text-pink-300 animate-bounce" />
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black mb-8 animate-gradient-x">
                <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                  🙏 HUGE THANKS 🙏
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                  TO ALL SPONSORS!
                </span>
              </h2>
              
              <p className="text-2xl md:text-3xl font-bold mb-10 max-w-4xl mx-auto leading-relaxed">
                🎆 You are the HEROES behind every amazing match! 🎆
                <br className="hidden md:block" />
                ✨ Together we create cricket magic that lasts forever! ✨
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mt-12">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-8 py-4 shadow-lg shadow-orange-500/50 animate-bounce">
                  <span className="text-white font-black text-lg">🏆 SPORTS EXCELLENCE</span>
                </div>
                <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full px-8 py-4 shadow-lg shadow-blue-500/50 animate-bounce animation-delay-500">
                  <span className="text-white font-black text-lg">🤝 COMMUNITY POWER</span>
                </div>
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-full px-8 py-4 shadow-lg shadow-purple-500/50 animate-bounce animation-delay-1000">
                  <span className="text-white font-black text-lg">❤️ ENDLESS SUPPORT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient-x { animation: gradient-x 4s ease infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .shadow-3xl { box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25); }
      `}</style>
    </div>
  );
};

export default Sponsors;