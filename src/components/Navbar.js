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
    { name: 'CricHeroes', path: '/cricheroes' },
    { name: 'News', path: '/news' },
    { name: 'Sponsors', path: '/sponsors' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 py-2" onClick={closeMenu}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-corporate-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">KPL</span>
                </div>
                <span className="font-bold text-lg sm:text-xl text-corporate-primary hidden xs:block">Khajjidoni Premier League</span>
                <span className="font-bold text-lg sm:text-xl text-corporate-primary xs:hidden">KPL</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-gray-700 hover:text-corporate-primary transition-colors font-medium py-2 px-1 border-b-2 ${
                    location.pathname === link.path 
                      ? 'border-corporate-primary text-corporate-primary' 
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
                    className={`text-gray-700 hover:text-corporate-primary transition-colors font-medium py-2 px-1 border-b-2 ${
                      location.pathname === '/admin' 
                        ? 'border-corporate-primary text-corporate-primary' 
                        : 'border-transparent'
                    }`}
                  >
                    Admin
                  </Link>
                  <button
                    onClick={adminLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-corporate-primary transition-colors touch-btn"
                  >
                    <LogOut size={16} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAdminClick}
                  className="text-gray-700 hover:text-corporate-primary transition-colors font-medium py-2 px-1"
                >
                  Admin
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-cricket-navy transition-colors touch-btn"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-3 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-3 text-gray-700 hover:text-cricket-navy hover:bg-gray-100 rounded-md transition-colors font-medium ${
                  location.pathname === link.path ? 'text-cricket-navy bg-blue-50' : ''
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
                  className={`block px-3 py-3 text-gray-700 hover:text-cricket-navy hover:bg-gray-100 rounded-md transition-colors font-medium ${
                    location.pathname === '/admin' ? 'text-cricket-navy bg-blue-50' : ''
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
                  className="block w-full text-left px-3 py-3 text-gray-700 hover:text-cricket-navy hover:bg-gray-100 rounded-md transition-colors font-medium"
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
                className="block w-full text-left px-3 py-3 text-gray-700 hover:text-cricket-navy hover:bg-gray-100 rounded-md transition-colors font-medium"
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