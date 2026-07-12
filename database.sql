-- =====================================================================
-- ASSETFLOW — Enterprise Asset & Resource Management System
-- PostgreSQL Production Schema (MVP -> Enterprise ready)
-- =====================================================================
-- Conventions:
--   * snake_case identifiers, plural table names, singular column names
--   * Surrogate primary keys: id BIGSERIAL
--   * All timestamps: TIMESTAMPTZ
--   * Soft delete: deleted_at TIMESTAMPTZ NULL  (only on tables where
--     historical/legal traceability requires "undelete", see docs)
--   * Generic lookup framework (lookup_domains / lookup_values) replaces
--     dozens of one-off two-column enum tables while remaining fully
--     normalized and query-able; ENUM types avoided because business
--     users must be able to add statuses without a schema migration.
--   * Every table with updated_at gets an automatic trigger (attached
--     at the bottom of the script) that stamps updated_at on UPDATE.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- needed for EXCLUDE (overlap prevention)
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid() for external-facing ids
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive email column
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- trigram indexes for fast partial-text search

-- =====================================================================
-- SECTION 0 — GENERIC HELPER FUNCTIONS
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at() IS
  'Generic trigger function: stamps updated_at = now() on every UPDATE. Attached to all tables that carry an updated_at column (see bottom of script).';

-- =====================================================================
-- SECTION 1 — LOOKUP FRAMEWORK  (Lookup Tables)
-- =====================================================================
-- A single, reusable two-table "domain / value" pattern is used instead
-- of ~24 near-identical status/priority/type tables. This keeps the
-- schema in 3NF (no repeating text groups, each domain fully described
-- once), avoids hard-coded text anywhere in business tables, and lets
-- new lookup values be added by an admin screen with zero migrations —
-- directly supporting the "future extensibility" requirement.

CREATE TABLE lookup_domains (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(64)  NOT NULL,                 -- e.g. 'ASSET_STATUS'
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN      NOT NULL DEFAULT TRUE,     -- system domains cannot be deleted from UI
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_lookup_domains_code UNIQUE (code)
);
COMMENT ON TABLE lookup_domains IS 'Master list of all controlled-vocabulary categories used across AssetFlow (statuses, priorities, conditions, types, actions). Prevents hard-coded text throughout the schema.';

CREATE TABLE lookup_values (
    id              BIGSERIAL PRIMARY KEY,
    domain_id       BIGINT       NOT NULL REFERENCES lookup_domains(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    code            VARCHAR(64)  NOT NULL,                  -- e.g. 'AVAILABLE'
    label           VARCHAR(128) NOT NULL,                  -- e.g. 'Available'
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    meta            JSONB,                                  -- optional per-value styling/behaviour flags (e.g. {"color":"green","terminal":true})
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_lookup_values_domain_code UNIQUE (domain_id, code)
);
COMMENT ON TABLE lookup_values IS 'Individual controlled-vocabulary values belonging to a lookup_domains entry. Referenced by FK from every status/priority/type/condition column in the schema.';
CREATE INDEX ix_lookup_values_domain_active ON lookup_values(domain_id) WHERE is_active = TRUE;
-- Reason: every status dropdown / validation query filters "active values in this domain" — partial index keeps it tiny and fast even as inactive/legacy codes accumulate.

-- =====================================================================
-- SECTION 2 — ROLES & PERMISSIONS  (Auth: role hierarchy)
-- =====================================================================

CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(32)  NOT NULL,                  -- ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE
    name            VARCHAR(64)  NOT NULL,
    description     TEXT,
    parent_role_id  BIGINT       REFERENCES roles(id) ON DELETE SET NULL,  -- role hierarchy (future: sub-roles inherit permissions)
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_roles_code UNIQUE (code)
);
COMMENT ON TABLE roles IS 'Fixed system roles (Admin, Asset Manager, Department Head, Employee) plus room for future sub-roles via parent_role_id.';

CREATE TABLE permissions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(96)  NOT NULL,                  -- e.g. ASSET.APPROVE_TRANSFER
    module          VARCHAR(64)  NOT NULL,                  -- e.g. 'ASSET', 'MAINTENANCE'
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_permissions_code UNIQUE (code)
);
COMMENT ON TABLE permissions IS 'Fine-grained, module-scoped permission catalog. Decouples "what a role can do" from the role itself so permissions can be re-bundled without touching application code.';
CREATE INDEX ix_permissions_module ON permissions(module);

CREATE TABLE role_permissions (
    role_id         BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);
COMMENT ON TABLE role_permissions IS 'Many-to-many bridge: which permissions each role carries.';

-- =====================================================================
-- SECTION 3 — AUTHENTICATION (Users, credentials, sessions)
-- =====================================================================

CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    public_id           UUID         NOT NULL DEFAULT gen_random_uuid(), -- safe external identifier (never expose BIGSERIAL id in APIs/URLs)
    email               CITEXT       NOT NULL,               -- CITEXT = case-insensitive unique login
    password_hash       TEXT         NOT NULL,
    password_algo       VARCHAR(32)  NOT NULL DEFAULT 'bcrypt',
    password_changed_at TIMESTAMPTZ,
    email_verified_at   TIMESTAMPTZ,
    account_status_id   BIGINT       NOT NULL REFERENCES lookup_values(id), -- ACCOUNT_STATUS domain: Pending Verification / Active / Suspended / Locked / Deactivated
    failed_login_count  SMALLINT     NOT NULL DEFAULT 0,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,                          -- soft delete: preserves FK history (logs, allocations) after offboarding
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_public_id UNIQUE (public_id)
);
COMMENT ON TABLE users IS 'Authentication identity only — no profile/HR data. Every signup lands here with account_status = Pending Verification / Active and is auto-granted the EMPLOYEE role (see user_roles). Kept separate from employees per requirement to decouple login/security concerns from HR profile concerns.';
CREATE INDEX ix_users_account_status ON users(account_status_id);
CREATE UNIQUE INDEX ux_users_email_active ON users(email) WHERE deleted_at IS NULL;
-- Reason: allows the email of a soft-deleted (offboarded) user to be re-issued to a new hire without a hard delete.

CREATE TABLE password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT         NOT NULL,
    requested_ip    INET,
    expires_at      TIMESTAMPTZ  NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_password_reset_token_hash UNIQUE (token_hash)
);
COMMENT ON TABLE password_reset_tokens IS 'Single-use "forgot password" tokens; never store the raw token, only its hash.';
CREATE INDEX ix_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX ix_password_reset_tokens_active ON password_reset_tokens(user_id) WHERE used_at IS NULL;
-- Reason: login-flow lookup only cares about *unused, unexpired* tokens for a user.

CREATE TABLE user_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash TEXT      NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    issued_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ  NOT NULL,
    revoked_at      TIMESTAMPTZ,
    CONSTRAINT uq_user_sessions_token UNIQUE (session_token_hash)
);
COMMENT ON TABLE user_sessions IS 'Server-side session validation store (supports "forgot password", forced logout, and concurrent-session policies).';
CREATE INDEX ix_user_sessions_user_active ON user_sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE login_history (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       REFERENCES users(id) ON DELETE SET NULL,  -- kept even if user later deleted, for security forensics
    attempted_email CITEXT       NOT NULL,
    is_success      BOOLEAN      NOT NULL,
    failure_reason  VARCHAR(128),
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE login_history IS 'Append-only login attempt log (success and failure) — security/audit trail, distinct from user_sessions which only tracks live sessions.';
CREATE INDEX ix_login_history_user_time ON login_history(user_id, created_at DESC);
CREATE INDEX ix_login_history_email_time ON login_history(attempted_email, created_at DESC);

-- =====================================================================
-- SECTION 4 — DEPARTMENTS & EMPLOYEES
-- =====================================================================
-- departments.department_head_employee_id and employees.department_id
-- are mutually referential. departments is created first with the FK
-- to employees deferred until employees exists (added via ALTER below).

CREATE TABLE departments (
    id                          BIGSERIAL PRIMARY KEY,
    name                        VARCHAR(128) NOT NULL,
    code                        VARCHAR(32)  NOT NULL,
    description                 TEXT,
    parent_department_id        BIGINT       REFERENCES departments(id) ON DELETE SET NULL, -- department hierarchy
    department_head_employee_id BIGINT,      -- FK added after employees table is created
    status_id                   BIGINT       NOT NULL REFERENCES lookup_values(id), -- DEPARTMENT_STATUS: Active/Inactive
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ,
    CONSTRAINT uq_departments_code UNIQUE (code)
);
COMMENT ON TABLE departments IS 'Master list of organizational departments, self-referencing for hierarchy (e.g. Engineering -> Platform Engineering).';
CREATE INDEX ix_departments_parent ON departments(parent_department_id);
CREATE INDEX ix_departments_status ON departments(status_id) WHERE deleted_at IS NULL;

CREATE TABLE employees (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- 1:1 with auth identity
    employee_code       VARCHAR(32)  NOT NULL,             -- e.g. EMP-00042
    full_name           VARCHAR(160) NOT NULL,
    department_id       BIGINT       REFERENCES departments(id) ON DELETE SET NULL,
    manager_employee_id BIGINT       REFERENCES employees(id) ON DELETE SET NULL,  -- self-FK: reporting line (future expansion)
    phone               VARCHAR(32),
    designation         VARCHAR(96),
    status_id           BIGINT       NOT NULL REFERENCES lookup_values(id), -- EMPLOYEE_STATUS: Active/Inactive/On Leave
    joined_at           DATE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT uq_employees_user UNIQUE (user_id),
    CONSTRAINT uq_employees_code UNIQUE (employee_code)
);
COMMENT ON TABLE employees IS 'HR/profile data, one row per user. Deliberately separated from users (auth) so profile fields can evolve (title, manager, contact info) without touching security-sensitive auth tables.';
CREATE INDEX ix_employees_department ON employees(department_id);
CREATE INDEX ix_employees_manager ON employees(manager_employee_id);
CREATE INDEX ix_employees_status ON employees(status_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_employees_name_trgm ON employees USING gin (full_name gin_trgm_ops); -- fast "search employee by name" typeahead
-- Reason: Employee Directory screen requires fast partial-name search; trigram GIN index makes ILIKE '%text%' searches index-backed instead of full scans.

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head_employee
    FOREIGN KEY (department_head_employee_id) REFERENCES employees(id) ON DELETE SET NULL;
CREATE INDEX ix_departments_head ON departments(department_head_employee_id);

CREATE TABLE department_head_history (
    id                  BIGSERIAL PRIMARY KEY,
    department_id       BIGINT       NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    employee_id         BIGINT       NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    assigned_by_user_id BIGINT       NOT NULL REFERENCES users(id),
    assigned_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ended_at            TIMESTAMPTZ,
    remarks             TEXT
);
COMMENT ON TABLE department_head_history IS 'Full history of who has headed each department and when — supports "who approved X back in March" audit questions even after headship changes hands.';
CREATE INDEX ix_dept_head_history_dept ON department_head_history(department_id, assigned_at DESC);
CREATE UNIQUE INDEX ux_dept_head_history_current ON department_head_history(department_id) WHERE ended_at IS NULL;
-- Reason: guarantees at most one *current* head per department at the data layer, not just in application code.

-- =====================================================================
-- SECTION 5 — LOCATIONS & CONFIGURATION
-- =====================================================================

CREATE TABLE locations (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(128) NOT NULL,
    code                VARCHAR(32)  NOT NULL,
    parent_location_id  BIGINT       REFERENCES locations(id) ON DELETE SET NULL, -- e.g. Building -> Floor -> Room
    building             VARCHAR(96),
    floor                VARCHAR(32),
    room                 VARCHAR(32),
    address              TEXT,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_locations_code UNIQUE (code)
);
COMMENT ON TABLE locations IS 'Physical location master (building/floor/room or site address), self-referencing for hierarchy. Used for asset current_location and audit scoping.';
CREATE INDEX ix_locations_parent ON locations(parent_location_id);

CREATE TABLE app_settings (
    id              BIGSERIAL PRIMARY KEY,
    setting_key     VARCHAR(96)  NOT NULL,
    setting_value   TEXT         NOT NULL,
    value_type      VARCHAR(16)  NOT NULL DEFAULT 'STRING' CHECK (value_type IN ('STRING','NUMBER','BOOLEAN','JSON')),
    description     TEXT,
    updated_by_user_id BIGINT    REFERENCES users(id),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_app_settings_key UNIQUE (setting_key)
);
COMMENT ON TABLE app_settings IS 'System configuration table (e.g. overdue_grace_days, booking_reminder_lead_minutes, asset_tag_prefix) — lets ops tune behaviour without a deploy.';

-- =====================================================================
-- SECTION 6 — ASSET CATEGORIES & ASSETS
-- =====================================================================

CREATE TABLE asset_categories (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(128) NOT NULL,
    code                    VARCHAR(32)  NOT NULL,
    parent_category_id      BIGINT       REFERENCES asset_categories(id) ON DELETE SET NULL, -- sub-category, future-ready
    description             TEXT,
    default_warranty_months SMALLINT,
    status_id               BIGINT       NOT NULL REFERENCES lookup_values(id), -- CATEGORY_STATUS: Active/Inactive
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    CONSTRAINT uq_asset_categories_code UNIQUE (code)
);
COMMENT ON TABLE asset_categories IS 'Category master (Electronics, Furniture, Vehicles, ...), self-referencing for future sub-categories, carries category-level defaults such as warranty period.';
CREATE INDEX ix_asset_categories_parent ON asset_categories(parent_category_id);
CREATE INDEX ix_asset_categories_status ON asset_categories(status_id) WHERE deleted_at IS NULL;

CREATE SEQUENCE asset_tag_seq START 1;

CREATE TABLE assets (
    id                          BIGSERIAL PRIMARY KEY,
    public_id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    asset_tag                   VARCHAR(32),                 -- auto-generated (AF-0001) via trigger below
    name                        VARCHAR(160) NOT NULL,
    category_id                 BIGINT       NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
    serial_number                VARCHAR(128),
    qr_code_value                VARCHAR(128),
    -- CURRENT STATE (denormalized read-optimized pointers; source of truth
    -- for each is the corresponding *_history table below — this is an
    -- intentional, documented denormalization so dashboards/KPIs and the
    -- asset directory list avoid an extra join/aggregate on every request)
    status_id                    BIGINT       NOT NULL REFERENCES lookup_values(id),  -- ASSET_STATUS
    condition_id                 BIGINT       NOT NULL REFERENCES lookup_values(id),  -- ASSET_CONDITION
    current_location_id          BIGINT       REFERENCES locations(id) ON DELETE SET NULL,
    current_holder_employee_id   BIGINT       REFERENCES employees(id) ON DELETE SET NULL,
    current_holder_department_id BIGINT       REFERENCES departments(id) ON DELETE SET NULL,
    is_shared_bookable            BOOLEAN      NOT NULL DEFAULT FALSE,
    -- ACQUISITION
    acquisition_date              DATE,
    acquisition_cost              NUMERIC(14,2) CHECK (acquisition_cost IS NULL OR acquisition_cost >= 0),
    warranty_expiry_date          DATE,
    -- RETIREMENT / DISPOSAL
    retirement_date               DATE,
    disposal_date                 DATE,
    disposal_method                VARCHAR(64),
    -- FLEXIBLE, SPARSE, CATEGORY-SPECIFIC ATTRIBUTES
    -- (JSONB chosen deliberately here — attribute sets vary per category
    -- and change often; a fully normalized EAV model would need 3 extra
    -- join tables for the same query patterns and would be slower for
    -- the "show me everything about this asset" read path)
    custom_attributes             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at                     TIMESTAMPTZ,
    CONSTRAINT uq_assets_tag UNIQUE (asset_tag),
    CONSTRAINT uq_assets_public_id UNIQUE (public_id),
    CONSTRAINT uq_assets_serial UNIQUE (serial_number),
    CONSTRAINT uq_assets_qr UNIQUE (qr_code_value),
    CONSTRAINT ck_assets_retirement_after_acquisition CHECK (retirement_date IS NULL OR acquisition_date IS NULL OR retirement_date >= acquisition_date),
    CONSTRAINT ck_assets_disposal_after_retirement CHECK (disposal_date IS NULL OR retirement_date IS NULL OR disposal_date >= retirement_date),
    CONSTRAINT ck_assets_holder_not_both CHECK (NOT (current_holder_employee_id IS NOT NULL AND current_holder_department_id IS NOT NULL))
);
COMMENT ON TABLE assets IS 'Core asset master. current_status/condition/location/holder are cached "current state" columns; the authoritative append-only trail lives in asset_lifecycle_events, asset_condition_history, asset_location_history and asset_allocations.';
CREATE INDEX ix_assets_category ON assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_assets_status ON assets(status_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_assets_location ON assets(current_location_id);
CREATE INDEX ix_assets_holder_employee ON assets(current_holder_employee_id) WHERE current_holder_employee_id IS NOT NULL;
CREATE INDEX ix_assets_holder_department ON assets(current_holder_department_id) WHERE current_holder_department_id IS NOT NULL;
CREATE INDEX ix_assets_bookable ON assets(id) WHERE is_shared_bookable = TRUE AND deleted_at IS NULL;
-- Reason: Resource Booking screen only ever queries "bookable, non-deleted assets" — partial index skips the other 99% of the table at scale.
CREATE INDEX ix_assets_name_trgm ON assets USING gin (name gin_trgm_ops);
CREATE INDEX ix_assets_custom_attributes_gin ON assets USING gin (custom_attributes);
CREATE INDEX ix_assets_category_status ON assets(category_id, status_id) WHERE deleted_at IS NULL;
-- Reason: composite index for the very common "assets in category X with status Y" filter combination on the Asset Directory screen.
CREATE INDEX ix_assets_warranty_expiry ON assets(warranty_expiry_date) WHERE deleted_at IS NULL AND retirement_date IS NULL;
-- Reason: "assets nearing retirement / warranty expiring" report scans a narrow, sorted range instead of the whole table.

CREATE OR REPLACE FUNCTION fn_generate_asset_tag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.asset_tag IS NULL THEN
        NEW.asset_tag := 'AF-' || LPAD(nextval('asset_tag_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_generate_tag
    BEFORE INSERT ON assets
    FOR EACH ROW EXECUTE FUNCTION fn_generate_asset_tag();

-- =====================================================================
-- SECTION 7 — ATTACHMENTS (reusable across modules)
-- =====================================================================

CREATE TABLE attachments (
    id              BIGSERIAL PRIMARY KEY,
    file_name       VARCHAR(255) NOT NULL,
    file_url        TEXT         NOT NULL,          -- object-storage path/URL (S3, GCS, etc.)
    mime_type       VARCHAR(128),
    file_size_bytes BIGINT       CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    uploaded_by_user_id BIGINT   NOT NULL REFERENCES users(id),
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
COMMENT ON TABLE attachments IS 'Generic file metadata store (photos, documents). Content lives in object storage; only metadata + URL is kept here. Linked to owning entities via dedicated bridge tables so referential integrity is enforced per entity type (no polymorphic FK).';
CREATE INDEX ix_attachments_uploaded_by ON attachments(uploaded_by_user_id);

CREATE TABLE asset_attachments (
    asset_id        BIGINT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    attachment_id   BIGINT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    attachment_role VARCHAR(32) NOT NULL DEFAULT 'PHOTO' CHECK (attachment_role IN ('PHOTO','DOCUMENT','OTHER')),
    PRIMARY KEY (asset_id, attachment_id)
);
COMMENT ON TABLE asset_attachments IS 'Bridge: photos/documents attached to an asset.';

CREATE TABLE employee_attachments (
    employee_id     BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attachment_id   BIGINT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, attachment_id)
);
COMMENT ON TABLE employee_attachments IS 'Bridge: documents attached to an employee profile (future: ID proofs, contracts).';

-- =====================================================================
-- SECTION 8 — ASSET LIFECYCLE / CONDITION / LOCATION HISTORY
-- =====================================================================

CREATE TABLE asset_lifecycle_events (
    id                  BIGSERIAL PRIMARY KEY,
    asset_id            BIGINT       NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    previous_status_id  BIGINT       REFERENCES lookup_values(id),
    new_status_id       BIGINT       NOT NULL REFERENCES lookup_values(id),
    changed_by_user_id  BIGINT       REFERENCES users(id),      -- NULL allowed for system-driven transitions
    changed_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    reason               TEXT,
    remarks               TEXT,
    source_entity_type_id BIGINT     REFERENCES lookup_values(id), -- ENTITY_TYPE domain: which workflow caused this (Allocation/Maintenance/Audit/Manual)
    source_entity_id      BIGINT
);
COMMENT ON TABLE asset_lifecycle_events IS 'Append-only, never-updated trail of every asset status transition (who / when / why / previous state / new state). This — not assets.status_id — is the authoritative lifecycle record; assets.status_id is a fast-access cache of the latest row here.';
CREATE INDEX ix_asset_lifecycle_asset_time ON asset_lifecycle_events(asset_id, changed_at DESC);
CREATE INDEX ix_asset_lifecycle_new_status ON asset_lifecycle_events(new_status_id);

CREATE TABLE asset_condition_history (
    id                  BIGSERIAL PRIMARY KEY,
    asset_id            BIGINT       NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    previous_condition_id BIGINT     REFERENCES lookup_values(id),
    new_condition_id    BIGINT       NOT NULL REFERENCES lookup_values(id),
    recorded_by_user_id BIGINT       REFERENCES users(id),
    recorded_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    source_entity_type_id BIGINT     REFERENCES lookup_values(id),  -- e.g. Return check-in, Audit verification
    source_entity_id      BIGINT,
    remarks               TEXT
);
COMMENT ON TABLE asset_condition_history IS 'Append-only trail of condition changes, independent of status changes (e.g. a return check-in can downgrade condition without changing status).';
CREATE INDEX ix_asset_condition_history_asset_time ON asset_condition_history(asset_id, recorded_at DESC);

CREATE TABLE asset_location_history (
    id                  BIGSERIAL PRIMARY KEY,
    asset_id            BIGINT       NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    previous_location_id BIGINT      REFERENCES locations(id),
    new_location_id     BIGINT       REFERENCES locations(id),
    moved_by_user_id    BIGINT       REFERENCES users(id),
    moved_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    source_entity_type_id BIGINT     REFERENCES lookup_values(id),
    source_entity_id      BIGINT,
    remarks               TEXT
);
COMMENT ON TABLE asset_location_history IS 'Append-only trail of physical location changes — used for audit-cycle scoping ("assets that were in Location X during period Y") and asset movement reports.';
CREATE INDEX ix_asset_location_history_asset_time ON asset_location_history(asset_id, moved_at DESC);

-- =====================================================================
-- SECTION 9 — ALLOCATION
-- =====================================================================

CREATE TABLE asset_allocations (
    id                      BIGSERIAL PRIMARY KEY,
    asset_id                BIGINT       NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    allocation_type_id      BIGINT       NOT NULL REFERENCES lookup_values(id),  -- ALLOCATION_TYPE: Employee/Department
    employee_id             BIGINT       REFERENCES employees(id) ON DELETE RESTRICT,
    department_id           BIGINT       REFERENCES departments(id) ON DELETE RESTRICT,
    allocated_by_user_id    BIGINT       NOT NULL REFERENCES users(id),
    allocated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expected_return_date     DATE,
    actual_return_date       DATE,
    status_id                BIGINT       NOT NULL REFERENCES lookup_values(id), -- ALLOCATION_STATUS: Scheduled/Active/Returned/Overdue/Cancelled
    condition_at_allocation_id BIGINT     REFERENCES lookup_values(id),
    is_current                BOOLEAN     NOT NULL DEFAULT TRUE,  -- trigger-maintained; true only while status is Scheduled/Active
    remarks                    TEXT,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_allocations_exactly_one_target CHECK (
        (employee_id IS NOT NULL AND department_id IS NULL) OR
        (employee_id IS NULL AND department_id IS NOT NULL)
    ),
    CONSTRAINT ck_allocations_return_dates CHECK (actual_return_date IS NULL OR actual_return_date >= allocated_at::date)
);
COMMENT ON TABLE asset_allocations IS 'Transaction table: one row per allocation event. Doubles as the full allocation history for an asset (query by asset_id) and for an employee/department (query by employee_id/department_id). "Current allocation" = the row where is_current = true.';
CREATE INDEX ix_allocations_asset_time ON asset_allocations(asset_id, allocated_at DESC);
CREATE INDEX ix_allocations_employee ON asset_allocations(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX ix_allocations_department ON asset_allocations(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX ix_allocations_overdue ON asset_allocations(expected_return_date) WHERE is_current = TRUE AND actual_return_date IS NULL;
-- Reason: Dashboard "overdue returns" widget filters exactly this predicate; partial index keeps it near-instant regardless of total allocation history size.
CREATE UNIQUE INDEX ux_allocations_one_active_per_asset ON asset_allocations(asset_id) WHERE is_current = TRUE;
-- Reason: THE double-allocation guard — the database itself rejects a second concurrent active/scheduled allocation for the same asset, closing race conditions that app-layer checks alone cannot.

CREATE OR REPLACE FUNCTION fn_allocations_sync_is_current()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(64);
BEGIN
    SELECT code INTO v_code FROM lookup_values WHERE id = NEW.status_id;
    NEW.is_current := (v_code IN ('SCHEDULED','ACTIVE'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_allocations_sync_is_current
    BEFORE INSERT OR UPDATE OF status_id ON asset_allocations
    FOR EACH ROW EXECUTE FUNCTION fn_allocations_sync_is_current();

-- =====================================================================
-- SECTION 10 — REUSABLE APPROVAL ENGINE
-- =====================================================================
-- One generic pair of tables serves Transfer, Maintenance, Return and
-- any future approval-gated workflow, instead of duplicating "approved
-- by / approved at / rejection reason" columns on every workflow table.

CREATE TABLE approval_requests (
    id                      BIGSERIAL PRIMARY KEY,
    entity_type_id          BIGINT       NOT NULL REFERENCES lookup_values(id), -- ENTITY_TYPE: TRANSFER_REQUEST / MAINTENANCE_REQUEST / RETURN_REQUEST / ...
    entity_id               BIGINT       NOT NULL,     -- PK of the row in the relevant workflow table (polymorphic by design; validated at the application layer per entity_type)
    requested_by_user_id    BIGINT       NOT NULL REFERENCES users(id),
    requested_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    required_approver_role_id BIGINT     REFERENCES roles(id),  -- e.g. must be approved by ASSET_MANAGER or DEPARTMENT_HEAD
    status_id                BIGINT       NOT NULL REFERENCES lookup_values(id), -- APPROVAL_STATUS: Pending/Approved/Rejected/Cancelled
    decided_by_user_id       BIGINT       REFERENCES users(id),
    decided_at                TIMESTAMPTZ,
    decision_remarks          TEXT,
    is_pending                 BOOLEAN      NOT NULL DEFAULT TRUE,  -- trigger-maintained; PostgreSQL forbids subqueries in partial-index predicates, so status is mirrored into this plain boolean for indexing
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE approval_requests IS 'Reusable approval-engine header row. One approval_requests row per approvable workflow instance (a transfer, a maintenance request, a return). entity_type_id + entity_id point back at the originating workflow table.';
CREATE INDEX ix_approval_requests_entity ON approval_requests(entity_type_id, entity_id);
CREATE INDEX ix_approval_requests_status ON approval_requests(status_id);
CREATE UNIQUE INDEX ux_approval_requests_one_pending_per_entity ON approval_requests(entity_type_id, entity_id) WHERE is_pending;
-- Reason: guarantees only one open approval can exist per workflow instance at a time, at the database level.

CREATE OR REPLACE FUNCTION fn_approval_requests_sync_is_pending()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(64);
BEGIN
    SELECT code INTO v_code FROM lookup_values WHERE id = NEW.status_id;
    NEW.is_pending := (v_code = 'PENDING');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_approval_requests_sync_is_pending
    BEFORE INSERT OR UPDATE OF status_id ON approval_requests
    FOR EACH ROW EXECUTE FUNCTION fn_approval_requests_sync_is_pending();

CREATE TABLE approval_history (
    id                  BIGSERIAL PRIMARY KEY,
    approval_request_id BIGINT       NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    action_id            BIGINT       NOT NULL REFERENCES lookup_values(id),  -- APPROVAL_ACTION: Submitted/Approved/Rejected/Cancelled/Escalated
    actor_user_id         BIGINT       REFERENCES users(id),
    acted_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    remarks                TEXT
);
COMMENT ON TABLE approval_history IS 'Append-only step-by-step trail for each approval_requests row — supports future multi-level approval chains without any schema change.';
CREATE INDEX ix_approval_history_request ON approval_history(approval_request_id, acted_at);

-- =====================================================================
-- SECTION 11 — TRANSFER WORKFLOW
-- =====================================================================

CREATE TABLE asset_transfer_requests (
    id                  BIGSERIAL PRIMARY KEY,
    asset_id             BIGINT       NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    from_allocation_id   BIGINT       REFERENCES asset_allocations(id),  -- current holder's allocation being transferred away from
    to_employee_id        BIGINT       REFERENCES employees(id),
    to_department_id      BIGINT       REFERENCES departments(id),
    requested_by_user_id  BIGINT       NOT NULL REFERENCES users(id),
    reason                 TEXT,
    status_id              BIGINT       NOT NULL REFERENCES lookup_values(id), -- TRANSFER_STATUS: Requested/Approved/Rejected/Completed/Cancelled
    requested_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at             TIMESTAMPTZ,
    new_allocation_id        BIGINT       REFERENCES asset_allocations(id),  -- set once the re-allocation is created
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_transfer_exactly_one_target CHECK (
        (to_employee_id IS NOT NULL AND to_department_id IS NULL) OR
        (to_employee_id IS NULL AND to_department_id IS NOT NULL)
    )
);
COMMENT ON TABLE asset_transfer_requests IS 'Requested -> Approved -> Re-allocated workflow header. Approval itself is delegated to approval_requests (entity_type = TRANSFER_REQUEST); this table holds transfer-specific business data only.';
CREATE INDEX ix_transfer_requests_asset ON asset_transfer_requests(asset_id, requested_at DESC);
CREATE INDEX ix_transfer_requests_status ON asset_transfer_requests(status_id);

-- =====================================================================
-- SECTION 12 — RETURN WORKFLOW
-- =====================================================================

CREATE TABLE asset_return_requests (
    id                      BIGSERIAL PRIMARY KEY,
    allocation_id            BIGINT       NOT NULL REFERENCES asset_allocations(id) ON DELETE RESTRICT,
    requested_by_user_id     BIGINT       NOT NULL REFERENCES users(id),
    requested_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    condition_notes            TEXT,
    returned_condition_id      BIGINT       REFERENCES lookup_values(id),
    inspected_by_user_id       BIGINT       REFERENCES users(id),
    inspected_at                TIMESTAMPTZ,
    status_id                   BIGINT       NOT NULL REFERENCES lookup_values(id), -- RETURN_STATUS: Requested/Approved/Rejected/Completed
    completed_at                 TIMESTAMPTZ,
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE asset_return_requests IS 'Return-with-inspection workflow header for a specific allocation. On completion, the referenced asset_allocations row gets actual_return_date/status updated and assets.status_id reverts to Available.';
CREATE INDEX ix_return_requests_allocation ON asset_return_requests(allocation_id);
CREATE INDEX ix_return_requests_status ON asset_return_requests(status_id);

-- =====================================================================
-- SECTION 13 — RESOURCE BOOKING
-- =====================================================================

CREATE TABLE resource_bookings (
    id                      BIGSERIAL PRIMARY KEY,
    asset_id                 BIGINT       NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,  -- must have is_shared_bookable = TRUE (enforced by trigger)
    booked_by_user_id         BIGINT       NOT NULL REFERENCES users(id),
    booking_for_department_id  BIGINT       REFERENCES departments(id),  -- set when a Department Head books on behalf of the department
    start_time                  TIMESTAMPTZ  NOT NULL,
    end_time                     TIMESTAMPTZ  NOT NULL,
    during                         TSTZRANGE GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED,
    status_id                     BIGINT       NOT NULL REFERENCES lookup_values(id), -- BOOKING_STATUS: Upcoming/Ongoing/Completed/Cancelled
    is_active                      BOOLEAN      NOT NULL DEFAULT TRUE, -- trigger-maintained; false once Cancelled
    purpose                         TEXT,
    recurrence_rule                  VARCHAR(255),  -- future-ready: RRULE string for recurring bookings
    parent_booking_id                 BIGINT       REFERENCES resource_bookings(id) ON DELETE CASCADE,  -- links generated instances of a recurring series
    cancelled_by_user_id               BIGINT       REFERENCES users(id),
    cancelled_at                        TIMESTAMPTZ,
    cancellation_reason                  TEXT,
    created_at                            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_bookings_time_order CHECK (end_time > start_time)
);
COMMENT ON TABLE resource_bookings IS 'Time-slot booking of shared/bookable assets (rooms, vehicles, equipment). Overlap prevention is enforced at the database level via the EXCLUDE constraint below, not just in application code.';
CREATE INDEX ix_bookings_asset_time ON resource_bookings USING gist (asset_id, during);
CREATE INDEX ix_bookings_booked_by ON resource_bookings(booked_by_user_id);
CREATE INDEX ix_bookings_department ON resource_bookings(booking_for_department_id) WHERE booking_for_department_id IS NOT NULL;
CREATE INDEX ix_bookings_status_start ON resource_bookings(status_id, start_time);
-- Reason: powers the "Upcoming" / "Ongoing" calendar views and the booking-heatmap report (group by hour-of-day/day-of-week over start_time).

ALTER TABLE resource_bookings
    ADD CONSTRAINT ex_bookings_no_overlap
    EXCLUDE USING gist (asset_id WITH =, during WITH &&) WHERE (is_active);
-- This single database constraint IS the overlap-prevention rule described in the problem statement:
-- Room B2 9:00-10:00 booked -> a 9:30-10:30 request physically cannot be inserted; a 10:00-11:00
-- request can, because tstzrange uses a half-open interval ('[)') so back-to-back slots don't overlap.

CREATE OR REPLACE FUNCTION fn_bookings_sync_is_active()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(64);
BEGIN
    SELECT code INTO v_code FROM lookup_values WHERE id = NEW.status_id;
    NEW.is_active := (v_code <> 'CANCELLED');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_sync_is_active
    BEFORE INSERT OR UPDATE OF status_id ON resource_bookings
    FOR EACH ROW EXECUTE FUNCTION fn_bookings_sync_is_active();

CREATE TABLE booking_reschedule_history (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id           BIGINT       NOT NULL REFERENCES resource_bookings(id) ON DELETE CASCADE,
    previous_start_time   TIMESTAMPTZ  NOT NULL,
    previous_end_time     TIMESTAMPTZ  NOT NULL,
    new_start_time         TIMESTAMPTZ  NOT NULL,
    new_end_time           TIMESTAMPTZ  NOT NULL,
    rescheduled_by_user_id  BIGINT       NOT NULL REFERENCES users(id),
    rescheduled_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    reason                    TEXT
);
COMMENT ON TABLE booking_reschedule_history IS 'Append-only trail of reschedule actions on a booking, kept separate from the main row so the current booking always reflects "now" while history remains queryable.';
CREATE INDEX ix_booking_reschedule_booking ON booking_reschedule_history(booking_id, rescheduled_at DESC);

CREATE TABLE booking_reminders (
    id              BIGSERIAL PRIMARY KEY,
    booking_id       BIGINT       NOT NULL REFERENCES resource_bookings(id) ON DELETE CASCADE,
    remind_at         TIMESTAMPTZ  NOT NULL,
    channel_id         BIGINT       REFERENCES lookup_values(id),  -- NOTIFICATION_CHANNEL: Email/SMS/Push (future-ready)
    status_id           BIGINT       NOT NULL REFERENCES lookup_values(id), -- REMINDER_STATUS: Pending/Sent/Cancelled
    sent_at               TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE booking_reminders IS 'Scheduling queue for "reminder before slot starts" — a background worker polls sent_at IS NULL AND remind_at <= now(), sends, then writes a row into notifications.';
CREATE INDEX ix_booking_reminders_due ON booking_reminders(remind_at) WHERE sent_at IS NULL;
-- Reason: the reminder worker's poll query filters exactly this predicate; partial index keeps the scan tiny as sent history accumulates.

-- =====================================================================
-- SECTION 14 — MAINTENANCE
-- =====================================================================

CREATE TABLE maintenance_requests (
    id                          BIGSERIAL PRIMARY KEY,
    asset_id                     BIGINT       NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    raised_by_user_id             BIGINT       NOT NULL REFERENCES users(id),
    issue_description              TEXT         NOT NULL,
    priority_id                     BIGINT       NOT NULL REFERENCES lookup_values(id), -- MAINTENANCE_PRIORITY
    status_id                        BIGINT       NOT NULL REFERENCES lookup_values(id), -- MAINTENANCE_STATUS
    approved_by_user_id               BIGINT       REFERENCES users(id),
    approved_at                        TIMESTAMPTZ,
    assigned_technician_employee_id     BIGINT       REFERENCES employees(id),
    assigned_at                          TIMESTAMPTZ,
    resolved_at                           TIMESTAMPTZ,
    resolution_notes                       TEXT,
    estimated_cost                          NUMERIC(14,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    actual_cost                              NUMERIC(14,2) CHECK (actual_cost IS NULL OR actual_cost >= 0),
    created_at                                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                                 TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE maintenance_requests IS 'Pending -> Approved/Rejected -> Technician Assigned -> In Progress -> Resolved workflow header. Approval delegated to approval_requests (entity_type = MAINTENANCE_REQUEST). On approval the linked asset flips to Under Maintenance; on resolution it flips back to Available (see asset_lifecycle_events, source_entity_type = MAINTENANCE_REQUEST).';
CREATE INDEX ix_maintenance_asset ON maintenance_requests(asset_id, created_at DESC);
CREATE INDEX ix_maintenance_status ON maintenance_requests(status_id);
CREATE INDEX ix_maintenance_technician ON maintenance_requests(assigned_technician_employee_id) WHERE assigned_technician_employee_id IS NOT NULL;
CREATE INDEX ix_maintenance_priority_status ON maintenance_requests(priority_id, status_id);
-- Reason: "Maintenance Today" KPI and technician work-queue both filter/sort on priority + status together.

CREATE TABLE maintenance_status_history (
    id                          BIGSERIAL PRIMARY KEY,
    maintenance_request_id       BIGINT       NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    previous_status_id            BIGINT       REFERENCES lookup_values(id),
    new_status_id                  BIGINT       NOT NULL REFERENCES lookup_values(id),
    changed_by_user_id              BIGINT       REFERENCES users(id),
    changed_at                       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    remarks                           TEXT
);
COMMENT ON TABLE maintenance_status_history IS 'Append-only workflow-state trail for a maintenance request (distinct from asset_lifecycle_events, which tracks the asset''s own status, not the request''s).';
CREATE INDEX ix_maintenance_status_history_req ON maintenance_status_history(maintenance_request_id, changed_at);

CREATE TABLE maintenance_attachments (
    maintenance_request_id  BIGINT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    attachment_id             BIGINT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (maintenance_request_id, attachment_id)
);
COMMENT ON TABLE maintenance_attachments IS 'Bridge: photos attached when raising or resolving a maintenance request.';

-- =====================================================================
-- SECTION 15 — AUDIT CYCLES
-- =====================================================================

CREATE TABLE audit_cycles (
    id                      BIGSERIAL PRIMARY KEY,
    name                     VARCHAR(160) NOT NULL,
    scope_department_id      BIGINT       REFERENCES departments(id),
    scope_location_id         BIGINT       REFERENCES locations(id),
    start_date                 DATE         NOT NULL,
    end_date                    DATE         NOT NULL,
    status_id                    BIGINT       NOT NULL REFERENCES lookup_values(id), -- AUDIT_STATUS: Planned/In Progress/Closed
    created_by_user_id            BIGINT       NOT NULL REFERENCES users(id),
    closed_by_user_id              BIGINT       REFERENCES users(id),
    closed_at                       TIMESTAMPTZ,
    created_at                       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_audit_cycles_dates CHECK (end_date >= start_date)
);
COMMENT ON TABLE audit_cycles IS 'A scheduled verification exercise scoped by department and/or location and date range. Replaces "single audit form" with a structured, closeable cycle.';
CREATE INDEX ix_audit_cycles_status ON audit_cycles(status_id);
CREATE INDEX ix_audit_cycles_dates ON audit_cycles(start_date, end_date);

CREATE TABLE audit_cycle_auditors (
    audit_cycle_id      BIGINT       NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    employee_id           BIGINT       NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    assigned_by_user_id    BIGINT       NOT NULL REFERENCES users(id),
    assigned_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (audit_cycle_id, employee_id)
);
COMMENT ON TABLE audit_cycle_auditors IS 'Many-to-many: an audit cycle can have multiple auditors, and an employee can auditor multiple cycles over time.';

CREATE TABLE audit_asset_assignments (
    id                          BIGSERIAL PRIMARY KEY,
    audit_cycle_id               BIGINT       NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id                       BIGINT       NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    assigned_auditor_employee_id    BIGINT       REFERENCES employees(id),
    verification_result_id           BIGINT       REFERENCES lookup_values(id), -- AUDIT_VERIFICATION_RESULT: Verified/Missing/Damaged
    verified_by_employee_id           BIGINT       REFERENCES employees(id),
    verified_at                        TIMESTAMPTZ,
    remarks                              TEXT,
    created_at                            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_audit_asset_assignment UNIQUE (audit_cycle_id, asset_id)
);
COMMENT ON TABLE audit_asset_assignments IS 'The scope list: which assets belong to a given audit cycle, who verifies each, and the verification result. Source of truth that discrepancies are generated from.';
CREATE INDEX ix_audit_assignments_cycle ON audit_asset_assignments(audit_cycle_id);
CREATE INDEX ix_audit_assignments_asset ON audit_asset_assignments(asset_id);
CREATE INDEX ix_audit_assignments_pending ON audit_asset_assignments(audit_cycle_id) WHERE verification_result_id IS NULL;
-- Reason: auditor work-queue screen needs "show me what I still have to verify in this cycle" fast.

CREATE TABLE audit_discrepancies (
    id                          BIGSERIAL PRIMARY KEY,
    audit_asset_assignment_id     BIGINT       NOT NULL UNIQUE REFERENCES audit_asset_assignments(id) ON DELETE CASCADE,
    discrepancy_type_id            BIGINT       NOT NULL REFERENCES lookup_values(id), -- Missing / Damaged
    status_id                       BIGINT       NOT NULL REFERENCES lookup_values(id), -- DISCREPANCY_STATUS: Open/Under Review/Resolved
    resolution_notes                  TEXT,
    resolved_by_user_id                BIGINT       REFERENCES users(id),
    resolved_at                          TIMESTAMPTZ,
    created_at                             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                              TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE audit_discrepancies IS 'Auto-generated (by application logic / trigger) whenever an audit_asset_assignments row is verified as Missing or Damaged. Tracked to resolution, e.g. asset marked Lost and written off.';
CREATE INDEX ix_audit_discrepancies_status ON audit_discrepancies(status_id);

CREATE TABLE audit_attachments (
    audit_asset_assignment_id  BIGINT NOT NULL REFERENCES audit_asset_assignments(id) ON DELETE CASCADE,
    attachment_id                 BIGINT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (audit_asset_assignment_id, attachment_id)
);
COMMENT ON TABLE audit_attachments IS 'Bridge: evidence photos captured during physical verification.';

-- =====================================================================
-- SECTION 16 — NOTIFICATIONS
-- =====================================================================

CREATE TABLE notification_templates (
    id                  BIGSERIAL PRIMARY KEY,
    type_id               BIGINT       NOT NULL REFERENCES lookup_values(id), -- NOTIFICATION_TYPE
    title_template          TEXT         NOT NULL,
    body_template            TEXT         NOT NULL,
    is_active                 BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE notification_templates IS 'Reusable message templates (with placeholders) per notification type, e.g. "Asset {{asset_tag}} allocated to you".';
CREATE INDEX ix_notification_templates_type ON notification_templates(type_id);

CREATE TABLE notifications (
    id                      BIGSERIAL PRIMARY KEY,
    template_id               BIGINT       REFERENCES notification_templates(id),
    type_id                     BIGINT       NOT NULL REFERENCES lookup_values(id), -- NOTIFICATION_TYPE
    title                         TEXT         NOT NULL,
    body                           TEXT         NOT NULL,
    source_entity_type_id           BIGINT       REFERENCES lookup_values(id),  -- ENTITY_TYPE the notification is about
    source_entity_id                 BIGINT,
    created_at                        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE notifications IS 'One row per notification *event* (content). Delivery/read state is per-recipient and lives in notification_recipients, since one event (e.g. "Booking B2 cancelled") can fan out to several recipients with independent read states.';
CREATE INDEX ix_notifications_type_time ON notifications(type_id, created_at DESC);
CREATE INDEX ix_notifications_source ON notifications(source_entity_type_id, source_entity_id);

CREATE TABLE notification_recipients (
    id                      BIGSERIAL PRIMARY KEY,
    notification_id           BIGINT       NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_user_id           BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_status_id            BIGINT       NOT NULL REFERENCES lookup_values(id), -- NOTIFICATION_DELIVERY_STATUS: Pending/Sent/Failed/Read
    sent_at                         TIMESTAMPTZ,
    read_at                          TIMESTAMPTZ,
    created_at                        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_notification_recipient UNIQUE (notification_id, recipient_user_id)
);
COMMENT ON TABLE notification_recipients IS 'Per-user fan-out of a notification event, carrying delivery and read status independently for each recipient.';
CREATE INDEX ix_notification_recipients_user_unread ON notification_recipients(recipient_user_id) WHERE read_at IS NULL;
-- Reason: "unread notification count/badge" is queried on every page load for every logged-in user — must be a cheap, index-only lookup.

-- =====================================================================
-- SECTION 17 — ACTIVITY LOGS (enterprise audit trail — never mixed
-- with the business history tables above)
-- =====================================================================

CREATE TABLE activity_logs (
    id                  BIGSERIAL,
    actor_user_id         BIGINT       REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system-initiated action
    action_id               BIGINT       NOT NULL REFERENCES lookup_values(id), -- ACTIVITY_ACTION: Create/Update/Delete/Login/Approve/...
    entity_type_id            BIGINT       NOT NULL REFERENCES lookup_values(id), -- ENTITY_TYPE
    entity_id                   BIGINT       NOT NULL,
    old_values                    JSONB,
    new_values                     JSONB,
    ip_address                       INET,
    user_agent                        TEXT,
    source_id                          BIGINT       REFERENCES lookup_values(id), -- ACTIVITY_SOURCE: Web/Mobile/API/System
    occurred_at                          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT pk_activity_logs PRIMARY KEY (id, occurred_at)  -- partitioned tables require the partition key in every unique/PK constraint
) PARTITION BY RANGE (occurred_at);
COMMENT ON TABLE activity_logs IS 'Enterprise-grade, append-only, immutable audit log of every meaningful action across the system (who / when / action / entity / old & new values / IP / user agent / source). Deliberately separate from business history tables (asset_lifecycle_events etc.), which capture domain meaning; this table captures raw forensic/compliance trail. Range-partitioned by month for write throughput and easy retention/archival at enterprise scale.';

-- Example monthly partitions (create ahead via a scheduled job in production)
CREATE TABLE activity_logs_2026_07 PARTITION OF activity_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE activity_logs_2026_08 PARTITION OF activity_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE activity_logs_default PARTITION OF activity_logs DEFAULT;

CREATE INDEX ix_activity_logs_entity ON activity_logs(entity_type_id, entity_id, occurred_at DESC);
CREATE INDEX ix_activity_logs_actor_time ON activity_logs(actor_user_id, occurred_at DESC);
CREATE INDEX ix_activity_logs_action_time ON activity_logs(action_id, occurred_at DESC);

-- =====================================================================
-- SECTION 18 — GENERIC updated_at TRIGGERS
-- =====================================================================
-- Attach fn_set_updated_at() to every table that has an updated_at
-- column, without hand-listing each one.

DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name = 'updated_at'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
            t.table_name, t.table_name
        );
    END LOOP;
END;
$$;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
