import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { locationService } from '../services/locationService';
import { User } from 'firebase/auth';
import { LocationState } from '../types/emergency';
import { logger } from '../services/incidentLogger';

export function useTelemetry(user: User | null, sosActive: boolean, mapMode: string, batteryLevel: number | null = null) {
  const [currentTelemetry, setCurrentTelemetry] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Initializing GPS...");
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const getInterval = useCallback(() => {
    // If battery is low (< 15%), we throttle heavily even in SOS
    const isLowBattery = batteryLevel !== null && batteryLevel < 15;
    
    if (sosActive) return isLowBattery ? 15000 : 5000;
    if (mapMode !== 'IDLE') return isLowBattery ? 30000 : 10000;
    return isLowBattery ? 120000 : 30000;
  }, [sosActive, mapMode, batteryLevel]);

  const poll = useCallback(async () => {
    if (!user || !isMounted.current) return;

    // Clear existing timer to prevent race conditions
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    try {
      const telemetry = await locationService.getEmergencyTelemetry(0);
      if (!isMounted.current) return;

      setCurrentTelemetry(telemetry);
      setLastUpdated(new Date());
      
      // Update GPS Status based on real state
      switch(telemetry.locationState) {
        case LocationState.LIVE: 
          setGpsStatus("LIVE GPS • HIGH ACCURACY"); 
          setGpsActive(true); 
          break;
        case LocationState.LOW_ACCURACY: 
          setGpsStatus("GPS DEGRADED"); 
          setGpsActive(true); 
          break;
        case LocationState.FALLBACK:
        case LocationState.STALE: 
          setGpsStatus("LAST KNOWN LOCATION"); 
          setGpsActive(true); 
          break;
        default: 
          setGpsStatus("LOCATION UNAVAILABLE"); 
          setGpsActive(false); 
          break;
      }
    } catch (e) {
      if (isMounted.current) {
        setGpsStatus("TELEMETRY OFFLINE");
        logger.log('medium', 'GPS Telemetry', 'Telemetry polling failed');
      }
    } finally {
      if (isMounted.current) {
        pollTimerRef.current = setTimeout(poll, getInterval());
      }
    }
  }, [user, getInterval]);

  // 1. Initial & Reactive Polling
  useEffect(() => {
    poll();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [poll]);

  // 2. Background/Foreground Resilience
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.log('low', 'System', 'App foregrounded - forcing telemetry refresh');
        poll();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [poll]);

  // 3. Presence Heartbeat
  const telemetryRef = useRef(currentTelemetry);
  useEffect(() => {
    telemetryRef.current = currentTelemetry;
  }, [currentTelemetry]);

  useEffect(() => {
    if (!user) return;

    let heartbeatTimerId: NodeJS.Timeout;

    const updatePresence = async () => {
      const lat = telemetryRef.current?.latitude;
      const lng = telemetryRef.current?.longitude;
      if (lat && user && isMounted.current) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
            lat,
            lng,
            status: 'ONLINE',
            userId: user.uid
          });
        } catch (e) {
          console.warn("[PRESENCE] Heartbeat failed");
        }
      }
      
      if (isMounted.current) {
        heartbeatTimerId = setTimeout(updatePresence, 60000);
      }
    };

    updatePresence();
    return () => {
      if (heartbeatTimerId) clearTimeout(heartbeatTimerId);
    };
  }, [user?.uid]);

  return { currentTelemetry, setCurrentTelemetry, gpsStatus, gpsActive, lastUpdated };
}
