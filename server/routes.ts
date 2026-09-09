// EduGuard MDM — Comprehensive REST API Route Handlers

import { Router, Response } from 'express';
import { db, generateMacAddress, generateUniqueStationPassword } from './db';
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
// Temporarily track recently deleted devices (holds for 45s to allow running client watchdogs to receive exit signal)
const recentlyDeletedDevices = new Map<string, number>();

function isDeviceRecentlyDeleted(id: string): boolean {
  const clean = String(id || '').trim().toLowerCase();
  const ts = recentlyDeletedDevices.get(clean);
  if (!ts) return false;
  if (Date.now() - ts > 45000) {
    recentlyDeletedDevices.delete(clean);
    return false;
  }
  return true;
}

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
    if (req.body.studentUsername) device.studentUsername = req.body.studentUsername;
    if (req.body.macAddress) device.macAddress = req.body.macAddress;
    if (!device.defaultPassword) device.defaultPassword = generateUniqueStationPassword('EG');
    if (!device.macAddress) device.macAddress = generateMacAddress(device.deviceId);
    if (!device.studentUsername) device.studentUsername = student.name ? student.name.toLowerCase().replace(/\s+/g, '.') : `stu.${device.deviceId.toLowerCase()}`;
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
      studentUsername: req.body.studentUsername || (student.name ? student.name.toLowerCase().replace(/\s+/g, '.') : `stu.${genDevId.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
      defaultPassword: req.body.defaultPassword || generateUniqueStationPassword('EG'),
      batteryLevel: batteryLevel ?? 100,
      isCharging: isCharging ?? true,
      networkType: 'WIFI',
      wifiSsid: 'School_Secure_WLAN',
      ipAddress: ipAddress || (req.ip === '::1' ? '192.168.1.105' : req.ip || '192.168.1.105'),
      macAddress: req.body.macAddress || generateMacAddress(genDevId),
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

apiRouter.delete('/devices/:id', (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const cleanTargetId = String(targetId).trim().toLowerCase();
  const index = db.devices.findIndex(
    (d) =>
      d.id === targetId ||
      d.deviceId === targetId ||
      d.id.toLowerCase() === cleanTargetId ||
      d.deviceId.toLowerCase() === cleanTargetId
  );

  if (index === -1) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', `Device ${targetId} not found in fleet inventory.`);
  }

  const [deletedDevice] = db.devices.splice(index, 1);
  recentlyDeletedDevices.set(deletedDevice.id.toLowerCase(), Date.now());
  recentlyDeletedDevices.set(deletedDevice.deviceId.toLowerCase(), Date.now());

  // Clean up any exit requests for this device
  db.kioskExitRequests = db.kioskExitRequests.filter(
    (r) =>
      r.deviceId !== deletedDevice.deviceId &&
      r.deviceId !== deletedDevice.id &&
      (r as any).id !== deletedDevice.id
  );

  // Unlink student assigned to this device
  const student = db.students.find(
    (s) => s.deviceId === deletedDevice.id || s.deviceId === deletedDevice.deviceId
  );
  if (student) {
    student.deviceId = undefined;
    student.deviceName = undefined;
  }

  // Decrement counters
  const targetSchool = db.schools.find((s) => s.id === deletedDevice.schoolId);
  if (targetSchool && targetSchool.totalDevices > 0) targetSchool.totalDevices -= 1;
  const targetClass = db.classes.find((c) => c.id === deletedDevice.classId);
  if (targetClass && targetClass.deviceCount > 0) targetClass.deviceCount -= 1;

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: deletedDevice.schoolId,
    action: 'DELETE_DEVICE',
    targetType: 'DEVICE',
    targetId: deletedDevice.id,
    targetDescription: `Deleted and unenrolled ${deletedDevice.platform} "${deletedDevice.name}" (${deletedDevice.deviceId}) from fleet inventory.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  // Broadcast device deletion to admin console and any active kiosk clients
  db.broadcast('device_deleted', {
    id: deletedDevice.id,
    deviceId: deletedDevice.deviceId,
    name: deletedDevice.name,
    platform: deletedDevice.platform,
  });
  // Also broadcast unlocked event so client disengages kiosk mode
  db.broadcast('device_unlocked', {
    deviceId: deletedDevice.deviceId,
    id: deletedDevice.id,
    reason: 'Device unenrolled and deleted by administrator.',
  });

  return sendSuccess(res, {
    deletedDeviceId: deletedDevice.deviceId,
    deletedId: deletedDevice.id,
    name: deletedDevice.name,
  }, `Device ${deletedDevice.name} (${deletedDevice.deviceId}) deleted and unenrolled successfully.`);
});

apiRouter.put('/devices/:id/password', (req: AuthenticatedRequest, res: Response) => {
  const deviceId = req.params.id;
  const { defaultPassword, studentUsername, macAddress, name } = req.body;
  const cleanId = String(deviceId).trim().toLowerCase();
  const device = db.devices.find(
    (d) =>
      d.id === deviceId ||
      d.deviceId === deviceId ||
      d.id.toLowerCase() === cleanId ||
      d.deviceId.toLowerCase() === cleanId
  );

  if (!device) {
    return sendError(res, 404, 'NOT_FOUND', 'Device not found in system inventory.');
  }

  if (defaultPassword !== undefined) {
    device.defaultPassword = String(defaultPassword).trim();
  }
  if (studentUsername !== undefined) {
    device.studentUsername = String(studentUsername).trim();
  }
  if (macAddress !== undefined) {
    device.macAddress = String(macAddress).trim();
  }
  if (name !== undefined) {
    device.name = String(name).trim();
  }

  db.broadcast('device_update', device);
  db.addAuditLog({
    adminId: req.user?.id || 'usr-super-arvd',
    adminName: req.user?.name || 'ARVD Exam Section Admin',
    adminRole: req.user?.role || 'SUPER_ADMIN',
    schoolId: device.schoolId,
    action: 'DEVICE_CONFIG_UPDATED',
    targetType: 'DEVICE',
    targetId: device.deviceId,
    targetDescription: `Updated enrollment credentials for ${device.name} (${device.deviceId}) - Set default unique password to ${device.defaultPassword}.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, device, `Enrollment credentials updated for ${device.name}.`);
});

apiRouter.post('/devices/checkin', (req: AuthenticatedRequest, res: Response) => {
  const {
    deviceId,
    name,
    model,
    manufacturer,
    platform,
    osVersion,
    batteryLevel,
    isCharging,
    isLocked,
    currentApp,
    studentName,
    studentRoll,
    classId,
    schoolId,
    wifiSsid,
  } = req.body;

  if (!deviceId) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'deviceId is required for check-in.');
  }

  const cleanDeviceId = String(deviceId).trim().toLowerCase();

  // If device was recently deleted by admin, notify client unless forceEnroll is requested
  if (!req.body.forceEnroll && isDeviceRecentlyDeleted(cleanDeviceId)) {
    return res.json({
      success: false,
      isDeleted: true,
      error: 'DEVICE_DELETED',
      message: 'This device has been unenrolled and deleted by the administrator.',
    });
  }

  // Extract client IP address accurately from request headers
  const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
  const realIp = (req.headers['x-real-ip'] as string)?.trim();
  const rawIp = req.body.ipAddress || forwarded || realIp || req.socket.remoteAddress || req.ip || '127.0.0.1';
  const cleanIp = String(rawIp).replace(/^.*:/, '').trim() || '127.0.0.1';

  let device = db.devices.find(
    (d) =>
      d.deviceId === deviceId ||
      d.id === deviceId ||
      d.deviceId.toLowerCase() === cleanDeviceId ||
      d.id.toLowerCase() === cleanDeviceId
  );

  if (device) {
    // Update live telemetry & read IP address
    device.ipAddress = cleanIp;
    device.lastHeartbeat = new Date().toISOString();
    if (req.body.macAddress) device.macAddress = req.body.macAddress;
    if (req.query?.mac_address) device.macAddress = String(req.query.mac_address);
    if (!device.macAddress) device.macAddress = generateMacAddress(cleanDeviceId);
    if (!device.defaultPassword) device.defaultPassword = generateUniqueStationPassword('EG');
    if (!device.studentUsername) device.studentUsername = `student.${cleanDeviceId.replace(/[^a-z0-9]/g, '')}`;
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (isCharging !== undefined) device.isCharging = isCharging;
    if (currentApp) device.currentActiveApp = currentApp;
    if (wifiSsid) device.wifiSsid = wifiSsid;
    if (platform && (!device.platform || (device.platform as string) === 'UNKNOWN')) device.platform = platform;
    if (model && (!device.model || device.model === 'Unknown')) device.model = model;
    device.status = device.isLocked ? 'LOCKED' : 'ONLINE';

    db.broadcast('device_update', device);
    return sendSuccess(res, {
      acknowledged: true,
      device,
      isLocked: device.isLocked,
      isDeleted: false,
    });
  }

  // Auto-enroll new device (PC, Tablet, Mobile) into fleet inventory
  const detectedPlatform = platform || 'WINDOWS_PC';
  const targetSchool = db.schools.find((s) => s.id === schoolId) || db.schools[0];
  const targetClass = db.classes.find((c) => c.id === classId) || db.classes[0];
  const targetPolicy = db.policies.find((p) => p.id === targetClass.assignedPolicyId) || db.policies[0];

  const rollNumber = studentRoll || `ST-${String(deviceId).slice(-4)}`;
  const assignedName = studentName || `Station User (${deviceId})`;

  const newDevice: Device = {
    id: `dev-${cleanDeviceId.replace(/[^a-z0-9-]/g, '-')}`,
    deviceId: deviceId,
    serialNumber: `SN-${deviceId.toUpperCase()}`,
    name: name || (detectedPlatform === 'WINDOWS_PC' ? `Windows Station (${deviceId})` : `Mobile Device (${deviceId})`),
    model: model || (detectedPlatform === 'WINDOWS_PC' ? 'Windows 11 PC (x64)' : 'EduGuard Mobile / Tablet'),
    manufacturer: manufacturer || (detectedPlatform === 'WINDOWS_PC' ? 'EduGuard Windows Client' : 'EduGuard OEM'),
    platform: detectedPlatform as any,
    osVersion: osVersion || (detectedPlatform === 'WINDOWS_PC' ? 'Windows 11 Pro' : 'Android 15'),
    agentVersion: '2.4.0',
    managementMode: 'DEVICE_OWNER',
    status: (isLocked !== undefined ? isLocked : (detectedPlatform === 'WINDOWS_PC')) ? 'LOCKED' : 'ONLINE',
    isLocked: isLocked !== undefined ? isLocked : (detectedPlatform === 'WINDOWS_PC' ? true : false),
    schoolId: targetSchool.id,
    schoolName: targetSchool.name,
    classId: targetClass.id,
    className: targetClass.name,
    assignedStudentName: assignedName,
    assignedStudentRoll: rollNumber,
    studentUsername: req.body.studentUsername || `student.${cleanDeviceId.replace(/[^a-z0-9]/g, '')}`,
    defaultPassword: req.body.defaultPassword || generateUniqueStationPassword('EG'),
    batteryLevel: batteryLevel ?? 100,
    isCharging: isCharging ?? true,
    networkType: 'WIFI',
    wifiSsid: wifiSsid || 'Campus-Secure-WLAN',
    ipAddress: cleanIp,
    macAddress: req.body.macAddress || (req.query?.mac_address as string) || generateMacAddress(cleanDeviceId),
    storageTotalGb: 256,
    storageUsedGb: 34.2,
    ramTotalGb: 16,
    ramUsedGb: 3.6,
    policyId: targetPolicy.id,
    policyVersion: targetPolicy.version,
    policySyncedAt: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    currentActiveApp: currentApp || 'EduGuard Kiosk Engine',
    kioskMode: 'FULL_LOCKDOWN',
    enrollmentDate: new Date().toISOString(),
    hardwareSecurity: {
      playIntegrityPass: true,
      deviceRooted: false,
      developerOptionsDisabled: true,
      usbDebuggingDisabled: true,
    },
  };

  db.devices.unshift(newDevice);
  targetClass.deviceCount += 1;
  targetSchool.totalDevices += 1;

  db.broadcast('device_enrolled', { device: newDevice });
  db.broadcast('device_update', newDevice);

  return sendSuccess(res, {
    acknowledged: true,
    device: newDevice,
    isLocked: newDevice.isLocked,
    isDeleted: false,
  }, `Device ${newDevice.deviceId} registered with IP ${cleanIp}.`);
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

  db.broadcast('device_locked', {
    deviceId: device.deviceId,
    id: device.id,
    reason: device.lockReason,
  });
  db.broadcast('device_update', device);
  db.broadcast('command_update', cmd);

  return sendSuccess(res, { device, command: cmd }, 'Device lock command executed.');
});

apiRouter.get('/devices/:id/kiosk-status', (req: AuthenticatedRequest, res: Response) => {
  const cleanId = String(req.params.id || '').trim().toLowerCase();
  const wasDeleted = isDeviceRecentlyDeleted(cleanId);
  const device = db.devices.find(
    (d) =>
      d.id === req.params.id ||
      d.deviceId === req.params.id ||
      d.id.toLowerCase() === cleanId ||
      d.deviceId.toLowerCase() === cleanId
  );

  if (!device) {
    return res.json({
      success: true,
      data: {
        deviceId: req.params.id,
        isLocked: wasDeleted ? false : true,
        kioskActive: wasDeleted ? false : true,
        isDeleted: wasDeleted,
        status: wasDeleted ? 'UNENROLLED' : 'PENDING_REGISTRATION',
      },
    });
  }
  return res.json({
    success: true,
    data: {
      id: device.id,
      deviceId: device.deviceId,
      isLocked: !!device.isLocked,
      kioskActive: !!device.isLocked,
      status: device.status,
      kioskMode: device.kioskMode,
      lastHeartbeat: device.lastHeartbeat,
    },
  });
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
    targetDescription: `Remotely unlocked and exited kiosk on ${device.name} (${device.deviceId}).`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  // Broadcast real-time exit and unlock events to student workstation
  db.broadcast('kiosk_exit_approved', {
    deviceId: device.deviceId,
    id: device.id,
    studentName: device.assignedStudentName,
    reason: 'Administrator remotely unlocked workstation and exited Kiosk mode.',
    timestamp: new Date().toISOString(),
  });
  db.broadcast('device_unlocked', {
    deviceId: device.deviceId,
    id: device.id,
    studentName: device.assignedStudentName,
    reason: 'Administrator remotely unlocked workstation and exited Kiosk mode.',
  });
  db.broadcast('device_update', device);
  db.broadcast('command_update', cmd);

  return sendSuccess(res, { device, command: cmd }, 'Device unlocked and kiosk exited.');
});

apiRouter.post('/devices/:id/exit-kiosk', (req: AuthenticatedRequest, res: Response) => {
  const device = db.devices.find((d) => d.id === req.params.id || d.deviceId === req.params.id);
  if (!device) {
    return sendError(res, 404, 'DEVICE_NOT_FOUND', 'Device not found.');
  }

  device.isLocked = false;
  device.status = 'ONLINE';
  device.lockReason = undefined;

  db.broadcast('kiosk_exit_approved', {
    deviceId: device.deviceId,
    id: device.id,
    studentName: device.assignedStudentName,
    reason: 'Administrator remotely unlocked workstation and exited Kiosk mode.',
    timestamp: new Date().toISOString(),
  });
  db.broadcast('device_unlocked', {
    deviceId: device.deviceId,
    id: device.id,
    studentName: device.assignedStudentName,
    reason: 'Administrator remotely unlocked workstation and exited Kiosk mode.',
  });
  db.broadcast('device_update', device);

  db.addAuditLog({
    adminId: req.user?.id || 'usr-admin-1',
    adminName: req.user?.name || 'Admin',
    adminRole: req.user?.role || 'SCHOOL_ADMIN',
    schoolId: device.schoolId,
    action: 'UNLOCK_DEVICE',
    targetType: 'DEVICE',
    targetId: device.id,
    targetDescription: `Remotely exited kiosk on ${device.name} (${device.deviceId}).`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  return sendSuccess(res, { device }, 'Workstation kiosk exited successfully.');
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

// Safe Web Portal Educational Reverse Proxy for Student Kiosk
// Enables opening approved educational sites (Wikipedia, Khan Academy, Google Classroom, etc.)
// inside the kiosk browser without X-Frame-Options or CSP frame-ancestor blocking.
apiRouter.get('/proxy-web', async (req: AuthenticatedRequest, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return res.status(400).send('Invalid target URL format.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 1. Check Web Filter Rules: Block rules first
  const isExplicitlyBlocked = db.webFilterRules.some((r) => {
    if (r.action === 'BLOCK') {
      const pat = r.pattern.toLowerCase().trim();
      return hostname.includes(pat) || targetUrl.toLowerCase().includes(pat);
    }
    return false;
  });

  if (isExplicitlyBlocked) {
    // Log violation for telemetry
    db.violations.unshift({
      id: `viol-${Date.now()}`,
      deviceId: 'kiosk-station',
      deviceName: 'Student Workstation',
      studentId: 'student',
      studentName: 'Student Kiosk User',
      className: 'Class XII-A',
      schoolId: 'sch-demo-01',
      type: 'BLOCKED_DOMAIN_ACCESSED',
      severity: 'HIGH',
      targetResource: targetUrl,
      description: `Attempted access to blocked web filter domain: ${hostname}`,
      timestamp: new Date().toISOString(),
      isResolved: false,
    });

    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduGuard Safe Web Filter - Access Restricted</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background: #030712; color: #f9fafb; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #111827; border: 1px solid #dc2626; border-radius: 20px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.25); }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #f87171; margin: 0 0 8px 0; font-size: 20px; }
          p { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; }
          code { background: #1f2937; color: #fca5a5; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }
          .tag { display: inline-block; background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🚫</div>
          <h2>Website Blocked by School Policy</h2>
          <p>Access to <code>${hostname}</code> is restricted on this student workstation under institutional safe browsing guidelines.</p>
          <div class="tag">EduGuard Web Filter Guard</div>
        </div>
      </body>
      </html>
    `);
  }

  // 2. Check Allowed Domains:
  // Explicit ALLOW rules in webFilterRules OR verified educational whitelist
  const defaultAllowedDomains = [
    'wikipedia.org',
    'wikimedia.org',
    'khanacademy.org',
    'classroom.google.com',
    'school.edu',
    'ncert.nic.in',
    'britannica.com',
    'geeksforgeeks.org',
    'w3schools.com',
    'scratch.mit.edu',
    'nationalgeographic.com',
    'nasa.gov',
    'archive.org',
    'mathsisfun.com',
    'wolframalpha.com',
  ];

  const allowedPatterns = [
    ...defaultAllowedDomains,
    ...db.webFilterRules.filter((r) => r.action === 'ALLOW').map((r) => r.pattern.toLowerCase().trim()),
  ];

  const isAllowed = allowedPatterns.some((pat) => {
    return hostname === pat || hostname.endsWith('.' + pat);
  });

  if (!isAllowed) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduGuard Safe Web Filter - Domain Not Whitelisted</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background: #030712; color: #f9fafb; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #111827; border: 1px solid #374151; border-radius: 20px; padding: 32px; max-width: 480px; text-align: center; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { color: #f59e0b; margin: 0 0 8px 0; font-size: 20px; }
          p { color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; }
          code { background: #1f2937; color: #fcd34d; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }
          .tag { display: inline-block; background: #78350f; color: #fde68a; border: 1px solid #b45309; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔒</div>
          <h2>Restricted Educational Whitelist</h2>
          <p>The domain <code>${hostname}</code> is not on your institution's approved educational whitelist.</p>
          <div class="tag">Safe Educational Browser Kiosk</div>
        </div>
      </body>
      </html>
    `);
  }

  // 3. Fetch and proxy the allowed site
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 EduGuard-Kiosk/2.5',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const contentType = response.headers.get('content-type') || 'text/html';

    // Remove frame-blocking headers so it renders inside the student kiosk iframe
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('text/html')) {
      let html = await response.text();
      // Inject <base href="..."> so relative scripts, styles, and images work correctly
      const baseTag = `<base href="${targetUrl}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        html = baseTag + html;
      }

      // Inject navigation listener script to intercept links and keep browsing in kiosk portal
      const navScript = `
        <script>
          (function() {
            document.addEventListener('click', function(e) {
              var link = e.target.closest('a');
              if (link && link.href) {
                e.preventDefault();
                window.parent.postMessage({ type: 'EDUGUARD_SAFE_BROWSER_NAV', url: link.href }, '*');
              }
            }, true);
          })();
        </script>
      `;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${navScript}</body>`);
      } else {
        html = html + navScript;
      }

      return res.send(html);
    } else {
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    return res.status(502).send(`
      <!DOCTYPE html>
      <html>
      <body style="background:#030712;color:#9ca3af;font-family:sans-serif;padding:30px;text-align:center;">
        <h3 style="color:#f87171;">Failed to load educational portal</h3>
        <p>Could not connect to ${hostname}: ${err.message || 'Network error'}</p>
      </body>
      </html>
    `);
  }
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
  const { deviceId, batteryLevel, isCharging, currentApp, isLocked, ipAddress } = req.body;
  const cleanDeviceId = String(deviceId || '').trim().toLowerCase();

  if (isDeviceRecentlyDeleted(cleanDeviceId)) {
    return res.json({
      success: false,
      isDeleted: true,
      error: 'DEVICE_DELETED',
      message: 'This device has been deleted by administrator.',
    });
  }

  // Extract client IP address accurately from request headers
  const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
  const realIp = (req.headers['x-real-ip'] as string)?.trim();
  const rawIp = ipAddress || forwarded || realIp || req.socket.remoteAddress || req.ip || '127.0.0.1';
  const cleanIp = String(rawIp).replace(/^.*:/, '').trim() || '127.0.0.1';

  const device = db.devices.find((d) => d.id === deviceId || d.deviceId === deviceId || d.deviceId.toLowerCase() === cleanDeviceId || d.id.toLowerCase() === cleanDeviceId);
  if (device) {
    const statusChanged = (isLocked !== undefined && device.isLocked !== isLocked);
    const appChanged = (currentApp !== undefined && device.currentActiveApp !== currentApp);
    const chargingChanged = (isCharging !== undefined && device.isCharging !== isCharging);
    const batteryChanged = (batteryLevel !== undefined && Math.abs((device.batteryLevel || 0) - batteryLevel) >= 5);

    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (isCharging !== undefined) device.isCharging = isCharging;
    if (currentApp !== undefined) device.currentActiveApp = currentApp;
    if (isLocked !== undefined) device.isLocked = isLocked;
    device.ipAddress = cleanIp;
    device.lastHeartbeat = new Date().toISOString();
    device.status = device.isLocked ? 'LOCKED' : 'ONLINE';

    // Only broadcast device_update if properties actually changed to prevent continuous re-render loops
    if (statusChanged || appChanged || chargingChanged || batteryChanged) {
      db.broadcast('device_update', device);
    }
  }
  return sendSuccess(res, { acknowledged: true, device, isDeleted: false });
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
    // Client compatibility properties
    authorTeacher: req.user?.name || 'Administrator',
    topic: chapterOrUnit?.trim() || description?.trim() || 'General Learning Topic',
    fileType: type || 'PDF',
    pageCount: type === 'PDF' ? 1 : undefined,
    content: contentMarkdown || description || 'Document content loaded.',
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
  // Return the latest request for this device (case-insensitive and matching id or deviceId)
  const cleanId = String(deviceId).trim().toLowerCase();
  const latest = db.kioskExitRequests.find(
    (r) =>
      r.deviceId === deviceId ||
      r.deviceId.toLowerCase() === cleanId ||
      (r as any).id === deviceId
  );
  return sendSuccess(res, latest || null);
});

apiRouter.post('/kiosk-exit-requests', (req: AuthenticatedRequest, res: Response) => {
  const { deviceId, studentId, studentName, studentRoll, className, reason, studentPassword } = req.body;

  if (!deviceId || !studentPassword) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Device ID and student password are required.');
  }

  const cleanPass = String(studentPassword).trim();
  if (cleanPass.length < 1) {
    return sendError(res, 400, 'INVALID_PASSWORD', 'Please enter your student password.');
  }

  const device = db.devices.find(
    (d) =>
      d.id === deviceId ||
      d.deviceId === deviceId ||
      d.id.toLowerCase() === deviceId.toLowerCase() ||
      d.deviceId.toLowerCase() === deviceId.toLowerCase()
  );
  const student = db.students.find((s) => s.id === studentId || s.name === studentName);

  // Validate student password against device defaultPassword or student roll or admin override
  const isMaster = cleanPass === '2026' || cleanPass === 'admin123' || cleanPass === 'arvdexamsection@gmail.com';
  const matchesPassword = device?.defaultPassword && cleanPass.toLowerCase() === device.defaultPassword.toLowerCase();
  const matchesRoll = (device?.assignedStudentRoll && cleanPass.toLowerCase() === device.assignedStudentRoll.toLowerCase()) ||
                      (student?.rollNumber && cleanPass.toLowerCase() === student.rollNumber.toLowerCase());

  if (device?.defaultPassword && !matchesPassword && !matchesRoll && !isMaster) {
    return sendError(res, 401, 'INVALID_PASSWORD', 'Invalid station password for this device. Please check with your exam proctor or administrator.');
  }

  // Remove any existing pending request for this device
  db.kioskExitRequests = db.kioskExitRequests.filter(
    (r) =>
      !(
        (r.deviceId === deviceId ||
          r.deviceId.toLowerCase() === deviceId.toLowerCase() ||
          (device && r.deviceId === device.deviceId)) &&
        r.status === 'PENDING'
      )
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

  // 1. Locate and unlock the corresponding device in db.devices
  let device = db.devices.find(
    (d) =>
      d.id === request.deviceId ||
      d.deviceId === request.deviceId ||
      d.id.toLowerCase() === request.deviceId.toLowerCase() ||
      d.deviceId.toLowerCase() === request.deviceId.toLowerCase()
  );

  if (device) {
    device.isLocked = false;
    device.status = 'ONLINE';
    device.lockReason = undefined;
    device.lastHeartbeat = new Date().toISOString();
  } else {
    // If not found in registry, ensure it exists with isLocked: false so status endpoints return unlocked
    device = {
      id: `dev-${request.deviceId.toLowerCase()}`,
      deviceId: request.deviceId,
      serialNumber: `SN-${request.deviceId}`,
      name: request.deviceName || `Workstation ${request.deviceId}`,
      model: 'Windows 11 PC (x64)',
      manufacturer: 'EduGuard Windows Client',
      platform: (request.platform as any) || 'WINDOWS_PC',
      osVersion: 'Windows 11 Pro (23H2/24H2)',
      agentVersion: '2.4.0',
      managementMode: 'DEVICE_OWNER',
      status: 'ONLINE',
      isLocked: false,
      schoolId: request.schoolId || 'sch-demo-01',
      schoolName: request.schoolName || 'Demo Examination Center',
      classId: 'cls-12-a',
      className: request.className || 'Class XII-A',
      assignedStudentName: request.studentName,
      assignedStudentRoll: request.studentRoll || 'PC-01',
      batteryLevel: 100,
      isCharging: true,
      networkType: 'WIFI',
      wifiSsid: 'Campus-Secure-5G',
      ipAddress: '127.0.0.1',
      storageTotalGb: 256,
      storageUsedGb: 34.2,
      ramTotalGb: 16,
      ramUsedGb: 3.2,
      policyId: 'pol-exam-lockdown',
      policyVersion: 2,
      policySyncedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      currentActiveApp: 'Windows Desktop',
      kioskMode: 'FULL_LOCKDOWN',
      enrollmentDate: new Date().toISOString(),
      hardwareSecurity: {
        playIntegrityPass: true,
        deviceRooted: false,
        developerOptionsDisabled: true,
        usbDebuggingDisabled: true,
      },
    };
    db.devices.unshift(device);
  }

  // 2. Broadcast the approved exit request event with complete object payload
  const approvalPayload = {
    ...request,
    id: request.id,
    requestId: request.id,
    deviceId: request.deviceId,
    studentName: request.studentName,
    approvedBy: request.reviewedBy,
    reason: request.reviewNote,
    timestamp: request.reviewedAt,
  };
  db.broadcast('kiosk_exit_approved', approvalPayload);

  // 3. Broadcast device unlocked event and device update
  db.broadcast('device_update', device);
  db.broadcast('device_unlocked', {
    deviceId: device.deviceId,
    id: device.id,
    studentName: device.assignedStudentName,
    reason: request.reviewNote,
  });

  db.addAuditLog({
    adminId: req.user?.id || 'usr-super-arvd',
    adminName: req.user?.name || 'ARVD Exam Section Admin',
    adminRole: req.user?.role || 'SUPER_ADMIN',
    schoolId: request.schoolId,
    action: 'KIOSK_EXIT_APPROVED',
    targetType: 'DEVICE',
    targetId: request.deviceId,
    targetDescription: `Administrator ${req.user?.name || 'Admin'} APPROVED Kiosk exit for student ${request.studentName} (${request.studentRoll}) on ${request.deviceName}. Workstation unlocked.`,
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

  const rejectPayload = {
    ...request,
    id: request.id,
    requestId: request.id,
    deviceId: request.deviceId,
    studentName: request.studentName,
    rejectedBy: request.reviewedBy,
    reason: request.reviewNote,
    timestamp: request.reviewedAt,
  };
  db.broadcast('kiosk_exit_rejected', rejectPayload);

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

// -------------------------------------------------------------
// 19. WINDOWS KIOSK DOWNLOADS & INSTALLERS
// -------------------------------------------------------------
// 7. WINDOWS KIOSK DOWNLOADS & EXECUTABLE BUILDERS
// -------------------------------------------------------------
apiRouter.get('/downloads/Stop-EduGuard-Kiosk.bat', (req, res) => {
  const content = `@echo off\r
title EduGuard MDM - Emergency Kiosk Stopper\r
color 0C\r
echo ====================================================================\r
echo  EduGuard MDM - Emergency Kiosk Stopper & Process Cleanup\r
echo ====================================================================\r
echo [*] Terminating EduGuard-Student-Kiosk watchdog processes...\r
taskkill /f /im EduGuard-Student-Kiosk.exe >nul 2>&1\r
taskkill /f /im EduGuard-Student-Kiosk.bat >nul 2>&1\r
taskkill /f /im Create-Student-Kiosk-EXE.bat >nul 2>&1\r
taskkill /f /im Launch-EduGuard-Watchdog.bat >nul 2>&1\r
taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1\r
taskkill /f /im wscript.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1\r
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq EduGuard MDM*" >nul 2>&1\r
echo [*] Terminating Kiosk Edge browser instances...\r
taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1\r
echo.\r
echo [SUCCESS] EduGuard Kiosk processes stopped. Your PC is unlocked!\r
echo ====================================================================\r
pause\r
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Stop-EduGuard-Kiosk.bat"');
  res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
  res.send(content);
});

function getEduGuardCSharpCode(studentKioskUrl: string, baseUrl: string): string {
  return `using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace EduGuardKiosk {
    static class Program {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int VK_TAB = 0x09;
        private const int VK_ESCAPE = 0x1B;
        private const int VK_LWIN = 0x5B;
        private const int VK_RWIN = 0x5C;
        private const int VK_SPACE = 0x20;
        private const int LLKHF_ALTDOWN = 0x20;

        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT {
            public int vkCode;
            public int scanCode;
            public int flags;
            public int time;
            public IntPtr dwExtraInfo;
        }

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
            if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN)) {
                KBDLLHOOKSTRUCT hook = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                bool isAlt = (hook.flags & LLKHF_ALTDOWN) != 0;
                // 1. Block Alt+Tab completely from Windows Task Switcher
                if (isAlt && hook.vkCode == VK_TAB) return (IntPtr)1;
                // 2. Block Alt+Escape
                if (isAlt && hook.vkCode == VK_ESCAPE) return (IntPtr)1;
                // 3. Block Alt+Space
                if (isAlt && hook.vkCode == VK_SPACE) return (IntPtr)1;
                // 4. Block Windows Keys (Start menu, Win+Tab, Win+D, Win+E)
                if (hook.vkCode == VK_LWIN || hook.vkCode == VK_RWIN) return (IntPtr)1;
                // 5. Block Ctrl+Escape
                if (hook.vkCode == VK_ESCAPE && (Control.ModifierKeys & Keys.Control) != 0) return (IntPtr)1;
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        [STAThread]
        static void Main() {
            try {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | SecurityProtocolType.Tls;
                ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
            } catch {}

            // Install low-level keyboard hook on background STA thread to disable Alt+Tab
            Thread hookThread = new Thread(() => {
                try {
                    _hookID = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(Process.GetCurrentProcess().MainModule.ModuleName), 0);
                    Application.Run();
                } catch {}
            });
            hookThread.SetApartmentState(ApartmentState.STA);
            hookThread.IsBackground = true;
            hookThread.Start();

            bool isNew;
            using (Mutex mutex = new Mutex(true, "EduGuardKiosk_SingleInstance_Mutex", out isNew)) {
                if (!isNew) return;

                string machineId = "WIN-" + Environment.MachineName;
                string macAddress = "";
                try {
                    foreach (System.Net.NetworkInformation.NetworkInterface nic in System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces()) {
                        if (nic.OperationalStatus == System.Net.NetworkInformation.OperationalStatus.Up && 
                            nic.NetworkInterfaceType != System.Net.NetworkInformation.NetworkInterfaceType.Loopback) {
                            byte[] bytes = nic.GetPhysicalAddress().GetAddressBytes();
                            if (bytes != null && bytes.Length == 6) {
                                macAddress = string.Format("{0:X2}:{1:X2}:{2:X2}:{3:X2}:{4:X2}:{5:X2}", bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
                                break;
                            }
                        }
                    }
                } catch {}

                string url = "${studentKioskUrl}";
                if (url.IndexOf("?") >= 0) {
                    url += "&device_id=" + Uri.EscapeDataString(machineId) + "&device_name=" + Uri.EscapeDataString(Environment.MachineName) + "&mac_address=" + Uri.EscapeDataString(macAddress);
                } else {
                    url += "?student=true&device_id=" + Uri.EscapeDataString(machineId) + "&device_name=" + Uri.EscapeDataString(Environment.MachineName) + "&mac_address=" + Uri.EscapeDataString(macAddress);
                }

                string dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "EduGuardKiosk", "BrowserProfile");
                try { if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir); } catch {}

                string browser = FindBrowser();
                string args = "--kiosk \\\"" + url + "\\\" --edge-kiosk-type=fullscreen --user-data-dir=\\\"" + dataDir + "\\\" --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI,InterestFeedContentSuggestions --disable-pinch --kiosk-printing";

                while (true) {
                    try {
                        Process p = new Process();
                        p.StartInfo.FileName = browser;
                        p.StartInfo.Arguments = args;
                        p.StartInfo.UseShellExecute = false;
                        p.Start();

                        DateTime start = DateTime.Now;

                        // Actively monitor admin status while browser is running
                        while (!p.HasExited) {
                            Thread.Sleep(2000);
                            try {
                                using (WebClient wc = new WebClient()) {
                                    wc.Headers.Add("User-Agent", "EduGuard-Windows-Kiosk/1.4");
                                    string checkUrl = "${baseUrl}/api/devices/" + Uri.EscapeDataString(machineId) + "/kiosk-status";
                                    string statusJson = wc.DownloadString(checkUrl);
                                    if (statusJson.IndexOf("\\\"isDeleted\\\":true") >= 0) {
                                        try { p.Kill(); } catch {}
                                        return;
                                    }
                                    if (statusJson.IndexOf("\\\"isLocked\\\":false") >= 0 || 
                                        statusJson.IndexOf("\\\"kioskActive\\\":false") >= 0) {
                                        // Workstation was unlocked / exit approved by Administrator!
                                        // Terminate kiosk browser immediately to restore clean Windows desktop!
                                        try { p.Kill(); } catch {}
                                        break;
                                    }
                                }
                            } catch {}
                        }

                        // Check if administrator unlocked or removed this specific PC before restarting
                        try {
                            using (WebClient wc = new WebClient()) {
                                wc.Headers.Add("User-Agent", "EduGuard-Windows-Kiosk/1.4");
                                string checkUrl = "${baseUrl}/api/devices/" + Uri.EscapeDataString(machineId) + "/kiosk-status";
                                string statusJson = wc.DownloadString(checkUrl);
                                if (statusJson.IndexOf("\\\"isDeleted\\\":true") >= 0) {
                                    return;
                                }
                                if (statusJson.IndexOf("\\\"isLocked\\\":false") >= 0 || 
                                    statusJson.IndexOf("\\\"kioskActive\\\":false") >= 0) {
                                    // Workstation was unlocked by Administrator!
                                    // Enter silent idle monitoring loop: Windows desktop is completely free.
                                    // When Administrator clicks "Lock Device" from Admin Console, auto-lock PC immediately!
                                    while (true) {
                                        Thread.Sleep(3000);
                                        try {
                                            using (WebClient wc2 = new WebClient()) {
                                                wc2.Headers.Add("User-Agent", "EduGuard-Windows-Kiosk/1.4");
                                                string idleJson = wc2.DownloadString(checkUrl);
                                                if (idleJson.IndexOf("\\\"isDeleted\\\":true") >= 0) return;
                                                if (idleJson.IndexOf("\\\"isLocked\\\":true") >= 0) {
                                                    // Administrator dispatched Lock command! Break out to relaunch kiosk!
                                                    break;
                                                }
                                            }
                                        } catch {}
                                    }
                                }
                            }
                        } catch (WebException wex) {
                            try {
                                if (wex.Response is HttpWebResponse resp && (resp.StatusCode == HttpStatusCode.NotFound || resp.StatusCode == HttpStatusCode.Gone)) {
                                    return;
                                }
                            } catch {}
                        } catch (Exception) {}

                        if (runtime.TotalSeconds < 4) {
                            Thread.Sleep(8000);
                        } else {
                            Thread.Sleep(2000);
                        }
                    } catch (Exception) {
                        Thread.Sleep(6000);
                    }
                }
            }
        }

        static string FindBrowser() {
            try {
                string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
                string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string e1 = Path.Combine(pf86, @"Microsoft\\Edge\\Application\\msedge.exe");
                if (File.Exists(e1)) return e1;
                string e2 = Path.Combine(pf, @"Microsoft\\Edge\\Application\\msedge.exe");
                if (File.Exists(e2)) return e2;
                string c1 = Path.Combine(pf, @"Google\\Chrome\\Application\\chrome.exe");
                if (File.Exists(c1)) return c1;
                string c2 = Path.Combine(pf86, @"Google\\Chrome\\Application\\chrome.exe");
                if (File.Exists(c2)) return c2;
            } catch {}
            return "msedge.exe";
        }
    }
}`;
}

apiRouter.get(['/downloads/EduGuardLauncher.cs', '/downloads/EduGuard-Student-Kiosk.cs'], (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = req.query.url ? String(req.query.url) : `${protocol}://${host}`;
  const studentKioskUrl = baseUrl.includes('?') ? `${baseUrl}&student=true` : `${baseUrl}?student=true`;

  const csCode = getEduGuardCSharpCode(studentKioskUrl, baseUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="EduGuardLauncher.cs"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(csCode);
});

apiRouter.get(['/downloads/Create-Student-Kiosk-EXE.ps1', '/downloads/Build-EduGuard-EXE.ps1'], (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = req.query.url ? String(req.query.url) : `${protocol}://${host}`;
  const studentKioskUrl = baseUrl.includes('?') ? `${baseUrl}&student=true` : `${baseUrl}?student=true`;
  const csCode = getEduGuardCSharpCode(studentKioskUrl, baseUrl);

  const ps1Content = `# EduGuard MDM - Standalone Windows Executable (.EXE) Compiler
# Right-click this file and choose "Run with PowerShell" or run: powershell -ExecutionPolicy Bypass -File .\\Create-Student-Kiosk-EXE.ps1

$ErrorActionPreference = 'SilentlyContinue'
$targetUrl = '${studentKioskUrl}'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
$outExe = Join-Path $scriptDir 'EduGuard-Student-Kiosk.exe'

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " EduGuard MDM - Standalone Windows 10/11 Executable (.EXE) Builder" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "[*] Target Base URL: $targetUrl"
Write-Host "[*] Compiling EduGuard-Student-Kiosk.exe via .NET Framework CodeDom..."

$csSource = @'
${csCode}
'@

$params = New-Object System.CodeDom.Compiler.CompilerParameters
$params.GenerateExecutable = $true
$params.OutputAssembly = $outExe
$params.CompilerOptions = "/target:winexe /optimize+ /platform:anycpu"
$params.ReferencedAssemblies.Add("System.dll")
$params.ReferencedAssemblies.Add("System.Windows.Forms.dll")

$provider = New-Object Microsoft.CSharp.CSharpCodeProvider
$result = $provider.CompileAssemblyFromSource($params, $csSource)

if ($result.Errors.HasErrors) {
    Write-Host "[!] Compilation notice/errors:" -ForegroundColor Red
    foreach ($err in $result.Errors) {
        Write-Host "    $err" -ForegroundColor Red
    }
}

if (Test-Path $outExe) {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Created: $outExe" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host " EduGuard-Student-Kiosk.exe is ready!"
    Write-Host " - Standalone windowless background supervisor"
    Write-Host " - Fullscreen lockdown with remote unlock capability"
    Write-Host ""
    $runNow = Read-Host "Do you want to start EduGuard Student Kiosk right now? (Y/N) [default: Y]"
    if ($runNow -ne 'N' -and $runNow -ne 'n') {
        Start-Process $outExe
    }
} else {
    Write-Host "[!] Could not create $outExe directly." -ForegroundColor Yellow
}
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Create-Student-Kiosk-EXE.ps1"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(ps1Content);
});

apiRouter.get(['/downloads/Create-Student-Kiosk-EXE.bat', '/downloads/Build-EduGuard-EXE.bat'], (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = req.query.url ? String(req.query.url) : `${protocol}://${host}`;
  const studentKioskUrl = baseUrl.includes('?') ? `${baseUrl}&student=true` : `${baseUrl}?student=true`;

  const csCode = getEduGuardCSharpCode(studentKioskUrl, baseUrl);
  const b64 = Buffer.from(csCode, 'utf-8').toString('base64');
  const b64Lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    b64Lines.push(`echo ${b64.slice(i, i + 76)}`);
  }
  const b64EchoBlock = b64Lines.join('\r\n');

  const content = `@echo off\r
setlocal enabledelayedexpansion\r
title EduGuard MDM - Standalone Executable (.EXE) Creator\r
color 0A\r
cd /d "%~dp0"\r
\r
echo ====================================================================\r
echo  EduGuard MDM - Standalone Windows 10/11 Executable (.EXE) Builder\r
echo ====================================================================\r
echo [*] Target Base URL: ${studentKioskUrl}\r
echo [*] Building standalone windowless EduGuard-Student-Kiosk.exe...\r
echo.\r
\r
set "OUT_EXE=%~dp0EduGuard-Student-Kiosk.exe"\r
set "CS_FILE=%TEMP%\\EduGuardLauncher.cs"\r
set "B64_FILE=%TEMP%\\EduGuardLauncher.b64"\r
\r
if exist "%CS_FILE%" del /f /q "%CS_FILE%" >nul 2>&1\r
if exist "%B64_FILE%" del /f /q "%B64_FILE%" >nul 2>&1\r
if exist "%OUT_EXE%" del /f /q "%OUT_EXE%" >nul 2>&1\r
\r
:: Step 1: Attempt to fetch pristine source directly from server if connected\r
echo [*] Fetching source engine...\r
powershell -NoProfile -ExecutionPolicy Bypass -Command ^\r
  "try { $cli = New-Object System.Net.WebClient; $cli.Headers.Add('User-Agent','EduGuard-Builder/1.4'); $cli.DownloadFile('${baseUrl}/api/downloads/EduGuardLauncher.cs?url=${encodeURIComponent(baseUrl)}', $env:CS_FILE); Write-Host '    -> Downloaded source engine successfully.' -ForegroundColor Green } catch {}"\r
\r
:: Step 2: Offline fallback using embedded Base64 payload\r
if not exist "%CS_FILE%" (\r
  echo [*] Extracting embedded offline C# engine...\r
  (\r
${b64EchoBlock}\r
  ) > "%B64_FILE%"\r
\r
  certutil -decode -f "%B64_FILE%" "%CS_FILE%" >nul 2>&1\r
  if not exist "%CS_FILE%" (\r
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^\r
      "try { $b = [System.Convert]::FromBase64String((Get-Content $env:B64_FILE -Raw)); [System.IO.File]::WriteAllBytes($env:CS_FILE, $b) } catch {}"\r
  )\r
  if exist "%B64_FILE%" del /f /q "%B64_FILE%" >nul 2>&1\r
)\r
\r
if not exist "%CS_FILE%" (\r
  echo [!] Error: Failed to extract C# source file.\r
  goto FALLBACK\r
)\r
\r
:: Step 3: Compile via .NET Framework C# compiler (pre-installed on Windows 10/11)\r
set "CSC_PATH=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"\r
if not exist "%CSC_PATH%" set "CSC_PATH=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"\r
\r
if exist "%CSC_PATH%" (\r
  echo [*] Compiling standalone windowless executable via .NET Framework (csc.exe)...\r
  "%CSC_PATH%" /target:winexe /platform:anycpu /optimize+ /out:"%OUT_EXE%" "%CS_FILE%"\r
)\r
\r
:: Step 4: Fallback to PowerShell CodeDom Compiler if csc.exe was missing or failed\r
if not exist "%OUT_EXE%" (\r
  echo [*] Compiling via Windows PowerShell CodeDom Compiler...\r
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^\r
    "$code = [System.IO.File]::ReadAllText($env:CS_FILE); $p = New-Object System.CodeDom.Compiler.CompilerParameters; $p.GenerateExecutable = $true; $p.OutputAssembly = $env:OUT_EXE; $p.CompilerOptions = '/target:winexe /optimize+ /platform:anycpu'; $p.ReferencedAssemblies.Add('System.dll'); $p.ReferencedAssemblies.Add('System.Windows.Forms.dll'); $res = (New-Object Microsoft.CSharp.CSharpCodeProvider).CompileAssemblyFromSource($p, $code); if ($res.Errors.HasErrors) { foreach($e in $res.Errors){ Write-Host ('[!] ' + $e.ToString()) -ForegroundColor Red } }"\r
)\r
\r
if exist "%OUT_EXE%" (\r
  echo.\r
  echo ====================================================================\r
  echo  [SUCCESS] Created: "%OUT_EXE%"\r
  echo ====================================================================\r
  echo  EduGuard-Student-Kiosk.exe is ready!\r
  echo  - Windowless background supervisor (no console window)\r
  echo  - Auto-registers PC with unique machine name (WIN-%%COMPUTERNAME%%)\r
  echo  - Live monitoring and management in Admin Console\r
  echo  - Admin Remote Unlock: Click \\"Exit Kiosk / Unlock PC\\" in Admin Console\r
  echo    to remotely release this PC back to Windows desktop!\r
  echo ====================================================================\r
  echo.\r
  set /p \"RUN_NOW=Do you want to start EduGuard Student Kiosk right now? (Y/N) [default: Y]: \"\r
  if /i not \"!RUN_NOW!\"==\"N\" (\r
      echo [*] Starting EduGuard-Student-Kiosk.exe...\r
      start \"\" \"%OUT_EXE%\"\r
  )\r
) else (\r
  :FALLBACK\r
  echo.\r
  echo [!] Notice: Direct .EXE compilation did not finish on this system.\r
  echo [*] Creating Silent Kiosk script launcher (works without compiler)...\r
  copy /y \"%~dp0EduGuard-Student-Kiosk.vbs\" \"%~dp0EduGuard-Student-Kiosk.vbs\" >nul 2>&1\r
  echo [*] You can double-click \\"EduGuard-Student-Kiosk.vbs\\" or \\"Launch-EduGuard-Watchdog.bat\\" to start!\r
)\r
\r
:FINISHED\r
if exist "%CS_FILE%" del /f /q "%CS_FILE%" >nul 2>&1\r
if exist "%B64_FILE%" del /f /q "%B64_FILE%" >nul 2>&1\r
echo.\r
pause\r
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Create-Student-Kiosk-EXE.bat"');
  res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
  res.send(content);
});

apiRouter.get('/downloads/EduGuard-Student-Kiosk.vbs', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = req.query.url ? String(req.query.url) : `${protocol}://${host}`;
  const studentKioskUrl = baseUrl.includes('?') ? `${baseUrl}&student=true` : `${baseUrl}?student=true`;

  const content = `' EduGuard MDM - Silent Windowless Student Kiosk Launcher (.VBS)\r
' Zero command window flashing, native WScript execution\r
\r
On Error Resume Next\r
Set WshShell = CreateObject("WScript.Shell")\r
Set fso = CreateObject("Scripting.FileSystemObject")\r
Set WshNetwork = CreateObject("WScript.Network")\r
\r
machineName = WshNetwork.ComputerName\r
machineId = "WIN-" & machineName\r
appData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")\r
dataBaseDir = appData & "\\EduGuardKiosk"\r
dataDir = dataBaseDir & "\\BrowserProfile"\r
\r
If Not fso.FolderExists(dataBaseDir) Then\r
    fso.CreateFolder(dataBaseDir)\r
End If\r
If Not fso.FolderExists(dataDir) Then\r
    fso.CreateFolder(dataDir)\r
End If\r
\r
' Detect physical MAC address safely via WMI\r
macAddr = ""\r
Set objWMIService = GetObject("winmgmts:\\\\.\\root\\cimv2")\r
If Err.Number = 0 And Not objWMIService Is Nothing Then\r
    Set colAdapters = objWMIService.ExecQuery("SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = True")\r
    If Err.Number = 0 And Not colAdapters Is Nothing Then\r
        For Each objAdapter in colAdapters\r
            If objAdapter.MACAddress <> "" Then\r
                macAddr = objAdapter.MACAddress\r
                Exit For\r
            End If\r
        Next\r
    End If\r
End If\r
Err.Clear\r
\r
' Locate Microsoft Edge or Google Chrome executable\r
browserExe = ""\r
pf86 = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%")\r
pf = WshShell.ExpandEnvironmentStrings("%ProgramFiles%")\r
\r
If fso.FileExists(pf86 & "\\Microsoft\\Edge\\Application\\msedge.exe") Then\r
    browserExe = pf86 & "\\Microsoft\\Edge\\Application\\msedge.exe"\r
ElseIf fso.FileExists(pf & "\\Microsoft\\Edge\\Application\\msedge.exe") Then\r
    browserExe = pf & "\\Microsoft\\Edge\\Application\\msedge.exe"\r
ElseIf fso.FileExists(appData & "\\Microsoft\\Edge\\Application\\msedge.exe") Then\r
    browserExe = appData & "\\Microsoft\\Edge\\Application\\msedge.exe"\r
ElseIf fso.FileExists(pf & "\\Google\\Chrome\\Application\\chrome.exe") Then\r
    browserExe = pf & "\\Google\\Chrome\\Application\\chrome.exe"\r
ElseIf fso.FileExists(pf86 & "\\Google\\Chrome\\Application\\chrome.exe") Then\r
    browserExe = pf86 & "\\Google\\Chrome\\Application\\chrome.exe"\r
Else\r
    browserExe = "msedge.exe"\r
End If\r
\r
targetUrl = "${studentKioskUrl}&device_id=" & machineId & "&device_name=" & machineName & "&mac_address=" & macAddr\r
kioskArgs = " --new-window --kiosk """ & targetUrl & """ --edge-kiosk-type=fullscreen --user-data-dir=""" & dataDir & """ --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI,InterestFeedContentSuggestions --disable-pinch --kiosk-printing"\r
\r
If InStr(browserExe, " ") > 0 Then\r
    cmdToRun = """" & browserExe & """" & kioskArgs\r
Else\r
    cmdToRun = browserExe & kioskArgs\r
End If\r
\r
' Write and launch Low-Level Keyboard Blocker safely\r
keyBlockerPs1 = dataBaseDir & "\\EduGuard-KeyBlocker.ps1"\r
If Not fso.FileExists(keyBlockerPs1) Then\r
    Set psFile = fso.CreateTextFile(keyBlockerPs1, True)\r
    If Err.Number = 0 And Not psFile Is Nothing Then\r
        psFile.WriteLine "$host.UI.RawUI.WindowTitle = 'EduGuard-KeyBlocker'"\r
        psFile.WriteLine "$code = @"\r
        psFile.WriteLine "using System;"\r
        psFile.WriteLine "using System.Diagnostics;"\r
        psFile.WriteLine "using System.Runtime.InteropServices;"\r
        psFile.WriteLine "using System.Windows.Forms;"\r
        psFile.WriteLine "public class KeyBlocker {"\r
        psFile.WriteLine "    private const int WH_KEYBOARD_LL = 13;"\r
        psFile.WriteLine "    private const int WM_KEYDOWN = 0x0100;"\r
        psFile.WriteLine "    private const int WM_KEYUP = 0x0101;"\r
        psFile.WriteLine "    private const int WM_SYSKEYDOWN = 0x0104;"\r
        psFile.WriteLine "    private const int WM_SYSKEYUP = 0x0105;"\r
        psFile.WriteLine "    private const int VK_TAB = 0x09;"\r
        psFile.WriteLine "    private const int VK_ESCAPE = 0x1B;"\r
        psFile.WriteLine "    private const int VK_LWIN = 0x5B;"\r
        psFile.WriteLine "    private const int VK_RWIN = 0x5C;"\r
        psFile.WriteLine "    private const int VK_SPACE = 0x20;"\r
        psFile.WriteLine "    private const int VK_F4 = 0x73;"\r
        psFile.WriteLine "    private const int LLKHF_ALTDOWN = 0x20;"\r
        psFile.WriteLine "    [StructLayout(LayoutKind.Sequential)] private struct KBDLLHOOKSTRUCT { public int vkCode; public int scanCode; public int flags; public int time; public IntPtr dwExtraInfo; }"\r
        psFile.WriteLine "    private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);"\r
        psFile.WriteLine "    private static HookProc _proc = Callback;"\r
        psFile.WriteLine "    private static IntPtr _h = IntPtr.Zero;"\r
        psFile.WriteLine "    public static void Start() {"\r
        psFile.WriteLine "        IntPtr hMod = GetModuleHandle(IntPtr.Zero);"\r
        psFile.WriteLine "        _h = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, hMod, 0);"\r
        psFile.WriteLine "        Application.Run();"\r
        psFile.WriteLine "    }"\r
        psFile.WriteLine "    private static IntPtr Callback(int nCode, IntPtr wParam, IntPtr lParam) {"\r
        psFile.WriteLine "        if (nCode >= 0) {"\r
        psFile.WriteLine "            int msg = (int)wParam;"\r
        psFile.WriteLine "            if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN || msg == WM_KEYUP || msg == WM_SYSKEYUP) {"\r
        psFile.WriteLine "                KBDLLHOOKSTRUCT k = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));"\r
        psFile.WriteLine "                bool isAlt = (k.flags & LLKHF_ALTDOWN) != 0;"\r
        psFile.WriteLine "                if (isAlt && k.vkCode == VK_TAB) return (IntPtr)1;"\r
        psFile.WriteLine "                if (isAlt && (k.vkCode == VK_ESCAPE || k.vkCode == VK_SPACE)) return (IntPtr)1;"\r
        psFile.WriteLine "                if (isAlt && k.vkCode == VK_F4) return (IntPtr)1;"\r
        psFile.WriteLine "                if (k.vkCode == VK_LWIN || k.vkCode == VK_RWIN) return (IntPtr)1;"\r
        psFile.WriteLine "                if (k.vkCode == VK_ESCAPE && (Control.ModifierKeys & Keys.Control) != 0) return (IntPtr)1;"\r
        psFile.WriteLine "            }"\r
        psFile.WriteLine "        }"\r
        psFile.WriteLine "        return CallNextHookEx(_h, nCode, wParam, lParam);"\r
        psFile.WriteLine "    }"\r
        psFile.WriteLine "    [DllImport(""user32.dll"", SetLastError = true)] private static extern IntPtr SetWindowsHookEx(int id, HookProc lp, IntPtr mod, uint th);"\r
        psFile.WriteLine "    [DllImport(""user32.dll"")] private static extern IntPtr CallNextHookEx(IntPtr h, int c, IntPtr w, IntPtr l);"\r
        psFile.WriteLine "    [DllImport(""kernel32.dll"", CharSet = CharSet.Auto, SetLastError = true)] private static extern IntPtr GetModuleHandle(IntPtr m);"\r
        psFile.WriteLine "}"\r
        psFile.WriteLine "'@"\r
        psFile.WriteLine "Add-Type -TypeDefinition $code -ReferencedAssemblies System.Windows.Forms"\r
        psFile.WriteLine "[KeyBlocker]::Start()"\r
        psFile.Close\r
    End If\r
    Err.Clear\r
End If\r
\r
' Safely launch KeyBlocker silently in background\r
WshShell.Run "powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & keyBlockerPs1 & """", 0, False\r
Err.Clear\r
\r
' Launch kiosk with multi-tier fail-safe execution\r
Dim runRes\r
runRes = WshShell.Run(cmdToRun, 1, False)\r
If Err.Number <> 0 Or runRes <> 0 Then\r
    Err.Clear\r
    WshShell.Run "msedge.exe" & kioskArgs, 1, False\r
End If\r
If Err.Number <> 0 Then\r
    Err.Clear\r
    WshShell.Run "chrome.exe" & kioskArgs, 1, False\r
End If\r
If Err.Number <> 0 Then\r
    Err.Clear\r
    WshShell.Run "explorer.exe """ & targetUrl & """", 1, False\r
End If\r
Err.Clear\r
\r
Do While True\r
    WScript.Sleep 3000\r
\r
    ' 1. Check if Administrator unlocked or removed workstation\r
    On Error Resume Next\r
    Dim http\r
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")\r
    If Err.Number <> 0 Or http Is Nothing Then\r
        Err.Clear\r
        Set http = CreateObject("MSXML2.XMLHTTP")\r
    End If\r
    If Err.Number <> 0 Or http Is Nothing Then\r
        Err.Clear\r
        Set http = CreateObject("WinHttp.WinHttpRequest.5.1")\r
    End If\r
\r
    If Not http Is Nothing Then\r
        http.Open "GET", "${baseUrl}/api/devices/" & machineId & "/kiosk-status", False\r
        http.Send\r
        If Err.Number = 0 And http.Status = 200 Then\r
            Dim resp\r
            resp = http.responseText\r
            If InStr(resp, """isDeleted"":true") > 0 Then\r
                ' Workstation deleted by admin: terminate kiosk browser and quit\r
                WshShell.Run "taskkill /f /im msedge.exe", 0, True\r
                WshShell.Run "taskkill /f /im chrome.exe", 0, True\r
                WshShell.Run "taskkill /f /fi ""WINDOWTITLE eq EduGuard-KeyBlocker*""", 0, True\r
                WScript.Quit 0\r
            End If\r
            If InStr(resp, """isLocked"":false") > 0 Or InStr(resp, """kioskActive"":false") > 0 Then\r
                ' WORKSTATION UNLOCKED / APPROVED BY ADMINISTRATOR!\r
                WshShell.Run "taskkill /f /im msedge.exe", 0, True\r
                WshShell.Run "taskkill /f /im chrome.exe", 0, True\r
                WshShell.Run "taskkill /f /fi ""WINDOWTITLE eq EduGuard-KeyBlocker*""", 0, True\r
                \r
                ' Silent idle standby: if Admin ever sends Remote Lock, lock PC again!\r
                Do While True\r
                    WScript.Sleep 3000\r
                    Dim httpIdle\r
                    Set httpIdle = CreateObject("MSXML2.ServerXMLHTTP.6.0")\r
                    If Err.Number <> 0 Or httpIdle Is Nothing Then\r
                        Err.Clear\r
                        Set httpIdle = CreateObject("MSXML2.XMLHTTP")\r
                    End If\r
                    httpIdle.Open "GET", "${baseUrl}/api/devices/" & machineId & "/kiosk-status", False\r
                    httpIdle.Send\r
                    If Err.Number = 0 And httpIdle.Status = 200 Then\r
                        Dim idleResp\r
                        idleResp = httpIdle.responseText\r
                        If InStr(idleResp, """isDeleted"":true") > 0 Then WScript.Quit 0\r
                        If InStr(idleResp, """isLocked"":true") > 0 And InStr(idleResp, """kioskActive"":true") > 0 Then\r
                            ' Admin dispatched Remote Lock! Relaunch key blocker and kiosk immediately!\r
                            WshShell.Run "powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & keyBlockerPs1 & """", 0, False\r
                            Exit Do\r
                        End If\r
                    End If\r
                    Err.Clear\r
                Loop\r
                ' Re-launch kiosk after admin locked\r
                WshShell.Run cmdToRun, 1, False\r
            End If\r
        End If\r
    End If\r
    ' CRITICAL: NEVER terminate on 404, 500, or network offline!\r
    Err.Clear\r
\r
    ' 2. Anti-tamper watchdog: If browser closed or crashed while workstation is STILL LOCKED, relaunch it!\r
    Dim edgeProcs\r
    Set edgeProcs = GetObject("winmgmts:").ExecQuery("Select ProcessId from Win32_Process Where Name = 'msedge.exe' or Name = 'chrome.exe'")\r
    If Err.Number = 0 And Not edgeProcs Is Nothing Then\r
        If edgeProcs.Count = 0 Then\r
            WshShell.Run cmdToRun, 1, False\r
        End If\r
    End If\r
    Err.Clear\r
Loop\r
`;
  res.setHeader('Content-Disposition', 'attachment; filename="EduGuard-Student-Kiosk.vbs"');
  res.setHeader('Content-Type', 'application/x-vbs; charset=utf-8');
  res.send(content);
});

apiRouter.get('/downloads/Launch-EduGuard-Watchdog.bat', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = req.query.url ? String(req.query.url) : `${protocol}://${host}`;
  const studentKioskUrl = baseUrl.includes('?') ? `${baseUrl}&student=true` : `${baseUrl}?student=true`;

  const content = `@echo off\r
setlocal enabledelayedexpansion\r
title EduGuard MDM - Windows Secure Student Kiosk Active\r
color 0B\r
echo ====================================================================\r
echo  EduGuard MDM - Windows 10/11 Secure Student Kiosk Active\r
echo ====================================================================\r
set "DEV_ID=WIN-%COMPUTERNAME%"\r
set "DEV_NAME=%COMPUTERNAME%"\r
set "TARGET_URL=${studentKioskUrl}&device_id=!DEV_ID!&device_name=!DEV_NAME!"\r
echo [*] Workstation ID: !DEV_ID!\r
echo [*] Kiosk Target: !TARGET_URL!\r
echo [*] Watchdog: Active (Ensures kiosk remains full-screen)\r
echo [*] Single-Instance & Rapid Reload Protection: Enabled\r
echo ====================================================================\r
\r
set "DATA_DIR=%LOCALAPPDATA%\\EduGuardKiosk\\BrowserProfile"\r
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%" >nul 2>&1\r
\r
set "BROWSER_EXE="\r
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"\r
if not defined BROWSER_EXE if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"\r
if not defined BROWSER_EXE if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"\r
if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"\r
if not defined BROWSER_EXE set "BROWSER_EXE=msedge.exe"\r
\r
echo [*] Using Browser: !BROWSER_EXE!\r
echo.\r
\r
:START_KIOSK\r
echo [%time%] Starting EduGuard Student Kiosk for workstation !DEV_ID!...\r
:: Ensure KeyBlocker is running in background to disable Alt+Tab\r
if exist "%LOCALAPPDATA%\\EduGuardKiosk\\EduGuard-KeyBlocker.ps1" (\r
    start "" /b powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\\EduGuardKiosk\\EduGuard-KeyBlocker.ps1"\r
)\r
start "" "!BROWSER_EXE!" --kiosk "!TARGET_URL!" --edge-kiosk-type=fullscreen --user-data-dir="%DATA_DIR%" --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI,InterestFeedContentSuggestions --disable-pinch --kiosk-printing\r
\r
:MONITOR_LOOP\r
timeout /t 2 /nobreak >nul\r
\r
:: Check if administrator unlocked or deleted this specific workstation from the Admin Console\r
powershell -NoProfile -Command "try { $r = (Invoke-RestMethod -Uri '${baseUrl}/api/devices/!DEV_ID!/kiosk-status' -TimeoutSec 4); if ($r.data.isDeleted -eq $true) { exit 2 } else if ($r.data.isLocked -eq $false -or $r.data.kioskActive -eq $false) { exit 1 } else { exit 0 } } catch { exit 0 }" >nul 2>&1\r
set "STATUS_CODE=!errorlevel!"\r
\r
if !STATUS_CODE! equ 2 (\r
    echo.\r
    echo ====================================================================\r
    echo  [REMOVED] Workstation was deleted from fleet inventory. Exiting.\r
    echo ====================================================================\r
    taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1\r
    taskkill /f /im msedge.exe >nul 2>&1\r
    taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1\r
    exit /b 0\r
)\r
if !STATUS_CODE! equ 1 (\r
    echo.\r
    echo ====================================================================\r
    echo  [UNLOCKED] Administrator approved exit / unlocked workstation!\r
    echo  [CLOSING] Terminating all kiosk windows immediately...\r
    echo ====================================================================\r
    taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1\r
    taskkill /f /im chrome.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1\r
    taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1\r
    timeout /t 1 /nobreak >nul\r
    taskkill /f /im msedge.exe >nul 2>&1\r
    echo  [SUCCESS] All kiosk windows closed! Windows desktop restored.\r
    echo  [*] Standby monitoring: will auto-lock if Admin sends Lock command...\r
    echo ====================================================================\r
    :IDLE_MONITOR\r
    timeout /t 3 /nobreak >nul\r
    powershell -NoProfile -Command "try { $r = (Invoke-RestMethod -Uri '${baseUrl}/api/devices/!DEV_ID!/kiosk-status' -TimeoutSec 4); if ($r.data.isDeleted -eq $true) { exit 2 } else if ($r.data.isLocked -eq $true -and $r.data.kioskActive -eq $true) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1\r
    if !errorlevel! equ 2 exit /b 0\r
    if !errorlevel! equ 0 (\r
        echo [%time%] Administrator dispatched Lock command! Relaunching Kiosk immediately...\r
        goto START_KIOSK\r
    )\r
    goto IDLE_MONITOR\r
)\r
\r
:: If still locked, ensure browser is still running (anti-tamper / crash recovery)\r
tasklist /fi "IMAGENAME eq msedge.exe" 2>nul | findstr /i "msedge.exe" >nul\r
if !errorlevel! neq 0 (\r
    tasklist /fi "IMAGENAME eq chrome.exe" 2>nul | findstr /i "chrome.exe" >nul\r
    if !errorlevel! neq 0 (\r
        echo [%time%] Kiosk window closed while exam is active! Re-launching immediately...\r
        goto START_KIOSK\r
    )\r
)\r
\r
goto MONITOR_LOOP\r
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Launch-EduGuard-Watchdog.bat"');
  res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
  res.send(content);
});



