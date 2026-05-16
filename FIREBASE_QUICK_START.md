# 🔥 Firebase Quick Reference & Credential Guide

## 🚀 Quick Start (5 minutes)

### 1️⃣ Create Firebase Project (1 min)
- Visit: https://console.firebase.google.com
- Click **Create Project**
- Name: `DuoTalk`
- Click **Create**

### 2️⃣ Get Firebase Config (2 min)
- Click **Web** (home screen)
- Copy entire config object that appears
- **Paste into**: `frontend/src/config/firebase.js` (replace placeholders)

### 3️⃣ Enable Auth Methods (2 min)

**Google:**
- Auth → Sign-in method → Google → Enable → Save

**Facebook:**
- Auth → Sign-in method → Facebook → Enable
- Visit [Facebook Dev](https://developers.facebook.com/), create app
- Copy App ID & Secret
- Paste in Firebase → Save
- Copy Firebase Redirect URI → Paste in Facebook App settings

**Phone:**
- Auth → Sign-in method → Phone → Enable → Save
- reCAPTCHA auto-configured

---

## 📋 Your Firebase Credentials Template

Create this as `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "",              // 👈 COPY FROM FIREBASE CONSOLE
  authDomain: "",          // 👈 COPY FROM FIREBASE CONSOLE
  projectId: "",           // 👈 COPY FROM FIREBASE CONSOLE
  storageBucket: "",       // 👈 COPY FROM FIREBASE CONSOLE
  messagingSenderId: "",   // 👈 COPY FROM FIREBASE CONSOLE
  appId: "",               // 👈 COPY FROM FIREBASE CONSOLE
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .catch((error) => console.log("Persistence error:", error));

export default app;
```

---

## 🎯 Testing Checklist

- [ ] Frontend starts without errors: `npm run dev`
- [ ] Login modal appears when clicking Login button
- [ ] Google login works
- [ ] Facebook login works
- [ ] Phone OTP works (test with +1 555-0123)
- [ ] User profile shows in navbar
- [ ] Logout button works
- [ ] User stays logged in after page refresh

---

## 🔗 Reference Links

| Service | Link |
|---------|------|
| Firebase Console | https://console.firebase.google.com |
| Facebook Dev | https://developers.facebook.com |
| reCAPTCHA Console | https://www.google.com/recaptcha/admin |
| Firebase Auth Docs | https://firebase.google.com/docs/auth/web/start |
| React Context Docs | https://react.dev/reference/react/useContext |

---

## 📱 Component API Reference

### `useAuth()` Hook

```javascript
const {
  user,              // Current user object or null
  loading,           // true while authenticating
  error,             // Error message if auth fails
  confirming,        // Phone OTP confirmation object
  signInWithGoogle,  // () => Promise
  signInWithFacebook,// () => Promise
  sendPhoneOTP,      // (phoneNumber) => Promise
  verifyPhoneOTP,    // (code) => Promise
  logout,            // () => Promise
  clearError,        // () => void
} = useAuth();
```

### `LoginModal` Component

```jsx
<LoginModal 
  isOpen={boolean}        // Show/hide modal
  onClose={() => {}}      // Called when modal closes
/>
```

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| Firebase config empty | Copy from Firebase Console home screen |
| Google popup blocked | Allow popups in browser settings |
| Phone OTP error | Add `localhost` to reCAPTCHA domains |
| Facebook OAuth failed | Verify App ID/Secret + OAuth URI |
| User not persisting | Refresh page - should still be logged in |

---

## 🎬 Demo Flow

1. User clicks **Login** → Modal appears
2. User chooses auth method:
   - **Google**: Popup → Sign in → Back to app (logged in)
   - **Facebook**: Popup → Sign in → Back to app (logged in)
   - **Phone**: Enter number → Get OTP → Enter code → Logged in
3. Profile photo + name appear in navbar
4. User can click **Logout** to sign out
5. User stays logged in after page refresh

---

## 📊 File Locations

```
frontend/
├── src/config/firebase.js       ← YOUR CREDENTIALS GO HERE
├── src/context/AuthContext.jsx  ← Auth logic (don't modify)
├── src/components/LoginModal.jsx ← Login UI (don't modify)
├── src/App.jsx                  ← Main app (uses auth)
└── src/main.jsx                 ← Root (uses AuthProvider)
```

---

## 💡 Pro Tips

1. **Never hardcode credentials** - Use env vars in production
2. **Test in incognito** - Avoid cache issues
3. **Check console** - F12 → Console tab shows errors
4. **Phone testing** - Firebase test numbers for any country
5. **Profile data** - Firebase auto-populates name/photo from OAuth

---

## 🎯 What's Next?

After login works:

1. Create user dashboard
2. Store user interests
3. Build matching algorithm
4. Add video chat
5. Deploy to production

---

✅ **Ready to setup?** Follow [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) for detailed steps!
