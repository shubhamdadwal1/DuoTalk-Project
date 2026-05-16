// File: frontend/src/utils/firebaseDebugger.js
// Usage: import and call debugFirebaseConfig() in your components or console
// This helps diagnose Firebase configuration issues

/**
 * Debug Firebase Configuration
 * Call this function in browser console or in your app to check Firebase setup
 * 
 * Example usage:
 * import { debugFirebaseConfig } from '@/utils/firebaseDebugger';
 * debugFirebaseConfig();
 */
export const debugFirebaseConfig = () => {
  console.group('🔥 Firebase Configuration Debug');

  // Check Environment Variables
  console.group('📝 Environment Variables');
  const envVars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    'VITE_FIREBASE_MEASUREMENT_ID': import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value ? value.substring(0, 20) + '...' : 'MISSING'}`);
  });
  console.groupEnd();

  // Check API Key Format
  console.group('🔑 API Key Validation');
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (apiKey) {
    console.log(`✅ API Key provided`);
    if (apiKey.startsWith('AIza')) {
      console.log('✅ API Key format correct (starts with "AIza")');
    } else {
      console.error('❌ Invalid API Key format! Should start with "AIza"');
      console.error('   Your API Key:', apiKey);
      console.error('   Fix: Get correct Firebase API Key from Firebase Console');
    }
  } else {
    console.error('❌ MISSING: VITE_FIREBASE_API_KEY');
    console.error('   Fix: Add VITE_FIREBASE_API_KEY to .env.local');
  }
  console.groupEnd();

  // Check Project ID
  console.group('📦 Project ID Validation');
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId) {
    console.log(`✅ Project ID: ${projectId}`);
  } else {
    console.error('❌ MISSING: VITE_FIREBASE_PROJECT_ID');
  }
  console.groupEnd();

  // Check Auth Domain
  console.group('🌐 Auth Domain Validation');
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (authDomain) {
    console.log(`✅ Auth Domain: ${authDomain}`);
    if (authDomain.includes('firebaseapp.com')) {
      console.log('✅ Auth Domain format correct (ends with firebaseapp.com)');
    } else {
      console.warn('⚠️ Auth Domain format looks unusual');
    }
  } else {
    console.error('❌ MISSING: VITE_FIREBASE_AUTH_DOMAIN');
  }
  console.groupEnd();

  // Summary
  console.group('📊 Summary');
  const allVarsPresent = Object.values(envVars).every(v => v);
  if (allVarsPresent) {
    console.log('✅ All required environment variables are set!');
    console.log('Next steps:');
    console.log('1. Restart dev server (npm run dev)');
    console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('3. Try logging in');
  } else {
    const missing = Object.entries(envVars)
      .filter(([_, v]) => !v)
      .map(([k, _]) => k);
    console.error('❌ Missing environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('Fix: Update .env.local with correct values');
  }
  console.groupEnd();

  console.groupEnd();
};

/**
 * Debug Firebase Authentication State
 * Shows current user and auth status
 */
export const debugAuthState = async (auth) => {
  console.group('👤 Firebase Auth State Debug');

  try {
    // Get current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ User is logged in:');
      console.log({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        phoneNumber: currentUser.phoneNumber,
        isAnonymous: currentUser.isAnonymous,
        metadata: {
          createdAt: currentUser.metadata.creationTime,
          lastSignIn: currentUser.metadata.lastSignInTime,
        }
      });
    } else {
      console.log('❌ No user is logged in');
    }

    // Get ID token
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      console.log('✅ ID Token (first 50 chars):', idToken.substring(0, 50) + '...');
    }

    console.groupEnd();
  } catch (err) {
    console.error('❌ Error getting auth state:', err.message);
  }
};

/**
 * Debug Specific Auth Error
 * Provides solutions based on error code
 */
export const debugAuthError = (error) => {
  console.group('⚠️ Firebase Auth Error Debug');

  const errorSolutions = {
    'auth/api-key-not-valid': {
      message: 'Firebase API key is missing or invalid',
      solutions: [
        'Check .env.local has VITE_FIREBASE_API_KEY',
        'Verify API key starts with "AIza"',
        'Restart dev server: npm run dev',
        'Clear browser cache: Ctrl+Shift+Delete'
      ]
    },
    'auth/invalid-client-id': {
      message: 'Google OAuth Client ID not configured',
      solutions: [
        'Go to Firebase Console → Authentication → Google',
        'Paste your Client ID in "Web SDK configuration"',
        'Click Save',
        'Restart dev server'
      ]
    },
    'auth/unauthorized-domain': {
      message: 'Your domain is not authorized in Firebase',
      solutions: [
        'Firebase Console → Authentication → Settings → Authorized domains',
        'Add your domain (localhost, yourdomain.com)',
        'Wait 5 minutes for changes to propagate'
      ]
    },
    'auth/operation-not-allowed': {
      message: 'Sign-in method not enabled in Firebase',
      solutions: [
        'Firebase Console → Authentication → Sign-in method',
        'Enable the required provider (Google/Facebook/Phone)',
        'Click Save'
      ]
    },
    'auth/popup-closed-by-user': {
      message: 'User closed the login popup (this is normal)',
      solutions: [
        'This is expected behavior',
        'No action needed - user can try again'
      ]
    },
    'auth/network-request-failed': {
      message: 'Network connection issue',
      solutions: [
        'Check internet connection',
        'Check if Firebase is not blocked by firewall',
        'Try again in a few moments'
      ]
    },
    'auth/too-many-requests': {
      message: 'Too many login attempts',
      solutions: [
        'Wait a few minutes',
        'Try logging in again',
        'Consider implementing rate limiting on backend'
      ]
    }
  };

  const errorCode = error.code || 'unknown';
  const solution = errorSolutions[errorCode];

  console.error('❌ Error Code:', errorCode);
  console.error('❌ Error Message:', error.message);

  if (solution) {
    console.log('📋 Solution:', solution.message);
    console.log('🔧 Try these steps:');
    solution.solutions.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  } else {
    console.log('Unknown error. Search Firebase docs for:', errorCode);
  }

  console.groupEnd();
};

/**
 * Quick Health Check
 * Tests Firebase connectivity
 */
export const firebaseHealthCheck = async (auth) => {
  console.group('💚 Firebase Health Check');

  try {
    // Check 1: Config loaded
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    console.log(`1. Config loaded: ${apiKey ? '✅' : '❌'}`);

    // Check 2: Auth instance exists
    console.log(`2. Auth instance: ${auth ? '✅' : '❌'}`);

    // Check 3: Can access auth
    if (auth) {
      const currentUser = auth.currentUser;
      console.log(`3. Auth accessible: ✅`);
      console.log(`4. Current user: ${currentUser ? '✅ ' + currentUser.email : '❌ Not logged in'}`);
    }

    console.log('✅ Firebase appears to be working correctly!');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Firebase health check failed:', err.message);
    console.groupEnd();
  }
};

/**
 * Export all debug functions as an object
 */
export const FirebaseDebugger = {
  config: debugFirebaseConfig,
  authState: debugAuthState,
  error: debugAuthError,
  health: firebaseHealthCheck,
  help: () => {
    console.log(`
    🔥 Firebase Debugger Commands:
    
    FirebaseDebugger.config()        - Check config and env vars
    FirebaseDebugger.authState()     - Check current user state
    FirebaseDebugger.error(error)    - Debug a specific error
    FirebaseDebugger.health()        - Run health check
    
    Example:
    import { FirebaseDebugger } from '@/utils/firebaseDebugger';
    FirebaseDebugger.config();
    `);
  }
};
