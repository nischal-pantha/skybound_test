import { useState, useEffect, useCallback } from 'react';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GPSError {
  code: number;
  message: string;
}

export const useGPSLocation = (options?: PositionOptions) => {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<GPSError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable('geolocation' in navigator);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setIsTracking(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        });
        setError(null);
      },
      (err) => {
        setError({
          code: err.code,
          message: err.message
        });
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [options]);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported'
      });
      return Promise.reject(error);
    }

    return new Promise<GPSPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: GPSPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          };
          setPosition(position);
          resolve(position);
        },
        (err) => {
          const error: GPSError = {
            code: err.code,
            message: err.message
          };
          setError(error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options
        }
      );
    });
  }, [options]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const clearPosition = useCallback(() => {
    setPosition(null);
    setError(null);
  }, []);

  return {
    position,
    error,
    isTracking,
    isAvailable,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearPosition
  };
};
