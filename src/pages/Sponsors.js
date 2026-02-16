import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Award, Building, Trophy, Users, Star, ChevronDown, ExternalLink, Mail, Phone, ArrowRight } from 'lucide-react';
import { db } from '../firebase/firebase';

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

  const getSponsorTypeInfo = (type) => {
    switch (type) {
      case 'title': return { icon: Trophy, label: 'Title Sponsor', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' };
      case 'prize': return { icon: Award, label: 'Prize Sponsor', color: 'bg-purple-50 border-purple-200 text-purple-800' };
      case 'food': return { icon: Building, label: 'Food Partner', color: 'bg-orange-50 border-orange-200 text-orange-800' };
      case 'team': return { icon: Users, label: 'Team Sponsor', color: 'bg-green-50 border-green-200 text-green-800' };
      case 'organization': return { icon: Building, label: 'Organization Partner', color: 'bg-blue-50 border-blue-200 text-blue-800' };
      case 'equipment': return { icon: Star, label: 'Equipment Partner', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' };
      default: return { icon: Building, label: 'Partner', color: 'bg-gray-50 border-gray-200 text-gray-800' };
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

  const sponsorTypeOrder = ['title', 'prize', 'organization', 'team', 'equipment', 'food'];
  const sortedGroups = Object.entries(groupedSponsors).sort(([a], [b]) => {
    const aIndex = sponsorTypeOrder.indexOf(a);
    const bIndex = sponsorTypeOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sponsors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 sm:py-28 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-6">
              <span className="text-sm font-bold text-green-400 uppercase tracking-widest">Khajjidoni Premier League</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Our Partners
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Celebrating the organizations and leaders who support cricket excellence and community development
            </p>
          </div>
        </div>
      </section>

      {/* Season 2 Title Sponsor - John Deere */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Label */}
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-green-600 uppercase tracking-widest">Season 2 Title Sponsor</span>
          </div>

          {/* Title Sponsor Card */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {/* Left - Logo Area */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 sm:p-10 flex items-center justify-center min-h-64 sm:min-h-auto">
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">John Deere</div>
                  <p className="text-sm font-semibold text-green-700">Official Title Sponsor</p>
                </div>
              </div>

              {/* Right - Details */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">About</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Global leader in agricultural equipment and technology with 190+ years of innovation and excellence.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Partnership</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Supporting Khajjidoni Premier League Season 2 with commitment to excellence and community development.
                    </p>
                  </div>

                  <div className="pt-2">
                    <a 
                      href="https://www.deere.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Sponsors Section */}
      {sortedGroups.length > 0 && (
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">All Partners</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto"></div>
            </div>

            {/* Season Filter */}
            {seasons.length > 0 && (
              <div className="mb-12 flex justify-center">
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-6 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Seasons</option>
                    {seasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Sponsors by Type */}
            <div className="space-y-16">
              {sortedGroups.map(([type, typeSponsors]) => {
                const typeInfo = getSponsorTypeInfo(type);
                const IconComponent = typeInfo.icon;
                
                return (
                  <div key={type}>
                    {/* Type Header */}
                    <div className="mb-8 flex items-center">
                      <div className="bg-green-600 rounded-lg p-3 mr-4">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{typeInfo.label}s</h3>
                        <p className="text-gray-600">{typeSponsors.length} {typeSponsors.length === 1 ? 'Partner' : 'Partners'}</p>
                      </div>
                    </div>
                    
                    {/* Sponsors Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {typeSponsors.map((sponsor) => (
                        <div 
                          key={sponsor.id} 
                          className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                          {/* Logo Area */}
                          <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            {sponsor.photoBase64 ? (
                              <img 
                                src={sponsor.photoBase64} 
                                alt={sponsor.name}
                                className="max-w-full max-h-full object-contain p-4"
                              />
                            ) : (
                              <div className="text-center">
                                <Building className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                <span className="text-gray-500 font-medium text-sm">{sponsor.name}</span>
                              </div>
                            )}
                          </div>
                        
                          {/* Content */}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="text-lg font-bold text-gray-900 flex-1">
                                {sponsor.name}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color} ml-3 flex-shrink-0`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            
                            {sponsor.description && (
                              <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                                {sponsor.description}
                              </p>
                            )}
                            
                            <div className="space-y-2 text-sm mb-4">
                              {sponsor.season && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Season:</span>
                                  <span className="font-medium text-gray-900">{sponsor.season}</span>
                                </div>
                              )}
                              {sponsor.contribution && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Contribution:</span>
                                  <span className="font-medium text-gray-900">{sponsor.contribution}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Contact Links */}
                            {(sponsor.email || sponsor.phone || sponsor.website) && (
                              <div className="pt-4 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                  {sponsor.website && (
                                    <a 
                                      href={sponsor.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Website
                                    </a>
                                  )}
                                  {sponsor.email && (
                                    <a 
                                      href={`mailto:${sponsor.email}`}
                                      className="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium"
                                    >
                                      <Mail className="w-3 h-3 mr-1" />
                                      Email
                                    </a>
                                  )}
                                  {sponsor.phone && (
                                    <a 
                                      href={`tel:${sponsor.phone}`}
                                      className="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium"
                                    >
                                      <Phone className="w-3 h-3 mr-1" />
                                      Call
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Partnership Opportunities */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 lg:p-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Partnership Opportunities
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join our growing community of partners and support cricket excellence while gaining valuable brand exposure and community engagement opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Brand Visibility</h3>
                <p className="text-gray-600 text-sm">Prominent logo placement and brand recognition throughout the tournament</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Community Impact</h3>
                <p className="text-gray-600 text-sm">Support local cricket development and community engagement initiatives</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Networking</h3>
                <p className="text-gray-600 text-sm">Connect with other business leaders and expand your professional network</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <a 
                href="mailto:info@khajjidoni.com"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105"
              >
                Get in Touch
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;
