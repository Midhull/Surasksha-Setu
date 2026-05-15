package com.suraksha.setu.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.suraksha.setu.ui.components.AIOrb
import com.suraksha.setu.ui.theme.Black
import com.suraksha.setu.ui.theme.CrimsonGlow
import com.suraksha.setu.ui.theme.Silver
import kotlinx.coroutines.delay

@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    var scene by remember { mutableStateOf(0) }
    
    LaunchedEffect(Unit) {
        delay(3000)
        scene = 1
        delay(3000)
        scene = 2
        delay(3000)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black),
        contentAlignment = Alignment.Center
    ) {
        AnimatedContent(
            targetState = scene,
            transitionSpec = {
                fadeIn(tween(1000)) togetherWith fadeOut(tween(1000))
            },
            label = "scenes"
        ) { currentScene ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                when (currentScene) {
                    0 -> {
                        AIOrb(size = 200.dp)
                        Spacer(modifier = Modifier.height(48.dp))
                        Text(
                            text = "Protection should never wait.",
                            color = Silver,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Light,
                            letterSpacing = 4.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    1 -> {
                        Text(
                            text = "A Connected Network",
                            color = CrimsonGlow,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 6.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Suraksha Setu bridges the gap between you and safety.",
                            color = Silver.copy(alpha = 0.8f),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Light,
                            letterSpacing = 2.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    2 -> {
                        Text(
                            text = "Always With You",
                            color = CrimsonGlow,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 6.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Ready to respond in milliseconds.",
                            color = Silver.copy(alpha = 0.8f),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Light,
                            letterSpacing = 2.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
