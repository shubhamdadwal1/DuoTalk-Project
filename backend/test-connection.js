import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

async function testConnection() {
  const uri = process.env.MONGODB_URI
  console.log('Testing MongoDB connection...')
  console.log(`URI: ${uri.substring(0, 50)}...`)
  
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  })
  
  try {
    console.log('⏳ Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Successfully connected to MongoDB!')
    
    // Test the connection
    const db = client.db('duotalk')
    const adminDb = db.admin()
    const status = await adminDb.ping()
    console.log('✅ Ping successful:', status)
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log('📚 Collections in database:', collections.map(c => c.name))
    
    await client.close()
    console.log('✅ Connection test passed!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    console.error('Full error:', err)
    process.exit(1)
  }
}

testConnection()
