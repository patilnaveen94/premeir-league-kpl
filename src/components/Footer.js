import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-corporate-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <span className="text-corporate-primary font-bold text-xs">KPL</span>
              </div>
              <span className="font-bold text-base sm:text-lg">Khajjidoni Premier League</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md">
              Your ultimate destination for Khajjidoni Premier League updates.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link to="/teams" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Teams</Link></li>
              <li><Link to="/stats" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Stats</Link></li>
              <li><Link to="/cricheroes" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">CricHeroes</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-sm mb-2">More</h3>
            <ul className="space-y-1">
              <li><Link to="/news" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">News</Link></li>
              <li><Link to="/sponsors" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Sponsors</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-4 pt-4 text-center">
          <p className="text-gray-400 text-xs">
            © {currentYear} Khajjidoni Premier League. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;