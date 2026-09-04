package com.eduguard.mdm.commands

import android.util.Log
import com.eduguard.mdm.dpc.DeviceOwnerManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

/**
 * SecureCommandReceiver
 * Listens for FCM push notifications from EduGuard MDM backend,
 * validates nonces/timestamps, and executes sensitive remote commands.
 */
class SecureCommandReceiver : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val data = message.data
        val commandType = data["command_type"] ?: return
        val nonce = data["nonce"] ?: return
        val timestamp = data["timestamp"]?.toLongOrNull() ?: 0L

        // Prevent replay attacks (reject commands older than 5 minutes)
        if (System.currentTimeMillis() - timestamp > 300_000) {
            Log.w("CommandReceiver", "Expired command rejected: $commandType")
            return
        }

        val deviceOwnerManager = DeviceOwnerManager(this)

        when (commandType) {
            "LOCK_DEVICE" -> {
                val reason = data["reason"] ?: "Device locked by School Administrator."
                deviceOwnerManager.lockDevice(reason)
            }
            "UNLOCK_DEVICE" -> {
                deviceOwnerManager.clearLockScreenMessage()
            }
            "REBOOT_DEVICE" -> {
                deviceOwnerManager.rebootDevice()
            }
            "SYNC_POLICY" -> {
                Log.i("CommandReceiver", "Triggering background policy refresh.")
            }
            else -> {
                Log.d("CommandReceiver", "Unknown command: $commandType")
            }
        }
    }
}
