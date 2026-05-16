import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dns from 'dns'
import http from 'http'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server as SocketIOServer } from 'socket.io'
import { initializeSocket } from './socket.js'
import { createMessagesRoutes } from './routes/messages.js'

// Fix DNS resolution for MongoDB Atlas
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4'])

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the backend folder regardless of launch cwd
dotenv.config({ path: path.join(__dirname, '.env') })

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'
const DATABASE_NAME = process.env.MONGODB_DB || 'duotalk'
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175'
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
const COLLECTIONS = {
  users: 'users',
  posts: 'posts',
  conversations: 'conversations',
  messages: 'messages',
  blogs: 'blogs',
}
const SOCKET_EVENTS = {
  join: 'join',
  sendMessage: 'send_message',
  receiveMessage: 'receive_message',
  typing: 'typing',
  seen: 'seen',
}
const allowedOrigins = CORS_ORIGIN
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
const app = express()
const httpServer = http.createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

// MongoDB client
let db = null
const client = MONGODB_URI
  ? new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
    })
  : null

function requireDb(req, res, next) {
  if (!db) return res.status(503).json({ error: 'Database not connected' })
  next()
}

function userRoom(userId = '') {
  return `user:${userId}`
}

function buildCloudinarySignature(params = {}) {
  const payload = Object.keys(params)
    .sort()
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return crypto.createHash('sha1').update(`${payload}${CLOUDINARY_API_SECRET}`).digest('hex')
}

async function ensureIndexes() {
  const uniqueUserFields = ['firebaseUID', 'email', 'username']
  const indexJobs = [
    () => db.collection(COLLECTIONS.posts).createIndex({ firebaseUID: 1, createdAt: -1 }),
    () => db.collection(COLLECTIONS.posts).createIndex({ createdAt: -1 }),
    () => db.collection(COLLECTIONS.conversations).createIndex({ participants: 1, updatedAt: -1 }),
    () => db.collection(COLLECTIONS.messages).createIndex({ conversationId: 1, createdAt: 1 }),
    () => db.collection(COLLECTIONS.blogs).createIndex({ createdAt: -1 }),
  ]

  for (const field of uniqueUserFields) {
    const duplicate = await db.collection(COLLECTIONS.users).aggregate([
      {
        $match: {
          [field]: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      { $limit: 1 },
    ]).toArray()

    if (duplicate.length > 0) {
      console.warn(`Skipping unique index on users.${field} because duplicate records already exist.`)
      continue
    }

    indexJobs.unshift(() =>
      db.collection(COLLECTIONS.users).createIndex({ [field]: 1 }, { unique: true, sparse: true })
    )
  }

  for (const createIndex of indexJobs) {
    try {
      await createIndex()
    } catch (err) {
      const message = String(err?.message || '')
      if (message.includes('E11000 duplicate key error')) {
        console.warn('Skipping one index because duplicate records already exist:', message)
        continue
      }
      throw err
    }
  }
}

// Connect to MongoDB
async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set')
    }
    if (!client) {
      throw new Error('MongoDB client could not be created')
    }
    await client.connect()
    db = client.db(DATABASE_NAME)
    await ensureIndexes()
    console.log('✅ Connected to MongoDB Atlas')
  } catch (err) {
    console.error('⚠️  MongoDB connection error:', err.message)
    console.log('💡 MongoDB Atlas connection failed. Please ensure:')
    console.log('   1. Your IP is whitelisted in MongoDB Atlas Network Access')
    console.log('   2. Your connection string is correct')
    console.log('   3. Your credentials are valid')
    console.log('\n📌 Server will run in memory mode (data not persisted)')
  }
}

// Middleware
// Configure CORS properly for both REST API and Socket.IO
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions))
app.use(express.json({ limit: '100mb' }))

// Security Headers Middleware
app.use((req, res, next) => {
  // X-Content-Type-Options to prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Authentication Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(403).json({ error: 'No token provided' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Home route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to DuoTalk API',
    version: '1.0.0',
    endpoints: {
      hello: '/api/hello',
      data: '/api/data',
      message: '/api/message',
      health: '/api/health'
    }
  })
})

// Routes

// **AUTHENTICATION ROUTES**

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body
    const users = db.collection('users')
    
    // Check if user exists
    const existing = await users.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already registered' })
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const normalizedName = String(name || username || email?.split('@')[0] || 'DuoTalk User').trim()
    const firebaseUID = `local-${new ObjectId().toString()}`
    const normalizedUsername = await createUniqueUsername(users, normalizedName, email, firebaseUID)

    // Create user
    const result = await users.insertOne({
      firebaseUID,
      email,
      password: hashedPassword,
      name: normalizedName,
      username: normalizedUsername,
      interests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const token = jwt.sign({ id: result.insertedId.toString() }, JWT_SECRET, { expiresIn: '24h' })
    
    res.json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertedId,
        uid: firebaseUID,
        firebaseUID,
        email,
        name: normalizedName,
        displayName: normalizedName,
        username: normalizedUsername,
        photoURL: '',
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const users = db.collection('users')
    
    const user = await users.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' })

    const firebaseUID = user.firebaseUID || `local-${user._id.toString()}`
    const normalizedUsername = user.username || await createUniqueUsername(
      users,
      user.name || email?.split('@')[0] || 'DuoTalk User',
      user.email,
      firebaseUID
    )

    if (!user.firebaseUID || !user.username) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            firebaseUID,
            username: normalizedUsername,
            updatedAt: new Date(),
          },
        }
      )
    }
    
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '24h' })
    
    res.json({ 
      token,
      user: {
        id: user._id,
        uid: firebaseUID,
        firebaseUID,
        email: user.email,
        name: user.name,
        displayName: user.name,
        username: normalizedUsername,
        photoURL: user.profileImage || '',
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// **USER ROUTES**

// Get all users (for matching)
app.get('/api/users', async (req, res) => {
  try {
    const users = db.collection('users')
    const allUsers = await users.find({}).project({ password: 0 }).toArray()
    res.json(mergeDuplicateUsers(allUsers).map((user) => publicUser(user, { lightweight: true })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const users = db.collection('users')
    const user = await users.findOne({ 
      _id: new ObjectId(req.params.id) 
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function makeUsername(name = '', email = '') {
  const base = (name || email.split('@')[0] || 'duotalk-user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 22)
  return base || `user${Date.now()}`
}

function publicUser(user, options = {}) {
  if (!user) return null
  const { lightweight = false } = options
  const followersList = user.followersList || []
  const followingList = user.followingList || []
  const incomingRequests = user.incomingRequests || []
  const outgoingRequests = user.outgoingRequests || []
  const profileImage = lightweight ? '' : sanitizeImageValue(user.profileImage)

   if (lightweight) {
    return {
      id: user._id,
      userId: user.firebaseUID,
      firebaseUID: user.firebaseUID,
      name: user.name,
      displayName: user.name,
      email: user.email,
      username: user.username,
      profileImage: '',
      photoURL: '',
      bio: '',
      location: '',
      phone: '',
      website: '',
      coverImage: '',
      followers: followersList.length,
      following: followingList.length,
      followersList: [],
      followingList: [],
      incomingRequests: [],
      outgoingRequests: [],
      requestCount: incomingRequests.length,
      isOnline: !!user.isOnline,
      lastSeen: user.lastSeen || user.updatedAt || user.createdAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  return {
    id: user._id,
    userId: user.firebaseUID,
    firebaseUID: user.firebaseUID,
    name: user.name,
    displayName: user.name,
    email: user.email,
    username: user.username,
    profileImage,
    photoURL: profileImage,
    bio: user.bio || '',
    location: user.location || '',
    phone: user.phone || '',
    website: user.website || '',
    coverImage: user.coverImage || '',
    followers: followersList.length,
    following: followingList.length,
    followersList,
    followingList,
    incomingRequests,
    outgoingRequests,
    requestCount: incomingRequests.length,
    isOnline: !!user.isOnline,
    lastSeen: user.lastSeen || user.updatedAt || user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function uniqueUsersByFirebaseUID(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item?.firebaseUID || seen.has(item.firebaseUID)) return false
    seen.add(item.firebaseUID)
    return true
  })
}

function mergeDuplicateUsers(items = []) {
  const byUid = new Map()

  for (const item of items) {
    if (!item?.firebaseUID) continue
    const existing = byUid.get(item.firebaseUID)
    if (!existing) {
      byUid.set(item.firebaseUID, {
        ...item,
        followersList: [...new Set(item.followersList || [])],
        followingList: [...new Set(item.followingList || [])],
        incomingRequests: [...new Set(item.incomingRequests || [])],
        outgoingRequests: [...new Set(item.outgoingRequests || [])],
      })
      continue
    }

    const merged = {
      ...existing,
      ...item,
      _id: existing._id || item._id,
      name: existing.name || item.name || '',
      email: existing.email || item.email || '',
      username: existing.username || item.username || '',
      profileImage: preferProfileImage(existing.profileImage, item.profileImage),
      bio: existing.bio || item.bio || '',
      location: existing.location || item.location || '',
      phone: existing.phone || item.phone || '',
      website: existing.website || item.website || '',
      coverImage: existing.coverImage || item.coverImage || '',
      isOnline: !!(existing.isOnline || item.isOnline),
      lastSeen: new Date(existing.lastSeen || existing.updatedAt || existing.createdAt || 0) >= new Date(item.lastSeen || item.updatedAt || item.createdAt || 0)
        ? (existing.lastSeen || existing.updatedAt || existing.createdAt)
        : (item.lastSeen || item.updatedAt || item.createdAt),
      createdAt: new Date(existing.createdAt || 0) <= new Date(item.createdAt || 0)
        ? existing.createdAt
        : item.createdAt,
      updatedAt: new Date(existing.updatedAt || existing.createdAt || 0) >= new Date(item.updatedAt || item.createdAt || 0)
        ? existing.updatedAt
        : item.updatedAt,
      followersList: [...new Set([...(existing.followersList || []), ...(item.followersList || [])])],
      followingList: [...new Set([...(existing.followingList || []), ...(item.followingList || [])])],
      incomingRequests: [...new Set([...(existing.incomingRequests || []), ...(item.incomingRequests || [])])],
      outgoingRequests: [...new Set([...(existing.outgoingRequests || []), ...(item.outgoingRequests || [])])],
    }

    byUid.set(item.firebaseUID, merged)
  }

  return [...byUid.values()]
}

function sanitizeImageValue(value = '') {
  const normalized = String(value || '')
  if (normalized.startsWith('data:') && normalized.length > 200000) {
    return ''
  }
  return normalized
}

function preferProfileImage(currentValue = '', incomingValue = '') {
  if (incomingValue && (!currentValue || currentValue.startsWith('data:'))) {
    return incomingValue
  }
  return currentValue || incomingValue || ''
}

async function findLatestUserByFirebaseUID(users, firebaseUID) {
  return users
    .find({ firebaseUID })
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(1)
    .next()
}

async function findMergedUserByFirebaseUID(users, firebaseUID) {
  const matches = await users
    .find({ firebaseUID })
    .project({ password: 0 })
    .toArray()
  return mergeDuplicateUsers(matches)[0] || null
}

async function findMergedUsersByFirebaseUIDs(users, firebaseUIDs = []) {
  const ids = [...new Set(firebaseUIDs.filter(Boolean))]
  if (ids.length === 0) return []
  const matches = await users
    .find({ firebaseUID: { $in: ids } })
    .project({ password: 0 })
    .toArray()
  return mergeDuplicateUsers(matches)
}

async function createUniqueUsername(users, name, email, currentFirebaseUID = null) {
  const base = makeUsername(name, email)
  let username = base
  let suffix = 1

  while (await users.findOne({ username, firebaseUID: { $ne: currentFirebaseUID } })) {
    username = `${base}${suffix}`
    suffix += 1
  }

  return username
}

// Sync Firebase Google user into MongoDB
app.post('/api/profile/sync', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })

    const { firebaseUID, name, email, profileImage } = req.body
    if (!firebaseUID || !email) {
      return res.status(400).json({ error: 'firebaseUID and email are required' })
    }

    const users = db.collection('users')
    const existing = await users.findOne({ $or: [{ firebaseUID }, { email }] })
    const now = new Date()

    if (!existing) {
      const username = await createUniqueUsername(users, name, email, firebaseUID)
      await users.insertOne({
        firebaseUID,
        name: name || email.split('@')[0],
        email,
        username,
        profileImage: profileImage || '',
        bio: '',
        location: '',
        phone: '',
        website: '',
        coverImage: '',
        followersList: [],
        followingList: [],
        incomingRequests: [],
        outgoingRequests: [],
        isOnline: true,
        lastSeen: now,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      const nextName = existing.name || name || email.split('@')[0]
      const nextUsername = existing.username || await createUniqueUsername(users, existing.name || name, email, firebaseUID)
      const nextProfileImage = preferProfileImage(existing.profileImage, profileImage)

      await users.updateOne(
        { _id: existing._id },
        {
          $set: {
            firebaseUID,
            name: nextName,
            email,
            username: nextUsername,
            profileImage: nextProfileImage,
            incomingRequests: existing.incomingRequests || [],
            outgoingRequests: existing.outgoingRequests || [],
            isOnline: existing.isOnline ?? true,
            lastSeen: now,
            updatedAt: now,
          },
        }
      )
    }

    const savedUser = await findMergedUserByFirebaseUID(users, firebaseUID)
    const token = jwt.sign({ id: savedUser._id.toString() }, JWT_SECRET, { expiresIn: '24h' })
    res.json({
      token,
      user: publicUser(savedUser),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const users = db.collection('users')
    const user = await findMergedUserByFirebaseUID(users, req.params.firebaseUID)
    if (!user) return res.status(404).json({ error: 'Profile not found' })
    res.json(publicUser(user))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/profile/:firebaseUID', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const { name, displayName, bio, location, phone, website, profileImage, coverImage } = req.body
    const users = db.collection('users')
    const existing = await findLatestUserByFirebaseUID(users, req.params.firebaseUID)
    if (!existing) return res.status(404).json({ error: 'Profile not found' })

    const updates = {
      name: name ?? displayName ?? existing.name,
      bio: bio ?? existing.bio ?? '',
      location: location ?? existing.location ?? '',
      phone: phone ?? existing.phone ?? '',
      website: website ?? existing.website ?? '',
      profileImage: profileImage ?? existing.profileImage ?? '',
      coverImage: coverImage ?? existing.coverImage ?? '',
      updatedAt: new Date(),
    }

    await users.updateMany({ firebaseUID: req.params.firebaseUID }, { $set: updates })
    const savedUser = await findMergedUserByFirebaseUID(users, req.params.firebaseUID)
    res.json(publicUser(savedUser))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/profile/:firebaseUID/follow', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const followerUID = req.params.firebaseUID
    const { targetFirebaseUID } = req.body
    if (!targetFirebaseUID || targetFirebaseUID === followerUID) {
      return res.status(400).json({ error: 'A different targetFirebaseUID is required' })
    }

    const users = db.collection('users')
    const follower = await findLatestUserByFirebaseUID(users, followerUID)
    const target = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
    if (!follower || !target) return res.status(404).json({ error: 'User not found' })

    if ((follower.followingList || []).includes(targetFirebaseUID)) {
      const updatedFollower = await findLatestUserByFirebaseUID(users, followerUID)
      const updatedTarget = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
      return res.json({ currentUser: publicUser(updatedFollower), targetUser: publicUser(updatedTarget), status: 'following' })
    }

    if ((follower.outgoingRequests || []).includes(targetFirebaseUID)) {
      const updatedFollower = await findLatestUserByFirebaseUID(users, followerUID)
      const updatedTarget = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
      return res.json({ currentUser: publicUser(updatedFollower), targetUser: publicUser(updatedTarget), status: 'requested' })
    }

    await users.updateMany(
      { firebaseUID: followerUID },
      { $addToSet: { outgoingRequests: targetFirebaseUID }, $set: { updatedAt: new Date() } }
    )
    await users.updateMany(
      { firebaseUID: targetFirebaseUID },
      { $addToSet: { incomingRequests: followerUID }, $set: { updatedAt: new Date() } }
    )

    const updatedFollower = await findLatestUserByFirebaseUID(users, followerUID)
    const updatedTarget = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
    res.json({ currentUser: publicUser(updatedFollower), targetUser: publicUser(updatedTarget), status: 'requested' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/profile/:firebaseUID/follow/:targetFirebaseUID', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const { firebaseUID, targetFirebaseUID } = req.params
    const users = db.collection('users')
    const current = await findLatestUserByFirebaseUID(users, firebaseUID)
    const target = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
    if (!current || !target) return res.status(404).json({ error: 'User not found' })

    if ((current.followingList || []).includes(targetFirebaseUID)) {
      await users.updateMany({ firebaseUID }, { $pull: { followingList: targetFirebaseUID }, $set: { updatedAt: new Date() } })
      await users.updateMany({ firebaseUID: targetFirebaseUID }, { $pull: { followersList: firebaseUID }, $set: { updatedAt: new Date() } })
    } else {
      await users.updateMany({ firebaseUID }, { $pull: { outgoingRequests: targetFirebaseUID }, $set: { updatedAt: new Date() } })
      await users.updateMany({ firebaseUID: targetFirebaseUID }, { $pull: { incomingRequests: firebaseUID }, $set: { updatedAt: new Date() } })
    }

    const updatedFollower = await findLatestUserByFirebaseUID(users, firebaseUID)
    const updatedTarget = await findLatestUserByFirebaseUID(users, targetFirebaseUID)
    res.json({ currentUser: publicUser(updatedFollower), targetUser: publicUser(updatedTarget), following: false })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID/posts', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const posts = await db.collection('posts')
      .find({
        $or: [
          { firebaseUID: req.params.firebaseUID },
          { authorId: req.params.firebaseUID },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID/contacts', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const users = db.collection('users')
    const current = await findMergedUserByFirebaseUID(users, req.params.firebaseUID)
    if (!current) return res.status(404).json({ error: 'Profile not found' })

    const relatedConversationIds = await db.collection(COLLECTIONS.conversations)
      .find({ participants: req.params.firebaseUID })
      .project({ participants: 1 })
      .toArray()

    const normalizedConversationRows = (await Promise.all(
      relatedConversationIds.map((conversation) => sanitizeConversationDocument(conversation))
    )).filter(Boolean)

    const contactIds = [...new Set([
      ...(current.followersList || []),
      ...(current.followingList || []),
      ...normalizedConversationRows.flatMap((conversation) =>
        normalizeParticipants(conversation.participants).filter((id) => id !== req.params.firebaseUID)
      ),
    ].filter((id) => id && id !== req.params.firebaseUID))]

    const contacts = await findMergedUsersByFirebaseUIDs(users, contactIds)
    res.json(contacts.map((user) => publicUser(user, { lightweight: true })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/presence/:firebaseUID', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const { online } = req.body
    const users = db.collection('users')
    await users.updateOne(
      { firebaseUID: req.params.firebaseUID },
      {
        $set: {
          isOnline: !!online,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      }
    )
    const savedUser = await findMergedUserByFirebaseUID(users, req.params.firebaseUID)
    if (!savedUser) return res.status(404).json({ error: 'Profile not found' })
    res.json(publicUser(savedUser))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/uploads/sign', (req, res) => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: 'Cloudinary is not configured on the backend' })
    }

    const folder = req.body?.folder || 'duotalk/chat'
    const resourceType = req.body?.resourceType === 'video' ? 'video' : 'image'
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = buildCloudinarySignature({ folder, timestamp })

    res.json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/posts', requireDb, async (req, res) => {
  try {
    const posts = await db.collection(COLLECTIONS.posts)
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/posts', requireDb, async (req, res) => {
  try {
    const { firebaseUID, content, image, author, authorPhoto } = req.body
    if (!firebaseUID) {
      return res.status(400).json({ error: 'firebaseUID is required' })
    }
    if (!content?.trim() && !image) {
      return res.status(400).json({ error: 'content or image is required' })
    }

    const users = db.collection(COLLECTIONS.users)
    const user = await users.findOne({ firebaseUID })
    const now = new Date()
    const post = {
      firebaseUID,
      authorId: firebaseUID,
      author: user?.name || author || 'Anonymous',
      authorPhoto: user?.profileImage || authorPhoto || '',
      content: content?.trim() || '',
      image: image || null,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection(COLLECTIONS.posts).insertOne(post)
    res.status(201).json({ ...post, _id: result.insertedId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/posts/:id', requireDb, async (req, res) => {
  try {
    const { firebaseUID } = req.body || {}
    if (!firebaseUID) {
      return res.status(400).json({ error: 'firebaseUID is required' })
    }
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const posts = db.collection(COLLECTIONS.posts)
    const post = await posts.findOne({ _id: new ObjectId(req.params.id) })
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    if (post.firebaseUID !== firebaseUID && post.authorId !== firebaseUID) {
      return res.status(403).json({ error: 'You can only delete your own posts' })
    }

    await posts.deleteOne({ _id: post._id })
    res.json({ success: true, deletedPostId: req.params.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/posts/:id/like', requireDb, async (req, res) => {
  try {
    const { firebaseUID } = req.body
    if (!firebaseUID) return res.status(400).json({ error: 'firebaseUID is required' })

    const posts = db.collection(COLLECTIONS.posts)
    const post = await posts.findOne({ _id: new ObjectId(req.params.id) })
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const hasLiked = (post.likedBy || []).includes(firebaseUID)
    await posts.updateOne(
      { _id: post._id },
      hasLiked
        ? { $pull: { likedBy: firebaseUID }, $inc: { likes: -1 }, $set: { updatedAt: new Date() } }
        : { $addToSet: { likedBy: firebaseUID }, $inc: { likes: 1 }, $set: { updatedAt: new Date() } }
    )

    const updated = await posts.findOne({ _id: post._id })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID/follow-suggestions', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const usersCollection = db.collection('users')
    const current = await findMergedUserByFirebaseUID(usersCollection, req.params.firebaseUID)
    if (!current) return res.status(404).json({ error: 'Profile not found' })

    const excluded = [
      req.params.firebaseUID,
      ...(current.followingList || []),
      ...(current.outgoingRequests || []),
      ...(current.incomingRequests || []),
    ]
    const users = await usersCollection
      .find({ firebaseUID: { $exists: true, $nin: excluded } })
      .project({ password: 0 })
      .toArray()

    res.json(mergeDuplicateUsers(users).slice(0, 6).map((user) => publicUser(user, { lightweight: true })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID/requests', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const users = db.collection('users')
    const current = await findMergedUserByFirebaseUID(users, req.params.firebaseUID)
    if (!current) return res.status(404).json({ error: 'Profile not found' })

    const incomingIds = current.incomingRequests || []
    const outgoingIds = current.outgoingRequests || []

    const [incomingUsers, outgoingUsers] = await Promise.all([
      findMergedUsersByFirebaseUIDs(users, incomingIds),
      findMergedUsersByFirebaseUIDs(users, outgoingIds),
    ])

    res.json({
      incoming: incomingUsers.map((user) => publicUser(user, { lightweight: true })),
      outgoing: outgoingUsers.map((user) => publicUser(user, { lightweight: true })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/profile/:firebaseUID/requests/:requesterFirebaseUID/accept', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })
    const { firebaseUID, requesterFirebaseUID } = req.params
    const users = db.collection('users')
    const current = await findMergedUserByFirebaseUID(users, firebaseUID)
    const requester = await findMergedUserByFirebaseUID(users, requesterFirebaseUID)
    if (!current || !requester) return res.status(404).json({ error: 'User not found' })

    await users.updateMany(
      { firebaseUID },
      {
        $pull: { incomingRequests: requesterFirebaseUID },
        $addToSet: { followersList: requesterFirebaseUID },
        $set: { updatedAt: new Date() },
      }
    )
    await users.updateMany(
      { firebaseUID: requesterFirebaseUID },
      {
        $pull: { outgoingRequests: firebaseUID },
        $addToSet: { followingList: firebaseUID },
        $set: { updatedAt: new Date() },
      }
    )

    const updatedCurrent = await findMergedUserByFirebaseUID(users, firebaseUID)
    const updatedRequester = await findMergedUserByFirebaseUID(users, requesterFirebaseUID)
    res.json({
      currentUser: publicUser(updatedCurrent, { lightweight: true }),
      requester: publicUser(updatedRequester, { lightweight: true }),
      accepted: true,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile/:firebaseUID/search-users', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not connected' })

    const usersCollection = db.collection('users')
    const current = await findMergedUserByFirebaseUID(usersCollection, req.params.firebaseUID)
    if (!current) return res.status(404).json({ error: 'Profile not found' })

    const query = String(req.query.q || '').trim()
    if (!query) return res.json([])

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const excluded = [req.params.firebaseUID]
    const users = await usersCollection
      .find({
        firebaseUID: { $exists: true, $nin: excluded },
        $or: [
          { name: { $regex: escapedQuery, $options: 'i' } },
          { username: { $regex: escapedQuery, $options: 'i' } },
          { email: { $regex: escapedQuery, $options: 'i' } },
        ],
      })
      .project({ password: 0 })
      .toArray()

    res.json(mergeDuplicateUsers(users).slice(0, 12).map((user) => publicUser(user, { lightweight: true })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update user interests
app.post('/api/users/:id/interests', verifyToken, async (req, res) => {
  try {
    const { interests } = req.body
    const users = db.collection('users')
    
    await users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { interests } }
    )
    
    res.json({ message: 'Interests updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// **MESSAGING ROUTES**

function conversationKey(participants) {
  return [...participants].sort().join(':')
}

function normalizeParticipants(participants = []) {
  return [...new Set(
    participants
      .map((participant) => String(participant || '').trim())
      .filter(Boolean)
  )]
}

async function sanitizeConversationDocument(conversation) {
  if (!conversation?._id) return null

  const participants = normalizeParticipants(conversation.participants)
  if (participants.length < 2) {
    await db.collection(COLLECTIONS.messages).deleteMany({
      conversationId: conversation._id.toString(),
    })
    await db.collection(COLLECTIONS.conversations).deleteOne({ _id: conversation._id })
    return null
  }

  const key = conversationKey(participants)
  const participantsChanged = JSON.stringify(participants) !== JSON.stringify(conversation.participants || [])
  const keyChanged = key !== conversation.key

  if (participantsChanged || keyChanged) {
    await db.collection(COLLECTIONS.conversations).updateOne(
      { _id: conversation._id },
      {
        $set: {
          participants,
          key,
          updatedAt: new Date(),
        },
      }
    )
  }

  return {
    ...conversation,
    participants,
    key,
  }
}

async function findConversationById(conversationId) {
  if (!ObjectId.isValid(conversationId)) return null
  return db.collection(COLLECTIONS.conversations).findOne({ _id: new ObjectId(conversationId) })
}

async function ensureConversation(currentFirebaseUID, targetFirebaseUID) {
  const participants = normalizeParticipants([currentFirebaseUID, targetFirebaseUID])
  if (participants.length !== 2) {
    throw new Error('Two different Firebase user IDs are required')
  }
  const key = conversationKey(participants)
  const conversations = db.collection(COLLECTIONS.conversations)
  const now = new Date()

  await conversations.updateOne(
    { key },
    {
      $setOnInsert: {
        key,
        participants,
        lastMessage: '',
        recentMessages: [],
        unreadBy: [],
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true }
  )

  return conversations.findOne({ key })
}

async function emitSeenUpdate({ conversationId, readerFirebaseUID }) {
  const conversations = db.collection(COLLECTIONS.conversations)
  const conversation = await findConversationById(conversationId)
  if (!conversation || !conversation.participants.includes(readerFirebaseUID)) {
    return null
  }

  const unreadBy = (conversation.unreadBy || []).filter((id) => id !== readerFirebaseUID)
  const recentMessages = Array.isArray(conversation.recentMessages)
    ? conversation.recentMessages.map((message) => (
        message.senderFirebaseUID !== readerFirebaseUID && !(message.readBy || []).includes(readerFirebaseUID)
          ? {
              ...message,
              readBy: Array.from(new Set([...(message.readBy || []), readerFirebaseUID])),
            }
          : message
      ))
    : []
  await conversations.updateOne(
    { _id: conversation._id },
    { $set: { unreadBy, recentMessages, updatedAt: new Date() } }
  )

  const seenMessageIds = recentMessages
    .filter((message) => message.senderFirebaseUID !== readerFirebaseUID && (message.readBy || []).includes(readerFirebaseUID))
    .map((message) => String(message._id))

  const payload = {
    conversationId,
    readerFirebaseUID,
    messageIds: seenMessageIds,
    readAt: new Date().toISOString(),
  }

  conversation.participants.forEach((participantId) => {
    io.to(userRoom(participantId)).emit(SOCKET_EVENTS.seen, payload)
  })

  return payload
}

async function saveChatMessage({ conversationId, senderFirebaseUID, receiverFirebaseUID, text, media, mediaType, fileName }) {
  if (!senderFirebaseUID || (!String(text || '').trim() && !media)) {
    throw new Error('senderFirebaseUID and text or media are required')
  }

  let conversation = null
  if (conversationId) {
    conversation = await findConversationById(conversationId)
  }
  if (!conversation) {
    if (!senderFirebaseUID || !receiverFirebaseUID || senderFirebaseUID === receiverFirebaseUID) {
      throw new Error('A valid receiverFirebaseUID is required')
    }
    conversation = await ensureConversation(senderFirebaseUID, receiverFirebaseUID)
  }
  if (!conversation) {
    throw new Error('Conversation not found')
  }
  const participants = normalizeParticipants(conversation.participants)
  if (!participants.includes(senderFirebaseUID)) {
    throw new Error('Sender is not part of this conversation')
  }
  if (participants.length !== 2) {
    throw new Error('Conversation participants are invalid')
  }

  const now = new Date()
  const trimmedText = String(text || '').trim()
  const message = {
    _id: new ObjectId(),
    conversationId: conversation._id.toString(),
    senderFirebaseUID,
    text: trimmedText,
    media: media || '',
    mediaType: mediaType || '',
    fileName: fileName || '',
    readBy: [senderFirebaseUID],
    deletedForEveryone: false,
    createdAt: now,
  }
  const unreadBy = participants.filter((participantId) => participantId !== senderFirebaseUID)
  const savedMessage = { ...message }
  const recentMessages = [...(Array.isArray(conversation.recentMessages) ? conversation.recentMessages : []), savedMessage].slice(-200)

  await db.collection(COLLECTIONS.conversations).updateOne(
    { _id: conversation._id },
    {
      $set: {
        participants,
        lastMessage: trimmedText || (message.mediaType?.startsWith('video/') ? 'Video' : 'Image'),
        lastMessageTime: now,
        recentMessages,
        unreadBy,
        updatedAt: now,
      },
    }
  )

  // NOTE: Message emission is now handled by socket.js (initializeSocket)
  // saveChatMessage should only save to DB and return, not emit events
  // This prevents double emission and ensures consistent message format

  return {
    conversationId: conversation._id.toString(),
    conversationKey: conversation.key,
    participants,
    otherUser: {
      firebaseUID: participants.find((id) => id !== senderFirebaseUID) || receiverFirebaseUID,
    },
    sender: {
      firebaseUID: senderFirebaseUID,
    },
    message: savedMessage,
  }
}

app.get('/api/conversations/:firebaseUID', requireDb, async (req, res) => {
  try {
    const conversations = await db.collection(COLLECTIONS.conversations)
      .find({ participants: req.params.firebaseUID })
      .sort({ updatedAt: -1 })
      .toArray()

    const normalizedConversations = (await Promise.all(
      conversations.map((conversation) => sanitizeConversationDocument(conversation))
    ))
      .filter(Boolean)
      .filter((conversation) => conversation.participants.includes(req.params.firebaseUID))

    const userIds = [...new Set(normalizedConversations.flatMap((conversation) =>
      conversation.participants.filter((id) => id !== req.params.firebaseUID)
    ))]
    const users = await db.collection(COLLECTIONS.users)
      .find({ firebaseUID: { $in: userIds } })
      .toArray()
    const usersByUid = new Map(users.map((user) => [user.firebaseUID, publicUser(user, { lightweight: true })]))

    res.json(normalizedConversations.map((conversation) => {
      const otherUserId = conversation.participants.find((id) => id !== req.params.firebaseUID)
      if (!otherUserId) {
        return null
      }
      return {
        ...conversation,
        otherUser: usersByUid.get(otherUserId) || {
          firebaseUID: otherUserId,
          displayName: 'DuoTalk User',
          name: 'DuoTalk User',
          photoURL: '',
        },
        recentMessages: Array.isArray(conversation.recentMessages) ? conversation.recentMessages : [],
      }
    }).filter(Boolean))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/conversations', requireDb, async (req, res) => {
  try {
    const { currentFirebaseUID, targetFirebaseUID } = req.body
    if (!currentFirebaseUID || !targetFirebaseUID || currentFirebaseUID === targetFirebaseUID) {
      return res.status(400).json({ error: 'Two different Firebase user IDs are required' })
    }

    const users = db.collection(COLLECTIONS.users)
    const currentUser = await users.findOne({ firebaseUID: currentFirebaseUID })
    const targetUser = await users.findOne({ firebaseUID: targetFirebaseUID })
    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const conversation = await ensureConversation(currentFirebaseUID, targetFirebaseUID)
    res.status(201).json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversations/:conversationId/messages', requireDb, async (req, res) => {
  try {
    const conversation = await findConversationById(req.params.conversationId)
    if (conversation && Array.isArray(conversation.recentMessages) && conversation.recentMessages.length > 0) {
      return res.json(
        [...conversation.recentMessages]
          .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
          .slice(-200)
      )
    }

    const projection = {
      conversationId: 1,
      senderFirebaseUID: 1,
      text: 1,
      media: 1,
      mediaType: 1,
      fileName: 1,
      readBy: 1,
      deletedForEveryone: 1,
      deletedAt: 1,
      createdAt: 1,
    }

    let messages = []
    try {
      messages = await db.collection(COLLECTIONS.messages)
        .find({ conversationId: req.params.conversationId })
        .hint({ conversationId: 1, createdAt: 1 })
        .project(projection)
        .sort({ createdAt: 1 })
        .limit(200)
        .maxTimeMS(3000)
        .toArray()
    } catch {
      // Fall back to a simpler query if the compound index is unavailable or slow.
      messages = await db.collection(COLLECTIONS.messages)
        .find({ conversationId: req.params.conversationId })
        .project(projection)
        .limit(200)
        .maxTimeMS(3000)
        .toArray()

      messages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    }

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/conversations/:conversationId/read', requireDb, async (req, res) => {
  try {
    const { readerFirebaseUID } = req.body
    if (!readerFirebaseUID) {
      return res.status(400).json({ error: 'readerFirebaseUID is required' })
    }
    const payload = await emitSeenUpdate({
      conversationId: req.params.conversationId,
      readerFirebaseUID,
    })
    if (!payload) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    res.json(payload)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/conversations/:conversationId/messages', requireDb, async (req, res) => {
  try {
    const payload = await saveChatMessage({
      conversationId: req.params.conversationId,
      senderFirebaseUID: req.body?.senderFirebaseUID,
      receiverFirebaseUID: req.body?.receiverFirebaseUID,
      text: req.body?.text,
      media: req.body?.media,
      mediaType: req.body?.mediaType,
      fileName: req.body?.fileName,
    })
    
    // Emit socket message to receiver if they're online
    try {
      const receiverUID = req.body?.receiverFirebaseUID;
      if (receiverUID && io) {
        const receiverRoom = `user:${receiverUID}`;
        const messageData = {
          _id: payload.message?._id || payload._id,
          conversationId: payload.conversationId || req.params.conversationId,
          senderFirebaseUID: req.body?.senderFirebaseUID,
          receiverFirebaseUID: receiverUID,
          text: req.body?.text,
          media: req.body?.media,
          mediaType: req.body?.mediaType,
          fileName: req.body?.fileName,
          createdAt: payload.message?.createdAt || new Date(),
        };
        console.log(`📤 Emitting message to ${receiverRoom}:`, messageData.text);
        io.to(receiverRoom).emit('receive_message', messageData);
      }
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr.message);
    }
    
    res.status(201).json(payload)
  } catch (err) {
    const status = /required|valid/i.test(err.message)
      ? 400
      : /not found/i.test(err.message)
        ? 404
        : /not part/i.test(err.message)
          ? 403
          : 500
    res.status(status).json({ error: err.message })
  }
})

app.delete('/api/conversations/:conversationId/messages/:messageId', requireDb, async (req, res) => {
  try {
    const { senderFirebaseUID } = req.body
    if (!senderFirebaseUID) {
      return res.status(400).json({ error: 'senderFirebaseUID is required' })
    }

    const conversation = await findConversationById(req.params.conversationId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const message = (conversation.recentMessages || []).find((item) => String(item._id) === String(req.params.messageId))
    if (!message) return res.status(404).json({ error: 'Message not found' })
    if (message.senderFirebaseUID !== senderFirebaseUID) {
      return res.status(403).json({ error: 'You can only delete your own messages' })
    }

    const deletedAt = new Date()
    const updatedMessage = {
      ...message,
      text: '',
      media: '',
      mediaType: '',
      fileName: '',
      deletedForEveryone: true,
      deletedAt,
    }
    const recentMessages = Array.isArray(conversation.recentMessages)
      ? conversation.recentMessages.map((item) => (String(item._id) === String(message._id) ? updatedMessage : item))
      : []
    await db.collection(COLLECTIONS.conversations).updateOne(
      { _id: conversation._id },
      { $set: { recentMessages, updatedAt: new Date() } }
    )
    res.json(updatedMessage)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send message
app.post('/api/messages/send', verifyToken, async (req, res) => {
  try {
    const { recipientId, text } = req.body
    const messages = db.collection('messages')
    
    const result = await messages.insertOne({
      senderId: new ObjectId(req.userId),
      recipientId: new ObjectId(recipientId),
      text,
      timestamp: new Date(),
      read: false
    })
    
    res.json({ 
      message: 'Message sent',
      messageId: result.insertedId
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get conversation
app.get('/api/messages/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const messages = db.collection('messages')
    const userId1 = new ObjectId(req.userId)
    const userId2 = new ObjectId(req.params.userId)
    
    const conversation = await messages.find({
      $or: [
        { senderId: userId1, recipientId: userId2 },
        { senderId: userId2, recipientId: userId1 }
      ]
    }).sort({ timestamp: 1 }).toArray()
    
    res.json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// **BLOGS ROUTES**

function buildBlogAuthor(author = {}, blog = {}) {
  const displayName =
    author?.displayName ||
    author?.name ||
    blog?.author?.displayName ||
    blog?.authorName ||
    author?.username ||
    'DuoTalk User'

  const username =
    author?.username ||
    blog?.author?.username ||
    (displayName ? displayName.toLowerCase().replace(/\s+/g, '') : 'duotalkuser')

  const photoURL =
    author?.photoURL ||
    author?.profileImage ||
    blog?.author?.photoURL ||
    'https://via.placeholder.com/40'

  return {
    displayName,
    username,
    photoURL,
  }
}

// Get all blogs with user information
app.get('/api/blogs', requireDb, async (req, res) => {
  try {
    const blogs = db.collection('blogs')
    const users = db.collection('users')
    const allBlogs = await blogs.find({}).sort({ createdAt: -1 }).toArray()
    
    // Fetch user information for each blog
    const blogsWithUserInfo = await Promise.all(
      allBlogs.map(async (blog) => {
        const author = await users.findOne({ firebaseUID: blog.authorFirebaseUID })
        return {
          ...blog,
          author: buildBlogAuthor(author, blog),
        }
      })
    )
    
    res.json(blogsWithUserInfo)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get user's blogs
app.get('/api/blogs/user/:firebaseUID', requireDb, async (req, res) => {
  try {
    const blogs = db.collection('blogs')
    const users = db.collection('users')
    const userBlogs = await blogs.find({ authorFirebaseUID: req.params.firebaseUID }).sort({ createdAt: -1 }).toArray()
    
    const blogsWithUserInfo = await Promise.all(
      userBlogs.map(async (blog) => {
        const author = await users.findOne({ firebaseUID: blog.authorFirebaseUID })
        return {
          ...blog,
          author: buildBlogAuthor(author, blog),
        }
      })
    )
    
    res.json(blogsWithUserInfo)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create blog
app.post('/api/blogs', requireDb, async (req, res) => {
  try {
    const { title, content, tags, authorFirebaseUID } = req.body
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }
    
    if (!authorFirebaseUID) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    const blogs = db.collection('blogs')
    const users = db.collection('users')
    
    // Get the user by firebaseUID
    const user = await users.findOne({ firebaseUID: authorFirebaseUID })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const result = await blogs.insertOne({
      title,
      content,
      tags: tags || [],
      authorId: user._id,
      authorFirebaseUID: user.firebaseUID,
      authorName: user.displayName || user.name || user.username || 'DuoTalk User',
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: [],
      likeCount: 0,
      comments: [],
      views: 0
    })
    
    res.json({ 
      message: 'Blog created successfully',
      blogId: result.insertedId,
      blog: {
        _id: result.insertedId,
        title,
        content,
        tags,
        authorFirebaseUID: user.firebaseUID,
        createdAt: new Date(),
        updatedAt: new Date(),
        likeCount: 0,
        author: buildBlogAuthor(user),
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete blog
app.delete('/api/blogs/:id', requireDb, async (req, res) => {
  try {
    const { userFirebaseUID } = req.body

    if (!userFirebaseUID) {
      return res.status(401).json({ error: 'User authentication required' })
    }

    const blogs = db.collection('blogs')
    const blog = await blogs.findOne({ _id: new ObjectId(req.params.id) })

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    if (blog.authorFirebaseUID !== userFirebaseUID) {
      return res.status(403).json({ error: 'You can only delete your own blogs' })
    }

    await blogs.deleteOne({ _id: blog._id })

    res.json({ message: 'Blog deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Like blog
app.post('/api/blogs/:id/like', requireDb, async (req, res) => {
  try {
    const { userFirebaseUID } = req.body
    
    if (!userFirebaseUID) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    const blogs = db.collection('blogs')
    const users = db.collection('users')
    
    // Verify user exists
    const user = await users.findOne({ firebaseUID: userFirebaseUID })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const blog = await blogs.findOne({ _id: new ObjectId(req.params.id) })
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    
    const likes = blog.likes || []
    const userLiked = likes.includes(userFirebaseUID)
    
    if (userLiked) {
      await blogs.updateOne(
        { _id: new ObjectId(req.params.id) },
        { 
          $pull: { likes: userFirebaseUID },
          $set: { likeCount: Math.max(0, (blog.likeCount || 0) - 1) }
        }
      )
      res.json({ message: 'Blog unliked', liked: false })
    } else {
      await blogs.updateOne(
        { _id: new ObjectId(req.params.id) },
        { 
          $push: { likes: userFirebaseUID },
          $set: { likeCount: (blog.likeCount || 0) + 1 }
        }
      )
      res.json({ message: 'Blog liked', liked: true })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    database: db ? 'Connected' : 'Disconnected'
  })
})

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' })
    }
    
    const collections = await db.listCollections().toArray()
    res.json({ 
      message: 'Database connected',
      database: DATABASE_NAME,
      sections: COLLECTIONS,
      collections: collections.map(c => c.name)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mount messages routes
function mountMessagesRoutes() {
  if (!db) {
    console.warn('⚠️  Database not connected. Skipping messages routes.')
    return
  }
  const messagesRouter = createMessagesRoutes(db)
  app.use('/api/messages', messagesRouter)
  console.log('✅ Messages API routes mounted')
}

// Initialize optimized real-time messaging handlers after DB connection
function initializeRealtimeMessaging() {
  if (!db) {
    console.warn('⚠️  Database not connected. Skipping socket initialization.')
    return
  }
  const socketConfig = initializeSocket(io, db, saveChatMessage, emitSeenUpdate)
  console.log('✅ Real-time messaging system initialized')
  return socketConfig
}

let server = null

function startServer() {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      httpServer.off('listening', onListening)
      reject(error)
    }

    const onListening = () => {
      httpServer.off('error', onError)
      resolve(httpServer)
    }

    httpServer.once('error', onError)
    httpServer.once('listening', onListening)
    httpServer.listen(PORT, '0.0.0.0')
  })
}

async function boot() {
  try {
    server = await startServer()
    console.log(`Server running on http://0.0.0.0:${PORT}`)
    await connectDB()
    
    // Mount API routes
    mountMessagesRoutes()
    
    // Initialize real-time messaging system after DB connection
    initializeRealtimeMessaging()
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the old backend process before starting a new one.`)
      process.exit(1)
    }

    console.error('Server error:', error)
    process.exit(1)
  }
}

boot()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  if (client) {
    await client.close()
  }
  if (!server) {
    process.exit(0)
    return
  }
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
