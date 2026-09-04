# EduGuard MDM — Enterprise Architecture & Android Enterprise DPC Specification

## 1. System Overview

EduGuard MDM is a centralized School Android Mobile Device Management platform designed specifically for managing school-owned Android tablets and smartphones. The architecture guarantees zero-trust policy enforcement, multi-tenant isolation, real-time command dispatching, and secure student kiosk environments.

```
+-------------------------------------------------------------------------+
|                           ADMIN WEB CONSOLE                             |
|       (Next.js / React 19, Tailwind CSS, TypeScript, Real-Time SSE)     |
+------------------------------------+------------------------------------+
                                     |  HTTPS REST / SSE / WebSockets
                                     v
+-------------------------------------------------------------------------+
|                          BACKEND API & ENGINE                           |
|       (Express.js, TypeScript, PostgreSQL Schema, Token Auth, RBAC)      |
+-------------------+-----------------+-------------------+---------------+
                    |                 |                   |
                    v                 v                   v
            +---------------+ +---------------+  +----------------+
            |  POSTGRES DB  | |  REDIS QUEUE  |  | FCM PUSH RELAY |
            +---------------+ +---------------+  +----------------+
                                                          |
                                                          | Push Wake-Up
                                                          v
+-------------------------------------------------------------------------+
|                  STUDENT ANDROID DEVICE (DEVICE OWNER)                  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 EduGuard DPC (Device Policy Controller)            |  |
|  |                                                                   |  |
|  |  [Policy Engine]  <--->  [Room Encrypted DB]  <---> [Sync Engine] |  |
|  |         |                                              ^          |  |
|  |         v                                              |          |  |
|  |  [Kiosk Launcher]      [UsageStats Monitor]     [Secure Command]  |  |
|  |  - Single/Multi App    - Daily app duration     - Lock / Unlock   |  |
|  |  - Home/Recent lock    - Screen-on telemetry    - Nonce & Replay  |  |
|  |                                                                   |  |
|  |  [VpnService & DNS Web Filter]       [Package Installer DPC]      |  |
|  |  - Local loopback DNS intercept      - Silent managed APK install |  |
|  |  - Domain blocklist / SNI parser     - Managed Google Play bridge |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

## 2. Android Enterprise Management Modes Explained

EduGuard MDM rigorously differentiates between the 3 Android operational tiers:

### A. Fully Managed Device (Device Owner / DPC) — *Primary Target*
- **Provisioning**: Configured exclusively at initial setup (via QR code provisioning, Zero-Touch, NFC, or ADB during setup wizard on a factory-reset device).
- **Enforcement Powers**:
  - `DevicePolicyManager.setLockTaskPackages()`: Unbreakable kiosk mode without home/recent/notification shade escape.
  - `DevicePolicyManager.addUserRestriction()`: Disallow USB debugging, disallow factory reset, disallow Bluetooth/safe boot/keyguard.
  - `DevicePolicyManager.setApplicationHidden()` & `setUninstallBlocked()`: Prevent removing agent or accessing blocked apps.
  - `DevicePolicyManager.setKeyguardDisabled()`: Custom school lock screen.
  - `DevicePolicyManager.reboot()` / `wipeData()`: Remote recovery actions.
  - Silent package deployment without user prompts via `PackageInstaller`.

### B. Profile Owner (Work Profile on BYOD) — *Secondary Target*
- Isolates school apps into a dedicated work container. Personal data remains completely private and unreachable by the school.
- Cannot lock down the entire hardware or system home button of the student's personal phone.

### C. Unmanaged Consumer APK
- Standard APKs cannot silently install other packages, cannot disable factory reset, and can be uninstalled by students unless granted Device Owner privileges during initial provisioning.

## 3. Rule Precedence Architecture
Policy rules follow a deterministic hierarchy:
```
Device Override > Device Group > Class Policy > School Policy > Global Baseline
```
Deny rules take precedence over broad allowances unless an explicit allowlist exception exists.
