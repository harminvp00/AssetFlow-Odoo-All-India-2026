# AssetFlow - System Architecture

AssetFlow is designed using clean architecture patterns on both the frontend and backend, optimizing for module-level isolation, testability, and developer collaboration.

## Frontend (Client) - Feature-Based Architecture

The client application (built with React and Vite) uses **Feature-Based Architecture**. Every core capability of the system is encapsulated inside a self-contained feature module.

### Directory Structure per Feature

```
client/src/features/<feature-name>/
├── api/          # Axios HTTP requests and React Query custom hooks
├── components/   # UI components specific to this feature
├── hooks/        # Feature-specific state hooks
├── pages/        # Router pages
├── store/        # Redux Toolkit slice definitions
├── validation/   # Zod validations for forms
├── constants/    # Feature constants
├── utils/        # Helper utility functions
└── index.js      # Barrel export exposing only the public API
```

---

## Backend (Server) - Modular Clean Architecture

The server (built with Express.js) follows a strict modular routing structure with clear layering.

### Data Flow Layering

```
Request
  ↓
Express Route (Authentication & Zod Validation Middlewares)
  ↓
Controller (HTTP Layer - parses params/cookies, maps output via Mappers)
  ↓
Service (Domain Business Logic)
  ↓
Repository (Database Access Layer via Prisma Client)
  ↓
Prisma Client
  ↓
PostgreSQL
```

### Directory Structure per Module

```
server/src/modules/<module-name>/
├── <module>.routes.js       # Express Router mappings
├── <module>.controller.js   # HTTP Request/Response handlers
├── <module>.service.js      # Business rules and validations
├── <module>.repository.js   # DB queries using Prisma client
├── <module>.validation.js   # Zod schemas for input checks
├── <module>.mapper.js       # Map raw db records to DTO layouts
├── <module>.constants.js    # Enums, flags, limits
├── <module>.messages.js    # Internationalized or standard texts
├── <module>.events.js       # Event emitter handlers (optional)
├── <module>.scheduler.js    # Cron job definitions (optional)
└── index.js                 # Barrel exports mounting routes
```
