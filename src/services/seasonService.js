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
      const newSeasonStats = await careerStatsService.calculateCareerStats();
      
      // Step 2: Fetch existing career stats and merge with new season stats
      console.log('📊 Merging with existing career stats...');
      const existingCareerSnapshot = await getDocs(collection(db, 'careerStats'));
      const existingCareerStats = {};
      
      existingCareerSnapshot.docs.forEach(docSnap => {
        existingCareerStats[docSnap.id] = docSnap.data();
      });
      
      // Merge new season stats with existing career stats
      const mergedCareerStats = { ...existingCareerStats };
      
      for (const [playerKey, newStats] of Object.entries(newSeasonStats)) {
        // Use phone number as the primary reference for merging
        const phoneKey = newStats.phone ? newStats.phone.replace(/\s+/g, '_').toLowerCase() : null;
        const lookupKey = phoneKey || playerKey; // Use phone if available, otherwise use the calculated key
        
        if (mergedCareerStats[lookupKey]) {
          // Player already has career stats - accumulate
          const existing = mergedCareerStats[lookupKey];
          console.log(`📈 Accumulating stats for ${newStats.name} (Phone: ${newStats.phone}): Previous=${existing.totalRuns} runs, New=${newStats.totalRuns} runs`);
          
          mergedCareerStats[lookupKey] = {
            name: newStats.name,
            phone: newStats.phone || existing.phone,
            totalMatches: (existing.totalMatches || 0) + (newStats.totalMatches || 0),
            totalRuns: (existing.totalRuns || 0) + (newStats.totalRuns || 0),
            totalWickets: (existing.totalWickets || 0) + (newStats.totalWickets || 0),
            totalBallsFaced: (existing.totalBallsFaced || 0) + (newStats.totalBallsFaced || 0),
            totalBallsBowled: (existing.totalBallsBowled || 0) + (newStats.totalBallsBowled || 0),
            totalRunsConceded: (existing.totalRunsConceded || 0) + (newStats.totalRunsConceded || 0),
            highestScore: Math.max(existing.highestScore || 0, newStats.highestScore || 0),
            bestBowling: this.compareBowlingFigures(existing.bestBowling, newStats.bestBowling),
            seasonsPlayed: [...new Set([...(existing.seasonsPlayed || []), ...(newStats.seasonsPlayed || [])])],
            lastUpdated: new Date(),
            preservedAt: new Date()
          };
          
          // Recalculate derived stats
          const merged = mergedCareerStats[lookupKey];
          merged.battingAverage = merged.totalMatches > 0 && merged.totalRuns > 0 
            ? (merged.totalRuns / merged.totalMatches).toFixed(2)
            : '0.00';
          merged.strikeRate = merged.totalBallsFaced > 0 
            ? ((merged.totalRuns / merged.totalBallsFaced) * 100).toFixed(2)
            : '0.00';
          merged.bowlingAverage = merged.totalWickets > 0 
            ? (merged.totalRunsConceded / merged.totalWickets).toFixed(2)
            : '0.00';
          merged.economy = merged.totalBallsBowled > 0 
            ? ((merged.totalRunsConceded / merged.totalBallsBowled) * 6).toFixed(2)
            : '0.00';
        } else {
          // New player - add to career stats
          console.log(`✨ Adding new player to career stats: ${newStats.name} (Phone: ${newStats.phone})`);
          mergedCareerStats[lookupKey] = {
            ...newStats,
            lastUpdated: new Date(),
            preservedAt: new Date()
          };
        }
      }
      
      // Step 3: Backup current season data for testing purposes
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
      
      // Step 4: Save merged career stats to permanent collection
      console.log('💾 Saving merged career stats to permanent storage...');
      for (const [playerKey, stats] of Object.entries(mergedCareerStats)) {
        const careerRef = doc(db, 'careerStats', playerKey);
        await setDoc(careerRef, stats);
      }
      
      // Step 5: Clear season-specific data (including teams and player registrations)
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
      console.log(`💾 Career stats preserved for ${Object.keys(mergedCareerStats).length} players`);
      console.log(`📦 Backup created: ${backupCollectionName}`);
      
      return { 
        success: true, 
        clearedMatches: matchesSnapshot.docs.length,
        clearedStats: playerStatsSnapshot.docs.length,
        clearedTeams: teamsSnapshot.docs.length,
        clearedPlayerRegistrations: playerRegistrationsSnapshot.docs.length,
        preservedCareerStats: Object.keys(mergedCareerStats).length,
        backupCollection: backupCollectionName
      };
    } catch (error) {
      console.error('❌ Error clearing season data:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to compare bowling figures and return the better one
  compareBowlingFigures(fig1, fig2) {
    if (!fig1 || fig1 === '0/0') return fig2 || '0/0';
    if (!fig2 || fig2 === '0/0') return fig1 || '0/0';
    
    const wickets1 = parseInt(fig1.split('/')[0]) || 0;
    const wickets2 = parseInt(fig2.split('/')[0]) || 0;
    
    if (wickets2 > wickets1) return fig2;
    if (wickets1 > wickets2) return fig1;
    
    // If same wickets, compare runs
    const runs1 = parseInt(fig1.split('/')[1]) || 0;
    const runs2 = parseInt(fig2.split('/')[1]) || 0;
    
    return runs2 < runs1 ? fig2 : fig1;
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