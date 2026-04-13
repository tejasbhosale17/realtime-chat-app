const { getRedis } = require('../utils/redis');

const ONLINE_TTL = 300; // 5 minutes

const setUserOnline = async (userId) => {
  const redis = getRedis();
  await redis.set(`online:${userId}`, Date.now().toString(), 'EX', ONLINE_TTL);
};

const setUserOffline = async (userId) => {
  const redis = getRedis();
  await redis.del(`online:${userId}`);
};

const refreshOnline = async (userId) => {
  const redis = getRedis();
  await redis.expire(`online:${userId}`, ONLINE_TTL);
};

const isUserOnline = async (userId) => {
  const redis = getRedis();
  const val = await redis.get(`online:${userId}`);
  return !!val;
};

const getOnlineUsers = async (userIds) => {
  if (!userIds.length) return {};
  const redis = getRedis();
  const pipeline = redis.pipeline();
  userIds.forEach((id) => pipeline.get(`online:${id}`));
  const results = await pipeline.exec();

  const onlineMap = {};
  userIds.forEach((id, i) => {
    onlineMap[id] = !!results[i][1];
  });
  return onlineMap;
};

module.exports = { setUserOnline, setUserOffline, refreshOnline, isUserOnline, getOnlineUsers };
