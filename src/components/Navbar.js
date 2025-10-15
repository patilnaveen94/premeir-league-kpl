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

  const handleNavClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMenu();
  }, [closeMenu]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Teams', path: '/teams' },
    { name: 'Stats', path: '/stats' },
    { name: 'Auction', path: '/auction' },
    { name: 'League Stats', path: '/cricheroes' },
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
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 py-2 group" onClick={handleNavClick}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3">
                  <span className="text-white font-bold text-xs sm:text-sm transition-transform duration-300 group-hover:scale-110">KPL</span>
                </div>
                <div className="flex flex-col transition-all duration-300 group-hover:translate-x-1">
                  <span className="font-bold text-base sm:text-lg text-gray-900 transition-colors duration-300 group-hover:text-orange-600">Khajjidoni Premier League</span>
                  <span className="text-xs text-gray-500 -mt-1 transition-colors duration-300 group-hover:text-orange-500">Cricket Tournament</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 border-b-2 text-sm xl:text-base transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                    location.pathname === link.path 
                      ? 'border-cricket-green text-cricket-green' 
                      : 'border-transparent'
                  }`}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAdminLoggedIn ? (
                <>
                  <Link 
                    to="/admin" 
                    className={`mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 border-b-2 text-sm xl:text-base transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${
                      location.pathname === '/admin' 
                        ? 'border-cricket-green text-cricket-green' 
                        : 'border-transparent'
                    }`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Admin
                  </Link>
                  <button
                    onClick={adminLogout}
                    className="touch-target text-gray-700 hover:text-cricket-green mobile-transition transform transition-all duration-300 hover:scale-110 hover:rotate-12"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAdminClick}
                  className="mobile-transition text-gray-700 hover:text-cricket-green font-medium py-2 px-2 xl:px-3 text-sm xl:text-base transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
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
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="touch-target text-gray-700 hover:text-cricket-green mobile-transition transform transition-all duration-300 hover:scale-110"
              >
                <Menu size={18} className="transition-transform duration-300 hover:rotate-90" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="touch-target text-gray-700 hover:text-cricket-green mobile-transition transform transition-all duration-300 hover:scale-110"
                aria-label="Toggle menu"
              >
                {isOpen ? 
                  <X size={20} className="transition-transform duration-300 rotate-90" /> : 
                  <Menu size={20} className="transition-transform duration-300 hover:rotate-90" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Side Menu */}
        <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMenu}></div>
          <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 animate-fade-in">
                  <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <span className="text-white font-bold text-sm">KPL</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white whitespace-nowrap animate-slide-in-right">Khajjidoni Premier League</span>
                    <span className="text-xs text-orange-100 whitespace-nowrap animate-slide-in-right animation-delay-100">Cricket League</span>
                  </div>
                </div>
                <button onClick={closeMenu} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300 transform hover:scale-110 hover:rotate-90">
                  <X size={24} className="text-white transition-transform duration-300" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-1 overflow-y-auto h-full pb-20">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center px-4 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 ${
                    location.pathname === link.path 
                      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600 scale-105' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={handleNavClick}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-lg transition-all duration-300">{link.name}</span>
                </Link>
              ))}
              
              <div className="border-t border-gray-200 mt-4 pt-4">
                {isAdminLoggedIn ? (
                  <>
                    <Link
                      to="/admin"
                      className={`flex items-center px-4 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:translate-x-2 ${
                        location.pathname === '/admin' 
                          ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600 scale-105' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      onClick={handleNavClick}
                    >
                      <span className="text-lg transition-all duration-300">Admin Panel</span>
                    </Link>
                    <button
                      onClick={() => {
                        adminLogout();
                        closeMenu();
                      }}
                      className="flex items-center w-full px-4 py-4 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-300 mt-2 transform hover:scale-105 hover:translate-x-2"
                    >
                      <LogOut size={20} className="mr-3 transition-transform duration-300 hover:rotate-12" />
                      <span className="text-lg transition-all duration-300">Logout</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleAdminClick();
                      closeMenu();
                    }}
                    className="flex items-center w-full px-4 py-4 rounded-xl font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                  >
                    <span className="text-lg transition-all duration-300">Admin Login</span>
                  </button>
                )}
              </div>
            </div>
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