// Quick fix script for duplicate data
// Run this in browser console or as a Node.js script

console.log('🔧 Starting duplicate data fix...');

// Method 1: Browser Console Fix
if (typeof window !== 'undefined') {
  // Browser environment
  window.fixDuplicates = async function() {
    try {
      console.log('🗑️ Clearing duplicate data...');
      
      // Import services
      const statsService = (await import('./src/services/statsService.js')).default;
      const pointsTableService = (await import('./src/services/pointsTableService.js')).default;
      
      // Clear all processed matches
      await statsService.clearProcessedMatches();
      
      // Force complete recalculation
      const result = await statsService.comprehensiveDataSync();
      
      console.log('✅ Fix completed:', result);
      alert('✅ Duplicate data fixed! Page will refresh.');
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Fix failed:', error);
      alert('❌ Fix failed: ' + error.message);
    }
  };
  
  console.log('✅ Run fixDuplicates() in console to fix duplicate data');
}

// Method 2: Direct Firebase fix (for Node.js environment)
async function fixDuplicatesDirectly() {
  const { initializeApp } = require('firebase/app');
  const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');
  
  // Your Firebase config here
  const firebaseConfig = {
    // Add your config
  };
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  try {
    console.log('🗑️ Clearing all player stats...');
    const statsSnapshot = await getDocs(collection(db, 'playerStats'));
    await Promise.all(statsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    
    console.log('🗑️ Clearing processed matches...');
    const processedSnapshot = await getDocs(collection(db, 'processedMatches'));
    await Promise.all(processedSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    
    console.log('🗑️ Clearing points table...');
    const pointsSnapshot = await getDocs(collection(db, 'pointsTable'));
    await Promise.all(pointsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    
    console.log('✅ All duplicate data cleared! Now reimport your JSON scorecard.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = { fixDuplicatesDirectly };
}