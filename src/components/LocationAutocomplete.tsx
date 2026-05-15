import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (data: {
    name: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    placeId: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search location...",
  className = ""
}) => {
  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placesLib) return;
    setAutocompleteService(new placesLib.AutocompleteService());
    // PlacesService needs an HTML element or Map, but we can use a dummy div
    setPlacesService(new placesLib.PlacesService(document.createElement('div')));
  }, [placesLib]);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!autocompleteService || input.length < 3) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      autocompleteService.getPlacePredictions(
        { input, componentRestrictions: { country: 'in' } }, // Restricted to India as per Suraksha-Setu context
        (results, status) => {
          setIsLoading(false);
          if (status === placesLib.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    },
    [autocompleteService]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) fetchPredictions(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [value, fetchPredictions, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    setIsLoading(true);
    placesService.getDetails(
      { placeId: prediction.place_id, fields: ['name', 'formatted_address', 'geometry'] },
      (place, status) => {
        setIsLoading(false);
        if (status === placesLib.PlacesServiceStatus.OK && place && place.geometry?.location) {
          onSelect({
            name: place.name || prediction.structured_formatting.main_text,
            formattedAddress: place.formatted_address || prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: prediction.place_id
          });
          onChange(place.formatted_address || prediction.description);
          setIsOpen(false);
        }
      }
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 pl-10 text-sm text-silver focus:outline-none focus:border-crimson-glow/50 transition-colors"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-crimson-glow animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-silver/40" />
          )}
        </div>
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden z-[110] shadow-2xl backdrop-blur-xl">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.02] last:border-0 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-silver/40 mt-0.5 group-hover:text-crimson-glow transition-colors" />
                <div>
                  <p className="text-xs text-silver font-medium group-hover:text-white transition-colors">
                    {p.structured_formatting.main_text}
                  </p>
                  <p className="text-[10px] text-silver/40 line-clamp-1">
                    {p.structured_formatting.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-black/40 flex justify-end">
             <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-non-white3_hdpi.png" alt="Powered by Google" className="h-2 opacity-50" />
          </div>
        </div>
      )}
    </div>
  );
};
