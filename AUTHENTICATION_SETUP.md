# DuoTalk Authentication Setup Guide

## Overview
Complete real-time authentication system using Firebase Authentication with Google, Facebook, and Phone Number (OTP) login methods.

---

## 📋 Table of Contents
1. [Firebase Configuration](#firebase-configuration)
2. [Authentication Methods](#authentication-methods)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🔥 Firebase Configuration

### Current Status
✅ **Email/Password** - Enabled
✅ **Google OAuth** - Enabled  
✅ **Facebook OAuth** - Enabled
✅ **Phone Authentication** - Enabled

### Firebase Console (https://console.firebase.google.com/project/duotalk-be36a)

#### 1. Google Sign-In
- **Status**: ✅ Enabled
- **Configuration**:
  - Already added OAuth Consent Screen in Google Cloud Console
  - API Key configured and used in frontend
  - No additional setup needed

#### 2. Facebook Sign-In
- **Status**: ✅ Enabled  
- **Configuration**:
  - App ID and Secret configured in Firebase Console
  - Make sure to add localhost URLs to App Domains
  - Add `http://localhost:3000`, `http://localhost:5173` to Valid OAuth Redirect URIs

#### 3. Phone Number Authentication
- **Status**: ✅ Enabled
- **Configuration**:
  - Using Firebase Phone Sign-In with reCAPTCHA
  - reCAPTCHA v3 (invisible) is enabled
  - No manual verification code setup needed

#### 4. Email/Password Authentication
- **Status**: ✅ Enabled
- **Configuration**:
  - Standard Firebase Email/Password provider

---

## 🔐 Authentication Methods

### 1. **Google Login**
```javascript
signInWithGoogle()
// Returns: Firebase User object with photo, email, displayName
```

### 2. **Facebook Login**
```javascript
signInWithFacebook()
// Returns: Firebase User object with photo, email, displayName
```

### 3. **Phone Number (OTP)**
```javascript
// Step 1: Send OTP
sendPhoneOTP('+1234567890')
// Returns: ConfirmationResult

// Step 2: Verify OTP
verifyPhoneOTP('123456')
// Returns: Firebase User object
```

### 4. **Email/Password**
```javascript
// Sign Up
signUpWithEmail({ username, email, password })

// Sign In
signInWithEmail({ email, password })
```

---

## 📁 Project Structure

```
frontend/src/
├── config/
│   └── firebase.js              # Firebase configuration
├── context/
│   └── AuthContext.jsx          # Authentication context & hooks
├── components/
│   ├── Navbar.jsx               # Navbar with login/user profile
│   ├── LoginModal.jsx           # Login modal (all 3 methods)
│   └── Navbar.css
├── pages/
│   ├── Login.jsx                # Full login page
│   └── Login.css
└── App.jsx                      # Main app component
```

### Key Files

#### **firebase.js** (Config)
```javascript
- Firebase initialization
- Auth persistence setup
- Exports: auth, app
```

#### **AuthContext.jsx** (Authentication Logic)
```javascript
Exported Methods:
- signUpWithEmail()          # Email/password signup
- signInWithEmail()          # Email/password login
- signInWithGoogle()         # Google OAuth
- signInWithFacebook()       # Facebook OAuth
- sendPhoneOTP()             # Send OTP via Firebase
- verifyPhoneOTP()           # Verify OTP code
- logout()                   # Sign out user

State:
- user                       # Current Firebase user
- loading                    # Loading state
- error                      # Error messages
- confirming                 # Phone OTP confirmation state
```

#### **LoginModal.jsx** (Login UI)
- Google login button
- Facebook login button  
- Phone login (modal with OTP flow)
- Error display
- Loading spinner
- Animations

#### **Navbar.jsx** (Navigation)
- Login button (when not authenticated)
- User avatar + name (when authenticated)
- Logout button
- Responsive design

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
# Already installed:
# - firebase@^12.12.1
# - react-toastify@^11.1.0
# - react-icons@^5.6.0
```

### Step 2: Firebase Configuration (Already Done)
The Firebase config is already in `frontend/src/config/firebase.js`:
```javascript
apiKey: 'AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg'
authDomain: 'duotalk-be36a.firebaseapp.com'
projectId: 'duotalk-be36a'
// ... etc
```

### Step 3: Enable Providers in Firebase Console

#### Google OAuth
1. Go to Firebase Console → Authentication → Sign-in method
2. Click Google → Enable
3. No additional configuration needed (using Firebase defaults)

#### Facebook OAuth
1. Go to Firebase Console → Authentication → Sign-in method
2. Click Facebook → Enable
3. Add Facebook App ID and App Secret
4. Add valid OAuth redirect URLs:
   - `https://duotalk-be36a.firebaseapp.com/__/auth/handler`
   - Production domain when ready

#### Phone Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Click Phone → Enable
3. reCAPTCHA is automatically configured

### Step 4: Environment Variables (Optional)
Create `.env.local` for environment-specific config:
```env
VITE_FIREBASE_API_KEY=AIzaSyB72ggOwZg4UrLqSg8UHUqJxHsSe25iVUg
VITE_FIREBASE_AUTH_DOMAIN=duotalk-be36a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=duotalk-be36a
# ... etc
```

### Step 5: Start Development Server
```bash
cd frontend
npm run dev
# Server runs on http://localhost:5173
```

---

## 🧪 Testing

### Test Google Login
1. Click "Login" button in navbar
2. Click "Continue with Google"
3. Select a Gmail account
4. You should see your profile in navbar

### Test Facebook Login
1. Click "Login" button in navbar
2. Click "Continue with Facebook"
3. Use a Facebook test account or production account
4. You should see your profile in navbar

### Test Phone Login
1. Click "Login" button in navbar
2. Click "Continue with Phone"
3. Enter phone number: `+1 555-123-4567` (test)
4. Complete reCAPTCHA
5. Enter OTP (Firebase sends via SMS in production, or use Firebase console in development)
6. Success screen shows

### Test Session Persistence
1. Login with any method
2. Refresh the page
3. User should still be logged in
4. Profile should display in navbar

### Test Logout
1. Click the logout button (red circle with icon)
2. Profile should disappear
3. Login button should reappear

---

## 🐛 Troubleshooting

### Issue: "Unexpected token" error in LoginModal.jsx
**Solution**: Check for missing closing braces `}` in JSX comments

### Issue: Google popup blocked
**Solution**: 
- Ensure site is on allowed list in browser
- Check Google OAuth credentials are correct
- Verify redirect URIs

### Issue: Facebook login not working
**Solution**:
- Check Facebook App ID in Firebase Console
- Verify App Domains in Facebook Developer Console
- Ensure test users are added if in development

### Issue: Phone OTP not sending
**Solution**:
- Check Firebase Phone Auth is enabled
- Verify reCAPTCHA is not triggered
- Check Firebase security rules allow auth
- Use a valid phone number format: `+[country_code][number]`

### Issue: User not persisting after refresh
**Solution**:
- Check `browserLocalPersistence` is set in firebase.js
- Verify localStorage is enabled in browser
- Check browser privacy/incognito mode

### Issue: Toast notifications not showing
**Solution**:
- Ensure `ToastContainer` is rendered in App.jsx
- Check react-toastify CSS is imported
- Verify toast config in authentication methods

---

## 📱 User Data Available After Login

```javascript
user = {
  uid: "unique-firebase-id",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  phoneNumber: "+1234567890", // For phone auth
  emailVerified: true/false,
  createdAt: timestamp,
  // ... more Firebase properties
}
```

---

## 🔄 Authentication Flow Diagram

```
[Landing Page]
      ↓
  [Click Login]
      ↓
[Login Modal Opens]
      ↓
    ┌─────────────────────────┬─────────────────┬──────────────┐
    ↓                         ↓                 ↓              ↓
[Google Popup]      [Facebook Popup]   [Phone OTP Modal]  [Email Modal]
    ↓                         ↓                 ↓              ↓
[Select Account]    [Grant Permission]  [Send OTP]      [Enter Email]
    ↓                         ↓                 ↓              ↓
[Firebase Auth]     [Firebase Auth]   [Enter OTP Code]  [Enter Password]
    ↓                         ↓                 ↓              ↓
    └─────────────────────────┴─────────────────┴──────────────┘
                              ↓
                      [User Authenticated]
                              ↓
                      [Modal Closes]
                              ↓
                   [Show User Profile in Navbar]
                              ↓
                         [Dashboard Access]
```

---

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)

---

## ✅ Checklist

- [x] Firebase project created
- [x] Authentication providers enabled (Google, Facebook, Phone, Email)
- [x] Firebase config in frontend
- [x] AuthContext with all methods
- [x] LoginModal component with all 3 methods
- [x] Navbar with login/profile
- [x] Session persistence
- [x] Error handling
- [x] Loading states
- [x] Toast notifications
- [x] Responsive design
- [x] Production-ready code

---

## 🎯 Next Steps

1. **Deploy to Production**
   - Update authorized domains in Google Cloud Console
   - Update App Domains in Facebook Developer Console
   - Update Firebase Hosting configuration

2. **Add User Profile Editing**
   - Allow users to update displayName, photoURL
   - Store additional user data in Firestore

3. **Add Protected Routes**
   - Create PrivateRoute component
   - Redirect unauthenticated users

4. **Add Social Features**
   - User profiles
   - Follow/unfollow
   - Messaging system

---

**Last Updated**: April 22, 2026
**Status**: ✅ Production Ready
