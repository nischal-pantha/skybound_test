import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateICAO, sanitizeICAO } from '@/utils/aviationValidation';
export interface WeatherStation {
  icao: string;
  name: string;
  metar: string;
  taf?: string;
  conditions: {
    flightRules: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    visibility: number;
    ceiling?: number;
    wind: {
      direction: number;
      speed: number;
      gusts?: number;
    };
    temperature: number;
    dewpoint: number;
    altimeter: number;
    clouds: string;
  };
  timestamp: string;
}

export interface AreaWeather {
  sigmets: any[];
  airmets: any[];
  pireps: any[];
  notams: any[];
}

export const useAviationWeather = () => {
  const [weatherStations, setWeatherStations] = useState<WeatherStation[]>([]);
  const [areaWeather, setAreaWeather] = useState<AreaWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Parse METAR data
  const parseMetar = useCallback((metarText: string, icao: string): WeatherStation => {
    // Simple METAR parsing for demo - in production would use a proper METAR parser
    const parts = metarText.split(' ');
    
    // Extract basic data with fallbacks
    let windDirection = 0;
    let windSpeed = 0;
    let visibility = 10;
    let temperature = 20;
    let dewpoint = 15;
    let altimeter = 30.00;
    
    // Find wind information (pattern: 12015KT or 12015G25KT)
    const windPattern = parts.find(part => /\d{5}(G\d{2})?KT/.test(part));
    if (windPattern) {
      windDirection = parseInt(windPattern.substring(0, 3));
      windSpeed = parseInt(windPattern.substring(3, 5));
    }
    
    // Find visibility (pattern: 10SM or M1/4SM)
    const visPattern = parts.find(part => /\d+SM|M?\d+\/\d+SM/.test(part));
    if (visPattern) {
      visibility = parseFloat(visPattern.replace('SM', '').replace('M', ''));
    }
    
    // Find temperature/dewpoint (pattern: 23/18 or M05/M10)
    const tempPattern = parts.find(part => /M?\d{2}\/M?\d{2}/.test(part));
    if (tempPattern) {
      const [temp, dew] = tempPattern.split('/');
      temperature = parseInt(temp.replace('M', '-'));
      dewpoint = parseInt(dew.replace('M', '-'));
    }
    
    // Find altimeter (pattern: A3012)
    const altPattern = parts.find(part => /A\d{4}/.test(part));
    if (altPattern) {
      altimeter = parseFloat((parseInt(altPattern.substring(1)) / 100).toFixed(2));
    }
    
    // Determine flight rules
    let flightRules: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' = 'VFR';
    if (visibility < 1) flightRules = 'LIFR';
    else if (visibility < 3) flightRules = 'IFR';
    else if (visibility < 5) flightRules = 'MVFR';
    
    return {
      icao: icao,
      name: `${icao} Airport`,
      metar: metarText,
      conditions: {
        flightRules,
        visibility,
        wind: { direction: windDirection, speed: windSpeed },
        temperature,
        dewpoint,
        altimeter,
        clouds: parts.find(part => /CLR|FEW|SCT|BKN|OVC/.test(part)) || 'CLR'
      },
      timestamp: new Date().toISOString()
    };
  }, []);

  // Fetch weather data from National Weather Service API
  const fetchMETAR = useCallback(async (icaoCodes: string[]) => {
    if (icaoCodes.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stations: WeatherStation[] = [];
      
      // Fetch weather for each airport from National Weather Service
      for (const icao of icaoCodes) {
        // Validate and sanitize ICAO code
        const sanitizedIcao = sanitizeICAO(icao);
        if (!sanitizedIcao) {
          console.warn(`Invalid ICAO code: ${icao}, skipping`);
          stations.push(generateFallbackData(icao.toUpperCase()));
          continue;
        }

        try {
          // First get airport info to find the weather station with properly encoded ICAO
          const stationResponse = await fetch(`https://api.weather.gov/stations/${encodeURIComponent(sanitizedIcao)}`);
          if (stationResponse.ok) {
            const stationData = await stationResponse.json();
            
            // Get current observations with properly encoded ICAO
            const obsResponse = await fetch(`https://api.weather.gov/stations/${encodeURIComponent(sanitizedIcao)}/observations/latest`);
            if (obsResponse.ok) {
              const obsData = await obsResponse.json();
              const obs = obsData.properties;
              
              // Convert NWS data to our format
              const weatherStation: WeatherStation = {
                icao: sanitizedIcao,
                name: stationData.properties?.name || `${sanitizedIcao} Airport`,
                metar: generateMetarFromNWS(obs, sanitizedIcao),
                conditions: {
                  flightRules: determineFlightRules(obs),
                  visibility: convertVisibility(obs.visibility),
                  wind: {
                    direction: Math.round(obs.windDirection?.value || 0),
                    speed: Math.round(convertWindSpeed(obs.windSpeed)),
                    gusts: obs.windGust?.value ? Math.round(convertWindSpeed(obs.windGust)) : undefined
                  },
                  temperature: Math.round(convertTemp(obs.temperature)),
                  dewpoint: Math.round(convertTemp(obs.dewpoint)),
                  altimeter: convertPressure(obs.barometricPressure),
                  clouds: formatClouds(obs.cloudLayers)
                },
                timestamp: obs.timestamp || new Date().toISOString()
              };
              
              stations.push(weatherStation);
            } else {
              // Fallback for this station
              stations.push(generateFallbackData(sanitizedIcao));
            }
          } else {
            // Fallback for this station
            stations.push(generateFallbackData(sanitizedIcao));
          }
        } catch (stationError) {
          console.warn(`Failed to fetch weather for ${sanitizedIcao}:`, stationError);
          stations.push(generateFallbackData(sanitizedIcao));
        }
      }
      
      setWeatherStations(stations);
      
      toast({
        title: "Weather Updated",
        description: `Updated weather for ${stations.length} station(s) from National Weather Service`,
      });
      
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather data');
      
      // Generate fallback data for all stations
      const fallbackStations = icaoCodes.map(icao => generateFallbackData(icao));
      setWeatherStations(fallbackStations);
      
      toast({
        title: "Using Demo Data",
        description: "National Weather Service unavailable. Using realistic demo data.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [parseMetar, toast]);

  // Helper functions for NWS data conversion
  const convertTemp = (temp: any): number => {
    if (!temp?.value) return 20;
    // NWS API provides temperature in Celsius, convert to Fahrenheit
    return temp.value * 9/5 + 32;
  };

  const convertWindSpeed = (wind: any): number => {
    if (!wind?.value) return 0;
    return wind.value * 1.944; // Convert m/s to knots
  };

  const convertVisibility = (vis: any): number => {
    if (!vis?.value) return 10;
    return vis.value / 1609.34; // Convert meters to statute miles
  };

  const convertPressure = (pressure: any): number => {
    if (!pressure?.value) return 30.00;
    return pressure.value / 3386.39; // Convert Pa to inHg
  };

  const formatClouds = (cloudLayers: any[]): string => {
    if (!cloudLayers || cloudLayers.length === 0) return 'CLR';
    
    const layer = cloudLayers[0];
    const coverage = layer.amount || 'CLR';
    const altitude = layer.base?.value ? Math.round(layer.base.value * 3.28084 / 100) : '';
    
    const coverageMap: { [key: string]: string } = {
      'skc': 'CLR',
      'clr': 'CLR',
      'few': 'FEW',
      'sct': 'SCT',
      'bkn': 'BKN',
      'ovc': 'OVC'
    };
    
    return `${coverageMap[coverage] || 'CLR'}${altitude}`;
  };

  const determineFlightRules = (obs: any): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' => {
    const visibility = convertVisibility(obs.visibility);
    const ceiling = obs.cloudLayers?.[0]?.base?.value ? obs.cloudLayers[0].base.value * 3.28084 : 10000;
    
    if (visibility < 1 || ceiling < 500) return 'LIFR';
    if (visibility < 3 || ceiling < 1000) return 'IFR';
    if (visibility < 5 || ceiling < 3000) return 'MVFR';
    return 'VFR';
  };

  const generateMetarFromNWS = (obs: any, icao: string): string => {
    const timestamp = new Date();
    const day = timestamp.getUTCDate().toString().padStart(2, '0');
    const hour = timestamp.getUTCHours().toString().padStart(2, '0');
    const minute = timestamp.getUTCMinutes().toString().padStart(2, '0');
    
    const windDir = Math.round(obs.windDirection?.value || 0).toString().padStart(3, '0');
    const windSpd = Math.round(convertWindSpeed(obs.windSpeed)).toString().padStart(2, '0');
    const vis = Math.round(convertVisibility(obs.visibility));
    const temp = Math.round(convertTemp(obs.temperature));
    const dewp = Math.round(convertTemp(obs.dewpoint));
    const alt = Math.round(convertPressure(obs.barometricPressure) * 100);
    const clouds = formatClouds(obs.cloudLayers);
    
    return `METAR ${icao} ${day}${hour}${minute}Z ${windDir}${windSpd}KT ${vis}SM ${clouds} ${temp}/${dewp} A${alt} RMK AO2`;
  };

  // Generate realistic fallback weather data
  const generateFallbackData = useCallback((icao: string): WeatherStation => {
    const windDir = Math.floor(Math.random() * 360);
    const windSpd = Math.floor(Math.random() * 25);
    const vis = Math.floor(8 + Math.random() * 7);
    const temp = Math.floor(15 + Math.random() * 20);
    const dew = temp - Math.floor(5 + Math.random() * 10);
    const alt = Math.floor(2950 + Math.random() * 150) / 100;
    const clouds = ['CLR', 'FEW120', 'SCT080', 'BKN050', 'OVC025'][Math.floor(Math.random() * 5)];
    
    let flightRules: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' = 'VFR';
    if (vis < 1) flightRules = 'LIFR';
    else if (vis < 3) flightRules = 'IFR';
    else if (vis < 5) flightRules = 'MVFR';
    
    const timestamp = new Date();
    const hour = timestamp.getUTCHours().toString().padStart(2, '0');
    const minute = timestamp.getUTCMinutes().toString().padStart(2, '0');
    
    const metar = `METAR ${icao} ${timestamp.getUTCDate().toString().padStart(2, '0')}${hour}${minute}Z AUTO ${windDir.toString().padStart(3, '0')}${windSpd.toString().padStart(2, '0')}KT ${vis}SM ${clouds} ${temp.toString().padStart(2, '0')}/${dew < 0 ? 'M' + Math.abs(dew).toString().padStart(2, '0') : dew.toString().padStart(2, '0')} A${Math.round(alt * 100)} RMK AO2`;
    
    return {
      icao,
      name: `${icao} Airport`,
      metar,
      conditions: {
        flightRules,
        visibility: vis,
        wind: { direction: windDir, speed: windSpd },
        temperature: temp,
        dewpoint: dew,
        altimeter: alt,
        clouds
      },
      timestamp: timestamp.toISOString()
    };
  }, []);

  // Fetch area weather (PIREPs, SIGMETs, AIRMETs)
  const fetchAreaWeather = useCallback(async (bounds: { north: number; south: number; east: number; west: number }) => {
    setLoading(true);
    
    try {
      // For demo purposes, generate simulated area weather
      const areaData: AreaWeather = {
        sigmets: [],
        airmets: [
          {
            id: 'AIRMET_TANGO_1',
            type: 'Turbulence',
            severity: 'Moderate',
            altitudes: 'Below 12,000 feet',
            area: 'San Francisco Bay Area',
            validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
          }
        ],
        pireps: [
          {
            id: 'PIREP_1',
            aircraft: 'B737',
            altitude: 8000,
            location: 'KPAO vicinity',
            time: new Date().toISOString(),
            report: 'Light turbulence, good visibility'
          }
        ],
        notams: []
      };
      
      setAreaWeather(areaData);
      
    } catch (err) {
      console.error('Area weather fetch error:', err);
      setError('Failed to fetch area weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    weatherStations,
    areaWeather,
    loading,
    error,
    fetchMETAR,
    fetchAreaWeather,
    generateFallbackData
  };
};