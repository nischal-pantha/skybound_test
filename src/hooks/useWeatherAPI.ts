
import { useState, useCallback } from 'react';

interface WeatherData {
  metar: string;
  taf: string;
  decoded: {
    airport: string;
    wind: string;
    visibility: string;
    clouds: string;
    temperature: string;
    dewpoint: string;
    altimeter: string;
    flightRules: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  };
}

export function useWeatherAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (icaoCode: string): Promise<WeatherData | null> => {
    setLoading(true);
    setError(null);

    try {
      // Using AVWX API (free tier) - in production, you'd want to use a proper API key
      const response = await fetch(`https://avwx.rest/api/metar/${icaoCode}?format=json`, {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY' // User would need to add their API key
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      // Mock data for demonstration - replace with actual API parsing
      const mockData: WeatherData = {
        metar: `${icaoCode} 081553Z 28008KT 10SM FEW025 SCT250 22/17 A3015 RMK AO2 SLP215`,
        taf: `${icaoCode} 081720Z 0818/0918 28010KT P6SM FEW025 SCT250`,
        decoded: {
          airport: `${icaoCode} - Airport`,
          wind: "280° at 8 knots",
          visibility: "10 statute miles",
          clouds: "Few at 2,500ft, Scattered at 25,000ft",
          temperature: "22°C (72°F)",
          dewpoint: "17°C (63°F)",
          altimeter: "30.15 inHg",
          flightRules: "VFR"
        }
      };

      return mockData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchWeather, loading, error };
}
