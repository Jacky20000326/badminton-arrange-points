# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Badminton Arrange Points System** - A full-stack web application for intelligent badminton match scheduling and automatic player pairing based on skill levels.

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT-based
- **Development Status**: Phase 3 complete (Activity Management), moving toward Phase 4 (Matching Algorithm)

## Repository Structure

```
badminton-arrange-points/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js App Router (route groups: auth, main)
│   │   ├── components/      # React components (EventCard, EventForm, Pagination, etc)
│   │   ├── contexts/        # React Context (AuthContext for state management)
│   │   ├── hooks/           # Custom hooks (useAuth)
│   │   ├── lib/             # Utilities (api client, validation)
│   │   ├── types/           # TypeScript interfaces (user, event, auth)
│   │   └── styles/          # CSS Modules
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── app.ts           # Express server entry point
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # Express middleware (auth, error handling)
│   │   ├── routes/          # Route definitions (auth, events, matches)
│   │   ├── services/        # Business logic layer
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Helper functions (logger, validation)
│   │   ├── jobs/            # Scheduled tasks (to be implemented)
│   │   └── lib/             # Libraries (Prisma singleton)
│   ├── prisma/
│   │   └── schema.prisma    # Database schema (7 core models)
│   ├── package.json
│   └── tsconfig.json
├── .claude/                  # Claude Code configuration
├── README.md
└── CLAUDE.md                 # This file
```

## Database Schema (7 Core Models)

The Prisma schema defines these key entities:

1. **User** - User accounts with roles (PLAYER, ORGANIZER, ADMIN)
2. **PlayerProfile** - Player skill levels (1-10 scale) and match statistics
3. **Event** - Activities created by organizers with status (DRAFT → ACTIVE → COMPLETED/CANCELLED)
4. **EventRegistration** - User registration for events with UNIQUE constraint (eventId, userId)
5. **Match** - Badminton matches (4 players for doubles), status tracking
6. **MatchQueue** - Waiting list for players pending assignment to matches
7. **MatchHistory** - Record of previous pairings to avoid repetition

**Key Relationships**:
- User can organize multiple Events
- User can have multiple EventRegistrations and Matches
- Event cascades deletion to its registrations and matches
- UNIQUE constraint on EventRegistration prevents duplicate registrations

## Architecture & Design Patterns

### Backend Architecture (Layered)

Routes → Controllers → Services → Prisma Models

- **Routes** (`src/routes/`): Express route definitions with middleware application
- **Controllers** (`src/controllers/`): HTTP request/response handling, parameter validation
- **Services** (`src/services/`): Core business logic, database interactions, error handling
- **Middleware** (`src/middleware/`): Authentication (JWT), error handling, logging

**Key Pattern**: ValidationError class supports both legacy (field, message) and new (message, code) signatures for gradual refactoring.

### Frontend Architecture (Next.js)

App Router → Pages → Components → Contexts → API Client

- **Pages** (`src/app/(auth|main)/`): Route components using App Router
- **Components**: Reusable UI components with CSS Modules
- **Contexts**: React Context for global state (AuthContext with useReducer pattern)
- **API Client** (`src/lib/api.ts`): Axios instance with request/response interceptors
- **Protected Routes**: ProtectedRoute component enforces authentication and role-based access

**Key Pattern**: SessionStorage (not localStorage) stores JWT tokens for security; API interceptor handles 401 errors with redirect logic.

### State Management

- **Frontend**: React Context API + useReducer (sufficient for this app size)
- **Backend**: Stateless request handling with JWT for session management

## Development Commands

### Backend (from `backend/` directory)

```bash
npm run dev              # Start dev server with hot reload (nodemon)
npm run build           # Compile TypeScript to JavaScript
npm start               # Run compiled JavaScript (production)
npm run type-check      # Type checking without compilation
npm run db:push         # Sync Prisma schema to database
npm run db:studio       # Open Prisma Studio GUI for database inspection
```

### Frontend (from `frontend/` directory)

```bash
npm run dev             # Start Next.js dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint checks
npm run type-check      # Type checking without compilation
```

### Database Management

```bash
# In backend directory:
npm run db:push         # Push schema changes to database (development)
npx prisma migrate dev --name <migration_name>  # Create and apply migration
npx prisma generate    # Generate Prisma client code
```

## API Architecture

### Current Endpoints (Phase 3 Complete)

**Authentication** (`POST /api/auth/*`):
- `/register` - User registration with skill level
- `/login` - JWT authentication
- `/me` - Get current user info
- `/profile` - Update profile

**Events** (`/api/events/*`):
- `GET /` - List events (public, paginated, filterable by status)
- `GET /:id` - Get event details with registrations
- `POST /` - Create event (organizers only)
- `PUT /:id` - Update event (creator/admin)
- `DELETE /:id` - Delete event (draft only)
- `POST /:id/register` - Register for event with skill level
- `DELETE /:id/register` - Cancel registration
- `GET /:id/registrations` - Get participant list (organizer only)

**Matches** (`/api/matches/*`): To be implemented in Phase 4

### Authentication & Authorization

- **JWT Bearer tokens** stored in sessionStorage
- **Protected routes** use ProtectedRoute component + authMiddleware
- **Role-based access**: PLAYER, ORGANIZER, ADMIN (checked in controllers and services)
- **Error responses**: 401 (unauthorized), 403 (forbidden)

## Type Safety & Validation

### Backend Validation Strategy

1. **Input validation** in controllers (HTTP-level validation)
2. **Service layer validation** (business logic checks)
3. **Database constraints** (UNIQUE, NOT NULL, enums)
4. **Custom ValidationError class** with code field for error categorization

**EventStatus enum**: DRAFT, ACTIVE, COMPLETED, CANCELLED (uppercase in Prisma)
**RegistrationStatus enum**: REGISTERED, CHECKED_IN, CANCELLED

### Frontend Type Definition

- `src/types/event.ts` - Event interfaces matching backend API
- `src/types/auth.ts` - Auth interfaces (would be auto-generated ideally)
- Axios response typing for safety

## Common Development Tasks

### Adding a New Event API Endpoint

1. Update route in `routes/events.routes.ts`
2. Add controller method in `controllers/event.controller.ts`
3. Add service method in `services/event.service.ts`
4. Update frontend API client in `frontend/src/lib/api.ts`
5. Create corresponding frontend page/component if needed

### Running TypeScript Check Before Commit

```bash
# Backend
cd backend && npm run type-check

# Frontend
cd frontend && npm run type-check
```

### Debugging with Prisma Studio

```bash
cd backend
npm run db:studio
# Opens http://localhost:5555 for database inspection
```

### Testing Changes Across Full Stack

1. Build backend: `cd backend && npm run build`
2. Verify no TypeScript errors in frontend: `cd frontend && npm run type-check`
3. Test manually in dev environment with both servers running

## Key Implementation Details

### Enum Values Consistency

Frontend type definitions use lowercase (e.g., `'draft' | 'active'`) for API compatibility, but backend Prisma enum uses uppercase (e.g., `DRAFT`, `ACTIVE`). Controller methods handle the conversion.

### Pagination & Filtering

Events list supports:
- **Pagination**: Page number in query params, 10 items per page default
- **Status filtering**: Optional `status` query param to filter by EventStatus
- **Response format**: Includes `total`, `page`, `pageSize`, `totalPages`

### Permission Control Strategy

- **Multi-layer validation**: Middleware checks auth, Controller checks role, Service checks ownership
- **Event CRUD**: Only creator (organizerId) or ADMIN can edit/delete
- **Participant list**: Only organizer or ADMIN can view registrations
- **Registration**: Any authenticated user can register/unregister

### Error Handling

- **ValidationError**: For business logic failures with optional error code
- **HTTP status codes**: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found)
- **Error response format**: `{ error: "message" }` or `{ success: false, error: "message" }`

## Next Phase: Phase 4 (Matching Algorithm)

The upcoming Phase 4 will implement the intelligent player matching system:

- **Matching factors** (weighted): skill level (50%), wait time (25%), match count (15%), avoid repeat (10%)
- **Algorithm**: Generate all possible 4-player combinations, calculate scores, use greedy selection
- **Matching service**: New `matching.service.ts` with core algorithm logic
- **Queue management**: MatchQueue table for waiting players

This is the core feature that differentiates the system.

## Environment Variables

### Backend `.env`
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Security Considerations

- **Token storage**: SessionStorage (auto-clears on tab close) instead of localStorage
- **CORS**: Configured to only accept requests from frontend origin
- **Password**: Hashed with bcryptjs, 8+ chars with complexity requirements
- **JWT expiration**: 7 days with automatic refresh on login
- **Permission checks**: Always validate backend (never trust frontend-only checks)

## Performance Notes

- **Prisma client**: Singleton pattern in `src/lib/prisma.ts` to prevent connection pool leaks
- **API response**: Event list includes registration count; detail includes full registrations
- **Database indexing**: EventStatus and startTime indexed for filtering/sorting
- **Frontend**: CSS Modules for scoped styling; no global CSS pollution

## Testing Files Location

Tests should be placed in `backend/tests/` and `frontend/tests/` directories (not yet implemented in Phase 3).

## Git Workflow

Current development is on `master` branch. Phase 3 just completed:
- 14 frontend files created (components, pages, types)
- 5 backend files created (services, controller, routes, types, validation)
- All TypeScript compilation passing

Push Phase 3 completion before starting Phase 4.
