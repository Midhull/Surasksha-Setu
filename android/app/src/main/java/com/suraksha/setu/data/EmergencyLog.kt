package com.suraksha.setu.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "emergency_logs")
data class EmergencyLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val timestamp: Long,
    val type: String, // "SOS" or "SHAKE"
    val latitude: Double,
    val longitude: Double,
    val audioPath: String?
)
