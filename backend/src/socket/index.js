const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { getRedis } = require('../utils/redis');
const { verifyAccessToken } = require('../utils/jwt');
const { registerMessageHandlers } = require('./messageHandlers');
const { registerTypingHandlers } = require('./typingHandlers');
const { registerReadReceiptHandlers } = require('./readReceiptHandlers');
const { setUserOnline, setUserOffline } = require('../services/presenceService');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Redis adapter for horizontal scaling
  const pubClient = getRedis().duplicate();
  const subClient = getRedis().duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Auth middleware — verify JWT before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a personal room for DM targeting
    socket.join(`user:${socket.userId}`);

    // Mark user online via presence service
    setUserOnline(socket.userId);

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId: socket.userId });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Register message handlers (send, edit, delete)
    registerMessageHandlers(io, socket);

    // Register typing handlers
    registerTypingHandlers(io, socket);

    // Register read receipt handlers
    registerReadReceiptHandlers(io, socket);

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      await setUserOffline(socket.userId);
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
