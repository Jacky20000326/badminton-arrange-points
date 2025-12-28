import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * 公開路由
 */
// 用戶註冊
router.post('/register', AuthController.register);

// 用戶登入
router.post('/login', AuthController.login);

/**
 * 受保護的路由（需要驗證）
 */
// 獲取當前用戶信息
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// 更新用戶資料
router.put('/profile', authMiddleware, AuthController.updateProfile);

// 健康檢查
router.get('/health', (req, res) => {
  res.json({ message: 'Auth service is running' });
});

module.exports = router;
