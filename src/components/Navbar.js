import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import AdminLogin from './AdminLogin';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { isAdminLoggedIn, adminLogout } = useAdmin();
  const location = useLocation();

  const handleAdminClick = useCallback(() => {
    if (!isAdminLoggedIn) {
      setShowAdminLogin(true);
    }
  }, [isAdminLoggedIn]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Teams', path: '/teams' },
    { name: 'Stats', path: '/stats' },
    { name: 'Auction', path: '/auction' },
    { name: 'CricHeroes', path: '/cricheroes' },
    { name: 'News', path: '/news' },
    { name: 'Sponsors', path: '/sponsors' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
        <div className="responsive-container">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="responsive-flex py-2" onClick={closeMenu}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm lg:text-base">KPL</span>
                </div>
                <span className="font-bold text-sm sm:text-lg lg:text-xl text-cricket-navy hidden xs:block truncate">Khajjidoni Premier League</span>
                <span className="font-bold text-lg text-cricket-navy xs:hidden">KPL</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 border-b-2 text-sm xl:text-base ${
                    location.pathname === link.path 
                      ? 'border-cricket-green text-cricket-green' 
                      : 'border-transparent'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAdminLoggedIn ? (
                <>
                  <Link 
                    to="/admin" 
                    className={`mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 border-b-2 text-sm xl:text-base ${
                      location.pathname === '/admin' 
                        ? 'border-cricket-green text-cricket-green' 
                        : 'border-transparent'
                    }`}
                  >
                    Admin
                  </Link>
                  <button
                    onClick={adminLogout}
                    className="touch-target text-gray-700 hover:text-cricket-green mobile-transition"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAdminClick}
                  className="mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 text-sm xl:text-base"
                >
                  Admin
                </button>
              )}
            </div>

            {/* Tablet Navigation */}
            <div className="hidden md:flex lg:hidden items-center space-x-2">
              {navLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 text-xs ${
                    location.pathname === link.path ? 'text-cricket-green' : ''
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="touch-target text-gray-700 hover:text-cricket-green mobile-transition"
              >
                <Menu size={18} />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="touch-target text-gray-700 hover:text-cricket-green mobile-transition"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        <div className={`lg:hidden mobile-transition overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="mobile-padding space-y-1 bg-gray-50 border-t border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`touch-button w-full text-left text-gray-700 hover:text-cricket-green hover:bg-gray-100 rounded-lg mobile-transition ${
                  location.pathname === link.path ? 'text-cricket-green bg-cricket-green/10' : ''
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
            
            {isAdminLoggedIn ? (
              <>
                <Link
                  to="/admin"
                  className={`touch-button w-full text-left text-gray-700 hover:text-cricket-green hover:bg-gray-100 rounded-lg mobile-transition ${
                    location.pathname === '/admin' ? 'text-cricket-green bg-cricket-green/10' : ''
                  }`}
                  onClick={closeMenu}
                >
                  Admin
                </Link>
                <button
                  onClick={() => {
                    adminLogout();
                    closeMenu();
                  }}
                  className="touch-button w-full text-left text-gray-700 hover:text-cricket-green hover:bg-gray-100 rounded-lg mobile-transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleAdminClick();
                  closeMenu();
                }}
                className="touch-button w-full text-left text-gray-700 hover:text-cricket-green hover:bg-gray-100 rounded-lg mobile-transition"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}
    </>
  );
};

export default Navbar;