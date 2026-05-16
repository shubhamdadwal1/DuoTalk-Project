import { MongoClient } from 'mongodb'
import dns from 'dns'
import dotenv from 'dotenv'

dotenv.config()

// Set DNS servers to Cloudflare and Google
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4'])

async function testConnection() {
  const uri = process.env.MONGODB_URI
  console.log('Testing MongoDB connection with custom DNS...')
  console.log(`Configured DNS: Cloudflare (1.1.1.1), Google (8.8.8.8)`)
  
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  })
  
  try {
    console.log('⏳ Connecting to MongoDB Atlas...')
    await client.connect()
    console.log('✅ Successfully connected to MongoDB!')
    
    const db = client.db('duotalk')
    const adminDb = db.admin()
    const status = await adminDb.ping()
    console.log('✅ Ping successful:', status)
    
    const collections = await db.listCollections().toArray()
    console.log('📚 Collections:', collections.map(c => c.name).join(', ') || 'None yet')
    
    await client.close()
    console.log('✅ Connection test PASSED! MongoDB is ready.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Connection failed')
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testConnection()
