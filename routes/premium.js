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

    console.log('📥 Premium berish so\'rovi:', { userId, days, customMessage });

    if (!userId || !days) {
      return res.status(400).json({ message: 'userId va days majburiy!' });
    }

    const user = await User.findOne({ telegramId: parseInt(userId) });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    console.log('👤 User topildi:', user.telegramId, user.firstName);

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

    console.log('✅ Premium berildi:', user.telegramId, premiumType, premiumUntil);

    // Bot orqali xabar yuborish
    try {
      // Bot instance'ni olish (agar mavjud bo'lsa)
      const botModule = require('../bot-integration');
      
      if (botModule && botModule.sendMessage) {
        const message = customMessage || 
          `🎉 Tabriklaymiz!\n\n` +
          `Sizga ${days} kunlik Premium hadya qilindi!\n\n` +
          `💎 Premium imkoniyatlar:\n` +
          `✅ Cheksiz xabar yuborish\n` +
          `✅ Reklama yo'q\n` +
          `✅ Maxfiylik darajasi yuqori\n\n` +
          `📅 Amal qilish muddati: ${premiumUntil.toLocaleDateString('uz-UZ')}`;
        
        await botModule.sendMessage(userId, message);
        console.log('📨 Xabar yuborildi:', userId);
      }
    } catch (botError) {
      console.error('⚠️ Bot orqali xabar yuborib bo\'lmadi:', botError.message);
      // Bu xato asosiy jarayonni to'xtatmasin
    }

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
    console.error('❌ Grant premium error:', error);
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

    console.log('🚫 Premium bekor qilindi:', userId);

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

module.exports = router;