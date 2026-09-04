// EduGuard MDM — Interactive Student Android Tablet DPC Simulator
// Complete Offline Resilience + Automatic Full-Stack Online Sync (Policies, Apps, Web Filters, Announcements)

import React, { useState, useEffect } from 'react';
import {
  X,
  Tablet,
  Lock,
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
  Volume2,
  Clock,
  Send,
  ShieldCheck,
  RefreshCw,
  Download,
  Layers,
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Device, Application, DevicePolicy, AdminBroadcastMessage, Deployment, WebFilterRule } from '../types/mdm';
import { api } from '../lib/api';

interface StudentDeviceSimulatorProps {
  device: Device;
  policy: DevicePolicy;
  applications: Application[];
  deployments?: Deployment[];
  webRules?: WebFilterRule[];
  onClose: () => void;
  onViolationTriggered: () => void;
  onStatusUpdated: () => void;
}

export const StudentDeviceSimulator: React.FC<StudentDeviceSimulatorProps> = ({
  device,
  policy: initialPolicy,
  applications: initialApps,
  onClose,
  onViolationTriggered,
  onStatusUpdated,
}) => {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState('classroom.google.com');
  const [browserInput, setBrowserInput] = useState('classroom.google.com');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserBlocked, setBrowserBlocked] = useState(false);
  const [violationToast, setViolationToast] = useState<string | null>(null);

  // Simulated hardware controls
  const [batteryLevel, setBatteryLevel] = useState(device.batteryLevel);
  const [isCharging, setIsCharging] = useState(device.isCharging);
  const [isWifiConnected, setIsWifiConnected] = useState(true);

  // Synced MDM State (Updated dynamically from Admin Console when Online)
  const [currentPolicy, setCurrentPolicy] = useState<DevicePolicy>(initialPolicy);
  const [installedApps, setInstalledApps] = useState<Application[]>(initialApps);
  const [messages, setMessages] = useState<AdminBroadcastMessage[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<AdminBroadcastMessage | null>(null);
  const [isMessagesInboxOpen, setIsMessagesInboxOpen] = useState(false);
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);

  // Auto-Sync Animation States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Offline Tool States
  // 1. Calculator
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  // 2. Offline Notes
  const [offlineNotes, setOfflineNotes] = useState<string>(() => {
    return localStorage.getItem('eduguard_student_notes') || 'Physics Chapter 4: Newton’s Laws of Motion\n- F = m * a\n- Conservation of Momentum\n- Static vs Kinetic friction coefficients';
  });

  // Dynamic Full Auto-Sync Sequence
  const runFullDeviceSync = async (showBanner = true) => {
    if (!isWifiConnected) return;

    try {
      setIsSyncing(true);

      // 1. Parallel fetch from Admin Console backend: Policies, Apps, Deployments, Messages, Web Filter
      const [policiesData, appsData, messagesData] = await Promise.all([
        api.getPolicies(),
        api.getApplications(),
        api.getDeviceMessages(device.id),
      ]);

      // Apply Policy Updates
      const matchedPolicy = policiesData.find((p) => p.id === device.policyId) || policiesData[0];
      if (matchedPolicy) {
        setCurrentPolicy(matchedPolicy);
      }

      // Apply Application Catalog & Deployment Updates
      if (Array.isArray(appsData) && appsData.length > 0) {
        // Filter apps approved for students
        const approved = appsData.filter((a) => a.isApproved && a.category !== 'RESTRICTED');
        setInstalledApps(approved.length > 0 ? approved : appsData);
      }

      // Apply Admin Announcements & Check for unacknowledged notices
      if (Array.isArray(messagesData)) {
        setMessages(messagesData);
        const unacked = messagesData.find(
          (m) => m.requireAcknowledgment && !m.acknowledgedDeviceIds?.includes(device.deviceId)
        );
        if (unacked && !activeAnnouncement) {
          setActiveAnnouncement(unacked);
        }
      }

      // Push Heartbeat & Telemetry back to Admin Console
      await api.simulatorHeartbeat({
        deviceId: device.id,
        batteryLevel,
        isCharging,
        currentActiveApp: activeApp || 'com.eduguard.mdm.launcher',
      });

      setLastSyncTime(new Date());
      onStatusUpdated();

      if (showBanner) {
        setSyncFeedback(`Auto-Sync Complete: Policy v${matchedPolicy?.version || currentPolicy.version} • ${appsData.length} Apps • ${messagesData.length} Notices`);
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    } catch (e) {
      console.error('Device sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger sync on mount if online
  useEffect(() => {
    if (isWifiConnected) {
      runFullDeviceSync(false);
    }
  }, [isWifiConnected, device.id]);

  const handleToggleWifi = (enabled: boolean) => {
    setIsWifiConnected(enabled);
    if (enabled) {
      // Reconnected to Wi-Fi: Run instant auto-sync
      runFullDeviceSync(true);
    }
  };

  const handleLaunchApp = (pkg: string, appName: string, isAllowed: boolean, reason?: string) => {
    if (device.isLocked) return;

    // Check against current live policy rules
    if (pkg === 'com.android.camera' && !currentPolicy.cameraEnabled) {
      isAllowed = false;
      reason = 'Camera hardware disabled by school policy';
    }

    if (!isAllowed) {
      // Local DPC hardware interceptor blocks the app immediately (Works 100% Offline & Online!)
      const msg = reason ? `Access Denied: ${reason}` : `Access Denied: "${appName}" is blocked by school DPC policy!`;
      setViolationToast(msg);

      if (isWifiConnected) {
        api.simulatorViolation({
          deviceId: device.id,
          studentName: device.assignedStudentName,
          type: pkg === 'com.android.dialer' ? 'CALL_RESTRICTION_VIOLATION' : 'UNAUTHORIZED_APP',
          severity: 'HIGH',
          description: reason || `Student attempted to launch restricted application "${appName}" (${pkg}).`,
        }).then(() => {
          onViolationTriggered();
        });
      }

      setTimeout(() => setViolationToast(null), 4500);
      return;
    }

    setActiveApp(pkg);
    setIsBrowserOpen(false);
    setIsMessagesInboxOpen(false);
    setIsPolicyInfoOpen(false);

    if (isWifiConnected) {
      api.simulatorHeartbeat({
        deviceId: device.id,
        batteryLevel,
        isCharging,
        currentActiveApp: pkg,
      }).then(() => onStatusUpdated());
    }
  };

  const handleLaunchBrowser = () => {
    setIsBrowserOpen(true);
    setActiveApp(null);
    setIsMessagesInboxOpen(false);
    setIsPolicyInfoOpen(false);
    handleNavigate('classroom.google.com');
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

      if (isWifiConnected) {
        api.simulatorViolation({
          deviceId: device.id,
          studentName: device.assignedStudentName,
          type: 'WEB_FILTER_BLOCKED',
          severity: 'HIGH',
          description: `Student attempted to access blacklisted web domain "${url}". Local DNS filter intercepted.`,
        }).then(() => onViolationTriggered());
      }
    } else {
      setBrowserBlocked(false);
      setBrowserUrl(clean);
    }
  };

  const handleAcknowledgeMessage = async (msgId: string) => {
    if (isWifiConnected) {
      try {
        await api.acknowledgeMessage(msgId, device.deviceId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, acknowledgedDeviceIds: [...(m.acknowledgedDeviceIds || []), device.deviceId] } : m
          )
        );
        onStatusUpdated();
      } catch (e) {
        // Ignore
      }
    }
    setActiveAnnouncement(null);
  };

  // Calculator helpers
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

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
  };

  // Default Built-in Offline Apps
  const builtInOfflineApps = [
    { name: 'Scientific Calculator', pkg: 'com.edu.calculator', icon: '🧮', description: 'Trig & Algebra Engine' },
    { name: 'Study Notes', pkg: 'com.edu.notes', icon: '📝', description: 'Offline Class Scratchpad' },
    { name: 'Chemistry Table', pkg: 'com.edu.chem', icon: '⚗️', description: 'Elements & Formulas' },
    { name: 'Grade 12 Physics', pkg: 'com.edu.digitallibrary', icon: '📚', description: 'NCERT Textbook (Cached)' },
  ];

  const restrictedApps = [
    { name: 'Phone Dialer', pkg: 'com.android.dialer', icon: '📞', reason: 'Blocked by DISALLOW_OUTGOING_CALLS policy' },
    { name: 'SMS Messaging', pkg: 'com.android.mms', icon: '💬', reason: 'Blocked by DISALLOW_SMS policy' },
    { name: 'Instagram', pkg: 'com.instagram.android', icon: '📸', reason: 'Blocked by School Social Media Filter' },
    { name: 'Camera', pkg: 'com.android.camera', icon: '📷', reason: currentPolicy.cameraEnabled ? undefined : 'Camera hardware disabled by Policy Engine' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white border-l border-gray-100 shadow-2xl flex flex-col select-none">
      {/* Simulator Header */}
      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between text-gray-950 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-900">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-gray-950">Student Android DPC Sandbox</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                Policy v{currentPolicy.version}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              {device.name} ({device.deviceId}) • {device.className || 'Class XII-A'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-950 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Simulator Hardware Control Toolbar (Wi-Fi, Battery, Simulator Triggers) */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs text-gray-700 shrink-0">
        {/* Wi-Fi Online / Offline Switch */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleToggleWifi(!isWifiConnected)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all flex items-center space-x-1.5 ${
              isWifiConnected
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title="Toggle Wi-Fi connection to test offline mode and live reconnect sync"
          >
            {isWifiConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isWifiConnected ? 'Wi-Fi: Connected (Auto-Sync)' : 'Wi-Fi: Offline Mode'}</span>
          </button>

          {isWifiConnected && (
            <button
              onClick={() => runFullDeviceSync(true)}
              disabled={isSyncing}
              className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
              title="Manual Sync with Admin Console"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Battery & Charging */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Battery:</span>
          <input
            type="range"
            min="5"
            max="100"
            value={batteryLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBatteryLevel(val);
              if (isWifiConnected) {
                api.simulatorHeartbeat({
                  deviceId: device.id,
                  batteryLevel: val,
                  isCharging,
                  currentActiveApp: activeApp || 'com.eduguard.mdm.launcher',
                }).then(() => onStatusUpdated());
              }
            }}
            className="w-16 accent-gray-900"
          />
          <span className="font-bold text-xs text-gray-900">{batteryLevel}%</span>
        </div>

        {/* Charging button */}
        <button
          onClick={() => {
            const next = !isCharging;
            setIsCharging(next);
            if (isWifiConnected) {
              api.simulatorHeartbeat({
                deviceId: device.id,
                batteryLevel,
                isCharging: next,
                currentActiveApp: activeApp || 'com.eduguard.mdm.launcher',
              }).then(() => onStatusUpdated());
            }
          }}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
            isCharging ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          {isCharging ? '⚡ Charging' : 'Plug In'}
        </button>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div className="px-4 py-2 bg-blue-600 text-white text-[11px] font-medium flex items-center justify-between animate-in slide-in-from-top duration-150">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{syncFeedback}</span>
          </div>
          <span className="text-[10px] opacity-80">{lastSyncTime.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Simulator Device Frame */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-full max-w-sm h-[570px] bg-gray-950 rounded-[36px] p-3.5 border-4 border-gray-900 shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-gray-800">
          {/* Top Notch Camera */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full z-30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-800" />
          </div>

          {/* Android Status Bar */}
          <div className="h-7 w-full flex items-center justify-between px-4 text-[10px] font-semibold text-gray-200 z-20 shrink-0">
            <span>10:30 AM</span>
            <div className="flex items-center space-x-2">
              {isWifiConnected ? (
                <div className="flex items-center space-x-1 text-emerald-400">
                  <Wifi className="w-3 h-3" />
                  <span className="text-[9px]">Online (Synced)</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-rose-400 font-bold">
                  <WifiOff className="w-3 h-3" />
                  <span className="text-[9px]">Offline (Locked)</span>
                </div>
              )}
              <div className="flex items-center space-x-0.5">
                {isCharging ? <BatteryCharging className="w-3 h-3 text-emerald-400" /> : <Battery className="w-3 h-3" />}
                <span>{batteryLevel}%</span>
              </div>
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 rounded-[24px] bg-gray-900 text-white overflow-hidden relative flex flex-col">
            {/* HARDWARE LOCK SCREEN OVERLAY IF ADMIN LOCKED */}
            {device.isLocked && (
              <div className="absolute inset-0 bg-gray-950/95 z-40 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                    DEVICE OWNER SECURITY LOCK
                  </span>
                  <h4 className="font-semibold text-lg text-white mt-1">Tablet Locked by School</h4>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                    {device.lockReason || 'This tablet is managed by Greenwood High School. Contact your teacher or IT admin.'}
                  </p>
                </div>
              </div>
            )}

            {/* REAL-TIME ADMIN ANNOUNCEMENT POPUP OVERLAY */}
            {activeAnnouncement && !device.isLocked && (
              <div className="absolute inset-0 bg-gray-950/90 z-50 p-5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {activeAnnouncement.priority} Notice
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(activeAnnouncement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{activeAnnouncement.title}</h4>
                    <p className="text-[11px] text-gray-300 mt-1 leading-relaxed bg-gray-950/60 p-2.5 rounded-xl border border-gray-800">
                      {activeAnnouncement.body}
                    </p>
                  </div>

                  <div className="text-[10px] text-gray-400">
                    From: <strong>{activeAnnouncement.senderName}</strong> ({activeAnnouncement.senderRole})
                  </div>

                  <button
                    onClick={() => handleAcknowledgeMessage(activeAnnouncement.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>I Acknowledge & Understand</span>
                  </button>
                </div>
              </div>
            )}

            {/* Violation Toast alert inside tablet */}
            {violationToast && (
              <div className="absolute top-2 left-2 right-2 bg-rose-600 text-white p-2.5 rounded-xl text-xs font-semibold shadow-lg z-50 flex items-center space-x-2 animate-bounce">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-[11px] leading-tight">{violationToast}</span>
              </div>
            )}

            {/* 1. APP VIEW: CALCULATOR */}
            {activeApp === 'com.edu.calculator' ? (
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveApp(null)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Scientific Calculator (Offline)</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    OFFLINE
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-right">
                    <div className="text-[10px] text-gray-400 h-4">{calcPrev !== null ? `${calcPrev} ${calcOp}` : ''}</div>
                    <div className="text-2xl font-mono font-bold text-white overflow-hidden text-ellipsis">{calcDisplay}</div>
                  </div>

                  {/* Calculator Pad */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {['C', '(', ')', '÷'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => (btn === 'C' ? handleCalcClear() : handleCalcOp(btn))}
                        className="p-2.5 rounded-xl bg-gray-800 text-amber-400 font-bold text-xs hover:bg-gray-700 cursor-pointer"
                      >
                        {btn}
                      </button>
                    ))}
                    {['7', '8', '9', '×'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => (btn === '×' ? handleCalcOp('×') : handleCalcNumber(btn))}
                        className={`p-2.5 rounded-xl font-bold text-xs hover:bg-gray-700 cursor-pointer ${btn === '×' ? 'bg-gray-800 text-amber-400' : 'bg-gray-900 text-white'}`}
                      >
                        {btn}
                      </button>
                    ))}
                    {['4', '5', '6', '-'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => (btn === '-' ? handleCalcOp('-') : handleCalcNumber(btn))}
                        className={`p-2.5 rounded-xl font-bold text-xs hover:bg-gray-700 cursor-pointer ${btn === '-' ? 'bg-gray-800 text-amber-400' : 'bg-gray-900 text-white'}`}
                      >
                        {btn}
                      </button>
                    ))}
                    {['1', '2', '3', '+'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => (btn === '+' ? handleCalcOp('+') : handleCalcNumber(btn))}
                        className={`p-2.5 rounded-xl font-bold text-xs hover:bg-gray-700 cursor-pointer ${btn === '+' ? 'bg-gray-800 text-amber-400' : 'bg-gray-900 text-white'}`}
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
                        className={`p-2.5 rounded-xl font-bold text-xs cursor-pointer ${btn === '=' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeApp === 'com.edu.notes' ? (
              /* 2. APP VIEW: OFFLINE STUDY NOTES */
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveApp(null)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Study Scratchpad (Offline)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400">Encrypted Local Flash</span>
                </div>

                <div className="flex-1 flex flex-col pt-2">
                  <textarea
                    value={offlineNotes}
                    onChange={(e) => {
                      setOfflineNotes(e.target.value);
                      localStorage.setItem('eduguard_student_notes', e.target.value);
                    }}
                    placeholder="Type lecture notes here... All changes are saved offline on this tablet."
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none leading-relaxed resize-none"
                  />
                  <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Hardware Kiosk Storage</span>
                    <span>{offlineNotes.length} chars</span>
                  </div>
                </div>
              </div>
            ) : activeApp === 'com.edu.chem' ? (
              /* 3. APP VIEW: CHEMISTRY PERIODIC TABLE */
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveApp(null)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Chemistry Reference (Offline)</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    OFFLINE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { sym: 'H', name: 'Hydrogen', num: 1, mass: '1.008' },
                      { sym: 'He', name: 'Helium', num: 2, mass: '4.0026' },
                      { sym: 'Li', name: 'Lithium', num: 3, mass: '6.94' },
                      { sym: 'C', name: 'Carbon', num: 6, mass: '12.011' },
                      { sym: 'N', name: 'Nitrogen', num: 7, mass: '14.007' },
                      { sym: 'O', name: 'Oxygen', num: 8, mass: '15.999' },
                      { sym: 'Na', name: 'Sodium', num: 11, mass: '22.990' },
                      { sym: 'Cl', name: 'Chlorine', num: 17, mass: '35.45' },
                    ].map((el) => (
                      <div key={el.sym} className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-amber-400">{el.sym}</span>
                          <span className="text-[10px] text-gray-400">#{el.num}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-white mt-1">{el.name}</div>
                        <div className="text-[10px] text-gray-400">Mass: {el.mass} u</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeApp === 'com.edu.digitallibrary' ? (
              /* 4. APP VIEW: OFFLINE TEXTBOOK */
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveApp(null)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Grade 12 Physics (Offline)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400">Cached</span>
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 overflow-y-auto space-y-2.5 leading-relaxed">
                  <h4 className="font-bold text-white text-sm">Chapter 7: Electromagnetic Induction</h4>
                  <p>Faraday’s law of induction states that the electromotive force (EMF) induced in a closed loop is directly proportional to the rate of change of magnetic flux through the loop.</p>
                  <div className="p-2 bg-gray-950 border border-gray-800 rounded-lg text-amber-300 font-mono text-center">
                    ε = - dΦ_B / dt
                  </div>
                  <p>Lenz’s law indicates that the direction of the induced current opposes the change in flux that produces it.</p>
                </div>
              </div>
            ) : isBrowserOpen ? (
              /* SAFE MANAGED BROWSER VIEW */
              <div className="flex-1 flex flex-col bg-gray-950">
                <div className="p-2.5 bg-gray-900 border-b border-gray-800 flex items-center space-x-2">
                  <button onClick={() => setIsBrowserOpen(false)} className="p-1 text-gray-400 hover:text-white rounded">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 flex items-center bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-1 text-xs">
                    <Globe className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={browserInput}
                      onChange={(e) => setBrowserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNavigate(browserInput)}
                      className="w-full bg-transparent text-white focus:outline-none text-xs font-mono"
                      placeholder="Enter school URL..."
                    />
                  </div>
                  <button
                    onClick={() => handleNavigate(browserInput)}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Go
                  </button>
                </div>

                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                  {browserBlocked ? (
                    <div className="p-5 bg-rose-950/60 border border-rose-800 rounded-2xl max-w-xs space-y-2 text-rose-300">
                      <AlertOctagon className="w-8 h-8 text-rose-400 mx-auto" />
                      <h4 className="font-bold text-white text-xs">Website Blocked by Policy</h4>
                      <p className="text-[11px] leading-relaxed">
                        Access to <code className="text-white font-mono">{browserUrl}</code> has been restricted by Greenwood High School Safe Browsing filter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-xs">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                        <Globe className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-white">{browserUrl}</h4>
                      <p className="text-xs text-gray-400">
                        School Approved Educational Resource. Protected under EduGuard DNS sinkhole.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : isMessagesInboxOpen ? (
              /* MESSAGES INBOX VIEW */
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setIsMessagesInboxOpen(false)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Admin Announcements</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{messages.length} notices</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pt-2">
                  {!isWifiConnected && (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[10.5px] text-amber-300 text-center">
                      Wi-Fi is offline. Showing locally cached announcements. Connect to Wi-Fi to receive live broadcasts.
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500">No broadcasts from school administration.</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{msg.title}</span>
                          <span className="text-[9px] text-amber-400 uppercase font-bold">{msg.priority}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-tight">{msg.body}</p>
                        <div className="text-[9px] text-gray-500 flex items-center justify-between">
                          <span>From {msg.senderName}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : isPolicyInfoOpen ? (
              /* POLICY DETAILS VIEW */
              <div className="flex-1 flex flex-col bg-gray-950 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setIsPolicyInfoOpen(false)} className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-xs text-white">Live Policy Profile</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">v{currentPolicy.version}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 text-xs text-gray-300">
                  <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5">
                    <div className="font-bold text-white text-xs">{currentPolicy.name}</div>
                    <p className="text-[11px] text-gray-400">{currentPolicy.description}</p>
                  </div>

                  <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Hardware Enforcements</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center justify-between p-1.5 bg-gray-950 rounded-lg">
                        <span>Camera:</span>
                        <span className={currentPolicy.cameraEnabled ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          {currentPolicy.cameraEnabled ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-gray-950 rounded-lg">
                        <span>USB Transfer:</span>
                        <span className={currentPolicy.usbDataTransferAllowed ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          {currentPolicy.usbDataTransferAllowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-gray-950 rounded-lg">
                        <span>Screen Capture:</span>
                        <span className={currentPolicy.screenCaptureAllowed ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          {currentPolicy.screenCaptureAllowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-gray-950 rounded-lg">
                        <span>Factory Reset:</span>
                        <span className="text-rose-400 font-bold">Blocked (DPC)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* KIOSK LAUNCHER HOME SCREEN */
              <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  {/* Top Bar inside Launcher */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">Student Workspace</h4>
                      <p className="text-[10px] text-gray-400">
                        {device.assignedStudentName || 'Student'} • {device.className || 'Class XII-A'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Policy Info Button */}
                      <button
                        onClick={() => setIsPolicyInfoOpen(true)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 cursor-pointer"
                        title="View Active Policy Restrictions"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      {/* Messages Bell Button */}
                      <button
                        onClick={() => setIsMessagesInboxOpen(true)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 relative cursor-pointer"
                        title="View School Announcements"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {messages.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Offline / Online Indicator Banner */}
                  {!isWifiConnected ? (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-[10px] text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Offline Mode: Hardware Kiosk Locked • Local Apps Ready</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[10px] text-emerald-300">
                      <div className="flex items-center space-x-1.5">
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Online • Auto-Synced (Policy v{currentPolicy.version})</span>
                      </div>
                      <button
                        onClick={() => runFullDeviceSync(true)}
                        className="text-[9.5px] underline hover:text-white cursor-pointer"
                      >
                        Sync Now
                      </button>
                    </div>
                  )}

                  {/* Safe Browser Quick Tile */}
                  <button
                    onClick={handleLaunchBrowser}
                    className="w-full p-2.5 bg-blue-950/40 border border-blue-800/60 hover:border-blue-500 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">Safe School Web Browser</div>
                        <div className="text-[10px] text-blue-300">Classroom, Wikipedia & Educational Portals</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </button>

                  {/* Approved Educational Apps Grid */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                      Approved Learning Apps (Offline Ready)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {builtInOfflineApps.map((app) => (
                        <button
                          key={app.pkg}
                          onClick={() => handleLaunchApp(app.pkg, app.name, true)}
                          className="p-2.5 rounded-2xl bg-gray-800/80 border border-gray-700/60 hover:border-gray-500 flex flex-col items-center text-center space-y-1 transition-all cursor-pointer"
                        >
                          <span className="text-xl">{app.icon}</span>
                          <span className="font-semibold text-[10.5px] text-gray-200 leading-tight">{app.name}</span>
                          <span className="text-[9px] text-gray-400">{app.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Managed Remote Apps (Auto-synced from App Management) */}
                  {installedApps.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1.5 flex items-center space-x-1">
                        <Layers className="w-3 h-3" />
                        <span>Admin Deployed Apps ({installedApps.length})</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {installedApps.slice(0, 4).map((app) => (
                          <button
                            key={app.packageName}
                            onClick={() => handleLaunchApp(app.packageName, app.name, true)}
                            className="p-2 rounded-2xl bg-blue-950/20 border border-blue-900/50 hover:border-blue-400 flex items-center space-x-2 text-left transition-all cursor-pointer"
                          >
                            <span className="text-base">📦</span>
                            <div className="overflow-hidden">
                              <div className="font-semibold text-[10px] text-white truncate">{app.name}</div>
                              <div className="text-[8.5px] text-blue-300">v{app.version}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restricted Apps Grid (Test local policy enforcement) */}
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1.5">
                      Restricted Apps (Test Security Lockdown)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {restrictedApps.map((app) => (
                        <button
                          key={app.pkg}
                          onClick={() => handleLaunchApp(app.pkg, app.name, false, app.reason)}
                          className="p-2 rounded-2xl bg-gray-800/40 border border-rose-900/40 hover:border-rose-500 flex flex-col items-center text-center space-y-0.5 transition-all group cursor-pointer"
                        >
                          <span className="text-lg opacity-70 group-hover:opacity-100">{app.icon}</span>
                          <span className="font-semibold text-[10px] text-rose-300">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Android Home Navigation Pill */}
                <div className="pt-3 flex justify-center">
                  <div className="w-24 h-1 bg-gray-700 rounded-full cursor-pointer hover:bg-gray-500 transition-colors" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
