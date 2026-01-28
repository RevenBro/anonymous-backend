const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// .env faylini yuklash
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB ulanish
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Backend MongoDB ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err));

// Routes - FAQAT BIR MARTA!
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');
const premiumRoutes = require('./routes/premium');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/premium', premiumRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Anonymous Bot Admin API',
    status: 'Ishlamoqda ✅'
  });
});

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`🚀 Backend server ${PORT} portda ishlamoqda`);
  console.log(`📡 API: http://localhost:${PORT}`);
});

module.exports = app;