// EduGuard MDM — Enterprise TypeScript Types & Shared Contracts

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'IT_ADMIN' | 'PRINCIPAL' | 'TEACHER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  schoolName: string;
  avatarUrl?: string;
  permissions: string[];
  lastLogin?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  campusesCount: number;
  totalStudents: number;
  totalDevices: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Campus {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  address: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  campusId: string;
  name: string;
  section: string;
  academicYear: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  deviceCount: number;
  assignedPolicyId: string;
}

export interface Student {
  id: string;
  studentId: string; // School enrollment ID (e.g. STU-2026-001)
  name: string;
  email?: string;
  rollNumber?: string;
  schoolId: string;
  classId: string;
  className: string;
  section: string;
  deviceId?: string;
  deviceName?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';
  guardianName?: string;
  guardianContact?: string;
  createdAt: string;
}

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'LOCKED' | 'TAMPERED';
export type ManagementMode = 'DEVICE_OWNER' | 'PROFILE_OWNER' | 'UNMANAGED';
export type KioskMode = 'FULL_LOCKDOWN' | 'LIMITED_LOCKDOWN' | 'CUSTOM';
export type DevicePlatform = 'WINDOWS_PC' | 'ANDROID_TABLET' | 'IPAD' | 'LINUX_PC' | 'MACOS' | 'MOBILE';

export interface Device {
  id: string;
  deviceId: string; // Hardware/MDM ID (e.g. TAB-1001 or PC-LAB-01)
  serialNumber: string;
  imei?: string;
  name: string;
  model: string;
  manufacturer: string;
  platform?: DevicePlatform;
  osVersion: string; // e.g. "Windows 11 Pro" or "Android 15"
  agentVersion: string; // e.g. "1.4.2"
  managementMode: ManagementMode;
  status: DeviceStatus;
  isLocked: boolean;
  lockReason?: string;
  schoolId: string;
  schoolName: string;
  classId?: string;
  className?: string;
  assignedStudentId?: string;
  assignedStudentName?: string;
  assignedStudentRoll?: string;
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'WIFI' | 'CELLULAR' | 'NONE';
  wifiSsid?: string;
  ipAddress?: string;
  storageTotalGb: number;
  storageUsedGb: number;
  ramTotalGb: number;
  ramUsedGb: number;
  policyId: string;
  policyVersion: number;
  policySyncedAt: string;
  lastHeartbeat: string;
  currentActiveApp?: string;
  kioskMode: KioskMode;
  enrollmentDate: string;
  locationState?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    updatedAt: string;
  };
  hardwareSecurity: {
    knoxSupported?: boolean;
    playIntegrityPass: boolean;
    deviceRooted: boolean;
    developerOptionsDisabled: boolean;
    usbDebuggingDisabled: boolean;
  };
}

export interface Application {
  id: string;
  packageName: string;
  name: string;
  version: string;
  versionCode: number;
  publisher: string;
  iconUrl: string;
  category: 'EDUCATION' | 'PRODUCTIVITY' | 'COMMUNICATION' | 'UTILITY' | 'SYSTEM' | 'RESTRICTED';
  isApproved: boolean;
  distributionType: 'MANAGED_GOOGLE_PLAY' | 'PRIVATE_ENTERPRISE_APK' | 'SYSTEM_PREINSTALLED';
  apkSizeMb?: number;
  apkUrl?: string;
  targetSdk: number;
  minSdk: number;
  installedCount: number;
  pendingCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'PENDING' | 'DOWNLOADING' | 'INSTALLING' | 'INSTALLED' | 'FAILED' | 'RETRYING';

export interface Deployment {
  id: string;
  applicationId: string;
  applicationName: string;
  packageName: string;
  version: string;
  targetType: 'ALL_DEVICES' | 'SCHOOL' | 'CLASS' | 'SPECIFIC_DEVICE';
  targetId: string;
  targetName: string;
  status: DeploymentStatus;
  totalDevices: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
}

export interface PolicyRuleApplication {
  packageName: string;
  name: string;
  allowed: boolean;
  autoLaunchOnBoot?: boolean;
  preventUninstall: boolean;
  managedConfigurations?: Record<string, any>;
}

export interface WebFilterCategory {
  id: string;
  name: string;
  description: string;
  blocked: boolean;
  sampleDomains: string[];
}

export interface WebFilterRule {
  id: string;
  type: 'DOMAIN' | 'KEYWORD';
  pattern: string;
  action: 'ALLOW' | 'BLOCK';
  category?: string;
  targetScope: 'GLOBAL' | 'SCHOOL' | 'CLASS' | 'DEVICE';
  targetId?: string;
  description?: string;
  createdAt: string;
}

export interface DevicePolicy {
  id: string;
  name: string;
  description: string;
  version: number;
  schoolId: string;
  schoolName: string;
  isDefault: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  kioskMode: KioskMode;
  allowlistOnly: boolean;
  allowedApplications: string[]; // package names
  blockedApplications: string[];
  kioskApps: string[]; // apps visible in student launcher
  defaultKioskApp?: string; // auto-start app
  allowedDomains: string[];
  blockedDomains: string[];
  blockedKeywords: string[];
  blockedCategories: string[];
  restrictions: {
    disableCalls: boolean; // Android Enterprise DISALLOW_OUTGOING_CALLS & telephonic voice calls
    disableSms: boolean; // Android Enterprise DISALLOW_SMS
    disableCamera: boolean;
    disableMicrophone: boolean;
    disableScreenCapture: boolean;
    disableUsbFileTransfer: boolean;
    disableBluetooth: boolean;
    disableFactoryReset: boolean;
    disableSafeBoot: boolean;
    disableStatusBar: boolean;
    disableKeyguard: boolean;
    disableVolumeAdjust: boolean;
    disableSettingsAccess: boolean;
    forceGpsAlwaysOn: boolean;
    enforceWifiSsid?: string;
  };
  usageMonitoring: {
    enabled: boolean;
    sampleIntervalMinutes: number;
    collectForegroundApp: boolean;
    collectScreenOnTime: boolean;
  };
  signature: string;
  publishedAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CommandType =
  | 'LOCK_DEVICE'
  | 'UNLOCK_DEVICE'
  | 'SYNC_POLICY'
  | 'REFRESH_DEVICE'
  | 'DEPLOY_APPLICATION'
  | 'UPDATE_APPLICATION'
  | 'REMOVE_MANAGED_APPLICATION'
  | 'REBOOT_DEVICE'
  | 'WIPE_DATA'
  | 'TRIGGER_ALARM';

export type CommandStatus = 'QUEUED' | 'SENT' | 'RECEIVED' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface RemoteCommand {
  id: string;
  deviceId: string;
  deviceName: string;
  commandType: CommandType;
  payload?: Record<string, any>;
  issuerName: string;
  issuerId: string;
  issuerRole: string;
  status: CommandStatus;
  issuedAt: string;
  executedAt?: string;
  expiresAt: string;
  nonce: string;
  resultMessage?: string;
  errorMessage?: string;
}

export interface AppUsageRecord {
  id: string;
  deviceId: string;
  studentId: string;
  studentName: string;
  packageName: string;
  applicationName: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  category: string;
  sessionCount: number;
}

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ViolationType =
  | 'UNAUTHORIZED_APP_ATTEMPT'
  | 'BLOCKED_DOMAIN_ACCESSED'
  | 'BLOCKED_KEYWORD_SEARCH'
  | 'POLICY_TAMPERING_ATTEMPT'
  | 'DEVICE_ROOT_DETECTED'
  | 'DEVELOPER_OPTIONS_ENABLED'
  | 'VPN_DISCONNECTED_UNEXPECTEDLY'
  | 'FACTORY_RESET_ATTEMPT'
  | 'ENROLLMENT_COMPLIANCE_FAILED';

export interface PolicyViolation {
  id: string;
  deviceId: string;
  deviceName: string;
  studentId: string;
  studentName: string;
  className: string;
  schoolId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  targetResource: string; // URL, Package name, or action
  description: string;
  timestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  schoolId: string;
  action: string;
  targetType: 'DEVICE' | 'POLICY' | 'STUDENT' | 'APPLICATION' | 'WEB_FILTER' | 'ENROLLMENT' | 'USER';
  targetId: string;
  targetDescription: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
  details?: Record<string, any>;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lockedDevices: number;
  tamperedDevices: number;
  totalStudents: number;
  totalApplications: number;
  activeDeployments: number;
  policyViolationsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recentActivities: Array<{
    id: string;
    timestamp: string;
    description: string;
    type: 'DEVICE' | 'DEPLOYMENT' | 'VIOLATION' | 'COMMAND' | 'POLICY';
    severity?: ViolationSeverity;
  }>;
  batteryDistribution: {
    good: number; // > 60%
    medium: number; // 20 - 60%
    low: number; // < 20%
  };
  deviceModelBreakdown: Array<{ model: string; count: number }>;
}

export interface EnrollmentToken {
  id: string;
  token: string;
  schoolId: string;
  schoolName: string;
  classId?: string;
  className?: string;
  policyId: string;
  policyName: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  qrPayload: string;
  wifiConfig?: {
    ssid: string;
    securityType: 'WPA' | 'WEP' | 'NONE';
    password?: string;
    hidden: boolean;
  };
}

export interface SystemRetentionSettings {
  heartbeatRetentionDays: number;
  appUsageRetentionDays: number;
  violationRetentionDays: number;
  auditLogRetentionDays: number;
  deviceOfflineThresholdMinutes: number;
  autoLockOnTamper: boolean;
  strictDnsFiltering: boolean;
}

export type MessagePriority = 'INFO' | 'WARNING' | 'URGENT' | 'EXAM';

export interface AdminBroadcastMessage {
  id: string;
  title: string;
  body: string;
  priority: MessagePriority;
  targetType: 'ALL' | 'CLASS' | 'DEVICE';
  targetId?: string;
  targetName?: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  expiresAt?: string;
  requireAcknowledgment: boolean;
  acknowledgedDeviceIds: string[];
}

export type StudyMaterialType = 'PDF' | 'RICH_NOTE' | 'WORKSHEET' | 'REFERENCE';

export interface StudyMaterial {
  id: string;
  title: string;
  description?: string;
  type: StudyMaterialType;
  schoolId: string;
  classId: string; // e.g. 'cls-12-a' or 'ALL'
  className: string; // e.g. 'Class XII-A' or 'All Classes'
  subject: string; // e.g. 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'
  chapterOrUnit?: string;
  fileUrl?: string; // Data URL (base64) or direct PDF link
  fileName?: string;
  fileSizeBytes?: number;
  contentMarkdown?: string; // Rich notes content
  authorName: string;
  authorRole: string;
  uploadedAt: string;
  allowOfflineDownload: boolean;
  viewCount: number;
}


