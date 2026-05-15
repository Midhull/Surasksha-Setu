import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useResponders(user: any) {
  const [responderCount, setResponderCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Ownership-aware query for responders specifically assigned to this user
    const q = query(
      collection(db, "responders"), 
      where("userId", "==", user.uid),
      where("status", "==", "ACTIVE")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResponderCount(snapshot.size);
      logOperational('RESPONDER_SYNC', `[FIRESTORE] Active responders synchronized: ${snapshot.size}`);
    }, (error) => {
      console.error("[FIRESTORE] [RESPONDER_SYNC] Listener failed:", error);
    });

    return () => {
      unsubscribe();
      logOperational('RESPONDER_SYNC', '[FIRESTORE] Responder listener disposed');
    };
  }, [user?.uid]);

  return { responderCount };
}

const logOperational = (tag: string, message: string) => 
  console.log(`%c[${tag}]%c ${message}`, 'color: #dc2626; font-weight: bold', 'color: inherit');
