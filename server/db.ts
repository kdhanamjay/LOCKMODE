// EduGuard MDM — Server In-Memory State Store & Seed Data
// Models multi-tenant PostgreSQL schema in-memory with real-time mutation capabilities.

import {
  School,
  SchoolClass,
  Student,
  Device,
  Application,
  Deployment,
  DevicePolicy,
  WebFilterRule,
  WebFilterCategory,
  RemoteCommand,
  AppUsageRecord,
  PolicyViolation,
  AuditLog,
  EnrollmentToken,
  SystemRetentionSettings,
  DashboardStats,
  AdminUser,
  AdminBroadcastMessage,
  StudyMaterial,
  KioskExitRequest,
} from '../src/types/mdm';

export function generateMacAddress(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `00:1A:2B:${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`;
  }
  const hexDigits = '0123456789ABCDEF';
  let mac = '00:1A:2B:';
  for (let i = 0; i < 3; i++) {
    mac += hexDigits[Math.floor(Math.random() * 16)] + hexDigits[Math.floor(Math.random() * 16)];
    if (i < 2) mac += ':';
  }
  return mac;
}

export function generateUniqueStationPassword(prefix = 'EG'): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const char = chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${num}${char}`;
}

class DatabaseStore {
  schools: School[] = [];
  classes: SchoolClass[] = [];
  students: Student[] = [];
  devices: Device[] = [];
  applications: Application[] = [];
  deployments: Deployment[] = [];
  policies: DevicePolicy[] = [];
  webFilterRules: WebFilterRule[] = [];
  webFilterCategories: WebFilterCategory[] = [];
  remoteCommands: RemoteCommand[] = [];
  usageRecords: AppUsageRecord[] = [];
  violations: PolicyViolation[] = [];
  auditLogs: AuditLog[] = [];
  enrollmentTokens: EnrollmentToken[] = [];
  adminUsers: AdminUser[] = [];
  messages: AdminBroadcastMessage[] = [];
  studyMaterials: StudyMaterial[] = [];
  kioskExitRequests: KioskExitRequest[] = [];
  settings: SystemRetentionSettings = {
    heartbeatRetentionDays: 30,
    appUsageRetentionDays: 90,
    violationRetentionDays: 180,
    auditLogRetentionDays: 365,
    deviceOfflineThresholdMinutes: 5,
    autoLockOnTamper: true,
    strictDnsFiltering: true,
  };

  // Event listeners for SSE real-time broadcast
  private sseClients: Array<(event: string, data: any) => void> = [];

  constructor() {
    this.seedDatabase();
  }

  public subscribeSSE(client: (event: string, data: any) => void) {
    this.sseClients.push(client);
    return () => {
      this.sseClients = this.sseClients.filter((c) => c !== client);
    };
  }

  public broadcast(event: string, data: any) {
    this.sseClients.forEach((client) => {
      try {
        client(event, data);
      } catch (err) {
        // Ignore dead clients
      }
    });
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    this.broadcast('audit_log', log);
    return log;
  }

  public seedDatabase() {
    // 1. Admin Users
    this.adminUsers = [
      {
        id: 'usr-super-arvd',
        name: 'ARVD Exam Section Admin',
        email: 'arvdexamsection@gmail.com',
        role: 'SUPER_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School & Examination Center',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-admin-1',
        name: 'Sarah Jenkins',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-admin-greenwood',
        name: 'Sarah Jenkins',
        email: 'admin@greenwood-high.edu',
        role: 'SUPER_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Greenwood High School',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr-it-1',
        name: 'Alex Chen',
        email: 'alex.chen@school.edu',
        role: 'IT_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        permissions: ['DEVICES_MANAGE', 'POLICIES_MANAGE', 'APPS_DEPLOY', 'LOGS_VIEW'],
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'usr-it-2',
        name: 'Marcus Vance',
        email: 'marcus.vance@greenwood.edu',
        role: 'IT_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Greenwood High School',
        permissions: ['DEVICES_MANAGE', 'POLICIES_MANAGE', 'APPS_DEPLOY', 'LOGS_VIEW'],
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'usr-teacher-1',
        name: 'Vikram Malhotra',
        email: 'vikram.m@school.edu',
        role: 'TEACHER',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        permissions: ['CLASS_VIEW', 'DEVICE_LOCK_TEMP'],
        lastLogin: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'usr-super-1',
        name: 'Enterprise Super Admin',
        email: 'super@eduguard.io',
        role: 'SUPER_ADMIN',
        schoolId: 'sch-demo-01',
        schoolName: 'Global Org',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
      },
    ];

    // 2. Schools
    this.schools = [
      {
        id: 'sch-demo-01',
        name: 'Demo International School',
        code: 'DIS-MAIN',
        address: '450 Innovation Parkway, Tech Campus, Building A',
        campusesCount: 2,
        totalStudents: 340,
        totalDevices: 248,
        status: 'ACTIVE',
        createdAt: '2025-08-15T08:00:00.000Z',
      },
      {
        id: 'sch-demo-02',
        name: 'Oakridge STEM Academy',
        code: 'OSA-WEST',
        address: '1280 Science Boulevard, West Campus',
        campusesCount: 1,
        totalStudents: 180,
        totalDevices: 120,
        status: 'ACTIVE',
        createdAt: '2025-10-01T08:00:00.000Z',
      },
    ];

    // 3. Classes
    this.classes = [
      {
        id: 'cls-12-a',
        schoolId: 'sch-demo-01',
        campusId: 'cmp-main',
        name: 'Class XII-A',
        section: 'Senior High - Science',
        academicYear: '2026-2027',
        teacherId: 'usr-teacher-1',
        teacherName: 'Vikram Malhotra',
        studentCount: 32,
        deviceCount: 32,
        assignedPolicyId: 'pol-stem-v17',
      },
      {
        id: 'cls-12-b',
        schoolId: 'sch-demo-01',
        campusId: 'cmp-main',
        name: 'Class XII-B',
        section: 'Senior High - Commerce',
        academicYear: '2026-2027',
        studentCount: 28,
        deviceCount: 28,
        assignedPolicyId: 'pol-stem-v17',
      },
      {
        id: 'cls-11-a',
        schoolId: 'sch-demo-01',
        campusId: 'cmp-main',
        name: 'Class XI-A',
        section: 'Junior High - General',
        academicYear: '2026-2027',
        studentCount: 30,
        deviceCount: 30,
        assignedPolicyId: 'pol-stem-v17',
      },
    ];

    // 4. Policies
    this.policies = [
      {
        id: 'pol-stem-v17',
        name: 'High School STEM & Digital Classroom Policy',
        description: 'Enforces strict Kiosk multi-app launcher with approved coding tools, school LMS, and DNS sinkhole web filtering.',
        version: 17,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        isDefault: true,
        status: 'PUBLISHED',
        kioskMode: 'FULL_LOCKDOWN',
        allowlistOnly: true,
        allowedApplications: [
          'com.eduguard.mdm',
          'com.school.lms',
          'com.google.android.apps.classroom',
          'com.android.calculator2',
          'com.edu.pythonide',
          'com.eduguard.browser',
          'com.microsoft.teams',
          'com.edu.sciencelab',
        ],
        blockedApplications: [
          'com.instagram.android',
          'com.facebook.katana',
          'com.zhiliaoapp.musically', // TikTok
          'com.snapchat.android',
          'com.discord',
          'com.supercell.clashofclans',
          'com.roblox.client',
        ],
        kioskApps: [
          'com.school.lms',
          'com.google.android.apps.classroom',
          'com.android.calculator2',
          'com.edu.pythonide',
          'com.eduguard.browser',
          'com.edu.sciencelab',
        ],
        defaultKioskApp: 'com.school.lms',
        allowedDomains: [
          'school.edu',
          'classroom.google.com',
          'wikipedia.org',
          'khanacademy.org',
          'github.com',
          'python.org',
          'docs.python.org',
        ],
        blockedDomains: [
          'instagram.com',
          'facebook.com',
          'tiktok.com',
          'reddit.com',
          'discord.com',
          'netflix.com',
          'twitch.tv',
          'snapchat.com',
        ],
        blockedKeywords: [
          'casino',
          'gambling',
          'betting',
          'adult',
          'porn',
          'torrent',
          'dating',
          'vape',
        ],
        blockedCategories: [
          'Social Networking',
          'Gaming',
          'Gambling',
          'Adult Content',
          'Streaming',
          'Shopping',
          'Dating',
        ],
        restrictions: {
          disableCalls: true, // Telephony & outgoing voice calls blocked
          disableSms: true, // Cellular SMS messaging blocked
          disableCamera: false,
          disableMicrophone: false,
          disableScreenCapture: false,
          disableUsbFileTransfer: true,
          disableBluetooth: false,
          disableFactoryReset: true,
          disableSafeBoot: true,
          disableStatusBar: true,
          disableKeyguard: false,
          disableVolumeAdjust: false,
          disableSettingsAccess: true,
          forceGpsAlwaysOn: true,
          enforceWifiSsid: 'School-Enterprise-Secure',
        },
        usageMonitoring: {
          enabled: true,
          sampleIntervalMinutes: 15,
          collectForegroundApp: true,
          collectScreenOnTime: true,
        },
        signature: 'RSA-SHA256:4f8e9a2b1c3d7e5f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
        publishedAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z',
        createdBy: 'Sarah Jenkins',
      },
    ];

    // 5. Students
    this.students = [
      {
        id: 'stu-101',
        studentId: 'STU-2026-001',
        name: 'Rahul Sharma',
        email: 'rahul.s@school.edu',
        schoolId: 'sch-demo-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        section: 'Science',
        deviceId: 'dev-1024',
        deviceName: 'TAB-1024',
        status: 'ACTIVE',
        guardianName: 'Rajesh Sharma',
        guardianContact: '+1 (555) 234-5678',
        createdAt: '2025-09-01T09:00:00.000Z',
      },
      {
        id: 'stu-102',
        studentId: 'STU-2026-002',
        name: 'Ananya Verma',
        email: 'ananya.v@school.edu',
        schoolId: 'sch-demo-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        section: 'Science',
        deviceId: 'dev-1001',
        deviceName: 'TAB-1001',
        status: 'ACTIVE',
        guardianName: 'Sunita Verma',
        guardianContact: '+1 (555) 345-6789',
        createdAt: '2025-09-01T09:00:00.000Z',
      },
      {
        id: 'stu-103',
        studentId: 'STU-2026-003',
        name: 'Rohan Gupta',
        email: 'rohan.g@school.edu',
        schoolId: 'sch-demo-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        section: 'Science',
        deviceId: 'dev-1002',
        deviceName: 'TAB-1002',
        status: 'ACTIVE',
        guardianName: 'Amit Gupta',
        guardianContact: '+1 (555) 456-7890',
        createdAt: '2025-09-01T09:00:00.000Z',
      },
      {
        id: 'stu-104',
        studentId: 'STU-2026-004',
        name: 'Priya Nair',
        email: 'priya.n@school.edu',
        schoolId: 'sch-demo-01',
        classId: 'cls-12-b',
        className: 'Class XII-B',
        section: 'Commerce',
        deviceId: 'dev-1003',
        deviceName: 'TAB-1003',
        status: 'ACTIVE',
        guardianName: 'Kavita Nair',
        guardianContact: '+1 (555) 567-8901',
        createdAt: '2025-09-01T09:00:00.000Z',
      },
    ];

    // 6. Devices
    this.devices = [
      {
        id: 'dev-1024',
        deviceId: 'TAB-1024',
        serialNumber: 'R52N80Z19QK',
        name: "Rahul's School Tablet",
        model: 'Galaxy Tab S9 FE Education Edition',
        manufacturer: 'Samsung',
        osVersion: 'Android 15 (Vanilla Ice Cream)',
        agentVersion: '1.4.2',
        managementMode: 'DEVICE_OWNER',
        status: 'ONLINE',
        isLocked: false,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentId: 'stu-101',
        assignedStudentName: 'Rahul Sharma',
        assignedStudentRoll: '12-A-01',
        studentUsername: 'rahul.sharma',
        defaultPassword: 'EG-9281A',
        batteryLevel: 78,
        isCharging: false,
        networkType: 'WIFI',
        wifiSsid: 'School-Enterprise-Secure',
        ipAddress: '10.142.18.94',
        macAddress: '00:1A:2B:94:18:2A',
        storageTotalGb: 64.0,
        storageUsedGb: 14.2,
        ramTotalGb: 6.0,
        ramUsedGb: 2.3,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        lastHeartbeat: new Date().toISOString(),
        currentActiveApp: 'com.google.android.apps.classroom',
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:14:00.000Z',
        hardwareSecurity: {
          knoxSupported: true,
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
      {
        id: 'dev-1001',
        deviceId: 'TAB-1001',
        serialNumber: 'L83P91X42AB',
        name: "Ananya's Tablet",
        model: 'Lenovo Tab P12 Enterprise',
        manufacturer: 'Lenovo',
        osVersion: 'Android 14 (Upside Down Cake)',
        agentVersion: '1.4.2',
        managementMode: 'DEVICE_OWNER',
        status: 'ONLINE',
        isLocked: false,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentId: 'stu-102',
        assignedStudentName: 'Ananya Verma',
        assignedStudentRoll: '12-A-02',
        studentUsername: 'ananya.verma',
        defaultPassword: 'EG-7140B',
        batteryLevel: 92,
        isCharging: true,
        networkType: 'WIFI',
        wifiSsid: 'School-Enterprise-Secure',
        ipAddress: '10.142.18.95',
        macAddress: '00:1A:2B:95:22:3C',
        storageTotalGb: 128.0,
        storageUsedGb: 18.5,
        ramTotalGb: 8.0,
        ramUsedGb: 2.8,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        lastHeartbeat: new Date().toISOString(),
        currentActiveApp: 'com.edu.pythonide',
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:15:00.000Z',
        hardwareSecurity: {
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
      {
        id: 'dev-1002',
        deviceId: 'TAB-1002',
        serialNumber: 'NX6019M77CC',
        name: "Rohan's Tablet",
        model: 'Google Pixel Tablet Managed',
        manufacturer: 'Google',
        osVersion: 'Android 15 (Vanilla Ice Cream)',
        agentVersion: '1.4.2',
        managementMode: 'DEVICE_OWNER',
        status: 'LOCKED',
        isLocked: true,
        lockReason: 'Violation of digital classroom policy during math exam.',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentId: 'stu-103',
        assignedStudentName: 'Rohan Gupta',
        assignedStudentRoll: '12-A-03',
        studentUsername: 'rohan.gupta',
        defaultPassword: 'EG-6391C',
        batteryLevel: 45,
        isCharging: false,
        networkType: 'WIFI',
        wifiSsid: 'School-Enterprise-Secure',
        ipAddress: '10.142.18.96',
        macAddress: '00:1A:2B:96:4D:5E',
        storageTotalGb: 128.0,
        storageUsedGb: 22.0,
        ramTotalGb: 8.0,
        ramUsedGb: 3.1,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        lastHeartbeat: new Date(Date.now() - 2 * 60000).toISOString(),
        currentActiveApp: 'com.school.lms',
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:16:00.000Z',
        hardwareSecurity: {
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
      {
        id: 'dev-1003',
        deviceId: 'TAB-1003',
        serialNumber: 'S889A1209FF',
        name: "Priya's Tablet",
        model: 'Galaxy Tab A9+ Enterprise',
        manufacturer: 'Samsung',
        osVersion: 'Android 14',
        agentVersion: '1.4.2',
        managementMode: 'DEVICE_OWNER',
        status: 'OFFLINE',
        isLocked: false,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-b',
        className: 'Class XII-B',
        assignedStudentId: 'stu-104',
        assignedStudentName: 'Priya Nair',
        assignedStudentRoll: '12-B-04',
        studentUsername: 'priya.nair',
        defaultPassword: 'EG-5129D',
        batteryLevel: 14,
        isCharging: false,
        networkType: 'NONE',
        macAddress: '00:1A:2B:A9:12:09',
        ipAddress: '10.142.18.97',
        storageTotalGb: 64.0,
        storageUsedGb: 19.8,
        ramTotalGb: 4.0,
        ramUsedGb: 1.9,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        lastHeartbeat: new Date(Date.now() - 3600000 * 3).toISOString(),
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:17:00.000Z',
        hardwareSecurity: {
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
      {
        id: 'dev-pc-lab-101',
        deviceId: 'WIN-LAB-PC01',
        serialNumber: 'SN-WINLAB101X',
        name: 'Computer Lab Workstation #01',
        model: 'Dell OptiPlex 7090 Micro',
        manufacturer: 'Dell Inc.',
        platform: 'WINDOWS_PC',
        osVersion: 'Windows 11 Pro (x64)',
        agentVersion: '2.4.0',
        managementMode: 'DEVICE_OWNER',
        status: 'ONLINE',
        isLocked: true,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentId: 'stu-pc-01',
        assignedStudentName: 'Lab Station 01 User',
        assignedStudentRoll: 'PC-LAB-01',
        studentUsername: 'student.pc01',
        defaultPassword: 'EG-3891P',
        batteryLevel: 100,
        isCharging: true,
        networkType: 'WIFI',
        wifiSsid: 'Campus-Secure-Gigabit',
        ipAddress: '192.168.1.101',
        macAddress: '00:1A:2B:C4:72:01',
        storageTotalGb: 512.0,
        storageUsedGb: 42.1,
        ramTotalGb: 16.0,
        ramUsedGb: 4.8,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        lastHeartbeat: new Date().toISOString(),
        currentActiveApp: 'EduGuard Student Workspace Kiosk',
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:18:00.000Z',
        hardwareSecurity: {
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
      {
        id: 'dev-pc-lab-102',
        deviceId: 'WIN-LAB-PC02',
        serialNumber: 'SN-WINLAB102Y',
        name: 'Computer Lab Workstation #02',
        model: 'HP ProDesk 600 G6 Mini',
        manufacturer: 'HP',
        platform: 'WINDOWS_PC',
        osVersion: 'Windows 11 Enterprise (x64)',
        agentVersion: '2.4.0',
        managementMode: 'DEVICE_OWNER',
        status: 'ONLINE',
        isLocked: true,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentId: 'stu-pc-02',
        assignedStudentName: 'Lab Station 02 User',
        assignedStudentRoll: 'PC-LAB-02',
        studentUsername: 'student.pc02',
        defaultPassword: 'EG-8420K',
        batteryLevel: 100,
        isCharging: true,
        networkType: 'WIFI',
        wifiSsid: 'Campus-Secure-Gigabit',
        ipAddress: '192.168.1.102',
        macAddress: '00:1A:2B:D8:19:02',
        storageTotalGb: 512.0,
        storageUsedGb: 48.6,
        ramTotalGb: 16.0,
        ramUsedGb: 5.1,
        policyId: 'pol-stem-v17',
        policyVersion: 17,
        policySyncedAt: new Date(Date.now() - 3 * 60000).toISOString(),
        lastHeartbeat: new Date().toISOString(),
        currentActiveApp: 'EduGuard Student Workspace Kiosk',
        kioskMode: 'FULL_LOCKDOWN',
        enrollmentDate: '2025-09-02T10:19:00.000Z',
        hardwareSecurity: {
          playIntegrityPass: true,
          deviceRooted: false,
          developerOptionsDisabled: true,
          usbDebuggingDisabled: true,
        },
      },
    ];

    // 7. Applications
    this.applications = [
      {
        id: 'app-01',
        packageName: 'com.school.lms',
        name: 'School LMS Portal',
        version: '3.4.1',
        versionCode: 341,
        publisher: 'EduGuard Academic Solutions',
        iconUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
        category: 'EDUCATION',
        isApproved: true,
        distributionType: 'PRIVATE_ENTERPRISE_APK',
        apkSizeMb: 24.5,
        apkUrl: 'https://mdm.school.edu/downloads/school-lms-v3.4.1.apk',
        targetSdk: 35,
        minSdk: 26,
        installedCount: 231,
        pendingCount: 12,
        failedCount: 1,
        createdAt: '2025-08-20T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'app-02',
        packageName: 'com.google.android.apps.classroom',
        name: 'Google Classroom',
        version: '8.1.0',
        versionCode: 8100,
        publisher: 'Google LLC',
        iconUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=128&auto=format&fit=crop&q=80',
        category: 'EDUCATION',
        isApproved: true,
        distributionType: 'MANAGED_GOOGLE_PLAY',
        targetSdk: 35,
        minSdk: 26,
        installedCount: 245,
        pendingCount: 3,
        failedCount: 0,
        createdAt: '2025-08-20T08:00:00.000Z',
        updatedAt: '2026-02-10T08:00:00.000Z',
      },
      {
        id: 'app-03',
        packageName: 'com.android.calculator2',
        name: 'Standard Calculator',
        version: '12.0',
        versionCode: 120,
        publisher: 'AOSP / System',
        iconUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=128&auto=format&fit=crop&q=80',
        category: 'UTILITY',
        isApproved: true,
        distributionType: 'SYSTEM_PREINSTALLED',
        targetSdk: 35,
        minSdk: 26,
        installedCount: 248,
        pendingCount: 0,
        failedCount: 0,
        createdAt: '2025-08-20T08:00:00.000Z',
        updatedAt: '2025-08-20T08:00:00.000Z',
      },
      {
        id: 'app-04',
        packageName: 'com.edu.pythonide',
        name: 'Python Interactive IDE',
        version: '2.1.0',
        versionCode: 210,
        publisher: 'OpenEdu Foundation',
        iconUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80',
        category: 'EDUCATION',
        isApproved: true,
        distributionType: 'PRIVATE_ENTERPRISE_APK',
        apkSizeMb: 42.0,
        apkUrl: 'https://mdm.school.edu/downloads/python-ide-v2.1.apk',
        targetSdk: 35,
        minSdk: 26,
        installedCount: 220,
        pendingCount: 24,
        failedCount: 4,
        createdAt: '2025-09-10T08:00:00.000Z',
        updatedAt: '2026-02-01T08:00:00.000Z',
      },
      {
        id: 'app-05',
        packageName: 'com.eduguard.browser',
        name: 'EduGuard Safe Browser',
        version: '1.2.0',
        versionCode: 120,
        publisher: 'EduGuard Security',
        iconUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
        category: 'UTILITY',
        isApproved: true,
        distributionType: 'PRIVATE_ENTERPRISE_APK',
        apkSizeMb: 18.2,
        targetSdk: 35,
        minSdk: 26,
        installedCount: 248,
        pendingCount: 0,
        failedCount: 0,
        createdAt: '2025-08-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
      {
        id: 'app-06',
        packageName: 'com.instagram.android',
        name: 'Instagram',
        version: '315.0',
        versionCode: 3150,
        publisher: 'Meta Platforms',
        iconUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&auto=format&fit=crop&q=80',
        category: 'RESTRICTED',
        isApproved: false,
        distributionType: 'MANAGED_GOOGLE_PLAY',
        targetSdk: 35,
        minSdk: 26,
        installedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        createdAt: '2025-08-20T08:00:00.000Z',
        updatedAt: '2025-08-20T08:00:00.000Z',
      },
    ];

    // 8. Deployments
    this.deployments = [
      {
        id: 'dep-2026-01',
        applicationId: 'app-04',
        applicationName: 'Python Interactive IDE',
        packageName: 'com.edu.pythonide',
        version: '2.1.0',
        targetType: 'CLASS',
        targetId: 'cls-12-a',
        targetName: 'Class XII-A',
        status: 'INSTALLED',
        totalDevices: 32,
        successCount: 30,
        failedCount: 0,
        pendingCount: 2,
        initiatedBy: 'Sarah Jenkins',
        initiatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: 'dep-2026-02',
        applicationId: 'app-01',
        applicationName: 'School LMS Portal',
        packageName: 'com.school.lms',
        version: '3.4.1',
        targetType: 'ALL_DEVICES',
        targetId: 'all',
        targetName: 'All School Devices',
        status: 'INSTALLED',
        totalDevices: 248,
        successCount: 231,
        failedCount: 2,
        pendingCount: 15,
        initiatedBy: 'Alex Chen',
        initiatedAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 80000000).toISOString(),
      },
    ];

    // 9. Web Filter Categories & Rules
    this.webFilterCategories = [
      { id: 'cat-social', name: 'Social Networking', description: 'Instagram, TikTok, Facebook, Twitter, Reddit', blocked: true, sampleDomains: ['instagram.com', 'tiktok.com', 'facebook.com', 'x.com'] },
      { id: 'cat-gaming', name: 'Online Gaming', description: 'Roblox, Steam, Discord, Twitch, Epic Games', blocked: true, sampleDomains: ['roblox.com', 'steampowered.com', 'discord.com', 'twitch.tv'] },
      { id: 'cat-gambling', name: 'Gambling & Betting', description: 'Online casinos, sports betting, lottery', blocked: true, sampleDomains: ['bet365.com', 'draftkings.com', 'pokerstars.com'] },
      { id: 'cat-adult', name: 'Adult & Explicit Content', description: 'Pornography, mature content, violence', blocked: true, sampleDomains: ['adultcontent.net', 'chaturbate.com'] },
      { id: 'cat-streaming', name: 'Video Streaming (Entertainment)', description: 'Netflix, Disney+, Hulu, Prime Video', blocked: true, sampleDomains: ['netflix.com', 'disneyplus.com', 'hulu.com'] },
      { id: 'cat-shopping', name: 'E-Commerce & Shopping', description: 'Amazon, eBay, AliExpress, Shein', blocked: false, sampleDomains: ['amazon.com', 'ebay.com'] },
      { id: 'cat-messaging', name: 'Personal Messaging', description: 'WhatsApp Web, Telegram, Snapchat Web', blocked: true, sampleDomains: ['web.whatsapp.com', 'telegram.org'] },
    ];

    this.webFilterRules = [
      { id: 'wfr-01', type: 'DOMAIN', pattern: 'school.edu', action: 'ALLOW', targetScope: 'GLOBAL', description: 'Official School Portal', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-02', type: 'DOMAIN', pattern: 'classroom.google.com', action: 'ALLOW', targetScope: 'GLOBAL', description: 'Google Classroom', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-03', type: 'DOMAIN', pattern: 'wikipedia.org', action: 'ALLOW', targetScope: 'GLOBAL', description: 'Wikipedia Encyclopedia', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-04', type: 'DOMAIN', pattern: 'khanacademy.org', action: 'ALLOW', targetScope: 'GLOBAL', description: 'Khan Academy Tutorials', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-05', type: 'DOMAIN', pattern: 'instagram.com', action: 'BLOCK', category: 'Social Networking', targetScope: 'GLOBAL', description: 'Block Instagram', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-06', type: 'DOMAIN', pattern: 'tiktok.com', action: 'BLOCK', category: 'Social Networking', targetScope: 'GLOBAL', description: 'Block TikTok', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-07', type: 'DOMAIN', pattern: 'facebook.com', action: 'BLOCK', category: 'Social Networking', targetScope: 'GLOBAL', description: 'Block Facebook', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-08', type: 'DOMAIN', pattern: 'discord.com', action: 'BLOCK', category: 'Gaming', targetScope: 'GLOBAL', description: 'Block Discord', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-09', type: 'KEYWORD', pattern: 'casino', action: 'BLOCK', category: 'Gambling', targetScope: 'GLOBAL', description: 'Block casino searches', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-10', type: 'KEYWORD', pattern: 'betting', action: 'BLOCK', category: 'Gambling', targetScope: 'GLOBAL', description: 'Block betting searches', createdAt: '2025-08-20T08:00:00.000Z' },
      { id: 'wfr-11', type: 'KEYWORD', pattern: 'torrent', action: 'BLOCK', targetScope: 'GLOBAL', description: 'Block torrent downloads', createdAt: '2025-08-20T08:00:00.000Z' },
    ];

    // 10. App Usage Telemetry Records
    const todayStr = new Date().toISOString().split('T')[0];
    this.usageRecords = [
      { id: 'usr-rec-01', deviceId: 'dev-1024', studentId: 'stu-101', studentName: 'Rahul Sharma', packageName: 'com.google.android.apps.classroom', applicationName: 'Google Classroom', durationMinutes: 134, date: todayStr, category: 'EDUCATION', sessionCount: 6 },
      { id: 'usr-rec-02', deviceId: 'dev-1024', studentId: 'stu-101', studentName: 'Rahul Sharma', packageName: 'com.edu.pythonide', applicationName: 'Python Interactive IDE', durationMinutes: 46, date: todayStr, category: 'EDUCATION', sessionCount: 3 },
      { id: 'usr-rec-03', deviceId: 'dev-1024', studentId: 'stu-101', studentName: 'Rahul Sharma', packageName: 'com.school.lms', applicationName: 'School LMS Portal', durationMinutes: 38, date: todayStr, category: 'EDUCATION', sessionCount: 4 },
      { id: 'usr-rec-04', deviceId: 'dev-1024', studentId: 'stu-101', studentName: 'Rahul Sharma', packageName: 'com.android.calculator2', applicationName: 'Calculator', durationMinutes: 8, date: todayStr, category: 'UTILITY', sessionCount: 2 },
      { id: 'usr-rec-05', deviceId: 'dev-1001', studentId: 'stu-102', studentName: 'Ananya Verma', packageName: 'com.edu.pythonide', applicationName: 'Python Interactive IDE', durationMinutes: 110, date: todayStr, category: 'EDUCATION', sessionCount: 5 },
      { id: 'usr-rec-06', deviceId: 'dev-1001', studentId: 'stu-102', studentName: 'Ananya Verma', packageName: 'com.google.android.apps.classroom', applicationName: 'Google Classroom', durationMinutes: 75, date: todayStr, category: 'EDUCATION', sessionCount: 3 },
    ];

    // 11. Policy Violations
    this.violations = [
      {
        id: 'viol-01',
        deviceId: 'dev-1024',
        deviceName: 'TAB-1024',
        studentId: 'stu-101',
        studentName: 'Rahul Sharma',
        className: 'Class XII-A',
        schoolId: 'sch-demo-01',
        type: 'BLOCKED_DOMAIN_ACCESSED',
        severity: 'MEDIUM',
        targetResource: 'https://instagram.com/explore',
        description: 'Student browser attempted connection to blocked social media domain.',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        isResolved: false,
      },
      {
        id: 'viol-02',
        deviceId: 'dev-1002',
        deviceName: 'TAB-1002',
        studentId: 'stu-103',
        studentName: 'Rohan Gupta',
        className: 'Class XII-A',
        schoolId: 'sch-demo-01',
        type: 'UNAUTHORIZED_APP_ATTEMPT',
        severity: 'HIGH',
        targetResource: 'com.roblox.client',
        description: 'Sideloading or unauthorized execution attempt intercepted by DPC Kiosk lock.',
        timestamp: new Date(Date.now() - 17 * 60000).toISOString(),
        isResolved: false,
      },
      {
        id: 'viol-03',
        deviceId: 'dev-1002',
        deviceName: 'TAB-1002',
        studentId: 'stu-103',
        studentName: 'Rohan Gupta',
        className: 'Class XII-A',
        schoolId: 'sch-demo-01',
        type: 'POLICY_TAMPERING_ATTEMPT',
        severity: 'CRITICAL',
        targetResource: 'android.settings.SETTINGS',
        description: 'Repeated attempt to open system Settings app to disable EduGuard Device Owner.',
        timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
        isResolved: true,
        resolvedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        resolvedBy: 'Alex Chen',
        resolutionNote: 'Device remotely locked by IT Administrator. Student advised.',
      },
      {
        id: 'viol-04',
        deviceId: 'dev-1003',
        deviceName: 'TAB-1003',
        studentId: 'stu-104',
        studentName: 'Priya Nair',
        className: 'Class XII-B',
        schoolId: 'sch-demo-01',
        type: 'BLOCKED_KEYWORD_SEARCH',
        severity: 'LOW',
        targetResource: 'search?q=online+betting+games',
        description: 'Search keyword query triggered gambling category filter.',
        timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
        isResolved: true,
        resolvedAt: new Date(Date.now() - 60 * 60000).toISOString(),
        resolvedBy: 'Sarah Jenkins',
      },
    ];

    // 12. Remote Commands Queue
    this.remoteCommands = [
      {
        id: 'cmd-9901',
        deviceId: 'dev-1002',
        deviceName: 'TAB-1002',
        commandType: 'LOCK_DEVICE',
        payload: { reason: 'Violation of digital classroom policy during math exam.' },
        issuerName: 'Alex Chen',
        issuerId: 'usr-it-1',
        issuerRole: 'IT_ADMIN',
        status: 'SUCCESS',
        issuedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        executedAt: new Date(Date.now() - 19.8 * 60000).toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        nonce: 'nonce-8912401',
        resultMessage: 'Screen locked with Device Owner security banner.',
      },
      {
        id: 'cmd-9902',
        deviceId: 'dev-1024',
        deviceName: 'TAB-1024',
        commandType: 'SYNC_POLICY',
        payload: { targetVersion: 17 },
        issuerName: 'Sarah Jenkins',
        issuerId: 'usr-admin-1',
        issuerRole: 'SCHOOL_ADMIN',
        status: 'SUCCESS',
        issuedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        executedAt: new Date(Date.now() - 14.9 * 60000).toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        nonce: 'nonce-8912402',
        resultMessage: 'Policy v17 synchronized and validated.',
      },
    ];

    // 13. Audit Logs
    this.auditLogs = [
      {
        id: 'aud-01',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        adminId: 'usr-it-1',
        adminName: 'Alex Chen',
        adminRole: 'IT_ADMIN',
        schoolId: 'sch-demo-01',
        action: 'LOCK_DEVICE',
        targetType: 'DEVICE',
        targetId: 'dev-1002',
        targetDescription: "Locked Rohan's tablet (TAB-1002) due to repeated policy tampering.",
        ipAddress: '192.168.1.105',
        status: 'SUCCESS',
        details: { reason: 'Exam security violation' },
      },
      {
        id: 'aud-02',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        adminId: 'usr-admin-1',
        adminName: 'Sarah Jenkins',
        adminRole: 'SCHOOL_ADMIN',
        schoolId: 'sch-demo-01',
        action: 'DEPLOY_APPLICATION',
        targetType: 'APPLICATION',
        targetId: 'app-04',
        targetDescription: 'Deployed Python Interactive IDE v2.1.0 to Class XII-A',
        ipAddress: '192.168.1.100',
        status: 'SUCCESS',
        details: { targetType: 'CLASS', targetId: 'cls-12-a' },
      },
      {
        id: 'aud-03',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        adminId: 'usr-admin-1',
        adminName: 'Sarah Jenkins',
        adminRole: 'SCHOOL_ADMIN',
        schoolId: 'sch-demo-01',
        action: 'UPDATE_POLICY',
        targetType: 'POLICY',
        targetId: 'pol-stem-v17',
        targetDescription: 'Published Policy v17 (High School STEM Policy with strict Kiosk lock)',
        ipAddress: '192.168.1.100',
        status: 'SUCCESS',
      },
      {
        id: 'aud-04',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        adminId: 'usr-admin-1',
        adminName: 'Sarah Jenkins',
        adminRole: 'SCHOOL_ADMIN',
        schoolId: 'sch-demo-01',
        action: 'LOGIN',
        targetType: 'USER',
        targetId: 'usr-admin-1',
        targetDescription: 'Administrator logged into management console',
        ipAddress: '192.168.1.100',
        status: 'SUCCESS',
      },
    ];

    // 14. Enrollment Tokens
    this.enrollmentTokens = [
      {
        id: 'tok-01',
        token: 'ENR-DIS-2026-X892J',
        schoolId: 'sch-demo-01',
        schoolName: 'Demo International School',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        policyId: 'pol-stem-v17',
        policyName: 'High School STEM & Digital Classroom Policy (v17)',
        maxUses: 50,
        usedCount: 32,
        expiresAt: '2026-12-31T23:59:59.000Z',
        createdAt: '2025-08-20T08:00:00.000Z',
        createdBy: 'Sarah Jenkins',
        qrPayload: JSON.stringify({
          'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME': 'com.eduguard.mdm/.dpc.EduGuardDeviceAdminReceiver',
          'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION': 'https://mdm.school.edu/downloads/eduguard-dpc-v1.4.2.apk',
          'android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM': '4a7b2c9e1f8a3d5b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
          'android.app.extra.PROVISIONING_WIFI_SSID': 'School-Enterprise-Secure',
          'android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE': 'WPA',
          'android.app.extra.PROVISIONING_WIFI_PASSWORD': 'SchoolSecurePassphrase2026',
          'android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE': {
            server_url: 'https://mdm.school.edu/api',
            enrollment_token: 'ENR-DIS-2026-X892J',
            school_id: 'sch-demo-01',
            class_id: 'cls-12-a',
            policy_id: 'pol-stem-v17',
            auto_lockdown: true,
          },
        }),
        wifiConfig: {
          ssid: 'School-Enterprise-Secure',
          securityType: 'WPA',
          hidden: false,
        },
      },
    ];

    this.messages = [
      {
        id: 'msg-01',
        title: 'Morning Assembly & Exam Instructions',
        body: 'Please ensure your tablets are kept on your designated desks. The Physics Midterm Exam starts at 10:45 AM. Kiosk lock is active.',
        priority: 'INFO',
        targetType: 'ALL',
        senderName: 'Principal Dr. Eleanor Wright',
        senderRole: 'PRINCIPAL',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        requireAcknowledgment: false,
        acknowledgedDeviceIds: ['dev-tab-1024'],
      },
      {
        id: 'msg-02',
        title: 'Class XII-A: Open Chemistry Periodic Table',
        body: 'Lab session starting. Launch Chemistry Lab Simulator Module 4 for today’s stoichiometry experiment.',
        priority: 'URGENT',
        targetType: 'CLASS',
        targetId: 'cls-12-a',
        targetName: 'Class XII-A',
        senderName: 'Prof. Marcus Vance',
        senderRole: 'TEACHER',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        requireAcknowledgment: true,
        acknowledgedDeviceIds: [],
      }
    ];

    // Seed Class-wise & Subject-wise Notes and PDF Study Materials
    this.studyMaterials = [
      {
        id: 'mat-01',
        title: 'Class XII: Differential & Integral Calculus Complete Formula Handbook',
        description: 'Comprehensive formula derivations, limits, standard integrals, and trigonometric substitutions for CBSE/State Board exams.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        subject: 'Mathematics',
        chapterOrUnit: 'Unit 3: Calculus',
        fileName: 'Class_12_Calculus_Formula_Sheet.pdf',
        fileSizeBytes: 2450000,
        contentMarkdown: `# Differential & Integral Calculus Summary Guide
## 1. Limits & Continuity
- **Definition of Derivative**: $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$
- **Chain Rule**: $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$
- **Product Rule**: $(uv)' = u'v + uv'$
- **Quotient Rule**: $(\\frac{u}{v})' = \\frac{u'v - uv'}{v^2}$

## 2. Standard Integrals
- $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$
- $\\int \\frac{1}{x} dx = \\ln|x| + C$
- $\\int e^{ax} dx = \\frac{1}{a}e^{ax} + C$
- $\\int \\sin(ax) dx = -\\frac{1}{a}\\cos(ax) + C$
- $\\int \\cos(ax) dx = \\frac{1}{a}\\sin(ax) + C$

## 3. Integration by Parts
$$\\int u \\cdot v \\, dx = u \\int v \\, dx - \\int \\left( u' \\int v \\, dx \\right) dx$$`,
        authorName: 'Prof. Marcus Vance',
        authorRole: 'TEACHER',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        allowOfflineDownload: true,
        viewCount: 48,
      },
      {
        id: 'mat-02',
        title: 'Electromagnetic Induction & Alternating Current (AC) Notes',
        description: 'Faraday’s laws of induction, Lenz’s Law, self & mutual inductance, LCR series circuit impedance diagrams.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        subject: 'Physics',
        chapterOrUnit: 'Chapter 6 & 7: Electromagnetism',
        fileName: 'Physics_EMI_and_AC_Notes.pdf',
        fileSizeBytes: 3120000,
        contentMarkdown: `# Electromagnetic Induction (EMI) & AC Notes
## Faraday's Laws
1. Whenever the magnetic flux linked with a circuit changes, an induced electromotive force (EMF) is set up in it.
2. The magnitude of induced EMF is directly proportional to the rate of change of magnetic flux:
   $$\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}$$

## Lenz's Law
The polarity of induced EMF is always such that it tends to produce a current which opposes the change in magnetic flux that produces it (Conservation of Energy).

## LCR Series Resonance
At resonance frequency:
$$f_r = \\frac{1}{2\\pi \\sqrt{LC}}$$
Impedance is minimum: $Z = R$.`,
        authorName: 'Dr. Eleanor Wright',
        authorRole: 'TEACHER',
        uploadedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        allowOfflineDownload: true,
        viewCount: 62,
      },
      {
        id: 'mat-03',
        title: 'Coordination Compounds & Transition Metals Reaction Mechanisms',
        description: 'Crystal Field Theory (CFT), IUPAC naming of coordination complexes, isomerism, and color transitions in d-block.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        subject: 'Chemistry',
        chapterOrUnit: 'Chapter 9: Inorganic Chemistry',
        fileName: 'Coordination_Compounds_Class12.pdf',
        fileSizeBytes: 1890000,
        contentMarkdown: `# Coordination Chemistry Study Guide
## IUPAC Nomenclature Rules
1. Name the cation first, then the anion.
2. Within the coordination sphere, name ligands in alphabetical order before the central metal atom.
3. Use prefixes: di, tri, tetra, penta, hexa (or bis, tris for polydentate ligands).
4. Oxidation state of central metal is indicated in Roman numerals in parentheses.

## Crystal Field Splitting (Octahedral)
- d-orbitals split into two sets: lower energy $t_{2g}$ ($d_{xy}, d_{yz}, d_{zx}$) and higher energy $e_g$ ($d_{x^2-y^2}, d_{z^2}$).
- Splitting energy $\\Delta_o$.
- Strong field ligands (e.g. $CN^-, CO$) cause pairing before filling $e_g$.`,
        authorName: 'Prof. Marcus Vance',
        authorRole: 'TEACHER',
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        allowOfflineDownload: true,
        viewCount: 39,
      },
      {
        id: 'mat-04',
        title: 'Genetics & Molecular Basis of Inheritance Revision Blueprint',
        description: 'DNA replication mechanisms, transcription, translation, Lac Operon model, and Mendelian dihybrid ratios.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        subject: 'Biology',
        chapterOrUnit: 'Chapter 5 & 6: Genetics',
        fileName: 'Biology_Molecular_Inheritance.pdf',
        fileSizeBytes: 4200000,
        contentMarkdown: `# Molecular Basis of Inheritance
## Structure of DNA
- Double helix model proposed by Watson & Crick (1953).
- Antiparallel strands ($5' \\to 3'$ and $3' \\to 5'$).
- Complementary base pairing: $A = T$ (2 hydrogen bonds), $G \\equiv C$ (3 hydrogen bonds).

## Central Dogma of Molecular Biology
$$\\text{DNA} \\xrightarrow{\\text{Transcription}} \\text{mRNA} \\xrightarrow{\\text{Translation}} \\text{Protein}$$`,
        authorName: 'Sarah Jenkins',
        authorRole: 'SUPER_ADMIN',
        uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        allowOfflineDownload: true,
        viewCount: 51,
      },
      {
        id: 'mat-05',
        title: 'Class X: Quadratic Equations & Arithmetic Progressions Practice Sheet',
        description: 'Standard quadratic formula, discriminant nature of roots, sum of nth terms of an AP with step-by-step solutions.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-10-a',
        className: 'Class X-A',
        subject: 'Mathematics',
        chapterOrUnit: 'Chapter 4 & 5',
        fileName: 'Class_10_Quadratic_and_AP_Notes.pdf',
        fileSizeBytes: 1450000,
        contentMarkdown: `# Class X Mathematics Study Notes
## Quadratic Equation
Standard form: $ax^2 + bx + c = 0 \\quad (a \\neq 0)$
Discriminant: $D = b^2 - 4ac$
- If $D > 0$: Two distinct real roots
- If $D = 0$: Two equal real roots ($-b/2a$)
- If $D < 0$: No real roots

## Arithmetic Progression (AP)
- $n^{\\text{th}}$ term: $a_n = a + (n - 1)d$
- Sum of $n$ terms: $S_n = \\frac{n}{2}[2a + (n - 1)d] = \\frac{n}{2}(a + l)$`,
        authorName: 'Prof. Marcus Vance',
        authorRole: 'TEACHER',
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        allowOfflineDownload: true,
        viewCount: 34,
      },
      {
        id: 'mat-06',
        title: 'Computer Science: Python Data Structures & Algorithmic Complexity',
        description: 'Lists, Tuples, Dictionaries, Stack/Queue operations, recursion, Big-O notation reference chart.',
        type: 'PDF',
        schoolId: 'sch-greenwood-01',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        subject: 'Computer Science',
        chapterOrUnit: 'Unit 2: Data Structures',
        fileName: 'Python_DataStructures_CS12.pdf',
        fileSizeBytes: 2100000,
        contentMarkdown: `# Python Data Structures & Complexity
## Time Complexity Reference
- List append / pop(): $O(1)$
- List search (in): $O(n)$
- Dictionary lookup / insert: $O(1)$ average
- Binary search: $O(\\log n)$
- QuickSort / MergeSort: $O(n \\log n)$`,
        authorName: 'Prof. Marcus Vance',
        authorRole: 'TEACHER',
        uploadedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        allowOfflineDownload: true,
        viewCount: 42,
      },
    ];
  }

  // Get aggregated dashboard statistics
  public getDashboardStats(): DashboardStats {
    const totalDevices = this.devices.length;
    const onlineDevices = this.devices.filter((d) => d.status === 'ONLINE').length;
    const offlineDevices = this.devices.filter((d) => d.status === 'OFFLINE').length;
    const lockedDevices = this.devices.filter((d) => d.isLocked || d.status === 'LOCKED').length;
    const tamperedDevices = this.devices.filter((d) => d.status === 'TAMPERED').length;

    const criticalViolations = this.violations.filter((v) => v.severity === 'CRITICAL').length;
    const highViolations = this.violations.filter((v) => v.severity === 'HIGH').length;
    const mediumViolations = this.violations.filter((v) => v.severity === 'MEDIUM').length;
    const lowViolations = this.violations.filter((v) => v.severity === 'LOW').length;

    const goodBattery = this.devices.filter((d) => d.batteryLevel > 60).length;
    const medBattery = this.devices.filter((d) => d.batteryLevel >= 20 && d.batteryLevel <= 60).length;
    const lowBattery = this.devices.filter((d) => d.batteryLevel < 20).length;

    const modelMap = new Map<string, number>();
    this.devices.forEach((d) => {
      modelMap.set(d.model, (modelMap.get(d.model) || 0) + 1);
    });
    const deviceModelBreakdown = Array.from(modelMap.entries()).map(([model, count]) => ({ model, count }));

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      lockedDevices,
      tamperedDevices,
      totalStudents: this.students.length,
      totalApplications: this.applications.length,
      activeDeployments: this.deployments.filter((dep) => dep.status === 'PENDING' || dep.status === 'INSTALLING').length,
      policyViolationsCount: {
        critical: criticalViolations,
        high: highViolations,
        medium: mediumViolations,
        low: lowViolations,
        total: this.violations.length,
      },
      recentActivities: [
        { id: 'act-1', timestamp: '10:31 AM', description: "Rahul's tablet (TAB-1024) came online and sent heartbeat", type: 'DEVICE', severity: 'LOW' },
        { id: 'act-2', timestamp: '10:29 AM', description: 'Python Interactive IDE deployed to Class XII-A', type: 'DEPLOYMENT' },
        { id: 'act-3', timestamp: '10:27 AM', description: 'Instagram access blocked via DNS sinkhole on TAB-1024', type: 'VIOLATION', severity: 'MEDIUM' },
        { id: 'act-4', timestamp: '10:22 AM', description: "Device TAB-1002 remotely locked due to security policy violation", type: 'COMMAND', severity: 'HIGH' },
        { id: 'act-5', timestamp: '10:15 AM', description: 'Policy v17 synchronized on 32 devices in Class XII-A', type: 'POLICY' },
      ],
      batteryDistribution: {
        good: goodBattery,
        medium: medBattery,
        low: lowBattery,
      },
      deviceModelBreakdown,
    };
  }
}

export const db = new DatabaseStore();
