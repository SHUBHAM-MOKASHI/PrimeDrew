import Redis from 'ioredis';

const redisUri = process.env.REDIS_URI || 'redis://127.0.0.1:6379';
let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(redisUri, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Max reconnect attempts reached. Redis operating in fallback (mock) mode.');
        return null; // Stop retrying automatically
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Connected successfully.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    console.warn(`[Redis] Connection warning: ${err.message}`);
  });

  // Attempt async connection
  redisClient.connect().catch((err) => {
    console.warn(`[Redis] Initial connect failed: ${err.message}. Proceeding with graceful fallback.`);
  });
} catch (error) {
  console.warn(`[Redis] Setup failed: ${error.message}`);
}

/**
 * Safe Redis wrapper for get operation with fallback
 */
export const redisGet = async (key) => {
  if (redisClient && isRedisConnected) {
    try {
      return await redisClient.get(key);
    } catch (e) {
      console.warn(`[Redis GET error]: ${e.message}`);
    }
  }
  return null;
};

/**
 * Safe Redis wrapper for set operation with optional expiration (seconds)
 */
export const redisSet = async (key, value, expireSeconds = null) => {
  if (redisClient && isRedisConnected) {
    try {
      if (expireSeconds) {
        return await redisClient.set(key, value, 'EX', expireSeconds);
      }
      return await redisClient.set(key, value);
    } catch (e) {
      console.warn(`[Redis SET error]: ${e.message}`);
    }
  }
  return false;
};

/**
 * Safe Redis wrapper for key deletion
 */
export const redisDel = async (key) => {
  if (redisClient && isRedisConnected) {
    try {
      return await redisClient.del(key);
    } catch (e) {
      console.warn(`[Redis DEL error]: ${e.message}`);
    }
  }
  return 0;
};

/**
 * Safe Redis wrapper for acquiring a lock using SET EX NX
 */
export const redisAcquireLock = async (key, ttlSeconds = 10) => {
  if (redisClient && isRedisConnected) {
    try {
      const result = await redisClient.set(key, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (e) {
      console.warn(`[Redis LOCK error]: ${e.message}`);
    }
  }
  return true; // Fallback to DB transaction if Redis is offline
};

export { redisClient, isRedisConnected };
export default redisClient;

