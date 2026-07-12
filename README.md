# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a centralized Enterprise Resource Planning (ERP) platform designed to simplify, automate, and track the full lifecycle of physical assets and shared resources within any organization. The system enforces role-based access control, conflict handling, and structured approval workflows.

---

## Problem & Solution

### The Problem
Organizations face significant administrative overhead, high replacement costs, and operational friction due to poor tracking of physical assets and shared resources:
- **Manual Overhead & Errors**: Reliance on spreadsheets, paper logs, or decentralized emails leads to data duplication and lack of real-time status.
- **Double Allocations**: Lack of real-time control allows multiple staff members to claim the same device, causing scheduling conflicts and lost productivity.
- **Resource Overlaps**: Shared assets, such as meeting rooms or project vehicles, suffer booking overlaps and lack validation.
- **Untracked Maintenance**: Maintenance requests are handled ad-hoc without formal manager approval or technician assignment, leading to unrecorded repairs.
- **Inadequate Audits**: Discrepancies between physical inventory and system records go unnoticed without audit cycles and discrepancy reports.

### The Solution: AssetFlow
AssetFlow addresses these challenges through a centralized system focusing on ERP workflows:
- **Centralized Master Data**: Provides structured modules for locations, asset categories, and departments to organize all organizational resources.
- **Conflict-Handling Allocations**: The system prevents double-allocations. If a resource is already allocated, the system blocks the action and provides a **Transfer Request** workflow to hand over ownership cleanly.
- **Time-Slot Resource Booking**: Real-time calendar schedule validation rejects booking requests that overlap with existing bookings.
- **Authorized Maintenance Workflows**: Repair tickets route from `Pending` through `Approved`, flipping the asset to `Under Maintenance` and then back to `Available` upon resolution.
- **Scheduled Audits**: Enables administrators to define location/department-specific audit cycles, assign auditors, flag discrepancies, and update the database accordingly upon closing the cycle.

---

## Tech Stack & Key Technologies Used

### Frontend (Client)
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit & React Redux
- **API Client**: Axios
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod Resolvers
- **Visuals & Charts**: Lucide React, Recharts

### Backend (Server)
- **Runtime**: Node.js & Express.js
- **Database Layer**: PostgreSQL & Prisma ORM
- **Security & Authentication**: JSON Web Tokens (JWT), Passport.js (Local & Google OAuth 2.0), bcryptjs
- **Validation**: Zod

---

## Key Features

1. **Dashboard & KPIs**: View current operational metrics (assets available, allocated, pending transfers, upcoming returns, and active bookings) with quick action shortcuts.
2. **Realistic Authentication**: Secure signup and login flow. Default registrations create employee accounts; Admin promotes employees to Department Heads or Asset Managers in the Directory.
3. **Organization Setup (Admin Only)**:
   - **Department Management**: Establish corporate departments, assign parent associations, and select heads.
   - **Asset Category Management**: Create hardware categories and assign custom attributes.
   - **Employee Directory**: Manage roles, statuses, and profiles.
4. **Asset Registry**: Track assets with auto-generated tags, upload documentation/photos, search and filter by category/location, and view complete history logs.
5. **Asset Allocation & Transfers**: Assign assets to employees or departments. Submit and track transfer requests.
6. **Resource Booking**: Reserve shared resources by selecting time slots with conflict-checking.
7. **Maintenance Management**: Log tickets with priority, description, and status.
8. **Structured Asset Audits**: Run location/department audits, assign auditors, and auto-generate discrepancy reports.

---

## Local Setup & Installation

### Prerequisites
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: Local running instance or cloud database

### 1. Install Dependencies
At the root workspace directory, run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy template configuration files:
```bash
# Copy root env layout
cp .env.example .env

# Copy client env configuration
cp client/.env.example client/.env

# Copy server env configuration
cp server/.env.example server/.env
```
Ensure the connection string is correctly defined in `DATABASE_URL` in `server/.env`.

### 3. Initialize Database
Prepare the PostgreSQL database and run schema generation:
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed initial database records
npm run prisma:seed
```

### 4. Running the Development Servers
Run both client and server concurrently:
```bash
npm run dev
```
- **Client (Vite)**: runs at [http://localhost:3000](http://localhost:3000)
- **Server (Express)**: runs at [http://localhost:5000](http://localhost:5000)

---

## Project Architecture

```
/ (Workspace Root)
├── client/                 # React Frontend
│   ├── src/
│   │   ├── app/            # Global state stores
│   │   ├── features/       # Feature-based pages/controllers (16 modules)
│   │   ├── layouts/        # Layout definitions (Main, Auth)
│   │   └── styles/         # Tailwind CSS stylesheets
├── server/                 # Express Backend
│   ├── prisma/             # Schema definitions and database seeds
│   ├── src/
│   │   ├── config/         # System settings (env, passport, database)
│   │   ├── middlewares/    # Security, auth, and validation filters
│   │   ├── modules/        # Modular router services (16 modules)
│   │   └── routes/         # Unified router mapping (v1 & v2 structure)
│   └── tests/              # Jest test cases (unit, integration, e2e)
```

---

## Developers Team

| Developer Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Ashish Gokani** | Full Stack | Architecture design, API development, state management, and Prisma integration |
| **Harmin Vekariya** | Full Stack | UI/UX implementation, routing, database management, and deployment pipelines |
| **Ashish Vekariya** | Backend | Core API logic, validation schemas, secure authentication, and middleware configuration |
| **Krish Solanki** | Frontend | Responsive styling, Framer Motion/custom animations, form validation, and dashboards |
