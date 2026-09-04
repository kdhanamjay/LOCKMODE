# EduGuard MDM — Android Enterprise Device Enrollment Specification

## 1. Zero-Touch & QR Code Provisioning Payload

When an Android device is factory reset, tapping the welcome screen 6 times launches the enterprise QR scanner. EduGuard MDM generates the following standardized Google Android Enterprise JSON payload:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.eduguard.mdm/.dpc.EduGuardDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://mdm.school.edu/downloads/eduguard-dpc-v1.4.2.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "4a7b2c9e1f8a3d5b7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
  "android.app.extra.PROVISIONING_WIFI_SSID": "School-Enterprise-Secure",
  "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE": "WPA",
  "android.app.extra.PROVISIONING_WIFI_PASSWORD": "SchoolSecurePassphrase2026",
  "android.app.extra.PROVISIONING_WIFI_HIDDEN": false,
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": false,
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "server_url": "https://mdm.school.edu/api",
    "enrollment_token": "ENR-SCH-2026-X892J",
    "school_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "class_id": "a4c28f11-92b0-4f51-b8d9-3e0f98e72301",
    "policy_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "auto_lockdown": true
  }
}
```

## 2. ADB Provisioning (Development & Lab Setup)

For lab testing on developer devices without factory reset:
```bash
# Push APK to device
adb install -r -t app-debug.apk

# Set EduGuard DPC as Device Owner (Only works before any accounts are added)
adb shell dpm set-device-owner com.eduguard.mdm/.dpc.EduGuardDeviceAdminReceiver
```

## 3. Enrollment Lifecycle State Machine

1. **PROVISIONING_START**: Android OS downloads DPC from URL, validates SHA-256 checksum.
2. **DPC_ATTACH**: Android OS grants `DevicePolicyManager` Device Owner role to `EduGuardDeviceAdminReceiver`.
3. **TOKEN_EXCHANGE**: DPC sends `enrollment_token` + device hardware fingerprint (Serial, IMEI, Android ID) to `POST /api/enrollment/register`.
4. **CREDENTIAL_PROVISIONING**: Server generates a device-unique X.509 client certificate and HMAC secret for subsequent authenticated calls.
5. **POLICY_PULL**: DPC retrieves the target policy (immutable JSON payload + server signature).
6. **LOCKTASK_INIT**: Kiosk launcher activates LockTask pinning and starts the student home screen.
