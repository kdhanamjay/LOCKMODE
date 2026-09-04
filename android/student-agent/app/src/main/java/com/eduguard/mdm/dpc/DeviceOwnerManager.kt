package com.eduguard.mdm.dpc

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.os.UserManager
import android.util.Log
import java.io.File
import java.io.FileInputStream

/**
 * DeviceOwnerManager
 * Wrapper around Android Enterprise DevicePolicyManager APIs.
 * Enforces hardware restrictions, silent app installations, lock screens, and kiosk rules.
 */
class DeviceOwnerManager(private val context: Context) {

    private val dpm: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent: ComponentName =
        EduGuardDeviceAdminReceiver.getComponentName(context)

    val isDeviceOwner: Boolean
        get() = dpm.isDeviceOwnerApp(context.packageName)

    val isProfileOwner: Boolean
        get() = dpm.isProfileOwnerApp(context.packageName)

    /**
     * Remotely lock the device screen immediately
     */
    fun lockDevice(message: String? = null) {
        if (!isDeviceOwner) {
            Log.w("DeviceOwnerManager", "Cannot lock: Not a Device Owner")
            return
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && message != null) {
                dpm.setDeviceOwnerLockScreenInfo(adminComponent, message)
            }
            dpm.lockNow()
            Log.i("DeviceOwnerManager", "Device locked successfully.")
        } catch (e: Exception) {
            Log.e("DeviceOwnerManager", "Failed to lock device", e)
        }
    }

    /**
     * Unlock / Clear lock screen banner
     */
    fun clearLockScreenMessage() {
        if (isDeviceOwner && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            dpm.setDeviceOwnerLockScreenInfo(adminComponent, null)
        }
    }

    /**
     * Set the list of allowed packages permitted in Kiosk / LockTask mode
     */
    fun updateLockTaskPackages(allowedPackages: List<String>) {
        if (!isDeviceOwner) return
        try {
            val fullList = (allowedPackages + context.packageName).distinct().toTypedArray()
            dpm.setLockTaskPackages(adminComponent, fullList)
            Log.i("DeviceOwnerManager", "Updated LockTask packages: ${fullList.joinToString()}")
        } catch (e: Exception) {
            Log.e("DeviceOwnerManager", "Failed to update LockTask packages", e)
        }
    }

    /**
     * Apply hardware & user restrictions from central MDM policy
     */
    fun applyRestrictions(
        disableCamera: Boolean,
        disableUsb: Boolean,
        disableBluetooth: Boolean,
        disableFactoryReset: Boolean,
        disableSafeBoot: Boolean
    ) {
        if (!isDeviceOwner) return

        try {
            // Camera restriction
            dpm.setCameraDisabled(adminComponent, disableCamera)

            // User restrictions
            setRestriction(UserManager.DISALLOW_USB_FILE_TRANSFER, disableUsb)
            setRestriction(UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA, disableUsb)
            setRestriction(UserManager.DISALLOW_BLUETOOTH, disableBluetooth)
            setRestriction(UserManager.DISALLOW_FACTORY_RESET, disableFactoryReset)
            setRestriction(UserManager.DISALLOW_SAFE_BOOT, disableSafeBoot)
            setRestriction(UserManager.DISALLOW_ADD_USER, true)
            setRestriction(UserManager.DISALLOW_CONFIG_BLUETOOTH, disableBluetooth)

            Log.i("DeviceOwnerManager", "Hardware restrictions applied.")
        } catch (e: Exception) {
            Log.e("DeviceOwnerManager", "Error setting user restrictions", e)
        }
    }

    private fun setRestriction(restrictionKey: String, enable: Boolean) {
        if (enable) {
            dpm.addUserRestriction(adminComponent, restrictionKey)
        } else {
            dpm.clearUserRestriction(adminComponent, restrictionKey)
        }
    }

    /**
     * Silent enterprise APK installation via PackageInstaller (Device Owner only)
     */
    fun installPackageSilently(apkFile: File, onComplete: (Boolean, String?) -> Unit) {
        if (!isDeviceOwner) {
            onComplete(false, "Requires Device Owner privileges")
            return
        }

        try {
            val packageInstaller = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
            val sessionId = packageInstaller.createSession(params)
            val session = packageInstaller.openSession(sessionId)

            FileInputStream(apkFile).use { inputStream ->
                session.openWrite("package", 0, apkFile.length()).use { outputStream ->
                    inputStream.copyTo(outputStream)
                    session.fsync(outputStream)
                }
            }

            val intent = Intent(context, EduGuardDeviceAdminReceiver::class.java).apply {
                action = "com.eduguard.mdm.ACTION_PACKAGE_INSTALLED"
            }
            val pendingIntent = android.app.PendingIntent.getBroadcast(
                context,
                sessionId,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_MUTABLE
            )

            session.commit(pendingIntent.intentSender)
            session.close()
            Log.i("DeviceOwnerManager", "Silent installation session committed: $sessionId")
            onComplete(true, null)
        } catch (e: Exception) {
            Log.e("DeviceOwnerManager", "Silent package install failed", e)
            onComplete(false, e.localizedMessage)
        }
    }

    /**
     * Reboot device remotely
     */
    fun rebootDevice() {
        if (isDeviceOwner && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                dpm.reboot(adminComponent)
            } catch (e: Exception) {
                Log.e("DeviceOwnerManager", "Reboot failed", e)
            }
        }
    }
}
