import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'placeholder',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'placeholder',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'placeholder',
};

// Prevent duplicate app initialization during hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional scopes for profile data
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
