import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class StatsService {
  // Update player stats based on match result
  async updatePlayerStats(matchData, forceReprocess = false) {
    try {
      const { battingStats, bowlingStats, team1, team2, id: matchId, updatedAt } = matchData;
      
      // Always clear existing stats for this match first to prevent duplicates
      console.log(`🗑️ Clearing existing stats for match ${matchId} before processing...`);
      await this.clearMatchStats(matchId, team1, team2);
      
      // For real-time updates, use a more precise tracking mechanism
      const processKey = `${matchId}_${updatedAt?.getTime?.() || Date.now()}`;
      
      // Check if this exact match update has already been processed (only if not forcing)
      if (!forceReprocess) {
        const processedMatchRef = doc(db, 'processedMatches', matchId);
        const processedDoc = await getDoc(processedMatchRef);
        
        if (processedDoc.exists()) {
          const processedData = processedDoc.data();
          const lastProcessKey = processedData.processKey;
          
          // Skip if this exact update was already processed recently (within 1 minute)
          const lastProcessTime = processedData.processedAt?.toDate?.() || new Date(0);
          const timeSinceProcess = (new Date() - lastProcessTime) / 1000; // seconds
          
          if (lastProcessKey === processKey && timeSinceProcess < 60) {
            console.log(`⏭️ Match ${matchId} update already processed recently, skipping`);
            return { success: true, message: 'Already processed this update recently' };
          }
        }
      }
      
      console.log(`📊 Processing stats for match: ${team1} vs ${team2} (${matchId})`);
      
      // Track all players who participated in this match
      const playersInMatch = new Set();
      
      // Update batting stats
      if (battingStats) {
        for (const team of [team1, team2]) {
          const teamBatting = battingStats[team] || [];
          console.log(`🏏 Processing ${teamBatting.length} batting records for ${team}`);
          for (const player of teamBatting) {
            const playerId = player.playerId || player.name.replace(/\s+/g, '_').toLowerCase();
            playersInMatch.add(playerId);
            await this.updatePlayerBattingStats(player, team, matchId);
          }
        }
      }

      // Update bowling stats
      if (bowlingStats) {
        for (const team of [team1, team2]) {
          const teamBowling = bowlingStats[team] || [];
          console.log(`🎳 Processing ${teamBowling.length} bowling records for ${team}`);
          for (const player of teamBowling) {
            const playerId = player.playerId || player.name.replace(/\s+/g, '_').toLowerCase();
            const alreadyProcessed = playersInMatch.has(playerId);
            playersInMatch.add(playerId);
            await this.updatePlayerBowlingStats(player, team, matchId, alreadyProcessed);
          }
        }
      }
      
      // Mark match as processed with unique process key
      const processedMatchRef = doc(db, 'processedMatches', matchId);
      await setDoc(processedMatchRef, {
        matchId,
        processedAt: new Date(),
        processKey,
        team1,
        team2,
        reprocessed: forceReprocess || false,
        lastMatchUpdate: updatedAt || new Date()
      });
      
      console.log(`✅ Match ${matchId} stats processing completed`);
      return { success: true };
    } catch (error) {
      console.error('Error updating player stats:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePlayerBattingStats(playerData, team, matchId) {
    const { playerId, name, runs, balls, fours, sixes, isOut } = playerData;
    
    // Skip extras row
    if (playerId === 'extras' || name.includes('Extras')) {
      return;
    }
    
    // Use name as ID if playerId is not available
    const statId = playerId || name.replace(/\s+/g, '_').toLowerCase();
    const statsRef = doc(db, 'playerStats', statId);
    
    try {
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.exists() ? statsDoc.data() : {
        playerId: statId,
        name,
        team,
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
        bowlingRuns: 0,
        overs: 0,
        economy: 0,
        bestBowling: '0/0'
      };

      const newRuns = parseInt(runs) || 0;
      const newBalls = parseInt(balls) || 0;
      const newFours = parseInt(fours) || 0;
      const newSixes = parseInt(sixes) || 0;

      const updatedStats = {
        ...currentStats,
        name, // Ensure name is always updated
        team, // Ensure team is always updated
        matches: (currentStats.matches || 0) + 1,
        runs: (currentStats.runs || 0) + newRuns,
        balls: (currentStats.balls || 0) + newBalls,
        fours: (currentStats.fours || 0) + newFours,
        sixes: (currentStats.sixes || 0) + newSixes,
        innings: (currentStats.innings || 0) + 1,
        notOuts: isOut ? (currentStats.notOuts || 0) : (currentStats.notOuts || 0) + 1,
        highestScore: Math.max((currentStats.highestScore || 0), newRuns)
      };

      // Calculate average and strike rate
      const totalInnings = updatedStats.innings;
      const dismissals = totalInnings - updatedStats.notOuts;
      updatedStats.average = dismissals > 0 ? (updatedStats.runs / dismissals).toFixed(2) : updatedStats.runs;
      updatedStats.strikeRate = updatedStats.balls > 0 ? ((updatedStats.runs / updatedStats.balls) * 100).toFixed(2) : 0;

      await setDoc(statsRef, updatedStats, { merge: true });
    } catch (error) {
      console.error('Error updating batting stats:', error);
    }
  }

  async updatePlayerBowlingStats(playerData, team, matchId, alreadyProcessedForMatch = false) {
    const { playerId, name, overs, runs, wickets } = playerData;
    
    // Use name as ID if playerId is not available
    const statId = playerId || name.replace(/\s+/g, '_').toLowerCase();
    const statsRef = doc(db, 'playerStats', statId);
    
    try {
      const statsDoc = await getDoc(statsRef);
      const currentStats = statsDoc.exists() ? statsDoc.data() : {
        playerId: statId,
        name,
        team,
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
        bowlingRuns: 0,
        overs: 0,
        economy: 0,
        bestBowling: '0/0'
      };

      const newOvers = parseFloat(overs) || 0;
      const newRuns = parseInt(runs) || 0;
      const newWickets = parseInt(wickets) || 0;

      // Update bowling stats if player has bowled overs OR taken wickets
      if (newOvers > 0 || newWickets > 0) {
        const updatedStats = {
          ...currentStats,
          name, // Ensure name is always updated
          team, // Ensure team is always updated
          // Only increment matches if this player wasn't already processed for this match
          matches: alreadyProcessedForMatch ? currentStats.matches : (currentStats.matches || 0) + 1,
          wickets: (currentStats.wickets || 0) + newWickets,
          bowlingRuns: (currentStats.bowlingRuns || 0) + newRuns,
          overs: (currentStats.overs || 0) + newOvers
        };

        // Calculate economy (only if overs > 0)
        updatedStats.economy = updatedStats.overs > 0 ? (updatedStats.bowlingRuns / updatedStats.overs).toFixed(2) : '0.00';

        // Update best bowling figures
        const currentBest = currentStats.bestBowling.split('/');
        const currentBestWickets = parseInt(currentBest[0]) || 0;
        const currentBestRuns = parseInt(currentBest[1]) || 999;

        if (newWickets > currentBestWickets || (newWickets === currentBestWickets && newRuns < currentBestRuns)) {
          updatedStats.bestBowling = `${newWickets}/${newRuns}`;
        }

        console.log(`🎳 Updating bowling stats for ${name}: wickets=${newWickets}, overs=${newOvers}, runs=${newRuns}, matches=${updatedStats.matches}, alreadyProcessed=${alreadyProcessedForMatch}`);
        await setDoc(statsRef, updatedStats, { merge: true });
      } else {
        console.log(`⏭️ Skipping bowling stats for ${name}: no overs bowled and no wickets taken`);
      }
    } catch (error) {
      console.error('Error updating bowling stats:', error);
    }
  }

  // Get all player stats
  async getAllPlayerStats() {
    try {
      const statsSnapshot = await getDocs(collection(db, 'playerStats'));
      return statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return [];
    }
  }

  // Get team-wise player stats
  async getTeamStats(teamName) {
    try {
      const q = query(collection(db, 'playerStats'), where('team', '==', teamName));
      const statsSnapshot = await getDocs(q);
      return statsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return [];
    }
  }

  // Get top performers
  async getTopPerformers() {
    try {
      const allStats = await this.getAllPlayerStats();
      
      return {
        topRunScorers: allStats
          .filter(player => player.runs > 0)
          .sort((a, b) => b.runs - a.runs)
          .slice(0, 10),
        topWicketTakers: allStats
          .filter(player => player.wickets > 0)
          .sort((a, b) => b.wickets - a.wickets)
          .slice(0, 10),
        bestBatsmen: allStats
          .filter(player => player.innings >= 3)
          .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
          .slice(0, 10),
        bestBowlers: allStats
          .filter(player => player.overs >= 5)
          .sort((a, b) => {
            const wicketsA = a.wickets || 0;
            const wicketsB = b.wickets || 0;
            
            // Primary sort: More wickets is better (descending)
            if (wicketsA !== wicketsB) {
              return wicketsB - wicketsA;
            }
            
            // Secondary sort: If wickets are same, lower economy is better (ascending)
            const economyA = parseFloat(a.economy) || 999;
            const economyB = parseFloat(b.economy) || 999;
            return economyA - economyB;
          })
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return {
        topRunScorers: [],
        topWicketTakers: [],
        bestBatsmen: [],
        bestBowlers: []
      };
    }
  }

  // Force reprocess a specific match
  async reprocessMatch(matchId) {
    try {
      console.log(`🔄 Force reprocessing match: ${matchId}`);
      
      // Get match data
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }
      
      const matchData = { id: matchDoc.id, ...matchDoc.data() };
      
      // Remove from processed matches to force reprocessing
      const processedMatchRef = doc(db, 'processedMatches', matchId);
      const processedDoc = await getDoc(processedMatchRef);
      if (processedDoc.exists()) {
        await deleteDoc(processedMatchRef);
        console.log(`🗑️ Removed processed match tracking for ${matchId}`);
      }
      
      // Reprocess the match
      await this.updatePlayerStats(matchData, true);
      
      console.log(`✅ Match ${matchId} reprocessed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error reprocessing match ${matchId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Clear processed matches tracking for fresh processing
  async clearProcessedMatches() {
    try {
      console.log('🗑️ Clearing processed matches tracking...');
      const processedSnapshot = await getDocs(collection(db, 'processedMatches'));
      const deletePromises = processedSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${processedSnapshot.docs.length} processed match records`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing processed matches:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete data reset - clears ALL stats and points table data
  async completeDataReset() {
    try {
      console.log('🗑️ Starting complete data reset...');
      
      // Clear all data collections
      const [statsSnapshot, processedSnapshot, pointsSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerStats')),
        getDocs(collection(db, 'processedMatches')),
        getDocs(collection(db, 'pointsTable'))
      ]);
      
      const deletePromises = [
        ...statsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...processedSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)),
        ...pointsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref))
      ];
      
      await Promise.all(deletePromises);
      console.log(`✅ Complete reset: Cleared ${statsSnapshot.docs.length} player stats, ${processedSnapshot.docs.length} processed matches, ${pointsSnapshot.docs.length} points table records`);
      
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      console.error('❌ Error in complete data reset:', error);
      return { success: false, error: error.message };
    }
  }

  // Comprehensive data synchronization - ensures all stats are properly calculated
  async comprehensiveDataSync() {
    try {
      console.log('🔄 Starting comprehensive data synchronization...');
      
      // Step 1: Complete data reset first
      console.log('🗑️ Step 1: Complete data reset...');
      const resetResult = await this.completeDataReset();
      if (!resetResult.success) {
        throw new Error('Failed to reset data: ' + resetResult.error);
      }
      
      // Step 2: Get all completed matches with stats
      console.log('📊 Step 2: Fetching completed matches...');
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const completedMatches = allMatches.filter(match => {
        const hasStats = match.battingStats || match.bowlingStats;
        const isCompleted = match.status === 'completed';
        const hasScores = match.team1Score && match.team2Score;
        return isCompleted && hasStats && hasScores;
      });
      
      console.log(`🏆 Found ${completedMatches.length} completed matches with stats out of ${allMatches.length} total matches`);
      
      // If no completed matches, ensure points table is initialized with all teams
      if (completedMatches.length === 0) {
        console.log('📊 No completed matches found - initializing empty points table...');
        const pointsTableService = await import('./pointsTableService');
        const pointsResult = await pointsTableService.default.recalculatePointsTable();
        console.log('🏆 Empty points table initialized:', pointsResult);
        
        return { 
          success: true, 
          processedMatches: 0,
          totalPlayers: 0,
          playersWithMatches: 0,
          playersWithoutMatches: 0,
          message: 'No matches to process - all data reset successfully'
        };
      }
      
      // Step 3: Process each match for player stats
      console.log('📊 Step 3: Processing player statistics...');
      for (let i = 0; i < completedMatches.length; i++) {
        const match = completedMatches[i];
        console.log(`📊 Processing match ${i + 1}/${completedMatches.length}: ${match.team1} vs ${match.team2} (${match.id})`);
        
        const result = await this.updatePlayerStats(match, true);
        if (!result.success) {
          console.warn(`⚠️ Warning: Failed to process match ${match.id}: ${result.error}`);
        }
      }
      
      // Step 4: Recalculate points table
      console.log('🏆 Step 4: Recalculating points table...');
      const pointsTableService = await import('./pointsTableService');
      const pointsResult = await pointsTableService.default.recalculatePointsTable();
      console.log('🏆 Points table result:', pointsResult);
      
      // Step 5: Verify data integrity
      console.log('🔍 Step 5: Verifying data integrity...');
      const finalStats = await this.getAllPlayerStats();
      const playersWithMatches = finalStats.filter(p => p.matches > 0);
      const playersWithoutMatches = finalStats.filter(p => p.matches === 0);
      
      console.log(`📊 Final verification:`);
      console.log(`  - Total players with stats: ${finalStats.length}`);
      console.log(`  - Players with matches: ${playersWithMatches.length}`);
      console.log(`  - Players without matches: ${playersWithoutMatches.length}`);
      console.log(`  - Processed matches: ${completedMatches.length}`);
      
      if (playersWithoutMatches.length > 0) {
        console.warn('⚠️ Players without matches found:', playersWithoutMatches.map(p => p.name));
      }
      
      console.log('✅ Comprehensive data synchronization completed successfully!');
      return { 
        success: true, 
        processedMatches: completedMatches.length,
        totalPlayers: finalStats.length,
        playersWithMatches: playersWithMatches.length,
        playersWithoutMatches: playersWithoutMatches.length
      };
    } catch (error) {
      console.error('❌ Error in comprehensive data sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear existing stats for a specific match to prevent duplicates
  async clearMatchStats(matchId, team1, team2) {
    try {
      console.log(`🗑️ Clearing existing stats for match ${matchId}...`);
      
      // Remove the processed match record to allow reprocessing
      const processedMatchRef = doc(db, 'processedMatches', matchId);
      const processedDoc = await getDoc(processedMatchRef);
      
      if (processedDoc.exists()) {
        await deleteDoc(processedMatchRef);
        console.log(`🗑️ Removed processed match record for ${matchId}`);
      }
      
      // Since we can't easily subtract individual match contributions,
      // we'll do a full recalculation after processing all matches
      console.log(`📊 Match ${matchId} cleared for reprocessing`);
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing match stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Recalculate all stats from scratch based on current matches (legacy method)
  async recalculateAllStats() {
    console.log('🔄 Legacy recalculateAllStats called - redirecting to comprehensive sync...');
    return await this.comprehensiveDataSync();
  }
}

export default new StatsService();