import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '../lib/firebase';
import { logger } from './incidentLogger';
import { RecordingState } from '../types/emergency';

class EvidenceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentEmergencyId: string | null = null;
  private startTime: number | null = null;
  private stream: MediaStream | null = null;
  private recordingState: RecordingState = RecordingState.IDLE;

  public async startRecording(emergencyId: string) {
    if (!auth.currentUser) {
      logger.log('high', 'VOICE_RECORDING', 'Auth required for recording');
      return;
    }

    if (this.recordingState !== RecordingState.IDLE && this.recordingState !== RecordingState.INTERRUPTED && this.recordingState !== RecordingState.FAILED) {
      console.warn("Recording already in progress or handling upload");
      return;
    }

    try {
      this.currentEmergencyId = emergencyId;
      this.audioChunks = [];
      this.recordingState = RecordingState.ARMED;
      logger.log('low', 'VOICE_RECORDING', 'Voice evidence armed');

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.recordingState = RecordingState.RECORDING;
        this.startTime = Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeRecordingSession', emergencyId);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.recordingState === RecordingState.INTERRUPTED) {
          this.cleanup();
          return;
        }
        
        this.recordingState = RecordingState.STOPPING;
        const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        await this.uploadEvidence(audioBlob, emergencyId, duration);
        this.cleanup();
      };

      this.mediaRecorder.start(1000); // chunk every second
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.recordingState = RecordingState.FAILED;
      logger.log('high', 'VOICE_RECORDING', 'Microphone unavailable during emergency');
    }
  }

  public async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.cleanup(); // Force cleanup if not actively recording
    }
  }

  public interruptRecording() {
    if (this.recordingState === RecordingState.RECORDING || this.recordingState === RecordingState.ARMED) {
      this.recordingState = RecordingState.INTERRUPTED;
      logger.log('medium', 'VOICE_RECORDING', 'Recording interrupted');
      
      if (this.currentEmergencyId) {
        this.updateEmergencyPayload(this.currentEmergencyId, {
          recordingState: RecordingState.INTERRUPTED,
          duration: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
          uploadRetries: 0,
          interrupted: true,
          uploadFailed: false
        });
      }
      this.stopRecording();
    }
  }

  public checkStaleRecording() {
    if (typeof window === 'undefined') return;
    const staleSession = localStorage.getItem('activeRecordingSession');
    if (staleSession) {
      logger.log('medium', 'VOICE_RECORDING', 'Stale recording session interrupted by refresh');
      this.updateEmergencyPayload(staleSession, {
        recordingState: RecordingState.INTERRUPTED,
        duration: 0, // Duration unknown after refresh
        uploadRetries: 0,
        interrupted: true,
        uploadFailed: false
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activeRecordingSession');
      }
    }
  }

  private async uploadEvidence(blob: Blob, emergencyId: string, duration: number, retryCount = 0) {
    const user = auth.currentUser;
    if (!user) {
      logger.log('high', 'VOICE_RECORDING', 'Evidence upload blocked: No authenticated user');
      this.recordingState = RecordingState.FAILED;
      return;
    }

    this.recordingState = RecordingState.UPLOADING;
    
    try {
      const storageRef = ref(storage, `evidence/${user.uid}/${emergencyId}/audio.webm`);
      await uploadBytes(storageRef, blob);
      await getDownloadURL(storageRef); // Verifies existence

      this.recordingState = RecordingState.UPLOADED;
      logger.log('low', 'VOICE_RECORDING', 'Evidence upload secured');
      
      await this.updateEmergencyPayload(emergencyId, {
        recordingState: RecordingState.UPLOADED,
        duration,
        uploadRetries: retryCount,
        interrupted: false,
        uploadFailed: false
      });

    } catch (error) {
      console.error(`Evidence upload failed (attempt ${retryCount + 1})`, error);
      
      if (retryCount < 2) {
        logger.log('medium', 'VOICE_RECORDING', 'Upload retry initiated');
        // Exponential backoff
        await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
        await this.uploadEvidence(blob, emergencyId, duration, retryCount + 1);
      } else {
        this.recordingState = RecordingState.FAILED;
        logger.log('high', 'VOICE_RECORDING', 'Evidence persistence failed');
        await this.updateEmergencyPayload(emergencyId, {
          recordingState: RecordingState.FAILED,
          duration,
          uploadRetries: retryCount,
          interrupted: false,
          uploadFailed: true
        });
      }
    }
  }

  private async updateEmergencyPayload(emergencyId: string, evidenceData: any) {
    try {
      const emergencyRef = doc(db, "emergencySessions", emergencyId);
      await updateDoc(emergencyRef, { evidence: evidenceData });
    } catch (e) {
      console.error("Failed to update emergency payload with evidence:", e);
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.stream = null;
    this.audioChunks = [];
    this.currentEmergencyId = null;
    this.startTime = null;
    this.recordingState = RecordingState.IDLE;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeRecordingSession');
    }
  }
}

export const evidenceService = new EvidenceService();
