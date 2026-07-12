# AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a clean-architecture Enterprise Asset & Resource Management System designed for the **Odoo All India Hackathon**. This project establishes an enterprise-grade scaffolding featuring a modular backend architecture and a feature-based frontend layout.

---

## 👥 Developers Team

- **Ashish Gokani** — Lead Backend Architect
- **Ashish Vekariya** — Full Stack Engineer
- **Krish Solanki** — Frontend UI/UX Engineer
- **Harmin Vekariya** — DevOps & Database Administrator

---

## 🛠️ Tech Stack & Key Technologies

### Frontend (Client)
- **Framework**: React (Vite-powered, JavaScript)
- **Styling**: Tailwind CSS v4 (native CSS configuration, custom variables)
- **State Management**: Redux Toolkit (global feature slice registry)
- **Routing**: React Router DOM (protected layout-based layouts)
- **Data Fetching**: Axios & React Query (cached server states)
- **Form Handling & Validation**: React Hook Form & Zod
- **Visuals & UI**: Lucide React (Icons), Recharts (Analytics charts), Framer Motion (Animations), React Hot Toast (Toasts)
- **Utility**: DayJS (Time manipulation)

### Backend (Server)
- **Runtime**: Node.js & Express.js (Modular router mapping)
- **Database Layer**: PostgreSQL & Prisma ORM (Type-safe client)
- **Security**: Passport Google OAuth, JWT with refresh tokens inside HttpOnly cookies, Helmet, CORS, Express Rate Limit, bcrypt
- **Middlewares**: Compression, Morgan (logging), Multer & Cloudinary (File processing)

---



## 📋 Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local running instance or cloud database

---

## 🚀 Installation & Local Setup

### 1. Initialize and install dependencies
At the root workspace directory, run:
```bash
npm install
```
This automatically bootstraps and installs all shared, backend, and frontend dependencies utilizing **npm workspaces**.

### 2. Configure Environment Variables
Copy env files to configure secrets, connections, and API paths:
```bash
# Copy root env layout
cp .env.example .env

# Copy client env configuration
cp client/.env.example client/.env

# Copy server env configuration
cp server/.env.example server/.env
```
Ensure you set your database access string under `DATABASE_URL` in `server/.env`.

### 3. Initialize Prisma Database Client
Prepare the PostgreSQL database connection and run schema code generation:
```bash
# Generate Prisma Client
npm run prisma:generate

# Build / Push database tables and run migration
npm run prisma:migrate --name init_schema

# Seed initial admin account
npm run prisma:seed
```

### 4. Running the Development Servers
Run both client and server concurrently from the root directory:
```bash
npm run dev
```
- **Client (Vite)**: runs at [http://localhost:3000](http://localhost:3000) (requests proxies automatically to the server)
- **Server (Express)**: runs at [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Architecture

```
/ (Workspace Root)
├── client/                 # React Frontend
│   ├── src/
│   │   ├── app/            # Global state stores
│   │   ├── features/       # Feature-based pages/controllers (16 modules)
│   │   ├── layouts/        # Layout definitions (Main, Auth)
│   │   └── styles/         # Tailwind CSS v4 stylesheets
├── server/                 # Express Backend
│   ├── prisma/             # Schema definitions and database seeds
│   ├── src/
│   │   ├── config/         # System settings (env, passport, database)
│   │   ├── middlewares/    # Security, auth, and validation filters
│   │   ├── modules/        # Modular router services (16 modules)
│   │   └── routes/         # Unified router mapping (v1 & v2 structure)
│   └── tests/              # Jest test cases (unit, integration, e2e)
├── docs/                   # System design, API details, database models
└── scripts/                # Scaffolding and build scripts
```

---

## 📜 Development Scripts Checklist

| Command | Workspace | Description |
| :--- | :--- | :--- |
| `npm run dev` | Root | Run frontend and backend servers concurrently |
| `npm run build` | Root | Build production bundles for both client & server |
| `npm run lint` | Root | Run ESLint checks across client and server |
| `npm run format` | Root | Format files using Prettier |
| `npm run prisma:generate` | Server | Regenerate Prisma Client declarations |
| `npm run prisma:migrate` | Server | Run PostgreSQL migration scripts |
| `npm run prisma:seed` | Server | Seed database with initial setup data |
