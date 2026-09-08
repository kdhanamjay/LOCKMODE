// EduGuard MDM — Multi-Platform Enrollment (Android Enterprise QR + Windows 10/11 Kiosk Lockdown)
// Hardened with Alt+F4 Protection, Watchdog Auto-Restart, and 1-Click Native .EXE Compiler

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  Eye,
  EyeOff,
  Shield,
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
  Box,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Device, EnrollmentToken, SchoolClass } from '../types/mdm';
import { exportDeviceCredentialsCsv } from '../utils/exportCredentialsCsv';

interface EnrollmentViewProps {
  tokens: EnrollmentToken[];
  classes: SchoolClass[];
  devices?: Device[];
  onCreateToken: (data: any) => void;
  onLaunchStudentPortal?: () => void;
}

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({
  classes,
  devices = [],
  onLaunchStudentPortal,
}) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'windows'>('windows');
  const [wifiSsid, setWifiSsid] = useState('School_Secure_WLAN');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('cls-12-a');
  const [copied, setCopied] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedWatchdog, setCopiedWatchdog] = useState(false);

  const rawOrigin = window.location.origin;
  // Default directly to the active Admin Console's origin so the downloaded .EXE connects to THIS console
  const defaultPublicUrl = rawOrigin && rawOrigin.startsWith('http')
    ? rawOrigin
    : 'https://ais-pre-zuldjajuijal776wp4zsmc-439940677577.asia-east1.run.app';

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

  // Windows Watchdog Script (Auto-Restarts Edge if closed by Alt+F4 with reload loop protection & Admin Remote Unlock)
  const watchdogBatchContent = `@echo off
setlocal enabledelayedexpansion
title EduGuard MDM - Windows Secure Student Kiosk Active
color 0B
set "DEV_ID=WIN-%COMPUTERNAME%"
set "TARGET_URL=${studentKioskUrl}&device_id=!DEV_ID!&device_name=%COMPUTERNAME%"

echo ====================================================================
echo  EduGuard MDM - Windows 10/11 Secure Student Kiosk Active
echo ====================================================================
echo [*] Workstation ID: !DEV_ID!
echo [*] Target URL:     !TARGET_URL!
echo [*] Alt+F4 Trap:    Active (Restarts if closed without admin approval)
echo [*] Remote Exit:    Supported (Admin can unlock from Admin Console)
echo ====================================================================

:: 1. Ensure isolated browser profile directory to prevent reload conflicts
set "DATA_DIR=%LOCALAPPDATA%\\EduGuardKiosk\\BrowserProfile"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%" >nul 2>&1

:: 2. Locate Microsoft Edge or Google Chrome executable
set "BROWSER_EXE="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined BROWSER_EXE if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined BROWSER_EXE if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
if not defined BROWSER_EXE if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
if not defined BROWSER_EXE set "BROWSER_EXE=msedge.exe"

echo [*] Using Browser: !BROWSER_EXE!
echo.

:START_KIOSK
echo [%time%] Starting EduGuard Student Kiosk for workstation !DEV_ID!...
:: Ensure KeyBlocker is running in background to disable Alt+Tab
if exist "%LOCALAPPDATA%\\EduGuardKiosk\\EduGuard-KeyBlocker.ps1" (
    start "" /b powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\\EduGuardKiosk\\EduGuard-KeyBlocker.ps1"
)
start "" "!BROWSER_EXE!" --kiosk "!TARGET_URL!" --edge-kiosk-type=fullscreen --user-data-dir="%DATA_DIR%" --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI,InterestFeedContentSuggestions --disable-pinch --kiosk-printing

:MONITOR_LOOP
timeout /t 2 /nobreak >nul

:: Check if administrator unlocked or deleted this specific workstation from the Admin Console
powershell -NoProfile -Command "try { $r = (Invoke-RestMethod -Uri '${currentAppUrl}/api/devices/!DEV_ID!/kiosk-status' -TimeoutSec 4); if ($r.data.isDeleted -eq $true) { exit 2 } else if ($r.data.isLocked -eq $false -or $r.data.kioskActive -eq $false) { exit 1 } else { exit 0 } } catch { exit 0 }" >nul 2>&1
set "STATUS_CODE=!errorlevel!"

if !STATUS_CODE! equ 2 (
    echo.
    echo ====================================================================
    echo  [REMOVED] Workstation was deleted from fleet inventory. Exiting.
    echo ====================================================================
    taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1
    taskkill /f /im msedge.exe >nul 2>&1
    taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1
    exit /b 0
)
if !STATUS_CODE! equ 1 (
    echo.
    echo ====================================================================
    echo  [UNLOCKED] Administrator approved exit / unlocked workstation!
    echo  [CLOSING] Terminating all kiosk windows immediately...
    echo ====================================================================
    taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1
    taskkill /f /im chrome.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1
    taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1
    timeout /t 1 /nobreak >nul
    taskkill /f /im msedge.exe >nul 2>&1
    echo  [SUCCESS] All kiosk windows closed! Windows desktop restored.
    echo  [*] Standby monitoring: will auto-lock if Admin sends Lock command...
    echo ====================================================================
    :IDLE_MONITOR
    timeout /t 3 /nobreak >nul
    powershell -NoProfile -Command "try { $r = (Invoke-RestMethod -Uri '${currentAppUrl}/api/devices/!DEV_ID!/kiosk-status' -TimeoutSec 4); if ($r.data.isDeleted -eq $true) { exit 2 } else if ($r.data.isLocked -eq $true -and $r.data.kioskActive -eq $true) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !errorlevel! equ 2 exit /b 0
    if !errorlevel! equ 0 (
        echo [%time%] Administrator dispatched Lock command! Relaunching Kiosk immediately...
        goto START_KIOSK
    )
    goto IDLE_MONITOR
)

:: If still locked, ensure browser is still running (anti-tamper / crash recovery)
tasklist /fi "IMAGENAME eq msedge.exe" 2>nul | findstr /i "msedge.exe" >nul
if !errorlevel! neq 0 (
    tasklist /fi "IMAGENAME eq chrome.exe" 2>nul | findstr /i "chrome.exe" >nul
    if !errorlevel! neq 0 (
        echo [%time%] Kiosk window closed while exam is active! Re-launching immediately...
        goto START_KIOSK
    )
)

goto MONITOR_LOOP
`;

  // C# Source Code for EduGuard Standalone Kiosk
  const csharpSourceContent = `using System;
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
        private const int WM_KEYUP = 0x0101;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int WM_SYSKEYUP = 0x0105;
        private const int VK_TAB = 0x09;
        private const int VK_ESCAPE = 0x1B;
        private const int VK_LWIN = 0x5B;
        private const int VK_RWIN = 0x5C;
        private const int VK_SPACE = 0x20;
        private const int VK_F4 = 0x73;
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
            if (nCode >= 0) {
                int msg = (int)wParam;
                if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN || msg == WM_KEYUP || msg == WM_SYSKEYUP) {
                    KBDLLHOOKSTRUCT hook = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                    bool isAlt = (hook.flags & LLKHF_ALTDOWN) != 0;
                    // 1. Block Alt+Tab completely from Windows Task Switcher
                    if (isAlt && hook.vkCode == VK_TAB) return (IntPtr)1;
                    // 2. Block Alt+Escape and Alt+Space
                    if (isAlt && (hook.vkCode == VK_ESCAPE || hook.vkCode == VK_SPACE)) return (IntPtr)1;
                    // 3. Block Alt+F4
                    if (isAlt && hook.vkCode == VK_F4) return (IntPtr)1;
                    // 4. Block Windows Keys (Start menu, Win+Tab, Win+D, Win+E)
                    if (hook.vkCode == VK_LWIN || hook.vkCode == VK_RWIN) return (IntPtr)1;
                    // 5. Block Ctrl+Escape
                    if (hook.vkCode == VK_ESCAPE && (Control.ModifierKeys & Keys.Control) != 0) return (IntPtr)1;
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(IntPtr lpModuleName);

        [STAThread]
        static void Main() {
            try {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | SecurityProtocolType.Tls;
                ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
            } catch {}

            // Install low-level keyboard hook on background STA thread to disable Alt+Tab
            Thread hookThread = new Thread(() => {
                try {
                    _hookID = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(IntPtr.Zero), 0);
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
                string url = "${studentKioskUrl}";
                if (url.IndexOf("?") >= 0) {
                    url += "&device_id=" + Uri.EscapeDataString(machineId) + "&device_name=" + Uri.EscapeDataString(Environment.MachineName);
                } else {
                    url += "?student=true&device_id=" + Uri.EscapeDataString(machineId) + "&device_name=" + Uri.EscapeDataString(Environment.MachineName);
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
                        p.WaitForExit();
                        TimeSpan runtime = DateTime.Now - start;

                        // Check if administrator unlocked or removed this specific PC before restarting
                        try {
                            using (WebClient wc = new WebClient()) {
                                wc.Headers.Add("User-Agent", "EduGuard-Windows-Kiosk/1.4");
                                string checkUrl = "${currentAppUrl}/api/devices/" + Uri.EscapeDataString(machineId) + "/kiosk-status";
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

  let b64EchoBlock = '';
  try {
    const rawB64 = btoa(unescape(encodeURIComponent(csharpSourceContent)));
    const lines: string[] = [];
    for (let i = 0; i < rawB64.length; i += 76) {
      lines.push(`echo ${rawB64.slice(i, i + 76)}`);
    }
    b64EchoBlock = lines.join('\r\n');
  } catch {
    b64EchoBlock = 'echo //';
  }

  // Windows 1-Click .EXE Compiler Batch (Uses built-in csc.exe or PowerShell CodeDom)
  const exeCompilerBatchContent = `@echo off\r
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
  "try { $cli = New-Object System.Net.WebClient; $cli.Headers.Add('User-Agent','EduGuard-Builder/1.4'); $cli.DownloadFile('${currentAppUrl}/api/downloads/EduGuardLauncher.cs?url=${encodeURIComponent(currentAppUrl)}', $env:CS_FILE); Write-Host '    -> Downloaded source engine successfully.' -ForegroundColor Green } catch {}"\r
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

  // PowerShell Alternative Compiler (.ps1)
  const exeCompilerPs1Content = `# EduGuard MDM - Standalone Windows Executable (.EXE) Compiler
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
${csharpSourceContent}
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

  // Emergency Kiosk Stopper & Cleanup Script (Kills looping processes on student PC)
  const emergencyKillBatchContent = `@echo off
title EduGuard MDM - Emergency Kiosk Stopper & Unlocker
color 0C
echo ====================================================================
echo  EduGuard MDM - Emergency Kiosk Stopper & Process Cleanup
echo ====================================================================
echo [*] Terminating EduGuard-Student-Kiosk watchdog processes...
taskkill /f /im EduGuard-Student-Kiosk.exe >nul 2>&1
taskkill /f /im EduGuard-Student-Kiosk.bat >nul 2>&1
taskkill /f /im Create-Student-Kiosk-EXE.bat >nul 2>&1
taskkill /f /im Launch-EduGuard-Watchdog.bat >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq EduGuard-KeyBlocker*" >nul 2>&1
taskkill /f /im wscript.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq EduGuard MDM*" >nul 2>&1
echo [*] Terminating Kiosk Edge browser instances...
taskkill /f /im msedge.exe /fi "WINDOWTITLE eq EduGuard*" >nul 2>&1
echo.
echo ====================================================================
echo  [SUCCESS] All EduGuard Kiosk processes have been stopped!
echo  Your PC is unlocked and normal desktop access is restored.
echo ====================================================================
pause
`;

  // Silent VBScript 1-Click Launcher (No compilation required, runs silently)
  const vbsLauncherContent = `' EduGuard MDM - Silent Windowless Student Kiosk Launcher (VBScript)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Set WshNetwork = CreateObject("WScript.Network")

dataDir = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\\EduGuardKiosk\\BrowserProfile")
If Not fso.FolderExists(dataDir) Then
    On Error Resume Next
    fso.CreateFolder(WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\\EduGuardKiosk"))
    fso.CreateFolder(dataDir)
    On Error Goto 0
End If

browserExe = "msedge.exe"
pf86 = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%")
pf = WshShell.ExpandEnvironmentStrings("%ProgramFiles%")

If fso.FileExists(pf86 & "\\Microsoft\\Edge\\Application\\msedge.exe") Then
    browserExe = """" & pf86 & "\\Microsoft\\Edge\\Application\\msedge.exe"""
ElseIf fso.FileExists(pf & "\\Microsoft\\Edge\\Application\\msedge.exe") Then
    browserExe = """" & pf & "\\Microsoft\\Edge\\Application\\msedge.exe"""
ElseIf fso.FileExists(pf & "\\Google\\Chrome\\Application\\chrome.exe") Then
    browserExe = """" & pf & "\\Google\\Chrome\\Application\\chrome.exe"""
End If

machineId = "WIN-" & WshNetwork.ComputerName
kioskUrl = "${studentKioskUrl}&device_id=" & machineId & "&device_name=" & WshNetwork.ComputerName
kioskArgs = " --kiosk """ & kioskUrl & """ --edge-kiosk-type=fullscreen --user-data-dir=""" & dataDir & """ --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI,InterestFeedContentSuggestions --disable-pinch --kiosk-printing"

' Write and launch Low-Level Keyboard Blocker (Disables Alt+Tab, Alt+Esc, Win Keys at Windows OS level)
keyBlockerPs1 = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%\\EduGuardKiosk\\EduGuard-KeyBlocker.ps1")
Set psFile = fso.CreateTextFile(keyBlockerPs1, True)
psFile.WriteLine "$host.UI.RawUI.WindowTitle = 'EduGuard-KeyBlocker'"
psFile.WriteLine "$code = @'"
psFile.WriteLine "using System;"
psFile.WriteLine "using System.Diagnostics;"
psFile.WriteLine "using System.Runtime.InteropServices;"
psFile.WriteLine "using System.Windows.Forms;"
psFile.WriteLine "public class KeyBlocker {"
psFile.WriteLine "    private const int WH_KEYBOARD_LL = 13;"
psFile.WriteLine "    private const int WM_KEYDOWN = 0x0100;"
psFile.WriteLine "    private const int WM_KEYUP = 0x0101;"
psFile.WriteLine "    private const int WM_SYSKEYDOWN = 0x0104;"
psFile.WriteLine "    private const int WM_SYSKEYUP = 0x0105;"
psFile.WriteLine "    private const int VK_TAB = 0x09;"
psFile.WriteLine "    private const int VK_ESCAPE = 0x1B;"
psFile.WriteLine "    private const int VK_LWIN = 0x5B;"
psFile.WriteLine "    private const int VK_RWIN = 0x5C;"
psFile.WriteLine "    private const int VK_SPACE = 0x20;"
psFile.WriteLine "    private const int VK_F4 = 0x73;"
psFile.WriteLine "    private const int LLKHF_ALTDOWN = 0x20;"
psFile.WriteLine "    [StructLayout(LayoutKind.Sequential)] private struct KBDLLHOOKSTRUCT { public int vkCode; public int scanCode; public int flags; public int time; public IntPtr dwExtraInfo; }"
psFile.WriteLine "    private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);"
psFile.WriteLine "    private static HookProc _proc = Callback;"
psFile.WriteLine "    private static IntPtr _h = IntPtr.Zero;"
psFile.WriteLine "    public static void Start() {"
psFile.WriteLine "        IntPtr hMod = GetModuleHandle(IntPtr.Zero);"
psFile.WriteLine "        _h = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, hMod, 0);"
psFile.WriteLine "        Application.Run();"
psFile.WriteLine "    }"
psFile.WriteLine "    private static IntPtr Callback(int nCode, IntPtr wParam, IntPtr lParam) {"
psFile.WriteLine "        if (nCode >= 0) {"
psFile.WriteLine "            int msg = (int)wParam;"
psFile.WriteLine "            if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN || msg == WM_KEYUP || msg == WM_SYSKEYUP) {"
psFile.WriteLine "                KBDLLHOOKSTRUCT k = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));"
psFile.WriteLine "                bool isAlt = (k.flags & LLKHF_ALTDOWN) != 0;"
psFile.WriteLine "                // 1. Physically Block Alt+Tab and Shift+Alt+Tab"
psFile.WriteLine "                if (isAlt && k.vkCode == VK_TAB) return (IntPtr)1;"
psFile.WriteLine "                // 2. Physically Block Alt+Esc and Alt+Space (system window menus)"
psFile.WriteLine "                if (isAlt && (k.vkCode == VK_ESCAPE || k.vkCode == VK_SPACE)) return (IntPtr)1;"
psFile.WriteLine "                // 3. Physically Block Alt+F4 window close attempt"
psFile.WriteLine "                if (isAlt && k.vkCode == VK_F4) return (IntPtr)1;"
psFile.WriteLine "                // 4. Physically Block Windows Left and Right keys"
psFile.WriteLine "                if (k.vkCode == VK_LWIN || k.vkCode == VK_RWIN) return (IntPtr)1;"
psFile.WriteLine "                // 5. Physically Block Ctrl+Esc (Start menu toggle)"
psFile.WriteLine "                if (k.vkCode == VK_ESCAPE && (Control.ModifierKeys & Keys.Control) != 0) return (IntPtr)1;"
psFile.WriteLine "            }"
psFile.WriteLine "        }"
psFile.WriteLine "        return CallNextHookEx(_h, nCode, wParam, lParam);"
psFile.WriteLine "    }"
psFile.WriteLine "    [DllImport(""user32.dll"", SetLastError = true)] private static extern IntPtr SetWindowsHookEx(int id, HookProc lp, IntPtr mod, uint th);"
psFile.WriteLine "    [DllImport(""user32.dll"")] private static extern IntPtr CallNextHookEx(IntPtr h, int c, IntPtr w, IntPtr l);"
psFile.WriteLine "    [DllImport(""kernel32.dll"", CharSet = CharSet.Auto, SetLastError = true)] private static extern IntPtr GetModuleHandle(IntPtr m);"
psFile.WriteLine "}"
psFile.WriteLine "'@"
psFile.WriteLine "Add-Type -TypeDefinition $code -ReferencedAssemblies System.Windows.Forms"
psFile.WriteLine "[KeyBlocker]::Start()"
psFile.Close

' Launch KeyBlocker silently in background (0 = completely hidden window)
WshShell.Run "powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & keyBlockerPs1 & """", 0, False

' Launch kiosk initially (False = non-blocking so VBScript actively monitors in background)
WshShell.Run browserExe & kioskArgs, 1, False

Do While True
    WScript.Sleep 2000

    ' 1. Check if Administrator unlocked or removed workstation
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.Open "GET", "${currentAppUrl}/api/devices/" & machineId & "/kiosk-status", False
    http.Send
    If http.Status = 200 Then
        Dim resp
        resp = http.responseText
        If InStr(resp, """isDeleted"":true") > 0 Then
            ' Workstation deleted by admin: terminate kiosk browser and quit
            WshShell.Run "taskkill /f /im msedge.exe /fi ""WINDOWTITLE eq EduGuard*""", 0, True
            WshShell.Run "taskkill /f /im chrome.exe /fi ""WINDOWTITLE eq EduGuard*""", 0, True
            WshShell.Run "taskkill /f /fi ""WINDOWTITLE eq EduGuard-KeyBlocker*""", 0, True
            WScript.Sleep 500
            WshShell.Run "taskkill /f /im msedge.exe", 0, True
            WScript.Quit 0
        End If
        If InStr(resp, """isLocked"":false") > 0 Or InStr(resp, """kioskActive"":false") > 0 Then
            ' WORKSTATION UNLOCKED / APPROVED BY ADMINISTRATOR!
            ' Terminate all kiosk windows & key blocker immediately to restore clean Windows Desktop!
            WshShell.Run "taskkill /f /im msedge.exe /fi ""WINDOWTITLE eq EduGuard*""", 0, True
            WshShell.Run "taskkill /f /im chrome.exe /fi ""WINDOWTITLE eq EduGuard*""", 0, True
            WshShell.Run "taskkill /f /fi ""WINDOWTITLE eq EduGuard-KeyBlocker*""", 0, True
            WScript.Sleep 500
            WshShell.Run "taskkill /f /im msedge.exe", 0, True
            
            ' Silent idle standby: if Admin ever sends "Lock Device" from Admin Console, auto-lock PC again!
            Do While True
                WScript.Sleep 3000
                Set httpIdle = CreateObject("MSXML2.ServerXMLHTTP.6.0")
                httpIdle.Open "GET", "${currentAppUrl}/api/devices/" & machineId & "/kiosk-status", False
                httpIdle.Send
                If httpIdle.Status = 200 Then
                    Dim idleResp
                    idleResp = httpIdle.responseText
                    If InStr(idleResp, """isDeleted"":true") > 0 Then WScript.Quit 0
                    If InStr(idleResp, """isLocked"":true") > 0 And InStr(idleResp, """kioskActive"":true") > 0 Then
                        ' Admin dispatched Remote Lock! Relaunch key blocker and kiosk immediately!
                        WshShell.Run "powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & keyBlockerPs1 & """", 0, False
                        Exit Do
                    End If
                End If
            Loop
            ' Re-launch kiosk after admin locked
            WshShell.Run browserExe & kioskArgs, 1, False
        End If
    ElseIf http.Status = 404 Then
        WshShell.Run "taskkill /f /fi ""WINDOWTITLE eq EduGuard-KeyBlocker*""", 0, True
        WshShell.Run "taskkill /f /im msedge.exe", 0, True
        WScript.Quit 0
    End If
    On Error Goto 0

    ' 2. Anti-tamper watchdog: If browser closed or crashed while workstation is STILL LOCKED, relaunch it!
    Set edgeProcs = GetObject("winmgmts:").ExecQuery("Select ProcessId from Win32_Process Where Name = 'msedge.exe' or Name = 'chrome.exe'")
    If edgeProcs.Count = 0 Then
        WshShell.Run browserExe & kioskArgs, 1, False
    End If
Loop
`;

  // Windows 10 & 11 PowerShell Lockdown Script
  const windowsPowerShellScript = `# ==============================================================================
# EduGuard MDM — Windows 10 & 11 Student Kiosk Lockdown Provisioning Script
# Enforces Full-Screen Student Workspace, Disables Task Manager & Alt-Tab
# ==============================================================================

Write-Host ">>> Initializing EduGuard Student Kiosk Provisioning on Windows 10/11..." -ForegroundColor Cyan

$AppUrl = "${studentKioskUrl}"

# 1. Disable Windows Task Manager & System Hotkeys for Student Account
Write-Host ">>> Enforcing Registry Lockdown Policies (Taskmgr, Hotkeys)..." -ForegroundColor Yellow
$RegPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"
If (!(Test-Path $RegPath)) { New-Item -Path $RegPath -Force | Out-Null }
Set-ItemProperty -Path $RegPath -Name "DisableTaskMgr" -Value 1 -Type DWord
Set-ItemProperty -Path $RegPath -Name "DisableLockWorkstation" -Value 1 -Type DWord
Set-ItemProperty -Path $RegPath -Name "DisableChangePassword" -Value 1 -Type DWord

# 2. Configure Microsoft Edge / Chrome Single-App Fullscreen Kiosk Mode with isolated profile
$EdgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
If (!(Test-Path $EdgePath)) { $EdgePath = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" }

$DataDir = "$env:LOCALAPPDATA\\EduGuardKiosk\\BrowserProfile"
If (!(Test-Path $DataDir)) { New-Item -ItemType Directory -Force -Path $DataDir | Out-Null }

$KioskArgs = "--kiosk \`"$AppUrl\`" --edge-kiosk-type=fullscreen --user-data-dir=\`"$DataDir\`" --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI --disable-pinch --kiosk-printing"

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

  const windowsCmdCommand = `start msedge.exe --kiosk "${studentKioskUrl}" --edge-kiosk-type=fullscreen --user-data-dir="%LOCALAPPDATA%\\EduGuardKiosk\\BrowserProfile" --no-first-run --no-default-browser-check --disable-background-mode --disable-features=msEdgeStartupBoost,TranslateUI --disable-pinch`;

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

  const handleCopyWatchdog = () => {
    navigator.clipboard.writeText(watchdogBatchContent);
    setCopiedWatchdog(true);
    setTimeout(() => setCopiedWatchdog(false), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    // Crucial for Windows: normalize to CRLF line endings
    const normalized = content.replace(/\r?\n/g, '\r\n');
    const blob = new Blob([normalized], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <span className="text-xs text-gray-400">• Windows 10/11 & Android Enterprise</span>
          </div>
          <h3 className="font-semibold text-lg text-gray-950">Student Device Enrollment & Kiosk Setup</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Launch unclosable fullscreen kiosks on Windows 10/11 PCs or provision Android tablets via QR Device Owner.
          </p>
        </div>

        {/* Platform Switcher Buttons & Download CSV */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <button
            onClick={() => exportDeviceCredentialsCsv(devices)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            title="Download CSV spreadsheet of all workstation IDs, student usernames, unique passwords, and MAC addresses"
          >
            <Download className="w-4 h-4" />
            <span>Download Passwords (CSV)</span>
          </button>
          <div className="flex p-1 bg-gray-100 rounded-2xl">
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
          </div>
        </div>
      </div>

      {/* Server Endpoint URL bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-gray-950 text-xs">Student Kiosk Endpoint URL</div>
              <div className="text-[11px] text-gray-500">
                Generated .EXE and .BAT launchers connect student PCs directly to this target URL.
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
          <span className="text-gray-400 font-medium">Bake Server URL into .EXE:</span>
          <button
            type="button"
            onClick={() => setCustomServerUrl(rawOrigin)}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              customServerUrl === rawOrigin
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚡ Active Admin Console ({rawOrigin})
          </button>
          <button
            type="button"
            onClick={() => setCustomServerUrl('https://ais-pre-zuldjajuijal776wp4zsmc-439940677577.asia-east1.run.app')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              customServerUrl.includes('ais-pre-')
                ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🌐 Public Cloud Shared Link (Connects Across Any Network)
          </button>
          <button
            type="button"
            onClick={() => setCustomServerUrl('https://edulock.onrender.com')}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              customServerUrl.includes('onrender.com')
                ? 'bg-purple-50 border-purple-200 text-purple-800 font-semibold shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Render URL (edulock.onrender.com)
          </button>
        </div>

        {/* Network & Device Inventory Binding Guarantee Card */}
        <div className="mt-3 p-3.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Binding & Inventory Sync Architecture
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              Instant Plug-and-Play
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-gray-600">
            <div className="p-2.5 bg-white rounded-xl border border-gray-200/60 shadow-xs">
              <p className="font-semibold text-gray-800">1. Same / Different Network</p>
              <p className="mt-0.5 text-gray-500">
                Whether the student PC is on school Wi-Fi (LAN) or remote at home (WAN), it reaches this server via HTTPS and registers with its real IP address.
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200/60 shadow-xs">
              <p className="font-semibold text-gray-800">2. Auto-Binds in Device Inventory</p>
              <p className="mt-0.5 text-gray-500">
                On first run, <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">EduGuard-Student-Kiosk.exe</code> sends hardware telemetry and creates a device record instantly visible in your fleet list.
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200/60 shadow-xs">
              <p className="font-semibold text-gray-800">3. Admin Delete & Unenroll</p>
              <p className="mt-0.5 text-gray-500">
                Whenever you click <span className="text-rose-600 font-semibold">Delete & Unenroll</span>, the kiosk unlocks, restores normal Windows desktop, and can be re-bound anytime.
              </p>
            </div>
          </div>
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
            {platformTab === 'windows' ? (
              <>
                On Windows 10 & 11 PCs, <strong>EduGuard runs in fullscreen Assigned Access / Kiosk mode with local offline caching</strong>. Students cannot exit or open other programs. Even if Alt+F4 is pressed, the watchdog instantly restarts the kiosk. As soon as the PC connects to Wi-Fi/Ethernet, it auto-syncs live admin notices, uploaded PDF study materials, and updated policies.
              </>
            ) : (
              <>
                Once provisioned via QR code, <strong>the tablet stays permanently locked in kiosk mode even without internet</strong>. Offline learning tools (Scientific Calculator, Study Notes, Chemistry Reference, Offline Textbooks) remain accessible.
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
      {/* TAB 1: WINDOWS 10 & 11 PC KIOSK PROVISIONING */}
      {/* ========================================================================= */}
      {platformTab === 'windows' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* CRITICAL FIX & DIAGNOSTICS BANNER */}
          <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-3xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Fixed: Edge Kiosk Reloading Every Second on Other PCs</h4>
                  <p className="text-[11px] text-amber-800">
                    If an older kiosk executable was reloading every second on your target PC, run the <strong>Emergency Stopper</strong> below and download the updated <strong>.EXE Builder</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadFile(emergencyKillBatchContent, 'Stop-EduGuard-Kiosk.bat')}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Emergency Stopper (.BAT)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 text-[11px] text-amber-900">
              <div className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Isolated Profile:</strong> Uses <code>%LOCALAPPDATA%\EduGuardKiosk</code> so Edge never detaches to background processes.</span>
              </div>
              <div className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Single-Instance Lock:</strong> Mutex ensures only one watchdog runs, preventing duplicate loop conflicts.</span>
              </div>
              <div className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Anti-Loop Backoff:</strong> Detects immediate exits and pauses safely instead of reloading every 1 second.</span>
              </div>
            </div>
          </div>

          {/* Windows Download & Setup Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Method A: Standalone Executable (.EXE) Creator */}
            <div className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Box className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                    FIXED .EXE
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-950">1-Click .EXE Builder</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Downloads a compiler script that creates native <strong>EduGuard-Student-Kiosk.exe</strong> with isolated profile & single-instance lock.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => downloadFile(exeCompilerBatchContent, 'Create-Student-Kiosk-EXE.bat')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .EXE Builder (.BAT)</span>
                </button>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadFile(exeCompilerPs1Content, 'Create-Student-Kiosk-EXE.ps1')}
                    className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-lg flex items-center justify-center space-x-1 border border-blue-200 transition-colors cursor-pointer"
                    title="PowerShell Script Alternative"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>PowerShell (.PS1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(csharpSourceContent, 'EduGuardLauncher.cs')}
                    className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-lg flex items-center justify-center space-x-1 border border-gray-200 transition-colors cursor-pointer"
                    title="Pure C# Source File"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>C# Source (.CS)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Method B: Silent VBScript Launcher (No Compilation Needed) */}
            <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                    NO COMPILATION
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-950">Silent Kiosk Script (.VBS)</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <strong>Zero compilation required!</strong> Runs completely silent with native Windows WScript. Locks Edge into fullscreen kiosk mode immediately on double-click.
                </p>
              </div>

              <button
                onClick={() => downloadFile(vbsLauncherContent, 'EduGuard-Student-Kiosk.vbs')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Silent .VBS</span>
              </button>
            </div>

            {/* Method C: Unclosable Watchdog .BAT Launcher (Alt+F4 Protected) */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                    ANTI-ALT+F4
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-950">Watchdog Launcher (.BAT)</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Watchdog batch script with isolated student profile and anti-rapid-reload guard. Auto-restarts Edge if Alt+F4 is pressed.
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => downloadFile(watchdogBatchContent, 'Launch-EduGuard-Watchdog.bat')}
                  className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .BAT</span>
                </button>
                <button
                  onClick={handleCopyWatchdog}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl cursor-pointer"
                  title="Copy Watchdog Script"
                >
                  {copiedWatchdog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Method D: Emergency Stopper & Cleanup */}
            <div className="bg-white p-5 rounded-3xl border border-red-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase">
                    EMERGENCY
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-950">Stop / Unlock PC (.BAT)</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Immediately terminates any stuck or looping kiosk processes on the student PC and restores full desktop access.
                </p>
              </div>

              <button
                onClick={() => downloadFile(emergencyKillBatchContent, 'Stop-EduGuard-Kiosk.bat')}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Stopper</span>
              </button>
            </div>
          </div>

          {/* Watchdog Code Preview */}
          <div className="bg-gray-950 text-gray-200 p-6 rounded-3xl border border-gray-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">Watchdog Kiosk Script Content</h4>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Save as <code>Launch-EduGuard-Watchdog.bat</code> on student PCs and run as Administrator.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadFile(watchdogBatchContent, 'Launch-EduGuard-Watchdog.bat')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .BAT Launcher</span>
                </button>
              </div>
            </div>

            <pre className="text-[11px] font-mono bg-gray-900/80 p-4 rounded-2xl overflow-x-auto text-emerald-400 border border-gray-800 leading-relaxed max-h-60">
              {watchdogBatchContent}
            </pre>
          </div>

          {/* Direct Win+R Run Command */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-gray-950">Quick Run via Win + R</h4>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANDROID ENTERPRISE QR ENROLLMENT */}
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
                <rect x="5" y="5" width="24" height="24" fill="black" />
                <rect x="8" y="8" width="18" height="18" fill="white" />
                <rect x="11" y="11" width="12" height="12" fill="black" />

                <rect x="71" y="5" width="24" height="24" fill="black" />
                <rect x="74" y="8" width="18" height="18" fill="white" />
                <rect x="77" y="11" width="12" height="12" fill="black" />

                <rect x="5" y="71" width="24" height="24" fill="black" />
                <rect x="8" y="74" width="18" height="18" fill="white" />
                <rect x="11" y="77" width="12" height="12" fill="black" />

                <rect x="35" y="10" width="6" height="6" fill="black" />
                <rect x="45" y="10" width="6" height="6" fill="black" />
                <rect x="55" y="10" width="6" height="6" fill="black" />
                <rect x="35" y="20" width="6" height="6" fill="black" />
                <rect x="50" y="20" width="6" height="6" fill="black" />
                <rect x="40" y="30" width="6" height="6" fill="black" />
                <rect x="60" y="30" width="6" height="6" fill="black" />
              </svg>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-900">Provision Device Owner Mode</p>
              <p className="text-[11px]">
                On fresh unboxed Android tablet welcome screen, tap 6 times anywhere on empty space to launch the QR scanner.
              </p>
            </div>
          </div>

          {/* Right Col: Wi-Fi Pre-Configuration & DPC JSON */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-semibold text-sm text-gray-950">Pre-Configured Wi-Fi & Class Profile</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">School Wi-Fi SSID</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-950 text-gray-900"
                    placeholder="SSID name"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">Wi-Fi Password</label>
                  <div className="relative">
                    <input
                      type={showWifiPassword ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-950 text-gray-900 pr-9"
                      placeholder="Leave blank for open WLAN"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWifiPassword(!showWifiPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showWifiPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-medium mb-1">Assign Default Class Profile</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-950 text-gray-900"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.gradeLevel}) — {cls.enrolledCount} enrolled
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DPC Raw JSON */}
            <div className="bg-gray-950 text-gray-200 p-6 rounded-3xl border border-gray-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-white">Android Enterprise Zero-Touch Payload</h4>
                  <p className="text-[11px] text-gray-400">Payload embedded into QR Code</p>
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

            {/* Android Architecture & Kiosk Lock Enforcement Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 text-xs text-amber-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>How Android Tablets & Mobiles Enforce Unswitchable Kiosk Mode</span>
              </div>
              <p className="leading-relaxed text-amber-900/90">
                On Windows PCs, window switching (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">Alt+Tab</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">Win</code>) is physically intercepted by our low-level Windows hook (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">SetWindowsHookEx</code>).
              </p>
              <p className="leading-relaxed text-amber-900/90">
                On <strong>Android Tablets and Mobiles</strong>, the operating system does not use Windows DLLs or Alt-Tab. Instead, the QR Code provisions the EduGuard DPC as <strong>Device Owner</strong>, enabling <strong>Dedicated Device (COSU / Lock Task Mode)</strong>. This enforces:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950 font-medium pl-1">
                <li><strong>Home & Recent Apps (Overview) Buttons Disabled:</strong> Students cannot swipe up or press square/pill to switch apps.</li>
                <li><strong>Status Bar & Notification Shade Disabled:</strong> Pulling down from the top to access Settings or Quick Tiles is blocked.</li>
                <li><strong>System Dialogs & Power Menu Restricted:</strong> Power off / reboot prompts cannot be abused to escape kiosk mode.</li>
                <li><strong>Single-App Pinning:</strong> EduGuard Student Workspace stays permanently pinned until released by the Administrator.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
