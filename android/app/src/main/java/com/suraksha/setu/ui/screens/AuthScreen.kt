package com.suraksha.setu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.suraksha.setu.ui.components.GlassCard
import com.suraksha.setu.ui.theme.Black
import com.suraksha.setu.ui.theme.CrimsonGlow
import com.suraksha.setu.ui.theme.Silver

@Composable
fun AuthScreen(onAuthenticated: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Shield,
                contentDescription = null,
                tint = CrimsonGlow,
                modifier = Modifier.size(64.dp)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Welcome Back",
                color = Silver,
                fontSize = 32.sp,
                fontWeight = FontWeight.Light
            )
            
            Text(
                text = "SECURE ACCESS TO SAFETY",
                color = Silver.copy(alpha = 0.4f),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = "",
                    onValueChange = {},
                    placeholder = { Text("Email", color = Silver.copy(alpha = 0.3f)) },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.Email, null, tint = Silver.copy(alpha = 0.5f)) },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = CrimsonGlow,
                        unfocusedIndicatorColor = Silver.copy(alpha = 0.1f)
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = "",
                    onValueChange = {},
                    placeholder = { Text("Password", color = Silver.copy(alpha = 0.3f)) },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = Silver.copy(alpha = 0.5f)) },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = CrimsonGlow,
                        unfocusedIndicatorColor = Silver.copy(alpha = 0.1f)
                    )
                )
                
                Spacer(modifier = Modifier.height(32.dp))
                
                Button(
                    onClick = onAuthenticated,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonGlow),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(
                        text = "SIGN IN",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            TextButton(onClick = {}) {
                Text(
                    text = "DON'T HAVE AN ACCOUNT? SIGN UP",
                    color = Silver.copy(alpha = 0.5f),
                    fontSize = 10.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}
