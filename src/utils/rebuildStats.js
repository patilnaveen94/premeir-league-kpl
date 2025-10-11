import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import statsService from '../services/statsService';

export const rebuildStatsFromMatches = async () => {
  try {
    console.log('Starting stats rebuild from completed matches...');
    
    // Get all completed matches
    const completedQuery = query(
      collection(db, 'matches'),
      where('status', '==', 'completed')
    );
    const completedSnapshot = await getDocs(completedQuery);
    const completedMatches = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${completedMatches.length} completed matches`);
    
    let processedCount = 0;
    for (const match of completedMatches) {
      if (match.battingStats || match.bowlingStats) {
        console.log(`Processing match: ${match.team1} vs ${match.team2}`);
        await statsService.updatePlayerStats(match);
        processedCount++;
      }
    }
    
    console.log(`Rebuilt stats from ${processedCount} matches`);
    return { success: true, message: `Rebuilt stats from ${processedCount} completed matches` };
  } catch (error) {
    console.error('Error rebuilding stats:', error);
    return { success: false, error: error.message };
  }
};