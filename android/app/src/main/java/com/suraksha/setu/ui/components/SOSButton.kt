package com.suraksha.setu.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.suraksha.setu.ui.theme.CrimsonGlow

@Composable
fun SOSButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    val animatedScale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scale"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseScale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseAlpha"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(220.dp)
            .scale(animatedScale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        // Pulse Rings
        Box(
            modifier = Modifier
                .fillMaxSize()
                .scale(pulseScale)
                .background(CrimsonGlow.copy(alpha = pulseAlpha), CircleShape)
        )
        
        // Main Button Surface
        Box(
            modifier = Modifier
                .size(180.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(CrimsonGlow, Color(0xFF8B0000))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "SOS",
                    color = Color.White,
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp
                )
                Text(
                    text = "PRESS TO ACTIVATE",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Light,
                    letterSpacing = 2.sp
                )
            }
        }
    }
}
