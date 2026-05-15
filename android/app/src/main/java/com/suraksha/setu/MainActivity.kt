package com.suraksha.setu

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.core.content.ContextCompat
import com.suraksha.setu.data.AppDatabase
import com.suraksha.setu.data.EmergencyLog
import com.suraksha.setu.service.FirebaseManager
import com.suraksha.setu.utils.AudioRecorder
import com.suraksha.setu.utils.FlashlightHelper
import com.suraksha.setu.utils.LocationHelper
import com.suraksha.setu.utils.SirenPlayer
import com.suraksha.setu.utils.ShakeDetector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.suraksha.setu.ui.screens.AuthScreen
import com.suraksha.setu.ui.screens.DashboardScreen
import com.suraksha.setu.ui.screens.MapScreen
import com.suraksha.setu.ui.screens.OnboardingScreen
import com.suraksha.setu.ui.theme.SurakshaSetuTheme

class MainActivity : ComponentActivity() {
    private lateinit var sensorManager: SensorManager
    private lateinit var shakeDetector: ShakeDetector
    private lateinit var audioRecorder: AudioRecorder
    private lateinit var locationHelper: LocationHelper
    private lateinit var flashlightHelper: FlashlightHelper
    private lateinit var sirenPlayer: SirenPlayer
    private lateinit var database: AppDatabase
    private val firebaseManager = FirebaseManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        audioRecorder = AudioRecorder(this)
        locationHelper = LocationHelper(this)
        flashlightHelper = FlashlightHelper(this)
        sirenPlayer = SirenPlayer(this)
        database = AppDatabase.getDatabase(this)
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager


        shakeDetector = ShakeDetector {
            triggerSOS()
        }


        setContent {
            SurakshaSetuTheme {
                val navController = rememberNavController()

                // Permission Request
                val permissionLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { /* Handle results */ }

                LaunchedEffect(Unit) {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.RECORD_AUDIO
                        )
                    )
                }

                
                NavHost(navController = navController, startDestination = "onboarding") {
                    composable("onboarding") {
                        OnboardingScreen(onFinished = {
                            navController.navigate("auth") {
                                popUpTo("onboarding") { inclusive = true }
                            }
                        })
                    }
                    composable("auth") {
                        AuthScreen(onAuthenticated = {
                            navController.navigate("dashboard") {
                                popUpTo("auth") { inclusive = true }
                            }
                        })
                    }
                    composable("dashboard") {
                        DashboardScreen(
                            onOpenMap = { navController.navigate("map") },
                            onActivateSOS = { triggerSOS() }
                        )
                    }
                    composable("map") {
                        MapScreen(onBack = { navController.popBackStack() })
                    }
                }
            }
        }
    }

    private fun triggerSOS() {
        Toast.makeText(this, "EMERGENCY ACTIVATED", Toast.LENGTH_LONG).show()
        
        val timestamp = System.currentTimeMillis()
        var audioFilePath: String? = null

        // Start Audio Recording
        try {
            val file = File(cacheDir, "emergency_audio_$timestamp.mp4")
            audioRecorder.start(file)
            audioFilePath = file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Start Flashlight Strobe & Siren
        flashlightHelper.startSOSStrobe(CoroutineScope(Dispatchers.Main))
        sirenPlayer.playSiren()

        // Get Real Location and Process SOS

        locationHelper.getLastLocation { location ->
            val lat = location?.latitude ?: 0.0
            val lng = location?.longitude ?: 0.0

            // Firebase Alert
            firebaseManager.sendSOS(lat, lng)

            // Local Database Log
            CoroutineScope(Dispatchers.IO).launch {
                database.emergencyDao().insertLog(
                    EmergencyLog(
                        timestamp = timestamp,
                        type = "SOS",
                        latitude = lat,
                        longitude = lng,
                        audioPath = audioFilePath
                    )
                )
            }
        }
    }



    override fun onResume() {
        super.onResume()
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let {
            sensorManager.registerListener(shakeDetector, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(shakeDetector)
    }
}
