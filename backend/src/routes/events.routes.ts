import express from 'express';
import { authMiddleware } from '../middleware/auth';
import * as eventController from '../controllers/event.controller';

const router = express.Router();

// 公開端點（無需認證）
router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEventDetail);

// 需要認證的端點
router.post('/', authMiddleware, eventController.createEvent);
router.put('/:id', authMiddleware, eventController.updateEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

// 報名相關端點
router.post('/:id/register', authMiddleware, eventController.registerForEvent);
router.delete('/:id/register', authMiddleware, eventController.unregisterFromEvent);

// 獲取報名列表（團主/管理員專用）
router.get('/:id/registrations', authMiddleware, eventController.getEventParticipants);

module.exports = router;
