import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose ODM.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/p2p_rental';
  console.log("Connecting to MongoDB URI:", (process.env.MONGO_URI || process.env.MONGODB_URI) ? "URI Found" : "URI Missing");

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[MongoDB] Connected successfully to Atlas:', mongoose.connection.host);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error event: ${err.message}`);
});
