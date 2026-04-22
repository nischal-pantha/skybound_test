// TAF (Terminal Aerodrome Forecast) parser

export interface TafForecastGroup {
  type: 'BASE' | 'FM' | 'TEMPO' | 'BECMG' | 'PROB';
  probability?: number;
  fromTime: string;
  toTime: string;
  windDir: number;
  windSpeed: number;
  windGust: number | null;
  visibility: number;
  ceiling: number | null;
  clouds: string;
  wx: string;
  condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  raw: string;
}

export interface ParsedTaf {
  icao: string;
  issuedTime: string;
  validFrom: string;
  validTo: string;
  groups: TafForecastGroup[];
  rawTaf: string;
  amendment: boolean;
}

function categorize(visSM: number, ceilingFt: number | null): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  const ceil = ceilingFt ?? 99999;
  if (visSM < 1 || ceil < 500) return 'LIFR';
  if (visSM < 3 || ceil < 1000) return 'IFR';
  if (visSM <= 5 || ceil <= 3000) return 'MVFR';
  return 'VFR';
}

function parseVisibility(text: string): number {
  const smMatch = text.match(/\b(\d+)\s*SM\b/);
  const fracMatch = text.match(/\b(\d+\/\d+)\s*SM\b/);
  const p6Match = text.match(/\bP6SM\b/);
  if (p6Match) return 7;
  if (smMatch) return parseInt(smMatch[1]);
  if (fracMatch) {
    const parts = fracMatch[1].split('/');
    return parseInt(parts[0]) / parseInt(parts[1]);
  }
  // Meters to SM
  const mMatch = text.match(/\b(\d{4})\b/);
  if (mMatch) {
    const meters = parseInt(mMatch[1]);
    if (meters >= 1000 && meters <= 9999) return Math.round((meters / 1609.34) * 10) / 10;
  }
  return 10;
}

function parseCeiling(text: string): number | null {
  const matches = text.match(/\b(?:BKN|OVC|VV)(\d{3})\b/g);
  if (!matches) return null;
  let lowest: number | null = null;
  for (const m of matches) {
    const h = parseInt(m.replace(/[A-Z]+/, '')) * 100;
    if (lowest === null || h < lowest) lowest = h;
  }
  return lowest;
}

function parseClouds(text: string): string {
  const cloudMatch = text.match(/\b(CLR|SKC|FEW\d{3}|SCT\d{3}|BKN\d{3}|OVC\d{3}|VV\d{3})\b/);
  return cloudMatch ? cloudMatch[1] : 'SKC';
}

function parseWind(text: string): { dir: number; speed: number; gust: number | null } {
  const windMatch = text.match(/\b(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT\b/);
  if (!windMatch) return { dir: 0, speed: 0, gust: null };
  return {
    dir: windMatch[1] === 'VRB' ? 0 : parseInt(windMatch[1]),
    speed: parseInt(windMatch[2]),
    gust: windMatch[3] ? parseInt(windMatch[3]) : null,
  };
}

function parseWx(text: string): string {
  const wxPatterns = text.match(/\b(\+?-?(?:RA|SN|TS|FG|BR|HZ|DZ|SH|GR|PL|SQ|FC|VA|SA|DU|FU|SS|DS|PE|GS|UP|TSRA|TSSN|FZRA|FZDZ|FZFG|BLSN|BLSA|BLDU)+)\b/g);
  return wxPatterns ? wxPatterns.join(' ') : '';
}

function parseTafTime(ddhhmmStr: string, refYear: number, refMonth: number): string {
  const dd = parseInt(ddhhmmStr.substring(0, 2));
  const hh = parseInt(ddhhmmStr.substring(2, 4));
  const mm = ddhhmmStr.length >= 6 ? parseInt(ddhhmmStr.substring(4, 6)) : 0;
  const d = new Date(Date.UTC(refYear, refMonth - 1, dd, hh, mm));
  return d.toISOString();
}

export function parseTaf(rawTaf: string): ParsedTaf | null {
  if (!rawTaf || rawTaf.trim().length < 10) return null;

  const clean = rawTaf.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const amendment = /\bAMD\b/.test(clean);

  // Extract ICAO
  const icaoMatch = clean.match(/\b([A-Z]{4})\b/);
  const icao = icaoMatch ? icaoMatch[1] : 'UNKN';

  // Extract validity period DDhh/DDhh
  const validMatch = clean.match(/\b(\d{4})\/(\d{4})\b/);
  const now = new Date();
  const refYear = now.getUTCFullYear();
  const refMonth = now.getUTCMonth() + 1;

  const validFrom = validMatch ? parseTafTime(validMatch[1] + '00', refYear, refMonth) : now.toISOString();
  const validTo = validMatch ? parseTafTime(validMatch[2] + '00', refYear, refMonth) : now.toISOString();

  // Extract issued time
  const issuedMatch = clean.match(/\b(\d{6})Z\b/);
  const issuedTime = issuedMatch ? parseTafTime(issuedMatch[1], refYear, refMonth) : now.toISOString();

  const groups: TafForecastGroup[] = [];

  // Split into forecast groups by FM, TEMPO, BECMG, PROB
  const groupPattern = /\b(FM\d{6}|TEMPO|BECMG|PROB\d{2}\s*(?:TEMPO)?)\b/g;
  const splits: { idx: number; type: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = groupPattern.exec(clean)) !== null) {
    splits.push({ idx: match.index, type: match[1] });
  }

  // Base forecast (everything before first FM/TEMPO/BECMG)
  const baseEnd = splits.length > 0 ? splits[0].idx : clean.length;
  const baseText = clean.substring(0, baseEnd);
  const baseWind = parseWind(baseText);
  const baseVis = parseVisibility(baseText);
  const baseCeil = parseCeiling(baseText);

  groups.push({
    type: 'BASE',
    fromTime: validFrom,
    toTime: splits.length > 0 ? parseTafTime(splits[0].type.replace('FM', '') + (splits[0].type.startsWith('FM') ? '' : '00'), refYear, refMonth) : validTo,
    windDir: baseWind.dir,
    windSpeed: baseWind.speed,
    windGust: baseWind.gust,
    visibility: baseVis,
    ceiling: baseCeil,
    clouds: parseClouds(baseText),
    wx: parseWx(baseText),
    condition: categorize(baseVis, baseCeil),
    raw: baseText.trim(),
  });

  // Parse each subsequent group
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].idx;
    const end = i + 1 < splits.length ? splits[i + 1].idx : clean.length;
    const groupText = clean.substring(start, end).trim();
    const typeStr = splits[i].type;

    let groupType: TafForecastGroup['type'] = 'FM';
    let probability: number | undefined;

    if (typeStr.startsWith('FM')) {
      groupType = 'FM';
    } else if (typeStr.startsWith('PROB')) {
      groupType = 'PROB';
      const probMatch = typeStr.match(/PROB(\d{2})/);
      probability = probMatch ? parseInt(probMatch[1]) : undefined;
    } else if (typeStr === 'TEMPO') {
      groupType = 'TEMPO';
    } else if (typeStr === 'BECMG') {
      groupType = 'BECMG';
    }

    const gWind = parseWind(groupText);
    const gVis = parseVisibility(groupText);
    const gCeil = parseCeiling(groupText);

    // Time for FM groups
    let fromTime = validFrom;
    let toTime = validTo;
    if (typeStr.startsWith('FM')) {
      const fmTime = typeStr.replace('FM', '');
      fromTime = parseTafTime(fmTime, refYear, refMonth);
      toTime = i + 1 < splits.length && splits[i + 1].type.startsWith('FM')
        ? parseTafTime(splits[i + 1].type.replace('FM', ''), refYear, refMonth)
        : validTo;
    }

    // Time for TEMPO/BECMG DDhh/DDhh within group
    const periodMatch = groupText.match(/\b(\d{4})\/(\d{4})\b/);
    if (periodMatch) {
      fromTime = parseTafTime(periodMatch[1] + '00', refYear, refMonth);
      toTime = parseTafTime(periodMatch[2] + '00', refYear, refMonth);
    }

    groups.push({
      type: groupType,
      probability,
      fromTime,
      toTime,
      windDir: gWind.dir,
      windSpeed: gWind.speed,
      windGust: gWind.gust,
      visibility: gVis,
      ceiling: gCeil,
      clouds: parseClouds(groupText),
      wx: parseWx(groupText),
      condition: categorize(gVis, gCeil),
      raw: groupText,
    });
  }

  return {
    icao,
    issuedTime,
    validFrom,
    validTo,
    groups,
    rawTaf: rawTaf.trim(),
    amendment,
  };
}

export function formatTafTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  } catch {
    return iso;
  }
}
