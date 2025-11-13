import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class DataResetService {
  /**
   * Reset all tournament data except player career statistics
   * This preserves player registration data and career stats while clearing current season data
   */
  async resetTournamentData() {
    try {
      console.log('🔄 Starting tournament data reset...');
      const batch = writeBatch(db);
      let deletedCount = 0;

      // Collections to reset (clear all documents)
      const collectionsToReset = [
        'matches',
        'standings', 
        'pointsTable',
        'processedMatches',
        'liveMatches'
      ];

      // Reset specified collections
      for (const collectionName of collectionsToReset) {
        console.log(`🗑️ Clearing ${collectionName} collection...`);
        const snapshot = await getDocs(collection(db, collectionName));
        
        snapshot.docs.forEach(docSnapshot => {
          batch.delete(doc(db, collectionName, docSnapshot.id));
          deletedCount++;
        });
      }

      // Reset team-specific data (clear players array but keep team info)
      console.log('🏏 Resetting team player assignments...');
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      teamsSnapshot.docs.forEach(teamDoc => {
        const teamRef = doc(db, 'teams', teamDoc.id);
        batch.update(teamRef, {
          players: [],
          updatedAt: new Date(),
          resetAt: new Date()
        });
      });

      // Reset player team assignments (but keep registration data and career stats)
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

      // Reset current season statistics (but preserve career stats)
      console.log('📊 Resetting current season player statistics...');
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      statsSnapshot.docs.forEach(statDoc => {
        const statData = statDoc.data();
        
        // Preserve career totals but reset current season stats
        const resetStats = {
          ...statData,
          // Reset current season stats
          matches: 0,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          overs: 0,
          maidens: 0,
          runsGiven: 0,
          economy: 0,
          battingAverage: 0,
          strikeRate: 0,
          bowlingAverage: 0,
          // Keep career stats intact (if they exist)
          careerStats: statData.careerStats || {
            totalMatches: statData.matches || 0,
            totalRuns: statData.runs || 0,
            totalWickets: statData.wickets || 0,
            totalBalls: statData.balls || 0,
            totalFours: statData.fours || 0,
            totalSixes: statData.sixes || 0,
            totalOvers: statData.overs || 0,
            totalRunsGiven: statData.runsGiven || 0
          },
          updatedAt: new Date(),
          resetAt: new Date()
        };

        const statRef = doc(db, 'playerStats', statDoc.id);
        batch.set(statRef, resetStats);
      });

      // Commit all changes
      await batch.commit();

      console.log('✅ Tournament data reset completed successfully');
      return {
        success: true,
        message: `Tournament data reset completed. ${deletedCount} documents cleared.`,
        details: {
          collectionsReset: collectionsToReset,
          documentsDeleted: deletedCount,
          teamsReset: teamsSnapshot.docs.length,
          playersReset: playersSnapshot.docs.length,
          statsReset: statsSnapshot.docs.length
        }
      };

    } catch (error) {
      console.error('❌ Error resetting tournament data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get reset confirmation details
   */
  async getResetPreview() {
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

      return {
        success: true,
        preview: {
          ...preview,
          totalDocumentsToDelete: totalDocuments,
          teamsToReset: teamsSnapshot.docs.length,
          playersToReset: playersSnapshot.docs.length,
          statsToReset: statsSnapshot.docs.length
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

export default new DataResetService();