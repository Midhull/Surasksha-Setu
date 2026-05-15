import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Map, Bell, Settings, Phone, Users, MapPin, Mic, Cpu, 
  Navigation, Activity, MessageSquare, CloudUpload, Route as RouteIcon, 
  Smartphone, EyeOff, Flashlight, UserCheck, BatteryMedium,
  Home, CheckCircle2, X, ExternalLink,
  Battery, BatteryCharging, BatteryLow, BatteryFull, Brain
} from "lucide-react";
import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GMap } from "../components/GMap";
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import { logger, IncidentEvent } from "../services/incidentLogger";
import { locationService } from "../services/locationService";
const FakeCallModal = React.lazy(() => import('../components/FakeCallModal').then(m => ({ default: m.FakeCallModal })));
const FallDetectionModal = React.lazy(() => import('../components/FallDetectionModal').then(m => ({ default: m.FallDetectionModal })));
const MedicalProfileModal = React.lazy(() => import('../components/MedicalProfileModal').then(m => ({ default: m.MedicalProfileModal })));
import { LocalizedErrorBoundary } from '../components/LocalizedErrorBoundary';
import { emergencyService } from '../services/emergencyService';
import { evidenceService } from '../services/evidenceService';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { authService } from "../services/authService";
import { useGuardians } from "../hooks/useGuardians";
import { useTelemetry } from "../hooks/useTelemetry";
import { useIncidentLogs } from "../hooks/useIncidentLogs";
import { useMap } from "../hooks/useMap";
import { useBattery } from "../hooks/useBattery";
import { useResponders } from "../hooks/useResponders";

import { LocationState } from '../types/emergency';
import { toast } from "sonner";
import { IdentityAvatar } from "@/components/IdentityAvatar";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { Skeleton } from "../components/Skeleton";

const logOperational = (tag: string, message: string) => 
  console.log(`%c[${tag}]%c ${message}`, 'color: #dc2626; font-weight: bold', 'color: inherit');

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};



function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile(user);
  const [sosActive, setSosActive] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [telegramStatus, setTelegramStatus] = useState<'PENDING' | 'SENT' | 'FAILED'>('PENDING');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, authLoading, navigate]);

  const { incidentEvents } = useIncidentLogs();
  const [mapMode, setMapMode] = useState<'IDLE' | 'TRACKING' | 'ROUTE' | 'NEARBY'>('IDLE');
  const { batteryLevel, isCharging } = useBattery();
  const { currentTelemetry, setCurrentTelemetry, gpsStatus, gpsActive, lastUpdated } = useTelemetry(user, sosActive, mapMode, batteryLevel);
  const { guardians, loading: loadingGuardians } = useGuardians(user, currentTelemetry);
  const { responderCount } = useResponders(user);
  const mapState = useMap();
  const [isRecovering, setIsRecovering] = useState(true);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isEmergencyCountdownOpen, setIsEmergencyCountdownOpen] = useState(false);
  const [isHiddenCountdownOpen, setIsHiddenCountdownOpen] = useState(false);
  const [isManualCountdownOpen, setIsManualCountdownOpen] = useState(false);
  const [isFallEscalating, setIsFallEscalating] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(null);
  const emergencyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [fallCountdown, setFallCountdown] = useState<number | null>(null);
  const fallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hiddenCountdown, setHiddenCountdown] = useState<number | null>(null);
  const hiddenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [manualCountdown, setManualCountdown] = useState<number | null>(null);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [journeyDestination, setJourneyDestination] = useState("");
  const [journeyDuration, setJourneyDuration] = useState<number>(15);
  const [activeJourney, setActiveJourney] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('activeJourney');
    return saved ? JSON.parse(saved) : null;
  });
  const [journeyTimeLeft, setJourneyTimeLeft] = useState<number | null>(null);
  const [isJourneyDrawerOpen, setIsJourneyDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [escalationCountdown, setEscalationCountdown] = useState<number | null>(null);
  const escalationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('voiceEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoRecord, setAutoRecord] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('autoRecord');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [voiceQuality, setVoiceQuality] = useState<'Low' | 'Medium' | 'High'>(() => {
    if (typeof window === 'undefined') return 'Medium';
    return (localStorage.getItem('voiceQuality') as any) || 'Medium';
  });
  const [voiceMaxLength, setVoiceMaxLength] = useState<'30 Seconds' | '1 Minute' | '5 Minutes' | 'Unlimited'>(() => {
    if (typeof window === 'undefined') return 'Unlimited';
    return (localStorage.getItem('voiceMaxLength') as any) || 'Unlimited';
  });
  const [autoEvidenceUpload, setAutoEvidenceUpload] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('autoEvidenceUpload');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isFlashSettingsOpen, setIsFlashSettingsOpen] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('flashEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [flashMode, setFlashMode] = useState<'Screen Flash' | 'Torch Simulation'>(() => {
    if (typeof window === 'undefined') return 'Screen Flash';
    return (localStorage.getItem('flashMode') as any) || 'Screen Flash';
  });
  const [autoFlash, setAutoFlash] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('autoFlash');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [flashSpeed, setFlashSpeed] = useState<'Slow' | 'Medium' | 'Fast'>(() => {
    if (typeof window === 'undefined') return 'Medium';
    return (localStorage.getItem('flashSpeed') as any) || 'Medium';
  });
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastActivation, setLastActivation] = useState<string>("Never");
  const [hiddenLastActivation, setHiddenLastActivation] = useState<string>("Never");
  const [flashLastActivation, setFlashLastActivation] = useState<string>("Never");
  const [voiceLastRecording, setVoiceLastRecording] = useState<string>("Never");
  const [logoTapCount, setLogoTapCount] = useState(0);

  const {
    routePolyline, setRoutePolyline,
    nearbyResults, setNearbyResults,
    isFullscreenMapOpen, setIsFullscreenMapOpen,
    isSearchingNearby, setIsSearchingNearby,
    routesLib, placesLib, geometryLib,
    isSafeRouteOpen, setIsSafeRouteOpen,
    routeStart, setRouteStart,
    routeDest, setRouteDest,
    structuredStart, setStructuredStart,
    structuredDest, setStructuredDest,
    routeIsWalking, setRouteIsWalking,
    routeAnalysisState, setRouteAnalysisState,
    routeRisk, setRouteRisk,
    routeInsights, setRouteInsights,
    routeRecommendation, setRouteRecommendation,
    routeAlternative, setRouteAlternative,
    locationStatus, setLocationStatus,
    gpsFailCount, setGpsFailCount
  } = mapState;


  const motionProfile = useAdaptiveMotion(sosActive, false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const currentEmergencyIdRef = useRef<string | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    evidenceService.stopRecording();
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setVoiceLastRecording(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    logger.log('info', 'Evidence Engine', 'Tactical audio recording finalized');
  }, []);

  const startRecording = useCallback(async (emergencyId: string | null = null) => {
    if (isRecording || !voiceEnabled || !emergencyId) return;
    
    setIsRecording(true);
    setRecordingSeconds(0);
    evidenceService.startRecording(emergencyId);
    
    const tick = () => {
      setRecordingSeconds(prev => {
        const next = prev + 1;
        
        let maxSeconds = Infinity;
        if (voiceMaxLength === '30 Seconds') maxSeconds = 30;
        if (voiceMaxLength === '1 Minute') maxSeconds = 60;
        if (voiceMaxLength === '5 Minutes') maxSeconds = 300;

        if (next >= maxSeconds) {
          stopRecording();
          return prev; // Stop incrementing
        }
        
        recordingTimerRef.current = setTimeout(tick, 1000);
        return next;
      });
    };

    recordingTimerRef.current = setTimeout(tick, 1000);
    logger.log('medium', 'Evidence Engine', 'Tactical audio recording initiated');
  }, [isRecording, voiceEnabled, voiceMaxLength, stopRecording]);

  const finalizeSOS = useCallback(async (telemetry: any, triggerType: "SHAKE_SOS" | "HIDDEN_SOS" | "MANUAL_SOS" | "SAFE_JOURNEY_ESCALATION" | "FALL_DETECTION") => {
    setIsFetchingLocation(false);
    setIsEmergencyCountdownOpen(false);
    setIsHiddenCountdownOpen(false);
    setSosActive(true);
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    if (triggerType === "SHAKE_SOS") setLastActivation(timeStr);
    if (triggerType === "HIDDEN_SOS") setHiddenLastActivation(timeStr);
    
    if (flashEnabled && autoFlash) {
      logger.log('medium', 'Flashlight SOS', 'Auto SOS beacon armed');
      setIsFlashing(true);
      setFlashLastActivation(timeStr);
    }

    if (!navigator.onLine) {
      logOperational('OFFLINE_MODE', 'Network uplink lost. Queuing SOS payload for retry...');
      localStorage.setItem('emergency_queue', JSON.stringify({ telemetry, type: triggerType, timestamp: Date.now() }));
      logger.log('high', 'System', 'Offline SOS queued');
      return;
    }

    const sessionId = await emergencyService.createEmergencySession(triggerType, telemetry, user?.uid || '');
    
    if (sessionId) {
      setActiveSessionId(sessionId);
      if (voiceEnabled && autoRecord) {
        logger.log('medium', 'Voice Recording', 'Auto-recording triggered');
        startRecording(sessionId);
      }
      
      // Initiation Log
      logger.log('high', 'Emergency Orchestration', 'Awaiting verified guardian acknowledgements (Cloud Orchestration Active)');
    }
  }, [user?.uid, flashEnabled, autoFlash, voiceEnabled, autoRecord, startRecording]);

  const analyzeRoute = useCallback(() => {
    if (!routeStart || !routeDest) return;
    setRouteAnalysisState('ANALYZING');
    logger.log('low', 'Safe Route AI', `Geospatial intelligence scan initiated for destination: ${routeDest}`);

    setTimeout(() => {
      const destLower = routeDest.toLowerCase();
      const startLower = routeStart.toLowerCase();
      
      let calculatedRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
      let matchedZones: any[] = [];

      // Simulated Geospatial Risk Analysis
      if (structuredDest) {
        const { lat, lng } = structuredDest;
        // Mock: High risk if in a specific simulated "Dark Zone" (e.g. lat > 28.7)
        if (lat > 28.72) {
          matchedZones.push({ name: "Sector 4 Cluster", reason: "Elevated risk telemetry in target sector", risk: "HIGH" });
          calculatedRisk = 'HIGH';
        }
      }

      for (const zone of UNSAFE_ZONES) {
        if (zone.keywords.some(k => destLower.includes(k) || startLower.includes(k))) {
          matchedZones.push(zone);
          if (zone.risk === 'HIGH') calculatedRisk = 'HIGH';
          else if (zone.risk === 'MODERATE' && calculatedRisk !== 'HIGH') calculatedRisk = 'MODERATE';
        }
      }

      const hour = new Date().getHours();
      if ((hour >= 22 || hour < 5) && routeIsWalking) {
        if (calculatedRisk === 'LOW') calculatedRisk = 'MODERATE';
        matchedZones.push({ reason: "Late-night travel on foot" });
      }

      setRouteRisk(calculatedRisk);
      
      const insights = matchedZones.map(zone => zone.reason);
      if (insights.length === 0) insights.push("Route appears safe under current conditions");
      setRouteInsights(insights);

      if (calculatedRisk === 'HIGH') {
        setRouteRecommendation("CRITICAL: This route has elevated risk telemetry. We recommend taking a vehicle or choosing an alternative path.");
        setRouteAlternative("Safe Detour via Main Street");
      } else if (calculatedRisk === 'MODERATE') {
        setRouteRecommendation("ADVISORY: Moderate risk factors detected. Maintain system readiness.");
        setRouteAlternative("None required");
      } else {
        setRouteRecommendation("OPTIMAL: No significant threats detected along this path.");
        setRouteAlternative("None required");
      }

      setRouteAnalysisState('RESULT');
      logger.log('info', 'Safe Route AI', 'Intelligence scan finalized - insights ready');
    }, 1500);
  }, [routeStart, routeDest, structuredDest, routeIsWalking]);

  const triggerShakeEmergency = useCallback(() => {
    logOperational('TIMER', 'Shake countdown initiated (3s)');
    setIsEmergencyCountdownOpen(true);
    setEmergencyCountdown(3); // Standardized 3s for shake
    if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
  }, []);

  const cancelShakeEmergency = useCallback(() => {
    setIsEmergencyCountdownOpen(false);
    setEmergencyCountdown(null);
    if (emergencyTimerRef.current) clearTimeout(emergencyTimerRef.current);
  }, []);

  const triggerFallEmergency = useCallback(() => {
    logOperational('TIMER', 'Fall escalation initiated (15s)');
    setIsFallEscalating(true);
    setFallCountdown(15);
    if (window.navigator.vibrate) window.navigator.vibrate([500, 500, 500]);
    logger.log('medium', 'Fall Detection', 'Possible fall detected - waiting for response');
  }, []);

  const cancelFallEmergency = useCallback(() => {
    setIsFallEscalating(false);
    setFallCountdown(null);
    if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
    logger.log('info', 'Fall Detection', 'Fall escalation cancelled by user');
  }, []);

  const triggerHiddenEmergency = useCallback(() => {
    logOperational('TIMER', 'Hidden gesture confirmed. Discreet countdown (3s)');
    setIsHiddenCountdownOpen(true);
    setHiddenCountdown(3);
    setLogoTapCount(0);
    if (window.navigator.vibrate) window.navigator.vibrate([100]);
  }, []);

  const cancelHiddenEmergency = useCallback(() => {
    setIsHiddenCountdownOpen(false);
    setHiddenCountdown(null);
    setLogoTapCount(0);
    if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
  }, []);

  const startSOS = useCallback(() => {
    if (sosActive || isManualCountdownOpen) {
      if (sosActive) {
        logOperational('SOS', 'Active session detected. Termination initiated.');
        setSosActive(false);
        setIsFlashing(false);
        stopRecording();
      }
      return;
    }
    logOperational('TIMER', 'SOS request initiated. Preparing systems...');
    setManualCountdown(3);
    setIsManualCountdownOpen(true);
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
  }, [sosActive, isManualCountdownOpen, stopRecording]);

  const cancelSOS = useCallback(() => {
    setIsManualCountdownOpen(false);
    setManualCountdown(null);
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    logOperational('TIMER', 'SOS request aborted by user');
  }, []);

  const confirmSafeArrival = useCallback(async () => {
    setActiveJourney(null);
    setJourneyTimeLeft(null);
    setIsEscalationOpen(false);
    setJourneyDestination("");
    if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
    console.log("Arrival confirmed");
  }, []);

  const triggerJourneyEscalation = useCallback(() => {
    if (isEscalationOpen) return;
    console.log("Safe journey escalated - waiting for response");
    setIsEscalationOpen(true);
    setEscalationCountdown(30);
  }, [isEscalationOpen]);

  const startJourney = useCallback(async () => {
    if (!journeyDestination) return;
    const now = Date.now();
    const expiresAtLocal = now + journeyDuration * 60 * 1000;
    
    const newJourney = {
      userId: user.uid,
      destination: journeyDestination,
      coords: structuredDest ? { lat: structuredDest.lat, lng: structuredDest.lng } : null,
      expectedArrivalTime: journeyDuration,
      status: "ACTIVE",
      expiresAtLocal,
      startedAtLocal: now
    };
    setActiveJourney(newJourney);
    setIsJourneyDrawerOpen(false);
    console.log("Safe journey started");

    try {
      await addDoc(collection(db, "safeJourneys"), {
        userId: user.uid,
        destination: journeyDestination,
        expectedArrivalTime: journeyDuration,
        status: "ACTIVE",
        startedAt: serverTimestamp()
      });
      logOperational('DB_WRITE', 'Safe Journey persistent node created');
    } catch (e) {
      console.error("Safe Journey persistence failed:", e);
    }
  }, [journeyDestination, journeyDuration, user?.uid, structuredDest]);

  // --- HOISTED SOS & RECORDING INFRASTRUCTURE ---

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('voiceEnabled', JSON.stringify(voiceEnabled)); }, [voiceEnabled]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('autoRecord', JSON.stringify(autoRecord)); }, [autoRecord]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('autoEvidenceUpload', JSON.stringify(autoEvidenceUpload)); }, [autoEvidenceUpload]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('voiceQuality', voiceQuality); }, [voiceQuality]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('voiceMaxLength', voiceMaxLength); }, [voiceMaxLength]);


  const handleResolveEmergency = useCallback(async () => {
    if (activeSessionId) {
      await emergencyService.resolveEmergency(activeSessionId);
      logger.log('info', 'Emergency Orchestration', 'Emergency resolved successfully');
    }
    setSosActive(false);
    setActiveSessionId(null);
    setIsFlashing(false);
    if (isRecording) stopRecording();
  }, [activeSessionId, isRecording, stopRecording]);

  const handleFalseAlarm = useCallback(async () => {
    if (activeSessionId) {
      await emergencyService.markFalseAlarm(activeSessionId);
      logger.log('info', 'Emergency Orchestration', 'False alarm marked by user');
    }
    setSosActive(false);
    setActiveSessionId(null);
    setIsFlashing(false);
    if (isRecording) stopRecording();
  }, [activeSessionId, isRecording, stopRecording]);

  const activateEmergency = useCallback(async (type: "SHAKE_SOS" | "HIDDEN_SOS" | "MANUAL_SOS" | "SAFE_JOURNEY_ESCALATION" | "FALL_DETECTION") => {
    if (sosActive || isFetchingLocation) return;
    
    // Clear countdowns
    setEmergencyCountdown(null);
    setHiddenCountdown(null);
    setFallCountdown(null);
    setManualCountdown(null);
    setIsManualCountdownOpen(false);
    setIsFallEscalating(false);
    
    logOperational('SOS', `Tactical Alert: ${type}. Synchronizing fresh telemetry...`);
    setIsFetchingLocation(true);
    
    try {
      // Force a high-accuracy fresh telemetry lock (retry count 2)
      const telemetry = await locationService.getEmergencyTelemetry(2);
      finalizeSOS(telemetry, type);
    } catch (e) {
      console.warn("Location Service failed entirely", e);
      finalizeSOS({
        latitude: 12.9716, 
        longitude: 77.5946, 
        accuracy: null, 
        stale: true, 
        fallbackUsed: true,
        locationState: "UNAVAILABLE"
      }, type);
    }
  }, [sosActive, isFetchingLocation, finalizeSOS]);




  // 1. GPS Status Acquisition (Handled by useTelemetry)
  
  // 2. Verified Acknowledgement Monitoring
  const [activeAcknowledgements, setActiveAcknowledgements] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!sosActive || !activeSessionId || !user) {
      setActiveAcknowledgements({});
      return;
    }

    logOperational('ORCHESTRATION', `[FIRESTORE] Attaching acknowledgement listener for session ${activeSessionId}`);
    const unsub = onSnapshot(
      query(
        collection(db, "emergencySessions", activeSessionId, "acknowledgements"),
        where("type", "==", "GUARDIAN_RESPONSE")
      ), 
      (snapshot) => {
        logOperational('ORCHESTRATION', `[FIRESTORE] Syncing ${snapshot.size} acknowledgements`);
        const acks: Record<string, any> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          acks[data.guardianId] = data;
          
          if (!activeAcknowledgements[data.guardianId]) {
            logger.log('high', 'Emergency Orchestration', `Verified acknowledgement from ${data.guardianName}`);
          }
        });
        setActiveAcknowledgements(acks);
      },
      (error) => {
        console.error("[FIRESTORE] Acknowledgement listener failed:", error);
      }
    );

    // Also listen to the session itself for Telegram status
    const sessionUnsub = onSnapshot(doc(db, "emergencySessions", activeSessionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.status === "INACTIVE" || data.status === "RESOLVED") {
          // Add a short delay for emotional closure before returning to safe mode
          setTimeout(() => {
            setSosActive(false);
            setActiveSessionId(null);
          }, 3000);
        }
        // Expose telegram status if needed
        setTelegramStatus(data.telegramStatus || "PENDING");
      }
    });

    return () => {
      unsub();
      sessionUnsub();
      logOperational('ORCHESTRATION', '[FIRESTORE] Listeners disposed');
    };
  }, [sosActive, activeSessionId, user?.uid]);

  // --- PASSIVE SESSION CLEANUP ---
  useEffect(() => {
    if (!user?.uid) return;
    
    const cleanup = async () => {
      try {
        const q = query(
          collection(db, "emergencySessions"), 
          where("userId", "==", user.uid), 
          where("status", "==", "ACTIVE")
        );
        const snapshot = await getDocs(q);
        const now = Date.now();
        const FOUR_HOURS = 4 * 60 * 60 * 1000;

        snapshot.docs.forEach(async (d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toMillis() || data.timestamp?.toMillis() || 0;
          if (createdAt && (now - createdAt) > FOUR_HOURS) {
            console.log(`[CLEANUP] Resolving stale session: ${d.id}`);
            await emergencyService.resolveEmergency(d.id);
          }
        });
      } catch (e) {
        console.error("[CLEANUP] Failed to process stale sessions:", e);
      }
    };

    cleanup();
  }, [user?.uid]);

  // 4. Offline SOS Queue Recovery Lifecycle
  useEffect(() => {
    if (!navigator.onLine) return;

    const purgeQueue = async () => {
      const queued = localStorage.getItem('emergency_queue');
      if (queued) {
        logOperational('OFFLINE_SYNC', 'Connectivity restored. Purging offline SOS queue...');
        try {
          const payload = JSON.parse(queued);
          await finalizeSOS(payload.telemetry, payload.type);
          localStorage.removeItem('emergency_queue');
        } catch (e) {
          logOperational('OFFLINE_SYNC', 'Queue recovery failed - payload corrupted');
        }
      }
    };

    purgeQueue();
    window.addEventListener('online', purgeQueue);
    return () => window.removeEventListener('online', purgeQueue);
  }, []);

  // 3. Operational State Recovery (Critical for reliability)
  useEffect(() => {
    if (!user?.uid || authLoading) return;
    
    const recoverState = async () => {
      setIsRecovering(true);
      logOperational('RECOVERY', 'Scanning for active operational sessions...');
      
      try {
        const localSos = localStorage.getItem('sosActive') === 'true';
        const activeSession = await emergencyService.getActiveSession(user.uid);
        
        if (activeSession) {
          logOperational('RECOVERY', `Found verified active session: ${activeSession.id}`);
          setSosActive(true);
          setActiveSessionId(activeSession.id);
          setTelegramStatus(activeSession.data.telegramStatus || "PENDING");
          logger.log('medium', 'System', 'Session re-hydrated from Firestore');
        } else if (localSos) {
          logOperational('RECOVERY', 'Local SOS state found but no server session. Syncing...');
          setSosActive(false);
          localStorage.removeItem('sosActive');
        } else {
          logOperational('RECOVERY', 'No active sessions found. System ready.');
        }
      } catch (e) {
        console.error("[RECOVERY] Fatal recovery error:", e);
      } finally {
        setIsRecovering(false);
      }
      
      evidenceService.checkStaleRecording();
    };

    recoverState();
  }, [user?.uid, authLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isRecovering) {
      localStorage.setItem('sosActive', String(sosActive));
    }
  }, [sosActive, isRecovering]);

  // --- SHAKE SOS STATE ---
  const [isShakeSettingsOpen, setIsShakeSettingsOpen] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('shakeEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [shakeSensitivity, setShakeSensitivity] = useState<'Low' | 'Medium' | 'High'>(() => {
    if (typeof window === 'undefined') return 'High';
    return (localStorage.getItem('shakeSensitivity') as any) || 'High';
  });
  const [bgMonitoring, setBgMonitoring] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState<3 | 5 | 10>(5);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('shakeEnabled', JSON.stringify(shakeEnabled)); }, [shakeEnabled]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('shakeSensitivity', shakeSensitivity); }, [shakeSensitivity]);


  // --- TRUSTED CIRCLE STATE ---
  const [isTrustedCircleOpen, setIsTrustedCircleOpen] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: 'Mother',
    priority: 1
  });

  // --- HIDDEN SOS STATE ---
  const [isHiddenSettingsOpen, setIsHiddenSettingsOpen] = useState(false);
  const [hiddenEnabled, setHiddenEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('hiddenEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [hiddenSensitivity, setHiddenSensitivity] = useState<'Standard' | 'Sensitive' | 'Advanced'>(() => {
    if (typeof window === 'undefined') return 'Medium';
    return (localStorage.getItem('hiddenSensitivity') as any) || 'Medium';
  });

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('hiddenEnabled', JSON.stringify(hiddenEnabled)); }, [hiddenEnabled]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('hiddenSensitivity', hiddenSensitivity); }, [hiddenSensitivity]);


  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fallCheckTimerRef = useRef<NodeJS.Timeout | null>(null);


  // --- NEW WOMEN & ELDERLY SAFETY STATES ---
  const [fakeCallEnabled, setFakeCallEnabled] = useState(false);
  const [isFakeCallSettingsOpen, setIsFakeCallSettingsOpen] = useState(false);
  
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(true);
  const [isFallDetectionOpen, setIsFallDetectionOpen] = useState(false);
  
  const [medicalProfileActive, setMedicalProfileActive] = useState(false);
  const [isMedicalProfileOpen, setIsMedicalProfileOpen] = useState(false);

  // --- FLASHLIGHT SOS STATE ---

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('flashEnabled', JSON.stringify(flashEnabled)); }, [flashEnabled]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('flashMode', flashMode); }, [flashMode]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('autoFlash', JSON.stringify(autoFlash)); }, [autoFlash]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('flashSpeed', flashSpeed); }, [flashSpeed]);

  // --- SAFE JOURNEY STATE ---

  const [distanceToHome, setDistanceToHome] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);

  useEffect(() => {
    // Distance to Home Calculation
    if (activeJourney && currentTelemetry?.latitude && activeJourney.coords) {
      const dist = calculateDistance(
        currentTelemetry.latitude,
        currentTelemetry.longitude,
        activeJourney.coords.lat,
        activeJourney.coords.lng
      );
      setDistanceToHome(dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`);
    } else {
      setDistanceToHome(null);
    }

    // Tracking Status Feedback
    if (currentTelemetry) {
      if (currentTelemetry.speed && currentTelemetry.speed > 0.5) {
        setTrackingStatus(`${(currentTelemetry.speed * 3.6).toFixed(0)} KM/H`);
      } else if (gpsActive) {
        setTrackingStatus("Live");
      } else {
        setTrackingStatus("Offline");
      }
    } else {
      setTrackingStatus(null);
    }
  }, [currentTelemetry, activeJourney, gpsActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeJourney', JSON.stringify(activeJourney));
    }
  }, [activeJourney]);

  // Handle Journey Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJourney && activeJourney.status === 'ACTIVE') {
      interval = setInterval(() => {
        const now = Date.now();
        const expiresAt = activeJourney.expiresAtLocal;
        const left = Math.floor((expiresAt - now) / 1000);
        if (left <= 0) {
          clearInterval(interval);
          setJourneyTimeLeft(0);
          triggerJourneyEscalation();
        } else {
          setJourneyTimeLeft(left);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeJourney]);

  // --- REAL-TIME TELEMETRY ORCHESTRATION ---
  const lastSyncTime = useRef<number>(0);
  useEffect(() => {
    if (currentTelemetry && sosActive) {
      const now = Date.now();
      // Rate limit telemetry sync to once every 5 seconds
      if (now - lastSyncTime.current < 5000) return;
      lastSyncTime.current = now;

      const syncTelemetry = async () => {
        try {
          logOperational('TELEMETRY_SYNC', 'Uplinking live telemetry to Firestore');
          // Sync live coordinates to emergency session stream
          await addDoc(collection(db, "emergencySessions"), {
             userId: user.uid,
             latitude: currentTelemetry.latitude,
             longitude: currentTelemetry.longitude,
             accuracy: currentTelemetry.accuracy,
             speed: currentTelemetry.speed,
             heading: currentTelemetry.heading,
             timestamp: serverTimestamp(),
             state: currentTelemetry.locationState,
             sosActive: true
          });
        } catch (e) {
          logOperational('TELEMETRY_SYNC', 'Firestore uplink failed');
          console.warn("Telemetry uplink interrupted", e);
        }
      };
      syncTelemetry();
    }
  }, [currentTelemetry, sosActive]);

  // Route Deviation Monitoring
  useEffect(() => {
    if (mapMode === 'ROUTE' && routePolyline && routePolyline.length > 0 && currentTelemetry?.latitude) {
      const userPos = { lat: currentTelemetry.latitude, lng: currentTelemetry.longitude };
      
      // OPTIMIZATION: Only check every 5th point if the polyline is large to save CPU
      const step = routePolyline.length > 100 ? 5 : 1;
      let isOnRoute = false;
      
      for (let i = 0; i < routePolyline.length; i += step) {
        const p = routePolyline[i];
        const dist = Math.sqrt(Math.pow(p.lat - userPos.lat, 2) + Math.pow(p.lng - userPos.lng, 2));
        if (dist < 0.0005) { // Approx 50 meters
          isOnRoute = true;
          break;
        }
      }

      if (!isOnRoute) {
        logger.log('high', 'Safe Route AI', 'CRITICAL: Route deviation detected');
      }
    }
  }, [currentTelemetry, routePolyline, mapMode]);





  useEffect(() => {
    if (escalationCountdown !== null && escalationCountdown > 0) {
      escalationTimerRef.current = setTimeout(() => setEscalationCountdown(escalationCountdown - 1), 1000);
    } else if (escalationCountdown === 0 && isEscalationOpen) {
      console.log("Emergency triggered from journey escalation");
      activateEmergency("SAFE_JOURNEY_ESCALATION");
      setIsEscalationOpen(false);
      setEscalationCountdown(null);
      setActiveJourney(null);
    }
    return () => {
      if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
    };
  }, [escalationCountdown, isEscalationOpen]);

  // --- MAP ORCHESTRATION ---

  const handleOpenLiveTracking = useCallback(() => {
    logOperational('HUD_TRANSITION', 'Activating Immersive Tracking');
    setMapMode('TRACKING');
    setIsFullscreenMapOpen(true);
    logger.log('low', 'System HUD', 'Immersive live tracking activated');
  }, []);

  const handleViewSafeRoute = useCallback(() => {
    if (!structuredDest) {
      logOperational('HUD_TRANSITION', 'No destination set, opening Safe Route AI modal');
      setIsSafeRouteOpen(true);
      return;
    }

    if (!structuredStart || !routesLib || !window.google?.maps) {
       logOperational('ROUTE_RENDER', 'Uplink failure: missing telemetry or map services');
       logger.log('medium', 'Safe Route AI', 'Missing telemetry data for route visualization');
       return;
    }
    
    // Perform safety analysis if not already done
    if (routeAnalysisState !== 'RESULT') {
      analyzeRoute();
    }

    logOperational('ROUTE_RENDER', 'Initializing DirectionsService for map visualization');
    const directionsService = new routesLib.DirectionsService();
    directionsService.route(
      {
        origin: { lat: structuredStart.lat, lng: structuredStart.lng },
        destination: { lat: structuredDest.lat, lng: structuredDest.lng },
        travelMode: routeIsWalking ? routesLib.TravelMode.WALKING : routesLib.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === routesLib.DirectionsStatus.OK && result && result.routes[0].overview_path) {
          const points = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
          setRoutePolyline(points);
          setMapMode('ROUTE');
          setIsFullscreenMapOpen(true);
          logOperational('ROUTE_RENDER', `Map polyline generated: ${points.length} nodes`);
          logger.log('low', 'Safe Route AI', 'Map visualization active with risk analysis');
        } else {
          logOperational('ROUTE_RENDER', `Directions fetch failed: ${status}`);
          logger.log('high', 'Safe Route AI', 'Failed to generate map route polyline');
        }
      }
    );
  }, [structuredDest, structuredStart, routesLib, routeAnalysisState, routeIsWalking]);

  const handleNearbyHelp = useCallback(async () => {
    // If telemetry is missing, try to fetch it once before failing
    let telemetryToUse = currentTelemetry;
    if (!telemetryToUse) {
      try {
        logOperational('NEARBY_SCAN', 'Telemetry missing, attempting emergency acquisition');
        const fresh = await locationService.getCurrentLocation();
        telemetryToUse = { latitude: fresh.lat, longitude: fresh.lng };
        setCurrentTelemetry(telemetryToUse);
      } catch (err) {
        logOperational('NEARBY_SCAN', 'Primary acquisition failed');
      }
    }

    if (!telemetryToUse || !placesLib || !geometryLib || !window.google?.maps) {
      logOperational('NEARBY_SCAN', 'Uplink failure: missing telemetry or map services');
      logger.log('medium', 'Situational Awareness', 'Uplink unavailable for assistance scan');
      return;
    }
    
    logOperational('NEARBY_SCAN', 'Initializing multi-agency scan');
    setIsSearchingNearby(true);
    setNearbyResults([]);
    
    const service = new placesLib.PlacesService(document.createElement('div'));
    // Prioritize Police & Hospital if SOS is active, otherwise broader emergency scan
    const types = sosActive ? ['police', 'hospital'] : ['police', 'hospital', 'fire_station', 'pharmacy'];
    const radius = sosActive ? 5000 : 3000;
    
    let allResults: any[] = [];
    let completed = 0;

    types.forEach(type => {
      service.nearbySearch(
        {
          location: { lat: telemetryToUse.latitude, lng: telemetryToUse.longitude },
          radius: radius,
          type: type as any
        },
        (results, status) => {
          completed++;
          if (status === placesLib.PlacesServiceStatus.OK && results) {
            allResults = [...allResults, ...results.filter(r => r.geometry?.location).slice(0, 4)];
          }
          
          if (completed === types.length) {
            const processed = allResults.map(r => {
              const distance = geometryLib.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(telemetryToUse.latitude, telemetryToUse.longitude),
                r.geometry.location
              );
              return { 
                ...r, 
                distance_meters: distance,
                isOpen: r.opening_hours?.isOpen?.() ?? true 
              };
            });

            setNearbyResults(processed.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0)));
            setMapMode('NEARBY');
            setIsFullscreenMapOpen(true);
            setIsSearchingNearby(false);
            logger.log('low', 'Situational Awareness', `Nearby assistance scan completed: ${processed.length} nodes prioritized by distance`);
          }
        }
      );
    });
  }, [currentTelemetry, placesLib, geometryLib, sosActive]);

  const closeAllModals = useCallback(() => {
    setIsTrustedCircleOpen(false);
    setIsHiddenSettingsOpen(false);
    setIsJourneyDrawerOpen(false);
    setIsSafeRouteOpen(false);
    setIsShakeSettingsOpen(false);
    setIsFakeCallSettingsOpen(false);
    setIsAiThreatOpen(false);
    setIsFallDetectionOpen(false);
    setIsMedicalProfileOpen(false);
    setIsVoiceSettingsOpen(false);
    setIsProfileDrawerOpen(false);
  }, []);

  const navigateTo = useCallback((mode: 'IDLE' | 'TRACKING' | 'NETWORK' | 'SETTINGS') => {
    closeAllModals();
    if (mode === 'IDLE') setMapMode('IDLE');
    else if (mode === 'TRACKING') setMapMode('TRACKING');
    else if (mode === 'NETWORK') setIsTrustedCircleOpen(true);
    else if (mode === 'SETTINGS') setIsHiddenSettingsOpen(true);
  }, [closeAllModals]);

  const openShakeSettings = useCallback(() => { closeAllModals(); setIsShakeSettingsOpen(true); }, [closeAllModals]);
  const openHiddenSettings = useCallback(() => { closeAllModals(); setIsHiddenSettingsOpen(true); }, [closeAllModals]);
  const openFakeCallSettings = useCallback(() => { closeAllModals(); setIsFakeCallSettingsOpen(true); }, [closeAllModals]);
  const openSafeRoute = useCallback(() => { closeAllModals(); setIsSafeRouteOpen(true); }, [closeAllModals]);
  const openJourneyDrawer = useCallback(() => { closeAllModals(); setIsJourneyDrawerOpen(true); }, [closeAllModals]);
  const openFlashSettings = useCallback(() => { closeAllModals(); setIsFlashSettingsOpen(true); }, [closeAllModals]);
  const openTrustedCircle = useCallback(() => { closeAllModals(); setIsTrustedCircleOpen(true); }, [closeAllModals]);
  const openAiThreat = useCallback(() => { closeAllModals(); setIsAiThreatOpen(true); }, [closeAllModals]);
  const openFallDetection = useCallback(() => { closeAllModals(); setIsFallDetectionOpen(true); }, [closeAllModals]);
  const openMedicalProfile = useCallback(() => { closeAllModals(); setIsMedicalProfileOpen(true); }, [closeAllModals]);
  const openVoiceSettings = useCallback(() => { closeAllModals(); setIsVoiceSettingsOpen(true); }, [closeAllModals]);
  const openProfileDrawer = useCallback(() => { closeAllModals(); setIsProfileDrawerOpen(true); }, [closeAllModals]);

  // Auto-refresh nearby nodes if in NEARBY mode
  useEffect(() => {
    if (mapMode !== 'NEARBY' || !isFullscreenMapOpen) return;
    
    let nearbyTimer: NodeJS.Timeout;
    
    const pollNearby = () => {
      logOperational('NEARBY_SCAN', 'Executing scheduled re-scan');
      handleNearbyHelp();
      nearbyTimer = setTimeout(pollNearby, 30000);
    };
    
    pollNearby();
    
    return () => {
      if (nearbyTimer) clearTimeout(nearbyTimer);
    };
  }, [mapMode, isFullscreenMapOpen]);

  useEffect(() => {
    if (isSafeRouteOpen && locationStatus === 'IDLE' && !routeStart) {
      setLocationStatus('FETCHING');
      
      locationService.getCurrentLocation()
        .then(result => {
          setRouteStart(result.address);
          setStructuredStart({ lat: result.lat, lng: result.lng, address: result.address });
          if (result.isCached) {
            setLocationStatus('CACHED');
            logger.log('low', 'GPS Telemetry', 'Cached location restored');
          } else {
            setLocationStatus('LIVE');
            logger.log('low', 'GPS Telemetry', 'Live GPS location acquired');
            if (result.error) {
              logger.log('medium', 'GPS Telemetry', 'Reverse geocoding fallback used');
            }
          }
        })
        .catch(err => {
          setLocationStatus('FAILED');
          setGpsFailCount(prev => prev + 1);
          console.warn("GPS failed", err);
          logger.log('medium', 'GPS Telemetry', 'GPS timeout or permission denied');
        });
    }
  }, [isSafeRouteOpen, locationStatus, routeStart]);

  const handleManualLocationEdit = (val: string) => {
    setRouteStart(val);
    if (locationStatus !== 'MANUAL' && locationStatus !== 'IDLE' && val.length > 0) {
      setLocationStatus('MANUAL');
      logger.log('medium', 'GPS Telemetry', 'Manual location override enabled');
    }
  };

  const UNSAFE_ZONES = [
    { name: "Industrial Area", keywords: ["industrial", "factory", "warehouse"], risk: "HIGH", reason: "Low responder coverage" },
    { name: "Isolated Road", keywords: ["isolated", "highway", "bypass", "forest"], risk: "MODERATE", reason: "Low activity area" },
    { name: "Dark Alley", keywords: ["alley", "lane", "crossroad"], risk: "HIGH", reason: "Limited nighttime visibility" },
    { name: "High Risk Zone", keywords: ["downtown", "station", "junction", "club"], risk: "MODERATE", reason: "Increased emergency activity reported" }
  ];


  const startJourneyFromRoute = () => {
    setJourneyDestination(routeDest);
    setJourneyDuration(routeIsWalking ? 30 : 15);
    setIsJourneyDrawerOpen(true);
    setIsSafeRouteOpen(false);
    logger.log('low', 'Safe Route AI', 'Journey recommended');
  };

  // --- AI THREAT DETECTION STATE ---
  const [isAiThreatOpen, setIsAiThreatOpen] = useState(false);
  const [aiLastAnalysisTime, setAiLastAnalysisTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  const [prevRiskLevel, setPrevRiskLevel] = useState<string>('Low');

  const determineRiskLevel = () => {
    if (sosActive || isEscalationOpen) return 'High';
    const hour = new Date().getHours();
    const isLateNight = hour >= 22 || hour < 5;
    if (isLateNight || (activeJourney && journeyTimeLeft !== null && journeyTimeLeft < 300) || guardians.length === 0 || routeRisk === 'HIGH' || gpsFailCount > 1) return 'Medium';
    return 'Low';
  };
  const aiRiskLevel = determineRiskLevel();

  useEffect(() => {
    if (aiRiskLevel !== prevRiskLevel) {
      setAiLastAnalysisTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      setPrevRiskLevel(aiRiskLevel);
      console.log(`Risk level changed to ${aiRiskLevel}`);
    }
  }, [aiRiskLevel, prevRiskLevel]);

  const activeSignals = useMemo(() => {
    const signals = [];
    if (sosActive) signals.push({ text: 'Active emergency triggered', severity: 'High' });
    if (isEscalationOpen) signals.push({ text: 'Journey timeout risk', severity: 'High' });
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) signals.push({ text: 'Late-night activity detected', severity: 'Medium' });
    if (activeJourney && journeyTimeLeft !== null && journeyTimeLeft < 300) signals.push({ text: 'Journey ETA expiring soon', severity: 'Medium' });
    if (guardians.length === 0) signals.push({ text: 'Trusted contacts unavailable', severity: 'Medium' });
    if (routeRisk === 'HIGH' || routeRisk === 'MODERATE') signals.push({ text: 'Active unsafe route analysis', severity: routeRisk === 'HIGH' ? 'High' : 'Medium' });
    if (gpsFailCount > 1) signals.push({ text: 'Location telemetry unstable', severity: 'Medium' });
    return signals;
  }, [sosActive, isEscalationOpen, activeJourney, journeyTimeLeft, guardians.length, routeRisk, gpsFailCount]);

  const aiInsights = useMemo(() => {
    const insights = [];
    if (aiRiskLevel === 'High') {
      insights.push('Emergency escalation recommended');
      insights.push('Privacy-focused recording and GPS activated');
    } else if (aiRiskLevel === 'Medium') {
      insights.push('Maintain awareness of surroundings');
      if (guardians.length === 0) insights.push('Add trusted contacts for safety backup');
      if (activeJourney) insights.push('Check in to prevent auto-escalation');
    } else {
      insights.push('No unusual activity detected');
      insights.push('System armed and monitoring');
    }
    return insights;
  }, [aiRiskLevel, guardians.length, activeJourney]);

  useEffect(() => {
    if (isAiThreatOpen) {
      console.log("AI monitoring initialized");
      if (activeSignals.length > 0) console.log("Safety signal detected");
      if (aiInsights.length > 0) console.log("Insight generated");
    }
  }, [isAiThreatOpen]);





  // --- TRUSTED CIRCLE LOGIC ---
  // Managed via useGuardians hook

  const handleSaveContact = async () => {
    // 1. Auth Guard
    if (!user) {
      logOperational('AUTH', 'Save attempt blocked: No authenticated user');
      return;
    }

    // 2. Defensive Validation
    if (!newContact.name.trim()) {
      toast.error("Please enter a contact name");
      return;
    }
    
    if (!newContact.phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneClean = newContact.phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (guardians.length >= 5) {
      toast.error("Maximum 5 trusted contacts allowed");
      return;
    }
    
    setIsSavingContact(true);
    const toastId = toast.loading("Saving trusted contact...");
    logOperational('CONTACT_SAVE', `Attempting to persist contact for user: ${user.uid}`);

    try {
      const contactData = {
        userId: user.uid,
        name: newContact.name.trim(),
        phone: newContact.phone.trim(),
        type: newContact.relationship, // Map relationship to 'type' field used in useGuardians
        priority: Number(newContact.priority),
        lastSeen: serverTimestamp(), // Initialize lastSeen for status logic
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "users", user.uid, "guardians"), contactData);
      
      logOperational('FIRESTORE', 'Contact successfully persisted');
      toast.success("Trusted contact added successfully", { id: toastId });
      
      // 3. Form Recovery & Reset
      setIsAddingContact(false);
      setNewContact({ name: '', phone: '', relationship: 'Mother', priority: 1 });
      
    } catch (e: any) {
      logOperational('FIRESTORE', `Write failure: ${e.message}`);
      console.error("[CONTACT_SAVE] Fatal error:", e);
      toast.error("Unable to save contact. Please try again.", { id: toastId });
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!user) return;
    
    setDeletingId(id);
    logOperational('CONTACT_SAVE', `Attempting to remove contact: ${id}`);
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "guardians", id));
      logOperational('FIRESTORE', 'Contact removal successful');
      toast.success("Contact removed");
    } catch (e: any) {
      logOperational('FIRESTORE', `Deletion failure: ${e.message}`);
      console.error("[CONTACT_DELETE] Fatal error:", e);
      toast.error("Failed to remove contact");
    } finally {
      setDeletingId(null);
    }
  };





  // --- SHAKE ENGINE ---
  useEffect(() => {
    if (!shakeEnabled || isEmergencyCountdownOpen || sosActive) return;

    let shakeCount = 0;
    let lastShakeTime = 0;
    let lastX = 0, lastY = 0, lastZ = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const { acceleration } = e;
      if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) return;
      
      const threshold = shakeSensitivity === 'High' ? 12 : shakeSensitivity === 'Medium' ? 18 : 25;
      const deltaX = Math.abs(acceleration.x - lastX);
      const deltaY = Math.abs(acceleration.y - lastY);
      const deltaZ = Math.abs(acceleration.z - lastZ);

      if (deltaX + deltaY + deltaZ > threshold) {
        const now = Date.now();
        if (now - lastShakeTime < 2000) {
          shakeCount++;
          if (shakeCount >= 3) {
            triggerShakeEmergency();
            shakeCount = 0;
          }
        } else {
          shakeCount = 1;
        }
        lastShakeTime = now;
      }

      lastX = acceleration.x;
      lastY = acceleration.y;
      lastZ = acceleration.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [shakeEnabled, shakeSensitivity, isEmergencyCountdownOpen, sosActive]);



  // --- FALL DETECTION ENGINE ---
  useEffect(() => {
    if (!fallDetectionEnabled || isFallEscalating || isEmergencyCountdownOpen || sosActive) return;

    let fallDetected = false;
    let lastZ = 0;
    
    const handleFallMotion = (e: DeviceMotionEvent) => {
      if (fallDetected) return;
      const { acceleration } = e;
      if (!acceleration || acceleration.z === null) return;
      
      const deltaZ = Math.abs(acceleration.z - lastZ);
      if (deltaZ > 30) {
        fallDetected = true;
        logOperational('TIMER', 'Impact detected. Monitoring for 3s stillness...');
        if (fallCheckTimerRef.current) clearTimeout(fallCheckTimerRef.current);
        fallCheckTimerRef.current = setTimeout(() => {
          if (!sosActive && !isEmergencyCountdownOpen && !isFallEscalating) {
            triggerFallEmergency();
          }
        }, 3000);
      }
      lastZ = acceleration.z;
    };

    window.addEventListener('devicemotion', handleFallMotion);
    return () => window.removeEventListener('devicemotion', handleFallMotion);
  }, [fallDetectionEnabled, isFallEscalating, isEmergencyCountdownOpen, sosActive]);



  // --- HIDDEN SOS ENGINE ---
  const getHiddenThresholds = () => {
    switch (hiddenSensitivity) {
      case 'Easy': return { taps: 4, time: 5000 };
      case 'Secure': return { taps: 6, time: 2000 };
      case 'Medium':
      default: return { taps: 5, time: 3000 };
    }
  };

  const handleLogoTap = () => {
    if (!hiddenEnabled || isHiddenCountdownOpen || isEmergencyCountdownOpen || sosActive) return;
    
    const { taps, time } = getHiddenThresholds();
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);

    if (newCount === 1) {
      if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
      logoTapTimerRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, time);
    }

    if (newCount >= taps) {
      triggerHiddenEmergency();
    }
  };

  useEffect(() => {
    if (hiddenCountdown !== null && hiddenCountdown > 0) {
      hiddenTimerRef.current = setTimeout(() => setHiddenCountdown(hiddenCountdown - 1), 1000);
    } else if (hiddenCountdown === 0 && isHiddenCountdownOpen) {
      activateEmergency("HIDDEN_SOS");
    }
    return () => {
      if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
    };
  }, [hiddenCountdown, isHiddenCountdownOpen]);





  if (authLoading || !user || isRecovering) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-crimson-glow/10 border border-white/5 flex items-center justify-center animate-pulse">
           <Shield className="w-8 h-8 text-crimson-glow/40" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-silver/20 animate-pulse">Synchronizing your account...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#050507] text-silver font-display overflow-x-hidden pb-[env(safe-area-inset-bottom,112px)]">
      {/* Soft Ambient Background */}
      <div 
        className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.18_0.08_22_/_0.15)_0%,transparent_70%)] pointer-events-none transition-opacity duration-1000" 
        style={{ opacity: motionProfile.glowOpacity }}
      />

      {/* GLOBAL SYSTEM STATUS BAR */}
      <div className="sticky top-0 z-[60] bg-[#050507] border-b border-white/5 py-1.5 px-4 md:px-8 flex items-center justify-between overflow-x-auto hide-scrollbar">
         <div className="flex items-center gap-3 shrink-0">
           <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-silver">System Status:</span>
           <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-green-500">Operational</span>
         </div>
         <div className="flex items-center gap-4 shrink-0 ml-4">
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]'}`} />
             <span className="text-[9px] tracking-wider uppercase text-silver/40">{isOnline ? 'Firebase Connected' : 'Offline Mode (Queue Active)'}</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] tracking-wider uppercase text-silver/40">Voice Evidence Ready</span>
           </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${gpsActive ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`} />
              <span className="text-[9px] tracking-wider uppercase text-silver/40">GPS Services {gpsActive ? 'Online' : 'Offline'}</span>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-4 ml-1 shrink-0">
                <div className="w-1 h-1 rounded-full bg-blue-400/40 animate-pulse" />
                <span className="text-[8px] tracking-[0.2em] uppercase text-silver/20 font-mono">
                  Sync: {lastUpdated.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
         </div>
      </div>

      {/* TOP BAR */}
      <header className="sticky top-[28px] z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleLogoTap}
          >
            <Shield className="w-4 h-4 text-crimson-glow" style={{ opacity: motionProfile.glowOpacity }} />
            <span className="text-[11px] font-medium tracking-widest uppercase text-silver">{sosActive ? 'Emergency Mode ON' : 'Safe Mode'}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${gpsActive ? 'bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'} `} />
            <span className="text-[10px] tracking-wider uppercase text-silver/60">{gpsStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] tracking-wider uppercase text-silver/60">
              {responderCount > 0 ? `${responderCount} Responders` : "Scanning Network..."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-silver/60">
            {isCharging ? (
              <BatteryCharging className="w-4 h-4 text-green-500" />
            ) : batteryLevel && batteryLevel < 20 ? (
              <BatteryLow className="w-4 h-4 text-red-500" />
            ) : batteryLevel && batteryLevel < 60 ? (
              <BatteryMedium className="w-4 h-4" />
            ) : (
              <BatteryFull className="w-4 h-4" />
            )}
            <span className="text-[10px] tracking-wider font-mono">
              {batteryLevel !== null ? `${batteryLevel}%` : "--%"}
            </span>
          </div>
          <Bell className="w-4 h-4 text-silver/60 hover:text-silver transition-colors cursor-pointer" />
          <Link to="/profile" className="block outline-none">
            <IdentityAvatar 
              name={profile?.name || user?.displayName || user?.email || "User"} 
              photoURL={profile?.photoURL || user?.photoURL || undefined}
              size="xs"
              className="cursor-pointer hover:scale-105 transition-transform"
            />
          </Link>
        </div>
      </header>

      <motion.main 
        variants={motionProfile.containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12 relative z-10"
      >
        
        {/* HERO SOS SECTION */}
        <motion.section variants={motionProfile.itemVariants} className="flex flex-col items-center justify-center py-10 md:py-20 relative overflow-hidden">
          <div className="relative group">
            {/* Soft Radar Ripple */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <motion.div animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }} className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] border border-crimson-glow/20 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1.5], opacity: [0.5, 0.2, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-crimson-glow/5 rounded-full blur-xl" />
            </div>

            {/* Cinematic SOS Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: motionProfile.tapScale }}
              onPointerDown={startSOS}
              onPointerUp={cancelSOS}
              onPointerLeave={cancelSOS}
              className={`relative z-10 w-56 h-56 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-500 shadow-2xl ${
                sosActive 
                  ? "bg-crimson-glow shadow-[0_0_100px_oklch(0.58_0.24_22_/_0.8)]" 
                  : manualCountdown !== null
                  ? "bg-red-950/40 border-2 border-crimson-glow shadow-[0_0_50px_oklch(0.58_0.24_22_/_0.5)]"
                  : "bg-black/80 backdrop-blur-md border border-white/10 hover:border-crimson-glow/50 hover:shadow-[0_0_40px_rgba(220,38,38,0.15)]"
              }`}
            >
              {manualCountdown !== null ? (
                <div className="flex flex-col items-center">
                  <span className="text-6xl md:text-7xl font-light text-crimson-glow mb-1">{manualCountdown}</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-crimson-glow font-medium">Releasing cancels</span>
                </div>
              ) : (
                <>
                  <Phone className={`w-10 h-10 md:w-12 md:h-12 ${sosActive ? "text-white" : "text-crimson-glow"} mb-1`} strokeWidth={1.5} />
                  <span className={`text-base uppercase tracking-[0.4em] font-medium ${sosActive ? "text-white" : "text-silver"}`}>
                    {sosActive ? 'Active' : 'SOS'}
                  </span>
                </>
              )}
            </motion.button>
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-widest text-silver/40 font-medium">Hold for 3 seconds to trigger emergency</p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <StatusChip label={sosActive ? "Live Tracking Enabled" : gpsStatus} active={gpsActive} />
            <StatusChip label="Voice Monitoring" active />
            <StatusChip label="SMS Backup Ready" active />
            <StatusChip label="AI Safe Mode" active />
          </div>
        </motion.section>

        {/* LIVE MAP SECTION */}
        <motion.section variants={motionProfile.itemVariants} className="space-y-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60">Live Location</h2>
          <div className="glass-panel rounded-[2rem] overflow-hidden h-[350px] relative border-white/5 shadow-2xl">
            <div className="absolute inset-0 opacity-40">
              <LocalizedErrorBoundary>
                <GMap sosActive={sosActive} destination={structuredDest ? { lat: structuredDest.lat, lng: structuredDest.lng } : undefined} />
              </LocalizedErrorBoundary>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 pointer-events-none">
               <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${gpsActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                 <span className="text-[10px] uppercase tracking-widest text-white font-bold">{gpsStatus}</span>
               </div>
               {sosActive && (
                 <div className="bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/30 w-fit flex items-center gap-2">
                   <Activity className="w-3 h-3 text-red-500 animate-pulse" />
                   <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-bold">Tactical Emergency Lock Active</span>
                 </div>
               )}
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
              <MapButton label="Open Live Tracking" primary onClick={handleOpenLiveTracking} tapScale={motionProfile.tapScale} />
              <MapButton label="View Safe Route" onClick={handleViewSafeRoute} tapScale={motionProfile.tapScale} />
              <MapButton 
                label={isSearchingNearby ? "Scanning..." : "Nearby Help"} 
                onClick={handleNearbyHelp} 
                tapScale={motionProfile.tapScale}
              />
            </div>
          </div>
        </motion.section>

        {/* ACTIVE EMERGENCY PANEL */}
        <AnimatePresence>
          {sosActive && activeSessionId && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5"
            >
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-red-500">Internal Emergency Session</h2>
              <div className="glass-panel p-6 rounded-[2rem] border-red-500/30 bg-red-950/20 shadow-[0_0_30px_rgba(220,38,38,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">Escalated L2</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-1">Session ID</p>
                    <p className="text-xs font-mono text-silver">{activeSessionId.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-1">State</p>
                    <p className="text-xs text-white">ACTIVE / ESCALATING</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-1">Medical</p>
                    <p className="text-xs text-green-400">Attached</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-1">Evidence</p>
                    <p className="text-xs text-blue-400">{isRecording ? 'Recording Live' : 'Pending'}</p>
                  </div>
                </div>

                {/* COORDINATED RESPONSE PIPELINE */}
                <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-silver/40 uppercase tracking-[0.2em] font-bold">Emergency Operations</p>
                      <p className="text-[9px] text-silver/20 uppercase tracking-widest mt-1">Coordinated Response in Progress</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full ${telegramStatus === 'SENT' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : telegramStatus === 'FAILED' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-silver/60">
                        {telegramStatus === 'SENT' ? 'Guardians Notified' : telegramStatus === 'FAILED' ? 'Secure Retry Active' : 'Dispatching Alerts...'}
                      </span>
                    </div>
                  </div>
                  
                  {/* EMOTIONAL PROGRESS STEPS */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full border border-green-500/30 flex items-center justify-center shrink-0 bg-green-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                      <p className="text-[10px] text-silver/80 font-medium uppercase tracking-wider">Emergency Session Secured</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full border border-green-500/30 flex items-center justify-center shrink-0 bg-green-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                      <p className="text-[10px] text-silver/80 font-medium uppercase tracking-wider">Live Telemetry Sharing Active</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border ${telegramStatus === 'SENT' ? 'border-green-500/30 bg-green-500/10' : 'border-white/10'} flex items-center justify-center shrink-0`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${telegramStatus === 'SENT' ? 'bg-green-500' : 'bg-white/20 animate-pulse'}`} />
                      </div>
                      <p className={`text-[10px] uppercase tracking-wider ${telegramStatus === 'SENT' ? 'text-silver/80 font-medium' : 'text-silver/30'}`}>
                        {telegramStatus === 'SENT' ? 'Trusted Circle Alerted' : 'Contacting Trusted Circle...'}
                      </p>
                    </div>

                    {Object.keys(activeAcknowledgements).length > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full border border-green-500/30 flex items-center justify-center shrink-0 bg-green-500/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-2">
                          Verified Guardian Activity Detected
                          <span className="text-[8px] text-silver/40 font-normal">({Object.keys(activeAcknowledgements).length} Responders)</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    {Object.values(activeAcknowledgements).length > 0 ? (
                      Object.values(activeAcknowledgements).map((ack: any) => (
                        <div key={ack.guardianId} className="flex items-center gap-3 bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                          <div>
                            <p className="text-[10px] text-white font-bold uppercase tracking-wider">{ack.guardianName} is responding</p>
                            <p className="text-[8px] text-green-400/60 uppercase tracking-widest font-medium">Verified Response Received</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 opacity-60">
                        <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
                        <div>
                          <p className="text-[10px] text-silver/60 font-bold uppercase tracking-wider">Awaiting Guardian Response</p>
                          <p className="text-[8px] text-silver/30 uppercase tracking-widest">Awaiting first acknowledgement</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleFalseAlarm} className="flex-1 py-4 rounded-xl border border-white/10 text-[11px] font-bold uppercase tracking-widest text-silver hover:bg-white/5 transition-colors">
                    Mark False Alarm
                  </button>
                  <button onClick={handleResolveEmergency} className="flex-1 py-4 rounded-xl bg-green-500/20 border border-green-500/30 text-[11px] font-bold uppercase tracking-widest text-green-400 hover:bg-green-500/30 transition-colors">
                    Resolve Emergency
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* SAFETY FEATURES SECTION */}
        <motion.section variants={motionProfile.itemVariants} className="space-y-8">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60 mb-4">Emergency Triggers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard 
                title="Shake SOS" 
                desc="Trigger SOS by shaking your phone" 
                icon={<Smartphone />} 
                active={shakeEnabled} 
                onClick={openShakeSettings} 
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Hidden SOS" 
                desc="Secret emergency activation" 
                icon={<EyeOff />} 
                active={hiddenEnabled}
                onClick={openHiddenSettings}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Fake Call Escape" 
                desc="Simulate an incoming call" 
                icon={<Phone />} 
                active={fakeCallEnabled}
                onClick={openFakeCallSettings}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60 mb-4">Protection Systems</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard 
                title="Safe Route AI" 
                desc="Avoid unsafe and isolated roads" 
                icon={<MapPin />} 
                active={true} 
                onClick={openSafeRoute}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Reach Home Safe" 
                desc="Auto-alert if you don't reach safely" 
                icon={<Home />} 
                active={activeJourney !== null}
                onClick={openJourneyDrawer}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Flashlight SOS" 
                desc="Emergency flashing light for visibility" 
                icon={<Flashlight />} 
                active={flashEnabled} 
                onClick={openFlashSettings}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60 mb-4">Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard 
                title="Trusted Circle" 
                desc="Connected family & trusted contacts" 
                icon={<Users />} 
                active={guardians.length > 0} 
                onClick={openTrustedCircle} 
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="AI Intelligence" 
                desc="Real-time threat & risk analysis" 
                icon={<Brain />} 
                active={true} 
                onClick={openAiThreat}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Medical Profile" 
                desc="Critical health info for responders" 
                icon={<Activity />} 
                active={medicalProfileActive} 
                onClick={openMedicalProfile}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Fall Detection" 
                desc="Detects possible falls and inactivity" 
                icon={<Activity />} 
                active={fallDetectionEnabled} 
                onClick={openFallDetection}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60 mb-4">Medical & Elderly Safety</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard 
                title="Medical Profile" 
                desc="Emergency conditions and allergies" 
                icon={<Shield />} 
                active={medicalProfileActive} 
                onClick={openMedicalProfile}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
              <FeatureCard 
                title="Voice Recording" 
                desc="Secure emergency evidence recording" 
                icon={<Mic />} 
                active={voiceEnabled} 
                onClick={openVoiceSettings}
                tapScale={motionProfile.tapScale}
                pulseOpacity={motionProfile.pulseOpacity}
              />
            </div>
          </div>
        </motion.section>

        {/* TRUSTED CIRCLE & TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60">Trusted Circle</h2>
              <span className="text-[10px] tracking-widest text-crimson-glow uppercase cursor-pointer hover:text-red-400">Manage</span>
            </div>
            <div className="glass-panel p-2 rounded-[2rem] border-white/5 space-y-1 bg-black/40">
              <AnimatePresence mode="popLayout">
                {guardians.length === 0 && (
                  <div className="space-y-3 p-4">
                    <Skeleton className="w-full h-12 rounded-xl" opacity={motionProfile.shimmerOpacity} />
                    <Skeleton className="w-3/4 h-12 rounded-xl" opacity={motionProfile.shimmerOpacity} />
                  </div>
                )}
                {guardians.map((g) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <ContactRow 
                      guardian={{
                        ...g,
                        acknowledged: !!activeAcknowledgements[g.id],
                        responding: activeAcknowledgements[g.id]?.responding || false,
                        eta: activeAcknowledgements[g.id]?.eta || null,
                        lastActive: activeAcknowledgements[g.id]?.lastActive || null
                      }}
                      sosActive={sosActive}
                      tapScale={motionProfile.tapScale}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-silver/60">Incident Timeline</h2>
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-black/40 h-[300px] overflow-y-auto hide-scrollbar relative">
               {incidentEvents.length === 0 && (
                 <p className="text-[10px] uppercase tracking-widest text-silver/40 text-center mt-10">System operational. No anomalies.</p>
               )}
               <AnimatePresence>
                 {incidentEvents.map((evt, idx) => (
                   <motion.div 
                     key={evt.id}
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex gap-4 relative mb-4"
                   >
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full z-10 ${
                          evt.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                          evt.severity === 'high' ? 'bg-crimson-glow shadow-[0_0_8px_rgba(220,38,38,0.6)]' :
                          evt.severity === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' :
                          'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                        }`} />
                        {idx !== incidentEvents.length - 1 && <div className="w-px h-[calc(100%+16px)] bg-white/10 absolute top-2.5" />}
                      </div>
                      <div className="-mt-1.5 pb-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] uppercase tracking-wider font-bold ${
                            evt.severity === 'critical' ? 'text-red-500' :
                            evt.severity === 'high' ? 'text-crimson-glow' :
                            evt.severity === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}>{evt.source}</span>
                          <span className="text-[9px] text-silver/30 font-mono tracking-widest">{new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <p className={`text-xs ${evt.severity === 'high' || evt.severity === 'critical' ? 'text-white font-medium' : 'text-silver/80'}`}>{evt.message}</p>
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          </section>
        </div>

      </motion.main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 w-full z-50">
         <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl border-t border-white/5" />
         <div className="relative max-w-md mx-auto flex justify-between items-center px-6 pt-4 pb-[env(safe-area-inset-bottom,20px)]">
            <NavIcon 
              icon={<Home />} 
              label={distanceToHome ? `Home • ${distanceToHome}` : "Home"} 
              active={mapMode === 'IDLE' && !isTrustedCircleOpen && !isHiddenSettingsOpen && !isJourneyDrawerOpen} 
              onClick={() => navigateTo('IDLE')}
              tapScale={motionProfile.tapScale}
            />
            <NavIcon 
              icon={<Map />} 
              label={trackingStatus ? `Tracking • ${trackingStatus}` : "Tracking"} 
              active={mapMode === 'TRACKING'}
              onClick={() => navigateTo('TRACKING')}
              tapScale={motionProfile.tapScale}
            />
            <div className="-mt-10 relative z-10">
               <motion.button 
                whileTap={{ scale: motionProfile.tapScale }}
                onPointerDown={startSOS}
                onPointerUp={cancelSOS}
                onPointerLeave={cancelSOS}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] border-4 border-[#050000] hover:scale-105 transition-all ${sosActive ? 'bg-crimson-glow animate-pulse' : 'bg-crimson-glow'}`}
               >
                  <Shield className="w-7 h-7 text-white" />
               </motion.button>
            </div>
            <NavIcon 
              icon={<Users />} 
              label="Network" 
              active={isTrustedCircleOpen}
              onClick={() => navigateTo('NETWORK')}
              tapScale={motionProfile.tapScale}
            />
            <NavIcon 
              icon={<Settings />} 
              label="Settings" 
              active={isHiddenSettingsOpen}
              onClick={() => navigateTo('SETTINGS')}
              tapScale={motionProfile.tapScale}
            />
         </div>
      </nav>

      {/* HIDDEN SOS SETTINGS MODAL */}
      <AnimatePresence>
        {isHiddenSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsHiddenSettingsOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
             >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Hidden SOS</h2>
                  <button onClick={() => setIsHiddenSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Enable Hidden SOS</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Silently trigger emergency</p>
                    </div>
                    <button onClick={() => setHiddenEnabled(!hiddenEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${hiddenEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hiddenEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Trigger Method</p>
                    <div className="glass-panel p-4 rounded-xl border-white/5 bg-black/40 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-silver" />
                      </div>
                      <div>
                        <p className="text-sm text-silver font-medium">Tap Top Logo</p>
                        <p className="text-[10px] uppercase tracking-widest text-silver/40 mt-1">{getHiddenThresholds().taps} taps within {getHiddenThresholds().time/1000} seconds</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Trigger Sensitivity</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['Easy', 'Medium', 'Secure'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setHiddenSensitivity(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${hiddenSensitivity === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <button onClick={() => {
                        setIsHiddenSettingsOpen(false);
                        triggerHiddenEmergency();
                    }} className="w-full py-4 rounded-xl border border-white/10 text-[11px] font-bold uppercase tracking-widest text-silver hover:bg-white/5 transition-colors">
                      Test Hidden SOS
                    </button>
                    <p className="text-center text-[10px] uppercase tracking-widest text-silver/30">Last Trigger: {hiddenLastActivation}</p>
                    <p className="text-center text-[10px] text-silver/20 leading-relaxed px-4 mt-8">Hidden SOS silently activates emergency protection without exposing visible alerts.</p>
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHAKE SETTINGS MODAL */}
      <AnimatePresence>
        {isShakeSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsShakeSettingsOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
             >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Shake SOS Settings</h2>
                  <button onClick={() => setIsShakeSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Status Toggle */}
                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Enable Shake SOS</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Shake device to trigger</p>
                    </div>
                    <button onClick={() => setShakeEnabled(!shakeEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${shakeEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${shakeEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Sensitivity */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Shake Sensitivity</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['Low', 'Medium', 'High'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setShakeSensitivity(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${shakeSensitivity === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Countdown */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Emergency Countdown</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {([3, 5, 10] as const).map(sec => (
                        <button 
                          key={sec}
                          onClick={() => setCountdownDuration(sec)}
                          className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${countdownDuration === sec ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {sec} sec
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Monitoring */}
                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div className="pr-4">
                      <p className="text-sm text-silver font-medium">Background Monitoring</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1 leading-relaxed">Monitor shake even when app minimized</p>
                    </div>
                    <button onClick={() => setBgMonitoring(!bgMonitoring)} className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${bgMonitoring ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${bgMonitoring ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Test & Info */}
                  <div className="pt-4 space-y-4">
                    <button onClick={triggerShakeEmergency} className="w-full py-4 rounded-xl border border-white/10 text-[11px] font-bold uppercase tracking-widest text-silver hover:bg-white/5 transition-colors">
                      Test Shake Detection
                    </button>
                    <p className="text-center text-[10px] uppercase tracking-widest text-silver/30">Last Trigger: {lastActivation}</p>
                  </div>

                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIDDEN SOS COUNTDOWN MODAL (DISCREET) */}
      <AnimatePresence>
        {isHiddenCountdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-1000"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-xs glass-panel p-6 rounded-3xl border border-white/5 hover:border-crimson-glow/20 bg-[#050000]/90 flex flex-col items-center text-center shadow-2xl relative overflow-hidden transition-colors duration-1000"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-silver/60" />
              </div>

              <h2 className="text-lg font-medium text-silver tracking-tight mb-1">Silent Emergency Mode Activated</h2>
              
              {isFetchingLocation ? (
                <div className="py-6 flex flex-col items-center w-full relative z-10">
                  <div className="w-full max-w-[120px] h-8 glass-skeleton mb-4" />
                  <p className="text-[9px] uppercase tracking-widest text-silver/40 animate-pulse">Securing satellite link...</p>
                </div>
              ) : (
                <div className="text-4xl font-light text-silver/80 my-4 font-mono relative z-10">
                  {hiddenCountdown}
                </div>
              )}

              {!isFetchingLocation && (
                <div className="flex gap-3 w-full mt-2">
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={cancelHiddenEmergency} 
                    className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-silver/60 hover:bg-white/5 hover:text-silver transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => activateEmergency("HIDDEN_SOS")} 
                    className="flex-1 py-3 rounded-xl bg-white/5 text-silver text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Confirm
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLASHLIGHT EMERGENCY BEACON OVERLAY */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] pointer-events-none flex items-start justify-center"
          >
             <motion.div 
               animate={{ 
                 backgroundColor: flashMode === 'Screen Flash' 
                   ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'] 
                   : ['rgba(220,38,38,0)', 'rgba(220,38,38,0.4)', 'rgba(220,38,38,0)'],
                 opacity: [0, 1, 0]
               }}
               transition={{ 
                 duration: flashSpeed === 'Fast' ? 0.3 : flashSpeed === 'Medium' ? 0.8 : 1.5, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               }}
               className="absolute inset-0"
             />
             <div className="absolute top-20 pointer-events-auto bg-[#050000]/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                <Flashlight className={`w-4 h-4 ${flashMode === 'Screen Flash' ? 'text-white' : 'text-crimson-glow'} animate-pulse`} />
                <span className="text-[10px] uppercase tracking-widest text-silver font-bold">Emergency Beacon</span>
                <button onClick={() => {
                  setIsFlashing(false);
                  console.log("Flash mode stopped");
                }} className="ml-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-3 h-3 text-silver/80" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLASHLIGHT SOS SETTINGS MODAL */}
      <AnimatePresence>
        {isFlashSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsFlashSettingsOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
             >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Flashlight SOS</h2>
                  <button onClick={() => setIsFlashSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Enable Flashlight SOS</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Activate emergency beacon</p>
                    </div>
                    <button onClick={() => setFlashEnabled(!flashEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${flashEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${flashEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Emergency Beacon Mode</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['Screen Flash', 'Torch Simulation'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setFlashMode(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${flashMode === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Auto During SOS</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Automatically activate</p>
                    </div>
                    <button onClick={() => setAutoFlash(!autoFlash)} className={`w-12 h-6 rounded-full transition-colors relative ${autoFlash ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoFlash ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Flash Speed</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['Slow', 'Medium', 'Fast'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setFlashSpeed(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${flashSpeed === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <button onClick={() => {
                        if (isFlashing) {
                          setIsFlashing(false);
                          console.log("Flash mode stopped");
                        } else {
                          setIsFlashing(true);
                          setFlashLastActivation(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                          console.log("Emergency beacon activated");
                          console.log("Flash mode started");
                        }
                    }} className={`w-full py-4 rounded-xl border ${isFlashing ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-white/10 text-silver hover:bg-white/5'} text-[11px] font-bold uppercase tracking-widest transition-colors`}>
                      {isFlashing ? 'Stop Emergency Beacon' : 'Test Emergency Beacon'}
                    </button>
                    <p className="text-center text-[10px] uppercase tracking-widest text-silver/30">Last Activated: {flashLastActivation}</p>
                    <p className="text-center text-[10px] text-silver/20 leading-relaxed px-4 mt-8">Emergency beacon improves visibility during unsafe situations and low-light conditions.</p>
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHAKE SOS EMERGENCY COUNTDOWN MODAL */}
      <AnimatePresence>
        {isEmergencyCountdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-8 rounded-[3rem] border-crimson-glow/20 bg-black/80 flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
              
              <div className="w-16 h-16 rounded-full bg-crimson-glow/10 border border-crimson-glow/30 flex items-center justify-center mb-6 relative z-10">
                <div className="absolute inset-0 bg-crimson-glow/20 rounded-full animate-ping" />
                <Activity className="w-8 h-8 text-crimson-glow relative z-10" />
              </div>

              <h2 className="text-2xl font-light text-silver tracking-tight mb-2 relative z-10">Emergency Detected</h2>
              <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-8 relative z-10">Shake pattern detected. SOS will activate shortly.</p>

              {isFetchingLocation ? (
                <div className="py-8 flex flex-col items-center relative z-10 w-full">
                  <div className="w-32 h-16 glass-skeleton mb-6" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-crimson-glow animate-pulse">Syncing high-accuracy telemetry...</p>
                </div>
              ) : (
                <div className="text-8xl font-light text-crimson-glow mb-8 relative z-10 animate-pulse">
                  {emergencyCountdown}
                </div>
              )}

              {!isFetchingLocation && (
                <div className="flex gap-4 w-full relative z-10">
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={cancelShakeEmergency} 
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-[11px] font-bold uppercase tracking-widest text-silver/60 hover:bg-white/5 hover:text-silver transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => activateEmergency("SHAKE_SOS")} 
                    className="flex-1 py-4 rounded-2xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Activate
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRUSTED CIRCLE MODAL */}
      <AnimatePresence>
        {isTrustedCircleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsTrustedCircleOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10 flex flex-col"
             >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Trusted Circle</h2>
                  <button onClick={() => setIsTrustedCircleOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="mb-6 shrink-0 flex items-center gap-3 glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-silver font-medium">Protected by {guardians.length} {guardians.length === 1 ? 'contact' : 'contacts'}</p>
                    <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-0.5">Emergency Network Active</p>
                  </div>
                </div>

                {!isAddingContact && guardians.length < 5 && (
                  <button onClick={() => setIsAddingContact(true)} className="mb-6 w-full py-4 rounded-xl border border-dashed border-white/20 text-[11px] font-bold uppercase tracking-widest text-silver hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    Add Trusted Contact
                  </button>
                )}

                {isAddingContact && (
                  <div className="mb-6 glass-panel p-5 rounded-2xl border-white/10 bg-black/50 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-silver/60 font-bold mb-4">New Contact</h3>
                    
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-1 block">Full Name</label>
                      <input type="text" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50" placeholder="e.g. Rahul Menon" />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-1 block">Phone Number</label>
                      <input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50" placeholder="+91 98765 43210" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-1 block">Relationship</label>
                        <select value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 appearance-none">
                          <option>Mother</option>
                          <option>Father</option>
                          <option>Brother</option>
                          <option>Sister</option>
                          <option>Friend</option>
                          <option>Neighbor</option>
                          <option>Guardian</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-1 block">Priority (1-5)</label>
                        <select value={newContact.priority} onChange={e => setNewContact({...newContact, priority: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 appearance-none">
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n===1 ? '(High)' : ''}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setIsAddingContact(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-[11px] font-bold uppercase tracking-widest text-silver hover:bg-white/5 transition-colors">Cancel</button>
                      <button onClick={handleSaveContact} disabled={isSavingContact || !newContact.name || !newContact.phone} className="flex-1 py-3 rounded-xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSavingContact ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Contact'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 pb-8">
                  {loadingGuardians ? (
                    <div className="space-y-3 py-2">
                       <Skeleton className="w-full" height="72px" />
                       <Skeleton className="w-full" height="72px" />
                       <Skeleton className="w-full" height="72px" />
                    </div>
                  ) : guardians.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl glass-panel bg-white/[0.01]">
                      <Users className="w-8 h-8 text-silver/20 mx-auto mb-3" />
                      <p className="text-xs text-silver/40 uppercase tracking-widest">No trusted contacts added yet</p>
                    </div>
                  ) : (
                    guardians.map((contact) => (
                      <div key={contact.id} className="glass-panel p-4 rounded-xl border-white/5 bg-black/40 hover:bg-white/[0.02] hover:border-white/10 transition-colors group relative flex items-center gap-4">
                        <IdentityAvatar 
                          name={contact.name} 
                          photoURL={contact.photoURL}
                          status={contact.status?.toLowerCase() as any || 'offline'}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-medium text-silver truncate">{contact.name}</h4>
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-silver/60">Priority {contact.priority}</span>
                          </div>
                          <p className="text-[11px] text-silver/40">{contact.type} • {contact.phone}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={deletingId === contact.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-silver/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 shrink-0"
                        >
                          {deletingId === contact.id ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </div>
                    ))
                  )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REACH HOME SAFE DRAWER */}
      <AnimatePresence>
        {isJourneyDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsJourneyDrawerOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10 flex flex-col"
             >
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Reach Home Safe</h2>
                  <button onClick={() => setIsJourneyDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                {!activeJourney ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-2 block">Destination</label>
                      <input 
                        type="text" 
                        value={journeyDestination} 
                        onChange={e => setJourneyDestination(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-silver focus:outline-none focus:border-crimson-glow/50" 
                        placeholder="Where are you going?" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 mb-2 block">Expected Arrival Time</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 15, 30, 60].map(mins => (
                          <motion.button 
                            key={mins}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setJourneyDuration(mins)}
                            className={`py-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-colors ${journeyDuration === mins ? 'border-crimson-glow/50 bg-crimson-glow/10 text-crimson-glow' : 'border-white/10 text-silver/60 hover:border-white/30 hover:bg-white/5'}`}
                          >
                            {mins === 60 ? '1 Hour' : `${mins} Mins`}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={startJourney}
                      disabled={!journeyDestination}
                      className="w-full mt-4 py-4 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-silver transition-colors disabled:opacity-50"
                    >
                      Start Safe Journey
                    </motion.button>
                    
                    <p className="text-center text-[10px] text-silver/20 leading-relaxed px-4 mt-8">Your trusted circle will be notified if you fail to check in after the ETA.</p>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="glass-panel p-6 rounded-3xl border-white/10 bg-black/40 relative overflow-hidden text-center flex flex-col items-center shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div 
                          className="h-full bg-green-500" 
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: activeJourney.expectedArrivalTime * 60, ease: "linear" }}
                        />
                      </div>
                      
                      <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 mt-4">
                        <MapPin className="w-5 h-5 text-green-500" />
                      </div>
                      
                      <p className="text-[10px] uppercase tracking-widest text-silver/40 mb-1">Heading to</p>
                      <h3 className="text-lg font-medium text-silver mb-6">{activeJourney.destination}</h3>
                      
                      <p className="text-[10px] uppercase tracking-widest text-silver/40 mb-2">ETA Remaining</p>
                      <div className="text-4xl font-light font-mono text-silver tracking-tight">
                        {journeyTimeLeft !== null ? `${Math.floor(journeyTimeLeft / 60)}:${(journeyTimeLeft % 60).toString().padStart(2, '0')}` : '--:--'}
                      </div>
                    </div>

                    <div className="mt-auto space-y-3 pb-8">
                      <button 
                        onClick={confirmSafeArrival}
                        className="w-full py-4 rounded-xl border border-green-500/30 text-[11px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                      >
                        I Reached Safely
                      </button>
                      <button 
                        onClick={() => {
                          activateEmergency("SAFE_JOURNEY_ESCALATION");
                          setIsJourneyDrawerOpen(false);
                          setActiveJourney(null);
                        }}
                        className="w-full py-4 rounded-xl border border-red-500/30 text-[11px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        Need Help
                      </button>
                    </div>
                  </div>
                )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAFE JOURNEY ESCALATION MODAL */}
      <AnimatePresence>
        {isEscalationOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-8 rounded-[3rem] border-crimson-glow/20 bg-black/80 flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
              
              <div className="w-16 h-16 rounded-full bg-crimson-glow/10 border border-crimson-glow/30 flex items-center justify-center mb-6 relative z-10">
                <div className="absolute inset-0 bg-crimson-glow/20 rounded-full animate-ping" />
                <Activity className="w-8 h-8 text-crimson-glow relative z-10" />
              </div>

              <h2 className="text-2xl font-light text-silver tracking-tight mb-2 relative z-10">Are you safe?</h2>
              <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-8 relative z-10">Your safe journey ETA expired. Respond to prevent emergency escalation.</p>

              <div className="text-7xl font-light text-crimson-glow mb-8 relative z-10 animate-pulse">
                {escalationCountdown}
              </div>

              <div className="flex flex-col gap-3 w-full relative z-10">
                <button onClick={confirmSafeArrival} className="w-full py-4 rounded-xl border border-green-500/30 text-[11px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  Yes, I'm Safe
                </button>
                <button onClick={() => {
                  activateEmergency("SAFE_JOURNEY_ESCALATION");
                  setIsEscalationOpen(false);
                  setEscalationCountdown(null);
                  setActiveJourney(null);
                }} className="w-full py-4 rounded-xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  Need Help
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE RECORDING UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[160] pointer-events-auto"
          >
            <div className="bg-[#050000]/90 backdrop-blur-xl px-6 py-3 rounded-full border border-red-500/20 flex items-center gap-4 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
              <div className="w-2.5 h-2.5 rounded-full bg-crimson-glow animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">Recording Emergency Evidence</span>
                <span className="text-xs font-mono text-silver/60">
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')} elapsed
                </span>
              </div>
              <button onClick={() => stopRecording()} className="ml-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FALL ESCALATION UI */}
      <AnimatePresence>
        {isFallEscalating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-8 rounded-[3rem] border-crimson-glow/20 bg-black/80 flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
              <h2 className="text-2xl font-light text-silver tracking-tight mb-2 relative z-10">Possible Fall Detected</h2>
              <p className="text-[10px] text-silver/50 uppercase tracking-widest mb-8 relative z-10">Are you okay? Respond to cancel emergency escalation.</p>
              <div className="text-7xl font-light text-crimson-glow mb-8 relative z-10 animate-pulse">
                {fallCountdown}
              </div>
              <div className="flex flex-col gap-3 w-full relative z-10">
                <button onClick={cancelFallEmergency} className="w-full py-4 rounded-xl border border-green-500/30 text-[11px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  I'm Okay
                </button>
                <button onClick={() => activateEmergency("FALL_DETECTION")} className="w-full py-4 rounded-xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors">
                  Need Help Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VOICE RECORDING SETTINGS MODAL */}
      <AnimatePresence>
        {isVoiceSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsVoiceSettingsOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10"
             >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Voice Recording</h2>
                  <button onClick={() => setIsVoiceSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Enable Voice Recording</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Capture emergency audio</p>
                    </div>
                    <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${voiceEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${voiceEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Auto Record During SOS</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Automatically record</p>
                    </div>
                    <button onClick={() => setAutoRecord(!autoRecord)} className={`w-12 h-6 rounded-full transition-colors relative ${autoRecord ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoRecord ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center glass-panel p-5 rounded-2xl bg-white/[0.02] border-white/5">
                    <div>
                      <p className="text-sm text-silver font-medium">Auto Evidence Upload</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Cloud backup for evidence</p>
                    </div>
                    <button onClick={() => setAutoEvidenceUpload(!autoEvidenceUpload)} className={`w-12 h-6 rounded-full transition-colors relative ${autoEvidenceUpload ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoEvidenceUpload ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Recording Quality</p>
                    <div className="flex gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['Low', 'Medium', 'High'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setVoiceQuality(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${voiceQuality === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-silver/60 mb-3">Max Recording Length</p>
                    <div className="grid grid-cols-2 gap-2 p-1 glass-panel rounded-xl bg-black/50 border-white/5">
                      {(['30 Seconds', '1 Minute', '5 Minutes', 'Unlimited'] as const).map(level => (
                        <button 
                          key={level}
                          onClick={() => setVoiceMaxLength(level)}
                          className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${voiceMaxLength === level ? 'bg-white/10 text-white' : 'text-silver/40 hover:text-silver'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <button onClick={() => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          startRecording(null);
                        }
                    }} className={`w-full py-4 rounded-xl border ${isRecording ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-white/10 text-silver hover:bg-white/5'} text-[11px] font-bold uppercase tracking-widest transition-colors`}>
                      {isRecording ? 'Stop Recording' : 'Test Recording'}
                    </button>
                    <p className="text-center text-[10px] uppercase tracking-widest text-silver/30">Last Recording: {voiceLastRecording}</p>
                    <p className="text-center text-[10px] text-silver/20 leading-relaxed px-4 mt-8">Emergency recordings are securely stored as protected evidence.</p>
                  </div>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <FakeCallModal 
          isOpen={isFakeCallSettingsOpen}
          onClose={() => setIsFakeCallSettingsOpen(false)}
          enabled={fakeCallEnabled}
          onToggle={setFakeCallEnabled}
        />
      </Suspense>

      <Suspense fallback={null}>
        <FallDetectionModal 
          isOpen={isFallDetectionOpen}
          onClose={() => setIsFallDetectionOpen(false)}
          enabled={fallDetectionEnabled}
          onToggle={setFallDetectionEnabled}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MedicalProfileModal 
          isOpen={isMedicalProfileOpen}
          onClose={() => setIsMedicalProfileOpen(false)}
          active={medicalProfileActive}
          onToggle={setMedicalProfileActive}
        />
      </Suspense>

      {/* TACTICAL MAP OVERLAY */}
      <AnimatePresence>
        {isFullscreenMapOpen && (
          <AppErrorBoundary>
            <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[150] bg-black flex flex-col"
          >
            {/* FULLSCREEN MAP */}
            <div className="flex-1 relative">
              <LocalizedErrorBoundary>
                <GMap 
                  className="w-full h-full"
                  sosActive={sosActive}
                  destination={structuredDest ? { lat: structuredDest.lat, lng: structuredDest.lng } : undefined}
                  routePoints={mapMode === 'ROUTE' ? routePolyline : null}
                  routeRisk={mapMode === 'ROUTE' ? routeRisk : null}
                  nearbyHelp={mapMode === 'NEARBY' ? nearbyResults : null}
                  onTelemetryUpdate={setCurrentTelemetry}
                />
              </LocalizedErrorBoundary>
              
              {/* RADAR SCANNING OVERLAY */}
              {isSearchingNearby && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                   <div className="w-[800px] h-[800px] border border-crimson-glow/20 rounded-full animate-radar bg-[conic-gradient(from_0deg,transparent_0deg,oklch(0.68_0.28_25_/_0.1)_90deg,transparent_91deg)]" />
                   <div className="absolute w-[400px] h-[400px] border border-crimson-glow/10 rounded-full animate-pulse" />
                </div>
              )}
              
              {/* TACTICAL HUD OVERLAY */}
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                {/* TOP HUD: Telemetry & Status */}
                <div className="flex justify-between items-start">
                  <div className={`glass-panel p-4 border-white/20 rounded-2xl pointer-events-auto shadow-2xl transition-colors duration-500 ${
                    mapMode === 'NEARBY' ? 'bg-[#080c10]/95 border-blue-500/40' : 'bg-[#050507]/90'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        sosActive ? 'bg-crimson-glow shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 
                        mapMode === 'NEARBY' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 
                        'bg-green-500'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                        {mapMode === 'TRACKING' ? 'Immersive Tracking Mode' : 
                         mapMode === 'ROUTE' ? 'Route Intelligence View' : 
                         'Nearby Assistance Scan'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <div>
                        <p className="text-[8px] text-white/80 uppercase tracking-widest mb-0.5">Coordinates</p>
                        <p className="text-[10px] text-white font-mono">
                          {currentTelemetry?.latitude?.toFixed(5) || '0.00000'}, {currentTelemetry?.longitude?.toFixed(5) || '0.00000'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/80 uppercase tracking-widest mb-0.5">GPS Status</p>
                        <p className="text-[10px] text-white uppercase tracking-widest font-mono">
                           {currentTelemetry?.locationState || 'IDLE'} • ±{currentTelemetry?.accuracy?.toFixed(0) || '0'}m
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/80 uppercase tracking-widest mb-0.5">Speed / Heading</p>
                        <p className="text-[10px] text-white uppercase tracking-widest font-mono">
                          {currentTelemetry?.speed ? `${(currentTelemetry.speed * 3.6).toFixed(1)} KM/H` : '0.0 KM/H'} • {currentTelemetry?.heading ? `${currentTelemetry.heading.toFixed(0)}°` : '0°'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/80 uppercase tracking-widest mb-0.5">Escalation / Uplink</p>
                        <p className="text-[10px] text-white uppercase tracking-widest font-mono">
                           LVL {sosActive ? '2' : '0'} • {new Date(currentTelemetry?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsFullscreenMapOpen(false)}
                    className="p-3 bg-black/60 border border-white/10 rounded-2xl text-silver hover:text-white pointer-events-auto transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* BOTTOM HUD: Contextual Intelligence */}
                <div className="flex justify-between items-end">
                   {/* Left side: Dynamic Context info */}
                    <div className="max-w-xs space-y-3 pointer-events-auto">
                      {mapMode === 'ROUTE' && routeRisk && (
                        <div className="glass-panel p-4 bg-[#050507]/90 border-white/20 rounded-2xl">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                               <RouteIcon className={`w-3.5 h-3.5 ${routeRisk === 'HIGH' ? 'text-red-500' : 'text-yellow-500'}`} />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-white">Route Analysis</span>
                            </div>
                            <button 
                              onClick={() => {
                                const origin = structuredStart ? `${structuredStart.lat},${structuredStart.lng}` : routeStart;
                                const dest = structuredDest ? `${structuredDest.lat},${structuredDest.lng}` : routeDest;
                                const mode = routeIsWalking ? 'walking' : 'driving';
                                window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`, '_blank');
                              }}
                              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[7px] text-silver uppercase tracking-widest hover:bg-crimson-glow hover:text-white transition-all pointer-events-auto"
                            >
                              Navigate
                            </button>
                          </div>
                          <p className="text-[10px] text-silver/60 uppercase tracking-widest mb-1">Status: {routeRisk} RISK</p>
                          <p className="text-[9px] text-silver/60 leading-relaxed">{routeRecommendation}</p>
                        </div>
                     )}

                     {mapMode === 'NEARBY' && nearbyResults.length > 0 && (
                        <div className="glass-panel p-5 bg-black/92 border-white/10 rounded-[1.5rem] space-y-4 max-h-[400px] overflow-y-auto pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-black/95 py-2 z-10 border-b border-white/5">
                             <div className="w-1 h-4 bg-blue-500/50 rounded-full mr-1" />
                             <Shield className="w-4 h-4 text-blue-400" />
                             <span className="text-sm font-semibold uppercase tracking-widest text-white">Nearby Assistance</span>
                          </div>
                          
                          <div className="space-y-3">
                            {nearbyResults.map((place, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300">
                                <div className="flex justify-between items-start gap-4">
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm font-semibold text-white tracking-wide truncate group-hover:text-blue-400 transition-colors">
                                       {place.name}
                                     </p>
                                     <p className="text-xs text-silver/70 tracking-normal mt-1 leading-relaxed">
                                       {place.vicinity}
                                     </p>
                                   </div>
                                   <button 
                                     onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + ' ' + place.vicinity)}&travelmode=driving`, '_blank')}
                                     className="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-500 hover:text-white transition-all shrink-0 pointer-events-auto shadow-lg"
                                   >
                                     Navigate
                                   </button>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                      <div className="w-1 h-1 rounded-full bg-blue-400" />
                                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                        {place.types?.[0]?.replace('_', ' ') || 'Emergency'}
                                      </span>
                                   </div>
                                   <span className="text-[10px] text-silver/50 font-mono tracking-tighter">
                                     {place.distance_meters ? `${(place.distance_meters / 1000).toFixed(1)} KM` : '---'}
                                   </span>
                                   {place.isOpen ? (
                                     <div className="flex items-center gap-1.5">
                                       <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                       <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Open</span>
                                     </div>
                                   ) : (
                                     <div className="flex items-center gap-1.5">
                                       <div className="w-1 h-1 rounded-full bg-red-500" />
                                       <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest">Closed</span>
                                     </div>
                                   )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {nearbyResults.length === 0 && !isSearchingNearby && (
                            <p className="text-xs text-silver/40 uppercase tracking-widest py-8 text-center italic font-medium">No emergency nodes detected in immediate vicinity</p>
                          )}
                        </div>
                     )}

                     <div className="glass-panel px-4 py-2 bg-crimson-glow/40 border-crimson-glow/50 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-crimson-glow animate-pulse" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white">Secure Encrypted Link Active</span>
                     </div>
                   </div>

                   {/* Right side: Emergency Quick Actions */}
                   <div className="flex flex-col gap-3 pointer-events-auto">
                     <button className="p-4 bg-crimson-glow text-white rounded-2xl shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
                        <Phone className="w-6 h-6" />
                     </button>
                     <button className="p-4 bg-white/10 text-silver rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all">
                        <Bell className="w-6 h-6" />
                     </button>
                   </div>
                </div>
              </div>
              
              {/* CROSSHAIR OVERLAY */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                 <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-1 h-8 bg-white/40 absolute" />
                    <div className="h-1 w-8 bg-white/40 absolute" />
                 </div>
              </div>
            </div>
          </motion.div>
          </AppErrorBoundary>
        )}
      </AnimatePresence>

      {/* SAFE ROUTE AI MODAL */}
      <AnimatePresence>
        {isSafeRouteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => {
                setIsSafeRouteOpen(false);
                setTimeout(() => {
                  setRouteAnalysisState('IDLE');
                  setLocationStatus('IDLE');
                }, 300); // Reset after close
             }} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10 flex flex-col"
             >
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">Safe Route AI</h2>
                  <button onClick={() => {
                      setIsSafeRouteOpen(false);
                      setTimeout(() => {
                        setRouteAnalysisState('IDLE');
                        setLocationStatus('IDLE');
                        setStructuredStart(null);
                        setStructuredDest(null);
                      }, 300);
                  }} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  
                  {/* ROUTE INPUTS */}
                  <div className="glass-panel p-5 rounded-2xl bg-black/40 border-white/5 space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 ml-1 mb-1 block">Current Location</label>
                      <LocationAutocomplete 
                        value={routeStart}
                        onChange={(val) => {
                          setRouteStart(val);
                          setLocationStatus('MANUAL');
                        }}
                        onSelect={(data) => {
                          setStructuredStart({ lat: data.lat, lng: data.lng, address: data.formattedAddress });
                          setLocationStatus('LIVE');
                        }}
                        placeholder="e.g. MG Road, Bangalore"
                      />
                      {structuredStart && (
                        <div className="mt-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg flex justify-between items-center">
                           <span className="text-[8px] text-silver/30 uppercase tracking-widest">Verified Telemetry</span>
                           <span className="text-[9px] text-silver/60 font-mono">{structuredStart.lat.toFixed(4)}, {structuredStart.lng.toFixed(4)}</span>
                        </div>
                      )}
                      {locationStatus === 'FETCHING' && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-crimson-glow animate-pulse" />
                          <span className="text-[9px] uppercase tracking-widest text-silver/60">Fetching current location...</span>
                        </div>
                      )}
                      {locationStatus === 'LIVE' && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                          <span className="text-[9px] uppercase tracking-widest text-green-500/80">📍 Live location detected</span>
                        </div>
                      )}
                      {locationStatus === 'CACHED' && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.3)]" />
                          <span className="text-[9px] uppercase tracking-widest text-green-500/60">📍 Cached location restored</span>
                        </div>
                      )}
                      {locationStatus === 'FAILED' && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                          <span className="text-[9px] uppercase tracking-widest text-yellow-500/80">Unable to detect location. Enter manually.</span>
                        </div>
                      )}
                      {locationStatus === 'MANUAL' && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-silver/40" />
                          <span className="text-[9px] uppercase tracking-widest text-silver/60">Manual override active</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-silver/40 ml-1 mb-1 block">Destination</label>
                      <LocationAutocomplete 
                        value={routeDest}
                        onChange={setRouteDest}
                        onSelect={(data) => {
                          setStructuredDest({ lat: data.lat, lng: data.lng, address: data.formattedAddress, name: data.name });
                        }}
                        placeholder="e.g. Electronic City Phase 1"
                      />
                      {structuredDest && (
                        <div className="mt-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg flex justify-between items-center">
                           <span className="text-[8px] text-silver/30 uppercase tracking-widest">Target Telemetry</span>
                           <span className="text-[9px] text-silver/60 font-mono">{structuredDest.lat.toFixed(4)}, {structuredDest.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-silver/60 uppercase tracking-widest font-medium">Walking Mode</span>
                      <button onClick={() => setRouteIsWalking(!routeIsWalking)} className={`w-10 h-5 rounded-full transition-colors relative ${routeIsWalking ? 'bg-green-500' : 'bg-white/10'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${routeIsWalking ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {routeAnalysisState === 'IDLE' && (
                      <button 
                        onClick={analyzeRoute}
                        disabled={!routeStart || !routeDest}
                        className={`w-full mt-4 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                          routeStart && routeDest 
                            ? 'bg-crimson-glow text-white hover:bg-red-600 shadow-lg shadow-red-500/20' 
                            : 'bg-white/5 text-silver/40 cursor-not-allowed'
                        }`}
                      >
                        Analyze Safe Route
                      </button>
                    )}
                  </div>

                  {/* ANALYSIS LOADING */}
                  {routeAnalysisState === 'ANALYZING' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-panel p-8 rounded-2xl bg-[#0a0505] border-crimson-glow/20 flex flex-col items-center justify-center text-center py-12"
                    >
                      <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 rounded-full border-2 border-crimson-glow/20 border-t-crimson-glow animate-spin" />
                        <MapPin className="w-6 h-6 text-crimson-glow animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-silver tracking-widest uppercase mb-2">Analyzing Safe Route</p>
                      <p className="text-[10px] text-silver/40 uppercase tracking-widest">Evaluating isolated zones & responder density...</p>
                    </motion.div>
                  )}

                  {/* ANALYSIS RESULT */}
                  {routeAnalysisState === 'RESULT' && routeRisk && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* RISK LEVEL */}
                      <div className={`glass-panel p-6 rounded-2xl border-white/5 relative overflow-hidden ${
                        routeRisk === 'HIGH' ? 'bg-red-950/20 border-red-500/20' : 
                        routeRisk === 'MODERATE' ? 'bg-yellow-950/20 border-yellow-500/20' : 
                        'bg-green-950/20 border-green-500/20'
                      }`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                          routeRisk === 'HIGH' ? 'bg-red-500' : 
                          routeRisk === 'MODERATE' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`} />
                        <p className="text-[10px] uppercase tracking-widest text-silver/40 mb-1">Overall Risk Level</p>
                        <h3 className={`text-2xl font-bold tracking-wider uppercase ${
                          routeRisk === 'HIGH' ? 'text-red-500' : 
                          routeRisk === 'MODERATE' ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>{routeRisk}</h3>
                      </div>

                      {/* INSIGHTS */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-silver/60 font-bold mb-3">Safety Insights</h4>
                        <div className="space-y-2">
                          {routeInsights.map((insight, idx) => (
                            <div key={idx} className="glass-panel p-4 rounded-xl bg-black/40 border-white/5 flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-silver/40 shrink-0 mt-1.5" />
                              <p className="text-xs text-silver leading-relaxed">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RECOMMENDATION */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-silver/60 font-bold mb-3">Recommendation</h4>
                        <div className="glass-panel p-5 rounded-xl bg-white/[0.02] border-white/5">
                          <p className="text-sm font-medium text-silver mb-2">{routeRecommendation}</p>
                          {routeAlternative && (
                            <div className="flex items-center gap-2 text-[11px] text-green-400 mt-3 pt-3 border-t border-white/5">
                              <MapPin className="w-3 h-3" />
                              <span>{routeAlternative}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* REACH HOME SAFE INTEGRATION */}
                      {(routeRisk === 'MODERATE' || routeRisk === 'HIGH') && (
                        <button 
                          onClick={startProtectedJourneyFromRoute}
                          className="w-full py-4 rounded-xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          Start Protected Journey
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          const origin = structuredStart ? `${structuredStart.lat},${structuredStart.lng}` : routeStart;
                          const dest = structuredDest ? `${structuredDest.lat},${structuredDest.lng}` : routeDest;
                          const mode = routeIsWalking ? 'walking' : 'driving';
                          window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`, '_blank');
                        }}
                        className="w-full py-4 rounded-xl border border-white/10 text-silver text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Google Maps
                      </button>

                      <button 
                        onClick={() => setRouteAnalysisState('IDLE')}
                        className="w-full py-4 rounded-xl bg-white/5 text-silver text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5"
                      >
                        Analyze Another Route
                      </button>

                    </motion.div>
                  )}

                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER PROFILE DRAWER */}
      <AnimatePresence>
        {isProfileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsProfileDrawerOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-8 shadow-2xl relative z-10 flex flex-col"
             >
                <div className="flex justify-between items-center mb-10 shrink-0">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">User Identity</h2>
                  <button onClick={() => setIsProfileDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center mb-12">
                  <div className="relative mb-6">
                    <Link to="/profile" className="outline-none" onClick={() => setIsProfileDrawerOpen(false)}>
                      <IdentityAvatar 
                        name={profile?.name || user?.displayName || "User"} 
                        photoURL={profile?.photoURL || user?.photoURL || undefined} 
                        size="xl" 
                        className="cursor-pointer hover:scale-105 transition-transform"
                      />
                    </Link>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#080303] rounded-full" />
                  </div>
                  <h3 className="text-2xl font-light text-white tracking-tight mb-1">{profile?.name || user?.displayName || "Anonymous User"}</h3>
                  <p className="text-xs text-silver/40 font-mono tracking-wider">{user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                    <span className="text-2xl font-light text-white mb-1">12</span>
                    <span className="text-[9px] uppercase tracking-widest text-silver/40 font-bold">Safety Sessions</span>
                  </div>
                  <div className="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                    <span className="text-2xl font-light text-white mb-1">{guardians.length}</span>
                    <span className="text-[9px] uppercase tracking-widest text-silver/40 font-bold">Trusted Network</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-silver/60 font-bold ml-1">Account Security</h4>
                  <div className="glass-panel rounded-2xl border-white/5 bg-black/40 overflow-hidden">
                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                       <span className="text-xs text-silver/80">Account Type</span>
                       <span className="text-[10px] uppercase tracking-widest text-crimson-glow font-bold">Premium Safety</span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <span className="text-xs text-silver/80">Session Status</span>
                       <span className="text-[10px] uppercase tracking-widest text-green-500 font-bold">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <Link 
                    to="/profile"
                    onClick={() => setIsProfileDrawerOpen(false)}
                    className="w-full py-4 rounded-2xl bg-crimson text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 group"
                  >
                    View Control Center
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="mt-auto pt-10">
                  <button 
                    onClick={() => {
                      authService.logoutUser();
                      setIsProfileDrawerOpen(false);
                    }}
                    className="w-full py-5 rounded-2xl border border-white/5 bg-white/[0.02] text-red-500 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                  >
                    <X className="w-4 h-4" />
                    Sign Out Account
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI THREAT DETECTION MODAL */}
      <AnimatePresence>
        {isAiThreatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end"
          >
             <div className="absolute inset-0" onClick={() => setIsAiThreatOpen(false)} />
             <motion.div 
               initial={{ x: "100%" }}
               animate={{ x: 0 }}
               exit={{ x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="w-full max-w-md bg-[#080303] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl relative z-10 flex flex-col"
             >
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <h2 className="text-sm uppercase tracking-widest text-silver font-bold">AI Threat Detection</h2>
                  <button onClick={() => setIsAiThreatOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                    <X className="w-5 h-5 text-silver/60" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* AI SAFETY MONITOR */}
                  <div className="glass-panel p-6 rounded-3xl border-white/5 bg-black/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                      <div className={`h-full transition-all duration-1000 ${aiRiskLevel === 'High' ? 'bg-red-500 w-full' : aiRiskLevel === 'Medium' ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-1/3'}`} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-silver/40 mb-1">System Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium text-silver">Monitoring Active</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-silver/40 mb-1">Risk Level</p>
                        <span className={`text-sm font-bold tracking-wider uppercase ${aiRiskLevel === 'High' ? 'text-red-500' : aiRiskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {aiRiskLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-silver/40">Last Analysis</p>
                        <p className="text-xs text-silver font-mono">{aiLastAnalysisTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-silver/40">Active Signals</p>
                        <p className="text-xs text-silver font-mono">{activeSignals.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE SAFETY SIGNALS */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-silver/60 mb-3 font-bold">Active Safety Signals</h3>
                    <div className="space-y-2">
                      {activeSignals.length === 0 ? (
                        <div className="glass-panel p-4 rounded-xl bg-white/[0.02] border-white/5 text-center">
                          <p className="text-xs text-silver/40 uppercase tracking-widest">No active threats detected</p>
                        </div>
                      ) : (
                        activeSignals.map((signal, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={idx} 
                            className="glass-panel p-4 rounded-xl bg-black/50 border-white/5 flex items-center gap-3"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${signal.severity === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'}`} />
                            <p className="text-xs text-silver font-medium">{signal.text}</p>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* AI RISK INSIGHTS */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-silver/60 mb-3 font-bold">AI Risk Insights</h3>
                    <div className="glass-panel p-5 rounded-2xl bg-[#0a0505] border-crimson-glow/10 space-y-3">
                      {aiInsights.map((insight, idx) => (
                        <div key={idx} className="flex gap-3">
                          <Cpu className="w-4 h-4 text-crimson-glow/60 shrink-0 mt-0.5" />
                          <p className="text-xs text-silver/80 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AUTO SAFETY ACTIONS */}
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-silver/60 mb-3 font-bold">Auto Safety Actions</h3>
                    <div className="glass-panel p-1 rounded-2xl bg-black/50 border-white/5">
                      <div className="p-4 flex items-center justify-between border-b border-white/5">
                        <span className="text-xs text-silver/80">Flashlight SOS</span>
                        <span className={`text-[9px] uppercase tracking-widest ${flashEnabled && autoFlash ? 'text-green-500' : 'text-silver/40'}`}>{flashEnabled && autoFlash ? 'Armed' : 'Disabled'}</span>
                      </div>
                      <div className="p-4 flex items-center justify-between border-b border-white/5">
                        <span className="text-xs text-silver/80">Voice Recording</span>
                        <span className={`text-[9px] uppercase tracking-widest ${voiceEnabled && autoRecord ? 'text-green-500' : 'text-silver/40'}`}>{voiceEnabled && autoRecord ? 'Armed' : 'Disabled'}</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-xs text-silver/80">Emergency Escalation</span>
                        <span className={`text-[9px] uppercase tracking-widest ${activeJourney ? 'text-yellow-500' : 'text-green-500'}`}>{activeJourney ? 'Monitoring' : 'Standby'}</span>
                      </div>
                    </div>
                  </div>

                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ... unchanged sub-components
const StatusChip = React.memo(function StatusChip({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-colors ${
      active ? 'bg-white/5 border-white/10 text-silver' : 'bg-black/50 border-white/5 text-silver/40'
    }`}>
      {active && <CheckCircle2 className="w-3 h-3 text-crimson-glow" />}
      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
    </div>
  )
});

const MapButton = React.memo(function MapButton({ label, primary, onClick, tapScale }: { label: string, primary?: boolean, onClick?: () => void, tapScale?: number }) {
  return (
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: tapScale || 0.96 }}
      className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md pointer-events-auto ${
      primary 
        ? 'bg-crimson-glow text-white hover:bg-red-600 shadow-lg shadow-red-500/20' 
        : 'bg-black/60 border border-white/10 text-silver hover:bg-white/10'
    }`}>
      {label}
    </motion.button>
  )
});

const FeatureCard = React.memo(function FeatureCard({ title, desc, icon, active, onClick, tapScale, pulseOpacity }: { title: string, desc: string, icon: React.ReactNode, active: boolean, onClick?: () => void, tapScale?: number, pulseOpacity?: number }) {
  return (
    <motion.div 
      onClick={onClick}
      whileTap={{ scale: tapScale || 0.98 }}
      className="glass-panel p-5 rounded-2xl border-white/5 bg-black/40 hover:bg-white/[0.02] hover:border-white/10 transition-colors group cursor-pointer flex gap-4 items-start"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        active ? 'bg-crimson-glow/10 text-crimson-glow border border-crimson-glow/20' : 'bg-white/5 text-silver/40 border border-white/5'
      }`}>
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-[13px] font-medium text-silver group-hover:text-white transition-colors">{title}</h4>
          <div 
            className={`w-2 h-2 rounded-full mt-1.5 ${active ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-silver/20'}`} 
            style={{ opacity: pulseOpacity ?? 1 }}
          />
        </div>
        <p className="text-[11px] text-silver/40 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
});

const ContactRow = React.memo(function ContactRow({ guardian, sosActive, tapScale }: { guardian: any, sosActive: boolean, tapScale?: number }) {
  const { name, status, type, distance, acknowledged, responding, eta, priority } = guardian;
  
  return (
    <motion.div 
      whileTap={{ scale: tapScale || 0.98 }}
      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 cursor-pointer ${
      sosActive && acknowledged ? 'bg-blue-500/5 border border-blue-500/20' : 
      sosActive ? 'bg-red-500/5 border border-red-500/20 animate-pulse-slow' :
      'hover:bg-white/5 border border-transparent'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
          priority === 1 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'
        } border`}>
          <span className="text-xs font-bold text-silver/60">{name.charAt(0)}</span>
          {priority === 1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
            <Shield className="w-1.5 h-1.5 text-white" />
          </div>}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{name}</p>
            {priority === 1 && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Primary</span>}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-silver/40">{type}</p>
        </div>
      </div>
      <div className="text-right">
        {sosActive ? (
          <div className="space-y-1">
             {responding ? (
               <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Responding</span>
                 <span className="text-[8px] text-silver/40 uppercase tracking-widest">ETA {eta || '---'}</span>
               </div>
             ) : acknowledged ? (
               <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Acknowledged</span>
             ) : (
               <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest animate-pulse">Alert Sent</span>
             )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] tracking-widest uppercase font-bold ${
                status === 'NEARBY' ? 'text-green-400' :
                status === 'ONLINE' ? 'text-blue-400' :
                status === 'AWAY' ? 'text-yellow-500' :
                'text-silver/40'
              }`}>{status}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                status === 'NEARBY' || status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                status === 'AWAY' ? 'bg-yellow-500' :
                'bg-silver/20'
              }`} />
            </div>
            {distance && <span className="text-[9px] text-silver/30 font-mono">{distance}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
});

function TimelineItem({ label, time, active }: { label: string, time: string, active?: boolean }) {
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full z-10 ${active ? 'bg-crimson-glow shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 'bg-white/20'}`} />
        <div className="w-px h-full bg-white/10 absolute top-2.5" />
      </div>
      <div className="-mt-1.5 pb-4">
        <p className={`text-sm font-medium ${active ? 'text-silver' : 'text-silver/60'}`}>{label}</p>
        <p className="text-[10px] uppercase tracking-wider text-silver/40 mt-0.5">{time}</p>
      </div>
    </div>
  )
}

const NavIcon = React.memo(function NavIcon({ icon, label, active, onClick, tapScale }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, tapScale?: number }) {
  return (
    <motion.div 
      onClick={onClick}
      whileTap={{ scale: tapScale || 0.95 }}
      className={`flex flex-col items-center gap-1.5 cursor-pointer transition-colors ${active ? 'text-crimson-glow' : 'text-silver/40 hover:text-silver/80'}`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[9px] uppercase tracking-widest font-medium">{label}</span>
    </motion.div>
  )
});



export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
