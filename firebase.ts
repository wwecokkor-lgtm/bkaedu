
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBGbPhQBu7q4F1BIQfkw7pcUjWESXGMxrg",
  authDomain: "bk-academy-edu.firebaseapp.com",
  databaseURL: "https://bk-academy-edu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bk-academy-edu",
  storageBucket: "bk-academy-edu.firebasestorage.app",
  messagingSenderId: "754564673309",
  appId: "1:754564673309:web:d2d71905661abee2653bf4",
  measurementId: "G-T0ZQ54C04X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with Robust Offline Persistence and Long Polling
// experimentalForceLongPolling: true fixes "Could not reach Cloud Firestore backend" in many constrained network environments.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
});

export const storage = getStorage(app);
