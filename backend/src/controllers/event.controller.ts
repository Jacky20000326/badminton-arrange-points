import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/event.service';
import { ValidationError } from '../utils/validation';

type AuthRequest = Request;

/**
 * GET /api/events - 獲取活動列表
 */
export async function listEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const status = req.query.status as string | undefined;

    if (page < 1) {
      throw new ValidationError('Page must be greater than 0', 'INVALID_PAGE');
    }

    const result = await eventService.listEvents(page, 10, status as any);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id - 獲取活動詳情
 */
export async function getEventDetail(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const event = await eventService.getEventDetail(id);

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/events - 創建活動（團主/管理員專用）
 */
export async function createEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    // 檢查角色
    if (!['ORGANIZER', 'ADMIN'].includes(req.user.role)) {
      throw new ValidationError('Only organizers and admins can create events', 'PERMISSION_DENIED');
    }

    const { name, description, startTime, endTime, courtCount } = req.body;

    // 基本驗證
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Event name is required', 'INVALID_NAME');
    }

    if (!startTime || !endTime) {
      throw new ValidationError('Start time and end time are required', 'INVALID_TIME');
    }

    if (typeof courtCount !== 'number' || courtCount <= 0) {
      throw new ValidationError('Court count must be a positive number', 'INVALID_COURT_COUNT');
    }

    const event = await eventService.createEvent(req.user.id, {
      name: name.trim(),
      description: description?.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      courtCount,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/events/:id - 更新活動
 */
export async function updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const { name, description, startTime, endTime, courtCount, status } = req.body;

    const event = await eventService.updateEvent(id, req.user.id, {
      name: name?.trim(),
      description: description?.trim(),
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      courtCount,
      status,
    });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/events/:id - 刪除活動
 */
export async function deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    const { id } = req.params;

    await eventService.deleteEvent(id, req.user.id);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/events/:id/register - 報名活動
 */
export async function registerForEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const { skillLevel } = req.body;

    if (typeof skillLevel !== 'number' || skillLevel < 1 || skillLevel > 10) {
      throw new ValidationError('Skill level must be between 1 and 10', 'INVALID_SKILL_LEVEL');
    }

    const registration = await eventService.registerForEvent(id, req.user.id, skillLevel);

    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/events/:id/register - 取消報名
 */
export async function unregisterFromEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    const { id } = req.params;

    await eventService.unregisterFromEvent(id, req.user.id);

    res.json({
      success: true,
      message: 'Unregistered from event successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id/registrations - 獲取報名列表（團主/管理員專用）
 */
export async function getEventParticipants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated', 'UNAUTHORIZED');
    }

    const { id } = req.params;

    // 獲取事件，檢查權限
    const event = await (async () => {
      const { prisma } = await import('../lib/prisma');
      return prisma.event.findUnique({
        where: { id },
      });
    })();

    if (!event) {
      throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
    }

    // 只有團主和管理員可以查看
    if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ValidationError('You do not have permission to view this event registrations', 'PERMISSION_DENIED');
    }

    const participants = await eventService.getEventParticipants(id);

    res.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    next(error);
  }
}
