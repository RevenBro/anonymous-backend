const express = require('express');
const router = express.Router();
const { Message, User } = require('@revencoder/anonymous-shared');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Dashboard statistikasi
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Dashboard stats so\'rovi keldi');

    // 1. Jami foydalanuvchilar
    const totalUsers = await User.countDocuments();
    console.log('👥 Jami foydalanuvchilar:', totalUsers);

    // 2. Jami xabarlar (o'chirilmaganlar)
    const totalMessages = await Message.countDocuments({ isDeleted: false });
    console.log('💬 Jami xabarlar:', totalMessages);

    // 3. Bugungi faol foydalanuvchilar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = await Message.find({
      timestamp: { $gte: today },
      isDeleted: false
    });

    // Unique recipient IDs
    const uniqueRecipients = [...new Set(todayMessages.map(m => m.recipientId))];
    const activeToday = uniqueRecipients.length;
    console.log('⚡ Bugun faol:', activeToday);

    // 4. Kunlik xabar faoliyati (oxirgi 7 kun)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    console.log('📅 7 kun oldin:', sevenDaysAgo);
    console.log('📅 Bugun:', today);

    const dailyActivity = await Message.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$timestamp",
              timezone: "Asia/Tashkent"
            } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Kunlik faoliyat:', dailyActivity);

    // Agar kunlik faoliyat bo'sh bo'lsa, test data qo'shamiz
    if (dailyActivity.length === 0) {
      console.log('⚠️ Kunlik faoliyat bo\'sh, test data qo\'shilmoqda');
      
      // Oxirgi 7 kun uchun 0 bilan to'ldirish
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyActivity.push({
          _id: date.toISOString().split('T')[0],
          count: 0
        });
      }
    }

    const response = {
      totalUsers,
      totalMessages,
      activeToday,
      dailyActivity
    };

    console.log('✅ Response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ Stats xatosi:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;