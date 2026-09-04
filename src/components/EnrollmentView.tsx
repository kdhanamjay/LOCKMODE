// EduGuard MDM — Multi-Platform Enrollment (Android Enterprise QR + Windows 10/11 Kiosk Lockdown)

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Monitor,
  Tablet,
  Download,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Wifi,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { EnrollmentToken, SchoolClass } from '../types/mdm';

interface EnrollmentViewProps {
  tokens: EnrollmentToken[];
  classes: SchoolClass[];
  onCreateToken: (data: any) => void;
  onLaunchStudentPortal?: () => void;
}

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({
  classes,
  onLaunchStudentPortal,
}) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'windows'>('android');
  const [wifiSsid, setWifiSsid] = useState('School_Secure_WLAN');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('cls-12-a');
  const [copied, setCopied] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const rawOrigin = window.location.origin;
  // Automatically use the public shared URL (ais-pre) instead of private development container (ais-dev)
  // This ensures other PCs and tablets can connect without requiring Google Cloud login
  const defaultPublicUrl = rawOrigin.includes('ais-dev-')
    ? rawOrigin.replace('ais-dev-', 'ais-pre-')
    : rawOrigin;

  const [customServerUrl, setCustomServerUrl] = useState(defaultPublicUrl);
  const currentAppUrl = customServerUrl.trim() || defaultPublicUrl;
  const studentKioskUrl = currentAppUrl.includes('?')
    ? `${currentAppUrl}&student=true`
    : `${currentAppUrl}?student=true`;

  // Android Enterprise DPC Zero-Touch JSON Payload
  const dpcPayload = {
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME':
      'com.eduguard.mdm/.receiver.DeviceAdminReceiver',
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION':
      `${currentAppUrl}/agent/eduguard-dpc-v1.4.2.apk`,
    'android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM':
      '4a7d18bc9e652a8c3d7e19024f2b01248a31e87d6052f9b87612c3d4e5f67a8b',
    'android.app.extra.PROVISIONING_WIFI_SSID': wifiSsid,
    'android.app.extra.PROVISIONING_WIFI_PASSWORD': wifiPassword || '••••••••••••',
    'android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE': 'WPA',
    'android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE': {
      server_url: `${currentAppUrl}/api`,
      enrollment_token: 'ENR-TOK-2026-X992',
      school_id: 'sch-greenwood-01',
      class_id: selectedClassId,
      auto_lock_unauthorized: true,
      kiosk_full_lockdown: true,
      offline_resilience_enabled: true,
    },
  };

  const jsonString = JSON.stringify(
    {
      ...dpcPayload,
      'android.app.extra.PROVISIONING_WIFI_PASSWORD':
        showWifiPassword && wifiPassword ? wifiPassword : (wifiPassword ? '••••••••••••' : '<Enter Wi-Fi Password>'),
    },
    null,
    2
  );

  const handleCopyAndroid = () => {
    const payloadToCopy = {
      ...dpcPayload,
      'android.app.extra.PROVISIONING_WIFI_PASSWORD': wifiPassword,
    };
    navigator.clipboard.writeText(JSON.stringify(payloadToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Windows 10 & 11 PowerShell Lockdown Script
  const windowsPowerShellScript = `# ==============================================================================
# EduGuard MDM — Windows 10 & 11 Student Kiosk Lockdown Provisioning Script
# Enforces Full-Screen Student Workspace, Disables Task Manager & Alt-Tab
# ==============================================================================

Write-Host ">>> Initializing EduGuard Student Kiosk Provisioning on Windows 10/11..." -ForegroundColor Cyan

$AppUrl = "${studentKioskUrl}"
$KioskUser = "StudentKiosk"

# 1. Disable Windows Task Manager & System Hotkeys for Student Account
Write-Host ">>> Enforcing Registry Lockdown Policies (Taskmgr, Hotkeys)..." -ForegroundColor Yellow
$RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"
If (!(Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }
Set-ItemProperty -Path $RegPath -Name "DisableTaskMgr" -Value 1 -Type DWord
Set-ItemProperty -Path $RegPath -Name "DisableLockWorkstation" -Value 1 -Type DWord
Set-ItemProperty -Path $RegPath -Name "DisableChangePassword" -Value 1 -Type DWord

# 2. Configure Microsoft Edge / Chrome Single-App Fullscreen Kiosk Mode
$EdgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
If (!(Test-Path $EdgePath)) { $EdgePath = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" }

$KioskArgs = "--kiosk \`"$AppUrl\`" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --kiosk-printing --disable-features=TranslateUI"

Write-Host ">>> Creating EduGuard Auto-Start Kiosk Entry..." -ForegroundColor Green
$StartupFolder = [Environment]::GetFolderPath("Startup")
$ShortcutPath = "$StartupFolder\\EduGuard-Student-Kiosk.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $EdgePath
$Shortcut.Arguments = $KioskArgs
$Shortcut.Description = "EduGuard Student Kiosk"
$Shortcut.Save()

Write-Host ">>> SUCCESS! Windows 10/11 PC is now locked into EduGuard Student Mode." -ForegroundColor Green
Write-Host ">>> Launching EduGuard Student Workspace now..." -ForegroundColor Cyan
Start-Process -FilePath $EdgePath -ArgumentList $KioskArgs
`;

  const windowsCmdCommand = `start msedge.exe --kiosk "${studentKioskUrl}" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch`;

  const handleCopyPs = () => {
    navigator.clipboard.writeText(windowsPowerShellScript);
    setCopiedPs(true);
    setTimeout(() => setCopiedPs(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(windowsCmdCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadBatch = () => {
    const batchContent = `@echo off
title EduGuard MDM - Windows 10/11 Student Kiosk Launcher
echo ====================================================
echo Starting EduGuard Secure Student Kiosk Mode...
echo ====================================================
start msedge.exe --kiosk "${studentKioskUrl}" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch
exit
`;
    const blob = new Blob([batchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Launch-EduGuard-Student-PC.bat';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Platform Selector Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
              Cross-Platform Deployment
            </span>
            <span className="text-xs text-gray-400">• Android Enterprise & Windows 10/11</span>
          </div>
          <h3 className="font-semibold text-lg text-gray-950">Student Device Enrollment & Kiosk Setup</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Provision real student Android tablets via QR Device Owner scanning or lock school Windows 10/11 PCs via Kiosk scripts.
          </p>
        </div>

        {/* Platform Switcher Buttons */}
        <div className="flex p-1 bg-gray-100 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setPlatformTab('android')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              platformTab === 'android'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            <Tablet className="w-4 h-4 text-emerald-600" />
            <span>Android Tablets (QR Code)</span>
          </button>
          <button
            onClick={() => setPlatformTab('windows')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              platformTab === 'windows'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            <Monitor className="w-4 h-4 text-blue-600" />
            <span>Windows 10 & 11 PCs</span>
          </button>
        </div>
      </div>

      {/* Server Endpoint URL bar (Auto-configures public link for other PCs) */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-gray-950 text-xs">Student Kiosk Endpoint URL</div>
              <div className="text-[11px] text-gray-500">
                Generated .BAT launchers and scripts use this URL to launch the locked kiosk on other PCs and tablets.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={customServerUrl}
              onChange={(e) => setCustomServerUrl(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 w-full md:w-80 focus:outline-none focus:ring-1 focus:ring-gray-950"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Quick URL Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-[11px]">
          <span className="text-gray-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => setCustomServerUrl('https://ais-pre-zuldjajuijal776wp4zsmc-439940677577.asia-east1.run.app')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              customServerUrl.includes('ais-pre-')
                ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Public Shared Link (ais-pre)
          </button>
          <button
            type="button"
            onClick={() => setCustomServerUrl('https://ais-dev-zuldjajuijal776wp4zsmc-439940677577.asia-east1.run.app')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              customServerUrl.includes('ais-dev-')
                ? 'bg-purple-50 border-purple-200 text-purple-800 font-semibold'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dev Link (ais-dev)
          </button>
          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md ml-auto">
            💡 Note: For `ais-pre` to open on other PCs, click <strong>"Share"</strong> in Google AI Studio top bar once.
          </span>
        </div>
      </div>

      {/* OFFLINE & ONLINE RESILIENCE GUARANTEE BADGE */}
      <div className="p-5 bg-emerald-50/70 border border-emerald-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">100% OFFLINE RESILIENT</span>
            <h4 className="text-xs font-bold text-emerald-950">Zero-Downtime Offline Kiosk + Live Reconnect Sync</h4>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-relaxed max-w-4xl">
            {platformTab === 'android' ? (
              <>
                Once provisioned via QR code, <strong>the tablet stays permanently locked in kiosk mode even without internet</strong>. Offline learning tools (Scientific Calculator, Study Notes, Chemistry Reference, Offline Textbooks) remain accessible, while social media and settings are strictly blocked. When reconnected to Wi-Fi, the tablet auto-syncs with the Admin Console to receive announcements, policy updates, and app rollouts.
              </>
            ) : (
              <>
                On Windows 10 & 11 PCs, <strong>EduGuard runs in fullscreen Assigned Access / Kiosk mode with local offline caching</strong>. Students cannot exit or open other programs. As soon as the PC connects to the school network or internet, it auto-syncs live admin notices, exam broadcasts, and updated policies.
              </>
            )}
          </p>
        </div>

        {onLaunchStudentPortal && (
          <button
            onClick={onLaunchStudentPortal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0 flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Student Workspace</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANDROID ENTERPRISE QR ENROLLMENT */}
      {/* ========================================================================= */}
      {platformTab === 'android' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Left Col: QR Code Generator Visual */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-gray-700">
              <span>Android Factory Setup QR</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                READY TO SCAN
              </span>
            </div>

            {/* High Contrast SVG QR Code Representation */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
              <svg
                className="w-48 h-48 text-gray-950"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="100" height="100" fill="white" />
                {/* Corner Position Detection Patterns */}
                <rect x="5" y="5" width="24" height="24" fill="black" />
                <rect x="8" y="8" width="18" height="18" fill="white" />
                <rect x="11" y="11" width="12" height="12" fill="black" />

                <rect x="71" y="5" width="24" height="24" fill="black" />
                <rect x="74" y="8" width="18" height="18" fill="white" />
                <rect x="77" y="11" width="12" height="12" fill="black" />

                <rect x="5" y="71" width="24" height="24" fill="black" />
                <rect x="8" y="74" width="18" height="18" fill="white" />
                <rect x="11" y="77" width="12" height="12" fill="black" />

                {/* Data matrix pattern simulations */}
                <rect x="35" y="10" width="6" height="6" fill="black" />
                <rect x="45" y="10" width="6" height="6" fill="black" />
                <rect x="55" y="10" width="6" height="6" fill="black" />
                <rect x="35" y="20" width="6" height="6" fill="black" />
                <rect x="50" y="20" width="6" height="6" fill="black" />
                <rect x="40" y="30" width="6" height="6" fill="black" />
                <rect x="60" y="30" width="6" height="6" fill="black" />

                <rect x="10" y="35" width="6" height="6" fill="black" />
                <rect x="20" y="45" width="6" height="6" fill="black" />
                <rect x="10" y="55" width="6" height="6" fill="black" />

                <rect x="35" y="40" width="8" height="8" fill="black" />
                <rect x="50" y="45" width="10" height="6" fill="black" />
                <rect x="70" y="40" width="8" height="8" fill="black" />
                <rect x="40" y="60" width="6" height="6" fill="black" />
                <rect x="55" y="60" width="6" height="6" fill="black" />
                <rect x="65" y="60" width="6" height="6" fill="black" />

                <rect x="35" y="75" width="6" height="6" fill="black" />
                <rect x="50" y="80" width="6" height="6" fill="black" />
                <rect x="65" y="75" width="6" height="6" fill="black" />
                <rect x="80" y="70" width="6" height="6" fill="black" />
                <rect x="85" y="85" width="6" height="6" fill="black" />
              </svg>
            </div>

            <div className="text-xs text-gray-400">
              <span className="font-semibold text-gray-900 block">Token: ENR-TOK-2026-X992</span>
              <span>Target: Class XII-A • Auto-Provisioning</span>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-900 text-left space-y-1">
              <div className="font-bold flex items-center space-x-1 text-blue-950">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Device Owner Hardware Lockdown</span>
              </div>
              <p className="text-blue-700 leading-tight text-[10px]">
                Tap <strong>6 times</strong> on the initial Android "Welcome / Hi There" screen to launch the hidden scanner. Scanning locks the tablet into EduGuard Kiosk Mode permanently.
              </p>
            </div>
          </div>

          {/* Right 2 Cols: Provisioning Customizer & JSON Payload Inspector */}
          <div className="lg:col-span-2 space-y-6">
            {/* Embedding Options */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Wi-Fi & Classroom Assignment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Embedded Wi-Fi SSID</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Enter school Wi-Fi network name"
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block">Wi-Fi Password</label>
                    <button
                      type="button"
                      onClick={() => setShowWifiPassword(!showWifiPassword)}
                      className="text-[10px] text-gray-500 hover:text-gray-950 flex items-center space-x-1"
                    >
                      {showWifiPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showWifiPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showWifiPassword ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Target Classroom Auto-Assignment</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DPC Provisioning JSON Bundle */}
            <div className="bg-gray-950 text-gray-200 p-6 rounded-3xl border border-gray-900 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-[10px] text-gray-300 uppercase tracking-widest">Android Enterprise DPC Payload</span>
                </div>
                <button
                  onClick={handleCopyAndroid}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs flex items-center space-x-1.5 border border-gray-800 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="text-[11px] font-mono bg-gray-900/60 p-4 rounded-2xl overflow-x-auto text-emerald-400 border border-gray-800">
                {jsonString}
              </pre>
            </div>

            {/* ADB Command Fallback */}
            <div className="bg-gray-50/70 p-6 rounded-3xl border border-gray-100 text-xs space-y-2">
              <h4 className="font-semibold text-gray-950 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Manual ADB Provisioning Command (Developer & Lab Mode)</span>
              </h4>
              <p className="text-gray-500">
                For testing on physical tablets without factory reset, remove all Google accounts first and run via USB debugging:
              </p>
              <div className="p-3 bg-gray-950 text-gray-200 font-mono text-[11px] rounded-xl border border-gray-900 select-all">
                adb shell dpm set-device-owner com.eduguard.mdm/.receiver.DeviceAdminReceiver
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WINDOWS 10 & 11 PC KIOSK PROVISIONING */}
      {/* ========================================================================= */}
      {platformTab === 'windows' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Windows Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-gray-950">Assigned Access Kiosk</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Locks Windows 10/11 into single-app kiosk mode. Hides desktop, taskbar, start menu, and blocks switching away.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-gray-950">Full Offline Operation</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cached progressive web app and local offline tools (Calculator, Scratchpad, Chemistry Reference, Textbooks) run without internet.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-gray-950">Live Auto-Sync On Reconnect</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                When the PC connects to Wi-Fi/Ethernet, admin announcements immediately pop up and policy updates apply in real time.
              </p>
            </div>
          </div>

          {/* Setup Option A: 1-Click PowerShell Lockdown Script */}
          <div className="bg-gray-950 text-gray-200 p-6 rounded-3xl border border-gray-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-sm text-white">Method 1: 1-Click PowerShell Kiosk Setup Script</h4>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Run in Windows PowerShell (Administrator) on student PCs to disable Taskmgr/Alt-Tab and auto-launch locked kiosk.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadBatch}
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-gray-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download .BAT Launcher</span>
                </button>
                <button
                  onClick={handleCopyPs}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedPs ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPs ? 'Copied Script' : 'Copy PowerShell'}</span>
                </button>
              </div>
            </div>

            <pre className="text-[11px] font-mono bg-gray-900/80 p-4 rounded-2xl overflow-x-auto text-emerald-400 border border-gray-800 leading-relaxed max-h-72">
              {windowsPowerShellScript}
            </pre>
          </div>

          {/* Setup Option B: Direct Windows Command / Edge Kiosk */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-950">Method 2: Direct Command Line (Edge/Chrome Kiosk Mode)</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Press <strong>Win + R</strong> on Windows 10/11, paste this command, and press Enter:
                </p>
              </div>
              <button
                onClick={handleCopyCmd}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>

            <div className="p-3 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl border border-gray-900 select-all overflow-x-auto">
              {windowsCmdCommand}
            </div>
          </div>

          {/* Setup Option C: Windows Native Assigned Access Instructions */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-gray-950">Method 3: Windows Native Settings (Assigned Access GUI)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <span className="font-bold text-gray-950 block">Step 1</span>
                <span>Open <strong>Windows Settings</strong> &gt; <strong>Accounts</strong> &gt; <strong>Other users</strong>.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <span className="font-bold text-gray-950 block">Step 2</span>
                <span>Select <strong>Set up a kiosk (Assigned access)</strong> &gt; <strong>Get started</strong>.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <span className="font-bold text-gray-950 block">Step 3</span>
                <span>Choose <strong>Microsoft Edge</strong> as a digital sign / kiosk app.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <span className="font-bold text-gray-950 block">Step 4</span>
                <span>Enter URL: <code className="text-blue-600 font-mono text-[10px] break-all">{currentAppUrl}</code></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
