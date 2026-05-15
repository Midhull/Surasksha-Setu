import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import axios from "axios";

// Initialize Admin SDK for status tracking
initializeApp();
const db = getFirestore();

/**
 * Suraksha-Setu: Telegram Emergency Alert Automation (HARDENED)
 * 
 * Reliability Improvements:
 * 1. GPS Validation & Fallback Handling
 * 2. Delivery Status Tracking (SENT/FAILED)
 * 3. Idempotency check via Firestore
 */
export const notifyEmergencyOnTelegram = onDocumentCreated(
  "emergencySessions/{sessionId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No snapshot found in emergency session event");
      return;
    }

    const data = snapshot.data();
    const lat = data.latitude;
    const lng = data.longitude;
    const triggerType = data.triggerType || "UNKNOWN_EMERGENCY";
    const sessionId = event.params.sessionId;

    // 1. GPS Validation
    const isGpsValid = lat && lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    
    // 2. Prevent Duplicate Dispatch (Basic Idempotency)
    if (data.telegramStatus === "SENT") {
      logger.warn(`Session ${sessionId} already processed. Skipping.`);
      return;
    }

    const config = (functions as any).config();
    const botToken = config.telegram?.token;
    const chatId = config.telegram?.chat_id;

    if (!botToken || !chatId) {
      logger.error("Telegram configuration missing (token or chat_id)");
      return;
    }

    // 3. Status Tracking: Mark as PENDING
    await snapshot.ref.update({
      telegramStatus: "PENDING",
      processedAt: FieldValue.serverTimestamp()
    });

    let locationBlock = "";
    if (isGpsValid) {
      const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      locationBlock = `📍 <b>Live Location:</b>\n${googleMapsUrl}`;
    } else {
      locationBlock = `⚠️ <b>Location Unavailable:</b>\nGPS lock pending or invalid coordinates. Check dashboard for updates.`;
    }

    const message = `🚨 <b>Suraksha-Setu Emergency Alert</b>\n\n` +
      `A potential emergency has been detected.\n\n` +
      `<b>Trigger Type:</b> ${triggerType}\n` +
      `<b>Session ID:</b> <code>${sessionId}</code>\n\n` +
      `${locationBlock}\n\n` +
      `<i>Please check the tactical dashboard immediately.</i>`;

    try {
      const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }, { timeout: 10000 }); // 10s timeout for reliability

      if (response.data.ok) {
        logger.info(`Telegram alert dispatched successfully for session ${sessionId}`);
        await snapshot.ref.update({ telegramStatus: "SENT", telegramMessageId: response.data.result.message_id });
      } else {
        throw new Error(`Telegram API Error: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      logger.error("Failed to dispatch Telegram alert:", error.message);
      await snapshot.ref.update({ 
        telegramStatus: "FAILED", 
        telegramError: error.message,
        retryCount: FieldValue.increment(1) 
      });
    }
  }
);
