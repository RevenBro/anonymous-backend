const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Dashboard statistikasi
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments({ isDeleted: false });
    
    // Bugungi faol foydalanuvchilar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeToday = await Message.distinct('recipientId', {
      timestamp: { $gte: today }
    });

    // Kunlik xabar faoliyati (oxirgi 7 kun)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyActivity = await Message.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalMessages,
      activeToday: activeToday.length,
      dailyActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error });
  }
});

module.exports = router;