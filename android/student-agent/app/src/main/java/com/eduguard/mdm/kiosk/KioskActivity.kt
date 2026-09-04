package com.eduguard.mdm.kiosk

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eduguard.mdm.dpc.DeviceOwnerManager

/**
 * KioskActivity
 * Dedicated Student Launcher & Kiosk Home Interface.
 * Pins the screen via Android Enterprise LockTask Mode.
 */
class KioskActivity : ComponentActivity() {

    private lateinit var deviceOwnerManager: DeviceOwnerManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        deviceOwnerManager = DeviceOwnerManager(this)

        // Enter LockTask pinning if Device Owner
        if (deviceOwnerManager.isDeviceOwner) {
            try {
                startLockTask()
            } catch (e: Exception) {
                // Fallback for non-whitelisted mode
            }
        }

        setContent {
            KioskScreen(
                onAppClick = { packageName ->
                    launchManagedApp(packageName)
                }
            )
        }
    }

    private fun launchManagedApp(packageName: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(launchIntent)
        } else {
            Toast.makeText(this, "Application ($packageName) is being deployed by school admin.", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onBackPressed() {
        // Prevent escaping Kiosk Launcher via Back button
    }
}

data class KioskAppItem(val name: String, val packageName: String, val iconChar: String, val category: String)

@Composable
fun KioskScreen(onAppClick: (String) -> Unit) {
    val sampleApps = remember {
        listOf(
            KioskAppItem("School LMS", "com.school.lms", "📚", "Curriculum"),
            KioskAppItem("Google Classroom", "com.google.android.apps.classroom", "🏫", "Classwork"),
            KioskAppItem("Calculator", "com.android.calculator2", "🧮", "Utility"),
            KioskAppItem("Python IDE", "com.edu.pythonide", "💻", "Coding"),
            KioskAppItem("School Browser", "com.eduguard.browser", "🌐", "Safe Web"),
            KioskAppItem("Science 3D Lab", "com.edu.sciencelab", "🔬", "Lab")
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFFF8FAFC)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "EduGuard Student Workspace",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "Class XII-A • Managed by Demo International School",
                        fontSize = 14.sp,
                        color = Color(0xFF64748B)
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Badge(containerColor = Color(0xFFDCFCE7)) {
                        Text("POLICY COMPLIANT", color = Color(0xFF166534), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Badge(containerColor = Color(0xFFE0E7FF)) {
                        Text("KIOSK LOCKED", color = Color(0xFF3730A3), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "APPROVED SCHOOL APPLICATIONS",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF475569),
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // App Grid
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 130.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(sampleApps) { app ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .clickable { onAppClick(app.packageName) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(app.iconChar, fontSize = 24.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = app.name,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF1E293B)
                            )
                            Text(
                                text = app.category,
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                }
            }

            // Footer
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🛡️", fontSize = 18.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Device is centrally managed. Unauthorized app installations and blocked web domains are logged and reported to school IT.",
                        fontSize = 11.sp,
                        color = Color(0xFF475569)
                    )
                }
            }
        }
    }
}
