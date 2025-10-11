import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Initialize season settings
export const initializeSeasonSettings = async () => {
  try {
    const settingsRef = doc(db, 'seasonSettings', 'config');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, {
        current: '1',
        published: '1',
        registrationOpen: '1',
        lastUpdated: new Date()
      });
      console.log('Season settings initialized');
    }
  } catch (error) {
    console.error('Error initializing season settings:', error);
  }
};

// Start new season
export const startNewSeason = async (seasonNumber) => {
  try {
    const settingsRef = doc(db, 'seasonSettings', 'config');
    
    // Create new season document
    const seasonRef = doc(db, 'seasons', seasonNumber);
    await setDoc(seasonRef, {
      name: `Season ${seasonNumber}`,
      year: new Date().getFullYear(),
      status: 'upcoming',
      startDate: new Date(),
      createdAt: new Date()
    });
    
    // Update settings to open registration for new season
    await setDoc(settingsRef, {
      current: '1', // Keep current season active
      published: '1', // Keep showing current season
      registrationOpen: seasonNumber, // Open registration for new season
      lastUpdated: new Date()
    }, { merge: true });
    
    console.log(`Season ${seasonNumber} registration opened`);
  } catch (error) {
    console.error('Error starting new season:', error);
  }
};

// Activate new season (make it live)
export const activateNewSeason = async (seasonNumber) => {
  try {
    const settingsRef = doc(db, 'seasonSettings', 'config');
    
    // Update current season
    const seasonRef = doc(db, 'seasons', seasonNumber);
    await setDoc(seasonRef, {
      status: 'active',
      activatedAt: new Date()
    }, { merge: true });
    
    // Mark previous season as completed
    const prevSeasonRef = doc(db, 'seasons', (parseInt(seasonNumber) - 1).toString());
    await setDoc(prevSeasonRef, {
      status: 'completed',
      completedAt: new Date()
    }, { merge: true });
    
    // Update settings
    await setDoc(settingsRef, {
      current: seasonNumber,
      published: seasonNumber,
      registrationOpen: seasonNumber,
      lastUpdated: new Date()
    }, { merge: true });
    
    console.log(`Season ${seasonNumber} activated`);
  } catch (error) {
    console.error('Error activating season:', error);
  }
};