# AssetFlow - Exhaustive Technical Development Plan & Complete API/UI Specification

This document is the master specification for the **AssetFlow** Enterprise Asset & Resource Management System. It contains the complete architectural blueprints, full database schema documentation, exhaustive API contracts (request, success response, error response, and Prisma query definitions) for all modules, and detailed frontend state and page blueprints matching all 10 mockups.

---

## 👥 Team Assignment Matrix & Roles

To ensure parallel development and quick delivery during the hackathon, we divide responsibilities between the 4 team members:

| Role | Developer | Main Focus Areas |
| :--- | :--- | :--- |
| **Backend 1 (BD1)** | **Ashish Gokani** | Base schema, authentication, file attachments, directory master records (categories, assets, departments, locations, employees). |
| **Backend 2 (BD2)** | **Ashish Vekariya** | Active transactional flows: allocations, return check-ins, transfer workflows, resource bookings, maintenance Kanban, auditing, logs & alerts. |
| **Frontend 1 (FD1)** | **Harmin Vekariya** | UI shell, routing guards, React hook form validators, login/signup, admin master grids, and the search/filter asset directory. |
| **Frontend 2 (FD2)** | **Krish Solanki** | Interactive calendar bookings, transfer logs, maintenance Kanban UI, audit verification forms, notifications hub, and dashboards. |

---

## 🏛️ System Architecture & Folder Layouts

### Backend (Server) Clean Architecture Flow
Every request follows a strict one-way lifecycle. Logic is isolated into layers to prevent circular dependencies and state leakage.

```
Request ➔ Middleware Stack (Auth, Role, Zod Validation) ➔ Express Router ➔ Controller (HTTP) ➔ Service (Business Logic) ➔ Repository (Prisma Client) ➔ Database (PostgreSQL)
```

#### Directory Layout per Module (`server/src/modules/<module-name>/`)
*   `index.js`: Barrel export exposing the router to the main application middleware registry (`server/src/routes/v1.js`).
*   `<module>.routes.js`: Maps endpoints, paths, HTTP verbs, and mounts the authorization/validation middleware stack.
*   `<module>.controller.js`: Exclusively handles HTTP input parsing (path parameters, query variables, header values) and formats the output via mappers. Do not put business logic here.
*   `<module>.service.js`: The central container of business rules, validation assertions, conflict handling, and state machine updates.
*   `<module>.repository.js`: Exposes data retrieval and writing routines using the `prisma` client.
*   `<module>.validation.js`: Zod schema definitions validating input payloads.
*   `<module>.mapper.js`: Transforms raw Prisma entities into formatted Data Transfer Objects (DTOs), stripping secure or unneeded database fields (such as password hashes).
*   `<module>.constants.js`: Houses key configuration constants, status enums, limits, and roles.
*   `<module>.messages.js`: Exposes centralized success/error response messages.

---

### Frontend (Client) Feature-Based Architecture Flow
The React application matches the backend modularity. Cross-module calls are restricted to public barrel exports.

#### Directory Layout per Feature (`client/src/features/<feature-name>/`)
*   `index.js`: Mounts and exports root pages, public utilities, and feature Redux reducers.
*   `api/`: Defines Axios calls wrapped in React Query hooks (caching, loading states, error structures).
*   `components/`: Local reusable UI elements (e.g. `AssetCard`, `AuditChecklistRow`).
*   `hooks/`: Custom state management wrappers specific to the feature.
*   `pages/`: The router-level views mapped directly to layouts and menus.
*   `store/`: Redux Toolkit slice definitions, holding global states (e.g. active checkout trackers).
*   `validation/`: Zod form validators matching backend validation expectations.
*   `constants/`: Feature-wide static configs, lists, and status colors.

---

## 🗄️ Database Schema Design (`schema.prisma`)
The system schema is initialized with the following structure:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  MANAGER
  DEPARTMENT_HEAD
  EMPLOYEE
}

model User {
  id                 String               @id @default(uuid())
  email              String               @unique
  name               String
  password           String
  role               Role                 @default(EMPLOYEE)
  status             Boolean              @default(true)
  departmentId       String?
  department         Department?          @relation("DepartmentEmployees", fields: [departmentId], references: [id])
  headOfDepartment   Department?          @relation("DepartmentHead")
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  
  allocations        Allocation[]         @relation("EmployeeAllocations")
  allocatedBy        Allocation[]         @relation("ManagerAllocations")
  sentTransfers      TransferRequest[]    @relation("SourceEmployee")
  receivedTransfers  TransferRequest[]    @relation("TargetEmployee")
  approvedTransfers  TransferRequest[]    @relation("TransferApprover")
  bookings           ResourceBooking[]
  raisedMaintenance  MaintenanceRequest[] @relation("RaisedBy")
  approvedMaintenance MaintenanceRequest[] @relation("ApprovedBy")
  auditsAssigned     AuditCycle[]         @relation("AuditorCycles")
  auditRecords       AuditRecord[]
  activityLogs       ActivityLog[]

  @@map("users")
}

model Department {
  id               String            @id @default(uuid())
  name             String            @unique
  status           Boolean           @default(true)
  parentDepartmentId String?
  parentDepartment Department?       @relation("DepartmentHierarchy", fields: [parentDepartmentId], references: [id])
  subDepartments   Department[]      @relation("DepartmentHierarchy")
  headId           String?           @unique
  head             User?             @relation("DepartmentHead", fields: [headId], references: [id])
  employees        User[]            @relation("DepartmentEmployees")
  assets           Asset[]
  allocations      Allocation[]
  fromTransfers    TransferRequest[] @relation("FromDepartment")
  toTransfers      TransferRequest[] @relation("ToDepartment")
  auditCycles      AuditCycle[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@map("departments")
}

model Location {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  status      Boolean      @default(true)
  assets      Asset[]
  auditCycles AuditCycle[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("locations")
}

model AssetCategory {
  id             String   @id @default(uuid())
  name           String   @unique
  schemaConfig   Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  assets         Asset[]

  @@map("asset_categories")
}

enum AssetCondition {
  NEW
  GOOD
  FAIR
  POOR
}

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  RESERVED
  UNDER_MAINTENANCE
  LOST
  RETIRED
  DISPOSED
}

model Asset {
  id                 String               @id @default(uuid())
  tag                String               @unique
  name               String
  serialNumber       String               @unique
  acquisitionDate    DateTime
  acquisitionCost    Decimal              @db.Decimal(12, 2)
  condition          AssetCondition       @default(NEW)
  status             AssetStatus          @default(AVAILABLE)
  locationId         String
  location           Location             @relation(fields: [locationId], references: [id])
  categoryId         String
  category           AssetCategory        @relation(fields: [categoryId], references: [id])
  departmentId       String?
  department         Department?          @relation(fields: [departmentId], references: [id])
  isSharedBookable   Boolean              @default(false)
  photoUrl           String?
  documentUrls       String[]
  dynamicFields      Json?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  allocations        Allocation[]
  transfers          TransferRequest[]
  bookings           ResourceBooking[]
  maintenanceRequests MaintenanceRequest[]
  auditRecords       AuditRecord[]
  historyLogs        ActivityLog[]

  @@map("assets")
}

model Allocation {
  id                 String     @id @default(uuid())
  assetId            String
  asset              Asset      @relation(fields: [assetId], references: [id])
  employeeId         String?
  employee           User?      @relation("EmployeeAllocations", fields: [employeeId], references: [id])
  departmentId       String?
  department         Department? @relation(fields: [departmentId], references: [id])
  allocatedById      String
  allocatedBy        User       @relation("ManagerAllocations", fields: [allocatedById], references: [id])
  expectedReturnDate DateTime?
  actualReturnDate   DateTime?
  status             String     @default("ACTIVE")
  checkInNotes       String?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@map("allocations")
}

model TransferRequest {
  id                String      @id @default(uuid())
  assetId           String
  asset             Asset       @relation(fields: [assetId], references: [id])
  fromEmployeeId    String?
  fromEmployee      User?       @relation("SourceEmployee", fields: [fromEmployeeId], references: [id])
  toEmployeeId      String?
  toEmployee        User?       @relation("TargetEmployee", fields: [toEmployeeId], references: [id])
  fromDepartmentId  String?
  fromDepartment    Department? @relation("FromDepartment", fields: [fromDepartmentId], references: [id])
  toDepartmentId    String?
  toDepartment      Department? @relation("ToDepartment", fields: [toDepartmentId], references: [id])
  requestedById     String
  approvedById      String?
  approvedBy        User?       @relation("TransferApprover", fields: [approvedById], references: [id])
  status            String      @default("PENDING")
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@map("transfer_requests")
}

model ResourceBooking {
  id           String   @id @default(uuid())
  assetId      String
  asset        Asset    @relation(fields: [assetId], references: [id])
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  startTime    DateTime
  endTime      DateTime
  status       String   @default("UPCOMING")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("resource_bookings")
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MaintenanceStatus {
  PENDING
  APPROVED
  REJECTED
  IN_PROGRESS
  RESOLVED
}

model MaintenanceRequest {
  id               String              @id @default(uuid())
  assetId          String
  asset            Asset               @relation(fields: [assetId], references: [id])
  raisedById       String
  raisedBy         User                @relation("RaisedBy", fields: [raisedById], references: [id])
  approvedById     String?
  approvedBy       User?               @relation("ApprovedBy", fields: [approvedById], references: [id])
  technicianId     String?
  issueDescription String
  priority         MaintenancePriority @default(MEDIUM)
  status           MaintenanceStatus   @default(PENDING)
  photoUrl         String?
  resolutionNotes  String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@map("maintenance_requests")
}

enum AuditStatus {
  DRAFT
  ACTIVE
  COMPLETED
}

enum VerificationStatus {
  VERIFIED
  MISSING
  DAMAGED
}

model AuditCycle {
  id                 String       @id @default(uuid())
  name               String
  scopeDepartmentId  String?
  scopeDepartment    Department?  @relation(fields: [scopeDepartmentId], references: [id])
  scopeLocationId    String?
  scopeLocation      Location?    @relation(fields: [scopeLocationId], references: [id])
  startDate          DateTime
  endDate            DateTime
  status             AuditStatus  @default(DRAFT)
  auditors           User[]       @relation("AuditorCycles")
  records            AuditRecord[]
  discrepancyReport  Json?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@map("audit_cycles")
}

model AuditRecord {
  id           String             @id @default(uuid())
  auditCycleId String
  auditCycle   AuditCycle         @relation(fields: [auditCycleId], references: [id])
  assetId      String
  asset        Asset              @relation(fields: [assetId], references: [id])
  auditorId    String
  auditor      User               @relation(fields: [auditorId], references: [id])
  status       VerificationStatus @default(VERIFIED)
  notes        String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  @@map("audit_records")
}

model ActivityLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  assetId   String?
  asset     Asset?   @relation(fields: [assetId], references: [id])
  action    String
  details   Json
  createdAt DateTime @default(now())

  @@map("activity_logs")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?
  type      String   @default("INFO")
  createdAt DateTime @default(now())

  @@map("notifications")
}
```

---

## 🛡️ Core Shared Middlewares & Route Rules

### 1. JWT Authentication Handler (`authMiddleware`)
Extracts Bearer Token from headers, validates signatures against `JWT_SECRET`, checks if user is `Active`, and appends the payload to `req.user`.
*   **Failed checks**: Exits with HTTP 401 Unauthorized (`"jwt expired"` or `"access token missing"`).

### 2. Authorization Role Handler (`roleMiddleware(...roles)`)
Checks if `req.user.role` matches the expected endpoints parameter options.
*   **Failed checks**: Exits with HTTP 403 Forbidden (`"Access Denied: Insufficient Permissions"`).

### 3. Payload Validator (`validationMiddleware(schema)`)
Executes schema validation parsing against incoming `req.body`, `req.query`, or `req.params` values.
*   **Failed checks**: Returns HTTP 400 Bad Request with structural field errors.

---

## 📋 Comprehensive Module Specs, API Contracts & UI Blueprints

---

### Module 1: Authentication (`auth`)
*Focuses on user login, token rotations, and registration limitations.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines public routes.
*   `controller.js`: Manages login session generation and cookies.
*   `service.js`: Formulates user validations and maps hash verification.
*   `validation.js`: Restricts fields for signup and login.

#### 🔌 API Specifications

##### `POST /api/v1/auth/signup`
*   **Description**: Registers employees. Force-injects role `EMPLOYEE`.
*   **Zod Request validation**:
    ```javascript
    const signup = z.object({
      body: z.object({
        email: z.string().email('Invalid format').min(5),
        password: z.string().min(8, 'Password must be 8+ characters'),
        name: z.string().min(2, 'Name is too short')
      })
    });
    ```
*   **Success Response (HTTP 201 Created)**:
    ```json
    {
      "success": true,
      "message": "Employee registration completed successfully.",
      "data": {
        "id": "u-uuid-1111",
        "email": "employee@company.com",
        "name": "Jane Doe",
        "role": "EMPLOYEE"
      }
    }
    ```
*   **Error Response (HTTP 409 Conflict)**:
    ```json
    {
      "success": false,
      "message": "Registration failed. Email is already registered."
    }
    ```
*   **Database Query**:
    ```javascript
    await prisma.user.create({ data: { email, password: hashedPassword, name, role: 'EMPLOYEE' } });
    ```

##### `POST /api/v1/auth/login`
*   **Zod Request validation**:
    ```javascript
    const login = z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1)
      })
    });
    ```
*   **Success Response (HTTP 200 OK)**:
    *   *Sets cookie `refreshToken` as HttpOnly, Secure, SameSite=Strict.*
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "data": {
        "token": "eyJhbGciOi...",
        "user": {
          "id": "u-uuid-9999",
          "email": "admin@assetflow.com",
          "name": "System Admin",
          "role": "ADMIN"
        }
      }
    }
    ```
*   **Error Response (HTTP 401 Unauthorized)**:
    ```json
    {
      "success": false,
      "message": "Invalid credentials provided."
    }
    ```

#### 🎨 Frontend UI Specification (Screen 1)
*   **Page**: `client/src/features/auth/pages/LoginPage.jsx`
*   **Layout**: Centered card component, AF logo, pre-configured form wrapper. Input components: email (placeholder: `name@company.com`), password (placeholder: `**********`). Includes forgot password redirection link. A notice card at the bottom displays: *"Sign up creates an employee account; admin roles assigned later."*
*   **State & Validation**: React Hook Form using `validation/auth.js` schema. Redux Auth Slice:
    ```javascript
    const initialState = { user: null, token: null, isAuth: false };
    ```
*   **Testing Flow**: Enter standard credentials, assert routing to `/dashboard` works. Enter wrong credentials and assert error display shows.

---

### Module 2: Dashboard/Home Screen (`dashboard`)
*Aggregates real-time metrics cards, alerts for overdue items, and recent activity logs.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines dashboard fetch routes.
*   `controller.js`: Orchestrates queries and handles role routing.
*   `service.js`: Runs database aggregations.

#### 🔌 API Specifications

##### `GET /api/v1/dashboard/kpis`
*   **Access**: Authenticated users.
*   **Description**: Pulls system totals based on role rules.
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "availableCount": 128,
        "allocatedCount": 76,
        "maintenanceCount": 4,
        "activeBookingsCount": 9,
        "pendingTransfersCount": 3,
        "upcomingReturnsCount": 12,
        "overdueReturnsCount": 3
      }
    }
    ```
*   **Database Query**:
    ```javascript
    const availableCount = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const allocatedCount = await prisma.asset.count({ where: { status: 'ALLOCATED' } });
    const overdueReturnsCount = await prisma.allocation.count({ where: { status: 'ACTIVE', expectedReturnDate: { lt: new Date() } } });
    ```

##### `GET /api/v1/dashboard/activity`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "log-1",
          "message": "Laptop AF-0114 - allocated to Priya Shah - IT Dept",
          "createdAt": "2026-07-12T10:00:00Z"
        }
      ]
    }
    ```

#### 🎨 Frontend UI Specification (Screen 2)
*   **Page**: `client/src/features/dashboard/pages/DashboardPage.jsx`
*   **Layout**: Displays 6 KPI card modules (Available, Allocated, Under Maintenance, Active Bookings, Pending Transfers, Upcoming Returns) and a warning banner: *"X assets overdue for return - flagged for follow-up"*. Below, displays quick action buttons (+ Register Asset, Book Resource, Raise Request) and a feed of recent activity logs.
*   **Redux Slice**:
    ```javascript
    const initialState = { kpis: {}, activities: [], loading: false };
    ```
*   **Testing Flow**: Verify KPI cards fetch and render numbers. Verify clicking "+ Register Asset" redirects managers to `/assets`.

---

### Module 3: Employee Management (`employees`)
*Maintains directory and processes role promotions.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines list and promotion endpoints.
*   `controller.js`: Pulls route parameters and body requests.
*   `service.js`: Restricts promotions to Admins and updates DB state.

#### 🔌 API Specifications

##### `GET /api/v1/employees`
*   **Access**: Authenticated users.
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "u-uuid-2222",
          "name": "Aditi Rao",
          "email": "aditi@company.com",
          "role": "DEPARTMENT_HEAD",
          "department": "Engineering",
          "status": true
        }
      ]
    }
    ```

##### `PATCH /api/v1/employees/:id/role`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "role": "DEPARTMENT_HEAD",
      "departmentId": "dept-uuid-001"
    }
    ```
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "message": "Employee role promoted successfully.",
      "data": { "id": "u-uuid-2222", "role": "DEPARTMENT_HEAD", "departmentId": "dept-uuid-001" }
    }
    ```
*   **Database Query**:
    ```javascript
    await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role, departmentId: req.body.departmentId }
    });
    ```

#### 🎨 Frontend UI Specification (Screen 3 - Employee Tab)
*   **Page**: `client/src/features/employees/components/EmployeeTab.jsx`
*   **Layout**: Searchable directory displaying name, email, department, role, and active status. Promoted role changes trigger select menus (Admin, Manager, Department Head, Employee).
*   **Testing Flow**: Log in as Admin, change an employee's role, and assert the UI updates immediately. Confirm non-admin users cannot see the selector.

---

### Module 4: Department Management (`departments`)
*Coordinates organizational hierarchy and head assignments.*

#### 📁 Backend Directory Structures
*   `routes.js`: Maps CRUD paths.
*   `controller.js`: Passes requests to service.
*   `service.js`: Checks parent-child department constraints.

#### 🔌 API Specifications

##### `POST /api/v1/departments`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "name": "Field Ops (East)",
      "parentDepartmentId": "dept-uuid-003",
      "headId": "u-uuid-3333"
    }
    ```
*   **Success Response (HTTP 201 Created)**:
    ```json
    {
      "success": true,
      "message": "Department created successfully.",
      "data": { "id": "d-new-123", "name": "Field Ops (East)", "parentDepartmentId": "dept-uuid-003", "status": true }
    }
    ```

##### `GET /api/v1/departments`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "id": "d-1", "name": "Engineering", "head": { "name": "Aditi Rao" }, "parentDept": null, "status": true }
      ]
    }
    ```

#### 🎨 Frontend UI Specification (Screen 3 - Departments Tab)
*   **Page**: `client/src/features/departments/components/DepartmentsTab.jsx`
*   **Layout**: Nested tree view table. Columns: Department, Head, Parent Dept, Status (Active/Inactive pill). Top right contains a "+ Add" button that opens a creation drawer.
*   **Testing Flow**: Create a department with a parent department, verify it renders correctly in the hierarchy.

---

### Module 5: Location Configuration (`locations`)
*Maintains physical geolocations of assets.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines CRUD endpoints.
*   `service.js`: Ensures locations are not deleted if assets are currently mapped to them.

#### 🔌 API Specifications

##### `GET /api/v1/locations`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "id": "loc-1", "name": "HQ Floor 2", "description": "Corporate headquarters", "status": true }
      ]
    }
    ```

##### `POST /api/v1/locations`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "name": "Warehouse",
      "description": "Primary storage facility"
    }
    ```
*   **Database Query**:
    ```javascript
    await prisma.location.create({ data: { name, description } });
    ```

#### 🎨 Frontend UI Specification
*   **Page**: `client/src/features/locations/components/LocationsList.jsx`
*   **Layout**: Simple grid listing locations. Includes inline toggles to switch location status.
*   **Testing Flow**: Verify that creating a duplicate location returns a validation error.

---

### Module 6: Asset Category Management (`categories`)
*Coordinates classifications and dynamic field schema configurations.*

#### 📁 Backend Directory Structures
*   `routes.js`: Maps category endpoints.
*   `service.js`: Validates dynamic schema JSON objects.

#### 🔌 API Specifications

##### `POST /api/v1/categories`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "name": "Electronics",
      "schemaConfig": {
        "warrantyPeriod": "number",
        "macAddress": "string"
      }
    }
    ```
*   **Success Response (HTTP 201 Created)**:
    ```json
    {
      "success": true,
      "data": { "id": "cat-1", "name": "Electronics", "schemaConfig": { "warrantyPeriod": "number", "macAddress": "string" } }
    }
    ```

#### 🎨 Frontend UI Specification (Screen 3 - Categories Tab)
*   **Page**: `client/src/features/categories/components/CategoriesTab.jsx`
*   **Layout**: Card grid displaying category metadata schemas. Dynamic key-value inputs allow admins to add schema configuration fields.
*   **Testing Flow**: Create category "Vehicles" with field `"licensePlate": "string"`. Verify it saves successfully.

---

### Module 7: Asset Registration & Directory (`assets`)
*Tracks core inventory details and exposes historical search options.*

#### 📁 Backend Directory Structures
*   `routes.js`: Maps registration and searching routes.
*   `service.js`: Validates dynamic schema payloads against custom category configs.

#### 🔌 API Specifications

##### `GET /api/v1/assets`
*   **Access**: Authenticated users.
*   **Query Parameters**: `search`, `category`, `status`, `departmentId`, `locationId`.
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "asset-1",
          "tag": "AF-0012",
          "name": "Dell Laptop",
          "category": "Electronics",
          "status": "ALLOCATED",
          "location": "Bengaluru"
        }
      ]
    }
    ```

##### `POST /api/v1/assets`
*   **Access**: `MANAGER` only.
*   **Request Body**:
    ```json
    {
      "name": "Projector",
      "serialNumber": "SN-PROJ-334",
      "acquisitionDate": "2026-07-01T00:00:00Z",
      "acquisitionCost": 800.00,
      "condition": "GOOD",
      "locationId": "loc-1",
      "categoryId": "cat-1",
      "isSharedBookable": true,
      "dynamicFields": {
        "warrantyPeriod": 12
      }
    }
    ```
*   **Validation Check (BD1)**: Check database for existing `serialNumber`. If it exists, throw a duplicate field warning.

#### 🎨 Frontend UI Specification (Screen 4)
*   **Page**: `client/src/features/assets/pages/AssetsPage.jsx`
*   **Layout**: Header containing a search bar (*Search by tag, serial, or QR code...*) and Category/Status/Department filters. Main screen displays a data table with columns: `Tag`, `Name`, `Category`, `Status` (color-coded badge), `Location`. Green `+ Register Asset` button launches the registration drawer.
*   **Testing Flow**: Input "AF-0062" in search bar, verify the table filters to show only the matching Projector.

---

### Module 8: Asset Attachments (`attachments`)
*Handles file uploads to Cloudinary storage.*

#### 📁 Backend Directory Structures
*   `routes.js`: Exposes upload endpoint.
*   `controller.js`: Mounts multer parsing middleware.

#### 🔌 API Specifications

##### `POST /api/v1/attachments/upload`
*   **Access**: `MANAGER` only.
*   **Request Format**: `multipart/form-data` with key `file`.
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "url": "https://res.cloudinary.com/cloud-name/image/upload/invoice.pdf"
      }
    }
    ```

#### 🎨 Frontend UI Specification
*   **Component**: `client/src/features/assets/components/FileUpload.jsx`
*   **Layout**: Drag-and-drop file upload zone. Shows progress bars and files list.
*   **Testing Flow**: Drop a PDF file, verify progress displays and file URL returns from the server.

---

### Module 9: Asset Checkout & Returns (`allocations`)
*Manages checkouts, check-ins, and double-allocation logic.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines checkout and return endpoints.
*   `service.js`: Runs double-allocation conflict validation.

#### 🔌 API Specifications

##### `POST /api/v1/allocations`
*   **Access**: `MANAGER` only.
*   **Request Body**:
    ```json
    {
      "assetId": "asset-uuid-1",
      "employeeId": "u-uuid-2",
      "expectedReturnDate": "2026-10-10T00:00:00Z"
    }
    ```
*   **Success Response (HTTP 201 Created)**:
    ```json
    {
      "success": true,
      "data": { "id": "alloc-1", "assetId": "asset-uuid-1", "employeeId": "u-uuid-2", "status": "ACTIVE" }
    }
    ```
*   **Conflict Response (HTTP 409 Conflict)**:
    ```json
    {
      "success": false,
      "message": "Already Allocated to Priya Shah (Engineering). Direct re-allocation is blocked."
    }
    ```

##### `PATCH /api/v1/allocations/:id/return`
*   **Access**: `MANAGER` only.
*   **Request Body**:
    ```json
    {
      "checkInNotes": "Returned with scratch on screen",
      "condition": "GOOD"
    }
    ```

#### 🎨 Frontend UI Specification (Screen 5)
*   **Page**: `client/src/features/allocations/pages/AllocationPage.jsx`
*   **Layout**: Displays pre-filled fields if conflict checkout occurs: pre-populated pre-holders, dropdown options to select targets, a checkout expected calendar, a textarea for reason, and check-in panels for returns.
*   **Testing Flow**: Try checking out an allocated asset, verify the warning banner appears instantly: *"Already Allocated to Priya shah (Engineering) Direct re-allocation is blocked - submit a transfer request below."*

---

### Module 10: Asset Transfer Requests (`transfers`)
*Handles ownership transfers.*

#### 📁 Backend Directory Structures
*   `routes.js`: Exposes transfer endpoints.
*   `service.js`: Updates active allocations upon transfer approvals.

#### 🔌 API Specifications

##### `POST /api/v1/transfers/request`
*   **Access**: Authenticated users.
*   **Request Body**:
    ```json
    {
      "assetId": "asset-uuid-1",
      "toEmployeeId": "u-uuid-3",
      "reason": "Change of team roles"
    }
    ```

##### `PATCH /api/v1/transfers/:id/respond`
*   **Access**: `MANAGER` or `DEPARTMENT_HEAD` only.
*   **Request Body**:
    ```json
    {
      "action": "APPROVED"
    }
    ```

#### 🎨 Frontend UI Specification
*   **Component**: `client/src/features/transfers/components/PendingTransfers.jsx`
*   **Layout**: List displaying pending transfer requests. Approve/Reject action buttons are available to authorized managers.
*   **Testing Flow**: Request transfer, verify it appears in the department manager's list. Approve it and confirm the asset's active allocation owner updates in the directory.

---

### Module 11: Resource Scheduling (`bookings`)
*Validates bookings for shared facilities/assets to prevent overlaps.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines booking schedules.
*   `service.js`: Runs date-time overlap database queries.

#### 🔌 API Specifications

##### `POST /api/v1/bookings`
*   **Access**: Authenticated users.
*   **Request Body**:
    ```json
    {
      "assetId": "asset-uuid-2",
      "startTime": "2026-07-07T09:30:00Z",
      "endTime": "2026-07-07T10:30:00Z"
    }
    ```
*   **Overlap Error Response (HTTP 422 Unprocessable Entity)**:
    ```json
    {
      "success": false,
      "message": "Conflict - slot is unavailable."
    }
    ```

#### 🎨 Frontend UI Specification (Screen 6)
*   **Page**: `client/src/features/bookings/pages/BookingsPage.jsx`
*   **Layout**: Interactive daily schedule grid. Booked slots are blocked. Attempting to book an overlapping slot displays a dashed red warning box: *"Requested 9:30 to 10:30 - conflict - slot is unavailable."*
*   **Testing Flow**: Book a room from 9 to 10. Attempt a second booking for the same room from 9:30 to 10:30, verify that the API blocks it and shows the warning.

---

### Module 12: Maintenance State Machine (`maintenance`)
*Coordinates repair pipelines using a Kanban board.*

#### 📁 Backend Directory Structures
*   `routes.js`: Exposes Kanban API paths.
*   `service.js`: Runs state transition checks and updates asset status.

#### 🔌 API Specifications

##### `GET /api/v1/maintenance`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "PENDING": [{"id": "m-1", "asset": {"tag": "AF-0062", "name": "Projector"}, "issueDescription": "Projector bulb not turning on"}],
        "APPROVED": [],
        "TECHNICIAN_ASSIGNED": [],
        "IN_PROGRESS": [],
        "RESOLVED": []
      }
    }
    ```

##### `PATCH /api/v1/maintenance/:id/respond`
*   **Request Body**:
    ```json
    {
      "status": "APPROVED"
    }
    ```
*   **Database Query**: If approved, automatically update the asset status:
    ```javascript
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'UNDER_MAINTENANCE' } });
    ```

#### 🎨 Frontend UI Specification (Screen 7)
*   **Page**: `client/src/features/maintenance/pages/MaintenancePage.jsx`
*   **Layout**: Kanban board displaying columns: `Pending`, `Approved`, `Technician Assigned`, `In Progress`, `Resolved`. Cards show the asset tag, issue summary, and technician assignment.
*   **Testing Flow**: Drag card from `Pending` to `Approved`. Verify that the asset status automatically changes to `UNDER_MAINTENANCE` in the main database table.

---

### Module 13: Scheduled Audit Cycles (`audits`)
*Coordinates inventory verification check cycles.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines audit configuration paths.
*   `service.js`: Checks cycle status and compiles discrepancy reports on close.

#### 🔌 API Specifications

##### `POST /api/v1/audits`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "name": "Q3 Audit",
      "scopeDepartmentId": "dept-1",
      "startDate": "2026-07-01T00:00:00Z",
      "endDate": "2026-07-15T00:00:00Z",
      "auditorIds": ["u-uuid-2", "u-uuid-3"]
    }
    ```

##### `POST /api/v1/audits/:cycleId/verify`
*   **Request Body**:
    ```json
    {
      "assetId": "asset-uuid-1",
      "status": "MISSING",
      "notes": "Desk clean"
    }
    ```

##### `PATCH /api/v1/audits/:id/close`
*   **Access**: `ADMIN` only.
*   **Description**: Closes cycle, compiles discrepancies, and updates asset statuses (e.g. `MISSING` ➔ `LOST`).

#### 🎨 Frontend UI Specification (Screen 8)
*   **Page**: `client/src/features/audits/pages/AuditDetailsPage.jsx`
*   **Layout**: Displays active audit cycle information and checklist. Columns: Asset, Expected Location, Verification status. Clicking `Missing` or `Damaged` highlights the selection in red/yellow. A summary box alert displays: *"X assets flagged - discrepancy report generated automatically"*.
*   **Testing Flow**: Mark a laptop as `MISSING` and click `Close audit cycle`. Verify that the laptop's status in the directory updates to `LOST`.

---

### Module 14: System Notifications (`notifications`)
*Sends alerts for overdue items, approvals, and reminders.*

#### 📁 Backend Directory Structures
*   `routes.js`: Exposes user notification paths.
*   `service.js`: Creates notifications triggered by events.

#### 🔌 API Specifications

##### `GET /api/v1/notifications`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "n-1",
          "title": "Laptop AF-0014 assigned",
          "message": "Laptop AF-0014 assigned to Priya Shah",
          "isRead": false,
          "createdAt": "2026-07-12T11:00:00Z"
        }
      ]
    }
    ```

#### 🎨 Frontend UI Specification (Screen 10)
*   **Page**: `client/src/features/notifications/pages/NotificationsPage.jsx`
*   **Layout**: Notification list filterable by tabs: `All`, `Alerts`, `Approvals`, `Bookings`. Items show color-coded indicator dots and relative timestamps.
*   **Testing Flow**: Click a notification item and verify that it is marked as read and the indicator dot disappears.

---

### Module 15: Analytics & Custom Reports (`reports`)
*Provides visual utilization metrics, frequency charts, and export actions.*

#### 📁 Backend Directory Structures
*   `routes.js`: Defines report retrieval paths.
*   `service.js`: Computes analytics data.

#### 🔌 API Specifications

##### `GET /api/v1/reports/utilization`
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "department": "Engineering", "utilizationRate": 85 }
      ]
    }
    ```

#### 🎨 Frontend UI Specification (Screen 9)
*   **Page**: `client/src/features/reports/pages/ReportsPage.jsx`
*   **Layout**: Dashboard showing a Recharts Bar Chart (*Utilization by department*) and Line Chart (*Maintenance Frequency*). Exposes tables listing *Most Used Assets*, *Idle Assets*, and *Assets due for service/retirement*. Includes a button to export CSV files.
*   **Testing Flow**: Click "Export Report" and assert that a CSV file download is initiated.

---

### Module 16: System Settings (`settings`)
*Coordinates system configs.*

#### 📁 Backend Directory Structures
*   `routes.js`: Maps config paths.
*   `service.js`: Caches configuration values.

#### 🔌 API Specifications

##### `PATCH /api/v1/settings`
*   **Access**: `ADMIN` only.
*   **Request Body**:
    ```json
    {
      "maxBookingHours": 4
    }
    ```

#### 🎨 Frontend UI Specification
*   **Page**: `client/src/features/settings/pages/SettingsPage.jsx`
*   **Layout**: Form fields to customize global parameters.
*   **Testing Flow**: Update setting, verify configuration changes are applied immediately.

---

### Module 17: Audit Logs Ledger (`logs`)
*Monages compliance audit trails.*

#### 📁 Backend Directory Structures
*   `routes.js`: Exposes search/filter query endpoints.

#### 🔌 API Specifications

##### `GET /api/v1/logs`
*   **Access**: `ADMIN` only.
*   **Success Response (HTTP 200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "id": "log-1", "user": "Admin", "action": "PROMOTE_USER", "details": { "target": "Raj" } }
      ]
    }
    ```

#### 🎨 Frontend UI Specification
*   **Page**: `client/src/features/logs/pages/LogsPage.jsx`
*   **Layout**: Read-only log table with query filters.
*   **Testing Flow**: Perform a role promotion, verify that a log entry is written immediately.

---

## 🛠️ Complete Verification & Daily Commands Checklist

Run these commands daily to ensure formatting, validation, and schema generation are in sync:

1. **Format Code**: Ensure your files match style rules before pushing:
   ```cmd
   npm run format
   ```
2. **Lint check**: Run ESLint checks before committing:
   ```cmd
   npm run lint
   ```
3. **Generate Prisma Client**: Run this after any schema change:
   ```cmd
   npm run prisma:generate
   ```
4. **Push database schema updates**:
   ```cmd
   npm run prisma:migrate --name update_your_schema
   ```
