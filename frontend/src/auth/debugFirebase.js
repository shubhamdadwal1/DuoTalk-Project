/**
 * Firebase Auth Debug Utility
 * 
 * Use in browser console to diagnose Firebase authentication issues
 * 
 * Examples:
 * FirebaseAuthDebug.checkConfig()
 * FirebaseAuthDebug.checkEnv()
 * FirebaseAuthDebug.testLogin()
 * FirebaseAuthDebug.showHelp()
 */

export const FirebaseAuthDebug = {
  /**
   * Check all environment variables
   */
  checkEnv() {
    console.group('📝 Environment Variables Check');
    
    const vars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_MEASUREMENT_ID',
      'VITE_GOOGLE_CLIENT_ID',
    ];
    
    console.log('Checking variables loaded from .env.local:\n');
    
    vars.forEach(varName => {
      const value = import.meta.env[varName];
      const status = value ? '✅' : '❌';
      const display = value ? (value.substring(0, 20) + '...') : 'MISSING';
      console.log(`${status} ${varName}`);
      console.log(`   Value: ${display}`);
    });
    
    console.log('\n⚠️ Did you see all checkmarks (✅)?');
    console.log('If not, check:');
    console.log('1. File location: frontend/.env.local exists?');
    console.log('2. Variable names: All start with VITE_?');
    console.log('3. Dev server: Restarted after .env changes?');
    
    console.groupEnd();
  },

  /**
   * Validate API Key format
   */
  checkApiKey() {
    console.group('🔑 API Key Validation');
    
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API Key MISSING');
      console.error('Fix: Add VITE_FIREBASE_API_KEY to frontend/.env.local');
      console.groupEnd();
      return false;
    }
    
    console.log('API Key value:', apiKey);
    
    // Check format
    if (apiKey.startsWith('AIza')) {
      console.log('✅ API Key format CORRECT (starts with AIza)');
      console.log('   This is a Firebase API Key ✓');
    } else if (apiKey.includes('.apps.googleusercontent.com')) {
      console.error('❌ API Key format WRONG!');
      console.error('   This is a Google OAuth Client ID, not Firebase API Key!');
      console.error('   Fix: Get the apiKey from Firebase Console → Project Settings');
      console.groupEnd();
      return false;
    } else {
      console.error('❌ API Key format UNKNOWN');
      console.error('   Should start with: AIza...');
      console.error('   Got:', apiKey.substring(0, 10) + '...');
      console.groupEnd();
      return false;
    }
    
    console.log('✅ All checks passed!');
    console.groupEnd();
    return true;
  },

  /**
   * Check Firebase initialization
   */
  async checkFirebaseInit() {
    console.group('🔥 Firebase Initialization Check');
    
    try {
      const { auth } = await import('../config/firebase');
      
      if (!auth) {
        console.error('❌ Firebase auth not initialized');
        return false;
      }
      
      console.log('✅ Firebase auth initialized');
      console.log('Auth instance:', auth);
      
      // Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Current user logged in:');
        console.log('   Email:', currentUser.email);
        console.log('   UID:', currentUser.uid);
      } else {
        console.log('ℹ️ No user currently logged in');
      }
      
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Firebase init check failed:', error.message);
      console.groupEnd();
      return false;
    }
  },

  /**
   * Full configuration check
   */
  async checkConfig() {
    console.group('🔍 Full Firebase Configuration Check');
    
    // Check environment
    console.log('\n1️⃣ Environment Variables:');
    this.checkEnv();
    
    // Check API Key
    console.log('\n2️⃣ API Key Format:');
    const apiKeyValid = this.checkApiKey();
    
    // Check Firebase init
    console.log('\n3️⃣ Firebase Initialization:');
    const firebaseValid = await this.checkFirebaseInit();
    
    // Summary
    console.group('📊 Summary');
    if (apiKeyValid && firebaseValid) {
      console.log('✅ All checks passed! Firebase is configured correctly.');
      console.log('\nNext steps:');
      console.log('1. Try logging in with Google');
      console.log('2. Check browser console for errors');
      console.log('3. If still failing, check Firebase Console OAuth settings');
    } else {
      console.error('❌ Configuration issues found above');
    }
    console.groupEnd();
    console.groupEnd();
  },

  /**
   * Test Google login (in browser console only)
   */
  async testGoogleLogin() {
    console.group('🧪 Testing Google Login');
    
    try {
      const { loginWithGoogle } = await import('./authFunctions');
      
      console.log('Starting Google login...');
      const user = await loginWithGoogle();
      
      console.log('✅ Login successful!');
      console.log('User:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
    } catch (error) {
      console.error('❌ Login test failed');
      console.error('Error:', error.message);
      
      // Provide suggestions
      if (error.message.includes('api-key-not-valid')) {
        console.error('\n💡 SUGGESTION: Invalid API Key');
        console.error('   Run: FirebaseAuthDebug.checkApiKey()');
      } else if (error.message.includes('invalid-client-id')) {
        console.error('\n💡 SUGGESTION: Google OAuth not in Firebase Console');
        console.error('   Steps:');
        console.error('   1. Firebase Console → Authentication → Sign-in method');
        console.error('   2. Click Google');
        console.error('   3. Enable it');
        console.error('   4. Add your Client ID in Web SDK configuration');
      }
    }
    
    console.groupEnd();
  },

  /**
   * Check Firebase Console settings
   */
  checkFirebaseConsole() {
    console.group('📋 Firebase Console Checklist');
    
    console.log('Before you can login, verify these in Firebase Console:\n');
    
    console.log('1. Authentication Enabled');
    console.log('   ☐ Go to: https://console.firebase.google.com');
    console.log('   ☐ Select project: duotalk-be36a');
    console.log('   ☐ Click: Authentication (left sidebar)');
    console.log('   ☐ Should see your auth methods\n');
    
    console.log('2. Google Sign-In Enabled');
    console.log('   ☐ Click: Sign-in method');
    console.log('   ☐ Click: Google');
    console.log('   ☐ Toggle: Enable (turn ON)');
    console.log('   ☐ Paste your Client ID in Web SDK configuration');
    console.log('   ☐ Click: SAVE\n');
    
    console.log('3. OAuth Client ID Configured');
    console.log('   ☐ Your Google Client ID should be:');
    console.log('   ☐ 281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com\n');
    
    console.log('4. Authorized Domains');
    console.log('   ☐ Settings → Authorized domains');
    console.log('   ☐ Add: localhost');
    console.log('   ☐ Add: yourdomain.com (for production)\n');
    
    console.log('Run this after making changes:');
    console.log('   Location.reload()  // Refresh the page');
    
    console.groupEnd();
  },

  /**
   * Step-by-step troubleshooting guide
   */
  troubleshoot() {
    console.group('🔧 Troubleshooting Guide');
    
    console.log('Getting "auth/api-key-not-valid"? Try these steps:\n');
    
    console.log('STEP 1: Check Environment');
    console.log('-------');
    console.log('Run: FirebaseAuthDebug.checkEnv()');
    console.log('All variables should show ✅\n');
    
    console.log('STEP 2: Check API Key Format');
    console.log('-------');
    console.log('Run: FirebaseAuthDebug.checkApiKey()');
    console.log('Should show it starts with "AIza"\n');
    
    console.log('STEP 3: Restart Dev Server');
    console.log('-------');
    console.log('Terminal → Stop server (Ctrl+C)');
    console.log('Terminal → npm run dev\n');
    
    console.log('STEP 4: Clear Browser Cache');
    console.log('-------');
    console.log('Press: Ctrl+Shift+Delete');
    console.log('Select: Cookies and cache');
    console.log('Click: Clear data');
    console.log('Then: Hard refresh (Ctrl+Shift+R)\n');
    
    console.log('STEP 5: Check Firebase Console');
    console.log('-------');
    console.log('Run: FirebaseAuthDebug.checkFirebaseConsole()\n');
    
    console.log('STEP 6: Test Login');
    console.log('-------');
    console.log('Run: FirebaseAuthDebug.testGoogleLogin()\n');
    
    console.log('Still failing? Take a screenshot of console and share!');
    
    console.groupEnd();
  },

  /**
   * Show all available commands
   */
  showHelp() {
    console.clear();
    console.group('%c🔥 Firebase Auth Debug Utility', 'font-size: 16px; font-weight: bold; color: #FF6B35');
    
    console.log('\n📖 AVAILABLE COMMANDS:\n');
    
    console.log('FirebaseAuthDebug.checkEnv()');
    console.log('   → Check all environment variables are loaded\n');
    
    console.log('FirebaseAuthDebug.checkApiKey()');
    console.log('   → Validate API Key format\n');
    
    console.log('FirebaseAuthDebug.checkConfig()');
    console.log('   → Run complete configuration check\n');
    
    console.log('FirebaseAuthDebug.testGoogleLogin()');
    console.log('   → Test Google login directly\n');
    
    console.log('FirebaseAuthDebug.checkFirebaseConsole()');
    console.log('   → Show Firebase Console setup checklist\n');
    
    console.log('FirebaseAuthDebug.troubleshoot()');
    console.log('   → Step-by-step troubleshooting guide\n');
    
    console.log('FirebaseAuthDebug.showHelp()');
    console.log('   → Show this help message\n');
    
    console.log('---\n');
    console.log('💡 QUICK START:');
    console.log('1. Copy & paste into browser console (F12)');
    console.log('2. Run: FirebaseAuthDebug.checkConfig()');
    console.log('3. Follow suggestions shown\n');
    
    console.groupEnd();
  }
};

// Auto-show help if this is loaded in development
if (import.meta.env.DEV) {
  console.log('%c✨ Firebase Debug Utility Loaded', 'color: #4285F4; font-weight: bold');
  console.log('Type: FirebaseAuthDebug.showHelp()');
}

export default FirebaseAuthDebug;
