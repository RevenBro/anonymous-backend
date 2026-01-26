const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Barcha foydalanuvchilarni olish
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = search 
      ? { 
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Har bir foydalanuvchi uchun xabarlar sonini hisoblash
    const usersWithMessages = await Promise.all(
      users.map(async (user) => {
        const messageCount = await Message.countDocuments({
          recipientId: user.telegramId,
          isDeleted: false
        });
        return {
          ...user.toObject(),
          receivedMessages: messageCount
        };
      })
    );

    res.json({
      users: usersWithMessages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Users GET error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Foydalanuvchini bloklash/blokdan chiqarish
router.patch('/:userId/block', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findOneAndUpdate(
      { telegramId: parseInt(userId) },
      { isBlocked },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    res.json({ 
      message: 'Muvaffaqiyatli yangilandi', 
      user 
    });
  } catch (error) {
    console.error('Block error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Foydalanuvchi tafsilotlari
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ telegramId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    // Foydalanuvchi xabarlari
    const messages = await Message.find({
      recipientId: parseInt(userId),
      isDeleted: false
    }).sort({ timestamp: -1 }).limit(10);

    const messageCount = await Message.countDocuments({
      recipientId: parseInt(userId),
      isDeleted: false
    });

    res.json({
      user,
      messages,
      messageCount
    });
  } catch (error) {
    console.error('User detail error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;