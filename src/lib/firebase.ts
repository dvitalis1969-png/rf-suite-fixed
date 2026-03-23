import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use environment variables for configuration
// These should be set in the AI Studio settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

// Fallback to local config file if environment variables are missing (for local dev)
// This file is now ignored by git
import localConfig from '../../firebase-applet-config.json';

const config = firebaseConfig.apiKey ? firebaseConfig : localConfig;

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app, (config as any).firestoreDatabaseId);
  storage = getStorage(app);
  console.log("✅ Firebase successfully initialized!");
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

export { auth, db, storage };
