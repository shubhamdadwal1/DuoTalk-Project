import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';

/**
 * Firebase Configuration
 *
 * IMPORTANT: This configuration uses Firebase API Key (starts with "AIza...")
 * NOT Google OAuth Client ID (ends with .apps.googleusercontent.com)
 *
 * The OAuth Client ID must be configured separately in Firebase Console:
 * Firebase Console -> Authentication -> Sign-in method -> Google
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasRequiredFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Validate required configuration
if (!hasRequiredFirebaseConfig) {
  console.error('Firebase configuration incomplete.');
  console.error('Required env variables missing:');
  if (!firebaseConfig.apiKey) console.error('- VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) console.error('- VITE_FIREBASE_PROJECT_ID');
  console.error('Fix: add the correct Firebase values before enabling auth flows.');
}

// Log configuration status (non-sensitive info only)
if (import.meta.env.DEV) {
  console.log('Firebase config status:', {
    apiKey: firebaseConfig.apiKey ? 'loaded' : 'missing',
    authDomain: firebaseConfig.authDomain || 'missing',
    projectId: firebaseConfig.projectId || 'missing',
  });
}

// Initialize Firebase only when the required config exists.
const app = hasRequiredFirebaseConfig ? initializeApp(firebaseConfig) : null;

// Get Auth instance only when Firebase is configured.
export const auth = app ? getAuth(app) : null;

// Use per-tab session persistence so different tabs/windows can log in as different users.
if (auth) {
  setPersistence(auth, browserSessionPersistence).catch((error) => {
    if (import.meta.env.DEV) {
      console.warn('Persistence error:', error.message);
    }
  });
}

export default app;
export { hasRequiredFirebaseConfig };
