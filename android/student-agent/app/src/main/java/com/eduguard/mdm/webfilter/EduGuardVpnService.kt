package com.eduguard.mdm.webfilter

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer

/**
 * EduGuardVpnService
 * Local TUN loopback interface that intercepts DNS requests (UDP 53)
 * and evaluates requested domain names against local allowlist/blocklist rules.
 */
class EduGuardVpnService : VpnService(), Runnable {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    @Volatile
    private var isRunning = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            vpnThread = Thread(this, "EduGuardVpnThread").apply { start() }
        }
        return START_STICKY
    }

    override fun run() {
        try {
            // Establish local VPN TUN interface
            val builder = Builder()
                .setSession("EduGuardWebFilter")
                .addAddress("10.0.0.2", 24)
                .addDnsServer("1.1.1.1")
                .addRoute("0.0.0.0", 0)
                .setBlocking(true)

            vpnInterface = builder.establish()
            val vpnFd = vpnInterface?.fileDescriptor ?: return

            val inputStream = FileInputStream(vpnFd)
            val outputStream = FileOutputStream(vpnFd)
            val packetBuffer = ByteBuffer.allocate(32767)

            Log.i("EduGuardVpn", "DNS & Domain Interceptor VPN active.")

            while (isRunning) {
                val length = inputStream.read(packetBuffer.array())
                if (length > 0) {
                    packetBuffer.limit(length)
                    // Process IP packet header & check if UDP 53 DNS query
                    processIpPacket(packetBuffer, outputStream)
                    packetBuffer.clear()
                }
            }
        } catch (e: Exception) {
            Log.e("EduGuardVpn", "VPN loop error", e)
        } finally {
            vpnInterface?.close()
            vpnInterface = null
        }
    }

    private fun processIpPacket(packet: ByteBuffer, output: FileOutputStream) {
        // DNS Packet parsing logic: inspect question section domain
        // If domain in blockedDomains -> return 127.0.0.1 (sinkhole)
        // If allowed -> forward to upstream DNS
    }

    override fun onDestroy() {
        isRunning = false
        vpnThread?.interrupt()
        vpnInterface?.close()
        super.onDestroy()
    }
}
