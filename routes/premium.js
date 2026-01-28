const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Premium foydalanuvchilarni olish
router.get('/users', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    
    let query = {};
    
    if (filter === 'premium') {
      query.isPremium = true;
    } else if (filter === 'regular') {
      query.isPremium = false;
    }

    const users = await User.find(query)
      .sort({ premiumUntil: 1 });

    // Premium statusni yangilash
    for (const user of users) {
      if (user.isPremium && user.premiumUntil && new Date() > user.premiumUntil) {
        user.isPremium = false;
        user.premiumType = null;
        await user.save();
      }
    }

    const premiumCount = await User.countDocuments({ isPremium: true });
    const regularCount = await User.countDocuments({ isPremium: false });

    res.json({
      users,
      stats: {
        total: users.length,
        premium: premiumCount,
        regular: regularCount
      }
    });
  } catch (error) {
    console.error('Premium users error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Foydalanuvchiga premium berish
router.post('/grant', async (req, res) => {
  try {
    const { userId, days, customMessage } = req.body;

    if (!userId || !days) {
      return res.status(400).json({ message: 'userId va days majburiy!' });
    }

    const user = await User.findOne({ telegramId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    // Premium muddat hisoblash
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + parseInt(days));

    // Premium type
    let premiumType = 'daily';
    if (days >= 365) {
      premiumType = 'unlimited';
    } else if (days >= 30) {
      premiumType = 'monthly';
    } else if (days >= 7) {
      premiumType = 'weekly';
    }

    user.isPremium = true;
    user.premiumUntil = premiumUntil;
    user.premiumType = premiumType;
    await user.save();

    // TODO: Bot orqali xabar yuborish
    // Bu qismni keyinchalik bot instance bilan qilishimiz mumkin
    // Hozircha faqat database'da saqlash

    res.json({ 
      message: 'Premium muvaffaqiyatli berildi!',
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil,
        premiumType: user.premiumType
      }
    });

  } catch (error) {
    console.error('Grant premium error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Premium'ni o'chirish
router.post('/revoke', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId majburiy!' });
    }

    const user = await User.findOne({ telegramId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    user.isPremium = false;
    user.premiumUntil = null;
    user.premiumType = null;
    await user.save();

    res.json({ 
      message: 'Premium bekor qilindi!',
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        isPremium: user.isPremium
      }
    });

  } catch (error) {
    console.error('Revoke premium error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

// Premium muddat uzaytirish
router.post('/extend', async (req, res) => {
  try {
    const { userId, days } = req.body;

    if (!userId || !days) {
      return res.status(400).json({ message: 'userId va days majburiy!' });
    }

    const user = await User.findOne({ telegramId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    if (!user.isPremium) {
      return res.status(400).json({ message: 'Foydalanuvchi premium emas!' });
    }

    // Joriy muddatga qo'shish
    const currentDate = user.premiumUntil || new Date();
    currentDate.setDate(currentDate.getDate() + parseInt(days));
    
    user.premiumUntil = currentDate;
    await user.save();

    res.json({ 
      message: 'Premium muddat uzaytirildi!',
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        premiumUntil: user.premiumUntil
      }
    });

  } catch (error) {
    console.error('Extend premium error:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

module.exports = router;