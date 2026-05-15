import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { locationService, LocationTelemetry } from "../services/locationService";
import { LocationState } from "../types/emergency";
import { logger } from "../services/incidentLogger";

const isValidCoord = (lat?: number | null, lng?: number | null) =>
  typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

const logOperational = (tag: string, message: string) =>
  console.log(`%c[${tag}]%c ${message}`, 'color: #dc2626; font-weight: bold', 'color: inherit');

// Professional Dark Theme for Google Maps
const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#000000" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#111111" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#222222" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

interface GMapProps {
  className?: string;
  sosActive?: boolean;
  destination?: { lat: number; lng: number };
  routePoints?: google.maps.LatLngLiteral[] | null;
  routeRisk?: 'LOW' | 'MODERATE' | 'HIGH' | null;
  nearbyHelp?: any[] | null;
  onTelemetryUpdate?: (telemetry: LocationTelemetry) => void;
}

function RoutePolyline({ points, risk }: { points: google.maps.LatLngLiteral[]; risk: 'LOW' | 'MODERATE' | 'HIGH' | null }) {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps || !points || points.length === 0) return;

    logOperational('ROUTE_RENDER', `Initializing polyline with ${points.length} nodes`);

    const validPoints = points.filter(p => isValidCoord(p.lat, p.lng));
    if (validPoints.length === 0) return;

    const color = risk === 'HIGH' ? '#dc2626' : risk === 'MODERATE' ? '#eab308' : '#22c55e';
    const p = new google.maps.Polyline({
      map,
      path: validPoints,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });
    setPolyline(p);
    return () => {
      p.setMap(null);
      logOperational('ROUTE_RENDER', 'Polyline disposed');
    };
  }, [map, points, risk]);

  return null;
}

function NearbyMarkers({ results }: { results: any[] }) {
  const map = useMap();
  if (!map) return null;

  return (
    <>
      {results.map((place, idx) => {
        if (!place.geometry?.location) return null;
        const types = place.types || [];

        let color = '#000000ff'; // default blue
        let label = 'H';

        if (types.includes('police')) {
          color = '#dc2626'; // crimson red
          label = 'P';
        } else if (types.includes('hospital') || types.includes('doctor') || types.includes('health')) {
          color = '#22c55e'; // green
          label = 'M';
        } else if (types.includes('fire_station')) {
          color = '#f97316'; // orange
          label = 'F';
        }

        return (
          <AdvancedMarker
            key={place.place_id || idx}
            position={{ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }}
          >
            <div className="relative group flex flex-col items-center">
              <div className="absolute w-8 h-8 rounded-full animate-pulse opacity-20" style={{ backgroundColor: color }} />
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center bg-black/80 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 transition-transform group-hover:scale-110">
                <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
              </div>
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[8px] text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                <p className="font-bold">{place.name}</p>
                <p className="text-silver/60 text-[7px]">{place.vicinity}</p>
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function PolylineTrail({ history }: { history: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps || !history || history.length === 0) return;

    const validHistory = history.filter(h => isValidCoord(h.lat, h.lng));
    if (validHistory.length === 0) return;

    const p = new google.maps.Polyline({
      map,
      path: validHistory,
      geodesic: true,
      strokeColor: "#dc2626",
      strokeOpacity: 0.4,
      strokeWeight: 2,
    });
    setPolyline(p);
    return () => {
      p.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (polyline) {
      polyline.setPath(history);
    }
  }, [polyline, history]);

  return null;
}

function AccuracyRadius({ telemetry }: { telemetry: LocationTelemetry | null }) {
  const map = useMap();
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const c = new google.maps.Circle({
      map,
      strokeWeight: 1,
      strokeOpacity: 0.3,
      fillOpacity: 0.1,
      clickable: false,
    });
    setCircle(c);
    return () => {
      c.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!circle || !telemetry || !isValidCoord(telemetry.latitude, telemetry.longitude)) return;

    circle.setCenter({ lat: telemetry.latitude!, lng: telemetry.longitude! });
    circle.setRadius(telemetry.accuracy || 100);

    let color = "#22c55e"; // green for high accuracy
    if (telemetry.locationState === LocationState.LOW_ACCURACY) color = "#eab308"; // yellow
    if (telemetry.stale || telemetry.fallbackUsed) color = "#dc2626"; // red

    circle.setOptions({ fillColor: color, strokeColor: color });
  }, [circle, telemetry]);

  return null;
}

function MapController({ telemetry, destination, sosActive }: { telemetry: LocationTelemetry | null; destination?: { lat: number, lng: number }; sosActive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (telemetry && isValidCoord(telemetry.latitude, telemetry.longitude)) {
      const userPos = { lat: telemetry.latitude!, lng: telemetry.longitude! };
      if (destination && isValidCoord(destination.lat, destination.lng)) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userPos);
        bounds.extend(destination);
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      } else {
        map.panTo(userPos);
        if (sosActive) {
          map.setZoom(18);
        }
      }
    }
  }, [map, telemetry, destination, sosActive]);
  return null;
}

export const GMap = React.memo(function GMap({
  className,
  sosActive = false,
  destination,
  routePoints,
  routeRisk,
  nearbyHelp,
  onTelemetryUpdate
}: GMapProps) {
  const [telemetry, setTelemetry] = useState<LocationTelemetry | null>(null);
  const [history, setHistory] = useState<google.maps.LatLngLiteral[]>([]);
  const lastLoggedState = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    logOperational('MAP_INIT', 'Initializing telemetry subsystem');

    const fetchTelemetry = async () => {
      try {
        const data = await locationService.getEmergencyTelemetry(0);
        if (!isMounted) return;

        setTelemetry(data);
        if (onTelemetryUpdate) onTelemetryUpdate(data);

        if (isValidCoord(data.latitude, data.longitude)) {
          const newPoint = { lat: data.latitude!, lng: data.longitude! };
          setHistory(prev => [...prev, newPoint].slice(-30));

          if (data.locationState !== lastLoggedState.current) {
            logOperational('TELEMETRY_SYNC', `State change: ${data.locationState}`);
            lastLoggedState.current = data.locationState;
          }
        }
      } catch (e) {
        logOperational('TELEMETRY_SYNC', 'Telemetry fetch failed');
      }

      intervalId = setTimeout(fetchTelemetry, sosActive ? 5000 : 30000);
    };

    fetchTelemetry();

    return () => {
      isMounted = false;
      if (intervalId) clearTimeout(intervalId);
      logOperational('MAP_INIT', 'Telemetry subsystem disposed');
    };
  }, [sosActive, onTelemetryUpdate]);

  const center = useMemo(() => {
    if (telemetry && telemetry.latitude && telemetry.longitude) {
      return { lat: telemetry.latitude, lng: telemetry.longitude };
    }
    return { lat: 28.7041, lng: 77.1025 };
  }, [telemetry]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={sosActive ? 18 : 16}
        disableDefaultUI={true}
        mapId="SURAKSHA_SETU_MAP"
        gestureHandling="greedy"
      >
        {telemetry && telemetry.latitude && telemetry.longitude && telemetry.locationState !== LocationState.UNAVAILABLE ? (
          <>
            <PolylineTrail history={history} />
            <AccuracyRadius telemetry={telemetry} />
            <MapController telemetry={telemetry} destination={destination} sosActive={sosActive} />

            {routePoints && routePoints.length > 0 && (
              <RoutePolyline points={routePoints} risk={routeRisk} />
            )}

            {nearbyHelp && nearbyHelp.length > 0 && (
              <NearbyMarkers results={nearbyHelp} />
            )}

            <AdvancedMarker position={{ lat: telemetry.latitude, lng: telemetry.longitude }}>
              <div className="relative flex items-center justify-center">
                <div className={`absolute rounded-full bg-crimson-glow/20 animate-ping ${sosActive ? 'w-20 h-20' : 'w-12 h-12'}`} />
                <div className={`absolute rounded-full border border-crimson-glow/50 ${sosActive ? 'w-10 h-10' : 'w-6 h-6'}`} />
                <div className={`rounded-full bg-crimson-glow shadow-[0_0_15px_rgba(220,38,38,1)] ${sosActive ? 'w-4 h-4' : 'w-2.5 h-2.5'}`} />
                {sosActive && (
                  <div className="absolute -top-8 bg-crimson-glow text-white text-[8px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase animate-pulse">
                    Live Tracking Locked
                  </div>
                )}
              </div>
            </AdvancedMarker>
            {destination && (
              <AdvancedMarker position={destination}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 rounded-full bg-blue-500/20" />
                  <div className="absolute w-5 h-5 rounded-full border border-blue-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  <div className="absolute -top-8 bg-blue-500/80 backdrop-blur-md text-white text-[8px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase whitespace-nowrap">
                    Destination Telemetry
                  </div>
                </div>
              </AdvancedMarker>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20">
            <div className="glass-panel p-6 rounded-2xl border-white/10 text-center max-w-xs">
              <div className="w-12 h-12 rounded-full bg-crimson-glow/20 flex items-center justify-center mx-auto mb-4">
                <div className="w-2 h-2 rounded-full bg-crimson-glow animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2">
                {telemetry?.locationState === LocationState.UNAVAILABLE ? 'Telemetry Unavailable' : 'Establishing Uplink...'}
              </h3>
              <p className="text-[10px] text-silver/60 uppercase tracking-wider leading-relaxed">
                {telemetry?.fallbackUsed ? 'Using last known coordinates from secure cache.' : 'Attempting to acquire tactical GPS signal.'}
              </p>
              {telemetry?.timestamp && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] text-silver/40 uppercase tracking-widest">
                    Last Update: {new Date(telemetry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Map>
    </div>
  );
});
