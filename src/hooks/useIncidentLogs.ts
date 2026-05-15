import { useState, useEffect } from 'react';
import { logger, IncidentEvent } from '../services/incidentLogger';

export function useIncidentLogs() {
  const [incidentEvents, setIncidentEvents] = useState<IncidentEvent[]>([]);

  useEffect(() => {
    const unsub = logger.subscribe(setIncidentEvents);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return { incidentEvents };
}
