import { collection, getDocs, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class SeasonClearingService {
  /**
   * Clear season data while properly preserving and updating career statistics
   */
  async clearSeasonData() {
    try {
      console.log('🔄 Starting season data clearing with career stats preservation...');
      const batch = writeBatch(db);
      let deletedCount = 0;

      // Step 1: Process player statistics - accumulate current season into career stats
      console.log('📊 Processing player statistics...');
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      
      for (const statDoc of statsSnapshot.docs) {
        const currentStats = statDoc.data();
        const playerId = statDoc.id;
        
        console.log(`Processing player: ${currentStats.name}`);
        
        // Calculate new career totals by adding current season stats
        const newCareerStats = {
          // Career runs = existing career runs + current season runs
          careerRuns: (currentStats.careerRuns || 0) + (currentStats.runs || 0),
          careerWickets: (currentStats.careerWickets || 0) + (currentStats.wickets || 0),
          careerMatches: (currentStats.careerMatches || 0) + (currentStats.matches || 0),
          careerBalls: (currentStats.careerBalls || 0) + (currentStats.balls || 0),
          careerFours: (currentStats.careerFours || 0) + (currentStats.fours || 0),
          careerSixes: (currentStats.careerSixes || 0) + (currentStats.sixes || 0),
          careerOvers: (currentStats.careerOvers || 0) + (currentStats.overs || 0),
          careerBowlingRuns: (currentStats.careerBowlingRuns || 0) + (currentStats.bowlingRuns || 0),
          careerMaidens: (currentStats.careerMaidens || 0) + (currentStats.maidens || 0),
          careerInnings: (currentStats.careerInnings || 0) + (currentStats.innings || 0),
          careerNotOuts: (currentStats.careerNotOuts || 0) + (currentStats.notOuts || 0),
          
          // Keep track of highest scores and best bowling
          careerHighestScore: Math.max(
            (currentStats.careerHighestScore || 0), 
            (currentStats.highestScore || 0)
          ),
          careerBestBowling: this.getBetterBowlingFigures(
            currentStats.careerBestBowling || '0/0',
            currentStats.bestBowling || '0/0'
          )
        };

        // Calculate career averages
        const careerDismissals = newCareerStats.careerInnings - newCareerStats.careerNotOuts;
        newCareerStats.careerAverage = careerDismissals > 0 
          ? (newCareerStats.careerRuns / careerDismissals).toFixed(2)
          : newCareerStats.careerRuns.toFixed(2);

        newCareerStats.careerStrikeRate = newCareerStats.careerBalls > 0 
          ? ((newCareerStats.careerRuns / newCareerStats.careerBalls) * 100).toFixed(2)
          : '0.00';

        newCareerStats.careerBowlingAverage = newCareerStats.careerWickets > 0 
          ? (newCareerStats.careerBowlingRuns / newCareerStats.careerWickets).toFixed(2)
          : '0.00';

        newCareerStats.careerEconomy = newCareerStats.careerOvers > 0 
          ? (newCareerStats.careerBowlingRuns / newCareerStats.careerOvers).toFixed(2)
          : '0.00';

        // Reset current season stats to 0
        const resetStats = {
          ...currentStats,
          // Reset current season stats
          matches: 0,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          innings: 0,
          notOuts: 0,
          highestScore: 0,
          average: 0,
          strikeRate: 0,
          wickets: 0,
          overs: 0,
          maidens: 0,
          bowlingRuns: 0,
          economy: 0,
          bestBowling: '0/0',
          
          // Update career stats
          ...newCareerStats,
          
          // Metadata
          lastSeasonReset: new Date(),
          updatedAt: new Date()
        };

        const statRef = doc(db, 'playerStats', playerId);
        batch.set(statRef, resetStats);
        
        console.log(`✅ Updated career stats for ${currentStats.name}:`, {
          careerRuns: newCareerStats.careerRuns,
          careerWickets: newCareerStats.careerWickets,
          careerMatches: newCareerStats.careerMatches
        });
      }

      // Step 2: Clear match-related collections
      const collectionsToReset = [
        'matches',
        'standings', 
        'pointsTable',
        'processedMatches',
        'liveMatches'
      ];

      for (const collectionName of collectionsToReset) {
        console.log(`🗑️ Clearing ${collectionName} collection...`);
        const snapshot = await getDocs(collection(db, collectionName));
        
        snapshot.docs.forEach(docSnapshot => {
          batch.delete(doc(db, collectionName, docSnapshot.id));
          deletedCount++;
        });
      }

      // Step 3: Reset team player assignments
      console.log('🏏 Resetting team player assignments...');
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      teamsSnapshot.docs.forEach(teamDoc => {
        const teamRef = doc(db, 'teams', teamDoc.id);
        batch.update(teamRef, {
          players: [],
          updatedAt: new Date(),
          lastSeasonReset: new Date()
        });
      });

      // Step 4: Reset player team assignments
      console.log('👥 Resetting player team assignments...');
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      playersSnapshot.docs.forEach(playerDoc => {
        const playerRef = doc(db, 'playerRegistrations', playerDoc.id);
        batch.update(playerRef, {
          teamId: null,
          assignedAt: null,
          updatedAt: new Date()
        });
      });

      // Commit all changes
      console.log('💾 Committing all changes...');
      await batch.commit();

      console.log('✅ Season data clearing completed successfully');
      return {
        success: true,
        message: `Season cleared successfully. Career stats preserved and updated for ${statsSnapshot.docs.length} players.`,
        details: {
          collectionsReset: collectionsToReset,
          documentsDeleted: deletedCount,
          teamsReset: teamsSnapshot.docs.length,
          playersReset: playersSnapshot.docs.length,
          statsUpdated: statsSnapshot.docs.length
        }
      };

    } catch (error) {
      console.error('❌ Error clearing season data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper function to determine better bowling figures
   */
  getBetterBowlingFigures(current, newFigures) {
    if (!current || current === '0/0') return newFigures;
    if (!newFigures || newFigures === '0/0') return current;

    const [currentWickets, currentRuns] = current.split('/').map(Number);
    const [newWickets, newRuns] = newFigures.split('/').map(Number);

    // More wickets is better
    if (newWickets > currentWickets) return newFigures;
    if (currentWickets > newWickets) return current;

    // Same wickets, fewer runs is better
    if (newRuns < currentRuns) return newFigures;
    return current;
  }

  /**
   * Get preview of what will be cleared
   */
  async getSeasonClearPreview() {
    try {
      const collections = ['matches', 'standings', 'pointsTable', 'processedMatches', 'liveMatches'];
      const preview = {};
      let totalDocuments = 0;

      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        preview[collectionName] = snapshot.docs.length;
        totalDocuments += snapshot.docs.length;
      }

      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));

      // Get current season totals that will be moved to career stats
      let totalCurrentRuns = 0;
      let totalCurrentWickets = 0;
      let totalCurrentMatches = 0;

      for (const statDoc of statsSnapshot.docs) {
        const stats = statDoc.data();
        totalCurrentRuns += stats.runs || 0;
        totalCurrentWickets += stats.wickets || 0;
        totalCurrentMatches += stats.matches || 0;
      }

      return {
        success: true,
        preview: {
          ...preview,
          totalDocumentsToDelete: totalDocuments,
          teamsToReset: teamsSnapshot.docs.length,
          playersToReset: playersSnapshot.docs.length,
          statsToUpdate: statsSnapshot.docs.length,
          currentSeasonTotals: {
            runs: totalCurrentRuns,
            wickets: totalCurrentWickets,
            matches: totalCurrentMatches
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new SeasonClearingService();