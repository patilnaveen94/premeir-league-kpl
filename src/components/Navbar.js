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
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 py-2" onClick={closeMenu}>
                {/* Modern Logo Design */}
                <div className="relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xs sm:text-sm lg:text-base tracking-tight">KPL</span>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                
                {/* Responsive Text */}
                <div className="flex flex-col leading-none">
                  {/* Mobile: Show only KPL */}
                  <div className="sm:hidden">
                    <span className="font-black text-lg text-gray-900 tracking-tight">Khajjidoni</span>
                    <div className="text-xs text-gray-500 font-medium -mt-0.5">Cricket League</div>
                  </div>
                  
                  {/* Tablet: Show abbreviated */}
                  <div className="hidden sm:block lg:hidden">
                    <span className="font-black text-xl text-gray-900 tracking-tight">Khajjidoni PL</span>
                    <div className="text-xs text-gray-500 font-medium -mt-0.5">Premier Cricket League</div>
                  </div>
                  
                  {/* Desktop: Show full name */}
                  <div className="hidden lg:block">
                    <span className="font-black text-xl text-gray-900 tracking-tight">Khajjidoni Premier League</span>
                    <div className="text-xs text-gray-500 font-medium -mt-0.5">Official Cricket Tournament</div>
                  </div>
                </div>
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

        {/* Mobile Side Menu */}
        <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMenu}></div>
          <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl text-white">Navigation</span>
                <button onClick={closeMenu} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-1 overflow-y-auto h-full pb-20">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center px-4 py-4 rounded-xl font-medium transition-all duration-200 ${
                    location.pathname === link.path 
                      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={closeMenu}
                >
                  <span className="text-lg">{link.name}</span>
                </Link>
              ))}
              
              <div className="border-t border-gray-200 mt-4 pt-4">
                {isAdminLoggedIn ? (
                  <>
                    <Link
                      to="/admin"
                      className={`flex items-center px-4 py-4 rounded-xl font-medium transition-all duration-200 ${
                        location.pathname === '/admin' 
                          ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      onClick={closeMenu}
                    >
                      <span className="text-lg">Admin Panel</span>
                    </Link>
                    <button
                      onClick={() => {
                        adminLogout();
                        closeMenu();
                      }}
                      className="flex items-center w-full px-4 py-4 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200 mt-2"
                    >
                      <LogOut size={20} className="mr-3" />
                      <span className="text-lg">Logout</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleAdminClick();
                      closeMenu();
                    }}
                    className="flex items-center w-full px-4 py-4 rounded-xl font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <span className="text-lg">Admin Login</span>
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