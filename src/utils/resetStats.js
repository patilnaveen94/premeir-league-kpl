import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const resetAllPlayerStats = async () => {
  try {
    console.log('Starting player stats reset...');
    
    // Delete all documents in playerStats collection
    const statsSnapshot = await getDocs(collection(db, 'playerStats'));
    const deletePromises = statsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Delete all documents in processedMatches collection
    const processedSnapshot = await getDocs(collection(db, 'processedMatches'));
    const processedDeletePromises = processedSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(processedDeletePromises);
    
    console.log(`Deleted ${statsSnapshot.docs.length} player stats and ${processedSnapshot.docs.length} processed matches`);
    return { success: true, message: `Reset ${statsSnapshot.docs.length} player stats` };
  } catch (error) {
    console.error('Error resetting player stats:', error);
    return { success: false, error: error.message };
  }
};