package com.suraksha.setu.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.suraksha.setu.ui.components.GlassCard
import com.suraksha.setu.ui.components.SOSButton
import com.suraksha.setu.ui.theme.Black
import com.suraksha.setu.ui.theme.CrimsonGlow
import com.suraksha.setu.ui.theme.Silver

@Composable
fun DashboardScreen(onOpenMap: () -> Unit, onActivateSOS: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "/ SURAKSHA SETU",
                    color = CrimsonGlow,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Welcome, User",
                    color = Silver,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Light
                )
            }
            Icon(
                imageVector = Icons.Default.Notifications,
                contentDescription = null,
                tint = Silver.copy(alpha = 0.6f),
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(60.dp))

        // Large SOS Button
        SOSButton(onClick = onActivateSOS)

        Spacer(modifier = Modifier.height(60.dp))

        // Grid of features
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            DashboardItem(
                modifier = Modifier.weight(1f).clickable { onOpenMap() },
                title = "Live Map",
                icon = Icons.Default.Map
            )
            DashboardItem(
                modifier = Modifier.weight(1f),
                title = "Safety Score",
                icon = Icons.Default.Shield
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "TRUSTED CONTACTS",
                color = Silver.copy(alpha = 0.4f),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "3 Contacts Active",
                color = Silver,
                fontSize = 18.sp,
                fontWeight = FontWeight.Normal
            )
        }
        
        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun DashboardItem(modifier: Modifier = Modifier, title: String, icon: ImageVector) {
    GlassCard(modifier = modifier) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = CrimsonGlow,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = title,
            color = Silver,
            fontSize = 14.sp,
            fontWeight = FontWeight.Normal,
            letterSpacing = 1.sp
        )
    }
}
