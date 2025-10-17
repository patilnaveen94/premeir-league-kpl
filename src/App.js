import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import { SeasonProvider } from './context/SeasonContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';
import realTimeSync from './services/realTimeSync';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Teams = lazy(() => import('./pages/Teams'));
const News = lazy(() => import('./pages/News'));
const Contact = lazy(() => import('./pages/Contact'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const PlayerRegistration = lazy(() => import('./pages/PlayerRegistration'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CricHeroesStats = lazy(() => import('./pages/CricHeroesStats'));
const CricHeroesHome = lazy(() => import('./pages/CricHeroesHome'));
const Auction = lazy(() => import('./pages/Auction'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  useEffect(() => {
    // Temporarily disable real-time sync to prevent duplicate processing
    // realTimeSync.initialize();
    console.log('⚠️ Real-time sync disabled to prevent duplicate stats');
    
    // Cleanup on unmount
    return () => {
      // realTimeSync.cleanup();
    };
  }, []);

  return (
    <SeasonProvider>
      <AdminProvider>
        <Router>
          <div className="App flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-14 sm:pt-16">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/stats" element={<CricHeroesStats />} />
                  <Route path="/auction" element={<Auction />} />
                  <Route path="/cricheroes" element={<CricHeroesHome />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/sponsors" element={<Sponsors />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/player-registration" element={<PlayerRegistration />} />
                  <Route path="/admin" element={<AdminPanel />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <ScrollToTop />
          </div>
        </Router>
      </AdminProvider>
    </SeasonProvider>
  );
}

export default App;