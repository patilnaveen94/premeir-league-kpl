import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-corporate-dark text-white mt-auto">
      <div className="responsive-container py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="col-span-1 sm:col-span-2">
            <div className="responsive-flex mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full flex items-center justify-center">
                <span className="text-corporate-primary font-bold text-xs">KPL</span>
              </div>
              <span className="font-bold responsive-text">Khajjidoni Premier League</span>
            </div>
            <p className="text-gray-400 responsive-small max-w-md">
              Your ultimate destination for Khajjidoni Premier League updates.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold responsive-small mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link to="/teams" className="text-gray-400 hover:text-white mobile-transition responsive-small">Teams</Link></li>
              <li><Link to="/stats" className="text-gray-400 hover:text-white mobile-transition responsive-small">Stats</Link></li>
              <li><Link to="/cricheroes" className="text-gray-400 hover:text-white mobile-transition responsive-small">CricHeroes</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold responsive-small mb-2">More</h3>
            <ul className="space-y-1">
              <li><Link to="/news" className="text-gray-400 hover:text-white mobile-transition responsive-small">News</Link></li>
              <li><Link to="/sponsors" className="text-gray-400 hover:text-white mobile-transition responsive-small">Sponsors</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white mobile-transition responsive-small">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-3 sm:mt-4 pt-3 sm:pt-4 text-center">
          <p className="text-gray-400 responsive-small">
            © {currentYear} Khajjidoni Premier League. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;