# Suraksha-Setu Operational QA Validation & Testing Matrix

This document serves as the formal Quality Assurance and operational validation checklist for the Suraksha-Setu emergency platform. It outlines specific failure-recovery scenarios, lifecycle checks, and required behavior under extreme physical and network constraints. 

---

## 1. Women Safety Flow Testing

**Scenario Flow:** Fake Call Escape -> Safe Route AI -> Reach Home Safe -> Hidden SOS -> Voice Recording -> Emergency Escalation -> False Alarm Recovery.

**Pass/Fail Expectations:**
*   **Fake Call Escape:** Simulates call without triggering full SOS payload.
*   **Safe Route AI:** Accurately geocodes current location, retrieves route safety metadata.
*   **Reach Home Safe:** Allows journey start, triggers warning countdown upon expiry.
*   **Hidden SOS:** Bypasses countdown entirely and immediately creates `emergencySessions` document.
*   **Voice Recording:** Automatically arms, requests mic permissions, and begins recording audio chunks in the background.
*   **Emergency Escalation:** Session upgrades to `ESCALATED`. Trusted circle standby notification logged.
*   **False Alarm Recovery:** Calling `markFalseAlarm` immediately ceases recording, stops GPS polling, updates Firestore lifecycle to `FALSE_ALARM`, and clears UI.

---

## 2. Elderly Safety Flow Testing

**Scenario Flow:** Fall Detection -> No user response -> Medical profile attached -> Trusted Circle escalation standby -> Voice evidence activation -> Emergency escalation -> Emergency resolution.

**Pass/Fail Expectations:**
*   **Fall Detection:** Impact spike detected (> 30m/s²). Subsequent 3 seconds show inactivity (< 5m/s²).
*   **No User Response:** 15-second pending UI overlay appears and countdown completes uninterrupted.
*   **Medical Profile:** `EmergencyPayload` injected into Firestore strictly includes the `medicalProfile` block (Blood Group, Allergies, etc.).
*   **Voice Evidence:** Automatically begins audio capture without user interaction.
*   **Escalation:** Lifecycle pushes from `PENDING` -> `ACTIVE` -> `ESCALATED`.
*   **Resolution:** Calling `resolveEmergency` marks lifecycle as `RESOLVED`, successfully finalizes `evidenceService` upload to Firebase Storage, and clears dashboard state.

---

## 3. Refresh & Recovery Testing

Testing operational resilience to browser refresh/crash events.

**Pass/Fail Expectations:**
*   **Refresh during active SOS:** Dashboard re-reads local storage flag. Timeline fallback restores from Firestore.
*   **Refresh during evidence recording:** `checkStaleRecording()` catches orphaned `emergencyId` in cache, flags payload as `INTERRUPTED`, releases microphone, and aborts upload gracefully.
*   **Refresh during escalation:** Emergency state holds, timeline displays correct persistence, UI returns to "Active Emergency Panel" view.

---

## 4. Permission & Hardware Failure Testing

**Pass/Fail Expectations:**
*   **GPS Denied/Offline:** Falls back to `lastKnownEmergencyLocation`. Payload marked `LocationState.UNAVAILABLE` or `FALLBACK`. Emergency workflow continues.
*   **Microphone Denied/Missing:** MediaRecorder catches exception. Payload marked `FAILED` or empty for recording. Timeline logs "Microphone unavailable". Emergency payload continues.
*   **Firebase Offline:** `incidentLogger` writes locally and queues payload. Application remains active without freezing.

---

## 5. Multi-Trigger Stress Testing

**Pass/Fail Expectations:**
*   **Repeated Shake / Hidden SOS spam:** Debounce logic rejects duplicate identical events within 2 seconds. Firestore prevents duplicate `addDoc` calls.
*   **Multiple escalations:** `activeSessionId` lock ensures only a single `emergencySessions` document controls the current lifecycle. 

---

## Test Result Matrix

| Scenario | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **Fake Call Escape** | Screen updates, ringtone plays, no SOS fired | | |
| **Hidden SOS** | Silent escalation, timeline updated, payload created | | |
| **Fall Detection Lifecycle** | Drop triggers UI overlay, 15s wait activates full SOS | | |
| **False Alarm Cleanup** | Stops recording, marks FALSE_ALARM, clears cache | | |
| **Emergency Resolution** | Uploads final recording, marks RESOLVED, clears cache | | |
| **Mid-Recording Refresh** | Marks INTERRUPTED, prevents zombie mic, cleans state | | |
| **GPS Denied/Timeout** | Retries 2x, activates FALLBACK, logs failure, continues SOS | | |
| **Mic Denied** | Logs error, proceeds without evidence, does not freeze | | |
| **Rapid Double Trigger** | Secondary trigger ignored, single active session maintained | | |
| **Medical Payload Attach** | `medicalProfile` JSON correctly maps to Firestore doc | | |
| **Evidence Upload** | Webm blob safely pushed to Firebase Storage | | |
| **Evidence Retry Logic** | Interrupted network causes 2x exponential retry backoff | | |
| **Timeline Persistence** | Refreshing dashboard restores top 50 Incident events | | |

---

## Physical Hardware Verification Requirements

Desktop testing cannot accurately simulate physical sensors. Testing MUST be done on an Android phone using Mobile Chrome or deployed APK wrapper:
1.  **Vibrate API:** Ensure fallback haptics fire correctly.
2.  **DeviceMotion API:** Verify `m/s²` acceleration accurately triggers Fall Detection thresholds.
3.  **Screen Lock/Background:** Ensure background limits do not prematurely pause active GPS polling or active voice recording.
4.  **Network Drop:** Turn on Airplane Mode mid-upload to verify Storage Retry logic behaves properly.
