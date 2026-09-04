package com.eduguard.mdm.dpc

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.UserHandle
import android.util.Log

/**
 * EduGuardDeviceAdminReceiver
 * The core Android Enterprise Device Policy Controller (DPC) entry point.
 * Handles lifecycle callbacks when granted Device Owner status during provisioning.
 */
class EduGuardDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "EduGuardDPC"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context.applicationContext, EduGuardDeviceAdminReceiver::class.java)
        }
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "Android Enterprise Provisioning completed successfully.")

        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = getComponentName(context)

        try {
            // 1. Enable Kiosk Launcher as the persistent Home activity
            val filter = android.content.IntentFilter(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                addCategory(Intent.CATEGORY_DEFAULT)
            }
            val kioskActivity = ComponentName(context, "com.eduguard.mdm.kiosk.KioskActivity")
            dpm.addPersistentPreferredActivity(admin, filter, kioskActivity)

            // 2. Configure LockTask Mode for Kiosk security
            dpm.setLockTaskPackages(admin, arrayOf(context.packageName))

            // 3. Prevent student uninstall and tamper
            dpm.setUninstallBlocked(admin, context.packageName, true)

            // 4. Disable USB debugging and developer options for security compliance
            dpm.addUserRestriction(admin, android.os.UserManager.DISALLOW_DEBUGGING_FEATURES)
            dpm.addUserRestriction(admin, android.os.UserManager.DISALLOW_FACTORY_RESET)
            dpm.addUserRestriction(admin, android.os.UserManager.DISALLOW_SAFE_BOOT)

            Log.i(TAG, "Default device owner baseline policy applied.")
        } catch (e: Exception) {
            Log.e(TAG, "Error applying initial enterprise restrictions", e)
        }
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.i(TAG, "Entered LockTask kiosk mode for package: $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.w(TAG, "Exited LockTask kiosk mode!")
    }

    override fun onPasswordFailed(context: Context, intent: Intent, user: UserHandle) {
        super.onPasswordFailed(context, intent, user)
        Log.w(TAG, "Unauthorized device unlock attempt detected.")
    }
}
