import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careconnect';
    
    // Attempt standard connection first
    if (process.env.USE_MEMORY_DB !== 'true') {
      try {
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`[Database] Connected to MongoDB Host: ${conn.connection.host}`);
        return;
      } catch (err) {
        console.warn(`[Database] Local MongoDB connection failed (${err.message}). Falling back to In-Memory MongoDB Server...`);
      }
    }

    // Fallback to In-Memory Database for seamless portable execution
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to In-Memory MongoDB Server at ${memoryUri}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};
