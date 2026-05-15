package com.suraksha.setu.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import com.suraksha.setu.R

class SirenPlayer(private val context: Context) {
    private var soundPool: SoundPool? = null
    private var sirenId: Int = 0
    private var streamId: Int = 0

    init {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(1)
            .setAudioAttributes(audioAttributes)
            .build()
        
        // Note: Siren audio file should be placed in res/raw/siren.mp3
        // sirenId = soundPool?.load(context, R.raw.siren, 1) ?: 0
    }

    fun playSiren() {
        // streamId = soundPool?.play(sirenId, 1f, 1f, 1, -1, 1f) ?: 0
    }

    fun stopSiren() {
        soundPool?.stop(streamId)
    }

    fun release() {
        soundPool?.release()
        soundPool = null
    }
}
