// backend/routes/premium.js
const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Barcha routes authMiddleware bilan protected
router.use(authMiddleware);

/**
 * POST /api/premium/grant
 * Admin panel'dan premium berish
 * 
 * Body:
 * {
 *   "telegramId": 123456789,
 *   "durationDays": 30,
 *   "type": "monthly",
 *   "reason": "Xayriyan premium"
 * }
 */
router.post('/grant', premiumController.grantPremium);

/**
 * DELETE /api/premium/:telegramId
 * Premium bekor qilish
 */
router.delete('/:telegramId', premiumController.revokePremium);

/**
 * GET /api/premium/status/:telegramId
 * Foydalanuvchi premium statusini olish
 */
router.get('/status/:telegramId', premiumController.getUserPremiumStatus);

/**
 * GET /api/premium/users
 * Barcha premium user'larni olish
 * Query: page, limit
 */
router.get('/users', premiumController.getPremiumUsers);

/**
 * POST /api/premium/check-expiry
 * Muddati tuggan premium'larni tekshirish va yangilash
 */
router.post('/check-expiry', premiumController.checkAndUpdatePremiumStatus);

module.exports = router;