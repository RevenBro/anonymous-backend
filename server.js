// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../shared/config/database');

// ✅ SHARED DATABASE CONNECTION
// const connectDB = require('../shared/config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Database connection
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');
const premiumRoutes = require('./routes/premium');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/premium', premiumRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: '✅ Backend ishlayapti',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Server xatosi',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal error'
  });
});

const PORT = process.env.BACKEND_PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Database: Shared MongoDB (Bot va Backend uchun)`);
});

module.exports = app;