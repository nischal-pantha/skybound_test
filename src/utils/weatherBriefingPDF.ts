import jsPDF from 'jspdf';

interface WaypointWeather {
  waypointId: string;
  identifier: string;
  coordinates: [number, number];
  weather: {
    condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    visibility: number;
    ceiling: number | null;
    temperature: number;
    dewpoint: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    precipitation?: string;
    rawMetar?: string;
  };
  forecast?: {
    condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    probability?: number;
    changeTime?: string;
  };
  trend?: 'improving' | 'deteriorating' | 'stable';
}

interface VerticalSlice {
  identifier: string;
  distanceNM: number;
  layers: Array<{
    altitude: number;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    icingRisk: string;
    turbulenceRisk: string;
    cloudCoverage: string;
  }>;
}

interface MetarTafData {
  icao: string;
  rawMetar?: string;
  rawTaf?: string;
  flightCategory?: string;
  temperature?: number;
  dewpoint?: number;
  windSpeed?: number;
  windDirection?: number;
  visibility?: number;
  ceiling?: number | null;
}

interface TFR {
  notamNumber: string;
  type: string;
  description: string;
  altitude: string;
  effectiveStart: string;
  effectiveEnd: string;
}

interface Advisory {
  id: string;
  type: 'SIGMET' | 'AIRMET';
  hazard: string;
  description: string;
  validFrom: string;
  validTo: string;
}

interface WeatherBriefingPDFOptions {
  waypointWeather: WaypointWeather[];
  verticalData?: VerticalSlice[];
  metarTafData?: MetarTafData[];
  tfrs?: TFR[];
  advisories?: Advisory[];
  cruiseAltitude?: number;
}

const CONDITION_COLORS: Record<string, [number, number, number]> = {
  VFR: [34, 197, 94],
  MVFR: [59, 130, 246],
  IFR: [239, 68, 68],
  LIFR: [168, 85, 247],
};

export const exportWeatherBriefingPDF = (options: WeatherBriefingPDFOptions) => {
  const {
    waypointWeather,
    verticalData,
    metarTafData,
    tfrs = [],
    advisories = [],
    cruiseAltitude = 12000,
  } = options;

  const pdf = new jsPDF();
  const now = new Date();
  let yPos = 20;

  const addHeader = (title: string) => {
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, 20, yPos);
    yPos += 2;
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPos, 190, yPos);
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
  };

  const checkPage = (needed: number = 15) => {
    if (yPos > 280 - needed) { pdf.addPage(); yPos = 20; }
  };

  // ================================================================
  // TITLE PAGE
  // ================================================================
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  pdf.text('PILOT WEATHER BRIEFING', 20, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${now.toUTCString()}`, 20, yPos);
  yPos += 5;

  const routeString = waypointWeather.map(w => w.identifier).join(' \u2192 ');
  pdf.text(`Route: ${routeString}`, 20, yPos);
  yPos += 5;
  pdf.text(`Cruise Altitude: FL${Math.floor(cruiseAltitude / 100)}`, 20, yPos);
  yPos += 12;

  // ================================================================
  // 1. ROUTE WEATHER SUMMARY
  // ================================================================
  addHeader('1. ROUTE WEATHER SUMMARY');

  const conditions = waypointWeather.map(w => w.weather.condition);
  const worstCondition = (['LIFR', 'IFR', 'MVFR', 'VFR'] as const).find(c => conditions.includes(c)) || 'VFR';
  const minVis = Math.min(...waypointWeather.map(w => w.weather.visibility));
  const ceilValues = waypointWeather.filter(w => w.weather.ceiling).map(w => w.weather.ceiling!);
  const minCeil = ceilValues.length > 0 ? Math.min(...ceilValues) : null;
  const maxWind = Math.max(...waypointWeather.map(w => w.weather.windSpeed));
  const maxGust = Math.max(...waypointWeather.map(w => w.weather.windGust || 0));

  const summaryItems = [
    [`Worst Flight Category: ${worstCondition}`, `Minimum Visibility: ${minVis} SM`],
    [`Minimum Ceiling: ${minCeil ? minCeil + ' ft AGL' : 'Clear'}`, `Max Wind: ${maxWind} kt${maxGust > 0 ? ' G' + maxGust : ''}`],
  ];

  pdf.setFontSize(10);
  summaryItems.forEach(row => {
    row.forEach((item, idx) => {
      pdf.text(item, idx === 0 ? 20 : 110, yPos);
    });
    yPos += 6;
  });

  // Flight category count
  yPos += 2;
  const catCounts = { VFR: 0, MVFR: 0, IFR: 0, LIFR: 0 };
  conditions.forEach(c => catCounts[c]++);
  pdf.text(`VFR: ${catCounts.VFR} | MVFR: ${catCounts.MVFR} | IFR: ${catCounts.IFR} | LIFR: ${catCounts.LIFR}`, 20, yPos);
  yPos += 6;

  // Trend summary
  const trendCounts = { improving: 0, stable: 0, deteriorating: 0 };
  waypointWeather.forEach(w => { if (w.trend) trendCounts[w.trend]++; });
  pdf.text(`Trends: \u2191${trendCounts.improving} Improving | \u2192${trendCounts.stable} Stable | \u2193${trendCounts.deteriorating} Deteriorating`, 20, yPos);
  yPos += 10;

  // Flight category strip visualization
  addHeader('2. FLIGHT CATEGORY STRIP');
  
  const stripWidth = 170;
  const segWidth = stripWidth / Math.max(1, waypointWeather.length);
  
  waypointWeather.forEach((wp, i) => {
    const color = CONDITION_COLORS[wp.weather.condition] || [107, 114, 128];
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(20 + i * segWidth, yPos, segWidth, 8, 'F');
    
    // Label
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(wp.weather.condition, 20 + i * segWidth + segWidth / 2 - 4, yPos + 5.5);
  });
  yPos += 10;

  // Waypoint labels below strip
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  waypointWeather.forEach((wp, i) => {
    pdf.text(wp.identifier, 20 + i * segWidth + 1, yPos + 3);
  });
  yPos += 12;

  // ================================================================
  // 3. WAYPOINT DETAILS TABLE
  // ================================================================
  addHeader('3. WAYPOINT WEATHER DETAILS');

  // Table header
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const cols = ['WPT', 'CAT', 'TREND', 'VIS', 'CEIL', 'WIND', 'TEMP/DP', 'FCST', 'WX'];
  const colX = [20, 38, 52, 72, 88, 105, 135, 160, 180];
  cols.forEach((col, i) => pdf.text(col, colX[i], yPos));
  yPos += 2;
  pdf.line(20, yPos, 195, yPos);
  yPos += 5;

  pdf.setFont('helvetica', 'normal');

  waypointWeather.forEach((wp) => {
    checkPage(8);
    const trendSymbol = wp.trend === 'improving' ? '\u2191' : wp.trend === 'deteriorating' ? '\u2193' : '\u2192';
    const windStr = `${String(wp.weather.windDirection).padStart(3, '0')}@${wp.weather.windSpeed}${wp.weather.windGust ? 'G' + wp.weather.windGust : ''}`;

    const rowData = [
      wp.identifier,
      wp.weather.condition,
      trendSymbol,
      `${wp.weather.visibility}SM`,
      wp.weather.ceiling ? `${wp.weather.ceiling}ft` : 'CLR',
      windStr,
      `${wp.weather.temperature}/${wp.weather.dewpoint}°C`,
      wp.forecast?.condition || '-',
      wp.weather.precipitation || '-',
    ];

    // Color the category cell
    const catColor = CONDITION_COLORS[wp.weather.condition];
    if (catColor) {
      pdf.setFillColor(catColor[0], catColor[1], catColor[2]);
      pdf.rect(colX[1] - 1, yPos - 3.5, 12, 4.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(rowData[1], colX[1], yPos);
      pdf.setTextColor(0, 0, 0);
    }

    rowData.forEach((val, i) => {
      if (i !== 1) pdf.text(val, colX[i], yPos);
    });
    yPos += 6;
  });

  yPos += 6;

  // ================================================================
  // 4. RAW METAR/TAF DATA
  // ================================================================
  if (metarTafData && metarTafData.length > 0) {
    addHeader('4. METAR/TAF DATA');

    metarTafData.forEach(station => {
      checkPage(25);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(station.icao, 20, yPos);
      if (station.flightCategory) {
        const catColor = CONDITION_COLORS[station.flightCategory] || [107, 114, 128];
        pdf.setFillColor(catColor[0], catColor[1], catColor[2]);
        pdf.rect(50, yPos - 3.5, 16, 5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(station.flightCategory, 52, yPos);
        pdf.setTextColor(0, 0, 0);
      }
      yPos += 6;

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);

      if (station.rawMetar) {
        const metarLines = pdf.splitTextToSize(`METAR: ${station.rawMetar}`, 170);
        metarLines.forEach((line: string) => {
          checkPage(5);
          pdf.text(line, 22, yPos);
          yPos += 4;
        });
      }

      if (station.rawTaf) {
        const tafLines = pdf.splitTextToSize(`TAF: ${station.rawTaf}`, 170);
        tafLines.forEach((line: string) => {
          checkPage(5);
          pdf.text(line, 22, yPos);
          yPos += 4;
        });
      }

      yPos += 4;
      pdf.setFont('helvetica', 'normal');
    });
  } else {
    // If no separate METAR/TAF data, show raw METARs from waypoint weather
    const rawMetars = waypointWeather.filter(w => w.weather.rawMetar);
    if (rawMetars.length > 0) {
      addHeader('4. RAW METAR DATA');
      rawMetars.forEach(wp => {
        checkPage(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(wp.identifier, 20, yPos);
        yPos += 5;
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        const lines = pdf.splitTextToSize(wp.weather.rawMetar || '', 170);
        lines.forEach((line: string) => {
          checkPage(5);
          pdf.text(line, 22, yPos);
          yPos += 4;
        });
        yPos += 3;
      });
    }
  }

  yPos += 4;

  // ================================================================
  // 5. VERTICAL PROFILE SUMMARY
  // ================================================================
  if (verticalData && verticalData.length > 0) {
    addHeader('5. VERTICAL PROFILE SUMMARY');

    pdf.setFontSize(8);
    pdf.text(`Cruise Altitude: FL${Math.floor(cruiseAltitude / 100)}`, 20, yPos);
    yPos += 6;

    // Table: waypoint vs altitude hazards at cruise level
    pdf.setFont('helvetica', 'bold');
    pdf.text('WPT', 20, yPos);
    pdf.text('DIST', 42, yPos);
    pdf.text('ICING', 62, yPos);
    pdf.text('TURB', 85, yPos);
    pdf.text('CLOUDS', 108, yPos);
    pdf.text('TEMP', 135, yPos);
    pdf.text('WIND', 155, yPos);
    yPos += 2;
    pdf.line(20, yPos, 190, yPos);
    yPos += 5;

    pdf.setFont('helvetica', 'normal');

    verticalData.forEach(slice => {
      checkPage(7);
      // Find the layer closest to cruise altitude
      const cruiseLayer = slice.layers.reduce((closest, layer) =>
        Math.abs(layer.altitude - cruiseAltitude) < Math.abs(closest.altitude - cruiseAltitude) ? layer : closest
      );

      pdf.text(slice.identifier, 20, yPos);
      pdf.text(`${slice.distanceNM} nm`, 42, yPos);

      // Color-code icing risk
      if (cruiseLayer.icingRisk !== 'none') {
        const riskColor: Record<string, [number, number, number]> = {
          light: [59, 130, 246], moderate: [245, 158, 11], severe: [239, 68, 68],
        };
        const c = riskColor[cruiseLayer.icingRisk] || [0, 0, 0];
        pdf.setTextColor(c[0], c[1], c[2]);
      }
      pdf.text(cruiseLayer.icingRisk.toUpperCase(), 62, yPos);
      pdf.setTextColor(0, 0, 0);

      if (cruiseLayer.turbulenceRisk !== 'none') {
        const riskColor: Record<string, [number, number, number]> = {
          light: [59, 130, 246], moderate: [245, 158, 11], severe: [239, 68, 68], extreme: [168, 85, 247],
        };
        const c = riskColor[cruiseLayer.turbulenceRisk] || [0, 0, 0];
        pdf.setTextColor(c[0], c[1], c[2]);
      }
      pdf.text(cruiseLayer.turbulenceRisk.toUpperCase(), 85, yPos);
      pdf.setTextColor(0, 0, 0);

      pdf.text(cruiseLayer.cloudCoverage.toUpperCase(), 108, yPos);
      pdf.text(`${cruiseLayer.temperature}°C`, 135, yPos);
      pdf.text(`${cruiseLayer.windDirection}°@${cruiseLayer.windSpeed}kt`, 155, yPos);
      yPos += 6;
    });

    yPos += 4;

    // Hazard summary
    const hasIcing = verticalData.some(s => s.layers.some(l => l.icingRisk === 'moderate' || l.icingRisk === 'severe'));
    const hasTurb = verticalData.some(s => s.layers.some(l => l.turbulenceRisk === 'moderate' || l.turbulenceRisk === 'severe' || l.turbulenceRisk === 'extreme'));

    if (hasIcing || hasTurb) {
      checkPage(15);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(245, 158, 11);
      pdf.text('HAZARD ALERTS:', 20, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);

      if (hasIcing) {
        pdf.text('\u2744 Moderate/Severe icing reported along route. Check freezing levels.', 22, yPos);
        yPos += 5;
      }
      if (hasTurb) {
        pdf.text('\uD83D\uDCA8 Significant turbulence at some flight levels. Consider altitude changes.', 22, yPos);
        yPos += 5;
      }
      yPos += 3;
    }
  }

  // ================================================================
  // 6. TFRs & ADVISORIES
  // ================================================================
  if (tfrs.length > 0) {
    addHeader('6. ACTIVE TFRs');
    pdf.setFontSize(8);
    tfrs.forEach(tfr => {
      checkPage(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${tfr.notamNumber} - ${tfr.type}`, 20, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Alt: ${tfr.altitude}`, 22, yPos);
      yPos += 4;
      const descLines = pdf.splitTextToSize(tfr.description, 165);
      descLines.forEach((line: string) => { checkPage(5); pdf.text(line, 22, yPos); yPos += 4; });
      pdf.text(`Valid: ${new Date(tfr.effectiveStart).toLocaleString()} - ${new Date(tfr.effectiveEnd).toLocaleString()}`, 22, yPos);
      yPos += 7;
    });
  }

  if (advisories.length > 0) {
    addHeader('7. AIRMETs/SIGMETs');
    pdf.setFontSize(8);
    advisories.forEach(adv => {
      checkPage(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${adv.type} - ${adv.hazard}`, 20, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(adv.description, 170);
      lines.forEach((line: string) => { checkPage(5); pdf.text(line, 22, yPos); yPos += 4; });
      pdf.text(`Valid: ${new Date(adv.validFrom).toLocaleTimeString()} - ${new Date(adv.validTo).toLocaleTimeString()}`, 22, yPos);
      yPos += 7;
    });
  }

  // ================================================================
  // DISCLAIMER
  // ================================================================
  pdf.addPage();
  yPos = 20;
  addHeader('PILOT BRIEFING NOTES');

  pdf.setFontSize(9);
  const notes = [
    '\u2022 This briefing is for flight planning purposes only.',
    '\u2022 Always obtain an official weather briefing from an approved source (1800WXBRIEF).',
    '\u2022 Check NOTAMs for your route of flight.',
    '\u2022 Weather conditions may change rapidly. Monitor conditions throughout flight.',
    '\u2022 Verify TFR information with official FAA sources.',
    '\u2022 This briefing does not replace pilot-in-command decision making.',
  ];
  notes.forEach(note => { pdf.text(note, 20, yPos); yPos += 6; });

  yPos += 8;
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Flight Category Definitions:', 20, yPos); yPos += 5;
  pdf.text('VFR: Ceiling > 3000 ft AGL and Visibility > 5 SM', 25, yPos); yPos += 4;
  pdf.text('MVFR: Ceiling 1000-3000 ft AGL and/or Visibility 3-5 SM', 25, yPos); yPos += 4;
  pdf.text('IFR: Ceiling 500-1000 ft AGL and/or Visibility 1-3 SM', 25, yPos); yPos += 4;
  pdf.text('LIFR: Ceiling < 500 ft AGL and/or Visibility < 1 SM', 25, yPos);

  // Save
  const filename = `weather-briefing-${now.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  return filename;
};
