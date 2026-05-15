package com.suraksha.setu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.suraksha.setu.ui.theme.CrimsonGlow

@Composable
fun AIOrb(size: Dp = 200.dp) {
    val infiniteTransition = rememberInfiniteTransition(label = "orb")
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, ease = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    val opacity by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, ease = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "opacity"
    )

    Box(modifier = Modifier.size(size)) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val center = Offset(size.toPx() / 2, size.toPx() / 2)
            val radius = (size.toPx() / 2) * scale

            // Outer glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        CrimsonGlow.copy(alpha = 0.3f * opacity),
                        Color.Transparent
                    ),
                    center = center,
                    radius = radius
                ),
                radius = radius,
                center = center
            )

            // Inner core
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        CrimsonGlow.copy(alpha = 0.8f * opacity),
                        CrimsonGlow.copy(alpha = 0.2f * opacity),
                        Color.Transparent
                    ),
                    center = center,
                    radius = radius * 0.4f
                ),
                radius = radius * 0.4f,
                center = center
            )
        }
    }
}
