import mongoose from 'mongoose'

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Extend the global type to include our mongoose cache
declare global {
  var mongoose: MongooseCache | undefined
}

// Initialize the cache
const cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

/**
 * Establishes a connection to MongoDB using Mongoose
 *
 * This function implements connection caching to prevent multiple
 * simultaneous connections in serverless environments and during
 * development hot reloads.
 *
 * @returns {Promise<typeof mongoose>} The Mongoose instance
 */
async function connectDB(): Promise<typeof mongoose> {
  // Validate environment variable at connection time
  if (!process.env.MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    )
  }

  const MONGODB_URI = process.env.MONGODB_URI

  // If we already have a cached connection, return it
  if (cached.conn) {
    return cached.conn
  }

  // If we don't have a promise for a connection, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
    }

    // Create a new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    // Wait for the connection to be established and cache it
    cached.conn = await cached.promise
  } catch (error) {
    // If connection fails, reset the promise so we can try again
    cached.promise = null
    throw error
  }

  return cached.conn
}

export default connectDB
