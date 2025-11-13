import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const testDatabaseConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test read operation
    const testCollection = await getDocs(collection(db, 'adminUsers'));
    console.log('✅ Read test successful:', testCollection.docs.length, 'documents');
    
    // Test write operation
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Database connection test',
      timestamp: new Date()
    });
    console.log('✅ Write test successful:', testDoc.id);
    
    return { success: true, message: 'Database connection working' };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { success: false, error: error.message };
  }
};