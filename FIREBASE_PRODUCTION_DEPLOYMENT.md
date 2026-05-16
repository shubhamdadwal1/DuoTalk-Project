# Firebase Authentication - Production Deployment Guide

## Quick Start (5 Minutes)

If you just want to get it working quickly, follow these steps:

### 1. Get Your Firebase Credentials
```bash
# Go to: https://console.firebase.google.com
# Select your project: duotalk-be36a
# Settings → Project Settings
# Copy these values:
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
VITE_FIREBASE_STORAGE_BUCKET=duotalk-be36a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1039018258119
VITE_FIREBASE_APP_ID=1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
VITE_FIREBASE_MEASUREMENT_ID=G-C2DM6MSCDK
```

### 2. Create `.env.local` in `/frontend` folder
```bash
cd frontend
# Copy .env.example to .env.local and replace with your actual values
cp .env.example .env.local
```

### 3. Add Google OAuth Client ID to Firebase Console
1. Go to: **Firebase Console → Authentication → Sign-in method → Google**
2. Click **Edit** (pencil icon)
3. Paste your Google OAuth Client ID:
   ```
   281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com
   ```
4. Click **Save**

### 4. Restart Dev Server
```bash
# Kill the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 5. Test It
- Open: `http://localhost:5173`
- Click login
- Try Google/Facebook/Phone login
- Should work now!

---

## Complete Setup Instructions

### Step A: Firebase Project Setup

#### 1. Enable Authentication Methods

**Google Sign-In:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Click **Enable**
4. Add your OAuth Client ID in the Web SDK configuration
5. Click **Save**

**Facebook Sign-In:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Facebook**
3. Go to [Facebook Developers Console](https://developers.facebook.com)
4. Create/select an app
5. Get the **App ID** and **App Secret**
6. Paste them in Firebase
7. Click **Save**

**Phone Sign-In:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Phone**
3. Click **Enable**
4. Click **Save**

#### 2. Configure Authorized Domains

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost` (for local development)
   - `127.0.0.1` (for local development)
   - Your production domain (e.g., `yourdomain.com`)
3. Click **Add domain**

#### 3. Get Your Firebase Web API Key

1. Firebase Console → **Settings** (gear icon) → **Project Settings**
2. Scroll to **Your apps** section
3. Find your web app (marked as `</>`)
4. Copy the **apiKey** value (looks like `AIza...`)

---

### Step B: Google OAuth Setup

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **duotalk-be36a**
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add Authorized URIs:
   - **JavaScript Origins:**
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
     - `https://yourdomain.com`
   - **Redirect URIs:**
     - `http://localhost:5173/`
     - `https://yourdomain.com/`
7. Click **Create**
8. Copy your **Client ID** (ends with `.apps.googleusercontent.com`)

#### 2. Add to Firebase Console

1. Firebase Console → **Authentication** → **Sign-in method** → **Google**
2. Enable it (if not already)
3. Under **Web SDK configuration**, paste your **Google Client ID**
4. Click **Save**

---

### Step C: Facebook OAuth Setup

#### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as app type
4. Fill in:
   - **App Name:** DuoTalk
   - **App Email:** your-email@gmail.com
   - **App Purpose:** Choose appropriate category
5. Click **Create App**

#### 2. Configure Facebook App

1. In your app dashboard, click **Settings** → **Basic**
2. Copy **App ID** and **App Secret**
3. Click **+ Add Platform** → **Website**
4. In **Site URL**, add:
   - `http://localhost:5173`
   - `https://yourdomain.com`
5. Click **Save Changes**

#### 3. Add Facebook Login Product

1. In app dashboard, click **+ Add Product**
2. Find **Facebook Login** → Click **Set Up**
3. Choose **Web** as platform
4. For **Valid OAuth Redirect URIs**, add:
   - `http://localhost:5173/`
   - `https://yourdomain.com/`
5. Save

#### 4. Add to Firebase Console

1. Firebase Console → **Authentication** → **Sign-in method** → **Facebook**
2. Enable it
3. Paste **App ID** and **App Secret** from Facebook
4. Click **Save**

---

### Step D: Environment Variables Setup

#### 1. Create `.env.local` file

**Location:** `frontend/.env.local`

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
VITE_FIREBASE_STORAGE_BUCKET=duotalk-be36a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1039018258119
VITE_FIREBASE_APP_ID=1:1039018258119:web:7d8a22fc6b8eb0bae6d8e2
VITE_FIREBASE_MEASUREMENT_ID=G-C2DM6MSCDK

# Google OAuth
VITE_GOOGLE_CLIENT_ID=281675981218-lhb6f7qjpm3gk3ek8r2dckjq5s2astra.apps.googleusercontent.com

# Facebook OAuth
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

#### 2. Add to `.gitignore`

```
# Environment variables (KEEP PRIVATE!)
.env.local
.env.*.local
```

#### 3. Verify Environment Variables are Loaded

```bash
cd frontend
npm run dev

# In browser console, should see:
# 🔥 Firebase Config Status: {apiKey: '✅ Loaded', ...}
```

---

## Testing Checklist

### Local Testing (localhost:5173)

- [ ] Google login works
- [ ] Facebook login works
- [ ] Phone OTP login works
- [ ] User data displays correctly after login
- [ ] Logout works
- [ ] Page refresh maintains login state
- [ ] Private routes are protected

### Production Testing (before deployment)

- [ ] All environment variables are set
- [ ] OAuth redirect URIs are configured correctly
- [ ] reCAPTCHA is working
- [ ] HTTPS is enabled
- [ ] Domain is in Firebase authorized domains
- [ ] Run `npm run build` successfully
- [ ] Test auth with `npm run preview`

---

## Common Issues & Solutions

### ❌ Error: `auth/api-key-not-valid`

**Cause:** Firebase API key is missing or invalid

**Solutions:**
1. Check `.env.local` exists and has `VITE_FIREBASE_API_KEY`
2. Verify API key starts with `AIza...`
3. Restart dev server: `npm run dev`
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check Firebase Console → Settings for correct API key

### ❌ Error: `auth/invalid-client-id`

**Cause:** OAuth Client ID not configured in Firebase

**Solutions:**
1. Go to Firebase Console → Authentication → Google
2. Paste your Client ID in "Web SDK configuration"
3. Click Save
4. Restart dev server

### ❌ Error: `auth/unauthorized-domain`

**Cause:** Your domain not in Firebase authorized domains

**Solutions:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain (e.g., `localhost`, `yourdomain.com`)
3. Wait 5 minutes for Firebase to propagate

### ❌ Error: `auth/popup-closed-by-user`

**Cause:** User closed the login popup

**Solution:** This is expected behavior - handle gracefully (already done in code)

### ❌ Error: `auth/operation-not-allowed`

**Cause:** Sign-in method not enabled in Firebase

**Solutions:**
1. Firebase Console → Authentication → Sign-in method
2. Enable the required method (Google/Facebook/Phone)
3. Click Save

### ❌ Phone OTP not sending

**Cause:** reCAPTCHA or SMS quota issues

**Solutions:**
1. Enable Phone authentication in Firebase
2. Check Firebase Console → Authentication → Phone → reCAPTCHA settings
3. Check SMS quota hasn't been exceeded
4. Try with a different phone number
5. Test numbers: Firebase provides test numbers for development

### ❌ Google login blank popup

**Cause:** Unauthorized JavaScript origin

**Solutions:**
1. Google Cloud Console → APIs & Services → Credentials
2. Click your OAuth app
3. Add URI to **Authorized JavaScript Origins**:
   - For local: `http://localhost:5173`
   - For prod: `https://yourdomain.com`
4. Save and wait 5 minutes

---

## Production Deployment

### Before Deploying:

1. **Set Environment Variables**
   - Your hosting platform has a way to set env vars
   - Vercel: Settings → Environment Variables
   - Netlify: Build & deploy → Environment
   - AWS: Systems Manager → Parameter Store
   
   Set these env vars on your hosting:
   ```
   VITE_FIREBASE_API_KEY=value
   VITE_FIREBASE_AUTH_DOMAIN=value
   VITE_FIREBASE_PROJECT_ID=value
   # ... (all other vars)
   ```

2. **Update Firebase Authorized Domains**
   - Firebase Console → Authentication → Settings
   - Add your production domain
   - Remove localhost (optional, but recommended)

3. **Update OAuth Redirect URIs**
   - Google Cloud Console → Credentials
   - Add production domain to "Authorized JavaScript Origins"
   - Facebook Developers Console → Settings
   - Add production domain to Site URLs

4. **Test Production Build Locally**
   ```bash
   npm run build
   npm run preview
   ```

5. **Deploy**
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   netlify deploy --prod
   
   # Or your hosting platform
   ```

---

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use `.env.example` as template
   - Each deployment should have its own env vars

2. **API Keys:**
   - Firebase API keys are public (safe to expose)
   - OAuth secrets should NEVER be in frontend
   - Use backend proxy for sensitive operations

3. **Domain Restrictions:**
   - Add your domain to Firebase authorized domains
   - Restricts API key usage to your domain
   - Prevents other sites from using your API key

4. **reCAPTCHA:**
   - Enable reCAPTCHA v3 for phone authentication
   - Prevents spam and abuse

5. **HTTPS:**
   - Always use HTTPS in production
   - Firebase enforces this for OAuth

---

## Code Examples

### Using Auth Context in Components

```jsx
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.displayName}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}
```

### Protecting Routes

```jsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ component: Component }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <Component />;
}
```

---

## Support & Debugging

### Check Logs

**Browser Console (F12):**
- `🔥 Firebase Config Status` - Shows if config loaded
- `👤 Auth state changed` - Shows login/logout
- Error messages from auth failures

**Network Tab (F12 → Network):**
- Look for requests to `identitytoolkit.googleapis.com`
- Check response status and error details

### Debug Mode

Add this to `firebase.js` for more detailed logs:
```javascript
if (import.meta.env.DEV) {
  // Detailed logging is already included
}
```

### Test Credentials

Firebase provides test phone numbers for development:
```
+1 215-555-0100
+1 215-555-0101
```

Use any 6-digit code (e.g., 123456)

---

## Next Steps

1. ✅ Follow "Quick Start" section above
2. ✅ Test all auth methods locally
3. ✅ Build and test production build: `npm run build && npm run preview`
4. ✅ Deploy to production
5. ✅ Test auth on production domain
6. ✅ Monitor errors (use Sentry, LogRocket, or similar)
7. ✅ Set up email verification (optional)
8. ✅ Set up password reset (optional)

---

## References

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
