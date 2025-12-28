import { prisma } from '../lib/prisma';
import {
  CreateEventInput,
  UpdateEventInput,
  Event,
  EventListResponse,
  EventDetailResponse,
  EventRegistration,
  ParticipantsResponse,
  EventStatus,
} from '../types/event';
import { ValidationError } from '../utils/validation';

const PAGE_SIZE = 10;

/**
 * 獲取活動列表（支持分頁和狀態篩選）
 */
export async function listEvents(
  page: number = 1,
  pageSize: number = PAGE_SIZE,
  status?: EventStatus
): Promise<EventListResponse> {
  const skip = (page - 1) * pageSize;

  const where = status ? { status } : {};

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.event.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    events: events.map(event => ({
      id: event.id,
      organizerId: event.organizerId,
      name: event.name,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      courtCount: event.courtCount,
      status: event.status as EventStatus,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * 獲取活動詳情
 */
export async function getEventDetail(eventId: string): Promise<EventDetailResponse> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
  }

  return {
    id: event.id,
    organizerId: event.organizerId,
    name: event.name,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    courtCount: event.courtCount,
    status: event.status as EventStatus,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    registrations: event.registrations.map(reg => ({
      id: reg.id,
      eventId: reg.eventId,
      userId: reg.userId,
      skillLevel: reg.skillLevel,
      status: reg.status as any,
      registeredAt: reg.registeredAt,
      user: reg.user,
    })),
    registrationCount: event.registrations.length,
    organizer: event.organizer,
  };
}

/**
 * 創建活動
 */
export async function createEvent(
  organizerId: string,
  input: CreateEventInput
): Promise<Event> {
  // 驗證輸入
  if (input.startTime >= input.endTime) {
    throw new ValidationError('Start time must be before end time', 'INVALID_TIME_RANGE');
  }

  if (input.courtCount <= 0) {
    throw new ValidationError('Court count must be greater than 0', 'INVALID_COURT_COUNT');
  }

  const event = await prisma.event.create({
    data: {
      organizerId,
      name: input.name,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      courtCount: input.courtCount,
      status: 'DRAFT',
    },
  });

  return {
    id: event.id,
    organizerId: event.organizerId,
    name: event.name,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    courtCount: event.courtCount,
    status: event.status as EventStatus,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

/**
 * 更新活動
 */
export async function updateEvent(
  eventId: string,
  organizerId: string,
  input: UpdateEventInput
): Promise<Event> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
  }

  // 檢查權限（只有創建者和管理員可以編輯，這裡先只檢查創建者）
  if (event.organizerId !== organizerId) {
    throw new ValidationError('You do not have permission to update this event', 'PERMISSION_DENIED');
  }

  // 驗證狀態轉換規則
  if (input.status) {
    validateStatusTransition(event.status as EventStatus, input.status);
  }

  // 驗證時間範圍
  const startTime = input.startTime || event.startTime;
  const endTime = input.endTime || event.endTime;
  if (startTime >= endTime) {
    throw new ValidationError('Start time must be before end time', 'INVALID_TIME_RANGE');
  }

  // 驗證場地數量
  if (input.courtCount && input.courtCount <= 0) {
    throw new ValidationError('Court count must be greater than 0', 'INVALID_COURT_COUNT');
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      name: input.name || undefined,
      description: input.description || undefined,
      startTime: input.startTime || undefined,
      endTime: input.endTime || undefined,
      courtCount: input.courtCount || undefined,
      status: input.status || undefined,
    },
  });

  return {
    id: updated.id,
    organizerId: updated.organizerId,
    name: updated.name,
    description: updated.description,
    startTime: updated.startTime,
    endTime: updated.endTime,
    courtCount: updated.courtCount,
    status: updated.status as EventStatus,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * 刪除活動
 */
export async function deleteEvent(eventId: string, organizerId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
  }

  if (event.organizerId !== organizerId) {
    throw new ValidationError('You do not have permission to delete this event', 'PERMISSION_DENIED');
  }

  // 只能刪除草稿狀態的活動
  if (event.status !== 'DRAFT') {
    throw new ValidationError('Can only delete draft events', 'INVALID_EVENT_STATUS');
  }

  await prisma.event.delete({
    where: { id: eventId },
  });
}

/**
 * 報名活動
 */
export async function registerForEvent(
  eventId: string,
  userId: string,
  skillLevel: number
): Promise<EventRegistration> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
  }

  // 檢查是否已報名
  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (existingRegistration) {
    if (existingRegistration.status === 'REGISTERED') {
      throw new ValidationError('You are already registered for this event', 'ALREADY_REGISTERED');
    }
    // 如果之前取消了報名，可以重新報名
  }

  const registration = await prisma.eventRegistration.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    create: {
      eventId,
      userId,
      skillLevel,
      status: 'REGISTERED',
    },
    update: {
      status: 'REGISTERED',
      skillLevel,
    },
  });

  return {
    id: registration.id,
    eventId: registration.eventId,
    userId: registration.userId,
    skillLevel: registration.skillLevel,
    status: registration.status as any,
    registeredAt: registration.registeredAt,
  };
}

/**
 * 取消報名
 */
export async function unregisterFromEvent(eventId: string, userId: string): Promise<void> {
  const registration = await prisma.eventRegistration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!registration) {
    throw new ValidationError('Registration not found', 'REGISTRATION_NOT_FOUND');
  }

  if (registration.status === 'CANCELLED') {
    throw new ValidationError('You have already cancelled this registration', 'ALREADY_CANCELLED');
  }

  await prisma.eventRegistration.update({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    data: {
      status: 'CANCELLED',
    },
  });
}

/**
 * 獲取活動參與者列表
 */
export async function getEventParticipants(eventId: string): Promise<ParticipantsResponse> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ValidationError('Event not found', 'EVENT_NOT_FOUND');
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      status: 'REGISTERED',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const skillLevels = registrations.map(r => r.skillLevel);
  const skillLevelStats = skillLevels.length > 0 ? {
    min: Math.min(...skillLevels),
    max: Math.max(...skillLevels),
    avg: skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length,
  } : undefined;

  return {
    participants: registrations.map(reg => {
      const { user, ...regRest } = reg;
      return {
        ...regRest,
        status: regRest.status as any,
        user: user || undefined,
      };
    }),
    total: registrations.length,
    skillLevelStats,
  };
}

/**
 * 驗證狀態轉換
 */
function validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
  const validTransitions: Record<EventStatus, EventStatus[]> = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new ValidationError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}
