export enum TriggerType {
  SHAKE_SOS = "SHAKE_SOS",
  HIDDEN_SOS = "HIDDEN_SOS",
  FALL_DETECTION = "FALL_DETECTION",
  SAFE_JOURNEY_ESCALATION = "SAFE_JOURNEY_ESCALATION",
  MANUAL_SOS = "MANUAL_SOS",
}

export enum RiskLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
}

export enum EventSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IncidentSource {
  SHAKE_SOS = "SHAKE_SOS",
  HIDDEN_SOS = "HIDDEN_SOS",
  FALL_DETECTION = "FALL_DETECTION",
  SAFE_ROUTE = "SAFE_ROUTE",
  VOICE_RECORDING = "VOICE_RECORDING",
  SYSTEM = "SYSTEM",
  GPS = "GPS",
  AI_MONITOR = "AI_MONITOR",
  MEDICAL = "MEDICAL",
  TRUSTED_CIRCLE = "TRUSTED_CIRCLE",
  FLASHLIGHT = "FLASHLIGHT"
}

export enum LifecycleStage {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
  FALSE_ALARM = "FALSE_ALARM",
  FAILED = "FAILED",
}

export enum LocationState {
  IDLE = "IDLE",
  FETCHING = "FETCHING",
  LIVE = "LIVE",
  LOW_ACCURACY = "LOW_ACCURACY",
  STALE = "STALE",
  FALLBACK = "FALLBACK",
  UNAVAILABLE = "UNAVAILABLE",
}

export enum RecordingState {
  IDLE = "IDLE",
  ARMED = "ARMED",
  RECORDING = "RECORDING",
  STOPPING = "STOPPING",
  UPLOADING = "UPLOADING",
  UPLOADED = "UPLOADED",
  FAILED = "FAILED",
  INTERRUPTED = "INTERRUPTED",
}

export interface MedicalProfileData {
  bloodGroup: string;
  allergies: string;
  conditions: string;
  caregiver: string;
  medications: string;
}

export interface EmergencyPayload {
  status: string;
  lifecycleStage: LifecycleStage;
  triggerType: TriggerType | string;
  latitude: number | null;
  longitude: number | null;
  telemetry?: {
    locationState: LocationState | string;
    accuracy: number | null;
    stale: boolean;
    fallbackUsed: boolean;
  };
  evidence?: {
    recordingState: RecordingState | string;
    duration: number;
    uploadRetries: number;
    interrupted: boolean;
    uploadFailed: boolean;
  };
  timestamp: any;
  createdAt: any;
  resolvedAt?: any;
  escalationLevel: number;
  falseAlarm: boolean;
  medicalProfile?: MedicalProfileData | null;
  recordingEnabled?: boolean;
}

export interface IncidentLogPayload {
  emergencyId?: string;
  severity: IncidentSeverity | string;
  source: IncidentSource | string;
  message: string;
  timestamp: any;
  lifecycleStage?: LifecycleStage | string;
  metadata?: any;
}
