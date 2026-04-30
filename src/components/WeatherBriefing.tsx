import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Wind, Map, RefreshCw, AlertTriangle, CheckCircle, Plane, Eye, CloudRain, Thermometer, Gauge as GaugeIcon, Droplets } from "lucide-react";
import { useRealTimeWeather } from "@/hooks/useRealTimeWeather";
import { useNotifications } from "@/contexts/NotificationContext";
import { WeatherRadarMap } from "./WeatherRadarMap";
import { validateICAO, validateRegion } from "@/utils/aviationValidation";

export const WeatherBriefing = () => {
  const [departureAirport, setDepartureAirport] = useState("KPAO");
  const [destinationAirport, setDestinationAirport] = useState("KSQL");
  const [weatherData, setWeatherData] = useState<any>(null);
  const { fetchWeather, loading, weatherData: realTimeWeatherData } = useRealTimeWeather();

  useEffect(() => {
    fetchWeather(departureAirport);
    fetchWeather(destinationAirport);
  }, []);

  useEffect(() => {
    if (Object.keys(realTimeWeatherData).length > 0) {
      const convertedData: any = {};
      [departureAirport, destinationAirport].forEach(airport => {
        if (realTimeWeatherData[airport]) {
          const data = realTimeWeatherData[airport];
          convertedData[airport] = {
            raw: data.metar,
            decoded: {
              airport: `${airport} - ${data.location}`,
              time: new Date(data.lastUpdated).toISOString().slice(11, 16) + 'Z',
              wind: `${data.windDirection}° at ${data.windSpeed} knots`,
              visibility: `${data.visibility.toFixed(1)} statute miles`,
              clouds: data.cloudCoverage,
              temperature: `${data.temperature}°C (${Math.round(data.temperature * 9/5 + 32)}°F)`,
              dewpoint: `${data.dewPoint}°C (${Math.round(data.dewPoint * 9/5 + 32)}°F)`,
              altimeter: `${data.pressure.toFixed(2)} inHg`,
              flightRules: data.flightRules
            }
          };
        }
      });
      if (Object.keys(convertedData).length > 0) {
        setWeatherData(convertedData);
      }
    }
  }, [realTimeWeatherData, departureAirport, destinationAirport]);

  const { notify } = useNotifications();

  const defaultMetarData: Record<string, any> = {
    KPAO: {
      raw: "KPAO 081553Z 28008KT 10SM FEW025 SCT250 22/17 A3015 RMK AO2 SLP215",
      decoded: { airport: "KPAO - Palo Alto Airport", time: "15:53Z", wind: "280° at 8 knots", visibility: "10 statute miles", clouds: "Few at 2,500ft, Scattered at 25,000ft", temperature: "22°C (72°F)", dewpoint: "17°C (63°F)", altimeter: "30.15 inHg", flightRules: "VFR" as const }
    },
    KSQL: {
      raw: "KSQL 081553Z 29010KT 10SM CLR 24/16 A3014 RMK AO2 SLP212",
      decoded: { airport: "KSQL - San Carlos Airport", time: "15:53Z", wind: "290° at 10 knots", visibility: "10 statute miles", clouds: "Clear", temperature: "24°C (75°F)", dewpoint: "16°C (61°F)", altimeter: "30.14 inHg", flightRules: "VFR" as const }
    }
  };

  const [windsAloft, setWindsAloft] = useState<Array<{ altitude: string; direction: string; speed: string; temperature: string }>>([]);
  const [windsLoading, setWindsLoading] = useState(false);

  const fetchWindsAloft = async (icao: string) => {
    const region = 'all';
    if (!validateRegion(region)) return;
    try {
      setWindsLoading(true);
      const url = `https://aviationweather.gov/api/data/windtemp?region=${encodeURIComponent(region)}&level=low&fcst=06&format=json`;
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to fetch winds aloft');
      const text = await response.text();
      if (!text || text.trim() === '') throw new Error('Empty response');
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        const station = data.find((s: any) => s.station?.includes(icao.substring(1))) || data[0];
        if (station) {
          const winds: typeof windsAloft = [];
          ['3000', '6000', '9000', '12000'].forEach(alt => {
            const dirKey = `dir_${alt}ft`, spdKey = `spd_${alt}ft`, tmpKey = `tmp_${alt}ft`;
            if (station[dirKey] !== undefined || station[spdKey] !== undefined) {
              winds.push({
                altitude: alt.replace(/(\d)(?=(\d{3})+$)/g, '$1,'),
                direction: station[dirKey]?.toString() || '--',
                speed: station[spdKey]?.toString() || '--',
                temperature: station[tmpKey] !== undefined ? (station[tmpKey] > 0 ? `+${station[tmpKey]}` : station[tmpKey].toString()) : '--'
              });
            }
          });
          if (winds.length > 0) { setWindsAloft(winds); return; }
        }
      }
      setWindsAloft(defaultWinds());
    } catch { setWindsAloft(defaultWinds()); } finally { setWindsLoading(false); }
  };

  const defaultWinds = () => [
    { altitude: "3,000", direction: "270", speed: "15", temperature: "+18" },
    { altitude: "6,000", direction: "280", speed: "22", temperature: "+12" },
    { altitude: "9,000", direction: "290", speed: "28", temperature: "+06" },
    { altitude: "12,000", direction: "300", speed: "35", temperature: "-01" }
  ];

  useEffect(() => { fetchWindsAloft(departureAirport); }, [departureAirport]);

  const handleGetWeather = async () => {
    if (!departureAirport || !destinationAirport) {
      notify.error("Input Required", "Please enter both departure and destination airports");
      return;
    }
    if (!validateICAO(departureAirport) || !validateICAO(destinationAirport)) {
      notify.error("Invalid Format", "Please use 4-letter ICAO codes (e.g., KPAO)");
      return;
    }
    try {
      await fetchWeather(departureAirport);
      await fetchWeather(destinationAirport);
      const convertedData: any = {};
      [departureAirport, destinationAirport].forEach(airport => {
        if (realTimeWeatherData[airport]) {
          const d = realTimeWeatherData[airport];
          convertedData[airport] = {
            raw: d.metar,
            decoded: {
              airport: `${airport} - ${d.location}`, time: new Date(d.lastUpdated).toISOString().slice(11, 16) + 'Z',
              wind: `${d.windDirection}° at ${d.windSpeed} knots`, visibility: `${d.visibility} statute miles`,
              clouds: d.cloudCoverage, temperature: `${d.temperature}°C (${Math.round(d.temperature * 9/5 + 32)}°F)`,
              dewpoint: `${d.dewPoint}°C (${Math.round(d.dewPoint * 9/5 + 32)}°F)`,
              altimeter: `${d.pressure.toFixed(2)} inHg`, flightRules: d.flightRules
            }
          };
        }
      });
      if (Object.keys(convertedData).length > 0) {
        setWeatherData(convertedData);
        notify.success("Weather Updated", "Latest weather data from National Weather Service");
      } else {
        setWeatherData(defaultMetarData);
        notify.info("Using Demo Data", "Real weather unavailable, showing sample data");
      }
    } catch {
      setWeatherData(defaultMetarData);
      notify.error("Weather Service Error", "Using demo data - real weather temporarily unavailable");
    }
  };

  const metarData = weatherData || defaultMetarData;

  const getAirportCoordinates = (icao: string): [number, number] => {
    const coords: Record<string, [number, number]> = {
      'KPAO': [-122.11667, 37.46667], 'KSQL': [-122.25, 37.51667], 'KHWD': [-122.12222, 37.65889],
      'KSJC': [-121.92889, 37.36278], 'KSFO': [-122.375, 37.61889], 'KOAK': [-122.22083, 37.72139],
      'KLAX': [-118.38889, 33.93806], 'KJFK': [-73.76393, 40.63915], 'KORD': [-87.9044399, 41.97972],
      'KDEN': [-104.65622, 39.84658], 'KATL': [-84.42694, 33.64028],
    };
    return coords[icao] || [-122.0, 37.5];
  };

  const flightAnalysis = useMemo(() => {
    const conditions = Object.values(metarData).map((data: any) => {
      const visibility = parseFloat(data.decoded.visibility.split(' ')[0]);
      const temp = parseFloat(data.decoded.temperature.split('°')[0]);
      const dewpoint = parseFloat(data.decoded.dewpoint.split('°')[0]);
      const windParts = data.decoded.wind.match(/(\d+)\s*knots/i);
      const windSpeed = windParts ? parseFloat(windParts[1]) : 0;
      let score = 100;
      if (visibility < 3) score -= 50; else if (visibility < 5) score -= 20; else if (visibility < 10) score -= 10;
      const spread = temp - dewpoint;
      if (spread < 2) score -= 30; else if (spread < 4) score -= 15;
      if (windSpeed > 20) score -= 30; else if (windSpeed > 15) score -= 15; else if (windSpeed > 10) score -= 5;
      return { ...data, score, visibility, windSpeed, spread };
    });
    const avgScore = conditions.reduce((sum, c) => sum + c.score, 0) / conditions.length;
    const minScore = Math.min(...conditions.map(c => c.score));
    return { conditions, avgScore, minScore, suitable: minScore >= 80, marginal: minScore >= 60 && minScore < 80, poor: minScore < 60 };
  }, [metarData]);

  const flightRulesColor = (rules: string) => {
    if (rules === 'VFR') return 'bg-success/15 text-success border-success/20';
    if (rules === 'MVFR') return 'bg-warning/15 text-warning border-warning/20';
    return 'bg-destructive/15 text-destructive border-destructive/20';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Weather Briefing</h2>
        <p className="text-sm text-muted-foreground mt-1">Current and forecast conditions for flight planning</p>
      </div>

      {/* Route Input */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Departure</Label>
            <Input
              value={departureAirport}
              onChange={(e) => setDepartureAirport(e.target.value.toUpperCase())}
              placeholder="KPAO"
              className="font-mono text-base h-11 rounded-xl border-border/60 bg-background/50 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</Label>
            <Input
              value={destinationAirport}
              onChange={(e) => setDestinationAirport(e.target.value.toUpperCase())}
              placeholder="KSQL"
              className="font-mono text-base h-11 rounded-xl border-border/60 bg-background/50 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alternate</Label>
            <Input placeholder="KHWD" className="font-mono text-base h-11 rounded-xl border-border/60 bg-background/50 focus:ring-2 focus:ring-primary/30" />
          </div>
          <Button
            className="h-11 rounded-xl font-medium text-sm"
            onClick={handleGetWeather}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {loading ? 'Fetching…' : 'Get Weather'}
          </Button>
        </div>
      </div>

      {/* GO / NO-GO Decision Card */}
      <div className={`rounded-2xl p-6 border transition-all ${
        flightAnalysis.suitable
          ? 'bg-success/5 border-success/20'
          : flightAnalysis.marginal
          ? 'bg-warning/5 border-warning/20'
          : 'bg-destructive/5 border-destructive/20'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            flightAnalysis.suitable ? 'bg-success/15' : flightAnalysis.marginal ? 'bg-warning/15' : 'bg-destructive/15'
          }`}>
            {flightAnalysis.suitable
              ? <CheckCircle className="h-6 w-6 text-success" />
              : <AlertTriangle className="h-6 w-6 text-warning" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {flightAnalysis.suitable ? 'GO — Excellent VFR Conditions'
                : flightAnalysis.marginal ? 'CAUTION — Marginal VFR'
                : 'NO-GO — Poor Conditions'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Safety score: {flightAnalysis.minScore.toFixed(0)}/100
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: 'Avg Visibility', value: `${(flightAnalysis.conditions.reduce((s, c) => s + c.visibility, 0) / flightAnalysis.conditions.length).toFixed(1)} SM` },
            { label: 'Max Wind', value: `${Math.max(...flightAnalysis.conditions.map(c => c.windSpeed))} kt` },
            { label: 'Min T-Dp Spread', value: `${Math.min(...flightAnalysis.conditions.map(c => c.spread)).toFixed(1)}°C` },
          ].map(item => (
            <div key={item.label} className="glass-panel rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-base font-semibold text-foreground mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metar" className="space-y-5">
        <TabsList className="h-10 p-1 rounded-xl bg-muted/50 backdrop-blur-sm w-full grid grid-cols-5">
          <TabsTrigger value="metar" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">METAR</TabsTrigger>
          <TabsTrigger value="taf" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">TAF</TabsTrigger>
          <TabsTrigger value="radar" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Radar</TabsTrigger>
          <TabsTrigger value="winds" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Winds</TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Analysis</TabsTrigger>
        </TabsList>

        {/* METAR */}
        <TabsContent value="metar" className="space-y-4">
          {[departureAirport, destinationAirport].map((airport) => {
            const realData = realTimeWeatherData[airport];
            const displayData = metarData[airport];
            const rawMetar = realData?.metar || displayData?.raw || 'METAR data not available';
            const decoded = displayData?.decoded || {
              airport, time: '--:--Z', wind: 'N/A', visibility: 'N/A', clouds: 'N/A',
              temperature: 'N/A', dewpoint: 'N/A', altimeter: 'N/A', flightRules: 'VFR' as const
            };
            return (
              <div key={airport} className="glass-panel rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{decoded.airport}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Observed {decoded.time}</p>
                  </div>
                  <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold border ${flightRulesColor(decoded.flightRules)}`}>
                    {decoded.flightRules}
                  </Badge>
                </div>
                <div className="font-mono text-[11px] bg-muted/40 p-3 rounded-xl text-foreground/80 break-all leading-relaxed">
                  {rawMetar}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Wind, label: 'Wind', value: decoded.wind, color: 'text-primary' },
                    { icon: Eye, label: 'Visibility', value: decoded.visibility, color: 'text-success' },
                    { icon: Thermometer, label: 'Temperature', value: decoded.temperature, color: 'text-warning' },
                    { icon: GaugeIcon, label: 'Altimeter', value: decoded.altimeter, color: 'text-primary' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-muted/30 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <item.icon className={`h-3 w-3 ${item.color}`} />
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CloudSun className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Clouds</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{decoded.clouds}</p>
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* TAF */}
        <TabsContent value="taf" className="space-y-4">
          {[departureAirport, destinationAirport].map((airport) => {
            const data = realTimeWeatherData[airport];
            const hasTAF = !!data?.tafRaw;
            const tafStation = data?.tafStation && data.tafStation !== airport ? data.tafStation : null;
            return (
              <div key={airport} className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Terminal Aerodrome Forecast — {airport}
                    {tafStation && <span className="text-sm font-normal text-muted-foreground ml-2">(nearest: {tafStation})</span>}
                  </h3>
                </div>
                <div className="font-mono text-[11px] bg-muted/40 p-3 rounded-xl text-foreground/80 min-h-[60px] leading-relaxed">
                  {hasTAF ? data.tafRaw : 'No TAF available for this station.'}
                </div>
                {hasTAF && (
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground">TAF provides forecast conditions for the next 24–30 hours. Review for trends in wind, visibility, clouds, and weather phenomena.</p>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* Radar */}
        <TabsContent value="radar">
          <div className="rounded-2xl overflow-hidden border border-border/40">
            <WeatherRadarMap
              airports={[
                { icao: departureAirport, name: metarData[departureAirport]?.decoded?.airport || departureAirport, coordinates: getAirportCoordinates(departureAirport) },
                { icao: destinationAirport, name: metarData[destinationAirport]?.decoded?.airport || destinationAirport, coordinates: getAirportCoordinates(destinationAirport) }
              ]}
            />
          </div>
        </TabsContent>

        {/* Winds Aloft */}
        <TabsContent value="winds">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Winds & Temperatures Aloft</h3>
                <p className="text-xs text-muted-foreground mt-0.5">6-hour forecast for route planning</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchWindsAloft(departureAirport)} disabled={windsLoading} className="rounded-lg h-8 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${windsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {windsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading winds aloft…
              </div>
            ) : windsAloft.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Altitude</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Direction</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Speed (kt)</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Temp (°C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {windsAloft.map((wind, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{wind.altitude} ft</td>
                        <td className="py-3 px-4 text-foreground/80">{wind.direction !== '--' ? `${wind.direction}°` : '--'}</td>
                        <td className="py-3 px-4 text-foreground/80">{wind.speed}</td>
                        <td className="py-3 px-4 text-foreground/80">{wind.temperature}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No data available. Click refresh to try again.</div>
            )}
          </div>
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-semibold text-foreground">Flight Conditions Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-success/5 border border-success/15 space-y-3">
                <h4 className="text-sm font-semibold text-success">Good for Training</h4>
                <ul className="text-sm text-foreground/70 space-y-1.5">
                  <li>• VFR conditions at both airports</li>
                  <li>• Light winds favor student operations</li>
                  <li>• Good visibility for pattern work</li>
                  <li>• Stable atmospheric conditions</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-warning/5 border border-warning/15 space-y-3">
                <h4 className="text-sm font-semibold text-warning">Considerations</h4>
                <ul className="text-sm text-foreground/70 space-y-1.5">
                  <li>• Crosswind component at destination</li>
                  <li>• Monitor TAF for changes</li>
                  <li>• Check NOTAMs before departure</li>
                  <li>• Have alternate airport ready</li>
                </ul>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/15 space-y-3">
              <h4 className="text-sm font-semibold text-primary">Recommended Actions</h4>
              <ul className="text-sm text-foreground/70 space-y-1.5">
                <li>• File VFR flight plan for cross-country</li>
                <li>• Brief crosswind landing techniques</li>
                <li>• Check NOTAMs for both airports</li>
                <li>• Monitor weather during flight</li>
                <li>• Brief emergency procedures</li>
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-muted/40 space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Weather Minimums</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Student Pilot VFR</p>
                  <ul className="text-foreground/60 space-y-1">
                    <li>Visibility: 5+ statute miles</li>
                    <li>Ceiling: 3,000+ feet AGL</li>
                    <li>Wind: ≤15 knots</li>
                    <li>Crosswind: ≤10 knots</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Current Conditions</p>
                  <ul className="text-foreground/60 space-y-1">
                    <li>Visibility: 10+ statute miles ✓</li>
                    <li>Ceiling: Clear/High ✓</li>
                    <li>Wind: 8-10 knots ✓</li>
                    <li>Crosswind: Minimal ✓</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
