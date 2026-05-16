# Firebase Authentication Complete Fix Guide

## Part 1: Understanding the Error & Key Differences

### The Error: `auth/api-key-not-valid`
This error occurs when:
1. **Firebase API Key is missing or invalid** in `firebaseConfig`
2. **OAuth Client ID is not configured** in Firebase Console for social login
3. **Environment variables are not loaded** properly
4. **Credentials are in the wrong place** (mixing API Key with OAuth Client ID)

---

## Part 2: Key Differences Explained

| Aspect | Firebase API Key | Google OAuth Client ID |
|--------|------------------|------------------------|
| **Format** | Starts with `AIza...` | Ends with `.apps.googleusercontent.com` |
| **Purpose** | Authenticates your web app with Firebase | Authenticates Google Sign-In popup |
| **Where to use** | `firebaseConfig.apiKey` | Firebase Console → Google Provider settings |
| **Where to get** | Firebase Console → Settings → General tab | Google Cloud Console → OAuth 2.0 IDs |
| **Public/Private** | Public (safe in frontend) | Public (safe in frontend) |
| **Required for** | All Firebase initialization | Only Google Sign-In provider |

### Your Current Status:
- ✅ **Firebase API Key:** `AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg` (Correct format)
- ✅ **Project ID:** `duotalk-be36a` (Already set correctly)
- ❌ **Missing:** OAuth Client ID configuration in Firebase Console

---

## Part 3: Step-by-Step Setup Instructions

### Step 1: Get Your Firebase API Key (Already Done)
Your current key is correct:
```
AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
```

### Step 2: Get Your Google OAuth Client ID

#### Option A: If you already have it (you mentioned one)
```
281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
```

#### Option B: Create a new one in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **duotalk-be36a**
3. Go to: **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Choose: **Web application**
6. Add URIs:
   - **Authorized JavaScript Origins:** `http://localhost:5173` (Vite dev) and `https://yourdomain.com` (production)
   - **Authorized redirect URIs:** Same as above
7. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

### Step 3: Add Google OAuth to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **duotalk-be36a**
3. Go to: **Build → Authentication → Sign-in method**
4. Click **Google**
5. Enable it
6. In **Web SDK configuration**, paste your **Google OAuth Client ID:**
   ```
   281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
   ```
7. Save

### Step 4: Enable Facebook Login in Firebase

1. In Firebase Console → **Authentication → Sign-in method**
2. Click **Facebook**
3. You need:
   - **Facebook App ID** (from [Facebook Developers](https://developers.facebook.com))
   - **Facebook App Secret**
4. Paste them in Firebase and save

### Step 5: Configure Phone Authentication

1. In Firebase Console → **Authentication → Sign-in method**
2. Click **Phone**
3. Enable it
4. Add reCAPTCHA keys (Firebase handles this automatically)
5. In Firebase Console → **Settings → Authorized domains**, add your domain

---

## Part 4: Correct Environment Variables (.env.local)

```env
# Firebase Configuration (PUBLIC - safe in frontend)
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
VITE_FIREBASE_STORAGE_BUCKET=duotalk-be36a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1039018258119
VITE_FIREBASE_APP_ID=1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
VITE_FIREBASE_MEASUREMENT_ID=G-C2DM6MSCDK

# Social Auth (Optional - for additional configuration)
VITE_GOOGLE_CLIENT_ID=281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

---

## Part 5: Updated Firebase Config (Production-Ready)

See `firebase.js` file in this repo.

---

## Part 6: Updated AuthContext (All 3 Auth Methods)

See `AuthContext.jsx` file in this repo.

---

## Part 7: Complete Login Component Example

See `LoginModal.jsx` file in this repo.

---

## Part 8: Debugging Checklist

If you still get `auth/api-key-not-valid`:

### ✅ Check 1: Verify Environment Variables
```javascript
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

### ✅ Check 2: Restart Vite Dev Server
```bash
# Kill the dev server and restart
npm run dev
```

### ✅ Check 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button → **Empty cache and hard refresh**
3. Or: DevTools → Storage → Clear all

### ✅ Check 4: Verify Firebase Console
- Go to [Firebase Console](https://console.firebase.google.com)
- Select **duotalk-be36a**
- Check if project is active (not deleted)
- Verify API key in **Settings → General**

### ✅ Check 5: Check CORS Settings
- Firebase allows all origins by default
- If blocked, check: **Settings → Authorized domains**
- Add your dev domain: `localhost:5173`
- Add production domain: `yourdomain.com`

### ✅ Check 6: Inspect Network Requests
1. DevTools → Network tab
2. Try login
3. Look for request to: `identitytoolkit.googleapis.com`
4. Check response for actual error details

### ✅ Check 7: Verify .env.local is Loaded
```bash
# Make sure .env.local exists in /frontend folder
ls -la frontend/.env.local

# Should output something like:
# -rw-r--r--  1 user  group  456 Apr 24 10:30 .env.local
```

---

## Part 9: Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `auth/api-key-not-valid` | Wrong API key or env not loaded | Use Firebase API Key, restart dev server |
| `auth/invalid-client-id` | OAuth Client ID not in Firebase | Add it to Firebase Console → Google settings |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Firebase → Authorized domains |
| `auth/operation-not-allowed` | Provider not enabled | Enable in Firebase → Sign-in methods |
| `auth/popup-closed-by-user` | User closed popup | Expected, handle gracefully |

---

## Part 10: Production Deployment Checklist

- [ ] Remove console.log statements
- [ ] Use environment variables (NOT hardcoded values)
- [ ] Enable reCAPTCHA in Firebase
- [ ] Add production domain to Firebase authorized domains
- [ ] Update Google Cloud OAuth redirect URIs to production domain
- [ ] Test all auth methods in production environment
- [ ] Set up error logging/monitoring (Sentry, LogRocket)
- [ ] Enable HTTPS on production
- [ ] Test on actual domain, not just localhost

---

## Part 11: Quick Reference Commands

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev

# Check env variables are loaded
echo $VITE_FIREBASE_API_KEY  # Windows: $env:VITE_FIREBASE_API_KEY

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Summary

Your setup is **95% correct**! The main issue is likely:
1. ❌ OAuth Client ID not added to Firebase Console (most common)
2. ❌ Env variables not reloaded (restart dev server)
3. ❌ Browser cache (hard refresh)

**Next Step:** Follow Step 3 above (Add Google OAuth to Firebase) and restart your dev server.
