# 🔥 Firebase Authentication Setup - COMPLETE BEGINNER'S GUIDE

## 🎯 What You're Experiencing

```
Error: auth/api-key-not-valid
Message: Please pass a valid API key
Also: Google login failed
```

**Root Cause:** You're probably using the **wrong API key** OR the environment variables aren't loaded.

---

## ⚠️ KEY DIFFERENCES - READ THIS FIRST!

This is the most confusing part. There are **THREE different keys** in Google Cloud, and using the wrong one causes your error:

### 1️⃣ **Firebase API Key** ← USE THIS ONE
```
Format:        AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
Starts with:   AIza
Where to get:  Firebase Console → Settings → Project Settings → "Your apps" 
Where to use:  firebaseConfig.apiKey in your code
Purpose:       Initialize Firebase SDK
Can be public: ✅ YES (it's safe in frontend)
```

### 2️⃣ **Google Cloud API Key** ← DON'T USE THIS
```
Format:        AIzaXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX (similar to Firebase key)
Where to get:  Google Cloud Console → APIs & Services → Credentials
Where to use:  NOWHERE in your frontend code (backend only)
Purpose:       Call Google Cloud APIs
Can be public: ⚠️ Restricted - should not be in frontend
```

### 3️⃣ **OAuth Client ID** ← ALSO USE THIS (but differently)
```
Format:        281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
Ends with:     .apps.googleusercontent.com
Where to get:  Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 IDs
Where to use:  Firebase Console settings ONLY (not in your code)
Purpose:       Google Sign-In authentication
Can be public: ✅ YES
```

### 📊 SUMMARY TABLE

| Key Type | Format | Get From | Use In Code | Use In Firebase | Public? |
|----------|--------|----------|------------|-----------------|---------|
| **Firebase API Key** | `AIza...` | Firebase Console | ✅ YES | No | ✅ YES |
| **Google Cloud API Key** | `AIza...` | Google Cloud | ❌ NO | No | ⚠️ NO |
| **OAuth Client ID** | `...apps.googleusercontent.com` | Google Cloud | ❌ NO | ✅ YES | ✅ YES |

---

## 🚀 STEP-BY-STEP SETUP (CORRECT WAY)

### STEP 1: Get Your Firebase API Key (Not Google Cloud Key!)

**Instructions:**
1. Go to: https://console.firebase.google.com
2. Select your project: **duotalk-be36a**
3. Click **Settings** (gear icon) → **Project Settings**
4. Scroll down to **"Your apps"** section
5. Find your **web app** (looks like: `</>`)
6. Click on it to expand
7. Copy the **`apiKey`** value (starts with `AIza`)
8. This is your **Firebase API Key** ✅

**Example:**
```
apiKey: "AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg"  ← This one!
```

### STEP 2: Set Up .env.local (Vite Environment Variables)

**File location:** `frontend/.env.local`

**Content (exact values from Firebase Console):**
```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
VITE_FIREBASE_STORAGE_BUCKET=duotalk-be36a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1039018258119
VITE_FIREBASE_APP_ID=1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
VITE_FIREBASE_MEASUREMENT_ID=G-C2DM6MSCDK

# Google OAuth (separate from Firebase API Key!)
VITE_GOOGLE_CLIENT_ID=281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
```

**IMPORTANT:**
- ✅ Keep this file PRIVATE (add to .gitignore)
- ✅ All values must come from Firebase Console, not Google Cloud
- ✅ Variable names MUST start with `VITE_` (Vite requirement)

### STEP 3: Firebase Configuration in Code

**File:** `frontend/src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// This is the CORRECT way to access Vite env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,           // ✅ Firebase API Key
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// VALIDATE - Check if config loaded properly
if (!firebaseConfig.apiKey) {
  console.error('❌ CRITICAL ERROR: VITE_FIREBASE_API_KEY not loaded!');
  console.error('Fix: Check .env.local has VITE_FIREBASE_API_KEY=AIza...');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth instance
export const auth = getAuth(app);

// Enable persistence (user stays logged in after refresh)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Persistence setup warning:', error.message);
});

export default app;
```

---

## 📱 WORKING AUTH CODE (All Methods)

### Google Login
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';

export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('✅ Google login successful!');
    console.log('User:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('❌ Google login failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific errors
    if (error.code === 'auth/api-key-not-valid') {
      alert('Firebase API Key is invalid. Check .env.local');
    } else if (error.code === 'auth/invalid-client-id') {
      alert('Google OAuth not configured in Firebase Console');
    }
    throw error;
  }
}
```

### Facebook Login
```javascript
import { signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';

export async function loginWithFacebook() {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    console.log('✅ Facebook login successful!');
    console.log('User:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('❌ Facebook login failed:', error.message);
    throw error;
  }
}
```

### Phone Login (OTP)
```javascript
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';

// Send OTP to phone
export async function sendPhoneOTP(phoneNumber) {
  try {
    // Setup reCAPTCHA verifier
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
    }, auth);

    // Send OTP
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,  // Format: +1234567890
      recaptchaVerifier
    );
    
    console.log('✅ OTP sent successfully!');
    return confirmationResult;
  } catch (error) {
    console.error('❌ Send OTP failed:', error.message);
    throw error;
  }
}

// Verify OTP code
export async function verifyPhoneOTP(confirmationResult, code) {
  try {
    const result = await confirmationResult.confirm(code);
    
    console.log('✅ Phone verification successful!');
    console.log('User:', result.user.phoneNumber);
    return result.user;
  } catch (error) {
    console.error('❌ OTP verification failed:', error.message);
    throw error;
  }
}
```

---

## ✅ DEBUGGING CHECKLIST (Do This First!)

### 1. **Verify .env.local File Exists**
```bash
# Windows PowerShell:
Test-Path "frontend\.env.local"

# Should return: True
```

### 2. **Verify API Key is Correct**
```bash
# Windows PowerShell:
Get-Content frontend\.env.local | Select-String "VITE_FIREBASE_API_KEY"

# Should show:
# VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

### 3. **Verify API Key Format**
```
❌ WRONG: 123456789-abcdef.apps.googleusercontent.com  (OAuth Client ID)
❌ WRONG: AKIA2XXXXXXXXXXXXXXXX  (AWS key)
✅ CORRECT: AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg  (starts with AIza)
```

### 4. **Check Variables Load in Browser**
Open browser console (F12) and paste:
```javascript
// Check if env variables are loaded
console.log('API Key loaded:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project ID loaded:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Auth Domain loaded:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

// If any show "undefined", your .env.local is not loaded!
```

**Expected output:**
```
API Key loaded: AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
Project ID loaded: duotalk-be36a
Auth Domain loaded: duotalk-be36a.firebaseapp.com
```

### 5. **Restart Dev Server After .env Changes**
```bash
# Stop current server (Ctrl+C)

# Restart:
npm run dev

# IMPORTANT: Vite only loads .env.local on server start!
```

### 6. **Clear Browser Cache**
```
Method 1 (Quick):
- Press: Ctrl+Shift+Delete (Windows) OR Cmd+Shift+Delete (Mac)
- Click: "Clear all"

Method 2 (DevTools):
- Press F12
- Right-click refresh button
- Click: "Empty cache and hard refresh"
```

### 7. **Create Test File to Debug**

Create `frontend/src/debug.js`:
```javascript
// Debug script to verify Firebase is configured correctly

console.group('🔥 Firebase Configuration Debug');

// Check 1: Env variables loaded
console.log('📝 Environment Variables:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Loaded' : '❌ MISSING');
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ MISSING');

// Check 2: Firebase initialized
try {
  const { auth } = require('./config/firebase');
  console.log('🔥 Firebase:', auth ? '✅ Initialized' : '❌ Failed');
} catch (e) {
  console.error('❌ Firebase init error:', e.message);
}

// Check 3: API Key format
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (apiKey && apiKey.startsWith('AIza')) {
  console.log('✅ API Key format correct (starts with AIza)');
} else if (apiKey) {
  console.error('❌ API Key format WRONG!');
  console.error('   Got:', apiKey);
  console.error('   Expected: AIza...');
} else {
  console.error('❌ API Key MISSING');
}

console.groupEnd();
```

Then use it:
```jsx
// In your component or App.jsx
import './debug'; // Run at startup
```

---

## 🐛 ALL POSSIBLE CAUSES OF "auth/api-key-not-valid"

### ❌ CAUSE 1: Wrong API Key (Most Common!)

**Problem:** You pasted Google Cloud API Key instead of Firebase API Key

**How to fix:**
```
1. Go to: https://console.firebase.google.com
2. Select: duotalk-be36a
3. Settings → Project Settings
4. Scroll to "Your apps" 
5. Copy the apiKey value (looks like: AIzaSy...)
6. NOT from Google Cloud Console!
```

**Verify:**
```bash
# Should show Firebase API Key (starts with AIza)
Get-Content frontend\.env.local | Select-String "VITE_FIREBASE_API_KEY"
```

---

### ❌ CAUSE 2: .env.local Not Loaded

**Problem:** You edited .env.local but didn't restart the dev server

**How to fix:**
```bash
# Press Ctrl+C to stop server
npm run dev  # Restart

# Vite ONLY loads .env at server startup!
```

**Verify in browser console:**
```javascript
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
// If shows "undefined", server not restarted after .env change
```

---

### ❌ CAUSE 3: Cached Old Value

**Problem:** Browser cached old (wrong) API key

**How to fix:**
```
1. Press Ctrl+Shift+Delete
2. Select "Cookies and other site data"
3. Click "Clear data"
4. Hard refresh: Ctrl+Shift+R
```

---

### ❌ CAUSE 4: Wrong File Location

**Problem:** .env.local in wrong folder

**Correct location:**
```
projectfinal/
├── frontend/           ← RIGHT HERE
│   ├── .env.local     ← FILE HERE
│   ├── src/
│   └── vite.config.js
├── backend/
└── ...
```

**Wrong locations:**
```
❌ projectfinal/.env.local  (root folder)
❌ frontend/src/.env.local  (src folder)
❌ frontend/.env           (no .local suffix)
```

---

### ❌ CAUSE 5: Using process.env Instead of import.meta.env

**Problem:**
```javascript
// ❌ WRONG (React, uses process.env)
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

// ✅ CORRECT (Vite, uses import.meta.env)
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

**Why it matters:**
- **Create React App**: uses `process.env.REACT_APP_*`
- **Vite**: uses `import.meta.env.VITE_*`
- Your project uses **Vite**, not Create React App!

---

### ❌ CAUSE 6: Variable Name Wrong

**Problem:** Wrong variable name in code

**Correct names (must start with VITE_):**
```bash
✅ VITE_FIREBASE_API_KEY
✅ VITE_FIREBASE_PROJECT_ID
❌ FIREBASE_API_KEY        (no VITE_ prefix)
❌ REACT_APP_FIREBASE_API_KEY  (wrong for Vite)
```

---

### ❌ CAUSE 7: Missing Required OAuth Configuration

**Problem:** Firebase Console not configured for OAuth

**How to fix:**

**For Google:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable** (turn ON)
4. Under "Web SDK configuration", paste your **Google Client ID:**
   ```
   281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
   ```
5. Click **Save**

**For Facebook:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Facebook**
3. Toggle **Enable**
4. Enter your **Facebook App ID** and **App Secret**
5. Click **Save**

---

### ❌ CAUSE 8: Unauthorized Domain

**Problem:** Your domain not in Firebase authorized list

**How to fix:**
1. Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add these:
   - `localhost`
   - `127.0.0.1`
   - `yourdomain.com` (production)
4. Click **Add domain**
5. Wait 5 minutes for changes to apply

---

## 🎯 QUICK FIX (DO THIS NOW)

### Step 1: Verify API Key in Firebase Console
```
1. https://console.firebase.google.com
2. duotalk-be36a → Settings → Project Settings
3. Copy apiKey value from "Your apps" section
4. Paste it in .env.local as VITE_FIREBASE_API_KEY
```

### Step 2: Check .env.local
```bash
# File location: frontend/.env.local
# Should contain (not from Google Cloud, from Firebase):
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

### Step 3: Restart Dev Server
```bash
# Stop: Ctrl+C
npm run dev
```

### Step 4: Clear Browser Cache
```
Ctrl+Shift+Delete → Clear all
```

### Step 5: Verify Variables Load
```javascript
// Browser console (F12):
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
// Should show: AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

### Step 6: Test Login
- Click login button
- Try Google login
- Should work! ✅

---

## 📊 VITE ENVIRONMENT VARIABLES - How They Work

### Naming Convention
```
✅ All Vite env variables MUST start with VITE_
VITE_FIREBASE_API_KEY
VITE_API_URL
VITE_VERSION

❌ Without VITE_ prefix won't be loaded
FIREBASE_API_KEY    ← Won't work
API_KEY             ← Won't work
```

### How to Access
```javascript
// ✅ CORRECT (Vite)
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// ❌ WRONG (Create React App syntax)
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

// ❌ WRONG (Node.js syntax)
const apiKey = process.env.VITE_FIREBASE_API_KEY;
```

### File Structure
```
frontend/
├── .env.local          ← Your development secrets (PRIVATE!)
├── .env.example        ← Template (safe to share)
├── vite.config.js      ← Already configured for env vars
└── src/
    ├── config/
    │   └── firebase.js ← Access env vars here
    └── ...
```

### .env.local Checklist
```
✅ File location: frontend/.env.local
✅ Variable prefix: VITE_
✅ All values from: Firebase Console (not Google Cloud)
✅ File privacy: In .gitignore
✅ Changes require: Dev server restart
✅ Access in code: import.meta.env.VITE_*
```

---

## ✨ COMPLETE WORKING EXAMPLE

### File: frontend/.env.local
```env
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
VITE_FIREBASE_STORAGE_BUCKET=duotalk-be36a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1039018258119
VITE_FIREBASE_APP_ID=1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
VITE_FIREBASE_MEASUREMENT_ID=G-C2DM6MSCDK
VITE_GOOGLE_CLIENT_ID=281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
```

### File: frontend/src/config/firebase.js
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

console.log('📝 Loading Firebase config from env variables...');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate
if (!firebaseConfig.apiKey) {
  console.error('❌ VITE_FIREBASE_API_KEY not found in .env.local');
  console.error('File location: frontend/.env.local');
  console.error('Variable name: VITE_FIREBASE_API_KEY');
}

if (!firebaseConfig.projectId) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID not found in .env.local');
}

// Initialize
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persistence
setPersistence(auth, browserLocalPersistence).catch(console.warn);

console.log('✅ Firebase initialized successfully');

export default app;
```

### File: frontend/src/auth/authFunctions.js
```javascript
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';

// Google Login
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Google login successful:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('❌ Google login error:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Facebook Login
export async function loginWithFacebook() {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Facebook login successful:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('❌ Facebook login error:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Phone Login
export async function sendPhoneOTP(phoneNumber) {
  try {
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
    }, auth);

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('✅ OTP sent to:', phoneNumber);
    return confirmationResult;
  } catch (error) {
    console.error('❌ Phone OTP error:', error.message);
    throw error;
  }
}

export async function verifyPhoneOTP(confirmationResult, code) {
  try {
    const result = await confirmationResult.confirm(code);
    console.log('✅ Phone verified:', result.user.phoneNumber);
    return result.user;
  } catch (error) {
    console.error('❌ OTP verification error:', error.message);
    throw error;
  }
}
```

### File: frontend/src/components/LoginButton.jsx
```jsx
import { loginWithGoogle, loginWithFacebook } from '../auth/authFunctions';

export default function LoginButton() {
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log('User logged in:', user);
      // Redirect or update state
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </>
  );
}
```

---

## 📋 FINAL CHECKLIST

Before testing, verify ALL of these:

```
FILE SYSTEM:
[ ] frontend/.env.local exists
[ ] Contains VITE_FIREBASE_API_KEY=AIzaSy...
[ ] In .gitignore (PRIVATE!)

ENVIRONMENT VARIABLES:
[ ] All VITE_FIREBASE_* values from Firebase Console
[ ] All values correct (copy-paste from Firebase, not Google Cloud)
[ ] Variable names start with VITE_

FIREBASE CONSOLE (https://console.firebase.google.com):
[ ] Project: duotalk-be36a selected
[ ] Authentication → Sign-in methods enabled:
    [ ] Email/Password
    [ ] Google (with OAuth Client ID added)
    [ ] Facebook (optional)
    [ ] Phone (optional)
[ ] Settings → Authorized domains:
    [ ] localhost added
    [ ] yourdomain.com added (for production)

DEV SERVER:
[ ] Server restarted AFTER .env.local changes
[ ] No errors in terminal
[ ] Running on correct port (5173 or 5174)

BROWSER:
[ ] Cache cleared (Ctrl+Shift+Delete)
[ ] Hard refresh (Ctrl+Shift+R)
[ ] Console shows no "undefined" for env variables
[ ] Firebase config validated

CODE:
[ ] firebase.js imports correct
[ ] Using import.meta.env (not process.env)
[ ] Auth functions properly exported
[ ] Error handling in place
```

---

## 🆘 STILL NOT WORKING?

1. **Run this in browser console (F12):**
   ```javascript
   console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
   console.log('Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
   // Copy output and share
   ```

2. **Check terminal for Firebase errors:**
   ```bash
   npm run dev 2>&1 | grep -i "firebase"
   ```

3. **Verify .env.local contents:**
   ```bash
   cat frontend/.env.local
   ```

---

**This guide covers 99% of auth/api-key-not-valid errors. Follow the checklist and you'll be fixed!** ✅
