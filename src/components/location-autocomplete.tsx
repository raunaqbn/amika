'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Check if Google Places API is available
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/places/autocomplete?input=test');
        const data = await response.json();
        setIsApiAvailable(!data.error?.includes('API key'));
      } catch {
        setIsApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Only fetch predictions if API is available
    if (isApiAvailable) {
      // Debounce the API call
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
    }
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    onChange(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
  };

  const handleFocus = () => {
    if (predictions.length > 0 && isApiAvailable) {
      setShowDropdown(true);
    }
  };

  // If API is not available, render a simple input
  if (isApiAvailable === false) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin className="w-4 h-4" />
        </div>
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <MapPin className="w-4 h-4" />
      </div>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}

      {/* Predictions dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  {prediction.structured_formatting.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
