# MongoDB Atlas Setup Guide for DuoTalk

## Overview
This guide helps you configure DuoTalk to use **MongoDB Atlas** (cloud database) instead of a local MongoDB container. This is recommended for production deployments.

---

## Step 1: Get Your MongoDB Atlas Connection String

### 1.1 You Already Have Access
Your MongoDB Atlas account has the **duotalk** database with these collections:
- `blogs`
- `conversations`
- `messages`
- `posts`
- `users`

**Username**: `shubham12`

### 1.2 Get Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in with your account
3. Click **Clusters** → Your cluster → **Connect**
4. Select **Drivers** tab
5. Choose **Node.js** and version **5.9 or later**
6. Copy the connection string

**Example format:**
```
mongodb+srv://shubham12:test12@cluster.nd6wymu.mongodb.net/duotalk?retryWrites=true&w=majority
```

---

## Step 2: Update Your .env File

### 2.1 Copy and Configure
```bash
# Option 1: Use existing .env.docker and modify it
cp .env.docker .env

# Option 2: Or copy and modify from backend
cp backend/.env.example backend/.env
```

### 2.2 Set MongoDB Atlas Connection
Find this line in your `.env`:
```
MONGODB_URI=mongodb+srv://shubham12:test12@cluster.nd6wymu.mongodb.net/duotalk
```

**Replace `<db_password>` with your actual password:**
```
MONGODB_URI=mongodb+srv://shubham12:test12@cluster.nd6wymu.mongodb.net/duotalk
```

### 2.3 Ensure JWT_SECRET is Set
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2.4 Set Firebase Credentials (if using)
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase variables
```

---

## Step 3: Run with MongoDB Atlas

### 3.1 Using Docker Compose (No Local MongoDB)
```bash
# Start without local MongoDB container
# Uses MONGODB_URI from .env file
docker compose up -d --build
```

**This will start:**
- ✅ Backend service (connects to MongoDB Atlas)
- ✅ Frontend service
- ❌ No local MongoDB container

### 3.2 Using Local MongoDB (Development)
If you want to test with local MongoDB instead:
```bash
# Start with local MongoDB
docker compose --profile local up -d --build
```

**This will start:**
- ✅ Backend service
- ✅ Frontend service
- ✅ Local MongoDB container (port 27017)
- ✅ Mongo Express admin UI (port 8081)

---

## Step 4: Verify Connection

### Check Backend Logs
```bash
# View backend service logs
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend
```

**Look for:**
```
✅ Connected to MongoDB Atlas successfully
✅ Socket.IO initialized
✅ Server running on port 3001
```

### Test API Health
```bash
# Should return 200 OK
curl http://54.206.28.179:3001/api/health

# Check database connection
curl http://54.206.28.179:3001/api/debug/db-status
```

### Test Frontend
Visit `http://localhost:5173` and test:
- ✅ User registration/login
- ✅ Creating posts/blogs
- ✅ Messaging feature
- ✅ Real-time updates

---

## Step 5: Security Best Practices

### 5.1 Protect Your Connection String
**DO NOT:**
- ❌ Commit `.env` file to git (already in `.gitignore`)
- ❌ Share connection string in code
- ❌ Hardcode password in files
- ❌ Use simple passwords

**DO:**
- ✅ Use strong passwords (16+ chars)
- ✅ Store in `.env` file (not committed)
- ✅ Use environment variables
- ✅ Rotate passwords periodically
- ✅ Restrict MongoDB Atlas IP access

### 5.2 MongoDB Atlas IP Whitelist
1. Go to **Security** → **Network Access**
2. Add your IP address or use `0.0.0.0/0` (any IP)
3. For production, restrict to specific IPs

### 5.3 Change Default Credentials
Before production deployment:
```bash
# Update these in .env
JWT_SECRET=generate-a-long-random-string
MONGO_EXPRESS_PASSWORD=change-from-admin123
```

---

## Troubleshooting

### Connection Timeout
**Error:** `MongooseServerSelectionError: connection timeout`

**Solution:**
1. Check MongoDB Atlas is running
2. Verify IP whitelist includes your machine
3. Check password is URL encoded (special chars like `@`, `#`, etc.)

### Authentication Failed
**Error:** `authentication failed` or `Authorization failed`

**Solution:**
1. Verify username is correct: `shubham12`
2. Check password doesn't have typos
3. Verify password is URL encoded if it has special characters
4. Reset password in MongoDB Atlas if unsure

### Can't Connect from Docker
**Error:** Backend can't connect from container

**Solution:**
1. Ensure `.env` file is in project root
2. Docker reads env vars from `.env` file
3. Check `MONGODB_URI` is set correctly
4. Verify IP whitelist allows Docker's outbound IP

### Data Not Persisting
**Solution:**
- ✅ Data is stored in MongoDB Atlas cloud, not locally
- ✅ Data persists even after stopping Docker
- ✅ Access data from MongoDB Atlas console anytime

---

## Quick Reference: Commands

### Start with MongoDB Atlas
```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

### Start with Local MongoDB
```bash
# Build and start with local MongoDB
docker compose --profile local up -d --build

# Access Mongo Express admin UI
# http://localhost:8081
# Username: admin
# Password: admin123
```

### Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `MONGODB_DB` | Database name | `duotalk` |
| `JWT_SECRET` | Session token key | Long random string |
| `NODE_ENV` | Environment | `production` or `development` |
| `PORT` | Backend port | `3001` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |

---

## Next Steps

1. ✅ Set up MongoDB Atlas connection
2. ✅ Configure `.env` file
3. ✅ Run with `docker compose up`
4. ✅ Verify connection in logs
5. ✅ Test application at `http://localhost:5173`
6. ✅ Deploy to production when ready

---

## Support

**MongoDB Atlas Documentation:**
- [Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Connection Security](https://docs.mongodb.com/manual/security/security-checklist/)
- [Network Access](https://docs.mongodb.com/atlas/security-ip-access-list/)

**DuoTalk:**
- Check backend logs: `docker compose logs backend`
- Reset database: Delete collections in MongoDB Atlas
- Verify data: Use MongoDB Atlas web UI

---

**Created:** May 2026
**DuoTalk Version:** Production
**Status:** ✅ MongoDB Atlas Ready
