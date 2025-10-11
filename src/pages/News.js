import React, { useEffect } from 'react';
import { Calendar, User } from 'lucide-react';

const News = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const newsArticles = [
    {
      id: 1,
      title: 'Transfer Window Update: Major Signings Expected',
      excerpt: 'Several Premier League clubs are preparing for significant transfers as the window approaches.',
      author: 'Sports Editor',
      date: '2024-02-12',
      category: 'Transfers'
    },
    {
      id: 2,
      title: 'Manchester City Extends Winning Streak',
      excerpt: 'The Citizens continue their impressive form with another commanding victory at home.',
      author: 'Match Reporter',
      date: '2024-02-11',
      category: 'Match Report'
    },
    {
      id: 3,
      title: 'Arsenal\'s Young Stars Shine in Recent Matches',
      excerpt: 'The Gunners\' academy graduates are making their mark in the first team.',
      author: 'Youth Correspondent',
      date: '2024-02-10',
      category: 'Youth'
    },
    {
      id: 4,
      title: 'Premier League Introduces New VAR Guidelines',
      excerpt: 'Updated video assistant referee protocols aim to improve decision-making consistency.',
      author: 'Rules Analyst',
      date: '2024-02-09',
      category: 'Rules'
    },
    {
      id: 5,
      title: 'Liverpool\'s Injury Update: Key Players Return',
      excerpt: 'The Reds receive a boost as several important players recover from injuries.',
      author: 'Medical Correspondent',
      date: '2024-02-08',
      category: 'Injuries'
    }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      'Transfers': 'bg-blue-100 text-blue-800',
      'Match Report': 'bg-green-100 text-green-800',
      'Youth': 'bg-purple-100 text-purple-800',
      'Rules': 'bg-yellow-100 text-yellow-800',
      'Injuries': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest News</h1>
          <p className="text-xl text-gray-600">Stay updated with Premier League news</p>
        </div>

        <div className="space-y-8">
          {newsArticles.map((article) => (
            <article key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-r from-premier-purple to-premier-pink"></div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </span>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(article.date).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-premier-purple cursor-pointer">
                  {article.title}
                </h2>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {article.excerpt}
                </p>
                
                <button className="text-premier-purple hover:text-premier-purple/80 font-semibold text-sm">
                  Read More →
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="btn-primary">
            Load More Articles
          </button>
        </div>
      </div>
    </div>
  );
};

export default News;