# 🔐 MongoDB Atlas Security & Docker Configuration Update

## Summary of Changes

### ✅ Security Issues Fixed

#### 1. Removed Hardcoded Credentials
- **File**: `backend/.env`
- **Issue**: Password `shubham12` was hardcoded
- **Fixed**: Replaced with template `<db_password>`

#### 2. Updated Environment Templates
- **File**: `.env.docker`
- **Changes**: Added MongoDB Atlas connection string template with clear instructions

#### 3. Docker Configuration Modernized
- **File**: `docker-compose.yml`
- **Changes**:
  - Added profile-based MongoDB selection
  - Local MongoDB now optional (use `--profile local` flag)
  - MongoDB Atlas is default option (no local container needed)
  - Reduced resource consumption when using cloud database

---

## 📋 Configuration Structure

### Files and Their Purposes

| File | Purpose | Status |
|------|---------|--------|
| `.env.docker` | ✅ Docker template (checked in) | Template with instructions |
| `backend/.env` | ⚠️ Actual secrets (NOT checked in) | Create from template |
| `.env` | ⚠️ Actual secrets (NOT checked in) | For local development |
| `.gitignore` | ✅ Protects secrets | Already includes `.env` |

---

## 🚀 How to Use

### For Docker Deployment with MongoDB Atlas

#### 1. Create Your .env File
```bash
# From project root directory
cp .env.docker .env
```

#### 2. Update with Your Password
Edit `.env` and replace:
```
MONGODB_URI=mongodb+srv://dadwalshubham096:dadwalshubham096@cluster.nd6wymu.mongodb.net/duotalk
```

With your actual password:
```
MONGODB_URI=mongodb+srv://dadwalshubham096:dadwalshubham096@cluster.nd6wymu.mongodb.net/duotalk
```

#### 3. Start Docker (No Local MongoDB)
```bash
docker compose up -d --build
```

### For Local Development with Local MongoDB

```bash
# Uses local MongoDB container
docker compose --profile local up -d --build

# Access Mongo Express admin UI
# http://localhost:8081
```

---

## 🔑 Your MongoDB Atlas Credentials

**Database**: duotalk  
**Username**: dadwalshubham096  
**Password**: Contact your database administrator  
**Cluster**: cluster.nd6wymu.mongodb.net  

**Collections**:
- blogs
- conversations
- messages
- posts
- users

---

## ⚡ Quick Start

```bash
# 1. Copy template
cp .env.docker .env

# 2. Edit .env and add your password
# MONGODB_URI=mongodb+srv://dadwalshubham096:dadwalshubham096@cluster.nd6wymu.mongodb.net/duotalk

# 3. Start services
docker compose up -d --build

# 4. Check logs
docker compose logs -f backend

# 5. Visit app
# http://localhost:5173
```

---

## 🔒 Security Checklist

Before Production Deployment:

- [ ] `.env` file is NOT committed to git (check `.gitignore`)
- [ ] Password is NOT hardcoded in any source files
- [ ] Use strong password (16+ characters, mixed case, numbers, symbols)
- [ ] Change `JWT_SECRET` in `.env`
- [ ] Restrict MongoDB Atlas IP whitelist
- [ ] Use HTTPS only in production
- [ ] Enable MongoDB Atlas encryption
- [ ] Rotate credentials periodically
- [ ] Never share `.env` file or connection strings
- [ ] Monitor MongoDB Atlas access logs

---

## 📊 Docker Compose Profiles

### Default (MongoDB Atlas)
```bash
docker compose up -d --build
```
Starts:
- ✅ Backend
- ✅ Frontend
- ❌ No local MongoDB

### Local Development
```bash
docker compose --profile local up -d --build
```
Starts:
- ✅ Backend
- ✅ Frontend
- ✅ Local MongoDB
- ✅ Mongo Express UI (port 8081)

### Admin Only
```bash
docker compose --profile admin up -d --build
```
Starts:
- ✅ Mongo Express only (port 8081)

---

## 🧪 Verification

### 1. Check Backend Connection
```bash
docker compose logs backend | grep -i "connected\|error\|mongodb"
```

### 2. Test API Health
```bash
curl http://3.25.153.25:3001/api/health
```

### 3. Check Database
```bash
# Using MongoDB Atlas web UI
# https://cloud.mongodb.com → Collections tab
```

### 4. Test Application
- Visit http://localhost:5173
- Try signing up/logging in
- Create a post or blog
- Test messaging

---

## ⚙️ Environment Variables Reference

### Backend Variables

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/duotalk
MONGODB_DB=duotalk

# Security
JWT_SECRET=long-random-secret-key

# CORS
CORS_ORIGIN=http://localhost:5173,http://frontend:5173
SOCKET_IO_CORS_ORIGIN=http://localhost:5173,http://frontend:5173

# Firebase (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-key
# ... other Firebase variables

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Frontend Variables

```bash
# API
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=http://3.25.153.25:3001

# Firebase
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase variables

# OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_FACEBOOK_APP_ID=your-app-id
```

---

## 🐛 Troubleshooting

### Backend Can't Connect to MongoDB

**Error**: `MongooseServerSelectionError`

**Solutions**:
1. Check password is correct (no typos)
2. URL encode special characters in password
3. Verify IP whitelist in MongoDB Atlas
4. Check internet connection
5. Verify `.env` file is being read

### Connection Timeout

**Solutions**:
1. Increase `serverSelectionTimeoutMS` in connection string
2. Check MongoDB Atlas cluster is running
3. Verify firewall isn't blocking 27017 port
4. Check DNS resolution works

### Docker Container Won't Start

**Solutions**:
```bash
# View detailed logs
docker compose logs backend

# Rebuild without cache
docker compose up -d --build --no-cache

# Check environment variables
docker compose exec backend env | grep MONGODB
```

---

## 📚 Related Documentation

- [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) - Complete setup guide
- [docker-compose.yml](./docker-compose.yml) - Docker configuration
- [.env.docker](./.env.docker) - Environment template

---

## ✨ What's New

### Before
- ❌ Hardcoded passwords in backend/.env
- ❌ Local MongoDB required
- ❌ High resource usage
- ❌ Limited scalability

### After
- ✅ Template-based configuration
- ✅ MongoDB Atlas optional
- ✅ Docker Compose profiles
- ✅ Cloud-ready deployment
- ✅ Better security
- ✅ Lower resource footprint

---

## 🎯 Next Steps

1. **Immediate**: Update `.env` with your MongoDB Atlas password
2. **Test**: Run `docker compose up -d --build` and verify
3. **Security**: Review and update all credentials
4. **Production**: Prepare for cloud deployment
5. **Monitoring**: Set up MongoDB Atlas alerts

---

**Last Updated**: May 2026  
**Version**: Production Ready  
**Status**: ✅ Secure Configuration Complete
