package com.suraksha.setu.utils

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class ShakeDetector(private val onShake: () -> Unit) : SensorEventListener {
    private var lastShakeTime: Long = 0
    private val SHAKE_THRESHOLD = 12.0f // Adjust sensitivity
    private val MIN_TIME_BETWEEN_SHAKES = 1000

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]

            val acceleration = sqrt((x * x + y * y + z * z).toDouble()).toFloat() - SensorManager.GRAVITY_EARTH
            
            if (acceleration > SHAKE_THRESHOLD) {
                val currentTime = System.currentTimeMillis()
                if (currentTime - lastShakeTime > MIN_TIME_BETWEEN_SHAKES) {
                    lastShakeTime = currentTime
                    onShake()
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}
