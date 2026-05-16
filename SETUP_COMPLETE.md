# 🚀 DuoTalk Firebase Authentication - Complete Setup Guide

## ✅ What's Been Installed & Created

### Packages Installed
- ✅ `firebase` - Firebase SDK for authentication
- ✅ `react-toastify` - Toast notifications system
- ✅ `react-icons` - Icon library for UI

### Files Created

#### 1. **Firebase Configuration** (`frontend/src/config/firebase.js`)
- Initializes Firebase app
- Sets up authentication
- Enables local persistence

#### 2. **Auth Context** (`frontend/src/context/AuthContext.jsx`)
- Manages global auth state
- Provides auth functions:
  - `signInWithGoogle()` - Google OAuth login
  - `signInWithFacebook()` - Facebook OAuth login
  - `sendPhoneOTP()` - Send OTP to phone
  - `verifyPhoneOTP()` - Verify OTP code
  - `logout()` - Sign out user
- Exports `useAuth()` hook for components

#### 3. **Login Modal Component** (`frontend/src/components/LoginModal.jsx`)
- Beautiful modal with 3 authentication tabs
- **OAuth Tab**: Google & Facebook buttons with popup flows
- **Phone Tab**: Phone number input → OTP verification
- Toast notifications for success/error
- Loading spinners during auth
- OTP countdown timer (60 seconds)
- Resend button

#### 4. **Updated Main App** (`frontend/src/main.jsx`)
- Wraps app with `AuthProvider`
- Integrates `ToastContainer` for notifications

#### 5. **Updated App Component** (`frontend/src/App.jsx`)
- Imports `useAuth` hook
- Navbar now displays:
  - User profile photo + name when logged in
  - Logout button
  - Login button when logged out
- Integrated new `LoginModal` component

---

## 📋 Required Next Steps

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create Project**
3. Name: `DuoTalk`
4. Enable Google Analytics (optional)
5. Click **Create Project** and wait 1-2 minutes

### Step 2: Register Web App
1. In Firebase Console, click the **Web** icon (</>) under "Get started by adding Firebase to your app"
2. App nickname: `DuoTalk Web`
3. Click **Register app**
4. **COPY** the Firebase config object that appears

### Step 3: Add Firebase Config to Project
1. Open `frontend/src/config/firebase.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

⚠️ **IMPORTANT**: Never commit real API keys to version control!

### Step 4: Enable Google Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable**
4. Select **Project support email**
5. Click **Save**

### Step 5: Enable Facebook Authentication
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app → Consumer type
3. Add **Facebook Login** product
4. Choose **Web** platform
5. Website URL: `http://localhost:5176` (for dev)
6. Copy **App ID** and **App Secret**

Back in Firebase:
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Facebook**
3. Toggle **Enable**
4. Paste **App ID** and **App Secret**
5. **COPY** the OAuth Redirect URI
6. Click **Save**

In Facebook App Settings:
1. Add to **Valid OAuth Redirect URIs** (from step 5)
2. Add `localhost` to **App Domains**
3. Save

### Step 6: Enable Phone Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Phone**
3. Toggle **Enable**
4. Choose **reCAPTCHA v3** for best UX
5. Click **Save**

Then configure reCAPTCHA:
1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your reCAPTCHA v3 site
3. Add domains:
   - `localhost`
   - Your production domain
4. Save

---

## 🧪 Testing Authentication

### Start the App
```bash
cd frontend
npm run dev
```

Open browser to: `http://localhost:5177` (or shown port)

### Test Google Login
1. Click **Login** button
2. Click **Quick Sign In** tab
3. Click **Continue with Google**
4. Sign in with your Google account
5. Should see your profile in navbar

### Test Facebook Login
1. Click **Login** again
2. Click **Continue with Facebook**
3. Sign in with Facebook
4. Should see Facebook profile in navbar

### Test Phone OTP
1. Click **Login** again
2. Click **Phone OTP** tab
3. Enter phone with country code: `+1 (555) 123-4567`
4. Click **Send OTP**
5. Firebase sends test OTP (check spam folder or use test number)
6. Enter 6-digit code
7. Click **Verify OTP**
8. Should be logged in!

### Test Logout
1. Click **Logout** button in navbar
2. Should return to login page
3. Can log in again

---

## 📱 File Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── firebase.js              ← ⭐ ADD YOUR CONFIG HERE
│   ├── context/
│   │   └── AuthContext.jsx          ← Auth provider & functions
│   ├── components/
│   │   └── LoginModal.jsx           ← Beautiful login UI
│   ├── App.jsx                      ← Main app (updated for auth)
│   └── main.jsx                     ← Wrapped with AuthProvider
│
├── .env.local                       ← (Optional) Environment variables
│
package.json                         ← Already has firebase dependencies
```

---

## 🔧 Usage in Components

```jsx
import { useAuth } from './context/AuthContext';

function ProfilePage() {
  const { user, logout, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <img src={user.photoURL} alt={user.displayName} />
      <h1>Welcome, {user.displayName}</h1>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🛡️ Production Checklist

- [ ] Firebase config moved to environment variables
- [ ] reCAPTCHA domains include production URL
- [ ] Google OAuth redirect URI updated for production domain
- [ ] Facebook OAuth redirect URI updated for production domain
- [ ] Firebase security rules configured
- [ ] Email verification enabled (optional)
- [ ] Firestore database created for user profiles
- [ ] User data persistence configured
- [ ] API rate limiting for OTP sends
- [ ] Error handling and logging configured
- [ ] HTTPS enabled on production domain

---

## 🐛 Troubleshooting

### "Cannot find module 'firebase'"
```bash
cd frontend
npm install firebase react-toastify
```

### "Firebase config is undefined"
- Did you update `firebase.js` with real credentials?
- Check Firebase Console for correct values
- Ensure all fields are filled (no undefined)

### "Google popup blocked"
- Check browser popup blocker
- Allow popups from `localhost:5177`
- Try in incognito window

### "reCAPTCHA error"
- Check reCAPTCHA domains include localhost
- Verify Firebase Phone auth is enabled
- Test in browser console: `window.recaptchaVerifier`

### "Invalid OTP"
- OTP expires after 5 minutes
- Click "Resend OTP"
- Check phone number format (include country code)

### "Facebook OAuth Redirect URI mismatch"
- Copy URI exactly from Firebase Console
- Add to Facebook App OAuth settings
- Wait a few minutes for changes to propagate

### User data not persisting after refresh
- Check `browserLocalPersistence` in `firebase.js`
- Clear browser cache
- Test in private/incognito window

---

## 📚 Next Steps After Setup

1. ✅ **Create user profiles** in Firestore/MongoDB
   - Store user interests
   - Store user photos
   - Store friends list

2. ✅ **Create dashboard page** for logged-in users
   - Show user profile
   - Edit profile settings
   - View friends list
   - Start conversations

3. ✅ **Create matching algorithm**
   - Find users with same interests
   - Rank matches by compatibility
   - Implement swipe interface

4. ✅ **Integrate video chat** (after login works)
   - WebRTC or Firebase Realtime Database
   - Call notifications
   - Call history

5. ✅ **Deploy to production**
   - Build: `npm run build`
   - Deploy to Vercel/Netlify

---

## 📖 Resources

- [Firebase Docs](https://firebase.google.com/docs/auth)
- [React Hooks](https://react.dev/reference/react)
- [React Context API](https://react.dev/reference/react/useContext)
- [Phone Authentication Guide](https://firebase.google.com/docs/auth/web/phone-auth)

---

## ✉️ Support

If you encounter issues:

1. Check console for error messages: F12 → Console tab
2. Check Firebase Console for warnings
3. Verify all Firebase credentials are correct
4. Test in incognito/private window
5. Check Firebase/React security rules

**Questions?** Refer to the [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) file in the project root.
