import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

export interface Guardian {
  id: string;
  name: string;
  type: string;
  priority: number;
  lastSeen: any;
  lat?: number;
  lng?: number;
  status: 'ONLINE' | 'NEARBY' | 'AWAY' | 'OFFLINE' | 'UNKNOWN';
  acknowledged?: boolean;
  responding?: boolean;
  eta?: string;
  distance?: string;
}

export function useGuardians(user: User | null, currentTelemetry: any) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [rawGuardians, setRawGuardians] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setRawGuardians([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "guardians"), 
      where("userId", "==", user.uid),
      orderBy("priority", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setRawGuardians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("[GUARD] Listener failed:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const processedGuardians = useMemo(() => {
    return rawGuardians.map(d => {
      const lastSeenMs = d.lastSeen?.toMillis() || 0;
      const now = Date.now();
      
      let status: Guardian['status'] = 'OFFLINE';
      if (now - lastSeenMs < 120000) {
        status = 'ONLINE'; 
      } else if (lastSeenMs > 0) {
        status = 'UNKNOWN';
      }

      let distanceStr = '';
      if (d.lat && d.lng && currentTelemetry?.latitude) {
        const dist = calculateDistance(currentTelemetry.latitude, currentTelemetry.longitude, d.lat, d.lng);
        if (dist < 0.5 && status === 'ONLINE') status = 'NEARBY';
        else if (status === 'ONLINE') status = 'AWAY';
        distanceStr = dist < 1 ? `${(dist * 1000).toFixed(0)} M` : `${dist.toFixed(1)} KM`;
      }

      return {
        ...d,
        status,
        distance: distanceStr
      } as Guardian;
    });
  }, [rawGuardians, currentTelemetry?.latitude, currentTelemetry?.longitude]);

  return { guardians: processedGuardians, loading };

  return { guardians, loading };
}
