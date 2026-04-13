const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const friendRoutes = require('./routes/friendRoutes');
const fileRoutes = require('./routes/fileRoutes');
const pushRoutes = require('./routes/pushRoutes');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/push', pushRoutes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
