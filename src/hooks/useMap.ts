import { useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export function useMap() {
  const [routePolyline, setRoutePolyline] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [nearbyResults, setNearbyResults] = useState<any[]>([]);
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');

  const [isSafeRouteOpen, setIsSafeRouteOpen] = useState(false);
  const [routeStart, setRouteStart] = useState("");
  const [routeDest, setRouteDest] = useState("");
  const [structuredStart, setStructuredStart] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [structuredDest, setStructuredDest] = useState<{lat: number, lng: number, address: string, name: string} | null>(null);
  const [routeIsWalking, setRouteIsWalking] = useState(false);
  const [routeAnalysisState, setRouteAnalysisState] = useState<'IDLE' | 'ANALYZING' | 'RESULT'>('IDLE');
  const [routeRisk, setRouteRisk] = useState<'LOW' | 'MODERATE' | 'HIGH' | null>(null);
  const [routeInsights, setRouteInsights] = useState<string[]>([]);
  const [routeRecommendation, setRouteRecommendation] = useState("");
  const [routeAlternative, setRouteAlternative] = useState("");
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'FETCHING' | 'CACHED' | 'LIVE' | 'FAILED' | 'MANUAL'>('IDLE');
  const [gpsFailCount, setGpsFailCount] = useState(0);

  return {
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
  };
}
