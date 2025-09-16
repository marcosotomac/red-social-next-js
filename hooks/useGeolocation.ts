"use client";

import { useState, useCallback } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

interface UseGeolocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está soportada en este navegador");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache por 1 minuto
          });
        }
      );

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      // Intentar obtener la dirección usando geocodificación inversa
      try {
        const address = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        locationData.address = address;
      } catch (geocodeError) {
        console.warn("No se pudo obtener la dirección:", geocodeError);
      }

      setLocation(locationData);
    } catch (error) {
      let errorMessage = "Error desconocido al obtener la ubicación";

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso denegado para acceder a la ubicación";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado para obtener la ubicación";
            break;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearLocation,
  };
}

// Función para geocodificación inversa usando OpenStreetMap (gratuito)
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
    {
      headers: {
        "User-Agent": "MyApp/1.0", // OpenStreetMap requiere un User-Agent
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error en la geocodificación inversa");
  }

  const data = await response.json();

  if (data.display_name) {
    // Formatear la dirección para mostrar solo la información relevante
    const address = data.address;
    const parts = [];

    if (address?.road) parts.push(address.road);
    if (address?.city || address?.town || address?.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address?.state) parts.push(address.state);
    if (address?.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(", ") : data.display_name;
  }

  throw new Error("No se pudo obtener la dirección");
}
