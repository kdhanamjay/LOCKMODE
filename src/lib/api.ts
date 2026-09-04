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
} from '../types/mdm';

const BASE_URL = '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('eduguard_auth_token') || 'usr-admin-1';
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
  lockDevice: async (id: string, reason?: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  unlockDevice: async (id: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/unlock`, {
      method: 'POST',
    }),
  syncDevicePolicy: async (id: string) =>
    fetchJson<{ device: Device; command: RemoteCommand }>(`/devices/${id}/sync`, {
      method: 'POST',
    }),
  rebootDevice: async (id: string) =>
    fetchJson<{ command: RemoteCommand }>(`/devices/${id}/reboot`, {
      method: 'POST',
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

  // Simulator Bridge
  simulatorHeartbeat: async (payload: any) =>
    fetchJson<{ acknowledged: boolean; device?: Device }>('/simulator/heartbeat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  simulatorViolation: async (payload: any) =>
    fetchJson<PolicyViolation>('/simulator/violation', {
      method: 'POST',
      body: JSON.stringify(payload),
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
    'command_update',
    'policy_published',
    'deployment_started',
    'violation_alert',
    'violation_resolved',
    'audit_log',
    'admin_broadcast_message',
    'message_acknowledged',
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
