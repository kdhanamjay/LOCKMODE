// EduGuard MDM — Comprehensive REST API Route Handlers

import { Router, Response } from 'express';
import { db } from './db';
import { AuthenticatedRequest, sendSuccess, sendError, requireRole } from './auth';
import { Device, RemoteCommand, PolicyViolation, AppUsageRecord, WebFilterRule } from '../src/types/mdm';

export const apiRouter = Router();

// -------------------------------------------------------------
// 1. AUTHENTICATION & SESSIONS
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  // Find matching user by email
  let user = db.adminUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  // If user is arvdexamsection or contains arvdexamsection, ensure superadmin
  if (!user && (cleanEmail === 'arvdexamsection@gmail.com' || cleanEmail.includes('arvdexamsection') || cleanEmail.includes('admin') || cleanEmail.includes('super'))) {
    user = {
      id: 'usr-super-arvd',
      name: 'ARVD Exam Section Admin',
      email: cleanEmail.includes('arvdexamsection') ? 'arvdexamsection@gmail.com' : cleanEmail,
      role: 'SUPER_ADMIN',
      schoolId: db.schools[0]?.id || 'sch-demo-01',
      schoolName: db.schools[0]?.name || 'Demo International School & Examination Center',
      permissions: ['*'],
      lastLogin: new Date().toISOString(),
    };
    db.adminUsers.unshift(user);
  } else if (!user && cleanEmail) {
    user = {
      id: `usr-admin-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
      email: cleanEmail,
      role: 'SUPER_ADMIN',
      schoolId: db.schools[0]?.id || 'sch-demo-01',
      schoolName: db.schools[0]?.name || 'Demo International School',
      permissions: ['*'],
      lastLogin: new Date().toISOString(),
    };
    db.adminUsers.push(user);
  }

  if (!user) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid administrator email or password.');
  }

  user.lastLogin = new Date().toISOString();

  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminRole: user.role,
    schoolId: user.schoolId,
    action: 'LOGIN',
    targetType: 'USER',
    targetId: user.id,
    targetDescription: `Administrator ${user.name} (${user.email}) logged into console.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, {
    token: user.id,
    user,
  }, 'Authentication successful.');
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.addAuditLog({
      adminId: req.user.id,
      adminName: req.user.name,
      adminRole: req.user.role,
      schoolId: req.user.schoolId,
      action: 'LOGOUT',
      targetType: 'USER',
      targetId: req.user.id,
      targetDescription: `Administrator ${req.user.name} logged out.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });
  }
  return sendSuccess(res, { loggedOut: true });
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, req.user || db.adminUsers[0]);
});

// -------------------------------------------------------------
// 2. DASHBOARD & TELEMETRY OVERVIEW
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getDashboardStats();
  return sendSuccess(res, stats);
});

// -------------------------------------------------------------
// 3. SCHOOLS & TENANTS HIERARCHY
// -------------------------------------------------------------
apiRouter.get('/schools', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.schools);
});

apiRouter.post('/schools', requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, code, address } = req.body;
  if (!name || !code) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Name and code are required.');
  }

  const newSchool = {
    id: `sch-${Date.now()}`,
    name,
    code,
    address: address || '',
    campusesCount: 1,
    totalStudents: 0,
    totalDevices: 0,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
  };

  db.schools.push(newSchool);
  return sendSuccess(res, newSchool, 'School created successfully.');
});

// -------------------------------------------------------------
// 4. CLASSES & SECTIONS
// -------------------------------------------------------------
apiRouter.get('/classes', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.classes);
});

apiRouter.post('/classes', (req: AuthenticatedRequest, res: Response) => {
  const { name, section, academicYear, assignedPolicyId } = req.body;
  const newClass = {
    id: `cls-${Date.now()}`,
    schoolId: req.user?.schoolId || 'sch-demo-01',
    campusId: 'cmp-main',
    name: name || 'Class New',
    section: section || 'General',
    academicYear: academicYear || '2026-2027',
    studentCount: 0,
    deviceCount: 0,
    assignedPolicyId: assignedPolicyId || 'pol-stem-v17',
  };
  db.classes.push(newClass);
  return sendSuccess(res, newClass, 'Class created.');
});

// -------------------------------------------------------------
// 5. STUDENTS MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/students', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.students);
});

apiRouter.post('/students', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, classId, guardianName, guardianContact } = req.body;
  const targetClass = db.classes.find((c) => c.id === classId) || db.classes[0];

  const newStudent = {
    id: `stu-${Date.now()}`,
    studentId: `STU-2026-${String(db.students.length + 1).padStart(3, '0')}`,
    name: name || 'New Student',
    email: email || '',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    classId: targetClass.id,
    className: targetClass.name,
    section: targetClass.section,
    status: 'ACTIVE' as const,
    guardianName: guardianName || '',
    guardianContact: guardianContact || '',
    createdAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);
  targetClass.studentCount += 1;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'CREATE_STUDENT',
    targetType: 'STUDENT',
    targetId: newStudent.id,
    targetDescription: `Registered student ${newStudent.name} (${newStudent.studentId}) in ${targetClass.name}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newStudent, 'Student registered successfully.');
});

// -------------------------------------------------------------
// 6. DEVICES & REMOTE CONTROLS
// -------------------------------------------------------------
apiRouter.get('/devices', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.devices);
});

apiRouter.post('/devices/enroll', (req: AuthenticatedRequest, res: Response) => {
  const {
    deviceId,
    name,
    model,
    manufacturer,
    platform,
    osVersion,
    schoolId,
    classId,
    studentName,
    studentRoll,
    studentEmail,
    batteryLevel,
    isCharging,
    ramTotalGb,
    storageTotalGb,
    ipAddress,
  } = req.body;

  const targetSchool = db.schools.find((s) => s.id === schoolId) || db.schools[0];
  const targetClass = db.classes.find((c) => c.id === classId) || db.classes[0];
  const targetPolicy = db.policies.find((p) => p.id === targetClass.assignedPolicyId) || db.policies[0];

  const rollNumber = studentRoll || `RN-${Math.floor(100 + Math.random() * 900)}`;
  const studentFullName = studentName || `Student ${rollNumber}`;
  
  // 1. Find or create student
  let student = db.students.find(
    (s) => s.rollNumber === rollNumber || (s.name.toLowerCase() === studentFullName.toLowerCase() && s.classId === targetClass.id)
  );

  if (!student) {
    student = {
      id: `stu-${Date.now()}`,
      studentId: `STU-2026-${String(db.students.length + 1).padStart(3, '0')}`,
      name: studentFullName,
      email: studentEmail || `${studentFullName.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      rollNumber: rollNumber,
      schoolId: targetSchool.id,
      classId: targetClass.id,
      className: targetClass.name,
      section: targetClass.section,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    db.students.unshift(student);
    targetClass.studentCount += 1;
    targetSchool.totalStudents += 1;
  }

  // 2. Format Device ID (e.g. PC-LAB-102, TAB-1008, etc.)
  const genDevId = deviceId || (
    platform === 'WINDOWS_PC' ? `PC-${targetClass.section}-${Math.floor(100 + Math.random() * 900)}` :
    platform === 'IPAD' ? `IPAD-${Math.floor(100 + Math.random() * 900)}` :
    platform === 'MOBILE' ? `MOB-${Math.floor(100 + Math.random() * 900)}` :
    `TAB-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Check if existing device exists
  let device = db.devices.find((d) => d.deviceId === genDevId || d.id === req.body.id);

  if (device) {
    device.name = name || device.name;
    device.model = model || device.model;
    device.manufacturer = manufacturer || device.manufacturer;
    device.platform = platform || device.platform;
    device.osVersion = osVersion || device.osVersion;
    device.schoolId = targetSchool.id;
    device.schoolName = targetSchool.name;
    device.classId = targetClass.id;
    device.className = targetClass.name;
    device.assignedStudentId = student.id;
    device.assignedStudentName = student.name;
    device.assignedStudentRoll = student.rollNumber;
    device.status = 'ONLINE';
    device.lastHeartbeat = new Date().toISOString();
    device.policyId = targetPolicy.id;
    device.policyVersion = targetPolicy.version;
    device.policySyncedAt = new Date().toISOString();
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (isCharging !== undefined) device.isCharging = isCharging;
    if (ipAddress) device.ipAddress = ipAddress;
  } else {
    device = {
      id: `dev-${Date.now()}`,
      deviceId: genDevId,
      serialNumber: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      name: name || `${platform === 'WINDOWS_PC' ? 'Windows Kiosk PC' : 'Student Device'} (${student.name})`,
      model: model || (platform === 'WINDOWS_PC' ? 'Windows 11 PC (x64)' : 'EduGuard Pro Tablet'),
      manufacturer: manufacturer || (platform === 'WINDOWS_PC' ? 'Microsoft / OEM' : 'EduGuard'),
      platform: platform || 'WINDOWS_PC',
      osVersion: osVersion || 'Windows 11 / Android 15',
      agentVersion: '1.4.2',
      managementMode: 'DEVICE_OWNER',
      status: 'ONLINE',
      isLocked: false,
      schoolId: targetSchool.id,
      schoolName: targetSchool.name,
      classId: targetClass.id,
      className: targetClass.name,
      assignedStudentId: student.id,
      assignedStudentName: student.name,
      assignedStudentRoll: student.rollNumber,
      batteryLevel: batteryLevel ?? 100,
      isCharging: isCharging ?? true,
      networkType: 'WIFI',
      wifiSsid: 'School_Secure_WLAN',
      ipAddress: ipAddress || (req.ip === '::1' ? '192.168.1.105' : req.ip || '192.168.1.105'),
      storageTotalGb: storageTotalGb || 256,
      storageUsedGb: 32.4,
      ramTotalGb: ramTotalGb || 16,
      ramUsedGb: 4.2,
      policyId: targetPolicy.id,
      policyVersion: targetPolicy.version,
      policySyncedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      currentActiveApp: 'com.eduguard.workspace',
      kioskMode: 'FULL_LOCKDOWN',
      enrollmentDate: new Date().toISOString(),
      hardwareSecurity: {
        knoxSupported: platform === 'ANDROID_TABLET',
        playIntegrityPass: true,
        deviceRooted: false,
        developerOptionsDisabled: true,
        usbDebuggingDisabled: true,
      },
    };
    db.devices.unshift(device);
    targetClass.deviceCount += 1;
    targetSchool.totalDevices += 1;
  }

  // Link student device
  student.deviceId = device.id;
  student.deviceName = device.name;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Self-Enrollment Engine',
    adminRole: 'SCHOOL_ADMIN',
    schoolId: targetSchool.id,
    action: 'ENROLL_DEVICE',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Enrolled ${platform || 'device'} "${device.name}" (${device.deviceId}) for ${student.name} in ${targetClass.name}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  // Broadcast real-time SSE updates across the entire system
  db.broadcast('device_update', device);
  db.broadcast('device_enrolled', { device, student, classId: targetClass.id });
  db.broadcast('student_created', student);
  db.broadcast('class_updated', targetClass);

  return sendSuccess(res, {
    device,
    student,
    school: targetSchool,
    class: targetClass,
    policy: targetPolicy,
  }, `Successfully enrolled ${device.name} in ${targetClass.name}.`);
});

apiRouter.get('/devices/:id', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', `Device ${req.params.id} not found.`);
  }
  return sendSuccess(res, device);
});

apiRouter.post('/devices/:id/lock', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', 'Device not found.');
  }

  const { reason } = req.body;
  device.isLocked = true;
  device.status = 'LOCKED';
  device.lockReason = reason || 'Locked by school administrator.';

  const cmd: RemoteCommand = {
    id: `cmd-${Date.now()}`,
    deviceId: device.id,
    deviceName: device.name,
    commandType: 'LOCK_DEVICE',
    payload: { reason: device.lockReason },
    issuerId: req.user?.id || 'usr-admin-1',
    issuerName: req.user?.name || 'Administrator',
    issuerRole: req.user?.role || 'SCHOOL_ADMIN',
    status: 'SUCCESS',
    issuedAt: new Date().toISOString(),
    executedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    nonce: `nonce-${Date.now()}`,
    resultMessage: 'Screen locked with Device Owner banner.',
  };
  db.remoteCommands.unshift(cmd);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: device.schoolId,
    action: 'LOCK_DEVICE',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Remotely locked ${device.name} (${device.deviceId}). Reason: ${device.lockReason}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  db.broadcast('device_update', device);
  db.broadcast('command_update', cmd);

  return sendSuccess(res, { device, command: cmd }, 'Device lock command executed.');
});

apiRouter.post('/devices/:id/unlock', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', 'Device not found.');
  }

  device.isLocked = false;
  device.status = 'ONLINE';
  device.lockReason = undefined;

  const cmd: RemoteCommand = {
    id: `cmd-${Date.now()}`,
    deviceId: device.id,
    deviceName: device.name,
    commandType: 'UNLOCK_DEVICE',
    issuerId: req.user?.id || 'usr-admin-1',
    issuerName: req.user?.name || 'Administrator',
    issuerRole: req.user?.role || 'SCHOOL_ADMIN',
    status: 'SUCCESS',
    issuedAt: new Date().toISOString(),
    executedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    nonce: `nonce-${Date.now()}`,
    resultMessage: 'Lock screen cleared and Kiosk unlocked.',
  };
  db.remoteCommands.unshift(cmd);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: device.schoolId,
    action: 'UNLOCK_DEVICE',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Remotely unlocked ${device.name} (${device.deviceId}).`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  db.broadcast('device_update', device);
  db.broadcast('command_update', cmd);

  return sendSuccess(res, { device, command: cmd }, 'Device unlocked.');
});

apiRouter.post('/devices/:id/sync', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', 'Device not found.');
  }

  const policy = db.policies.find((p) => p.id === device.policyId) || db.policies[0];
  device.policyVersion = policy.version;
  device.policySyncedAt = new Date().toISOString();

  const cmd: RemoteCommand = {
    id: `cmd-${Date.now()}`,
    deviceId: device.id,
    deviceName: device.name,
    commandType: 'SYNC_POLICY',
    payload: { version: policy.version, policyName: policy.name },
    issuerId: req.user?.id || 'usr-admin-1',
    issuerName: req.user?.name || 'Administrator',
    issuerRole: req.user?.role || 'SCHOOL_ADMIN',
    status: 'SUCCESS',
    issuedAt: new Date().toISOString(),
    executedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    nonce: `nonce-${Date.now()}`,
    resultMessage: `Policy v${policy.version} refreshed.`,
  };
  db.remoteCommands.unshift(cmd);

  db.broadcast('device_update', device);
  db.broadcast('command_update', cmd);

  return sendSuccess(res, { device, command: cmd }, `Policy v${policy.version} synchronized.`);
});

apiRouter.post('/devices/:id/reboot', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', 'Device not found.');
  }

  const cmd: RemoteCommand = {
    id: `cmd-${Date.now()}`,
    deviceId: device.id,
    deviceName: device.name,
    commandType: 'REBOOT_DEVICE',
    issuerId: req.user?.id || 'usr-admin-1',
    issuerName: req.user?.name || 'Administrator',
    issuerRole: req.user?.role || 'SCHOOL_ADMIN',
    status: 'SUCCESS',
    issuedAt: new Date().toISOString(),
    executedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    nonce: `nonce-${Date.now()}`,
    resultMessage: 'Reboot signal delivered via Android Enterprise DPC.',
  };
  db.remoteCommands.unshift(cmd);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: device.schoolId,
    action: 'REBOOT_DEVICE',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Sent reboot command to ${device.name} (${device.deviceId})`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, { command: cmd }, 'Reboot command queued.');
});

// -------------------------------------------------------------
// 7. POLICIES & KIOSK ENGINE
// -------------------------------------------------------------
apiRouter.get('/policies', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.policies);
});

apiRouter.post('/policies', (req: AuthenticatedRequest, res: Response) => {
  const { name, description, kioskMode, allowlistOnly, allowedApplications, blockedApplications, allowedDomains, blockedDomains, blockedKeywords, restrictions } = req.body;

  const newPolicy = {
    id: `pol-${Date.now()}`,
    name: name || 'New School Policy',
    description: description || 'Configured via EduGuard Web Console',
    version: 1,
    schoolId: req.user?.schoolId || 'sch-demo-01',
    schoolName: req.user?.schoolName || 'Demo International School',
    isDefault: false,
    status: 'DRAFT' as const,
    kioskMode: kioskMode || 'FULL_LOCKDOWN',
    allowlistOnly: allowlistOnly !== undefined ? allowlistOnly : true,
    allowedApplications: allowedApplications || ['com.school.lms', 'com.google.android.apps.classroom'],
    blockedApplications: blockedApplications || ['com.instagram.android', 'com.tiktok'],
    kioskApps: allowedApplications || ['com.school.lms', 'com.google.android.apps.classroom'],
    allowedDomains: allowedDomains || ['school.edu', 'classroom.google.com'],
    blockedDomains: blockedDomains || ['instagram.com', 'facebook.com', 'tiktok.com'],
    blockedKeywords: blockedKeywords || ['casino', 'gambling'],
    blockedCategories: ['Social Networking', 'Gaming', 'Gambling'],
    restrictions: restrictions || {
      disableCalls: true,
      disableSms: true,
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
    },
    usageMonitoring: {
      enabled: true,
      sampleIntervalMinutes: 15,
      collectForegroundApp: true,
      collectScreenOnTime: true,
    },
    signature: `RSA-SHA256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user?.name || 'Administrator',
  };

  db.policies.push(newPolicy);
  return sendSuccess(res, newPolicy, 'Policy created.');
});

apiRouter.put('/policies/:id', (req: AuthenticatedRequest, res: Response) => {
  const policyIndex = db.policies.findIndex((p) => p.id === req.params.id);
  if (policyIndex === -1) {
    return sendError(res, 404, 'POLICY_NOT_FOUND', 'Policy not found.');
  }

  const existing = db.policies[policyIndex];
  const updatedPolicy = {
    ...existing,
    ...req.body,
    restrictions: {
      ...existing.restrictions,
      ...(req.body.restrictions || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  db.policies[policyIndex] = updatedPolicy;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: updatedPolicy.schoolId,
    action: 'UPDATE_POLICY',
    targetType: 'POLICY',
    targetId: updatedPolicy.id,
    targetDescription: `Updated policy restrictions & configurations for ${updatedPolicy.name}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  db.broadcast('policy_updated', updatedPolicy);
  return sendSuccess(res, updatedPolicy, 'Policy updated.');
});

apiRouter.post('/policies/:id/publish', (req: AuthenticatedRequest, res: Response) => {
  const policy = db.policies.find((p) => p.id === req.params.id);
  if (!policy) {
    return sendError(res, 404, 'POLICY_NOT_FOUND', 'Policy not found.');
  }

  if (req.body.restrictions) {
    policy.restrictions = {
      ...policy.restrictions,
      ...req.body.restrictions,
    };
  }
  if (req.body.kioskMode) {
    policy.kioskMode = req.body.kioskMode;
  }

  policy.version += 1;
  policy.status = 'PUBLISHED';
  policy.updatedAt = new Date().toISOString();
  policy.publishedAt = new Date().toISOString();
  policy.signature = `RSA-SHA256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: policy.schoolId,
    action: 'PUBLISH_POLICY',
    targetType: 'POLICY',
    targetId: policy.id,
    targetDescription: `Published Policy v${policy.version} (${policy.name})`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  db.broadcast('policy_published', policy);
  return sendSuccess(res, policy, `Policy published as v${policy.version}.`);
});

// -------------------------------------------------------------
// 8. APPLICATIONS & DEPLOYMENT ROLLOUTS
// -------------------------------------------------------------
apiRouter.get('/applications', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.applications);
});

apiRouter.post('/applications', (req: AuthenticatedRequest, res: Response) => {
  const { name, packageName, version, category, isApproved, distributionType, publisher, apkUrl } = req.body;

  const newApp = {
    id: `app-${Date.now()}`,
    packageName: packageName || 'com.example.schoolapp',
    name: name || 'New School Application',
    version: version || '1.0.0',
    versionCode: 100,
    publisher: publisher || 'EduGuard Academic Catalog',
    iconUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
    category: category || 'EDUCATION',
    isApproved: isApproved !== undefined ? isApproved : true,
    distributionType: distributionType || 'PRIVATE_ENTERPRISE_APK',
    apkSizeMb: 15.4,
    apkUrl: apkUrl || '',
    targetSdk: 35,
    minSdk: 26,
    installedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.applications.unshift(newApp);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'CREATE_APPLICATION',
    targetType: 'APPLICATION',
    targetId: newApp.id,
    targetDescription: `Registered application ${newApp.name} (${newApp.packageName})`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newApp, 'Application registered.');
});

apiRouter.post('/applications/:id/deploy', (req: AuthenticatedRequest, res: Response) => {
  const app = db.applications.find((a) => a.id === req.params.id);
  if (!app) {
    return sendError(res, 404, 'APP_NOT_FOUND', 'Application not found.');
  }

  const { targetType, targetId, targetName } = req.body;
  const deployment = {
    id: `dep-${Date.now()}`,
    applicationId: app.id,
    applicationName: app.name,
    packageName: app.packageName,
    version: app.version,
    targetType: targetType || 'CLASS',
    targetId: targetId || 'cls-12-a',
    targetName: targetName || 'Class XII-A',
    status: 'INSTALLED' as const,
    totalDevices: 32,
    successCount: 32,
    failedCount: 0,
    pendingCount: 0,
    initiatedBy: req.user?.name || 'Administrator',
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  db.deployments.unshift(deployment);
  app.installedCount += 32;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'DEPLOY_APPLICATION',
    targetType: 'APPLICATION',
    targetId: app.id,
    targetDescription: `Deployed ${app.name} (${app.version}) to ${deployment.targetName}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  db.broadcast('deployment_started', deployment);
  return sendSuccess(res, deployment, `Deployment started for ${app.name}`);
});

apiRouter.get('/deployments', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.deployments);
});

// -------------------------------------------------------------
// 9. WEB FILTERING & SAFE BROWSING
// -------------------------------------------------------------
apiRouter.get('/web-filter/rules', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, {
    rules: db.webFilterRules,
    categories: db.webFilterCategories,
  });
});

apiRouter.post('/web-filter/rules', (req: AuthenticatedRequest, res: Response) => {
  const { type, pattern, action, category, description } = req.body;
  if (!pattern) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Domain or keyword pattern is required.');
  }

  const newRule: WebFilterRule = {
    id: `wfr-${Date.now()}`,
    type: type || 'DOMAIN',
    pattern: pattern.toLowerCase().trim(),
    action: action || 'BLOCK',
    category: category || 'General',
    targetScope: 'GLOBAL',
    description: description || '',
    createdAt: new Date().toISOString(),
  };

  db.webFilterRules.unshift(newRule);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'CHANGE_WEB_FILTER',
    targetType: 'WEB_FILTER',
    targetId: newRule.id,
    targetDescription: `Added web filter rule: ${newRule.action} ${newRule.type} "${newRule.pattern}"`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newRule, 'Web filter rule added.');
});

apiRouter.delete('/web-filter/rules/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.webFilterRules.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'RULE_NOT_FOUND', 'Filter rule not found.');
  }
  const removed = db.webFilterRules.splice(index, 1)[0];
  return sendSuccess(res, removed, 'Rule deleted.');
});

// -------------------------------------------------------------
// 10. MONITORING: USAGE & VIOLATIONS
// -------------------------------------------------------------
apiRouter.get('/monitoring/usage', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.usageRecords);
});

apiRouter.get('/monitoring/violations', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.violations);
});

apiRouter.post('/monitoring/violations/:id/resolve', (req: AuthenticatedRequest, res: Response) => {
  const viol = db.violations.find((v) => v.id === req.params.id);
  if (!viol) {
    return sendError(res, 404, 'VIOLATION_NOT_FOUND', 'Violation record not found.');
  }

  const { resolutionNote } = req.body;
  viol.isResolved = true;
  viol.resolvedAt = new Date().toISOString();
  viol.resolvedBy = req.user?.name || 'Administrator';
  viol.resolutionNote = resolutionNote || 'Resolved by IT staff.';

  db.broadcast('violation_resolved', viol);
  return sendSuccess(res, viol, 'Violation marked as resolved.');
});

// -------------------------------------------------------------
// 11. ENROLLMENT & QR CODE PROVISIONING
// -------------------------------------------------------------
apiRouter.get('/enrollment/tokens', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.enrollmentTokens);
});

apiRouter.post('/enrollment/tokens', (req: AuthenticatedRequest, res: Response) => {
  const { schoolId, classId, policyId, wifiSsid, wifiPassword, maxUses } = req.body;
  const tokenStr = `ENR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const qrPayload = JSON.stringify({
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME': 'com.eduguard.mdm/.dpc.EduGuardDeviceAdminReceiver',
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION': 'https://mdm.school.edu/downloads/eduguard-dpc-v1.4.2.apk',
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM': '4a7b2c9e1f8a3d5b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    'android.app.extra.PROVISIONING_WIFI_SSID': wifiSsid || 'School-Enterprise-Secure',
    'android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE': 'WPA',
    'android.app.extra.PROVISIONING_WIFI_PASSWORD': wifiPassword || 'SchoolSecurePassphrase2026',
    'android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE': {
      server_url: 'https://mdm.school.edu/api',
      enrollment_token: tokenStr,
      school_id: schoolId || 'sch-demo-01',
      class_id: classId || 'cls-12-a',
      policy_id: policyId || 'pol-stem-v17',
      auto_lockdown: true,
    },
  });

  const newToken = {
    id: `tok-${Date.now()}`,
    token: tokenStr,
    schoolId: schoolId || 'sch-demo-01',
    schoolName: 'Demo International School',
    classId: classId || 'cls-12-a',
    className: 'Class XII-A',
    policyId: policyId || 'pol-stem-v17',
    policyName: 'High School STEM & Digital Classroom Policy (v17)',
    maxUses: maxUses || 50,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: req.user?.name || 'Administrator',
    qrPayload,
    wifiConfig: {
      ssid: wifiSsid || 'School-Enterprise-Secure',
      securityType: 'WPA' as const,
      hidden: false,
    },
  };

  db.enrollmentTokens.unshift(newToken);
  return sendSuccess(res, newToken, 'Enrollment token & QR payload generated.');
});

// -------------------------------------------------------------
// 12. AUDIT LOGS
// -------------------------------------------------------------
apiRouter.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.auditLogs);
});

// -------------------------------------------------------------
// 13. SETTINGS & RETENTION CONFIG
// -------------------------------------------------------------
apiRouter.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.settings);
});

apiRouter.post('/settings', (req: AuthenticatedRequest, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'UPDATE_SETTINGS',
    targetType: 'USER',
    targetId: 'settings',
    targetDescription: 'Updated telemetry retention and security parameters.',
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });
  return sendSuccess(res, db.settings, 'Settings updated.');
});

// -------------------------------------------------------------
// 14. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// -------------------------------------------------------------
apiRouter.get('/events/stream', (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ event: 'connected', time: new Date().toISOString() })}\n\n`);

  const unsubscribe = db.subscribeSSE((event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// -------------------------------------------------------------
// 15. SIMULATOR / AGENT TESTER BRIDGE
// Endpoints that allow the built-in interactive Android DPC simulator
// to post live telemetry, report violations, and simulate battery/app changes.
// -------------------------------------------------------------
apiRouter.post('/simulator/heartbeat', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, batteryLevel, isCharging, currentApp, isLocked } = req.body;
  const device = db.devices.find((d) => d.id === deviceId || d.deviceId === deviceId);
  if (device) {
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (isCharging !== undefined) device.isCharging = isCharging;
    if (currentApp !== undefined) device.currentActiveApp = currentApp;
    if (isLocked !== undefined) device.isLocked = isLocked;
    device.lastHeartbeat = new Date().toISOString();
    device.status = device.isLocked ? 'LOCKED' : 'ONLINE';
    db.broadcast('device_update', device);
  }
  return sendSuccess(res, { acknowledged: true, device });
});

apiRouter.post('/simulator/violation', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, type, severity, targetResource, description } = req.body;
  const device = db.devices.find((d) => d.id === deviceId || d.deviceId === deviceId) || db.devices[0];

  const newViol: PolicyViolation = {
    id: `viol-${Date.now()}`,
    deviceId: device.id,
    deviceName: device.deviceId,
    studentId: device.assignedStudentId || 'stu-101',
    studentName: device.assignedStudentName || 'Rahul Sharma',
    className: device.className || 'Class XII-A',
    schoolId: device.schoolId,
    type: type || 'UNAUTHORIZED_APP_ATTEMPT',
    severity: severity || 'HIGH',
    targetResource: targetResource || 'unauthorized.package',
    description: description || 'Policy violation intercepted by DPC',
    timestamp: new Date().toISOString(),
    isResolved: false,
  };

  db.violations.unshift(newViol);
  db.broadcast('violation_alert', newViol);

  db.addAuditLog({
    adminId: 'SYSTEM_DPC',
    adminName: 'EduGuard DPC Agent',
    adminRole: 'IT_ADMIN',
    schoolId: device.schoolId,
    action: 'POLICY_VIOLATION_TRIGGERED',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Violation on ${device.name}: ${newViol.description}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newViol, 'Violation recorded and broadcasted.');
});

// -------------------------------------------------------------
// 16. ADMIN BROADCAST MESSAGES / ANNOUNCEMENTS
// Allows admins/teachers to push live notices to all or specific student tabs.
// -------------------------------------------------------------
apiRouter.get('/messages', (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, db.messages);
});

apiRouter.get('/messages/device/:deviceId', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.deviceId || d.deviceId === req.params.deviceId);
  const relevantMessages = db.messages.filter((msg) => {
    if (msg.targetType === 'ALL') return true;
    if (msg.targetType === 'DEVICE' && (msg.targetId === device?.id || msg.targetId === device?.deviceId)) return true;
    if (msg.targetType === 'CLASS' && device?.classId && msg.targetId === device.classId) return true;
    return false;
  });
  return sendSuccess(res, relevantMessages);
});

apiRouter.post('/messages', (req: AuthenticatedRequest, res: Response) => {
  const { title, body, priority, targetType, targetId, targetName, requireAcknowledgment } = req.body;

  if (!title || !body) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Message title and body are required.');
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    priority: priority || 'INFO',
    targetType: targetType || 'ALL',
    targetId: targetId || undefined,
    targetName: targetName || (targetType === 'ALL' ? 'All Student Tablets' : 'Classroom'),
    senderName: req.user?.name || 'Administrator',
    senderRole: req.user?.role || 'SCHOOL_ADMIN',
    createdAt: new Date().toISOString(),
    requireAcknowledgment: requireAcknowledgment !== undefined ? requireAcknowledgment : false,
    acknowledgedDeviceIds: [],
  };

  db.messages.unshift(newMessage);
  db.broadcast('admin_broadcast_message', newMessage);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-demo-01',
    action: 'BROADCAST_MESSAGE',
    targetType: 'DEVICE',
    targetId: newMessage.id,
    targetDescription: `Sent announcement "${newMessage.title}" to ${newMessage.targetName}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newMessage, 'Announcement broadcasted to student tablets.');
});

apiRouter.post('/messages/:id/ack', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId } = req.body;
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (!msg) {
    return sendError(res, 404, 'NOT_FOUND', 'Message not found.');
  }

  if (deviceId && !msg.acknowledgedDeviceIds.includes(deviceId)) {
    msg.acknowledgedDeviceIds.push(deviceId);
    db.broadcast('message_acknowledged', { messageId: msg.id, deviceId, totalAcks: msg.acknowledgedDeviceIds.length });
  }

  return sendSuccess(res, msg, 'Message acknowledged.');
});

// -------------------------------------------------------------
// 12. CLASS-WISE & SUBJECT-WISE STUDY NOTES & PDF MATERIALS
// -------------------------------------------------------------
apiRouter.get('/study-materials', (req: AuthenticatedRequest, res: Response) => {
  const { classId, subject, type } = req.query;
  let materials = db.studyMaterials;

  if (classId && typeof classId === 'string' && classId !== 'ALL') {
    materials = materials.filter((m) => m.classId === classId || m.classId === 'ALL');
  }

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    materials = materials.filter((m) => m.subject.toLowerCase() === subject.toLowerCase());
  }

  if (type && typeof type === 'string') {
    materials = materials.filter((m) => m.type === type);
  }

  return sendSuccess(res, materials);
});

apiRouter.post('/study-materials', (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    type,
    classId,
    className,
    subject,
    chapterOrUnit,
    fileUrl,
    fileName,
    fileSizeBytes,
    contentMarkdown,
    allowOfflineDownload,
  } = req.body;

  if (!title || !subject || !classId) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Title, subject, and target class are required.');
  }

  const newMaterial = {
    id: `mat-${Date.now()}`,
    title: title.trim(),
    description: description?.trim() || '',
    type: type || 'PDF',
    schoolId: req.user?.schoolId || 'sch-greenwood-01',
    classId: classId,
    className: className || (classId === 'ALL' ? 'All Classes' : (db.classes.find((c) => c.id === classId)?.name || 'Classroom')),
    subject: subject.trim(),
    chapterOrUnit: chapterOrUnit?.trim() || 'General',
    fileUrl: fileUrl || undefined,
    fileName: fileName || (type === 'PDF' ? `${title.replace(/\s+/g, '_')}.pdf` : undefined),
    fileSizeBytes: fileSizeBytes || (type === 'PDF' ? 1024000 : 45000),
    contentMarkdown: contentMarkdown || (type === 'RICH_NOTE' ? `# ${title}\n\n${description || ''}` : undefined),
    authorName: req.user?.name || 'Administrator',
    authorRole: req.user?.role || 'TEACHER',
    uploadedAt: new Date().toISOString(),
    allowOfflineDownload: allowOfflineDownload !== undefined ? allowOfflineDownload : true,
    viewCount: 0,
  };

  db.studyMaterials.unshift(newMaterial);
  db.broadcast('study_material_uploaded', newMaterial);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-greenwood-01',
    action: 'UPLOAD_STUDY_MATERIAL',
    targetType: 'APPLICATION',
    targetId: newMaterial.id,
    targetDescription: `Uploaded ${newMaterial.subject} material "${newMaterial.title}" for ${newMaterial.className}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newMaterial, 'Study material / PDF uploaded successfully and dispatched to student devices.');
});

apiRouter.delete('/study-materials/:id', (req: AuthenticatedRequest, res: Response) => {
  const index = db.studyMaterials.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'NOT_FOUND', 'Study material not found.');
  }

  const [removed] = db.studyMaterials.splice(index, 1);
  db.broadcast('study_material_deleted', { id: req.params.id });

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: req.user?.schoolId || 'sch-greenwood-01',
    action: 'DELETE_STUDY_MATERIAL',
    targetType: 'APPLICATION',
    targetId: removed.id,
    targetDescription: `Removed ${removed.subject} material "${removed.title}"`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, { deleted: true, id: req.params.id });
});

// -------------------------------------------------------------
// 17. KIOSK EXIT & LOGOUT APPROVAL WORKFLOW
// Requires student password entry + Administrator approval before exit
// -------------------------------------------------------------
apiRouter.get('/kiosk-exit-requests', (req: AuthenticatedRequest, res: Response) => {
  const { status, deviceId } = req.query;
  let requests = db.kioskExitRequests;

  if (status && typeof status === 'string') {
    requests = requests.filter((r) => r.status === status);
  }

  if (deviceId && typeof deviceId === 'string') {
    requests = requests.filter((r) => r.deviceId === deviceId);
  }

  return sendSuccess(res, requests);
});

apiRouter.get('/kiosk-exit-requests/status/:deviceId', (req: AuthenticatedRequest, res: Response) => {
  const deviceId = req.params.deviceId;
  // Return the latest request for this device
  const latest = db.kioskExitRequests.find((r) => r.deviceId === deviceId);
  return sendSuccess(res, latest || null);
});

apiRouter.post('/kiosk-exit-requests', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, studentId, studentName, studentRoll, className, reason, studentPassword } = req.body;

  if (!deviceId || !studentPassword) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Device ID and student password are required.');
  }

  // Validate student password (allow standard student password e.g. student123, student roll, or any non-empty password)
  const cleanPass = String(studentPassword).trim().toLowerCase();
  const isValid = cleanPass.length >= 4;

  if (!isValid) {
    return sendError(res, 401, 'INVALID_PASSWORD', 'Invalid student credentials or password is too short.');
  }

  const device = db.devices.find((d) => d.id === deviceId || d.deviceId === deviceId);
  const student = db.students.find((s) => s.id === studentId || s.name === studentName);

  // Remove any existing pending request for this device
  db.kioskExitRequests = db.kioskExitRequests.filter(
    (r) => !(r.deviceId === deviceId && r.status === 'PENDING')
  );

  const newRequest = {
    id: `req-exit-${Date.now()}`,
    deviceId: device?.deviceId || deviceId,
    deviceName: device?.name || `Station ${deviceId}`,
    studentId: studentId || student?.id || 'stu-student',
    studentName: studentName || device?.assignedStudentName || 'Student',
    studentRoll: studentRoll || (device as any)?.assignedStudentRoll || '12-A-04',
    className: className || device?.className || 'Class XII-A',
    schoolId: device?.schoolId || 'sch-demo-01',
    schoolName: device?.schoolName || 'Demo International School & Examination Center',
    platform: device?.platform || 'WINDOWS_PC',
    requestedAt: new Date().toISOString(),
    status: 'PENDING' as const,
    reason: (reason || 'Student requested session logout').trim(),
    studentPasswordEntered: true,
  };

  db.kioskExitRequests.unshift(newRequest);
  db.broadcast('kiosk_exit_requested', newRequest);

  db.addAuditLog({
    adminId: 'STUDENT_SESSION',
    adminName: newRequest.studentName,
    adminRole: 'STUDENT',
    schoolId: newRequest.schoolId,
    action: 'KIOSK_EXIT_REQUESTED',
    targetType: 'DEVICE',
    targetId: newRequest.deviceId,
    targetDescription: `Student ${newRequest.studentName} (${newRequest.studentRoll}) entered password and requested Kiosk Exit on ${newRequest.deviceName}. Reason: ${newRequest.reason}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, newRequest, 'Exit request submitted to Administrator. Waiting for remote approval.');
});

apiRouter.post('/kiosk-exit-requests/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.params.id;
  const request = db.kioskExitRequests.find((r) => r.id === reqId);

  if (!request) {
    return sendError(res, 404, 'NOT_FOUND', 'Kiosk exit request not found.');
  }

  request.status = 'APPROVED';
  request.reviewedBy = req.user?.name || 'ARVD Exam Section Admin (Super Admin)';
  request.reviewedAt = new Date().toISOString();
  request.reviewNote = req.body.note || 'Approved by Administrator';

  db.broadcast('kiosk_exit_approved', {
    requestId: request.id,
    deviceId: request.deviceId,
    studentName: request.studentName,
    approvedBy: request.reviewedBy,
    timestamp: request.reviewedAt,
  });

  db.addAuditLog({
    adminId: req.user?.id || 'usr-super-arvd',
    adminName: req.user?.name || 'ARVD Exam Section Admin',
    adminRole: req.user?.role || 'SUPER_ADMIN',
    schoolId: request.schoolId,
    action: 'KIOSK_EXIT_APPROVED',
    targetType: 'DEVICE',
    targetId: request.deviceId,
    targetDescription: `Administrator ${req.user?.name || 'Admin'} APPROVED Kiosk exit for student ${request.studentName} (${request.studentRoll}) on ${request.deviceName}.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, request, 'Kiosk exit request approved. Student device unlocked.');
});

apiRouter.post('/kiosk-exit-requests/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.params.id;
  const request = db.kioskExitRequests.find((r) => r.id === reqId);

  if (!request) {
    return sendError(res, 404, 'NOT_FOUND', 'Kiosk exit request not found.');
  }

  request.status = 'REJECTED';
  request.reviewedBy = req.user?.name || 'ARVD Exam Section Admin (Super Admin)';
  request.reviewedAt = new Date().toISOString();
  request.reviewNote = req.body.reason || 'Rejected by Administrator: Please continue exam/class session';

  db.broadcast('kiosk_exit_rejected', {
    requestId: request.id,
    deviceId: request.deviceId,
    studentName: request.studentName,
    rejectedBy: request.reviewedBy,
    reason: request.reviewNote,
    timestamp: request.reviewedAt,
  });

  db.addAuditLog({
    adminId: req.user?.id || 'usr-super-arvd',
    adminName: req.user?.name || 'ARVD Exam Section Admin',
    adminRole: req.user?.role || 'SUPER_ADMIN',
    schoolId: request.schoolId,
    action: 'KIOSK_EXIT_REJECTED',
    targetType: 'DEVICE',
    targetId: request.deviceId,
    targetDescription: `Administrator ${req.user?.name || 'Admin'} REJECTED Kiosk exit for student ${request.studentName} (${request.studentRoll}).`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, request, 'Kiosk exit request rejected.');
});



