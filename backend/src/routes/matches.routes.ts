import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 比賽路由將在 Phase 5 實現
router.get('/health', (req, res) => {
  res.json({ message: 'Matches service is running' });
});

module.exports = router;
