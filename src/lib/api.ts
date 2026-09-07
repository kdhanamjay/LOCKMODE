// EduGuard MDM — Client-side API Service & Real-Time Event Hub

import {
  DashboardStats,
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
  AdminUser,
  AdminBroadcastMessage,
  StudyMaterial,
  KioskExitRequest,
} from '../types/mdm';

const BASE_URL = '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('eduguard_auth_token') || 'usr-super-arvd';
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json?.error?.message || 'API request failed');
  }
  return json.data;
}

export const api = {
  // Auth
  login: async (email: string, pass: string) =>
    fetchJson<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    }),
  logout: async () =>
    fetchJson<{ loggedOut: boolean }>('/auth/logout', {
      method: 'POST',
    }),
  getMe: async () => fetchJson<AdminUser>('/auth/me'),

  // Dashboard
  getDashboardStats: async () => fetchJson<DashboardStats>('/dashboard/stats'),

  // Schools & Hierarchy
  getSchools: async () => fetchJson<School[]>('/schools'),
  createSchool: async (data: Partial<School>) =>
    fetchJson<School>('/schools', { method: 'POST', body: JSON.stringify(data) }),

  // Classes
  getClasses: async () => fetchJson<SchoolClass[]>('/classes'),
  createClass: async (data: Partial<SchoolClass>) =>
    fetchJson<SchoolClass>('/classes', { method: 'POST', body: JSON.stringify(data) }),

  // Students
  getStudents: async () => fetchJson<Student[]>('/students'),
  createStudent: async (data: Partial<Student>) =>
    fetchJson<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),

  // Devices & Remote Commands
  getDevices: async () => fetchJson<Device[]>('/devices'),
  getDeviceById: async (id: string) => fetchJson<Device>(`/devices/${id}`),
  enrollDevice: async (data: {
    deviceId?: string;
    name?: string;
    model?: string;
    manufacturer?: string;
    platform?: string;
    osVersion?: string;
    schoolId?: string;
    classId?: string;
    studentName?: string;
    studentRoll?: string;
    studentEmail?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    ramTotalGb?: number;
    storageTotalGb?: number;
    ipAddress?: string;
  }) =>
    fetchJson<{
      device: Device;
      student: Student;
      school: School;
      class: SchoolClass;
      policy: DevicePolicy;
    }>('/devices/enroll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  lockDevice: async (id: string, reason?: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  unlockDevice: async (id: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/unlock`, {
      method: 'POST',
    }),
  exitKiosk: async (id: string) =>
    fetchJson<{ device: Device }>(`/devices/${id}/exit-kiosk`, {
      method: 'POST',
    }),
  getKioskStatus: async (id: string) =>
    fetchJson<{ isLocked: boolean; kioskActive: boolean; status: string; kioskMode?: string; isDeleted?: boolean; lockReason?: string }>(`/devices/${id}/kiosk-status`),
  syncDevicePolicy: async (id: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/sync`, {
      method: 'POST',
    }),
  rebootDevice: async (id: string) =>
    fetchJson<{ command: RemoteCommand }>(`/devices/${id}/reboot`, {
      method: 'POST',
    }),
  deleteDevice: async (id: string) =>
    fetchJson<{ deletedDeviceId: string; deletedId: string; name: string }>(`/devices/${id}`, {
      method: 'DELETE',
    }),
  checkinDevice: async (data: {
    deviceId: string;
    name?: string;
    model?: string;
    manufacturer?: string;
    platform?: string;
    osVersion?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    isLocked?: boolean;
    currentApp?: string;
    studentName?: string;
    studentRoll?: string;
    classId?: string;
    schoolId?: string;
    wifiSsid?: string;
    ipAddress?: string;
  }) =>
    fetchJson<{ acknowledged: boolean; device: Device; isLocked: boolean; isDeleted?: boolean }>('/devices/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Policies
  getPolicies: async () => fetchJson<DevicePolicy[]>('/policies'),
  createPolicy: async (data: Partial<DevicePolicy>) =>
    fetchJson<DevicePolicy>('/policies', { method: 'POST', body: JSON.stringify(data) }),
  updatePolicy: async (id: string, data: Partial<DevicePolicy>) =>
    fetchJson<DevicePolicy>(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishPolicy: async (id: string, payload?: { restrictions?: any; kioskMode?: any }) =>
    fetchJson<DevicePolicy>(`/policies/${id}/publish`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  // Applications & Deployments
  getApplications: async () => fetchJson<Application[]>('/applications'),
  createApplication: async (data: Partial<Application>) =>
    fetchJson<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  deployApplication: async (id: string, target: { targetType: string; targetId: string; targetName: string }) =>
    fetchJson<Deployment>(`/applications/${id}/deploy`, {
      method: 'POST',
      body: JSON.stringify(target),
    }),
  getDeployments: async () => fetchJson<Deployment[]>('/deployments'),

  // Web Filtering
  getWebFilterRules: async () =>
    fetchJson<{ rules: WebFilterRule[]; categories: WebFilterCategory[] }>('/web-filter/rules'),
  addWebFilterRule: async (data: Partial<WebFilterRule>) =>
    fetchJson<WebFilterRule>('/web-filter/rules', { method: 'POST', body: JSON.stringify(data) }),
  deleteWebFilterRule: async (id: string) =>
    fetchJson<WebFilterRule>(`/web-filter/rules/${id}`, { method: 'DELETE' }),

  // Monitoring
  getUsageRecords: async () => fetchJson<AppUsageRecord[]>('/monitoring/usage'),
  getViolations: async () => fetchJson<PolicyViolation[]>('/monitoring/violations'),
  resolveViolation: async (id: string, note?: string) =>
    fetchJson<PolicyViolation>(`/monitoring/violations/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNote: note }),
    }),

  // Enrollment
  getEnrollmentTokens: async () => fetchJson<EnrollmentToken[]>('/enrollment/tokens'),
  createEnrollmentToken: async (data: any) =>
    fetchJson<EnrollmentToken>('/enrollment/tokens', { method: 'POST', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: async () => fetchJson<AuditLog[]>('/audit-logs'),

  // Settings
  getSettings: async () => fetchJson<SystemRetentionSettings>('/settings'),
  updateSettings: async (settings: Partial<SystemRetentionSettings>) =>
    fetchJson<SystemRetentionSettings>('/settings', { method: 'POST', body: JSON.stringify(settings) }),

  // Admin Broadcast Messages / Announcements
  getMessages: async () => fetchJson<AdminBroadcastMessage[]>('/messages'),
  getDeviceMessages: async (deviceId: string) => fetchJson<AdminBroadcastMessage[]>(`/messages/device/${deviceId}`),
  broadcastMessage: async (payload: {
    title: string;
    body: string;
    priority?: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    requireAcknowledgment?: boolean;
  }) =>
    fetchJson<AdminBroadcastMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  acknowledgeMessage: async (messageId: string, deviceId: string) =>
    fetchJson<AdminBroadcastMessage>(`/messages/${messageId}/ack`, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    }),

  // Class-wise & Subject-wise Study Materials & PDFs
  getStudyMaterials: async (params?: { classId?: string; subject?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.set('classId', params.classId);
    if (params?.subject) query.set('subject', params.subject);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<StudyMaterial[]>(`/study-materials${qs}`);
  },
  uploadStudyMaterial: async (data: Partial<StudyMaterial>) =>
    fetchJson<StudyMaterial>('/study-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteStudyMaterial: async (id: string) =>
    fetchJson<{ deleted: boolean; id: string }>(`/study-materials/${id}`, {
      method: 'DELETE',
    }),

  // Simulator Bridge
  simulatorHeartbeat: async (payload: any) =>
    fetchJson<{ acknowledged: boolean; device?: Device; isDeleted?: boolean; isLocked?: boolean }>('/simulator/heartbeat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  simulatorViolation: async (payload: any) =>
    fetchJson<PolicyViolation>('/simulator/violation', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Kiosk Exit Requests & Approval Workflow
  getKioskExitRequests: async (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return fetchJson<KioskExitRequest[]>(`/kiosk-exit-requests${qs}`);
  },
  getKioskExitRequestStatus: async (deviceId: string) =>
    fetchJson<KioskExitRequest | null>(`/kiosk-exit-requests/status/${encodeURIComponent(deviceId)}`),
  submitKioskExitRequest: async (data: {
    deviceId: string;
    studentId?: string;
    studentName?: string;
    studentRoll?: string;
    className?: string;
    reason: string;
    studentPassword: string;
  }) =>
    fetchJson<KioskExitRequest>('/kiosk-exit-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveKioskExitRequest: async (id: string, note?: string) =>
    fetchJson<KioskExitRequest>(`/kiosk-exit-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
  rejectKioskExitRequest: async (id: string, reason?: string) =>
    fetchJson<KioskExitRequest>(`/kiosk-exit-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// Real-Time Event Subscription (SSE)
export function subscribeToMdmEvents(onEvent: (eventType: string, data: any) => void) {
  const eventSource = new EventSource('/api/events/stream');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent('message', data);
    } catch (e) {
      // Ignore parse err
    }
  };

  const eventTypes = [
    'device_update',
    'device_locked',
    'device_unlocked',
    'device_enrolled',
    'device_deleted',
    'student_created',
    'class_updated',
    'command_update',
    'policy_published',
    'deployment_started',
    'violation_alert',
    'violation_resolved',
    'audit_log',
    'admin_broadcast_message',
    'message_acknowledged',
    'study_material_uploaded',
    'study_material_deleted',
    'kiosk_exit_requested',
    'kiosk_exit_approved',
    'kiosk_exit_rejected',
  ];

  eventTypes.forEach((type) => {
    eventSource.addEventListener(type, (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(type, data);
      } catch (e) {
        // Ignore
      }
    });
  });

  return () => {
    eventSource.close();
  };
}
