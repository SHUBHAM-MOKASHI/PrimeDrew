import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose ODM with fallback.
 */
export const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/p2p_rental';
  
  if (mongoUri.includes('cluster0.xxxxx.mongodb.net')) {
    console.warn('[MongoDB] Placeholder Atlas URI detected in .env. Falling back to local MongoDB.');
    mongoUri = 'mongodb://127.0.0.1:27017/p2p_rental';
  }

  console.log("Connecting to MongoDB URI:", (process.env.MONGO_URI || process.env.MONGODB_URI) ? "URI Found" : "URI Missing");

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial Connection Error: ${error.message}`);

    if (mongoUri !== 'mongodb://127.0.0.1:27017/p2p_rental') {
      try {
        console.warn('[MongoDB] Attempting fallback connection to local MongoDB...');
        const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/p2p_rental', {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`[MongoDB] Connected successfully to local fallback host: ${fallbackConn.connection.host}`);
        return fallbackConn;
      } catch (fallbackErr) {
        console.error(`[MongoDB] Local fallback connection error: ${fallbackErr.message}`);
      }
    }

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
