// backend/controllers/premiumController.js
const { User } = require('@revencoder/anonymous-shared');
const TelegramBot = require('node-telegram-bot-api');

// Optional: Bot notifikatsiya uchun (agar bot API bo'lsa)
const notifyBot = async (userId, message) => {
  try {
    // Bot API endpoint (agar mavjud bo'lsa)
    // const response = await fetch('http://localhost:3000/api/bot/notify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, message })
    // });
    console.log(`📢 Bot notification: ${userId} -> ${message}`);
  } catch (error) {
    console.error('Bot notification error:', error);
  }
};

// Premium berish (Admin panel'dan)
exports.grantPremium = async (req, res) => {
  try {
    const { telegramId, durationDays, type = 'monthly', reason = 'Admin gift' } = req.body;
    const adminName = req.user?.username || 'Unknown Admin';

    // Validation
    if (!telegramId || !durationDays) {
      return res.status(400).json({
        message: 'telegramId va durationDays talab',
        required: ['telegramId', 'durationDays']
      });
    }

    // Foydalanuvchini topish yoki yaratish
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    // Premium berish
    user.grantPremium(durationDays, type, adminName);
    await user.save();

    // Bot'ga xabar yuborish
    await notifyBot(telegramId, 
      `🎁 Siz xayriyan PREMIUM obuna oldingiz!\n\n` +
      `⏰ Muddati: ${durationDays} kun\n` +
      `💝 Beruvchi: ${adminName}`
    );

    res.json({
      message: '✅ Premium muvaffaqiyatli berildi',
      user: {
        telegramId: user.telegramId,
        username: user.username,
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil,
        premiumType: user.premiumType,
        giftedPremiumBy: user.giftedPremiumBy,
        giftedPremiumAt: user.giftedPremiumAt
      }
    });

    console.log(`💎 Premium granted: ${telegramId} by ${adminName} for ${durationDays} days`);

  } catch (error) {
    console.error('Premium grant error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
};

// Premium bekor qilish
exports.revokePremium = async (req, res) => {
  try {
    const { telegramId } = req.params;
    const adminName = req.user?.username || 'Unknown Admin';

    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    if (!user.isPremium) {
      return res.status(400).json({ message: 'Foydalanuvchi premium obunasi yo\'q' });
    }

    // Premium bekor qilish
    user.revokePremium();
    await user.save();

    // Bot'ga xabar yuborish
    await notifyBot(telegramId,
      `⚠️ Sizning PREMIUM obunasi bekor qilindi\n` +
      `Admin: ${adminName}`
    );

    res.json({
      message: '✅ Premium bekor qilindi',
      user: {
        telegramId: user.telegramId,
        username: user.username,
        isPremium: user.isPremium
      }
    });

    console.log(`❌ Premium revoked: ${telegramId} by ${adminName}`);

  } catch (error) {
    console.error('Premium revoke error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
};

// Premium status o'zgartirildi (TTL ochish uchun)
exports.checkAndUpdatePremiumStatus = async (req, res) => {
  try {
    const now = new Date();
    
    // Muddati tuggan barcha premium user'larni yangilash
    const expiredUsers = await User.updateMany(
      {
        isPremium: true,
        premiumUntil: { $lt: now }
      },
      {
        isPremium: false,
        premiumType: null,
        premiumUntil: null,
        updatedAt: now
      }
    );

    res.json({
      message: '✅ Premium status updated',
      expiredCount: expiredUsers.modifiedCount
    });

    console.log(`🔄 Premium status updated: ${expiredUsers.modifiedCount} users expired`);

  } catch (error) {
    console.error('Premium update error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
};

// Foydalanuvchi premium ma'lumotlarini olish
exports.getUserPremiumStatus = async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    // Premium muddati tugganmi tekshirish
    user.checkPremiumExpiry();

    res.json({
      telegramId: user.telegramId,
      username: user.username,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil,
      premiumType: user.premiumType,
      premiumStartedAt: user.premiumStartedAt,
      giftedPremiumBy: user.giftedPremiumBy,
      giftedPremiumAt: user.giftedPremiumAt,
      daysRemaining: user.isPremium && user.premiumUntil 
        ? Math.max(0, Math.ceil((user.premiumUntil - new Date()) / (1000 * 60 * 60 * 24)))
        : 0
    });

  } catch (error) {
    console.error('Get premium status error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
};

// Barcha premium user'larni olish
exports.getPremiumUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const premiumUsers = await User.find({ isPremium: true })
      .sort({ premiumUntil: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ isPremium: true });

    // Qolgan vaqtlarni hisoblash
    const usersWithDaysLeft = premiumUsers.map(user => ({
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      premiumType: user.premiumType,
      premiumUntil: user.premiumUntil,
      giftedPremiumBy: user.giftedPremiumBy,
      daysRemaining: Math.max(0, Math.ceil((user.premiumUntil - new Date()) / (1000 * 60 * 60 * 24)))
    }));

    res.json({
      users: usersWithDaysLeft,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get premium users error:', error);
    res.status(500).json({ 
      message: 'Server xatosi', 
      error: error.message 
    });
  }
};