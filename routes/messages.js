const express = require('express');
const router = express.Router();
const { Message } = require('@revencoder/anonymous-shared');
const authMiddleware = require('../middleware/authMiddleware');

// Auth middleware qo'llash
router.use(authMiddleware);

// Barcha xabarlarni olish
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, recipientId, startDate, endDate } = req.query;
    
    const query = { isDeleted: false };
    
    if (recipientId) query.recipientId = parseInt(recipientId);
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Xabarni flag qilish
router.patch('/:messageId/flag', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isFlagged } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isFlagged },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Xabar topilmadi' });
    }

    res.json({ message: 'Muvaffaqiyatli yangilandi', data: message });
  } catch (error) {
    console.error('Flag error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Xabarni o'chirish
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isDeleted: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Xabar topilmadi' });
    }

    res.json({ message: 'Xabar o\'chirildi', data: message });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;