export type EventStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type RegistrationStatus = 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED';

export interface CreateEventInput {
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  courtCount: number;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  courtCount?: number;
  status?: EventStatus;
}

export interface Event {
  id: string;
  organizerId: string;
  name: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  courtCount: number;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventWithRegistrations extends Event {
  registrations: EventRegistration[];
  registrationCount: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  skillLevel: number;
  status: RegistrationStatus;
  registeredAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EventDetailResponse extends EventWithRegistrations {
  organizer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegistrationResponse {
  id: string;
  eventId: string;
  userId: string;
  skillLevel: number;
  status: RegistrationStatus;
  registeredAt: Date;
}

export interface ParticipantsResponse {
  participants: EventRegistration[];
  total: number;
  skillLevelStats?: {
    min: number;
    max: number;
    avg: number;
  };
}
