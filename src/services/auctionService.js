import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

class AuctionService {
  // Get all players for auction with their current status
  async getAuctionPlayers(season = 'Season 1') {
    try {
      const [playersSnapshot, teamsSnapshot, statsSnapshot] = await Promise.all([
        getDocs(collection(db, 'playerRegistrations')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'playerStats'))
      ]);

      const teams = {};
      teamsSnapshot.docs.forEach(doc => {
        teams[doc.id] = doc.data();
      });

      const stats = {};
      statsSnapshot.docs.forEach(doc => {
        stats[doc.data().name] = doc.data();
      });

      const players = playersSnapshot.docs.map(doc => {
        const data = doc.data();
        const playerStats = stats[data.fullName] || {};
        return {
          id: doc.id,
          ...data,
          season: data.season || 'Season 1', // Default all existing players to Season 1
          auctionStatus: data.teamId ? 'sold' : 'unsold',
          soldTo: data.teamId ? teams[data.teamId]?.name : null,
          matches: playerStats.matches || 0,
          runs: playerStats.runs || 0,
          wickets: playerStats.wickets || 0,
          average: playerStats.average || '0.00',
          strikeRate: playerStats.strikeRate || '0.00'
        };
      });

      console.log(`🔍 Auction Service Debug:`);
      console.log(`- Total players in database: ${players.length}`);
      console.log(`- Players with approved status: ${players.filter(p => p.status === 'approved').length}`);
      console.log(`- Players with pending status: ${players.filter(p => p.status === 'pending').length}`);
      console.log(`- Players with rejected status: ${players.filter(p => p.status === 'rejected').length}`);
      console.log(`- Players for ${season}: ${players.filter(p => p.season === season).length}`);
      
      // Return ALL players regardless of status for auction page
      const filteredPlayers = players.filter(player => player.season === season);
      console.log(`✅ Returning ${filteredPlayers.length} players for auction`);
      
      return filteredPlayers;
    } catch (error) {
      console.error('Error fetching auction players:', error);
      return [];
    }
  }

  // Update player auction status and team assignment
  async updatePlayerAuction(playerId, teamId, soldPrice = null) {
    try {
      const updateData = {
        teamId: teamId || null,
        auctionStatus: teamId ? 'sold' : 'unsold',
        soldAt: teamId ? new Date() : null,
        updatedAt: new Date()
      };

      if (soldPrice) {
        updateData.soldPrice = soldPrice;
      }

      await updateDoc(doc(db, 'playerRegistrations', playerId), updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating player auction status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get auction statistics
  async getAuctionStats(season = 'Season 1') {
    try {
      const players = await this.getAuctionPlayers(season);
      
      const stats = {
        totalPlayers: players.length,
        soldPlayers: players.filter(p => p.auctionStatus === 'sold').length,
        unsoldPlayers: players.filter(p => p.auctionStatus === 'unsold').length,
        totalValue: players.reduce((sum, p) => sum + (p.soldPrice || 0), 0),
        approvedPlayers: players.filter(p => p.status === 'approved').length,
        pendingPlayers: players.filter(p => p.status === 'pending').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching auction stats:', error);
      return {
        totalPlayers: 0,
        soldPlayers: 0,
        unsoldPlayers: 0,
        totalValue: 0,
        approvedPlayers: 0,
        pendingPlayers: 0
      };
    }
  }

  // Initialize players for new season
  async initializeNewSeason(newSeason) {
    try {
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const updates = [];

      playersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.season) {
          updates.push(
            updateDoc(doc.ref, {
              season: 'Season 1',
              updatedAt: new Date()
            })
          );
        }
      });

      await Promise.all(updates);
      console.log(`✅ Initialized ${updates.length} players for new season`);
      return { success: true };
    } catch (error) {
      console.error('Error initializing new season:', error);
      return { success: false, error: error.message };
    }
  }

  // Get detailed player count breakdown
  async getPlayerCountBreakdown() {
    try {
      const playersSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const breakdown = {
        total: players.length,
        approved: players.filter(p => p.status === 'approved').length,
        pending: players.filter(p => p.status === 'pending').length,
        rejected: players.filter(p => p.status === 'rejected').length,
        season1: players.filter(p => (p.season || 'Season 1') === 'Season 1').length,
        season2: players.filter(p => p.season === 'Season 2').length,
        withTeam: players.filter(p => p.teamId).length,
        withoutTeam: players.filter(p => !p.teamId).length
      };
      
      console.log('📊 Player Count Breakdown:', breakdown);
      return breakdown;
    } catch (error) {
      console.error('Error getting player breakdown:', error);
      return null;
    }
  }
}

const auctionService = new AuctionService();
export default auctionService;