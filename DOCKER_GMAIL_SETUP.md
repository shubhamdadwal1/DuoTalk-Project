# 🐳 Docker Compose Setup Guide - Gmail Authentication

## ⚡ Quick Start (3 Steps)

### Step 1: Copy and Configure .env File
```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit .env and fill in your Firebase credentials
# Open .env and add all your VITE_FIREBASE_* variables
```

### Step 2: Configure Firebase for localhost:5173
This is **CRITICAL** for Gmail login to work in Docker!

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method** > **Google**
4. Scroll down to "Authorized domains"
5. **Add these two domains:**
   - `localhost`
   - `127.0.0.1`

6. Navigate to **Settings** > **General** tab
7. Copy all your Firebase config values to `.env`:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - etc.

### Step 3: Get Your Google OAuth 2.0 Client ID

1. In Firebase Console, go to **Authentication** > **Sign-in method** > **Google**
2. You'll see "Web SDK configuration" with your OAuth config
3. Click on **Google Cloud Console** link under the config
4. Go to **APIs & Services** > **Credentials**
5. Find "OAuth 2.0 Client IDs" (type: Web application)
6. Copy the "Client ID" value
7. Paste it in `.env` as `VITE_GOOGLE_CLIENT_ID`

---

## 🚀 Running Docker Compose

### Start All Services
```bash
docker-compose up --build
```

### Access Services
- **Frontend:** http://localhost:5173
- **Backend API:** http://3.25.153.25:3001
- **MongoDB Admin:** http://localhost:8081 (optional, use `docker-compose --profile admin up`)
- **Socket.IO:** Connects via frontend to http://3.25.153.25:3001

---

## 🔍 Testing Gmail Login in Docker

1. Open http://localhost:5173 in browser
2. Click "Continue with Google"
3. Sign in with your Gmail account
4. You should be redirected back to your app

### If Gmail Login Fails:

#### ✗ Error: "Unauthorized domain"
- **Problem:** Firebase doesn't recognize localhost
- **Fix:** Add `localhost` and `127.0.0.1` to Firebase authorized domains (see Step 2 above)

#### ✗ Error: "CORS blocked"
- **Problem:** Backend CORS doesn't include frontend URL
- **Fix:** This is now fixed! The updated docker-compose.yml includes `http://frontend:5173`

#### ✗ Error: "Firebase configuration incomplete"
- **Problem:** VITE variables not passed to build
- **Fix:** Fill in ALL variables in `.env` file, including:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_GOOGLE_CLIENT_ID

#### ✗ Error: "The redirect URI mismatch"
- **Problem:** Your callback URL doesn't match Firebase settings
- **Fix:** Make sure Firebase authorized redirect URIs includes `http://localhost:5173`

---

## 🔧 Troubleshooting Checklist

### 1. Verify Environment Variables
```bash
# Check if .env was read correctly
docker-compose config | grep VITE_FIREBASE
```
Should show all your Firebase variables, NOT empty strings.

### 2. Check Frontend Build
```bash
# View frontend container logs
docker-compose logs frontend

# Should see: "Vite v... ready in ... ms"
# If not, there's a build error
```

### 3. Verify Backend Connection
```bash
# Check if backend is running
docker-compose logs backend

# Should see: "Server running on port 3001"
```

### 4. Test API Connection
```bash
# In your browser console, run:
fetch('http://3.25.153.25:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

### 5. Check Firebase Console
- Go to **Authentication** > **Users**
- After login attempt, you should see a new user created
- If not, Gmail auth failed at Firebase level

---

## 📝 Complete .env Example

```env
# Firebase - Copy from Project Settings
VITE_FIREBASE_API_KEY=AIzaSyD_NvOVwOr-...
VITE_FIREBASE_AUTH_DOMAIN=myproject-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myproject-abc123
VITE_FIREBASE_STORAGE_BUCKET=myproject-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ

# Google OAuth - Copy from OAuth 2.0 Client ID
VITE_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com

# Optional
VITE_FACEBOOK_APP_ID=

# API URLs (keep as-is for Docker)
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=http://3.25.153.25:3001

# Database
MONGODB_URI=mongodb://mongodb:27017/duotalk
MONGODB_DB=duotalk

# Server
JWT_SECRET=your-super-secret-key-12345
NODE_ENV=production

# CORS (now includes Docker network)
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost,http://localhost:80,http://frontend:5173
SOCKET_IO_CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost,http://localhost:80,http://frontend:5173
```

---

## 🐳 Docker Compose Features

### Services Included
- **MongoDB:** Database (port 27017)
- **Backend:** Express server (port 3001, internal only)
- **Frontend:** Vite + React + Nginx (port 5173)
- **Mongo Express:** Admin UI (port 8081, optional)

### Health Checks
- MongoDB has health check (15s interval)
- Backend has health check (20s interval)
- Frontend starts after backend is healthy

### Network
- All services connected via `duotalk-network`
- Services can communicate using service names (e.g., `http://backend:3001`)

---

## 🆘 Still Not Working?

### Step 1: Clean and Rebuild
```bash
docker-compose down -v  # Remove volumes
docker-compose up --build  # Rebuild everything
```

### Step 2: Check Logs
```bash
# Frontend logs (Vite build errors)
docker-compose logs frontend -f

# Backend logs (API errors)
docker-compose logs backend -f

# MongoDB logs
docker-compose logs mongodb -f
```

### Step 3: Verify Firebase Console
- Is your project active?
- Is Google sign-in enabled?
- Are authorized domains set correctly?
- Can you login on localhost:3000 (without Docker)?

### Step 4: Debug Frontend Build
```bash
# Manually check if build args are passed
docker-compose build --no-cache frontend

# Check .env.local was created in build
# Look for error messages about VITE_ variables
```

---

## 📚 Reference

### Files Changed
- `docker-compose.yml` - Updated CORS and build args
- `frontend/Dockerfile` - Now creates .env.local from build args
- `.env.docker` - Template file (copy to `.env`)

### Environment Variables
All `VITE_*` variables must be set in `.env` for Gmail login to work!

### What Changed from Original
1. ✅ Frontend Dockerfile now properly handles build arguments
2. ✅ CORS origins include `http://frontend:5173`
3. ✅ Socket URL defaults to `http://3.25.153.25:3001`
4. ✅ All Firebase variables passed to build process
5. ✅ `.env.docker` template provided

---

## 🎉 Success Indicators

- [ ] Docker containers start without errors
- [ ] Frontend accessible at http://localhost:5173
- [ ] "Continue with Google" button visible
- [ ] Clicking button opens Google login
- [ ] Can sign in with Gmail
- [ ] Redirected back to app after login
- [ ] User appears in Firebase Console > Users

---

**Next Steps:** Copy `.env` from `.env.docker`, fill in your credentials, then run `docker-compose up --build`
