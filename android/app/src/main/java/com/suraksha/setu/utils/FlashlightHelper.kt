package com.suraksha.setu.utils

import android.content.Context
import android.hardware.camera2.CameraManager
import kotlinx.coroutines.*

class FlashlightHelper(context: Context) {
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private var cameraId: String? = null
    private var isStrobing = false

    init {
        try {
            cameraId = cameraManager.cameraIdList[0]
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun startSOSStrobe(scope: CoroutineScope) {
        if (cameraId == null) return
        isStrobing = true
        scope.launch {
            while (isStrobing) {
                toggleFlash(true)
                delay(200)
                toggleFlash(false)
                delay(200)
            }
        }
    }

    fun stopStrobe() {
        isStrobing = false
        toggleFlash(false)
    }

    private fun toggleFlash(state: Boolean) {
        try {
            cameraId?.let { cameraManager.setTorchMode(it, state) }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
