import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { locationService } from '../services/locationService';
import { User } from 'firebase/auth';
import { LocationState } from '../types/emergency';

export function useTelemetry(user: User | null, sosActive: boolean, mapMode: string) {
  const [currentTelemetry, setCurrentTelemetry] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Initializing GPS...");
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // 1. Adaptive Telemetry Polling
  useEffect(() => {
    if (!user) return;

    const getInterval = () => {
      if (sosActive) return 5000;
      if (mapMode !== 'IDLE') return 10000;
      return 30000;
    };

    const poll = async () => {
      try {
        const telemetry = await locationService.getEmergencyTelemetry(0);
        if (!isMounted.current) return;

        setCurrentTelemetry(telemetry);
        
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
        if (isMounted.current) setGpsStatus("TELEMETRY OFFLINE");
      }
    };

    const timer = setInterval(poll, getInterval());
    poll();
    return () => clearInterval(timer);
  }, [user?.uid, sosActive, mapMode]);

  // 2. Presence Heartbeat
  useEffect(() => {
    if (!user || !currentTelemetry?.latitude) return;

    const updatePresence = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp(),
          lat: currentTelemetry.latitude,
          lng: currentTelemetry.longitude,
          status: 'ONLINE',
          userId: user.uid
        });
      } catch (e) {
        console.warn("[PRESENCE] Heartbeat failed");
      }
    };

    const heartbeat = setInterval(updatePresence, 60000); // Relaxed to 60s for production stability
    updatePresence();
    return () => clearInterval(heartbeat);
  }, [user?.uid, currentTelemetry?.latitude, currentTelemetry?.longitude]);

  return { currentTelemetry, setCurrentTelemetry, gpsStatus, gpsActive };
}
