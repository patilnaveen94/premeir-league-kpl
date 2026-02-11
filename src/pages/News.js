import React, { useEffect } from 'react';
import { Calendar, Trophy, Users, DollarSign } from 'lucide-react';

const News = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const newsArticles = [
    {
      id: 1,
      title: 'KPL Season 2 Officially Announced!',
      description: 'Get ready for the most exciting cricket tournament of the year! KPL Season 2 kicks off on May 1st with bigger prizes, more teams, and thrilling matches.',
      date: '2024-02-15',
      category: 'Announcement',
      icon: Trophy,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 2,
      title: 'Player & Team Registrations Now Open',
      description: 'Registration window is open from March 1st to March 31st. Don\'t miss your chance to be part of KPL Season 2. Register your team or apply as an individual player.',
      date: '2024-02-14',
      category: 'Registration',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      id: 3,
      title: 'Player Auction Scheduled for April',
      description: 'The highly anticipated Player Auction will take place in the first week of April. Team owners will bid for the best talent to build their championship squad.',
      date: '2024-02-13',
      category: 'Auction',
      icon: Users,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 4,
      title: 'Record Prize Money Announced',
      description: 'KPL Season 2 features the biggest prize pool yet! Winners take home ₹20,000, with substantial rewards for top 4 teams. Total prize money exceeds ₹50,000.',
      date: '2024-02-12',
      category: 'Prize Money',
      icon: DollarSign,
      gradient: 'from-yellow-500 to-orange-600'
    }
  ];

  const prizeBreakdown = [
    { position: '1st Prize', amount: '₹20,000', color: 'text-yellow-600' },
    { position: '2nd Prize', amount: '₹15,000', color: 'text-gray-500' },
    { position: '3rd Prize', amount: '₹10,000', color: 'text-orange-600' },
    { position: '4th Prize', amount: '₹7,000', color: 'text-blue-600' }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      'Announcement': 'bg-green-100 text-green-800',
      'Registration': 'bg-blue-100 text-blue-800',
      'Auction': 'bg-purple-100 text-purple-800',
      'Prize Money': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">KPL Season 2 News</h1>
          <p className="text-xl text-gray-600">Stay updated with the latest KPL announcements</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 mb-12">
          {newsArticles.map((article) => {
            const IconComponent = article.icon;
            return (
              <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`h-32 bg-gradient-to-r ${article.gradient} flex items-center justify-center`}>
                  <IconComponent size={48} className="text-white" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>{new Date(article.date).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-premier-purple cursor-pointer">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                    {article.description}
                  </p>
                  
                  <button className="text-premier-purple hover:text-premier-purple/80 font-semibold text-sm transition-colors">
                    Read More →
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Prize Money Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Prize Money Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {prizeBreakdown.map((prize, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${prize.color} mb-1`}>
                  {prize.amount}
                </div>
                <div className="text-sm text-gray-600">
                  {prize.position}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Dates */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Important Dates</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
              <div className="text-3xl font-bold mb-2 ">Mar 1-31</div>
              <div className="text-sm  opacity-90">Registration Open</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg text-white">
              <div className="text-3xl font-bold mb-2">Apr Week 1</div>
              <div className="text-sm opacity-90">Player Auction</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
              <div className="text-3xl font-bold mb-2">May 1</div>
              <div className="text-sm opacity-90">Season 2 Begins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;