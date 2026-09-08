// EduGuard MDM — Cross-Platform Fullscreen Student Workspace (Android & Windows 10/11)
// 100% Offline Operational + Auto-Sync with Server When Online + Keyboard & DevTools Lockdown + Alt+F4 Protection
// Includes Class-wise Subject PDF Notes Reader & Live In-App Study Hub

import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Download,
  Eye,
  FileCode,
  GraduationCap,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  FileCheck,
  Monitor,
  Cpu,
  Smartphone,
  Info,
  Key,
  ShieldCheck,
  Terminal,
  Volume2,
  LogOut,
} from 'lucide-react';
import { Device, Application, DevicePolicy, AdminBroadcastMessage, Deployment, WebFilterRule, StudyMaterial, School, SchoolClass } from '../types/mdm';
import { api, subscribeToMdmEvents } from '../lib/api';

interface StudentWorkspacePortalProps {
  device?: Device;
  policy?: DevicePolicy;
  applications?: Application[];
  studyMaterials?: StudyMaterial[];
  onExit?: () => void;
}

// Audio tone chime generator for urgent school broadcasts
const playBroadcastChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.28); // D6
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    // Audio context may be restricted by browser policy
  }
};

// Automatic local machine & hardware diagnostics detector
const detectLocalMachineSpecs = () => {
  const ua = navigator.userAgent;
  let platform: 'WINDOWS_PC' | 'ANDROID_TABLET' | 'IPAD' | 'LINUX_PC' | 'MACOS' | 'MOBILE' = 'WINDOWS_PC';
  let osName = 'Windows 11 / 10 (x64)';
  let modelName = 'PC / Desktop Workstation';

  if (/iPad|Macintosh/i.test(ua) && 'ontouchend' in document) {
    platform = 'IPAD';
    osName = 'iPadOS 18';
    modelName = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua) || window.innerWidth < 640) {
      platform = 'MOBILE';
      osName = 'Android 15';
      modelName = 'Android Mobile';
    } else {
      platform = 'ANDROID_TABLET';
      osName = 'Android 15 (EduTab)';
      modelName = 'EduGuard Tablet';
    }
  } else if (/iPhone|iPod/i.test(ua)) {
    platform = 'MOBILE';
    osName = 'iOS 18';
    modelName = 'Apple iPhone';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    platform = 'MACOS';
    osName = 'macOS';
    modelName = 'Mac Workstation';
  } else if (/Linux/i.test(ua)) {
    platform = 'LINUX_PC';
    osName = 'Linux';
    modelName = 'Linux Station';
  } else if (/Windows/i.test(ua)) {
    platform = 'WINDOWS_PC';
    osName = 'Windows 11/10 Pro';
    modelName = 'Windows Kiosk PC';
  }

  return {
    platform,
    osName,
    modelName,
    screenRes: typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : '1920 × 1080',
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    ramGb: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 8 : 8,
  };
};

export const StudentWorkspacePortal: React.FC<StudentWorkspacePortalProps> = ({
  device: propDevice,
  policy: propPolicy,
  applications: propApps,
  studyMaterials: propMaterials,
  onExit,
}) => {
  // Check if locally enrolled in browser storage
  const [localEnrolledDevice, setLocalEnrolledDevice] = useState<Device | null>(() => {
    try {
      const saved = localStorage.getItem('eduguard_enrolled_device');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const specs = detectLocalMachineSpecs();

  // Active Device state (prop > URL device_id > local storage > generated station)
  const [currentDevice, setCurrentDevice] = useState<Device>(() => {
    // 1. Check URL parameters for explicit machine identifier
    let urlDeviceId: string | null = null;
    let urlDeviceName: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      urlDeviceId = params.get('device_id');
      urlDeviceName = params.get('device_name');
    }

    let stationId = urlDeviceId;
    if (!stationId && typeof window !== 'undefined') {
      stationId = localStorage.getItem('eduguard_workstation_id');
    }
    if (!stationId) {
      stationId = `WIN-${Math.floor(1000 + Math.random() * 9000)}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('eduguard_workstation_id', stationId);
      }
    }

    if (urlDeviceId) {
      return {
        id: `dev-${urlDeviceId.toLowerCase()}`,
        deviceId: urlDeviceId,
        name: urlDeviceName ? `Workstation (${urlDeviceName})` : `Windows Station (${urlDeviceId})`,
        schoolId: 'sch-demo-01',
        schoolName: 'Demo Examination Center',
        classId: 'cls-12-a',
        className: 'Class XII-A',
        assignedStudentName: urlDeviceName ? `Workstation User (${urlDeviceName})` : `Station User (${urlDeviceId})`,
        assignedStudentRoll: `PC-${urlDeviceId.replace(/^WIN-/, '').slice(-4) || '01'}`,
        model: specs.modelName || 'Windows 11 PC (x64)',
        manufacturer: 'EduGuard Windows Client',
        platform: 'WINDOWS_PC',
        osVersion: specs.osName || 'Windows 11 (23H2/24H2)',
        securityPatchLevel: '2026-08-01',
        status: 'LOCKED',
        isLocked: true, // Kiosk starts locked by policy
        kioskModeEnabled: true,
        policyId: 'pol-exam-lockdown',
        lastSyncTimestamp: new Date().toISOString(),
        lastHeartbeatTimestamp: new Date().toISOString(),
        batteryLevel: 100,
        isCharging: true,
        storageUsedGb: 34.2,
        storageTotalGb: 256,
        ramUsedMb: 3200,
        ramTotalMb: specs.ramGb * 1024,
        currentActiveApp: 'com.eduguard.workspace',
        ipAddress: '127.0.0.1',
        macAddress: '74:D4:35:E1:99:A2',
        isTampered: false,
        enrollmentType: 'ZERO_TOUCH_QR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (propDevice && propDevice.deviceId && propDevice.deviceId !== 'dev-tab-1024' && propDevice.deviceId !== 'TAB-1024') {
      return { ...propDevice, isLocked: true };
    }
    if (localEnrolledDevice) {
      return { ...localEnrolledDevice, deviceId: stationId, isLocked: true };
    }

    return {
      id: `dev-${stationId.toLowerCase()}`,
      deviceId: stationId,
      name: urlDeviceName ? `Workstation (${urlDeviceName})` : `Windows Station (${stationId})`,
      schoolId: 'sch-demo-01',
      schoolName: 'Demo Examination Center',
      classId: 'cls-12-a',
      className: 'Class XII-A',
      assignedStudentName: `Student Station (${stationId})`,
      assignedStudentRoll: `PC-${stationId.slice(-4)}`,
      model: specs.modelName || 'Windows 11 PC (x64)',
      manufacturer: 'EduGuard Windows Client',
      platform: 'WINDOWS_PC',
      osVersion: specs.osName || 'Windows 11 (23H2/24H2)',
      securityPatchLevel: '2026-08-01',
      status: 'ONLINE',
      isLocked: true, // Kiosk starts locked by policy
      kioskModeEnabled: true,
      policyId: 'pol-exam-lockdown',
      lastSyncTimestamp: new Date().toISOString(),
      lastHeartbeatTimestamp: new Date().toISOString(),
      batteryLevel: 100,
      isCharging: true,
      storageUsedGb: 34.2,
      storageTotalGb: 256,
      ramUsedMb: 3200,
      ramTotalMb: specs.ramGb * 1024,
      currentActiveApp: 'com.eduguard.workspace',
      ipAddress: '192.168.1.108',
      macAddress: '74:D4:35:E1:99:A2',
      isTampered: false,
      enrollmentType: 'ZERO_TOUCH_QR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Remote Admin Unlock & Master Administrative Lockdown States
  const [isRemotelyUnlocked, setIsRemotelyUnlocked] = useState(false);
  const [remoteUnlockReason, setRemoteUnlockReason] = useState<string>('');
  const [isScreenLockedByAdmin, setIsScreenLockedByAdmin] = useState(false);
  const [adminLockReason, setAdminLockReason] = useState<string>('');

  const currentDeviceRef = useRef(currentDevice);
  useEffect(() => {
    currentDeviceRef.current = currentDevice;
  }, [currentDevice]);

  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

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

  // Enrollment Modal & Form State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [enrollForm, setEnrollForm] = useState({
    schoolId: 'sch-greenwood-01',
    classId: 'cls-12-a',
    studentName: 'Rahul Sharma',
    studentRoll: '12-A-04',
    studentEmail: 'rahul.s@school.edu',
    deviceName: `PC-LAB-${Math.floor(100 + Math.random() * 900)}`,
    platform: specs.platform,
  });
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);

  // Task Manager & OS Lockdown Information Modal
  const [isTaskManagerGuideOpen, setIsTaskManagerGuideOpen] = useState(false);
  const [copiedTaskMgrCmd, setCopiedTaskMgrCmd] = useState(false);

  // Study Materials State (Class-wise & Subject-wise PDF Notes)
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(propMaterials || []);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [studySearchQuery, setStudySearchQuery] = useState('');
  const [readingMaterial, setReadingMaterial] = useState<StudyMaterial | null>(null);
  const [pdfZoomLevel, setPdfZoomLevel] = useState<number>(100);

  // Tab switch & Window Blur Lockdown State
  const [isTabSwitchViolationActive, setIsTabSwitchViolationActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Student Exit & Admin Approval Workflow State
  const [isExitRequestModalOpen, setIsExitRequestModalOpen] = useState(false);
  const [studentExitPassword, setStudentExitPassword] = useState('');
  const [studentExitReason, setStudentExitReason] = useState('Exam completed & submitted');
  const [exitRequestStatus, setExitRequestStatus] = useState<'IDLE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('IDLE');
  const [exitRequestError, setExitRequestError] = useState<string | null>(null);
  const [exitRequestId, setExitRequestId] = useState<string | null>(null);
  const exitRequestIdRef = useRef<string | null>(null);
  exitRequestIdRef.current = exitRequestId;
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);
  const [showTeacherOverridePin, setShowTeacherOverridePin] = useState(false);
  const [teacherOverridePin, setTeacherOverridePin] = useState('');
  const [teacherOverrideError, setTeacherOverrideError] = useState(false);

  // Admin PIN Unlock Dialog (Legacy / Quick Fallback)
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenTransitioningRef = useRef(false);

  // Sound generator for security alerts
  const triggerAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Offline Tool States: Calculator
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnNext, setCalcResetOnNext] = useState(false);

  // Offline Tool States: Personal Scratchpad Notes
  const [offlineNotes, setOfflineNotes] = useState<string>(() => {
    return (
      localStorage.getItem('eduguard_student_notes') ||
      'Math Class Notes:\n- Calculus: Integral calculus fundamentals\n- Physics: Electromagnetic waves & Maxwell equations\n- Chemistry: Periodic trends and ionization potential'
    );
  });

  // Load available schools & classes for enrollment modal
  useEffect(() => {
    api.getSchools().then(setAvailableSchools).catch(() => {});
    api.getClasses().then(setAvailableClasses).catch(() => {});
  }, []);

  // Save notes locally
  const handleSaveNotes = (text: string) => {
    setOfflineNotes(text);
    localStorage.setItem('eduguard_student_notes', text);
  };

  // Engage Chromium / Edge Fullscreen Keyboard Lock API (Locks Tab, Alt+Tab, Escape, Meta at browser engine level)
  const engageKeyboardLock = async () => {
    try {
      if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
        await (navigator as any).keyboard.lock([
          'Tab',
          'Escape',
          'AltLeft',
          'AltRight',
          'MetaLeft',
          'MetaRight',
          'KeyW',
          'KeyQ',
          'KeyN',
          'KeyT',
          'F1',
          'F2',
          'F3',
          'F4',
          'F5',
          'F6',
          'F7',
          'F8',
          'F9',
          'F10',
          'F11',
          'F12',
          'ContextMenu',
        ]);
      }
    } catch {
      try {
        if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
          await (navigator as any).keyboard.lock();
        }
      } catch {}
    }
  };

  // Comprehensive Keyboard & DevTools & ALT+F4 & Windows OS Tab Switching Lockdown Interceptor
  useEffect(() => {
    if (!isRemotelyUnlocked) {
      engageKeyboardLock();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Re-engage keyboard lock on any keypress
      engageKeyboardLock();

      // 1. Intercept ALT+F4, Ctrl+W, Ctrl+Q, Ctrl+F4, Alt+Tab, Alt+Escape, Escape from exiting
      const isAltF4 = e.altKey && (e.key === 'F4' || e.code === 'F4' || e.keyCode === 115);
      const isCtrlW = e.ctrlKey && (e.key === 'w' || e.key === 'W' || e.code === 'KeyW');
      const isCtrlQ = e.ctrlKey && (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ');
      const isCtrlF4 = e.ctrlKey && (e.key === 'F4' || e.code === 'F4');
      const isAltTab = e.altKey && (e.key === 'Tab' || e.code === 'Tab');
      const isAltEsc = e.altKey && (e.key === 'Escape' || e.code === 'Escape');

      // 2. Intercept Windows OS Tab Switching: Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+PageUp, Ctrl+PageDown, Ctrl+1..9
      const isCtrlTab = e.ctrlKey && (e.key === 'Tab' || e.code === 'Tab');
      const isCtrlPageNav = e.ctrlKey && (e.key === 'PageUp' || e.key === 'PageDown');
      const isCtrlNumberTab = e.ctrlKey && e.key >= '1' && e.key <= '9';
      const isMetaWinKey = e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight' || e.metaKey;

      // 3. Intercept Refresh / Reset: F5, Ctrl+R, Ctrl+Shift+R
      const isReload =
        e.key === 'F5' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'R')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r'));

      // 4. Intercept DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'));

      // 5. Intercept System Browsing, New Windows, Printing: Ctrl+P, Ctrl+S, Ctrl+H, Ctrl+J, Ctrl+N, Ctrl+T, Ctrl+Shift+N, Ctrl+Shift+T
      const isBrowserShortcuts =
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && (e.key === 'h' || e.key === 'H')) ||
        (e.ctrlKey && (e.key === 'j' || e.key === 'J')) ||
        (e.ctrlKey && (e.key === 'n' || e.key === 'N')) ||
        (e.ctrlKey && (e.key === 't' || e.key === 'T')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'T' || e.key === 'n' || e.key === 't'));

      if (
        isAltF4 ||
        isCtrlW ||
        isCtrlQ ||
        isCtrlF4 ||
        isAltTab ||
        isAltEsc ||
        isCtrlTab ||
        isCtrlPageNav ||
        isCtrlNumberTab ||
        isMetaWinKey ||
        isReload ||
        isDevTools ||
        isBrowserShortcuts
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Immediately regrab focus
        try {
          window.focus();
          document.body.focus();
        } catch {}

        if (isAltTab || isCtrlTab || isCtrlPageNav || isCtrlNumberTab || isMetaWinKey) {
          triggerAlertSound();
          setTabSwitchCount((prev) => prev + 1);
          setIsTabSwitchViolationActive(true);
          setViolationToast('🚫 Tab Switching Blocked: Switching windows or tabs is disabled while device is locked!');
          // Transmit violation alert
          api.simulatorViolation({
            deviceId: currentDevice.id || currentDevice.deviceId,
            type: 'TAB_SWITCH_ATTEMPT',
            severity: 'HIGH',
            targetResource: 'Windows OS Tab Switch / Alt-Tab Keypress',
            description: `Student attempted tab-switch hotkey in Kiosk mode`,
          }).catch(() => {});
        } else if (isAltF4 || isCtrlW || isCtrlQ || isCtrlF4) {
          setViolationToast('🚫 Security Lockdown: ALT+F4 & Window Close are locked in EduGuard Kiosk! Password & Admin Approval required to exit.');
        } else if (isReload) {
          setViolationToast('🔒 Reset Protection: Page reload & reset are disabled during active student session.');
        } else {
          setViolationToast('🛡️ Policy Enforcement: Developer shortcuts and external window controls are restricted.');
        }

        setTimeout(() => setViolationToast(null), 3500);
      }
    };

    // 6. Tab Visibility Change (detect tab switch immediately when student moves away)
    const handleVisibilityChange = () => {
      if (isRemotelyUnlocked) return;
      if (document.hidden || document.visibilityState === 'hidden') {
        try {
          window.focus();
          document.body.focus();
        } catch {}
        triggerAlertSound();
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          api.simulatorViolation({
            deviceId: currentDevice.id || currentDevice.deviceId,
            type: 'TAB_SWITCH_ATTEMPT',
            severity: 'HIGH',
            targetResource: 'Windows OS Tab / App Switch',
            description: `Student switched away from EduGuard Kiosk tab in Windows OS (Violation #${next})`,
          }).catch(() => {});
          return next;
        });
        setIsTabSwitchViolationActive(true);
        setViolationToast('🚫 Tab Switching Blocked: Switching windows or tabs is prohibited in Kiosk Mode!');
        setTimeout(() => setViolationToast(null), 3500);
      }
    };

    // 7. Window Blur (detect loss of window focus in Windows OS)
    const handleWindowBlur = () => {
      if (isRemotelyUnlocked) return;
      // Immediately pull window focus back so student cannot switch out
      try {
        window.focus();
        document.body.focus();
      } catch {}

      // Immediate check if document lost focus
      setTimeout(() => {
        if (isRemotelyUnlocked) return;
        if (!document.hasFocus() || document.hidden) {
          try {
            window.focus();
            document.body.focus();
          } catch {}
          triggerAlertSound();
          setTabSwitchCount((prev) => {
            const next = prev + 1;
            api.simulatorViolation({
              deviceId: currentDevice.id || currentDevice.deviceId,
              type: 'WINDOW_BLUR_VIOLATION',
              severity: 'HIGH',
              targetResource: 'Windows OS Window Focus Loss',
              description: `EduGuard Kiosk lost window focus (Alt-Tab or desktop interaction #${next})`,
            }).catch(() => {});
            return next;
          });
          setIsTabSwitchViolationActive(true);
          setViolationToast('🚫 Window Switching Blocked: Switching between applications is disabled on this locked device!');
          setTimeout(() => setViolationToast(null), 3500);
        }
      }, 100);
    };

    // 8. BeforeUnload Interceptor: Prompts confirmation if user attempts window kill
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRemotelyUnlocked) return;
      e.preventDefault();
      e.returnValue = 'EduGuard Student Kiosk is locked. Administrator approval is required to exit.';
      return 'EduGuard Student Kiosk is locked. Administrator approval is required to exit.';
    };

    // 9. Prevent browser back button navigation via History API trap
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (isRemotelyUnlocked) return;
      window.history.pushState(null, '', window.location.href);
      setViolationToast('🚫 Navigation Lockdown: Back button is disabled in EduGuard Student Workspace.');
      setTimeout(() => setViolationToast(null), 3000);
    };

    // 10. Handle fullscreen changes: immediately engage keyboard lock upon entering fullscreen
    const handleFullscreenChange = () => {
      const isNowFull = !!document.fullscreenElement;
      setIsFullscreen(isNowFull);
      if (isNowFull) {
        engageKeyboardLock();
        try {
          window.focus();
          document.body.focus();
        } catch {}
      } else if (!isRemotelyUnlocked) {
        // Exited fullscreen while device locked: immediately alert and enforce
        triggerAlertSound();
        setTabSwitchCount((prev) => prev + 1);
        setIsTabSwitchViolationActive(true);
        setViolationToast('⚠️ Fullscreen Breach Blocked: Fullscreen must remain active while device is locked.');
        api.simulatorViolation({
          deviceId: currentDevice.id || currentDevice.deviceId,
          type: 'FULLSCREEN_EXIT_ATTEMPT',
          severity: 'HIGH',
          targetResource: 'Fullscreen Lockdown Escape',
          description: `Student exited fullscreen during active security lockdown`,
        }).catch(() => {});
      }
    };

    if (!isRemotelyUnlocked) {
      window.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentDevice.id, currentDevice.deviceId, isRemotelyUnlocked]);

  // Melodic chime when admin unlocks the PC
  const playUnlockSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.36); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  };

  // Remote Lock & Unlock Action Handlers
  const handleRemoteLock = (reason?: string) => {
    setIsRemotelyUnlocked(false);
    setIsScreenLockedByAdmin(true);
    const msg = reason || 'Workstation locked remotely by Exam Section Administrator.';
    setAdminLockReason(msg);
    setCurrentDevice((prev) => ({ ...prev, isLocked: true, status: 'LOCKED', lockReason: msg }));
    triggerAlertSound();

    // Immediately enforce fullscreen & lock keyboard switching
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
            engageKeyboardLock();
          })
          .catch(() => {
            engageKeyboardLock();
          });
      } else {
        engageKeyboardLock();
      }
    } catch {
      engageKeyboardLock();
    }
  };

  const handleRemoteUnlock = (reason?: string) => {
    setIsScreenLockedByAdmin(false);
    setIsRemotelyUnlocked(true);
    setExitRequestStatus('APPROVED');
    setRemoteUnlockReason(reason || 'Administrator unlocked this workstation from Admin Console.');
    setCurrentDevice((prev) => ({ ...prev, isLocked: false, status: 'ONLINE', lockReason: undefined }));
    playUnlockSuccessSound();

    // Release keyboard lock
    try {
      if ('keyboard' in navigator && (navigator as any).keyboard?.unlock) {
        (navigator as any).keyboard.unlock();
      }
    } catch {}

    // Auto-attempt window.close after 2s
    setTimeout(() => {
      try {
        window.open('', '_self', '');
        window.close();
      } catch (e) {}
      try {
        window.close();
      } catch (e) {}

      // Only invoke onExit if running in the Admin Console Simulator (not a real student machine)
      const isStudentStation = window.location.search.includes('student') || window.location.search.includes('kiosk');
      if (!isStudentStation && onExitRef.current) {
        onExitRef.current();
      }
    }, 2000);
  };

  // Auto-Register PC with Admin Console on start (Runs ONCE on mount)
  useEffect(() => {
    const autoEnrollStation = async () => {
      try {
        const curDev = currentDeviceRef.current;
        const checkinRes = await api.checkinDevice({
          deviceId: curDev.deviceId,
          name: curDev.name,
          platform: 'WINDOWS_PC',
          model: specs.modelName || 'Windows 11 PC (x64)',
          schoolId: curDev.schoolId || 'sch-demo-01',
          classId: curDev.classId || 'cls-12-a',
          studentName: curDev.assignedStudentName || `Student Station (${curDev.deviceId})`,
          studentRoll: curDev.assignedStudentRoll || 'PC-01',
          batteryLevel: curDev.batteryLevel,
          isCharging: curDev.isCharging,
          isLocked: curDev.isLocked,
        });

        if (checkinRes?.isDeleted) {
          handleRemoteUnlock('This workstation was unenrolled and deleted from fleet inventory.');
          return;
        }

        if (checkinRes?.device) {
          setCurrentDevice((prev) => ({
            ...prev,
            ...checkinRes.device,
            ipAddress: checkinRes.device.ipAddress || prev.ipAddress,
            isLocked: checkinRes.isLocked ?? prev.isLocked,
          }));
        }
      } catch (err) {
        console.warn('Auto-checkin note:', err);
      }
    };
    autoEnrollStation();

    // Heartbeat & status polling interval (every 4 seconds)
    const hbInterval = setInterval(async () => {
      try {
        const cur = currentDeviceRef.current;
        const hb = await api.simulatorHeartbeat({
          deviceId: cur.deviceId,
          batteryLevel: cur.batteryLevel,
          isCharging: cur.isCharging,
          currentApp: 'EduGuard Student Workspace Kiosk',
          isLocked: cur.isLocked,
        });

        if (hb?.isDeleted) {
          handleRemoteUnlock('This workstation was unenrolled and deleted from fleet inventory.');
          return;
        }

        // Query kiosk-status fallback
        const status = await api.getKioskStatus(cur.deviceId);
        if (status?.isDeleted) {
          handleRemoteUnlock('This workstation was unenrolled and deleted by Administrator.');
          return;
        }
        if (status && status.isLocked === false && cur.isLocked) {
          handleRemoteUnlock('Administrator unlocked this workstation from Admin Console.');
        } else if (status && status.isLocked === true && status.status === 'LOCKED' && !cur.isLocked) {
          handleRemoteLock(status.lockReason || 'Administrator placed this device under security lockdown.');
        }
      } catch (e) {}
    }, 4000);

    return () => clearInterval(hbInterval);
  }, []);

  // Silent Auto-Sync & Manual Sync Function with Admin Console
  const runFullSync = async (isManual = false) => {
    try {
      if (isManual) setIsSyncing(true);
      const curDev = currentDeviceRef.current;
      const [policiesData, appsData, messagesData, materialsData] = await Promise.all([
        api.getPolicies().catch(() => []),
        api.getApplications().catch(() => []),
        api.getDeviceMessages(curDev.id).catch(() => []),
        api.getStudyMaterials().catch(() => []),
      ]);

      if (policiesData.length > 0) {
        const matched = policiesData.find((p) => p.id === curDev.policyId) || policiesData[0];
        setCurrentPolicy((prev) => (prev.id !== matched.id || prev.version !== matched.version ? matched : prev));
      }

      if (appsData.length > 0) {
        const approved = appsData.filter((a) => a.isApproved && a.category !== 'RESTRICTED');
        const listToSet = approved.length > 0 ? approved : appsData;
        setInstalledApps((prev) => (prev.length !== listToSet.length ? listToSet : prev));
      }

      if (messagesData.length > 0) {
        setMessages((prev) => (prev.length !== messagesData.length ? messagesData : prev));
        const unacked = messagesData.find(
          (m) => m.requireAcknowledgment && !m.acknowledgedDeviceIds?.includes(curDev.deviceId)
        );
        if (unacked && !activeAnnouncement) {
          playBroadcastChime();
          setActiveAnnouncement(unacked);
        }
      }

      if (materialsData.length > 0) {
        setStudyMaterials((prev) => (prev.length !== materialsData.length ? materialsData : prev));
      }

      setLastSyncTime(new Date());

      // Only display notification if manually triggered to prevent continuous re-render flicker
      if (isManual) {
        setSyncFeedback(`Sync Complete • Policy v${currentPolicy.version} • ${materialsData.length} Study Notes Available`);
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      if (isManual) setIsSyncing(false);
    }
  };

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      runFullSync(false);
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

  // SSE real-time listener: mounted ONCE with zero reload loops
  useEffect(() => {
    runFullSync(false);

    const unsubscribe = subscribeToMdmEvents((eventType, data) => {
      const curDev = currentDeviceRef.current;
      if (eventType === 'study_material_uploaded') {
        setStudyMaterials((prev) => [data, ...prev.filter((m) => m.id !== data.id)]);
        setViolationToast(`📚 New ${data.subject} Study Material Uploaded: "${data.title}"`);
        setTimeout(() => setViolationToast(null), 4000);
      } else if (eventType === 'study_material_deleted') {
        setStudyMaterials((prev) => prev.filter((m) => m.id !== (data.materialId || data.id)));
      } else if (eventType === 'admin_broadcast_message') {
        // Instant Real-Time Broadcast Popup with Audio Chime without refresh!
        playBroadcastChime();
        setMessages((prev) => [data, ...prev.filter((m) => m.id !== data.id)]);
        setActiveAnnouncement(data);
      } else if (eventType === 'device_update') {
        if (data.id === curDev.id || data.deviceId === curDev.deviceId) {
          setCurrentDevice((prev) => ({ ...prev, ...data }));
          if (data.isLocked === false && curDev.isLocked) {
            handleRemoteUnlock('Administrator unlocked this device remotely.');
          } else if (data.isLocked === true && !curDev.isLocked) {
            handleRemoteLock(data.lockReason || 'Administrator has placed this device under security lockdown.');
          }
        }
      } else if (eventType === 'device_locked') {
        const matchesDevice =
          data.deviceId === curDev.deviceId ||
          data.deviceId === curDev.id ||
          data.id === curDev.id ||
          data.id === curDev.deviceId;
        if (matchesDevice) {
          handleRemoteLock(data.reason || 'Administrator placed this device under security lockdown.');
        }
      } else if (eventType === 'device_deleted') {
        const matchesDevice =
          data.deviceId === curDev.deviceId ||
          data.deviceId === curDev.id ||
          data.id === curDev.id ||
          data.id === curDev.deviceId;
        if (matchesDevice) {
          handleRemoteUnlock('This workstation was unenrolled and deleted by Administrator.');
        }
      } else if (eventType === 'kiosk_exit_approved' || eventType === 'device_unlocked') {
        const matchesDevice =
          data.deviceId === curDev.deviceId ||
          data.deviceId === curDev.id ||
          data.id === curDev.id ||
          data.id === curDev.deviceId ||
          (exitRequestIdRef.current && (data.requestId === exitRequestIdRef.current || data.id === exitRequestIdRef.current));

        if (matchesDevice) {
          setExitRequestStatus('APPROVED');
          handleRemoteUnlock(data.reason || data.reviewNote || 'Administrator approved kiosk exit.');
        }
      } else if (eventType === 'kiosk_exit_rejected') {
        const matchesDevice =
          data.deviceId === curDev.deviceId ||
          data.deviceId === curDev.id ||
          (exitRequestIdRef.current && (data.requestId === exitRequestIdRef.current || data.id === exitRequestIdRef.current));

        if (matchesDevice) {
          setExitRequestStatus('REJECTED');
          setExitRequestError(data.reason || data.reviewNote || 'Kiosk exit request was rejected by administrator.');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Polling fallback for exit request status when waiting for admin approval
  useEffect(() => {
    if (exitRequestStatus !== 'PENDING') return;

    const timer = setInterval(async () => {
      try {
        const res = await api.getKioskExitRequestStatus(currentDevice.deviceId || currentDevice.id);
        if (res) {
          if (res.status === 'APPROVED') {
            setExitRequestStatus('APPROVED');
            handleRemoteUnlock(res.reviewNote || 'Administrator approved kiosk exit.');
          } else if (res.status === 'REJECTED') {
            setExitRequestStatus('REJECTED');
            setExitRequestError(res.reviewNote || 'Exit request was rejected by administrator.');
          }
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(timer);
  }, [exitRequestStatus, currentDevice.deviceId, currentDevice.id, onExit]);

  // Handle Workstation Self-Enrollment
  const handleEnrollWorkstation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEnrolling(true);
    try {
      const res = await api.enrollDevice({
        deviceId: enrollForm.deviceName,
        name: `${enrollForm.deviceName} (${enrollForm.studentName})`,
        platform: enrollForm.platform,
        schoolId: enrollForm.schoolId,
        classId: enrollForm.classId,
        studentName: enrollForm.studentName,
        studentRoll: enrollForm.studentRoll,
        studentEmail: enrollForm.studentEmail,
        model: specs.modelName,
        osVersion: specs.osName,
        ramTotalGb: specs.ramGb,
        storageTotalGb: 256,
        batteryLevel: 100,
        isCharging: true,
      });

      setCurrentDevice(res.device);
      setLocalEnrolledDevice(res.device);
      localStorage.setItem('eduguard_enrolled_device', JSON.stringify(res.device));

      setEnrollSuccessMessage(`Successfully enrolled ${res.device.name} in ${res.class.name}!`);
      setTimeout(() => {
        setEnrollSuccessMessage(null);
        setIsEnrollModalOpen(false);
      }, 2000);
    } catch (err: any) {
      alert(`Enrollment failed: ${err.message || 'Please check network connection'}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Calculator Logic
  const handleCalcNum = (n: string) => {
    if (calcDisplay === '0' || calcResetOnNext) {
      setCalcDisplay(n);
      setCalcResetOnNext(false);
    } else {
      setCalcDisplay(calcDisplay + n);
    }
  };

  const handleCalcOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcResetOnNext(true);
  };

  const handleCalcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const current = parseFloat(calcDisplay);
    let result = 0;
    if (calcOp === '+') result = calcPrev + current;
    if (calcOp === '-') result = calcPrev - current;
    if (calcOp === '×' || calcOp === '*') result = calcPrev * current;
    if (calcOp === '÷' || calcOp === '/') result = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(String(result));
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(true);
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnNext(false);
  };

  // Safe Browser Navigation
  const handleNavigate = (input: string) => {
    const clean = input.toLowerCase().trim();
    if (
      clean.includes('youtube') ||
      clean.includes('facebook') ||
      clean.includes('instagram') ||
      clean.includes('tiktok') ||
      clean.includes('reddit') ||
      clean.includes('gaming') ||
      clean.includes('discord')
    ) {
      setBrowserBlocked(true);
      setBrowserUrl(input);
      setViolationToast(`Safe Web Filter: Blocked access to restricted domain "${input}"`);
      setTimeout(() => setViolationToast(null), 3000);
    } else {
      setBrowserBlocked(false);
      setBrowserUrl(input);
    }
  };

  // Admin / Teacher PIN Unlock (Quick Local Override)
  const handleAdminUnlock = () => {
    if (unlockPin === '2026' || unlockPin === 'arvdexamsection@gmail.com' || unlockPin === 'admin123' || unlockPin === 'admin') {
      setIsUnlockModalOpen(false);
      setIsExitRequestModalOpen(false);
      setUnlockPin('');
      setUnlockError(false);
      if (onExit) onExit();
    } else {
      setUnlockError(true);
    }
  };

  // Student Exit Request Submit & Approval Workflow
  const handleSubmitExitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentExitPassword.trim()) {
      setExitRequestError('Please enter your student login password.');
      return;
    }

    setIsSubmittingExit(true);
    setExitRequestError(null);
    try {
      const res = await api.submitKioskExitRequest({
        deviceId: currentDevice.deviceId || currentDevice.id,
        studentId: currentDevice.assignedStudentId,
        studentName: currentDevice.assignedStudentName || enrollForm.studentName || 'Student',
        studentRoll: currentDevice.assignedStudentRoll || enrollForm.studentRoll || 'Roll-101',
        className: currentDevice.className || 'Grade 12 (A)',
        reason: studentExitReason,
        studentPassword: studentExitPassword,
      });

      setExitRequestId(res.id);
      setExitRequestStatus('PENDING');
    } catch (err: any) {
      setExitRequestError(err.message || 'Invalid student password or submission failed.');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  const handleTeacherOverrideUnlock = () => {
    if (
      teacherOverridePin === '2026' ||
      teacherOverridePin === 'arvdexamsection@gmail.com' ||
      teacherOverridePin === 'admin123' ||
      teacherOverridePin === 'admin'
    ) {
      setIsExitRequestModalOpen(false);
      setIsUnlockModalOpen(false);
      setTeacherOverridePin('');
      setTeacherOverrideError(false);
      if (onExit) onExit();
    } else {
      setTeacherOverrideError(true);
    }
  };

  // Fullscreen toggle: strictly locks keyboard and disables exiting if device is locked
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        await engageKeyboardLock();
        try {
          window.focus();
          document.body.focus();
        } catch {}
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      if (!isRemotelyUnlocked) {
        setViolationToast('🚫 Switching & Exiting Fullscreen is Prohibited while device is locked.');
        triggerAlertSound();
        await engageKeyboardLock();
        setTimeout(() => setViolationToast(null), 3000);
        return;
      }
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {}
    }
  };

  // Immediate full screen & lock engagement on user click when device is locked
  const handleContainerClick = () => {
    if (!isRemotelyUnlocked && !document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          engageKeyboardLock();
        })
        .catch(() => {});
    }
  };

  // Filter study materials for student's class
  const classMaterials = studyMaterials.filter((m) => {
    const matchesClass = !m.classId || m.classId === 'ALL' || m.classId === currentDevice.classId;
    const matchesSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
    const matchesQuery =
      studySearchQuery === '' ||
      m.title.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
      (m.topic && m.topic.toLowerCase().includes(studySearchQuery.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(studySearchQuery.toLowerCase())) ||
      m.subject.toLowerCase().includes(studySearchQuery.toLowerCase()) ||
      m.authorTeacher.toLowerCase().includes(studySearchQuery.toLowerCase());
    return matchesClass && matchesSubject && matchesQuery;
  });

  const availableSubjects = ['ALL', ...Array.from(new Set(studyMaterials.map((m) => m.subject)))];

  // Built-in Apps Catalog
  const builtInApps = [
    {
      id: 'app-notes-hub',
      name: 'Class Notes & Study Hub',
      desc: 'Access verified subject PDF notes uploaded by your school teachers.',
      pkg: 'com.edu.notes.hub',
      icon: '📚',
      badge: `${studyMaterials.length} PDFs Available`,
      color: 'from-amber-600 to-amber-700',
    },
    {
      id: 'app-calc',
      name: 'Scientific Calculator',
      desc: 'Standard & scientific calculations with clear history, offline guaranteed.',
      pkg: 'com.edu.calc',
      icon: '🧮',
      badge: 'Offline Certified',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'app-scratchpad',
      name: 'Exam Scratchpad & Notes',
      desc: 'Instant student scratchpad with automatic persistent local storage.',
      pkg: 'com.edu.scratchpad',
      icon: '📝',
      badge: 'Auto-Saved',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'app-periodic',
      name: 'Periodic Table & Formulas',
      desc: 'Interactive chemistry element reference and physics equation index.',
      pkg: 'com.edu.periodic',
      icon: '⚛️',
      badge: 'Interactive',
      color: 'from-purple-600 to-violet-600',
    },
  ];

  return (
    <div
      onClick={handleContainerClick}
      onContextMenu={(e) => {
        e.preventDefault();
        setViolationToast('🚫 Right-click context menu is disabled in EduGuard Student Kiosk.');
        setTimeout(() => setViolationToast(null), 2500);
      }}
      className="fixed inset-0 z-50 bg-gray-950 text-gray-100 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* 1. TOP SECURE SYSTEM BAR */}
      <header className="h-14 bg-gray-900/95 border-b border-gray-800 px-4 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md">
        {/* Left: Branding & Enrolled Station Status */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/20">
            EG
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white tracking-wide">EduGuard Workspace</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                KIOSK LOCKED
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {currentDevice.name} • {currentDevice.className} ({currentDevice.assignedStudentRoll || 'Roll 104'})
            </p>
          </div>
        </div>

        {/* Center: Device Enrollment / Station Registration Trigger */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3 py-1 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Station: {currentDevice.deviceId}</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/30 rounded text-[9px] font-mono">
              {currentDevice.platform || 'PC'}
            </span>
          </button>

          <button
            onClick={() => setIsTaskManagerGuideOpen(true)}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-xs font-medium flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Lockdown Info</span>
          </button>
        </div>

        {/* Right: Telemetry & Controls */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Battery Status */}
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-300">
            {currentDevice.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>{currentDevice.batteryLevel}%</span>
          </div>

          {/* Network Sync Status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Online (Live Sync)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-medium">Offline Kiosk Mode</span>
              </>
            )}
          </div>

          {/* Manual Full Sync */}
          <button
            onClick={() => runFullSync(true)}
            disabled={isSyncing}
            title="Auto-sync policies, notices & PDF notes with school server"
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Broadcasts Drawer Toggle */}
          <button
            onClick={() => setIsMessagesOpen(!isMessagesOpen)}
            className="relative p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg cursor-pointer transition-colors"
            title="School Broadcast Notices"
          >
            <Bell className="w-3.5 h-3.5" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Fullscreen & Switching Lockdown Indicator / Button */}
          {!isFullscreen && !isRemotelyUnlocked && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer animate-pulse"
              title="Activate Fullscreen & Lock Tab/Window Switching"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Fullscreen</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isFullscreen
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title={isFullscreen ? 'Fullscreen Active (Switching Disabled)' : 'Enter Fullscreen & Lock Switching'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-blue-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Student Request Exit / Logout Button */}
          <button
            onClick={() => {
              setIsExitRequestModalOpen(true);
              setExitRequestError(null);
            }}
            className="px-3 py-1 bg-gray-800 hover:bg-rose-950 text-gray-300 hover:text-rose-300 border border-gray-700 rounded-lg font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            title="Request Session Logout / Kiosk Exit (Requires Student Password & Admin Approval)"
          >
            <Lock className="w-3 h-3 text-rose-400" />
            <span>Exit Kiosk</span>
          </button>
        </div>
      </header>

      {/* Sync Toast Floating Feedback (Fixed non-layout-shifting pill) */}
      {syncFeedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 text-emerald-100 border border-emerald-500/50 shadow-2xl rounded-full text-xs py-1.5 px-4 flex items-center space-x-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{syncFeedback}</span>
          <span className="text-[10px] text-emerald-300/80 font-mono pl-1.5 border-l border-emerald-700">
            {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Violation / Hotkey Alert Toast */}
      {violationToast && (
        <div className="bg-rose-950/95 text-rose-200 border-b border-rose-700 text-xs py-2 px-4 flex items-center justify-between animate-in slide-in-from-top duration-150">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{violationToast}</span>
          </div>
          <button onClick={() => setViolationToast(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* INSTANT REAL-TIME BROADCAST NOTICE POPUP MODAL (Pops immediately on SSE without refresh) */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gray-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-3 text-amber-400">
                <div className="p-2.5 bg-amber-500/20 rounded-2xl animate-pulse">
                  <Megaphone className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Live School Broadcast Notice</h3>
                  <p className="text-xs text-amber-300/90 font-medium">
                    Priority: <span className="uppercase font-bold">{activeAnnouncement.priority}</span> • Target: {activeAnnouncement.targetName || 'All Students'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30">
                🔴 LIVE POPUP
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-xl">{activeAnnouncement.title}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>Issued by {activeAnnouncement.senderName}</span>
                <span>•</span>
                <span>{new Date(activeAnnouncement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>

            <div className="p-5 bg-gray-950 border border-gray-800 rounded-2xl text-sm text-gray-200 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap font-sans">
              {activeAnnouncement.body}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (activeAnnouncement.id) {
                    api.acknowledgeMessage(activeAnnouncement.id, currentDevice.deviceId).catch(() => {});
                  }
                  setActiveAnnouncement(null);
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-sm rounded-2xl shadow-xl shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5 text-gray-950" />
                <span>I Acknowledge & Understand Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-gradient-to-b from-gray-950 to-gray-900">
          {/* IF AN APP IS CURRENTLY OPENED */}
          {activeApp === 'com.edu.calc' ? (
            /* 1. APP: SCIENTIFIC CALCULATOR */
            <div className="flex-1 max-w-md mx-auto w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveApp(null)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-base text-white">Scientific Calculator</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                  OFFLINE READY
                </span>
              </div>

              <div className="my-4 p-4 bg-gray-950 rounded-2xl border border-gray-800 text-right">
                <div className="text-xs text-gray-500 h-4 font-mono">
                  {calcPrev !== null ? `${calcPrev} ${calcOp || ''}` : ''}
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-wider truncate">
                  {calcDisplay}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 flex-1">
                {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(
                  (btn) => {
                    const isOp = ['÷', '×', '-', '+', '='].includes(btn);
                    const isClear = btn === 'C';
                    const isZero = btn === '0';
                    return (
                      <button
                        key={btn}
                        onClick={() => {
                          if (btn === 'C') handleCalcClear();
                          else if (btn === '=') handleCalcEquals();
                          else if (['÷', '×', '-', '+'].includes(btn)) handleCalcOp(btn);
                          else if (btn === '±') setCalcDisplay(String(-parseFloat(calcDisplay)));
                          else if (btn === '%') setCalcDisplay(String(parseFloat(calcDisplay) / 100));
                          else handleCalcNum(btn);
                        }}
                        className={`font-mono text-base font-bold rounded-2xl transition-all active:scale-95 cursor-pointer ${
                          isZero ? 'col-span-2' : ''
                        } ${
                          isOp
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : isClear
                            ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-100'
                        }`}
                      >
                        {btn}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          ) : activeApp === 'com.edu.notes' ? (
            /* 2. APP: CLASS STUDY NOTES & PDF READER HUB */
            <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 bg-gray-950 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (readingMaterial) {
                        setReadingMaterial(null);
                      } else {
                        setActiveApp(null);
                      }
                    }}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>{readingMaterial ? readingMaterial.title : 'Class Study Materials & PDF Library'}</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {readingMaterial
                        ? `${readingMaterial.subject} • Class: ${readingMaterial.className} • Uploaded by ${readingMaterial.authorTeacher}`
                        : `Grade 12-A • ${studyMaterials.length} Teacher Uploaded Notes & Chapter PDFs`}
                    </p>
                  </div>
                </div>

                {readingMaterial ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPdfZoomLevel((prev) => Math.max(70, prev - 15))}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-300 w-12 text-center">{pdfZoomLevel}%</span>
                    <button
                      onClick={() => setPdfZoomLevel((prev) => Math.min(180, prev + 15))}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReadingMaterial(null)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      All Notes List
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={studySearchQuery}
                        onChange={(e) => setStudySearchQuery(e.target.value)}
                        placeholder="Search chapter, subject, formula..."
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reading View or List View */}
              {readingMaterial ? (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* Left: Document Viewer */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-950/80 border-r border-gray-800">
                    <div
                      className="max-w-3xl mx-auto space-y-6 transition-all"
                      style={{ fontSize: `${pdfZoomLevel}%` }}
                    >
                      {/* Document Header Card */}
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-lg uppercase">
                            {readingMaterial.subject}
                          </span>
                          <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Verified Teacher Material</span>
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{readingMaterial.title}</h2>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-4 pt-1 border-t border-gray-800/80">
                          <span>Topic: <strong className="text-gray-200">{readingMaterial.topic}</strong></span>
                          <span>Teacher: <strong className="text-gray-200">{readingMaterial.authorTeacher}</strong></span>
                          <span>Pages: <strong className="text-gray-200">{readingMaterial.pageCount || 1}</strong></span>
                        </div>
                      </div>

                      {/* Embedded PDF iframe or Formatted Content View */}
                      {readingMaterial.fileUrl && readingMaterial.fileUrl.startsWith('data:application/pdf') ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden h-[550px]">
                          <iframe
                            src={readingMaterial.fileUrl}
                            className="w-full h-full border-0"
                            title={readingMaterial.title}
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-200 leading-relaxed space-y-4 shadow-sm font-sans whitespace-pre-wrap">
                          {readingMaterial.content || 'Document content loaded.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Student's Personal Live Margin Scratchpad */}
                  <div className="w-full lg:w-80 p-4 bg-gray-900 flex flex-col shrink-0">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>My Class Scratchpad</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Auto-Saved</span>
                    </div>
                    <textarea
                      value={offlineNotes}
                      onChange={(e) => {
                        setOfflineNotes(e.target.value);
                        localStorage.setItem('eduguard_student_notes', e.target.value);
                      }}
                      placeholder="Type your notes, equations, and questions while reading this material..."
                      className="flex-1 mt-3 bg-gray-950 border border-gray-800 rounded-2xl p-3 text-xs text-gray-200 focus:outline-none focus:border-amber-500 resize-none font-mono leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                /* Materials List Grid with Subject Tabs */
                <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-5">
                  {/* Subject Pills */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2 shrink-0">
                    {availableSubjects.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                          selectedSubject === sub
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        {sub === 'ALL' ? 'All Subjects' : sub}
                      </button>
                    ))}
                  </div>

                  {/* Materials Grid */}
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classMaterials.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-gray-500 space-y-2">
                        <BookOpen className="w-10 h-10 text-gray-600 mx-auto" />
                        <h4 className="font-bold text-gray-400 text-sm">No Study Materials Found</h4>
                        <p className="text-xs">
                          {studySearchQuery ? 'No documents matched your search term.' : 'Teacher has not uploaded notes for this subject yet.'}
                        </p>
                      </div>
                    ) : (
                      classMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 bg-gray-950 border border-gray-800 hover:border-blue-500/60 rounded-3xl flex flex-col justify-between space-y-4 transition-all group shadow-sm"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {item.subject}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {item.fileType.toUpperCase()} {item.pageCount ? `• ${item.pageCount} p.` : ''}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {item.topic}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                            <div className="text-[11px] text-gray-500 truncate max-w-[140px]">
                              By <span className="text-gray-400">{item.authorTeacher}</span>
                            </div>
                            <button
                              onClick={() => setReadingMaterial(item)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Read Notes</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                  <div className="p-8 bg-gray-950 border border-gray-800 rounded-3xl max-w-md space-y-3 text-gray-300">
                    <Globe className="w-12 h-12 text-blue-400 mx-auto" />
                    <h3 className="font-bold text-lg text-white">Safe Educational Browser Active</h3>
                    <p className="text-xs">
                      Browsing allowed educational portal: <code className="text-blue-400 font-mono">{browserUrl}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* HOME LAUNCHER: APPS & APPROVED SERVICES */
            <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
              {/* Student Welcome Banner */}
              <div className="bg-gradient-to-r from-blue-950/80 via-gray-900 to-gray-900 border border-blue-900/40 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      SECURE KIOSK WORKSPACE
                    </span>
                    <span className="text-xs text-gray-400">• Windows 10/11 & Android Ready</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Welcome, {currentDevice.assignedStudentName}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Class: {currentDevice.className} • Roll: {(currentDevice as any).assignedStudentRoll || currentDevice.assignedStudentId || '12-A-04'} • Policy: {currentPolicy.name}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsBrowserOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-xs flex items-center space-x-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Safe Web Portal</span>
                  </button>
                </div>
              </div>

              {/* Built-in Offline Learning Tools */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                  <span>Approved Core Learning Apps (100% Offline Ready)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Auto-Cached
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {builtInApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app.pkg)}
                      className="p-5 bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-3xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-3xl">{app.icon}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-semibold">
                          {app.badge}
                        </span>
                      </div>
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

      {/* TAB SWITCHING & WINDOW DEFOCUS SECURITY ALERT OVERLAY */}
      {isTabSwitchViolationActive && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-gray-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                Windows OS Security Incident #{tabSwitchCount}
              </span>
              <h3 className="font-black text-xl text-white">
                Tab Switching Detected & Logged
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                Switching browser tabs, switching applications (Alt+Tab), or defocusing the EduGuard Kiosk is strictly prohibited during active student sessions in Windows OS.
              </p>
            </div>

            <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Workstation ID:</span>
                <strong className="text-white font-mono">{currentDevice.deviceId || currentDevice.name}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Student Roster:</span>
                <strong className="text-white">{currentDevice.assignedStudentName || 'Student'} ({currentDevice.assignedStudentRoll || 'Roll 101'})</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Superadmin Transmit:</span>
                <span className="text-emerald-400 font-semibold">arvdexamsection@gmail.com</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsTabSwitchViolationActive(false);
                // Re-enforce fullscreen & keyboard lock
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen()
                    .then(() => {
                      setIsFullscreen(true);
                      engageKeyboardLock();
                    })
                    .catch(() => {
                      engageKeyboardLock();
                    });
                } else {
                  engageKeyboardLock();
                }
                try {
                  window.focus();
                  document.body.focus();
                } catch {}
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Acknowledge Violation & Resume Kiosk</span>
            </button>
          </div>
        </div>
      )}

      {/* STUDENT KIOSK EXIT & LOGOUT AUTHORIZATION MODAL (Password + Admin Approval Workflow) */}
      {isExitRequestModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Student Kiosk Exit & Logout</h3>
                  <p className="text-xs text-gray-400">Password Verification & Administrator Approval</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExitRequestModalOpen(false);
                  setExitRequestStatus('IDLE');
                  setExitRequestError(null);
                  setStudentExitPassword('');
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content state 1: IDLE / Entering Student Password */}
            {exitRequestStatus === 'IDLE' && (
              <form onSubmit={handleSubmitExitRequest} className="space-y-4 text-xs">
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl space-y-1.5 text-gray-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Workstation / Device:</span>
                    <strong className="text-white font-mono">{currentDevice.deviceId || currentDevice.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Student Name:</span>
                    <strong className="text-white">{currentDevice.assignedStudentName || 'Rahul Sharma'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Roll Number & Class:</span>
                    <span className="text-blue-400 font-semibold">
                      {currentDevice.assignedStudentRoll || '12-A-04'} • {currentDevice.className || 'Grade 12 (A)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Student Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={studentExitPassword}
                    onChange={(e) => {
                      setStudentExitPassword(e.target.value);
                      setExitRequestError(null);
                    }}
                    placeholder="Enter station student password"
                    className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-rose-500 focus:outline-none font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Reason for Kiosk Exit *
                  </label>
                  <select
                    value={studentExitReason}
                    onChange={(e) => setStudentExitReason(e.target.value)}
                    className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Exam completed & submitted">Exam completed & test paper submitted</option>
                    <option value="Class / Lab period ended">Class / Lab period ended</option>
                    <option value="Teacher authorized session exit">Teacher authorized session exit</option>
                    <option value="Medical emergency / Early dismissal">Medical emergency / Early dismissal</option>
                    <option value="Station maintenance / Technical assistance">Station maintenance / Technical issue</option>
                  </select>
                </div>

                {exitRequestError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{exitRequestError}</span>
                  </div>
                )}

                {/* Teacher Local PIN Override Option */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTeacherOverridePin(!showTeacherOverridePin)}
                    className="text-[11px] text-gray-400 hover:text-blue-400 flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    <span>{showTeacherOverridePin ? 'Hide' : 'Use in-person Teacher / Admin Master PIN'}</span>
                  </button>

                  {showTeacherOverridePin && (
                    <div className="mt-2 p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Teacher / Master Override PIN
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="password"
                          value={teacherOverridePin}
                          onChange={(e) => {
                            setTeacherOverridePin(e.target.value);
                            setTeacherOverrideError(false);
                          }}
                          placeholder="Enter Master PIN"
                          className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleTeacherOverrideUnlock}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Override & Unlock
                        </button>
                      </div>
                      {teacherOverrideError && (
                        <p className="text-[10px] text-rose-400 font-semibold">Invalid master PIN. Please check with your supervisor.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExitRequestModalOpen(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExit}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    {isSubmittingExit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit for Admin Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Content state 2: PENDING / Live Waiting for Admin Approval */}
            {exitRequestStatus === 'PENDING' && (
              <div className="py-4 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
                  <div className="relative w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Lock className="w-6 h-6 animate-bounce" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest inline-block">
                    Awaiting Super Admin Approval
                  </span>
                  <h4 className="font-bold text-base text-white">
                    Request Sent to Administrator
                  </h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Student password accepted. Your exit request has been transmitted to <strong className="text-amber-300">arvdexamsection@gmail.com</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-left space-y-1.5 text-xs text-gray-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Request ID:</span>
                    <span className="font-mono text-white">#{exitRequestId?.slice(-6) || 'PENDING'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Live Stream Active</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Condition:</span>
                    <span className="text-gray-400">Unlock will occur once approved in console</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Checking administrator decision in real-time...</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExitRequestStatus('IDLE');
                    setIsExitRequestModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel Request & Return to Workspace
                </button>
              </div>
            )}

            {/* Content state 3: APPROVED */}
            {exitRequestStatus === 'APPROVED' && (
              <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-emerald-400">Kiosk Exit Approved!</h4>
                  <p className="text-xs text-emerald-200">Administrator has approved your exit request.</p>
                  <p className="text-[11px] text-gray-400 pt-1">Unlocking workstation and closing session now...</p>
                </div>
              </div>
            )}

            {/* Content state 4: REJECTED */}
            {exitRequestStatus === 'REJECTED' && (
              <div className="py-4 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-rose-400">Kiosk Exit Denied</h4>
                  <p className="text-xs text-gray-300">
                    Administrator declined the exit request:
                  </p>
                  <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-200 mt-2 font-medium">
                    "{exitRequestError || 'Please remain at your station until class dismissal.'}"
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExitRequestStatus('IDLE');
                    setExitRequestError(null);
                    setIsExitRequestModalOpen(false);
                  }}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Return to Student Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN UNLOCK PIN MODAL (Legacy fallback if directly opened) */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
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
                Enter Administrator PIN
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
              {unlockError && <p className="text-xs text-rose-400 mt-1 font-semibold">Incorrect PIN. Please contact system administrator.</p>}
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

      {/* WORKSTATION SELF-ENROLLMENT MODAL (PC / Tablet / Mobile) */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gray-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Enroll This Workstation / Device</h3>
                  <p className="text-xs text-gray-400">Register this PC, Tablet, or Laptop in School Fleet MDM</p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hardware Diagnostics Auto-Detected */}
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Auto-Detected Hardware Telemetry</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px]">Verified</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-300 pt-1">
                <div>
                  <span className="text-[10px] text-gray-500 block">OS / Engine</span>
                  <span className="font-semibold text-white truncate block">{specs.osName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Screen Size</span>
                  <span className="font-semibold text-white font-mono">{specs.screenRes}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Memory (RAM)</span>
                  <span className="font-semibold text-white">{specs.ramGb} GB RAM</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">CPU Cores</span>
                  <span className="font-semibold text-white">{specs.cores} vCPUs</span>
                </div>
              </div>
            </div>

            {enrollSuccessMessage ? (
              <div className="p-6 bg-emerald-950/60 border border-emerald-500 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-base">Workstation Enrolled!</h4>
                <p className="text-xs text-emerald-200">{enrollSuccessMessage}</p>
                <p className="text-[11px] text-gray-400">Syncing telemetry and classroom policies now...</p>
              </div>
            ) : (
              <form onSubmit={handleEnrollWorkstation} className="space-y-4 text-xs">
                {/* School & Class */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Target School
                    </label>
                    <select
                      value={enrollForm.schoolId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, schoolId: e.target.value })}
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {availableSchools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Target Class / Roster
                    </label>
                    <select
                      value={enrollForm.classId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, classId: e.target.value })}
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.section}) - Grade {c.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.studentName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, studentName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.studentRoll}
                      onChange={(e) => setEnrollForm({ ...enrollForm, studentRoll: e.target.value })}
                      placeholder="e.g. 12-A-04"
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Device Name & Platform */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Workstation Name / Device ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.deviceName}
                      onChange={(e) => setEnrollForm({ ...enrollForm, deviceName: e.target.value })}
                      placeholder="e.g. PC-LAB-102 or TAB-1004"
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Device Form Factor
                    </label>
                    <select
                      value={enrollForm.platform}
                      onChange={(e) => setEnrollForm({ ...enrollForm, platform: e.target.value as any })}
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="WINDOWS_PC">Windows 10/11 PC / Desktop</option>
                      <option value="ANDROID_TABLET">Android Tablet / EduTab</option>
                      <option value="IPAD">Apple iPad</option>
                      <option value="LINUX_PC">Linux Classroom Station</option>
                      <option value="MACOS">macOS Workstation</option>
                      <option value="MOBILE">Mobile Smartphone</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEnrolling}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center space-x-2"
                  >
                    {isEnrolling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enrolling Workstation...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Register & Enroll Workstation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TASK MANAGER & OS LOCKDOWN SECURITY MODAL */}
      {isTaskManagerGuideOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 border border-blue-500/50 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Windows 10/11 & Kiosk Lockdown Specifications</h3>
                  <p className="text-xs text-gray-400">Disabling Alt+F4, Windows Task Manager, Reset, and DevTools</p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskManagerGuideOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300">
              {/* Active Web Layer Protections */}
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Browser & Keydown Interceptors (Already Active)</span>
                </h4>
                <ul className="space-y-1.5 text-gray-300 list-disc list-inside">
                  <li><strong className="text-white">Alt+F4 & Ctrl+W / Ctrl+Q:</strong> Intercepted via window event listener with preventDefault.</li>
                  <li><strong className="text-white">F5 / Ctrl+R / Ctrl+Shift+R:</strong> Page reload and reset disabled to prevent clearing kiosk state.</li>
                  <li><strong className="text-white">F12 & DevTools:</strong> Ctrl+Shift+I/J/C, Ctrl+U blocked completely.</li>
                  <li><strong className="text-white">Right-Click Context Menu:</strong> Disabled across entire application.</li>
                  <li><strong className="text-white">Back Button / Popstate:</strong> History pushState trap prevents returning to previous pages.</li>
                </ul>
              </div>

              {/* Windows 10/11 Task Manager & OS Registry Policies */}
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-blue-400 text-sm flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>2. Disabling Windows Task Manager (Ctrl+Alt+Del)</span>
                </h4>
                <p className="text-gray-400">
                  To disable Task Manager on Windows 10/11 student PCs (preventing students from ending the task), run this 1-click command as Administrator:
                </p>
                <div className="p-3 bg-black border border-gray-800 rounded-xl font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                  <code>reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f');
                      setCopiedTaskMgrCmd(true);
                      setTimeout(() => setCopiedTaskMgrCmd(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 ml-2 cursor-pointer transition-colors"
                  >
                    {copiedTaskMgrCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  To restore Task Manager later: <code className="text-gray-400">reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /f</code>
                </p>
              </div>

              {/* Watchdog & Native Executable */}
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-amber-400 text-sm flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>3. Unclosable Watchdog Batch & .EXE Launcher</span>
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  Use the <strong>"Enrollment & Deployment"</strong> menu in the Admin Dashboard to generate the standalone <code className="text-white">EduGuard-Student-Kiosk.exe</code> or download the <code className="text-white">Launch-EduGuard-Watchdog.bat</code> file. If a student ever manages to close the browser, the watchdog automatically relaunches the workspace within 1 second.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTaskManagerGuideOpen(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl cursor-pointer transition-colors"
            >
              Got It, Return to Student Kiosk
            </button>
          </div>
        </div>
      )}

      {/* 8. Master Administrative Remote Security Lockdown Screen */}
      {isScreenLockedByAdmin && (
        <div className="fixed inset-0 z-[99999] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-gray-900 border-2 border-rose-600/80 text-white rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-rose-950/50 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-rose-950/60 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-inner shadow-rose-500/20">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold uppercase tracking-wider rounded-full">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Central Security Lockdown</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">Workstation Locked Remotely</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                The Exam Section Administrator has enacted a real-time security lock on this workstation.
              </p>
              {adminLockReason && (
                <div className="mt-2 p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-xs text-rose-200 font-medium">
                  &ldquo;{adminLockReason}&rdquo;
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-950/60 border border-gray-800 rounded-2xl text-left space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Station ID:</span>
                <span className="font-mono font-bold text-gray-200">{currentDevice.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span>Candidate / Roll:</span>
                <span className="font-semibold text-gray-200">{currentDevice.assignedStudentName || 'Student'} ({currentDevice.assignedStudentRoll || 'PC-01'})</span>
              </div>
              <div className="flex justify-between">
                <span>Enforcement Level:</span>
                <span className="font-semibold text-rose-400">Active Strict Kiosk Enforced</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-amber-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Awaiting Admin Console Signal</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              This PC will automatically unlock the moment the Administrator clicks &ldquo;Unlock Device&rdquo; from the Admin Console.
            </p>
          </div>
        </div>
      )}

      {/* 9. Remote Kiosk Exit / Unlock Approved Modal */}
      {isRemotelyUnlocked && (
        <div className="fixed inset-0 z-[99999] bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white text-gray-950 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-emerald-200 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
              <Unlock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full">
                Remote Unlock Signal Received
              </span>
              <h3 className="text-2xl font-bold text-gray-950">Workstation Unlocked</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Exam Section Administrator has remotely unlocked this PC and approved exit from Kiosk Mode.
              </p>
              {remoteUnlockReason && (
                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 font-medium">
                  &ldquo;{remoteUnlockReason}&rdquo;
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-left space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Station ID:</span>
                <span className="font-mono font-bold text-gray-800">{currentDevice.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Authority:</span>
                <span className="font-semibold text-gray-800">ARVD Exam Section Admin</span>
              </div>
              <div className="flex justify-between">
                <span>Kiosk State:</span>
                <span className="font-semibold text-emerald-600">Restored to Windows Desktop</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  try {
                    window.open('', '_self', '');
                    window.close();
                  } catch (e) {}
                  try {
                    window.close();
                  } catch (e) {}
                  const isStudentStation = window.location.search.includes('student') || window.location.search.includes('kiosk');
                  if (!isStudentStation && onExit) {
                    onExit();
                  }
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Close Kiosk Window (Alt+F4)</span>
              </button>
              <p className="text-[11px] text-gray-400">
                You can also close this window with <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[10px] text-gray-700">Alt + F4</kbd> or switch to desktop using Windows Key.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
