import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import careerStatsService from './careerStatsService';

class SeasonService {
  // Clear current season data while preserving career stats
  async clearSeasonData() {
    try {
      console.log('🔄 Starting season data clear...');
      
      // Step 1: Calculate and preserve career stats before clearing
      console.log('📊 Calculating career stats before clearing...');
      const careerStats = await careerStatsService.calculateCareerStats();
      
      // Step 2: Backup current season data for testing purposes
      console.log('💾 Backing up current season data...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupCollectionName = `seasonBackup_${timestamp}`;
      
      const [matchesSnapshot, playerStatsSnapshot, processedSnapshot, pointsSnapshot, teamsSnapshot, playerRegistrationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'processedMatches')),
        getDocs(collection(db, 'pointsTable')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'playerRegistrations'))
      ]);
      
      // Create backup documents
      const backupPromises = [];
      
      matchesSnapshot.docs.forEach(docSnap => {
        backupPromises.push(
          setDoc(doc(db, backupCollectionName, `match_${docSnap.id}`), {
            type: 'match',
            originalId: docSnap.id,
            data: docSnap.data(),
            backedUpAt: new Date()
          })
        );
      });
      
      playerStatsSnapshot.docs.forEach(docSnap => {
        backupPromises.push(
          setDoc(doc(db, backupCollectionName, `playerStats_${docSnap.id}`), {
            type: 'playerStats',
            originalId: docSnap.id,
            data: docSnap.data(),
            backedUpAt: new Date()
          })
        );
      });
      
      pointsSnapshot.docs.forEach(docSnap => {
        backupPromises.push(
          setDoc(doc(db, backupCollectionName, `pointsTable_${docSnap.id}`), {
            type: 'pointsTable',
            originalId: docSnap.id,
            data: docSnap.data(),
            backedUpAt: new Date()
          })
        );
      });
      
      teamsSnapshot.docs.forEach(docSnap => {
        backupPromises.push(
          setDoc(doc(db, backupCollectionName, `team_${docSnap.id}`), {
            type: 'team',
            originalId: docSnap.id,
            data: docSnap.data(),
            backedUpAt: new Date()
          })
        );
      });
      
      playerRegistrationsSnapshot.docs.forEach(docSnap => {
        backupPromises.push(
          setDoc(doc(db, backupCollectionName, `playerRegistration_${docSnap.id}`), {
            type: 'playerRegistration',
            originalId: docSnap.id,
            data: docSnap.data(),
            backedUpAt: new Date()
          })
        );
      });
      
      await Promise.all(backupPromises);
      console.log(`💾 Season data backed up to collection: ${backupCollectionName}`);
      
      // Step 3: Save career stats to permanent collection
      console.log('💾 Saving career stats to permanent storage...');
      for (const [playerName, stats] of Object.entries(careerStats)) {
        const careerRef = doc(db, 'careerStats', playerName.replace(/\s+/g, '_').toLowerCase());
        await setDoc(careerRef, {
          ...stats,
          lastUpdated: new Date(),
          preservedAt: new Date()
        });
      }
      
      // Step 4: Clear season-specific data (including teams and player registrations)
      console.log('🗑️ Clearing season data...');
      const deletePromises = [
        ...matchesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...playerStatsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...processedSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...pointsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...teamsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...playerRegistrationsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref))
      ];
      
      await Promise.all(deletePromises);
      
      console.log(`✅ Season cleared: ${matchesSnapshot.docs.length} matches, ${playerStatsSnapshot.docs.length} player stats, ${pointsSnapshot.docs.length} points records, ${teamsSnapshot.docs.length} teams, ${playerRegistrationsSnapshot.docs.length} player registrations`);
      console.log(`💾 Career stats preserved for ${Object.keys(careerStats).length} players`);
      console.log(`📦 Backup created: ${backupCollectionName}`);
      
      return { 
        success: true, 
        clearedMatches: matchesSnapshot.docs.length,
        clearedStats: playerStatsSnapshot.docs.length,
        clearedTeams: teamsSnapshot.docs.length,
        clearedPlayerRegistrations: playerRegistrationsSnapshot.docs.length,
        preservedCareerStats: Object.keys(careerStats).length,
        backupCollection: backupCollectionName
      };
    } catch (error) {
      console.error('❌ Error clearing season data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get career stats for a player by mobile number
  async getCareerStatsByPhone(phone) {
    try {
      const careerSnapshot = await getDocs(collection(db, 'careerStats'));
      const careerStats = careerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Find stats by phone number
      return careerStats.find(stats => stats.phone === phone) || null;
    } catch (error) {
      console.error('Error fetching career stats by phone:', error);
      return null;
    }
  }

  // Restore season data from backup
  async restoreSeasonData(backupCollectionName) {
    try {
      console.log(`🔄 Restoring season data from backup: ${backupCollectionName}`);
      
      // Get all backup documents
      const backupSnapshot = await getDocs(collection(db, backupCollectionName));
      
      if (backupSnapshot.empty) {
        throw new Error('Backup collection not found or empty');
      }
      
      // Group backup documents by type
      const backupData = {
        matches: [],
        playerStats: [],
        pointsTable: [],
        teams: [],
        playerRegistrations: []
      };
      
      backupSnapshot.docs.forEach(docSnap => {
        const backup = docSnap.data();
        if (backup.type === 'match') {
          backupData.matches.push({ id: backup.originalId, data: backup.data });
        } else if (backup.type === 'playerStats') {
          backupData.playerStats.push({ id: backup.originalId, data: backup.data });
        } else if (backup.type === 'pointsTable') {
          backupData.pointsTable.push({ id: backup.originalId, data: backup.data });
        } else if (backup.type === 'team') {
          backupData.teams.push({ id: backup.originalId, data: backup.data });
        } else if (backup.type === 'playerRegistration') {
          backupData.playerRegistrations.push({ id: backup.originalId, data: backup.data });
        }
      });
      
      // Restore data to original collections
      const restorePromises = [];
      
      backupData.matches.forEach(match => {
        restorePromises.push(
          setDoc(doc(db, 'matches', match.id), {
            ...match.data,
            restoredAt: new Date(),
            restoredFrom: backupCollectionName
          })
        );
      });
      
      backupData.playerStats.forEach(stats => {
        restorePromises.push(
          setDoc(doc(db, 'playerStats', stats.id), {
            ...stats.data,
            restoredAt: new Date(),
            restoredFrom: backupCollectionName
          })
        );
      });
      
      backupData.pointsTable.forEach(points => {
        restorePromises.push(
          setDoc(doc(db, 'pointsTable', points.id), {
            ...points.data,
            restoredAt: new Date(),
            restoredFrom: backupCollectionName
          })
        );
      });
      
      backupData.teams.forEach(team => {
        restorePromises.push(
          setDoc(doc(db, 'teams', team.id), {
            ...team.data,
            restoredAt: new Date(),
            restoredFrom: backupCollectionName
          })
        );
      });
      
      backupData.playerRegistrations.forEach(registration => {
        restorePromises.push(
          setDoc(doc(db, 'playerRegistrations', registration.id), {
            ...registration.data,
            restoredAt: new Date(),
            restoredFrom: backupCollectionName
          })
        );
      });
      
      await Promise.all(restorePromises);
      
      console.log(`✅ Season data restored: ${backupData.matches.length} matches, ${backupData.playerStats.length} player stats, ${backupData.pointsTable.length} points records, ${backupData.teams.length} teams, ${backupData.playerRegistrations.length} player registrations`);
      
      return {
        success: true,
        restoredMatches: backupData.matches.length,
        restoredStats: backupData.playerStats.length,
        restoredPoints: backupData.pointsTable.length,
        restoredTeams: backupData.teams.length,
        restoredPlayerRegistrations: backupData.playerRegistrations.length
      };
    } catch (error) {
      console.error('❌ Error restoring season data:', error);
      return { success: false, error: error.message };
    }
  }

  // List available backups
  async listBackups() {
    try {
      const { listCollections } = await import('firebase/firestore');
      // Note: listCollections is not available in client SDK
      // This is a placeholder - in practice, you'd need to track backups differently
      console.log('📋 Backup listing not available in client SDK');
      return { success: false, error: 'Backup listing not available in client SDK' };
    } catch (error) {
      console.error('❌ Error listing backups:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SeasonService();