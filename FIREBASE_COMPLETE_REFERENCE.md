# Firebase Authentication - Complete Reference Guide

## 📚 Table of Contents
1. [Quick Fixes](#quick-fixes)
2. [Key Concepts](#key-concepts)
3. [Setup Verification](#setup-verification)
4. [Code Examples](#code-examples)
5. [Troubleshooting](#troubleshooting)
6. [Production Checklist](#production-checklist)

---

## Quick Fixes

### If you're getting `auth/api-key-not-valid`:

**OPTION 1: Restart Dev Server (Most Common)**
```bash
# Stop current server (Ctrl+C)
# Restart it
npm run dev

# Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
# Then test login again
```

**OPTION 2: Verify .env.local**
```bash
# Check file exists
ls -la frontend/.env.local  # macOS/Linux
dir frontend\.env.local     # Windows

# Check contents have your API key
cat frontend/.env.local
# Should show: VITE_FIREBASE_API_KEY=AIza...
```

**OPTION 3: Check Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **duotalk-be36a**
3. Settings (gear) → Project Settings
4. Under "Your apps" section, find your web app
5. Copy the **apiKey** value
6. Paste into `.env.local` as `VITE_FIREBASE_API_KEY`

**OPTION 4: Add Google OAuth (if getting `auth/invalid-client-id`)**
1. Get your Google Client ID: `281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com`
2. Firebase Console → **Authentication** → **Sign-in method** → **Google**
3. Enable it
4. Under "Web SDK configuration", paste the Client ID
5. Click **Save**
6. Restart dev server

---

## Key Concepts

### Firebase API Key vs Google OAuth Client ID

```
FIREBASE API KEY:
  Format:    AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
  Starts:    AIza...
  Purpose:   Authenticate your app with Firebase services
  Location:  .env.local → firebaseConfig.apiKey
  Get from:  Firebase Console → Settings → Project Settings
  
GOOGLE OAUTH CLIENT ID:
  Format:    281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
  Ends:      .apps.googleusercontent.com
  Purpose:   OAuth authentication for Google Sign-In
  Location:  Google Cloud Console → Credentials
  Add to:    Firebase Console → Authentication → Google
  
DON'T MIX THEM UP! They have different purposes.
```

### Three Authentication Methods

#### 1. Email/Password (Built-in)
- No setup required beyond Firebase
- Works immediately
- Use for: Traditional email-based auth

#### 2. Google OAuth
- Need: Google Client ID
- Add to: Firebase Console → Authentication → Google
- Use for: "Sign in with Google" button

#### 3. Facebook OAuth
- Need: Facebook App ID and Secret
- Add to: Firebase Console → Authentication → Facebook
- Use for: "Sign in with Facebook" button

#### 4. Phone (OTP)
- Need: Enable in Firebase
- Uses: reCAPTCHA verification
- Use for: Phone number based auth

---

## Setup Verification

### Checklist: Is Everything Configured?

```
FIREBASE SETUP:
[ ] Firebase project created (duotalk-be36a)
[ ] Firebase API Key obtained
[ ] Email/Password auth enabled
[ ] Google auth enabled (if using)
[ ] Facebook auth enabled (if using)
[ ] Phone auth enabled (if using)
[ ] Authorized domains configured (localhost, yourdomain.com)

ENVIRONMENT (.env.local):
[ ] .env.local file created in /frontend folder
[ ] VITE_FIREBASE_API_KEY = AIza...
[ ] VITE_FIREBASE_AUTH_DOMAIN = duotalk-be36a.firebaseapp.com
[ ] VITE_FIREBASE_PROJECT_ID = duotalk-be36a
[ ] VITE_FIREBASE_STORAGE_BUCKET = duotalk-be36a.firebasestorage.app
[ ] VITE_FIREBASE_MESSAGING_SENDER_ID = 1039018258119
[ ] VITE_FIREBASE_APP_ID = 1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
[ ] VITE_FIREBASE_MEASUREMENT_ID = G-C2DM6MSCDK

OAUTH SETUP (if using):
[ ] Google Client ID in .env.local
[ ] Google Client ID in Firebase Console
[ ] Google Cloud OAuth URIs configured
[ ] Facebook App ID in .env.local (optional)
[ ] Facebook App in Firebase Console (if using)

CODE:
[ ] firebase.js configured correctly
[ ] AuthContext.jsx has all auth methods
[ ] LoginModal.jsx renders buttons
[ ] AuthProvider wraps App component
[ ] useAuth hook available in components

DEV SERVER:
[ ] Dev server restarted after .env changes
[ ] Browser cache cleared
[ ] No console errors
```

### Run This to Verify Setup

In browser console (F12):
```javascript
// Check config
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Or use the debugger
import { FirebaseDebugger } from '/src/utils/firebaseDebugger.js';
FirebaseDebugger.config();
FirebaseDebugger.health();
```

---

## Code Examples

### Complete Login Page

```jsx
// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebook, FaPhone } from 'react-icons/fa';

export default function LoginPage() {
  const { 
    user, 
    loading, 
    error,
    signInWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    sendPhoneOTP,
    verifyPhoneOTP,
    confirming,
    clearError
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  // If logged in, show welcome
  if (user && !showPhoneForm) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h1>Welcome!</h1>
        <p>Logged in as: {user.email || user.displayName || 'User'}</p>
        <p>UID: {user.uid}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>Login</h1>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          await signInWithEmail({ email, password });
        } catch (err) {
          // Error already shown above
        }
      }} style={{ marginBottom: '20px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Logging in...' : 'Sign in with Email'}
        </button>
      </form>

      {/* OAuth Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={signInWithGoogle} 
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <FaGoogle style={{ marginRight: '10px' }} />
          Sign in with Google
        </button>

        <button 
          onClick={signInWithFacebook} 
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <FaFacebook style={{ marginRight: '10px' }} />
          Sign in with Facebook
        </button>

        <button 
          onClick={() => setShowPhoneForm(true)} 
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <FaPhone style={{ marginRight: '10px' }} />
          Sign in with Phone
        </button>
      </div>

      {/* reCAPTCHA Container for Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
```

### Using Auth in Components

```jsx
// Example: Check if user is logged in
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header>
      {user ? (
        <>
          <span>Welcome, {user.displayName || user.email}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <span>Not logged in</span>
      )}
    </header>
  );
}
```

### Protected Route

```jsx
// Example: Protect routes
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <div>This is protected content</div>;
}
```

---

## Troubleshooting

### Error: "auth/api-key-not-valid"

**Step 1: Verify API Key**
```javascript
// In browser console (F12)
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
// Should show: AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

**Step 2: Check .env.local**
```bash
# File should exist and have correct format
cat frontend/.env.local

# Should contain:
# VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

**Step 3: Restart Dev Server**
```bash
# Kill server (Ctrl+C)
npm run dev

# Clear browser cache:
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)
```

**Step 4: Check Firebase Console**
- Go to: https://console.firebase.google.com
- Project: duotalk-be36a
- Settings → Project Settings
- Copy **apiKey** value
- Verify it matches your .env.local

### Error: "auth/invalid-client-id" (Google Login)

**Fix:**
1. Go to Firebase Console
2. Authentication → Sign-in method → Google
3. Enable it
4. Paste your Client ID in "Web SDK configuration"
5. Click Save
6. Restart dev server

### Error: "auth/unauthorized-domain"

**Fix:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add domain: `localhost`
3. Add domain: `yourdomain.com` (your production domain)
4. Wait 5 minutes
5. Try again

### Phone OTP Not Sending

**Checklist:**
- [ ] Phone authentication enabled in Firebase
- [ ] Phone number format is correct (e.g., +1234567890)
- [ ] reCAPTCHA configured in Firebase
- [ ] Using test number (Firebase provides test numbers)
- [ ] SMS quota not exceeded (Firebase has limits)

**Test with Firebase Test Numbers:**
```
+1 215-555-0100
+1 215-555-0101
```
Use any 6-digit code (e.g., 123456)

### Google Popup Blank or Won't Open

**Fix:**
1. Google Cloud Console → APIs & Services → Credentials
2. Click your OAuth app
3. Edit it
4. Add to "Authorized JavaScript Origins":
   ```
   http://localhost:5173
   https://yourdomain.com
   ```
5. Save
6. Wait 5 minutes
7. Try again

### Performance Issues

**Reduce Bundle Size:**
```bash
# Check what's being imported
npm ls firebase
npm ls react

# Use tree-shaking in vite.config.js:
# Already configured for you!
```

---

## Production Checklist

### Before Deploying to Production

#### Security
- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys hardcoded in code
- [ ] Using environment variables from hosting platform
- [ ] HTTPS enabled on production domain
- [ ] reCAPTCHA enabled for phone auth

#### Firebase Configuration
- [ ] Production domain added to authorized domains
- [ ] OAuth redirect URIs updated to production domain
- [ ] All sign-in methods tested and working
- [ ] Email verification enabled (if required)
- [ ] Password reset configured (if using email auth)

#### Environment Variables
- [ ] All VITE_FIREBASE_* vars set on hosting platform
- [ ] Google Client ID set (if using)
- [ ] Facebook App ID set (if using)
- [ ] No hardcoded localhost values

#### Testing
- [ ] `npm run build` completes without errors
- [ ] `npm run preview` works with all auth methods
- [ ] Test on actual production domain
- [ ] All login methods tested in production
- [ ] Logout and login state verified
- [ ] Browser storage/cache doesn't cause issues

#### Monitoring
- [ ] Error logging setup (Sentry, LogRocket, etc.)
- [ ] Analytics configured
- [ ] User tracking setup (optional)
- [ ] Performance monitoring enabled

---

## File Reference

### Key Files in Your Project

| File | Purpose |
|------|---------|
| `frontend/.env.local` | Environment variables (PRIVATE) |
| `frontend/.env.example` | Template for env vars |
| `frontend/src/config/firebase.js` | Firebase initialization |
| `frontend/src/context/AuthContext.jsx` | Authentication logic |
| `frontend/src/components/LoginModal.jsx` | Login UI |
| `frontend/src/utils/firebaseDebugger.js` | Debugging tools |

### How to Use the Debugger

```javascript
// In browser console
import { FirebaseDebugger } from '/src/utils/firebaseDebugger.js';

// Check config
FirebaseDebugger.config();

// Check auth state
import { auth } from '/src/config/firebase.js';
FirebaseDebugger.authState(auth);

// Debug an error
try {
  // Your auth code
} catch (error) {
  FirebaseDebugger.error(error);
}

// Health check
FirebaseDebugger.health(auth);

// Get help
FirebaseDebugger.help();
```

---

## Next Steps

1. **Quick Start:**
   - [ ] Read "Quick Fixes" section above
   - [ ] Restart dev server
   - [ ] Test login

2. **Setup:**
   - [ ] Follow "Setup Verification" checklist
   - [ ] Verify all env variables
   - [ ] Test all auth methods

3. **Production:**
   - [ ] Follow "Production Checklist"
   - [ ] Test production build
   - [ ] Deploy
   - [ ] Monitor errors

---

## Resources

- **Firebase:** https://firebase.google.com/docs/auth
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **Facebook Login:** https://developers.facebook.com/docs/facebook-login
- **Vite Env:** https://vitejs.dev/guide/env-and-mode.html
- **React Auth Patterns:** https://reactjs.org/docs/thinking-in-react.html

---

## Support

If you're still having issues:

1. **Check the debugger:**
   ```javascript
   FirebaseDebugger.config();
   ```

2. **Search Firebase docs:**
   - https://firebase.google.com/docs/auth

3. **Check error code:**
   - All errors have `code` property (e.g., `auth/api-key-not-valid`)
   - Search this guide for the error code

4. **Clear everything:**
   ```bash
   # Delete modules and reinstall
   rm -rf frontend/node_modules
   npm install
   npm run dev
   ```

---

## Summary

Your Firebase setup is **almost complete**. The main steps are:

1. ✅ Firebase API Key - Already have it
2. ✅ Firebase Config - Already set up
3. ✅ Auth Context - Already created
4. ❌ **Google OAuth Client ID in Firebase** - MISSING (if using Google login)

**Quick fix:** Add your Google Client ID to Firebase Console and restart the dev server.

All the code is production-ready and well-documented. Happy coding! 🎉
