// Fix duplicate player stats - Run this script to clean up duplicate data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDuplicateStats() {
  try {
    console.log('🔧 Starting duplicate stats fix...');
    
    // Step 1: Clear all existing stats
    console.log('🗑️ Clearing all player stats...');
    const statsSnapshot = await getDocs(collection(db, 'playerStats'));
    const deletePromises = statsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${statsSnapshot.docs.length} player stat records`);
    
    // Step 2: Clear processed matches tracking
    console.log('🗑️ Clearing processed matches...');
    const processedSnapshot = await getDocs(collection(db, 'processedMatches'));
    const processedDeletePromises = processedSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(processedDeletePromises);
    console.log(`✅ Cleared ${processedSnapshot.docs.length} processed match records`);
    
    // Step 3: Clear points table
    console.log('🗑️ Clearing points table...');
    const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
    const pointsDeletePromises = pointsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(pointsDeletePromises);
    console.log(`✅ Cleared ${pointsSnapshot.docs.length} points table records`);
    
    // Step 4: Get all completed matches
    console.log('📊 Fetching completed matches...');
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const completedMatches = matches.filter(match => 
      match.status === 'completed' && 
      (match.battingStats || match.bowlingStats)
    );
    console.log(`📊 Found ${completedMatches.length} completed matches to process`);
    
    // Step 5: Recalculate stats from scratch
    const playerStats = {};
    
    for (const match of completedMatches) {
      console.log(`Processing: ${match.team1} vs ${match.team2}`);
      
      // Process batting stats
      if (match.battingStats) {
        for (const [teamName, teamBatting] of Object.entries(match.battingStats)) {
          if (Array.isArray(teamBatting)) {
            for (const player of teamBatting) {
              if (!player.playerId || player.playerId === 'extras') continue;
              
              if (!playerStats[player.playerId]) {
                playerStats[player.playerId] = {
                  playerId: player.playerId,
                  name: player.name,
                  team: teamName,
                  matches: 0,
                  runs: 0,
                  balls: 0,
                  fours: 0,
                  sixes: 0,
                  innings: 0,
                  notOuts: 0,
                  highestScore: 0,
                  wickets: 0,
                  bowlingRuns: 0,
                  overs: 0
                };
              }
              
              const stats = playerStats[player.playerId];
              stats.matches = Math.max(stats.matches, 1);
              stats.runs += parseInt(player.runs) || 0;
              stats.balls += parseInt(player.balls) || 0;
              stats.fours += parseInt(player.fours) || 0;
              stats.sixes += parseInt(player.sixes) || 0;
              stats.innings += 1;
              stats.notOuts += player.isOut ? 0 : 1;
              stats.highestScore = Math.max(stats.highestScore, parseInt(player.runs) || 0);
            }
          }
        }
      }
      
      // Process bowling stats
      if (match.bowlingStats) {
        for (const [teamName, teamBowling] of Object.entries(match.bowlingStats)) {
          if (Array.isArray(teamBowling)) {
            for (const player of teamBowling) {
              if (!player.playerId) continue;
              
              if (!playerStats[player.playerId]) {
                playerStats[player.playerId] = {
                  playerId: player.playerId,
                  name: player.name,
                  team: teamName,
                  matches: 0,
                  runs: 0,
                  balls: 0,
                  fours: 0,
                  sixes: 0,
                  innings: 0,
                  notOuts: 0,
                  highestScore: 0,
                  wickets: 0,
                  bowlingRuns: 0,
                  overs: 0
                };
              }
              
              const stats = playerStats[player.playerId];
              stats.matches = Math.max(stats.matches, 1);
              stats.wickets += parseInt(player.wickets) || 0;
              stats.bowlingRuns += parseInt(player.runs) || 0;
              stats.overs += parseFloat(player.overs) || 0;
            }
          }
        }
      }
    }
    
    // Step 6: Calculate derived stats and save
    console.log('💾 Saving corrected player stats...');
    for (const stats of Object.values(playerStats)) {
      // Calculate batting averages
      const dismissals = stats.innings - stats.notOuts;
      stats.average = dismissals > 0 ? (stats.runs / dismissals).toFixed(2) : stats.runs;
      stats.strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : 0;
      
      // Calculate bowling averages
      stats.economy = stats.overs > 0 ? (stats.bowlingRuns / stats.overs).toFixed(2) : 0;
      stats.bestBowling = stats.wickets > 0 ? `${stats.wickets}/${stats.bowlingRuns}` : '0/0';
      
      // Save to Firebase
      await setDoc(doc(db, 'playerStats', stats.playerId), stats);
    }
    
    console.log(`✅ Fixed and saved ${Object.keys(playerStats).length} player records`);
    console.log('🎉 Duplicate stats fix completed successfully!');
    
    return {
      success: true,
      playersProcessed: Object.keys(playerStats).length,
      matchesProcessed: completedMatches.length
    };
    
  } catch (error) {
    console.error('❌ Error fixing duplicate stats:', error);
    return { success: false, error: error.message };
  }
}

// Run the fix
fixDuplicateStats().then(result => {
  if (result.success) {
    console.log(`🎉 SUCCESS: Fixed stats for ${result.playersProcessed} players from ${result.matchesProcessed} matches`);
  } else {
    console.log(`❌ FAILED: ${result.error}`);
  }
  process.exit(0);
});