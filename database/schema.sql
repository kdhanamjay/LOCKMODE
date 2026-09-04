-- EduGuard MDM — Production PostgreSQL Database Schema
-- Multi-tenant, enterprise security, strict RBAC, telemetry, and audit logging.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SCHOOLS & TENANTS
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CAMPUSES
CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADMIN USERS & RBAC
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'IT_ADMIN', 'PRINCIPAL', 'TEACHER')),
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLASSES & SECTIONS
CREATE TABLE school_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(20) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    assigned_policy_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name, section, academic_year)
);

-- 5. POLICIES & IMMUTABLE VERSIONS
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version INT DEFAULT 1,
    is_default BOOLEAN DEFAULT FALSE,
    kiosk_mode VARCHAR(50) DEFAULT 'FULL_LOCKDOWN' CHECK (kiosk_mode IN ('FULL_LOCKDOWN', 'LIMITED_LOCKDOWN', 'CUSTOM')),
    allowlist_only BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE policy_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    version INT NOT NULL,
    kiosk_mode VARCHAR(50) NOT NULL,
    allowlist_only BOOLEAN NOT NULL,
    allowed_applications JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_applications JSONB NOT NULL DEFAULT '[]'::jsonb,
    kiosk_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_kiosk_app VARCHAR(255),
    allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    restrictions JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_monitoring JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload_signature TEXT NOT NULL,
    published_by UUID REFERENCES admin_users(id),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(policy_id, version)
);

-- 6. STUDENTS
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
    student_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'GRADUATED')),
    guardian_name VARCHAR(255),
    guardian_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, student_code)
);

-- 7. DEVICES
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_identifier VARCHAR(100) UNIQUE NOT NULL, -- Hardware / Serial / Enrollment UUID
    serial_number VARCHAR(100) NOT NULL,
    imei VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    os_version VARCHAR(100) NOT NULL,
    agent_version VARCHAR(50) NOT NULL,
    management_mode VARCHAR(50) DEFAULT 'DEVICE_OWNER' CHECK (management_mode IN ('DEVICE_OWNER', 'PROFILE_OWNER', 'UNMANAGED')),
    status VARCHAR(50) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'LOCKED', 'TAMPERED')),
    is_locked BOOLEAN DEFAULT FALSE,
    lock_reason TEXT,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
    assigned_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    battery_level INT DEFAULT 100,
    is_charging BOOLEAN DEFAULT FALSE,
    network_type VARCHAR(20) DEFAULT 'WIFI',
    wifi_ssid VARCHAR(100),
    ip_address VARCHAR(45),
    storage_total_gb NUMERIC(6,2) DEFAULT 64.0,
    storage_used_gb NUMERIC(6,2) DEFAULT 12.5,
    ram_total_gb NUMERIC(6,2) DEFAULT 4.0,
    ram_used_gb NUMERIC(6,2) DEFAULT 1.8,
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    policy_version INT DEFAULT 1,
    policy_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_active_app VARCHAR(255),
    kiosk_mode VARCHAR(50) DEFAULT 'FULL_LOCKDOWN',
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    security_metadata JSONB DEFAULT '{}'::jsonb
);

-- 8. ENROLLMENT TOKENS
CREATE TABLE enrollment_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(100) UNIQUE NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
    policy_id UUID NOT NULL REFERENCES policies(id),
    max_uses INT DEFAULT 100,
    used_count INT DEFAULT 0,
    wifi_config JSONB,
    qr_payload TEXT NOT NULL,
    created_by UUID REFERENCES admin_users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. APPLICATIONS & DEPLOYMENTS
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    version_code INT DEFAULT 1,
    publisher VARCHAR(255),
    icon_url TEXT,
    category VARCHAR(50) DEFAULT 'EDUCATION',
    is_approved BOOLEAN DEFAULT TRUE,
    distribution_type VARCHAR(50) DEFAULT 'MANAGED_GOOGLE_PLAY',
    apk_url TEXT,
    apk_size_mb NUMERIC(6,2),
    target_sdk INT DEFAULT 35,
    min_sdk INT DEFAULT 26,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('ALL_DEVICES', 'SCHOOL', 'CLASS', 'SPECIFIC_DEVICE')),
    target_id UUID,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DOWNLOADING', 'INSTALLING', 'INSTALLED', 'FAILED', 'RETRYING')),
    total_devices INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    initiated_by UUID REFERENCES admin_users(id),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE deployment_device_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deployment_id, device_id)
);

-- 10. WEB FILTERING RULES
CREATE TABLE web_filter_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DOMAIN', 'KEYWORD')),
    pattern VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('ALLOW', 'BLOCK')),
    category VARCHAR(100),
    target_scope VARCHAR(20) DEFAULT 'GLOBAL' CHECK (target_scope IN ('GLOBAL', 'SCHOOL', 'CLASS', 'DEVICE')),
    target_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. REMOTE COMMANDS & QUEUE
CREATE TABLE remote_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    issuer_id UUID REFERENCES admin_users(id),
    status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'RECEIVED', 'EXECUTING', 'SUCCESS', 'FAILED', 'EXPIRED')),
    nonce VARCHAR(100) NOT NULL,
    signature TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    result_message TEXT,
    error_message TEXT
);

-- 12. TELEMETRY: APP USAGE
CREATE TABLE app_usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    package_name VARCHAR(255) NOT NULL,
    application_name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 0,
    session_count INT NOT NULL DEFAULT 1,
    category VARCHAR(50) DEFAULT 'EDUCATION',
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. SECURITY & POLICY VIOLATIONS
CREATE TABLE policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    target_resource TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES admin_users(id),
    resolution_note TEXT
);

-- 14. AUDIT LOGS (APPEND-ONLY)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_id UUID REFERENCES admin_users(id),
    admin_name VARCHAR(255) NOT NULL,
    admin_role VARCHAR(50) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    target_description TEXT NOT NULL,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    details JSONB
);

-- INDEXES FOR SCALE (100k+ Devices)
CREATE INDEX idx_devices_school ON devices(school_id);
CREATE INDEX idx_devices_class ON devices(class_id);
CREATE INDEX idx_devices_student ON devices(assigned_student_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_last_heartbeat ON devices(last_heartbeat);
CREATE INDEX idx_devices_policy_version ON devices(policy_version);

CREATE INDEX idx_commands_device_status ON remote_commands(device_id, status);
CREATE INDEX idx_app_usage_device_date ON app_usage_records(device_id, recorded_date);
CREATE INDEX idx_violations_school_severity ON policy_violations(school_id, severity, timestamp);
CREATE INDEX idx_audit_logs_school_timestamp ON audit_logs(school_id, timestamp DESC);
