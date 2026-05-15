import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logger } from './incidentLogger';
import { EmergencyPayload, TriggerType, MedicalProfileData, LifecycleStage } from '../types/emergency';

class EmergencyService {
  async getMedicalProfile(userId: string): Promise<MedicalProfileData | null> {
    try {
      const docRef = doc(db, 'medicalProfiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        logger.log('info', 'Medical Profile', 'Medical profile fetched');
        return docSnap.data() as MedicalProfileData;
      } else {
        logger.log('info', 'Medical Profile', 'Medical profile unavailable');
        return null;
      }
    } catch (e) {
      console.error("Error fetching medical profile:", e);
      logger.log('low', 'Medical Profile', 'Failed to fetch medical profile');
      return null;
    }
  }

  async saveMedicalProfile(userId: string, data: MedicalProfileData): Promise<boolean> {
    try {
      const docRef = doc(db, 'medicalProfiles', userId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving medical profile:", e);
      return false;
    }
  }

  async createEmergencySession(
    triggerType: string,
    telemetry: any,
    userId: string
  ): Promise<string | null> {
    try {
      const medicalProfile = await this.getMedicalProfile(userId);

      const payload: EmergencyPayload = {
        userId,
        status: "ACTIVE",
        lifecycleStage: LifecycleStage.ACTIVE,
        triggerType,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        telemetry: {
          locationState: telemetry.locationState,
          accuracy: telemetry.accuracy,
          stale: telemetry.stale,
          fallbackUsed: telemetry.fallbackUsed
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        escalationLevel: 1,
        falseAlarm: false
      };

      if (medicalProfile) {
        payload.medicalProfile = medicalProfile;
        logger.log('medium', 'Emergency Engine', 'Medical context attached to emergency session');
      }

      const docRef = await addDoc(collection(db, "emergencySessions"), payload as any);
      
      console.debug(`[DEBUG] Emergency lifecycle transitioned: CREATED -> ACTIVE [SessionID: ${docRef.id}]`);
      logger.log('critical', 'Emergency Engine', `SOS Triggered: ${triggerType} [ID: ${docRef.id}]`);
      
      return docRef.id;
    } catch (e) {
      console.error("[DEBUG] Error creating emergency session:", e);
      logger.log('critical', 'Emergency Engine', 'Failed to create emergency session');
      return null;
    }
  }

  async escalateEmergency(sessionId: string, newLevel: number): Promise<boolean> {
    try {
      const docRef = doc(db, "emergencySessions", sessionId);
      await updateDoc(docRef, {
        lifecycleStage: LifecycleStage.ESCALATED,
        escalationLevel: newLevel,
        updatedAt: serverTimestamp()
      });
      console.debug(`[DEBUG] Emergency lifecycle transitioned: ACTIVE -> ESCALATED [SessionID: ${sessionId}]`);
      logger.log('high', 'Emergency Orchestration', `Emergency escalation initiated (Level ${newLevel})`);
      return true;
    } catch (e) {
      console.error("[DEBUG] Error escalating emergency:", e);
      return false;
    }
  }

  async resolveEmergency(sessionId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "emergencySessions", sessionId);
      await updateDoc(docRef, {
        status: "INACTIVE",
        lifecycleStage: LifecycleStage.RESOLVED,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.debug(`[DEBUG] Emergency lifecycle transitioned: ACTIVE/ESCALATED -> RESOLVED [SessionID: ${sessionId}]`);
      logger.log('info', 'Emergency Orchestration', 'Emergency resolved successfully');
      return true;
    } catch (e) {
      console.error("[DEBUG] Error resolving emergency:", e);
      return false;
    }
  }

  async markFalseAlarm(sessionId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "emergencySessions", sessionId);
      await updateDoc(docRef, {
        status: "INACTIVE",
        lifecycleStage: LifecycleStage.FALSE_ALARM,
        falseAlarm: true,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.debug(`[DEBUG] Emergency lifecycle transitioned: ACTIVE/ESCALATED -> FALSE_ALARM [SessionID: ${sessionId}]`);
      logger.log('info', 'Emergency Orchestration', 'False alarm marked');
      return true;
    } catch (e) {
      console.error("[DEBUG] Error marking false alarm:", e);
      return false;
    }
  }
}

export const emergencyService = new EmergencyService();
