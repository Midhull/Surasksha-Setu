package com.suraksha.setu.service

import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.firebase.messaging.ktx.messaging
import java.util.*

class FirebaseManager {
    private val db = Firebase.firestore
    private val auth = Firebase.auth

    fun sendSOS(latitude: Double, longitude: Double) {
        val user = auth.currentUser ?: return
        val sosData = hashMapOf(
            "userId" to user.uid,
            "userName" to (user.displayName ?: "Anonymous"),
            "timestamp" to System.currentTimeMillis(),
            "location" to hashMapOf(
                "lat" to latitude,
                "lng" to longitude
            ),
            "status" to "ACTIVE"
        )

        db.collection("emergencies").document(user.uid).set(sosData)
    }

    fun updateVolunteerStatus(isAvailable: Boolean) {
        val user = auth.currentUser ?: return
        db.collection("volunteers").document(user.uid).update("active", isAvailable)
    }

    fun subscribeToEmergencyAlerts() {
        Firebase.messaging.subscribeToTopic("emergency_nearby")
    }
}
