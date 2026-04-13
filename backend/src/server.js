require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./utils/db');
const { initSocket } = require('./socket');
const { connectRedis } = require('./utils/redis');
const { ensureBucket } = require('./services/s3Service');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const start = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');

    await connectRedis();
    console.log('Redis connected');

    initSocket(server);
    console.log('Socket.io initialized');

    await ensureBucket();
    console.log('S3 bucket ready');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
