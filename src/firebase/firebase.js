import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBDxhQes8I5FFQXW91HWheRaV2I6EAockc",
  authDomain: "cricket-league-website.firebaseapp.com",
  projectId: "cricket-league-website",
  storageBucket: "cricket-league-website.appspot.com",
  messagingSenderId: "214187740501",
  appId: "1:214187740501:web:4c48ddce2e3992e3a7b3dc",
  measurementId: "G-7CXET4YHR8"
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);


export default app;