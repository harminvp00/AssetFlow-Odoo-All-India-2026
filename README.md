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

## 🐳 Docker Note
> [!NOTE]
> As explicitly requested, Docker configuration and deployment options (e.g. `Dockerfile`, `docker-compose.yml`) **have been omitted** to simplify local development setups.

---

## 📋 Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local running instance or cloud database

---

## 🚀 Installation & Local Setup

> [!IMPORTANT]
> **Always run package installation and development commands at the WORKSPACE ROOT directory**. Do not run `npm install` inside the individual `client/` or `server/` subfolders. AssetFlow uses npm Workspaces to manage, coordinate, and link dependencies globally at the root.

### 1. Install Dependencies
At the **workspace root** directory, run:
```bash
npm install
```
This automatically downloads and links all shared, backend, and frontend dependencies.

### 2. Configure Environment Variables
You only need to maintain **a single `.env` file at the workspace root**. Both the frontend (Vite) and the backend (Express) are pre-configured to read their environment parameters from this file:

```bash
# At the workspace root, copy the template file to .env
cp .env.example .env
```
Open the newly created `.env` file at the root and fill in your local credentials (e.g., your PostgreSQL `DATABASE_URL`).

### 3. Generate Prisma DB client bindings
Run the Prisma generate script from the **workspace root**:
```bash
npm run prisma:generate
```

### 4. Optional Database migrations & seeds
If you have your PostgreSQL database server running and credentials set up in `.env`, run:
```bash
# Push schema migrations
npm run prisma:migrate --name init_schema

# Seed initial system database rows
npm run prisma:seed
```
*Note: If your local database is not yet running, the server will log a database warning on boot but will remain alive for UI and frontend development.*

### 5. Running the Development Servers
Start both the React client and Express server concurrently from the **workspace root**:
```bash
npm run dev
```
- **Client (Vite)**: runs at [http://localhost:3000](http://localhost:3000)
- **Server (Express)**: runs at [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Architecture

```
/ (Workspace Root)
├── client/                 # React Frontend
│   ├── src/
│   │   ├── app/            # Global state stores
│   │   ├── features/       # Feature-based pages/controllers (17 modules)
│   │   ├── layouts/        # Layout definitions (Main, Auth)
│   │   └── styles/         # Tailwind CSS v4 stylesheets
├── server/                 # Express Backend
│   ├── prisma/             # Schema definitions and database seeds
│   ├── src/
│   │   ├── config/         # System settings (env, passport, database)
│   │   ├── middlewares/    # Security, auth, and validation filters
│   │   ├── modules/        # Modular router services (17 modules)
│   │   └── routes/         # Unified router mapping (v1 & v2 structure)
│   └── tests/              # Jest test cases (unit, integration, e2e)
├── docs/                   # System design, API details, database models
└── scripts/                # Scaffolding and build scripts
```

---

## 📜 Development Scripts Checklist (Run at Root)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run frontend and backend servers concurrently |
| `npm run build` | Build production bundles for both client & server |
| `npm run lint` | Run ESLint checks across client and server |
| `npm run format` | Format files using Prettier |
| `npm run prisma:generate` | Regenerate Prisma Client declarations |
| `npm run prisma:migrate` | Run PostgreSQL migration scripts |
| `npm run prisma:seed` | Seed database with initial setup data |
| `npm test` | Run server unit and integration test suites |
