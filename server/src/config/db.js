import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose ODM.
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/p2p_rental';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Initial Connection Error: ${error.message}`);
    // Do not crash hard instantly in dev mode, but log clear error
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
