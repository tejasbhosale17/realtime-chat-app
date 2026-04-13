const Redis = require('ioredis');

let redis;

const connectRedis = async () => {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  return new Promise((resolve, reject) => {
    redis.on('connect', resolve);
    redis.on('error', reject);
  });
};

const getRedis = () => {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
};

module.exports = { connectRedis, getRedis };
