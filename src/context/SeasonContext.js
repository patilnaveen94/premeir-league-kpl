import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const SeasonContext = createContext();

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};

export const SeasonProvider = ({ children }) => {
  const [currentSeason, setCurrentSeason] = useState('1');
  const [publishedSeason, setPublishedSeason] = useState('1');
  const [registrationSeason, setRegistrationSeason] = useState('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to season settings in real-time
    const unsubscribe = onSnapshot(doc(db, 'seasonSettings', 'config'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentSeason(data.current || '1');
        setPublishedSeason(data.published || '1');
        setRegistrationSeason(data.registrationOpen || '1');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentSeason,
    publishedSeason,
    registrationSeason,
    loading
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
};