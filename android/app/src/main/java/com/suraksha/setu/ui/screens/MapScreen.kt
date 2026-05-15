package com.suraksha.setu.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.ui.draw.scale
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MapStyleOptions
import com.google.maps.android.compose.*
import com.suraksha.setu.ui.theme.Black
import com.suraksha.setu.ui.theme.CrimsonGlow
import com.suraksha.setu.ui.theme.Silver

@Composable
fun MapScreen(onBack: () -> Unit) {
    val singapore = LatLng(1.35, 103.87)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(singapore, 12f)
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 3f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "scale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "alpha"
    )


    Box(modifier = Modifier.fillMaxSize()) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(
                mapStyleOptions = MapStyleOptions("[\n  {\n    \"elementType\": \"geometry\",\n    \"stylers\": [\n      {\n        \"color\": \"#212121\"\n      }\n    ]\n  },\n  {\n    \"elementType\": \"labels.icon\",\n    \"stylers\": [\n      {\n        \"visibility\": \"off\"\n      }\n    ]\n  },\n  {\n    \"elementType\": \"labels.text.fill\",\n    \"stylers\": [\n      {\n        \"color\": \"#757575\"\n      }\n    ]\n  }\n]") // Simplified dark style
            ),
            uiSettings = MapUiSettings(zoomControlsEnabled = false)
        ) {
            MarkerComposable(
                state = MarkerState(position = singapore)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    // Pulse
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .scale(pulseScale)
                            .background(CrimsonGlow.copy(alpha = pulseAlpha), CircleShape)
                    )
                    // Orb
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(CrimsonGlow, CircleShape)
                            .padding(2.dp)
                            .background(Color.White.copy(alpha = 0.5f), CircleShape)
                    )
                }
            }
        }


        // Overlay UI
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.background(Black.copy(alpha = 0.6f), androidx.compose.foundation.shape.CircleShape)
                ) {
                    Icon(Icons.Default.ArrowBack, null, tint = Silver)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    text = "LIVE TRACKING",
                    color = Silver,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Bottom Status
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Black.copy(alpha = 0.8f))
                    .padding(24.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(CrimsonGlow, androidx.compose.foundation.shape.CircleShape)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Real-time safety monitoring active",
                        color = Silver.copy(alpha = 0.6f),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}
