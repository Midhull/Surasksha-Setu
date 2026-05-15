# Suraksha-Setu: Production Deployment Certification Checklist

This document defines the mandatory validation steps required for certifying Suraksha-Setu as a production-grade emergency coordination platform.

## 1. Authentication & Identity Hardening
- [ ] **Cinematic UI Validation**: Confirm `login.tsx` and `register.tsx` maintain visual parity with the dashboard (matte glassmorphism, crimson accents).
- [ ] **Hydration Integrity**: Verify that authenticated sessions persist through hard refreshes and PWA "Add to Home Screen" launches.
- [ ] **Identity Synchronization**: Confirm that Google OAuth and Email/Password flows correctly initialize the user document in Firestore with strict ownership isolation.
- [ ] **Defensive Errors**: Trigger failed login attempts to verify that the calm, supportive error messaging renders correctly via `AnimatePresence`.

## 2. Emergency Lifecycle Orchestration
- [ ] **Manual SOS Flow**: 
    - [ ] Hold-to-trigger countdown renders correctly.
    - [ ] Releasing before 3s aborts the lifecycle cleanly.
    - [ ] Activation triggers global emergency state and tactical HUD.
- [ ] **Real-time Telemetry**: 
    - [ ] GPS coordinates update in the HUD and propagate to Firestore.
    - [ ] Map markers synchronize across different logged-in devices (Simulate Guardian view).
- [ ] **Incident Finalization**: 
    - [ ] "Resolve Emergency" purges active state and returns to Safe Mode.
    - [ ] "False Alarm" correctly logs the event without escalating to guardians.

## 3. Physical Device & PWA Readiness
- [ ] **Service Worker Performance**: Verify that the PWA manifest and icons load correctly.
- [ ] **Mobile Touch Ergonomics**: Test button hit targets on mobile (SOS button, feature cards, navigation links).
- [ ] **Background Resilience**: Ensure GPS tracking continues when the app is backgrounded (if supported by the browser) or recovers immediately on foreground.
- [ ] **Offline Recovery**:
    - [ ] Simulate network drop during active SOS.
    - [ ] Confirm "Offline SOS Recovery" flow monitors connectivity.
    - [ ] Confirm payloads are transmitted/finalized once connection is restored.

## 4. Production Infrastructure
- [ ] **Firebase Rules**: Verify that Firestore security rules enforce strict user-level data isolation.
- [ ] **Environment Variables**: Confirm all production keys (Maps, Firebase) are correctly configured in the deployment environment.
- [ ] **Build Optimization**: Run `npm run build` and verify that the bundle size is optimized for low-bandwidth emergency scenarios.

## 5. Telegram Emergency Automation (Infrastructure)
- [ ] **Blaze Plan Upgrade**: Upgrade Firebase project to Blaze plan to allow outbound API calls to Telegram.
- [ ] **Secret Injection**: Execute `firebase functions:config:set telegram.token="..." telegram.chat_id="..."` for production credentials.
- [ ] **Function Deployment**: Run `firebase deploy --only functions` and verify the `notifyEmergencyOnTelegram` function is active.
- [ ] **End-to-End Alerting**: Trigger a manual SOS and verify that the Telegram alert arrives with the correct Trigger Type and Google Maps link.

---
**Status**: [STABILIZATION PHASE]
**Lead**: Antigravity AI
**Mission**: Operational reliability at any cost.
