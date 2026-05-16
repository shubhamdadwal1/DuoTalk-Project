# 🚀 Docker Quick Commands

## ⚡ Basic Commands

### Build and Run Everything
```bash
docker-compose up --build
```

### Stop All Services
```bash
docker-compose down
```

### Clean Everything (fresh start)
```bash
docker-compose down -v  # -v removes volumes/data
docker-compose up --build
```

---

## 📊 View Logs

### All services
```bash
docker-compose logs -f
```

### Specific service
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongodb
```

### Last 50 lines
```bash
docker-compose logs --tail=50 frontend
```

---

## 🔍 Debugging

### Check if containers are running
```bash
docker-compose ps
```

### Check container details
```bash
docker-compose inspect backend
```

### Execute command in running container
```bash
docker-compose exec backend npm ls
docker-compose exec frontend ls -la /app
```

### View environment variables in container
```bash
docker-compose exec backend printenv | grep VITE
docker-compose exec backend printenv | grep FIREBASE
```

---

## 🗄️ Database Management

### Access MongoDB from CLI
```bash
docker-compose exec mongodb mongosh duotalk
```

### Common MongoDB commands
```javascript
// In mongosh prompt:
db.users.find()          // View all users
db.blogs.find()          // View all blogs
db.messages.find()       // View all messages
db.users.countDocuments() // Count users
db.dropDatabase()        // DELETE ALL DATA (be careful!)
```

### Admin UI (optional)
```bash
# Run with admin profile
docker-compose --profile admin up

# Access at http://localhost:8081
# Username: admin
# Password: admin123
```

---

## 🔧 Troubleshooting Commands

### Rebuild specific service
```bash
docker-compose build --no-cache frontend
docker-compose up frontend
```

### Force recreate containers
```bash
docker-compose up --force-recreate
```

### Remove unused images/volumes
```bash
docker system prune -a --volumes
```

### Test API endpoint
```bash
curl http://3.25.153.25:3001/api/health
```

### Test backend from frontend container
```bash
docker-compose exec frontend curl http://backend:3001/api/health
```

---

## 📋 Setup Checklist

- [ ] `docker` installed (`docker --version`)
- [ ] `docker-compose` installed (`docker-compose --version`)
- [ ] `.env` file created from `.env.docker`
- [ ] All `VITE_*` variables filled in `.env`
- [ ] `VITE_GOOGLE_CLIENT_ID` set to your OAuth Client ID
- [ ] Firebase authorized domains includes `localhost`
- [ ] Run `docker-compose up --build`
- [ ] Frontend accessible at http://localhost:5173
- [ ] Gmail login button works

---

## 🚨 Common Issues

### Issue: "Cannot find module"
```bash
# Solution: Clean build
docker-compose down -v
docker-compose up --build
```

### Issue: "Port already in use"
```bash
# Solution: Stop other services using port 5173/3001
# Or change ports in docker-compose.yml
```

### Issue: "Firebase configuration incomplete"
```bash
# Solution: Check .env file has all VITE_ variables
docker-compose config | grep VITE_FIREBASE
```

### Issue: "CORS blocked"
```bash
# Solution: Already fixed! Make sure docker-compose is up-to-date
# with http://frontend:5173 in CORS_ORIGIN
```

---

## 📞 Support
See `DOCKER_GMAIL_SETUP.md` for comprehensive setup guide
