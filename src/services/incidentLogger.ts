import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../lib/firebase";

import {
  IncidentLogPayload,
  IncidentSeverity,
  IncidentSource,
} from "../types/emergency";

export type Severity = "low" | "medium" | "high" | "critical";

export interface IncidentEvent {
  id: string;
  timestamp: number;
  severity: Severity;
  source: string;
  message: string;
  emergencyId?: string;
}

class IncidentLogger {
  private events: IncidentEvent[] = [];

  private listeners: ((events: IncidentEvent[]) => void)[] = [];

  private isSyncing = false;

  private hasLoadedFirestore = false;

  constructor() {
    this.loadFromStorage();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(
          "[LOGGER] Auth established. Triggering Firestore sync."
        );

        this.syncFromFirestore();
      } else {
        console.log("[LOGGER] User signed out.");
        this.hasLoadedFirestore = false;
      }
    });
  }

  // =========================================
  // STORAGE
  // =========================================

  private loadFromStorage() {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("incident_timeline");

      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch (e) {
      console.error("[STORAGE] Failed to load timeline", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "incident_timeline",
        JSON.stringify(this.events)
      );
    } catch (e) {
      console.error("[STORAGE] Failed to save timeline", e);
    }
  }

  // =========================================
  // FIRESTORE SYNC
  // =========================================

  private async syncFromFirestore() {
    const user = auth.currentUser;

    if (!user) {
      console.warn(
        "[AUTH] Firestore sync skipped: No authenticated user"
      );
      return;
    }

    if (this.hasLoadedFirestore || this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const q = query(
        collection(db, "incidentLogs"),

        where("userId", "==", user.uid),

        orderBy("timestamp", "desc"),

        limit(50)
      );

      const querySnapshot = await getDocs(q);

      const firestoreEvents: IncidentEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        firestoreEvents.push({
          id: doc.id,

          timestamp: data.timestamp?.toMillis
            ? data.timestamp.toMillis()
            : Date.now(),

          severity: (
            data.severity as string
          ).toLowerCase() as Severity,

          source: data.source || "SYSTEM",

          message: data.message || "Unknown event",

          emergencyId: data.emergencyId,
        });
      });

      // Merge local + firestore
      const merged = [
        ...firestoreEvents,
        ...this.events,
      ];

      // Remove duplicates
      const unique = Array.from(
        new Map(
          merged.map((item) => [item.id, item])
        ).values()
      )
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);

      this.events = unique;

      this.saveToStorage();

      this.notifyListeners();

      this.hasLoadedFirestore = true;

      console.log(
        `[LOGGER] Firestore sync complete (${unique.length} events)`
      );
    } catch (e) {
      console.warn(
        "[LOGGER] Incident persistence unavailable. Local timeline fallback active.",
        e
      );
    } finally {
      this.isSyncing = false;
    }
  }

  // =========================================
  // LOG EVENT
  // =========================================

  public async log(
    severity: Severity,
    source: string,
    message: string,
    emergencyId?: string
  ) {
    const now = Date.now();

    // Duplicate prevention
    const isDuplicate = this.events.some(
      (e) =>
        e.source === source &&
        e.message === message &&
        now - e.timestamp < 2000
    );

    if (isDuplicate) {
      console.debug(
        `[LOGGER] Duplicate blocked: [${source}] ${message}`
      );

      return;
    }

    const eventId =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `evt_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;

    const event: IncidentEvent = {
      id: eventId,
      timestamp: now,
      severity,
      source,
      message,
      emergencyId,
    };

    // Instant UI update
    this.events = [event, ...this.events].slice(
      0,
      100
    );

    this.saveToStorage();

    this.notifyListeners();

    // Firestore persistence
    const user = auth.currentUser;

    if (!user) {
      console.warn(
        "[AUTH] Event stored locally only."
      );

      return;
    }

    try {
      const payload: IncidentLogPayload = {
        userId: user.uid,

        severity:
          severity.toUpperCase() as IncidentSeverity,

        source: source as IncidentSource,

        message,

        timestamp: serverTimestamp(),
      };

      if (emergencyId) {
        payload.emergencyId = emergencyId;
      }

      await addDoc(
        collection(db, "incidentLogs"),
        payload as any
      );

      console.debug(
        "[DB_WRITE] Incident persisted:",
        user.uid
      );
    } catch (e) {
      console.warn(
        "[DB_WRITE] Failed to persist incident:",
        e
      );
    }
  }

  // =========================================
  // ACCESSORS
  // =========================================

  public getEvents() {
    return [...this.events];
  }

  public subscribe(
    listener: (events: IncidentEvent[]) => void
  ) {
    this.listeners.push(listener);

    listener(this.events);

    return () => {
      this.listeners = this.listeners.filter(
        (l) => l !== listener
      );
    };
  }

  public clear() {
    this.events = [];

    this.saveToStorage();

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) =>
      listener([...this.events])
    );
  }
}

export const logger = new IncidentLogger();