import { logger } from './incidentLogger';
import { LocationState } from '../types/emergency';

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  isCached: boolean;
  error?: string;
}

export interface LocationTelemetry {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  locationState: LocationState;
  stale: boolean;
  fallbackUsed: boolean;
}

class LocationService {
  private lastKnownLocation: string | null = null;
  private lastKnownCoords: { lat: number, lng: number } | null = null;
  private locationTimestamp: number | null = null;
  private CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  private fallbackCacheKey = 'lastKnownEmergencyLocation';

  // --- SAFE ROUTE / UI LOCATION (REVERSE GEOCODING) ---
  public async getCurrentLocation(): Promise<LocationResult> {
    const now = Date.now();
    
    if (
      this.lastKnownLocation && 
      this.lastKnownCoords && 
      this.locationTimestamp && 
      (now - this.locationTimestamp) < this.CACHE_DURATION_MS
    ) {
      return {
        address: this.lastKnownLocation,
        lat: this.lastKnownCoords.lat,
        lng: this.lastKnownCoords.lng,
        isCached: true
      };
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser unsupported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          try {
            const address = await this.reverseGeocode(lat, lng);
            this.cacheLocation(address, lat, lng);
            resolve({ address, lat, lng, isCached: false });
          } catch (e) {
            const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            this.cacheLocation(fallbackAddress, lat, lng);
            resolve({ address: fallbackAddress, lat, lng, isCached: false, error: "Geocoding unavailable" });
          }
        },
        (err) => {
          reject(new Error(err.message));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  // --- EMERGENCY TELEMETRY LAYER ---
  private getFallbackLocation(): LocationTelemetry | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(this.fallbackCacheKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to read fallback location", e);
    }
    return null;
  }

  private saveFallbackLocation(telemetry: LocationTelemetry) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.fallbackCacheKey, JSON.stringify(telemetry));
    } catch (e) {
      console.error("Failed to save fallback location", e);
    }
  }

  public async getEmergencyTelemetry(retries = 2): Promise<LocationTelemetry> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        logger.log('high', 'GPS', 'Location telemetry unavailable (API missing)');
        resolve(this.handleFallback());
        return;
      }

      let retryCount = 0;

      const attemptFetch = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy, speed, heading } = pos.coords;
            const now = Date.now();
            let state = LocationState.LIVE;
            
            if (accuracy <= 30) {
              state = LocationState.LIVE;
              logger.log('low', 'GPS', 'High-accuracy GPS acquired');
            } else if (accuracy <= 100) {
              state = LocationState.LIVE;
              logger.log('low', 'GPS', 'GPS accuracy normalized (Medium)');
            } else {
              state = LocationState.LOW_ACCURACY;
              logger.log('low', 'GPS', 'Low-accuracy location detected');
            }

            const telemetry: LocationTelemetry = {
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              timestamp: now,
              locationState: state,
              stale: false,
              fallbackUsed: false
            };

            if (this.validateCoordinates(latitude, longitude)) {
              this.saveFallbackLocation(telemetry);
              resolve(telemetry);
            } else {
              logger.log('medium', 'GPS', 'Invalid coordinates detected (Null Island). Using fallback.');
              resolve(this.handleFallback());
            }
          },
          (err) => {
            console.warn(`GPS fetch failed. Attempt ${retryCount + 1}`, err);
            if (retryCount < retries) {
              retryCount++;
              setTimeout(attemptFetch, 1000);
            } else {
              logger.log('high', 'GPS', 'GPS unavailable during active emergency');
              resolve(this.handleFallback());
            }
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      };

      attemptFetch();
    });
  }

  private validateCoordinates(lat: number | null, lng: number | null): boolean {
    if (lat === null || lng === null) return false;
    // Basic range validation
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    // Null Island check (0,0) - often returned by faulty GPS or emulators
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
    return true;
  }

  private handleFallback(): LocationTelemetry {
    const fallback = this.getFallbackLocation();
    const now = Date.now();
    
    if (fallback && fallback.latitude) {
      const ageMs = now - fallback.timestamp;
      const stale = ageMs > 120000; // 2 minutes
      
      logger.log('medium', 'GPS', stale ? 'Stale coordinates detected' : 'Cached fallback location restored');
      
      return {
        ...fallback,
        locationState: stale ? LocationState.STALE : LocationState.FALLBACK,
        stale,
        fallbackUsed: true
      };
    }

    logger.log('high', 'GPS', 'Emergency fallback coordinates activated (Default)');
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: null,
      speed: null,
      heading: null,
      timestamp: now,
      locationState: LocationState.UNAVAILABLE,
      stale: true,
      fallbackUsed: true
    };
  }

  // --- REVERSE GEOCODING HELPERS ---
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    if (!API_KEY) throw new Error("No API Key");

    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return this.formatAddress(data.results[0]);
    }
    throw new Error("No results");
  }

  private formatAddress(googleResult: any): string {
    const components = googleResult.address_components;
    if (!components) return googleResult.formatted_address.split(',').slice(0, 2).join(', ');

    let neighborhood = "";
    let locality = "";
    let sublocality = "";

    for (const comp of components) {
      if (comp.types.includes("neighborhood")) neighborhood = comp.long_name;
      if (comp.types.includes("sublocality") || comp.types.includes("sublocality_level_1")) sublocality = comp.long_name;
      if (comp.types.includes("locality")) locality = comp.long_name;
    }

    const parts = [];
    if (neighborhood) parts.push(neighborhood);
    else if (sublocality) parts.push(sublocality);
    if (locality) parts.push(locality);

    if (parts.length > 0) return parts.join(", ");
    
    return googleResult.formatted_address.split(',').slice(0, 2).join(', ');
  }

  private cacheLocation(address: string, lat: number, lng: number) {
    this.lastKnownLocation = address;
    this.lastKnownCoords = { lat, lng };
    this.locationTimestamp = Date.now();
  }

  public clearCache() {
    this.lastKnownLocation = null;
    this.lastKnownCoords = null;
    this.locationTimestamp = null;
  }
}

export const locationService = new LocationService();
