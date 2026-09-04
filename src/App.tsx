// EduGuard MDM — Enterprise Android Device Management Web Console
// Complete Real-Time Reactive Architecture

import React, { useState, useEffect, useCallback } from 'react';
import { api, subscribeToMdmEvents } from './lib/api';
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
  AppUsageRecord,
  PolicyViolation,
  AuditLog,
  EnrollmentToken,
  SystemRetentionSettings,
  AdminUser,
  AdminBroadcastMessage,
} from './types/mdm';

import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DevicesView } from './components/DevicesView';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { AnnouncementsView } from './components/AnnouncementsView';
import { PoliciesView } from './components/PoliciesView';
import { ApplicationsView } from './components/ApplicationsView';
import { WebFilterView } from './components/WebFilterView';
import { MonitoringView } from './components/MonitoringView';
import { ViolationsView } from './components/ViolationsView';
import { EnrollmentView } from './components/EnrollmentView';
import { SchoolsAndClassesView } from './components/SchoolsAndClassesView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { StudentDeviceSimulator } from './components/StudentDeviceSimulator';
import { StudentWorkspacePortal } from './components/StudentWorkspacePortal';
import { AdminLoginView } from './components/AdminLoginView';
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isStudentWorkspaceOpen, setIsStudentWorkspaceOpen] = useState<boolean>(() => {
    return window.location.search.includes('student') || window.location.search.includes('kiosk');
  });
  const [currentUser, setCurrentUser] = useState<AdminUser | null>({
    id: 'usr-admin-1',
    email: 'admin@greenwood-high.edu',
    name: 'Sarah Jenkins',
    role: 'SUPER_ADMIN',
    schoolId: 'sch-greenwood-01',
    schoolName: 'Greenwood High School',
  });

  // Core domain state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [policies, setPolicies] = useState<DevicePolicy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [webRules, setWebRules] = useState<WebFilterRule[]>([]);
  const [webCategories, setWebCategories] = useState<WebFilterCategory[]>([]);
  const [usageRecords, setUsageRecords] = useState<AppUsageRecord[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [tokens, setTokens] = useState<EnrollmentToken[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [messages, setMessages] = useState<AdminBroadcastMessage[]>([]);
  const [settings, setSettings] = useState<SystemRetentionSettings>({
    heartbeatRetentionDays: 30,
    appUsageRetentionDays: 90,
    violationRetentionDays: 180,
    auditLogRetentionDays: 365,
    deviceOfflineThresholdMinutes: 15,
    autoLockOnTamper: true,
    strictDnsFiltering: true,
  });

  // Modals & Active Selections
  const [selectedDeviceForModal, setSelectedDeviceForModal] = useState<Device | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load all initial state from /api
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        statsData,
        devicesData,
        policiesData,
        appsData,
        depsData,
        classesData,
        schoolsData,
        studentsData,
        webData,
        usageData,
        violationsData,
        tokensData,
        logsData,
        settingsData,
        messagesData,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getDevices(),
        api.getPolicies(),
        api.getApplications(),
        api.getDeployments(),
        api.getClasses(),
        api.getSchools(),
        api.getStudents(),
        api.getWebFilterRules(),
        api.getUsageRecords(),
        api.getViolations(),
        api.getEnrollmentTokens(),
        api.getAuditLogs(),
        api.getSettings(),
        api.getMessages(),
      ]);

      setStats(statsData);
      setDevices(devicesData);
      setPolicies(policiesData);
      setApplications(appsData);
      setDeployments(depsData);
      setClasses(classesData);
      setSchools(schoolsData);
      setStudents(studentsData);
      setWebRules(webData.rules);
      setWebCategories(webData.categories);
      setUsageRecords(usageData);
      setViolations(violationsData);
      setTokens(tokensData);
      setAuditLogs(logsData);
      setSettings(settingsData);
      setMessages(messagesData);
    } catch (err) {
      console.error('Failed to fetch MDM data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time Event Subscription (SSE)
  useEffect(() => {
    const unsubscribe = subscribeToMdmEvents((eventType, data) => {
      setSseConnected(true);

      if (eventType === 'device_update') {
        setDevices((prev) =>
          prev.map((d) => (d.id === data.device?.id ? { ...d, ...data.device } : d))
        );
        // Refresh selected device modal if open
        setSelectedDeviceForModal((prev) => (prev?.id === data.device?.id ? { ...prev, ...data.device } : prev));
        showToast(`Device ${data.device?.deviceId || ''} updated status to ${data.device?.status}`);
      } else if (eventType === 'violation_alert') {
        setViolations((prev) => [data.violation, ...prev]);
        showToast(`Security Alert: ${data.violation?.type} on ${data.violation?.deviceId}`, 'alert');
      } else if (eventType === 'violation_resolved') {
        setViolations((prev) =>
          prev.map((v) => (v.id === data.violation?.id ? { ...v, isResolved: true } : v))
        );
      } else if (eventType === 'audit_log') {
        setAuditLogs((prev) => [data.log, ...prev]);
      } else if (eventType === 'admin_broadcast_message') {
        setMessages((prev) => [data, ...prev]);
        showToast(`New Broadcast: "${data.title}" sent to ${data.targetName}`);
      } else if (eventType === 'message_acknowledged') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, acknowledgedDeviceIds: [...new Set([...(m.acknowledgedDeviceIds || []), data.deviceId])] }
              : m
          )
        );
      } else if (eventType === 'policy_published') {
        showToast(`Policy v${data.policy?.version} published fleet-wide!`);
        loadAllData();
      }
    });

    return () => unsubscribe();
  }, [loadAllData]);

  // Remote Commands Handlers
  const handleLockDevice = async (deviceId: string) => {
    try {
      const res = await api.lockDevice(deviceId, 'Remote security lock invoked by Administrator');
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? res.device : d)));
      if (selectedDeviceForModal?.id === deviceId) {
        setSelectedDeviceForModal(res.device);
      }
      showToast(`Device ${res.device.deviceId} locked successfully!`);
    } catch (e: any) {
      showToast(e.message || 'Lock command failed', 'alert');
    }
  };

  const handleUnlockDevice = async (deviceId: string) => {
    try {
      const res = await api.unlockDevice(deviceId);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? res.device : d)));
      if (selectedDeviceForModal?.id === deviceId) {
        setSelectedDeviceForModal(res.device);
      }
      showToast(`Device ${res.device.deviceId} unlocked successfully!`);
    } catch (e: any) {
      showToast(e.message || 'Unlock command failed', 'alert');
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    try {
      const res = await api.syncDevicePolicy(deviceId);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? res.device : d)));
      if (selectedDeviceForModal?.id === deviceId) {
        setSelectedDeviceForModal(res.device);
      }
      showToast(`Policy v${res.device.policyVersion} pushed to ${res.device.deviceId}`);
    } catch (e: any) {
      showToast(e.message || 'Sync failed', 'alert');
    }
  };

  const handleRebootDevice = async (deviceId: string) => {
    try {
      await api.rebootDevice(deviceId);
      showToast(`Reboot command dispatched to device!`);
    } catch (e: any) {
      showToast(e.message || 'Reboot command failed', 'alert');
    }
  };

  const handlePublishPolicy = async (policyId: string, payload?: { restrictions?: any; kioskMode?: any }) => {
    try {
      const updated = await api.publishPolicy(policyId, payload);
      setPolicies((prev) => prev.map((p) => (p.id === policyId ? updated : p)));
      showToast(`Policy v${updated.version} published and active!`);
      loadAllData();
    } catch (e: any) {
      showToast(e.message || 'Publish failed', 'alert');
    }
  };

  const handleDeployApp = async (appId: string, target: any) => {
    try {
      const dep = await api.deployApplication(appId, target);
      setDeployments((prev) => [dep, ...prev]);
      showToast(`Rollout initiated to ${target.targetName}!`);
      loadAllData();
    } catch (e: any) {
      showToast(e.message || 'Deployment failed', 'alert');
    }
  };

  const handleAddWebRule = async (rule: Partial<WebFilterRule>) => {
    try {
      const created = await api.addWebFilterRule(rule);
      setWebRules((prev) => [...prev, created]);
      showToast(`Web filter rule "${created.pattern}" added.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to add rule', 'alert');
    }
  };

  const handleDeleteWebRule = async (ruleId: string) => {
    try {
      await api.deleteWebFilterRule(ruleId);
      setWebRules((prev) => prev.filter((r) => r.id !== ruleId));
      showToast(`Web filter rule removed.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete rule', 'alert');
    }
  };

  const handleResolveViolation = async (violationId: string, note?: string) => {
    try {
      const resolved = await api.resolveViolation(violationId, note);
      setViolations((prev) => prev.map((v) => (v.id === violationId ? resolved : v)));
      showToast(`Violation marked as resolved.`);
      loadAllData();
    } catch (e: any) {
      showToast(e.message || 'Failed to resolve violation', 'alert');
    }
  };

  const handleCreateStudent = async (studentData: Partial<Student>) => {
    try {
      const created = await api.createStudent(studentData);
      setStudents((prev) => [...prev, created]);
      showToast(`Student ${created.name} registered.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create student', 'alert');
    }
  };

  const handleCreateApp = async (appData: Partial<Application>) => {
    try {
      const created = await api.createApplication(appData);
      setApplications((prev) => [...prev, created]);
      showToast(`Application ${created.name} registered.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to register app', 'alert');
    }
  };

  const handleUpdateSettings = async (settingsData: Partial<SystemRetentionSettings>) => {
    try {
      const updated = await api.updateSettings(settingsData);
      setSettings(updated);
      showToast(`Retention settings saved successfully.`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update settings', 'alert');
    }
  };

  const handleLoginSuccess = (user: AdminUser, token: string) => {
    localStorage.setItem('eduguard_auth_token', token);
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Welcome back, ${user.name}!`);
    loadAllData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('eduguard_auth_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Logged out of Admin Console safely.');
  };

  // Target device for the interactive simulator / student portal (default to Rahul's TAB-1024 or first device)
  const simulatorDevice = devices.find((d) => d.id === 'dev-tab-1024') || devices[0] || ({} as Device);
  const simulatorPolicy = policies.find((p) => p.id === simulatorDevice.policyId) || policies[0] || ({} as DevicePolicy);

  if (!isAuthenticated || !currentUser) {
    if (isStudentWorkspaceOpen) {
      return (
        <StudentWorkspacePortal
          device={simulatorDevice}
          policy={simulatorPolicy}
          applications={applications}
          onExit={() => setIsStudentWorkspaceOpen(false)}
        />
      );
    }
    return (
      <AdminLoginView
        onLoginSuccess={handleLoginSuccess}
        onLaunchStudentWorkspace={() => setIsStudentWorkspaceOpen(true)}
      />
    );
  }

  const onlineCount = devices.filter((d) => d.status === 'ONLINE' && !d.isLocked).length;
  const lockedCount = devices.filter((d) => d.isLocked).length;
  const criticalViolationsCount = violations.filter((v) => !v.isResolved && v.severity === 'CRITICAL').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50/30 font-sans text-gray-900 antialiased">
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-2.5 text-xs font-semibold transition-all ${
            toastMessage.type === 'alert'
              ? 'bg-rose-500 text-white shadow-rose-200'
              : 'bg-gray-950 text-white shadow-gray-300'
          }`}
        >
          {toastMessage.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Enterprise Navigation Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        currentUser={currentUser}
        onlineCount={onlineCount}
        lockedCount={lockedCount}
        violationCount={violations.filter((v) => !v.isResolved).length}
        isSimulatorOpen={isSimulatorOpen}
        onToggleSimulator={() => setIsSimulatorOpen(!isSimulatorOpen)}
        onLaunchStudentWorkspace={() => setIsStudentWorkspaceOpen(true)}
        onLogout={handleLogout}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentSection={currentSection}
          currentUser={currentUser}
          onlineCount={onlineCount}
          totalCount={devices.length}
          isSimulatorOpen={isSimulatorOpen}
          onToggleSimulator={() => setIsSimulatorOpen(!isSimulatorOpen)}
          onLaunchStudentWorkspace={() => setIsStudentWorkspaceOpen(true)}
          onRefreshData={loadAllData}
          isRefreshing={isRefreshing}
          sseConnected={sseConnected}
          criticalViolationsCount={criticalViolationsCount}
          onSelectSection={setCurrentSection}
          onLogout={handleLogout}
        />

        {/* Main View Port */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">
          <div className="max-w-7xl mx-auto pb-12">
            {currentSection === 'dashboard' && stats && (
              <DashboardView
                stats={stats}
                devices={devices}
                violations={violations}
                onSelectSection={setCurrentSection}
                onOpenDeviceDetail={setSelectedDeviceForModal}
                onQuickLock={handleLockDevice}
                onQuickUnlock={handleUnlockDevice}
              />
            )}

            {currentSection === 'devices' && (
              <DevicesView
                devices={devices}
                onOpenDeviceDetail={setSelectedDeviceForModal}
                onLockDevice={handleLockDevice}
                onUnlockDevice={handleUnlockDevice}
                onSyncDevice={handleSyncDevice}
                onRebootDevice={handleRebootDevice}
                onRefreshList={loadAllData}
              />
            )}

            {currentSection === 'announcements' && (
              <AnnouncementsView
                messages={messages}
                classes={classes}
                devices={devices}
                currentUser={currentUser}
                onRefresh={loadAllData}
                onShowToast={(msg) => showToast(msg)}
              />
            )}

            {currentSection === 'policies' && (
              <PoliciesView
                policies={policies}
                onPublishPolicy={handlePublishPolicy}
                onCreatePolicy={() => {}}
              />
            )}

            {currentSection === 'applications' && (
              <ApplicationsView
                applications={applications}
                deployments={deployments}
                classes={classes}
                onDeployApp={handleDeployApp}
                onCreateApp={handleCreateApp}
              />
            )}

            {currentSection === 'web_filter' && (
              <WebFilterView
                rules={webRules}
                categories={webCategories}
                onAddRule={handleAddWebRule}
                onDeleteRule={handleDeleteWebRule}
              />
            )}

            {currentSection === 'monitoring' && (
              <MonitoringView usageRecords={usageRecords} devices={devices} />
            )}

            {currentSection === 'violations' && (
              <ViolationsView
                violations={violations}
                devices={devices}
                onResolveViolation={handleResolveViolation}
                onOpenDevice={setSelectedDeviceForModal}
              />
            )}

            {currentSection === 'enrollment' && (
              <EnrollmentView
                tokens={tokens}
                classes={classes}
                onCreateToken={() => {}}
                onLaunchStudentPortal={() => setIsStudentWorkspaceOpen(true)}
              />
            )}

            {currentSection === 'schools_classes' && (
              <SchoolsAndClassesView
                schools={schools}
                classes={classes}
                students={students}
                devices={devices}
                onCreateStudent={handleCreateStudent}
                onCreateClass={() => {}}
              />
            )}

            {currentSection === 'audit_logs' && <AuditLogsView logs={auditLogs} />}

            {currentSection === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Cross-Platform Fullscreen Student Workspace Portal (Windows 10/11 & Android) */}
      {isStudentWorkspaceOpen && (
        <StudentWorkspacePortal
          device={simulatorDevice}
          policy={simulatorPolicy}
          applications={applications}
          onExit={() => setIsStudentWorkspaceOpen(false)}
        />
      )}

      {/* Detailed Device 7-Tab Modal */}
      {selectedDeviceForModal && (
        <DeviceDetailModal
          device={selectedDeviceForModal}
          onClose={() => setSelectedDeviceForModal(null)}
          onLock={handleLockDevice}
          onUnlock={handleUnlockDevice}
          onSync={handleSyncDevice}
          onReboot={handleRebootDevice}
          policies={policies}
          applications={applications}
          usageRecords={usageRecords}
          violations={violations}
        />
      )}

      {/* Interactive Live Student Android DPC Simulator */}
      {isSimulatorOpen && simulatorDevice && (
        <StudentDeviceSimulator
          device={simulatorDevice}
          policy={simulatorPolicy}
          applications={applications}
          deployments={deployments}
          webRules={webRules}
          onClose={() => setIsSimulatorOpen(false)}
          onViolationTriggered={loadAllData}
          onStatusUpdated={loadAllData}
        />
      )}
    </div>
  );
}

export default App;
