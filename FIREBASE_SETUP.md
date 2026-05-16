# 🔥 Firebase Authentication Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create Project** or select existing project
3. Enter project name (e.g., "DuoTalk")
4. Enable Google Analytics (optional)
5. Click **Create Project**

Wait for project to initialize (~1 minute)

---

## Step 2: Register Web App

1. In Firebase Console, click **Web** icon (</>) to register web app
2. App nickname: `DuoTalk Web`
3. Check **Also set up Firebase Hosting** (optional)
4. Click **Register app**

You'll see your **Firebase Configuration Object** - COPY THIS

---

## Step 3: Add Firebase Config to Your Project

1. Open `frontend/src/config/firebase.js`
2. Replace `YOUR_API_KEY_HERE` and other placeholders WITH YOUR ACTUAL CONFIG:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "your-project-name.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**⚠️ IMPORTANT**: Never commit real API keys to version control!

---

## Step 4: Enable Google Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable** to ON
4. Select **Project support email** from dropdown
5. Click **Save**

✅ Google Sign-In is now enabled!

---

## Step 5: Enable Facebook Authentication

### 5a. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** as app type
4. Fill app details:
   - **App Name**: DuoTalk
   - **App Purpose**: Choose appropriate category
   - **App Contact Email**: Your email
5. Click **Create App**

### 5b. Add Facebook Login Product

1. From **Add Products** section, find **Facebook Login**
2. Click **Set Up**
3. Choose **Web** as platform
4. For Site URL, enter: `http://localhost:5176` (for dev) or your production domain

### 5c: Get App ID & Secret

1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret** (keep secret safe!)
3. Add **App Domains**: `localhost` (dev) and your production domain

### 5d: Enable in Firebase

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Facebook**
3. Toggle **Enable** to ON
4. Paste **App ID** and **App Secret**
5. Copy **OAuth Redirect URI** for later
6. Click **Save**

### 5e: Add Facebook OAuth Redirect URI

1. Go back to Facebook App → **Facebook Login** → **Settings**
2. Under **Valid OAuth Redirect URIs**, paste the URI from Firebase
3. Save

✅ Facebook Sign-In is now enabled!

---

## Step 6: Enable Phone Authentication (with reCAPTCHA)

### 6a: Enable Phone Auth in Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Phone**
3. Toggle **Enable** to ON
4. Select reCAPTCHA version: **reCAPTCHA v3** (recommended for UX)
5. Click **Save**

### 6b: Configure reCAPTCHA

1. Firebase will automatically create reCAPTCHA app
2. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
3. Select your reCAPTCHA v3 site
4. In **Settings**, add your domains:
   - `localhost` (dev)
   - Your production domain
5. Save

✅ Phone OTP authentication is ready!

---

## Step 7: Test Authentication

1. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5176`

3. Click **Login** button

4. Test each authentication method:
   - **Google**: Click Google button → Sign in with Google
   - **Facebook**: Click Facebook button → Sign in with Facebook  
   - **Phone OTP**: 
     - Enter phone number with country code (e.g., +1 555-123-4567)
     - Click "Send OTP"
     - Enter 6-digit code sent to phone (test mode sends to verification number)
     - Click "Verify OTP"

---

## Step 8: Configuration for Production

### Environment Variables

For production, create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then update `firebase.js` to use environment variables:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

---

## Step 9: Security Rules (Production)

Update Firestore security rules for production use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Troubleshooting

### "Popup blocked" Error
- Check browser popup blocker settings
- Allow popups from localhost:5176

### "reCAPTCHA error" for Phone OTP
- Verify reCAPTCHA domains include `localhost`
- Check Firebase Phone Auth is enabled

### "Invalid OAuth Redirect URI"
- Copy URI exactly from Firebase Console
- Ensure Facebook app domains match

### User data not persisting
- Check `browserLocalPersistence` is set in `firebase.js`
- Test in private/incognito window

---

## File Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── firebase.js          ← Firebase config (ADD YOUR CREDENTIALS HERE)
│   ├── context/
│   │   └── AuthContext.jsx      ← Auth provider & hooks
│   ├── components/
│   │   └── LoginModal.jsx       ← Login UI component
│   ├── App.jsx                  ← Main app (uses auth)
│   └── main.jsx                 ← Wrapped with AuthProvider
```

---

## Usage in Components

```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, logout, error } = useAuth();
  
  if (!user) return <p>Not logged in</p>;
  
  return (
    <div>
      <h1>Welcome {user.displayName}</h1>
      <img src={user.photoURL} />
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Next Steps

1. ✅ Create Firebase project
2. ✅ Add Firebase config to `frontend/src/config/firebase.js`
3. ✅ Enable Google, Facebook, and Phone authentication
4. ✅ Test login flows
5. ⏭️ Create user dashboard/profile page
6. ⏭️ Connect to backend MongoDB for user data storage
7. ⏭️ Deploy to production

---

**Questions?** Check [Firebase Docs](https://firebase.google.com/docs/auth)
