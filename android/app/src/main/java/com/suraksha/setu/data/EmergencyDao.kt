package com.suraksha.setu.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface EmergencyDao {
    @Insert
    suspend fun insertLog(log: EmergencyLog)

    @Query("SELECT * FROM emergency_logs ORDER BY timestamp DESC")
    suspend fun getAllLogs(): List<EmergencyLog>
}
