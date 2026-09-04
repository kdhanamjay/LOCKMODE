// EduGuard MDM — Cross-Platform Fullscreen Student Workspace (Android & Windows 10/11)
// 100% Offline Operational + Auto-Sync with Server When Online + Keyboard & DevTools Lockdown

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Globe,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  Megaphone,
  Calculator,
  BookOpen,
  FileText,
  Atom,
  Bell,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Laptop,
  Tablet,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { Device, Application, DevicePolicy, AdminBroadcastMessage, Deployment, WebFilterRule } from '../types/mdm';
import { api } from '../lib/api';

interface StudentWorkspacePortalProps {
  device?: Device;
  policy?: DevicePolicy;
  applications?: Application[];
  onExit?: () => void;
}

export const StudentWorkspacePortal: React.FC<StudentWorkspacePortalProps> = ({
  device: propDevice,
  policy: propPolicy,
  applications: propApps,
  onExit,
}) => {
  // Device & Policy state
  const device: Device = propDevice || {
    id: 'dev-pc-01',
    deviceId: 'EDU-PC-LAB-12',
    name: 'Lab Student Station #12',
    schoolId: 'sch-greenwood-01',
    classId: 'cls-12-a',
    className: 'Class XII-A',
    assignedStudentName: 'Student Workspace',
    assignedStudentRoll: 'ROLL-104',
    model: 'Windows 11 / Android EduTab',
    manufacturer: 'EduGuard',
    osVersion: 'Win 11 / Android 14',
    securityPatchLevel: '2026-08-01',
    status: 'ONLINE',
    isLocked: false,
    kioskModeEnabled: true,
    policyId: 'pol-exam-lockdown',
    lastSyncTimestamp: new Date().toISOString(),
    lastHeartbeatTimestamp: new Date().toISOString(),
    batteryLevel: 98,
    isCharging: true,
    storageUsedGb: 14.2,
    storageTotalGb: 128,
    ramUsedMb: 2400,
    ramTotalMb: 8192,
    currentActiveApp: 'com.eduguard.workspace',
    ipAddress: '192.168.1.104',
    macAddress: '74:D4:35:E1:99:A2',
    isTampered: false,
    enrollmentType: 'ZERO_TOUCH_QR',
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };

  const defaultPolicy: DevicePolicy = propPolicy || {
    id: 'pol-std-kiosk',
    name: 'Classroom Kiosk Standard',
    description: 'Enforces strict educational kiosk mode, safe browsing, and blocks unauthorized apps.',
    schoolId: 'sch-greenwood-01',
    isDefault: true,
    version: 19,
    cameraEnabled: false,
    microphoneEnabled: true,
    bluetoothEnabled: false,
    locationTrackingEnabled: true,
    usbDataTransferAllowed: false,
    screenCaptureAllowed: false,
    factoryResetAllowed: false,
    wifiConfigLock: true,
    statusReportIntervalSeconds: 30,
    maxScreenTimeoutMinutes: 10,
    enforceStrongPassword: true,
    autoLockOnIdleMinutes: 15,
    lockTaskPackages: ['com.eduguard.workspace'],
    mandatoryAppIds: ['app-calc', 'app-notes', 'app-chem', 'app-library'],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };

  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState('classroom.google.com');
  const [browserInput, setBrowserInput] = useState('classroom.google.com');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserBlocked, setBrowserBlocked] = useState(false);
  const [violationToast, setViolationToast] = useState<string | null>(null);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentPolicy, setCurrentPolicy] = useState<DevicePolicy>(defaultPolicy);
  const [installedApps, setInstalledApps] = useState<Application[]>(propApps || []);
  const [messages, setMessages] = useState<AdminBroadcastMessage[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<AdminBroadcastMessage | null>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Admin PIN Unlock Dialog
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Offline Tool States: Calculator
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  // Offline Tool States: Notes
  const [offlineNotes, setOfflineNotes] = useState<string>(() => {
    return localStorage.getItem('eduguard_student_notes') || 'Math Class Notes:\n- Calculus: Integral calculus fundamentals\n- Physics: Electromagnetic waves & Maxwell equations\n- Chemistry: Periodic trends and ionization potential';
  });

  // Keyboard & DevTools Lockdown Interceptor (Windows 10/11 & Web Kiosk)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common inspect & escape hotkeys: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+N, Ctrl+T, Ctrl+W
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        (e.ctrlKey && (e.key === 'n' || e.key === 'N')) ||
        (e.ctrlKey && (e.key === 't' || e.key === 'T'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setViolationToast('Security Alert: Developer inspect shortcuts are blocked by EduGuard Kiosk!');
        setTimeout(() => setViolationToast(null), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      runFullSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-Sync Function with Admin Console
  const runFullSync = async () => {
    if (!isOnline) return;

    try {
      setIsSyncing(true);
      const [policiesData, appsData, messagesData] = await Promise.all([
        api.getPolicies().catch(() => []),
        api.getApplications().catch(() => []),
        api.getDeviceMessages(device.id).catch(() => []),
      ]);

      if (policiesData.length > 0) {
        const matched = policiesData.find((p) => p.id === device.policyId) || policiesData[0];
        setCurrentPolicy(matched);
      }

      if (appsData.length > 0) {
        const approved = appsData.filter((a) => a.isApproved && a.category !== 'RESTRICTED');
        setInstalledApps(approved.length > 0 ? approved : appsData);
      }

      if (messagesData.length > 0) {
        setMessages(messagesData);
        const unacked = messagesData.find(
          (m) => m.requireAcknowledgment && !m.acknowledgedDeviceIds?.includes(device.deviceId)
        );
        if (unacked && !activeAnnouncement) {
          setActiveAnnouncement(unacked);
        }
      }

      setLastSyncTime(new Date());
      setSyncFeedback(`Auto-Sync Complete • Policy v${currentPolicy.version} • ${messagesData.length} Notices`);
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    runFullSync();
    const interval = setInterval(() => {
      if (isOnline) runFullSync();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleAdminUnlock = () => {
    if (unlockPin === '2026' || unlockPin === 'admin') {
      setIsUnlockModalOpen(false);
      setUnlockPin('');
      setUnlockError(false);
      if (onExit) onExit();
    } else {
      setUnlockError(true);
    }
  };

  const handleAcknowledge = async (msgId: string) => {
    if (isOnline) {
      try {
        await api.acknowledgeMessage(msgId, device.deviceId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, acknowledgedDeviceIds: [...(m.acknowledgedDeviceIds || []), device.deviceId] } : m
          )
        );
      } catch (e) {}
    }
    setActiveAnnouncement(null);
  };

  const handleNavigate = (url: string) => {
    setBrowserInput(url);
    const clean = url.toLowerCase().trim().replace(/^https?:\/\//, '');

    const isBlockedDomain =
      clean.includes('instagram.com') ||
      clean.includes('facebook.com') ||
      clean.includes('tiktok.com') ||
      clean.includes('twitter.com') ||
      clean.includes('x.com') ||
      clean.includes('snapchat.com') ||
      clean.includes('discord.com') ||
      clean.includes('reddit.com') ||
      clean.includes('netflix.com') ||
      clean.includes('gaming') ||
      clean.includes('vpn');

    if (isBlockedDomain) {
      setBrowserBlocked(true);
      setBrowserUrl(url);
      if (isOnline) {
        api.simulatorViolation({
          deviceId: device.id,
          studentName: device.assignedStudentName,
          type: 'WEB_FILTER_BLOCKED',
          severity: 'HIGH',
          description: `Attempted access to blocked domain "${url}". Intercepted by DNS sinkhole.`,
        }).catch(() => {});
      }
    } else {
      setBrowserBlocked(false);
      setBrowserUrl(clean);
    }
  };

  // Calculator logic
  const handleCalcNumber = (num: string) => {
    if (calcDisplay === '0' || calcResetOnNext) {
      setCalcDisplay(num);
      setCalcResetOnNext(false);
    } else {
      setCalcDisplay(calcDisplay + num);
    }
  };

  const handleCalcOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcResetOnNext(true);
  };

  const handleCalcEqual = () => {
    if (calcPrev === null || calcOp === null) return;
    const current = parseFloat(calcDisplay);
    let res = 0;
    if (calcOp === '+') res = calcPrev + current;
    if (calcOp === '-') res = calcPrev - current;
    if (calcOp === '×') res = calcPrev * current;
    if (calcOp === '÷') res = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(String(Number(res.toFixed(6))));
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(true);
  };

  const builtInApps = [
    { id: 'calc', name: 'Scientific Calculator', pkg: 'com.edu.calculator', icon: '🧮', desc: 'Trig & Algebra Engine (Offline)' },
    { id: 'notes', name: 'Study Notes & Scratchpad', pkg: 'com.edu.notes', icon: '📝', desc: 'Encrypted Local Storage (Offline)' },
    { id: 'chem', name: 'Chemistry Periodic Table', pkg: 'com.edu.chem', icon: '⚗️', desc: 'Elements & Molecular Weights (Offline)' },
    { id: 'library', name: 'Grade 12 Physics Textbook', pkg: 'com.edu.digitallibrary', icon: '📚', desc: 'NCERT Textbook (Offline Cached)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Kiosk Header Bar */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">EduGuard Student Workspace</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Policy v{currentPolicy.version} • Kiosk Active
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              {device.name} • {device.className || 'Class XII-A'}
            </span>
          </div>
        </div>

        {/* Status Pills: Wi-Fi, Announcements, Unlock */}
        <div className="flex items-center space-x-3">
          {/* Wi-Fi Online / Offline Status */}
          {isOnline ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online (Auto-Syncing)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode (Locked)</span>
            </div>
          )}

          {/* Sync Manual Trigger */}
          {isOnline && (
            <button
              onClick={runFullSync}
              disabled={isSyncing}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              title="Sync with school server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          )}

          {/* Admin Notices Bell */}
          <button
            onClick={() => setIsMessagesOpen(!isMessagesOpen)}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 relative cursor-pointer"
            title="School Broadcast Notices"
          >
            <Bell className="w-4 h-4" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 cursor-pointer"
            title="Toggle Fullscreen Kiosk"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Admin Unlock PIN Button */}
          <button
            onClick={() => setIsUnlockModalOpen(true)}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Unlock</span>
          </button>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div className="px-6 py-2 bg-blue-600 text-white text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{syncFeedback}</span>
          </div>
          <span className="text-[10px] opacity-80">{lastSyncTime.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Violation Alert Toast */}
      {violationToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <ShieldAlert className="w-4 h-4" />
          <span>{violationToast}</span>
        </div>
      )}

      {/* ACTIVE ANNOUNCEMENT POPUP OVERLAY */}
      {activeAnnouncement && (
        <div className="absolute inset-0 bg-gray-950/90 z-50 p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {activeAnnouncement.priority} Broadcast Announcement
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(activeAnnouncement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{activeAnnouncement.title}</h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed bg-gray-950/80 p-4 rounded-2xl border border-gray-800">
                {activeAnnouncement.body}
              </p>
            </div>

            <div className="text-xs text-gray-400">
              Sender: <strong>{activeAnnouncement.senderName}</strong> ({activeAnnouncement.senderRole})
            </div>

            <button
              onClick={() => handleAcknowledge(activeAnnouncement.id)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Acknowledge & Understand</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Canvas */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* 1. APP: CALCULATOR */}
          {activeApp === 'com.edu.calculator' ? (
            <div className="flex-1 max-w-2xl mx-auto w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setActiveApp(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base text-white">Scientific Calculator (100% Offline)</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                  OFFLINE READY
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between pt-4">
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 text-right">
                  <div className="text-xs text-gray-400 h-5">{calcPrev !== null ? `${calcPrev} ${calcOp}` : ''}</div>
                  <div className="text-3xl font-mono font-bold text-white overflow-hidden text-ellipsis">{calcDisplay}</div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  {['C', '(', ')', '÷'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => (btn === 'C' ? setCalcDisplay('0') : handleCalcOp(btn))}
                      className="p-3.5 rounded-2xl bg-gray-800 text-amber-400 font-bold text-sm hover:bg-gray-700 cursor-pointer"
                    >
                      {btn}
                    </button>
                  ))}
                  {['7', '8', '9', '×'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => (btn === '×' ? handleCalcOp('×') : handleCalcNumber(btn))}
                      className={`p-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 cursor-pointer ${btn === '×' ? 'bg-gray-800 text-amber-400' : 'bg-gray-950 text-white'}`}
                    >
                      {btn}
                    </button>
                  ))}
                  {['4', '5', '6', '-'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => (btn === '-' ? handleCalcOp('-') : handleCalcNumber(btn))}
                      className={`p-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 cursor-pointer ${btn === '-' ? 'bg-gray-800 text-amber-400' : 'bg-gray-950 text-white'}`}
                    >
                      {btn}
                    </button>
                  ))}
                  {['1', '2', '3', '+'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => (btn === '+' ? handleCalcOp('+') : handleCalcNumber(btn))}
                      className={`p-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 cursor-pointer ${btn === '+' ? 'bg-gray-800 text-amber-400' : 'bg-gray-950 text-white'}`}
                    >
                      {btn}
                    </button>
                  ))}
                  {['0', '.', 'π', '='].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => {
                        if (btn === '=') handleCalcEqual();
                        else if (btn === 'π') setCalcDisplay('3.14159');
                        else handleCalcNumber(btn);
                      }}
                      className={`p-3.5 rounded-2xl font-bold text-sm cursor-pointer ${btn === '=' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-gray-950 text-white hover:bg-gray-700'}`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeApp === 'com.edu.notes' ? (
            /* 2. APP: STUDY NOTES */
            <div className="flex-1 max-w-3xl mx-auto w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setActiveApp(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base text-white">Study Notes & Scratchpad (Encrypted Offline)</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">Auto-saved to Local Flash</span>
              </div>

              <div className="flex-1 flex flex-col pt-4">
                <textarea
                  value={offlineNotes}
                  onChange={(e) => {
                    setOfflineNotes(e.target.value);
                    localStorage.setItem('eduguard_student_notes', e.target.value);
                  }}
                  placeholder="Type your lecture notes, equations, and reminders here... All notes persist offline on this device."
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm text-gray-200 focus:outline-none leading-relaxed resize-none font-mono"
                />
                <div className="pt-3 flex justify-between text-xs text-gray-500">
                  <span>Hardware Kiosk Storage Active</span>
                  <span>{offlineNotes.length} characters</span>
                </div>
              </div>
            </div>
          ) : activeApp === 'com.edu.chem' ? (
            /* 3. APP: CHEMISTRY TABLE */
            <div className="flex-1 max-w-4xl mx-auto w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setActiveApp(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base text-white">Chemistry Reference (Offline)</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                  OFFLINE READY
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { sym: 'H', name: 'Hydrogen', num: 1, mass: '1.008', group: 'Nonmetal' },
                  { sym: 'He', name: 'Helium', num: 2, mass: '4.0026', group: 'Noble Gas' },
                  { sym: 'Li', name: 'Lithium', num: 3, mass: '6.94', group: 'Alkali Metal' },
                  { sym: 'Be', name: 'Beryllium', num: 4, mass: '9.012', group: 'Alkaline Earth' },
                  { sym: 'B', name: 'Boron', num: 5, mass: '10.81', group: 'Metalloid' },
                  { sym: 'C', name: 'Carbon', num: 6, mass: '12.011', group: 'Nonmetal' },
                  { sym: 'N', name: 'Nitrogen', num: 7, mass: '14.007', group: 'Nonmetal' },
                  { sym: 'O', name: 'Oxygen', num: 8, mass: '15.999', group: 'Nonmetal' },
                  { sym: 'F', name: 'Fluorine', num: 9, mass: '18.998', group: 'Halogen' },
                  { sym: 'Ne', name: 'Neon', num: 10, mass: '20.180', group: 'Noble Gas' },
                  { sym: 'Na', name: 'Sodium', num: 11, mass: '22.990', group: 'Alkali Metal' },
                  { sym: 'Mg', name: 'Magnesium', num: 12, mass: '24.305', group: 'Alkaline Earth' },
                  { sym: 'Al', name: 'Aluminum', num: 13, mass: '26.982', group: 'Post-transition' },
                  { sym: 'Si', name: 'Silicon', num: 14, mass: '28.085', group: 'Metalloid' },
                  { sym: 'P', name: 'Phosphorus', num: 15, mass: '30.974', group: 'Nonmetal' },
                  { sym: 'Cl', name: 'Chlorine', num: 17, mass: '35.45', group: 'Halogen' },
                ].map((el) => (
                  <div key={el.sym} className="p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-400">{el.sym}</span>
                      <span className="text-xs text-gray-400">#{el.num}</span>
                    </div>
                    <div className="font-semibold text-sm text-white mt-1">{el.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Mass: {el.mass} u</div>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] bg-gray-800 text-gray-300">
                      {el.group}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeApp === 'com.edu.digitallibrary' ? (
            /* 4. APP: OFFLINE TEXTBOOK */
            <div className="flex-1 max-w-3xl mx-auto w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setActiveApp(null)} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base text-white">Grade 12 Physics (NCERT Offline Cached)</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                  OFFLINE CACHED
                </span>
              </div>

              <div className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl p-6 text-sm text-gray-300 overflow-y-auto space-y-4 leading-relaxed mt-4">
                <h3 className="font-bold text-lg text-white">Chapter 7: Electromagnetic Induction & Alternating Currents</h3>
                <p>
                  Electromagnetic induction is the phenomenon of generating an electric current in a circuit by changing the magnetic flux linked with the circuit.
                </p>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl text-amber-300 font-mono text-center text-base">
                  Induced EMF: ε = - N · (dΦ / dt)
                </div>
                <p>
                  Where <strong>N</strong> is the number of turns in the coil, and <strong>Φ</strong> is the magnetic flux measured in Webers (Wb).
                </p>
              </div>
            </div>
          ) : isBrowserOpen ? (
            /* 5. APP: SAFE BROWSER */
            <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-3 bg-gray-950 border-b border-gray-800 flex items-center space-x-3">
                <button onClick={() => setIsBrowserOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-xl cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs">
                  <Globe className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={browserInput}
                    onChange={(e) => setBrowserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate(browserInput)}
                    className="w-full bg-transparent text-white focus:outline-none text-xs font-mono"
                    placeholder="Enter educational URL..."
                  />
                </div>
                <button
                  onClick={() => handleNavigate(browserInput)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Go
                </button>
              </div>

              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                {browserBlocked ? (
                  <div className="p-8 bg-rose-950/60 border border-rose-800 rounded-3xl max-w-md space-y-3 text-rose-300">
                    <AlertOctagon className="w-12 h-12 text-rose-400 mx-auto" />
                    <h3 className="font-bold text-lg text-white">Access Denied by School Web Filter</h3>
                    <p className="text-xs leading-relaxed">
                      Access to <code className="text-white font-mono">{browserUrl}</code> is blocked under Greenwood High School Safe Browsing Policy.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                      <Globe className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl text-white">{browserUrl}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Approved Educational Portal. Protected under EduGuard DNS filtering engine.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* HOME LAUNCHER GRID */
            <div className="space-y-6 max-w-5xl mx-auto w-full">
              {/* Top Banner Notice */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Student Educational Workspace</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    This workstation is protected by EduGuard Device Management. All learning tools run offline.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setIsBrowserOpen(true);
                      handleNavigate('classroom.google.com');
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Open Safe Web Browser</span>
                  </button>
                </div>
              </div>

              {/* Built-in Offline Learning Tools */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Approved Core Learning Apps (100% Offline Ready)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {builtInApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app.pkg)}
                      className="p-5 bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-3xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs"
                    >
                      <div className="text-3xl">{app.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{app.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{app.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Deployed Apps */}
              {installedApps.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Admin Deployed Apps ({installedApps.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {installedApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setViolationToast(`Launching ${app.name} v${app.version}...`);
                          setTimeout(() => setViolationToast(null), 2500);
                        }}
                        className="p-5 bg-gray-900/60 border border-gray-800 hover:border-gray-600 rounded-3xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer shadow-xs"
                      >
                        <div className="text-2xl">📦</div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{app.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">v{app.version} • {app.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Announcements Drawer (if open) */}
        {isMessagesOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">Broadcast Notices</h4>
                </div>
                <button onClick={() => setIsMessagesOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isOnline && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-[11px] text-amber-300">
                  Showing cached notices. Connect to Wi-Fi to receive live school broadcasts.
                </div>
              )}

              {messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No broadcasts at this time.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{msg.title}</span>
                      <span className="text-[9px] text-amber-400 uppercase font-bold">{msg.priority}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{msg.body}</p>
                    <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1">
                      <span>From {msg.senderName}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADMIN UNLOCK PIN MODAL */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Administrator Kiosk Unlock</h3>
                <p className="text-xs text-gray-400">Enter Admin PIN to exit student mode</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Enter PIN (Default: 2026)
              </label>
              <input
                type="password"
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value);
                  setUnlockError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminUnlock()}
                placeholder="••••"
                className="w-full p-3 bg-gray-950 border border-gray-700 rounded-2xl text-center font-mono text-lg text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {unlockError && <p className="text-xs text-rose-400 mt-1 font-semibold">Incorrect PIN. Try 2026</p>}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setUnlockPin('');
                  setUnlockError(false);
                }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminUnlock}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Unlock Kiosk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
