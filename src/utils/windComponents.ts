// Wind component calculations for aviation

export interface WindComponents {
  headwind: number;    // positive = headwind, negative = tailwind
  crosswind: number;   // positive = from right, negative = from left
  crosswindAbs: number;
  crosswindDir: 'L' | 'R' | '';
  headwindLabel: string;
  crosswindLabel: string;
}

// Comprehensive runway headings for US airports (magnetic heading)
const RUNWAY_DATA: Record<string, number[]> = {
  // === Major Hubs ===
  'KSFO': [280, 100, 10, 190],
  'KLAX': [249, 69, 250, 70],
  'KJFK': [40, 220, 130, 310],
  'KORD': [100, 280, 45, 225, 148, 328],
  'KATL': [90, 270, 100, 280, 80, 260],
  'KDEN': [170, 350, 70, 250, 80, 260, 160, 340],
  'KDFW': [179, 359, 130, 310, 170, 350],
  'KMIA': [90, 270, 120, 300, 80, 260],
  'KBOS': [40, 220, 90, 270, 150, 330],
  'KSEA': [160, 340, 163, 343],
  'KPHX': [80, 260, 76, 256],
  'KMSP': [120, 300, 40, 220, 170, 350],
  'KDTW': [40, 220, 39, 219, 270, 90],
  'KLAS': [10, 190, 70, 250],
  'KSAN': [270, 90],
  'KSNA': [198, 18],
  'KSJC': [120, 300],
  'KOAK': [120, 300, 280, 100],
  'KSMF': [160, 340, 40, 220],
  'KPDX': [100, 280, 210, 30],

  // === Large US Airports ===
  'KMCO': [170, 350, 180, 360],
  'KFLL': [100, 280, 90, 270],
  'KTPA': [10, 190, 190, 10],
  'KIAD': [10, 190, 120, 300],
  'KDCA': [10, 190, 40, 220, 330, 150],
  'KBWI': [100, 280, 150, 330],
  'KEWR': [40, 220, 110, 290],
  'KLGA': [40, 220, 130, 310],
  'KPHL': [90, 270, 170, 350, 80, 260],
  'KCLT': [180, 360, 230, 50, 360, 180],
  'KRDU': [50, 230, 140, 320],
  'KPIT': [100, 280, 320, 140],
  'KCLE': [60, 240, 100, 280, 240, 60],
  'KCMH': [100, 280, 280, 100],
  'KIND': [50, 230, 140, 320, 230, 50],
  'KSTL': [120, 300, 60, 240, 110, 290],
  'KMCI': [10, 190, 90, 270],
  'KMKE': [10, 190, 70, 250, 130, 310],
  'KMDW': [40, 220, 130, 310, 310, 130],
  'KAUS': [170, 350, 180, 360],
  'KSAT': [120, 300, 30, 210],
  'KIAH': [90, 270, 150, 330, 80, 260],
  'KHOU': [40, 220, 130, 310, 350, 170],
  'KMSY': [10, 190, 110, 290, 20, 200],
  'KBNA': [20, 200, 130, 310],
  'KMEM': [180, 360, 90, 270, 270, 90],
  'KSLC': [160, 340, 170, 350, 140, 320],
  'KABQ': [30, 210, 80, 260, 170, 350],
  'KTUS': [110, 290, 30, 210, 120, 300],
  'KONT': [260, 80, 80, 260],
  'KBUR': [150, 330, 80, 260],
  'KLGB': [120, 300, 250, 70],
  'PANC': [70, 250, 150, 330, 320, 140],
  'PHNL': [40, 220, 80, 260, 86, 266],

  // === Flight Training / GA Airports ===
  'KPAO': [310, 130],
  'KSQL': [300, 120],
  'KHAF': [120, 300],
  'KLVK': [250, 70, 70, 250],
  'KCCR': [190, 10, 320, 140],
  'KRHV': [310, 130, 130, 310],
  'KWVI': [200, 20, 80, 260],
  'KFUL': [240, 60],
  'KTOA': [290, 110, 200, 20],
  'KVNY': [160, 340],
  'KSMO': [210, 30],
  'KHHR': [250, 70],
  'KCMA': [260, 80, 80, 260],
  'KOXR': [250, 70, 70, 250],
  'KSBA': [70, 250, 150, 330],
  'KCRQ': [240, 60],
  'KSDM': [260, 80],
  'KSEE': [270, 90, 170, 350],
  'KMYF': [280, 100, 100, 280],
  'KFFZ': [50, 230, 230, 50],
  'KIWA': [120, 300, 300, 120],
  'KDVT': [70, 250, 250, 70],
  'KCHD': [40, 220, 220, 40],
  'KAPA': [170, 350, 100, 280],
  'KBJC': [120, 300, 30, 210],
  'KFTG': [170, 350, 80, 260],
  'KFNL': [150, 330, 60, 240],
  'KCOS': [170, 350, 130, 310, 250, 70],
  'KOSH': [180, 360, 90, 270, 270, 90],
  'KPWK': [160, 340, 300, 120],
  'KDPA': [100, 280, 20, 200],
  'KARR': [90, 270, 180, 360],
  'KUGN': [50, 230, 320, 140],
  'KFRG': [10, 190, 140, 320, 320, 140],
  'KISP': [60, 240, 150, 330, 240, 60],
  'KHPN': [160, 340, 110, 290],
  'KTEB': [10, 190, 60, 240],
  'KCDW': [40, 220, 100, 280],
  'KMMV': [220, 40, 310, 130],
  'KBED': [290, 110, 110, 290, 200, 20],
  'KORL': [70, 250, 130, 310],
  'KAPF': [50, 230, 140, 320],
  'KPBI': [100, 280, 140, 320, 280, 100],
  'KTMB': [90, 270, 180, 360],
  'KOPF': [120, 300, 90, 270],
  'KVGT': [120, 300, 70, 250],
  'KHND': [170, 350, 350, 170],
  'KBFI': [140, 320, 320, 140],
  'KPAE': [160, 340, 280, 100],
  'KRNT': [150, 330, 330, 150],
  'KTIW': [170, 350, 350, 170],
  'KHIO': [130, 310, 200, 20, 310, 130],
  'KTTD': [70, 250, 250, 70],
};

// Aircraft-specific maximum demonstrated crosswind limits (in knots)
// Based on POH / manufacturer data
export const CROSSWIND_LIMITS: Record<string, number> = {
  // Cessna
  'Cessna 150': 12,
  'Cessna 152': 12,
  'Cessna 172': 15,
  'C172': 15,
  'Cessna 172 Skyhawk': 15,
  'Cessna 172S': 15,
  'Cessna 182': 15,
  'C182': 15,
  'Cessna 182 Skylane': 15,
  'Cessna 206': 16,
  'Cessna 210': 16,
  'Cessna 310': 17,
  'Cessna Citation CJ3': 22,

  // Piper
  'Piper Cherokee': 17,
  'PA-28': 17,
  'Piper PA-28-161': 17,
  'Piper Warrior': 17,
  'Piper Archer': 17,
  'PA-28-181': 17,
  'Piper Arrow': 17,
  'PA-28R': 17,
  'Piper Seminole': 17,
  'PA-44': 17,
  'Piper Seneca': 17,
  'PA-34': 17,
  'Piper Saratoga': 17,
  'PA-32': 17,
  'Piper Comanche': 17,
  'Piper Lance': 17,

  // Beechcraft
  'Beechcraft Bonanza': 17,
  'Beech Bonanza': 17,
  'A36 Bonanza': 17,
  'Beechcraft Baron': 20,
  'Beech Baron': 20,
  'BE58': 20,
  'Beechcraft King Air': 22,
  'King Air 200': 22,
  'King Air 350': 22,

  // Cirrus
  'Cirrus SR20': 15,
  'SR20': 15,
  'Cirrus SR22': 15,
  'SR22': 15,
  'Cirrus SR22T': 15,
  'SF50': 20,
  'Cirrus Vision Jet': 20,

  // Diamond
  'Diamond DA20': 15,
  'DA20': 15,
  'Diamond DA40': 15,
  'DA40': 15,
  'Diamond DA42': 20,
  'DA42': 20,
  'Diamond DA62': 20,
  'DA62': 20,

  // Mooney
  'Mooney M20': 15,
  'M20': 15,
  'Mooney Ovation': 15,
  'Mooney Acclaim': 15,

  // Grumman / American General
  'Grumman Tiger': 14,
  'AA-5': 14,

  // Airlines / Jets (for airline pilot feature)
  'Boeing 737': 33,
  'B737': 33,
  'Boeing 737-800': 33,
  'Boeing 747': 30,
  'B747': 30,
  'Boeing 757': 33,
  'B757': 33,
  'Boeing 767': 33,
  'B767': 33,
  'Boeing 777': 38,
  'B777': 38,
  'Boeing 787': 38,
  'B787': 38,
  'Airbus A320': 33,
  'A320': 33,
  'A320neo': 33,
  'Airbus A319': 33,
  'A319': 33,
  'Airbus A321': 33,
  'A321': 33,
  'Airbus A330': 33,
  'A330': 33,
  'Airbus A350': 35,
  'A350': 35,
  'Embraer E175': 30,
  'ERJ-175': 30,
  'Embraer E190': 30,
  'CRJ-200': 25,
  'CRJ-700': 27,
  'CRJ-900': 27,
};

// Default crosswind limit when aircraft is unknown
export const DEFAULT_CROSSWIND_LIMIT = 15;

/**
 * Look up crosswind limit for an aircraft name.
 * Performs fuzzy matching.
 */
export function getCrosswindLimit(aircraftName: string): { limit: number; isDefault: boolean } {
  if (!aircraftName) return { limit: DEFAULT_CROSSWIND_LIMIT, isDefault: true };

  const upper = aircraftName.toUpperCase().trim();

  // Exact match
  for (const [key, val] of Object.entries(CROSSWIND_LIMITS)) {
    if (key.toUpperCase() === upper) return { limit: val, isDefault: false };
  }

  // Partial match
  for (const [key, val] of Object.entries(CROSSWIND_LIMITS)) {
    if (upper.includes(key.toUpperCase()) || key.toUpperCase().includes(upper)) {
      return { limit: val, isDefault: false };
    }
  }

  return { limit: DEFAULT_CROSSWIND_LIMIT, isDefault: true };
}

/**
 * Get runway headings for an airport.
 */
export function getRunwayHeadings(icao: string): number[] {
  const upper = icao.toUpperCase();
  return RUNWAY_DATA[upper] || [];
}

/**
 * Calculate headwind and crosswind components.
 */
export function calculateWindComponents(windDir: number, windSpeed: number, runwayHeading: number): WindComponents {
  if (windSpeed === 0) {
    return {
      headwind: 0,
      crosswind: 0,
      crosswindAbs: 0,
      crosswindDir: '',
      headwindLabel: 'Calm',
      crosswindLabel: 'Calm',
    };
  }

  const angleDiff = ((windDir - runwayHeading + 360) % 360);
  const angleRad = angleDiff * (Math.PI / 180);

  const headwind = Math.round(windSpeed * Math.cos(angleRad));
  const crosswind = Math.round(windSpeed * Math.sin(angleRad));

  const crosswindAbs = Math.abs(crosswind);
  const crosswindDir: 'L' | 'R' | '' = crosswind > 0 ? 'R' : crosswind < 0 ? 'L' : '';

  const headwindLabel = headwind >= 0
    ? `${headwind}kt headwind`
    : `${Math.abs(headwind)}kt tailwind`;

  const crosswindLabel = crosswindAbs > 0
    ? `${crosswindAbs}kt from ${crosswindDir}`
    : 'None';

  return { headwind, crosswind, crosswindAbs, crosswindDir, headwindLabel, crosswindLabel };
}

/**
 * Find the best (most favorable) runway for given wind conditions.
 */
export function findBestRunway(windDir: number, windSpeed: number, runways: number[]): { heading: number; components: WindComponents; runway: string } | null {
  if (runways.length === 0 || windSpeed === 0) return null;

  let best: { heading: number; components: WindComponents; runway: string } | null = null;
  let bestScore = -Infinity;

  for (const rwy of runways) {
    const comp = calculateWindComponents(windDir, windSpeed, rwy);
    const score = comp.headwind - comp.crosswindAbs * 1.5;
    if (score > bestScore) {
      bestScore = score;
      const rwyNum = Math.round(rwy / 10).toString().padStart(2, '0');
      best = { heading: rwy, components: comp, runway: `RWY ${rwyNum}` };
    }
  }

  return best;
}

/**
 * Format runway number from heading.
 */
export function headingToRunway(heading: number): string {
  return Math.round(heading / 10).toString().padStart(2, '0');
}

export interface CrosswindWarning {
  identifier: string;
  runway: string;
  crosswindAbs: number;
  crosswindDir: 'L' | 'R' | '';
  limit: number;
  exceeded: boolean;
  percentage: number; // % of limit used
  severity: 'safe' | 'caution' | 'warning' | 'exceeded';
}

/**
 * Evaluate crosswind warnings for a set of waypoints with wind data.
 */
export function evaluateCrosswindWarnings(
  waypoints: Array<{ identifier: string; windDir: number; windSpeed: number }>,
  aircraftName: string
): CrosswindWarning[] {
  const { limit } = getCrosswindLimit(aircraftName);
  const warnings: CrosswindWarning[] = [];

  for (const wp of waypoints) {
    const runways = getRunwayHeadings(wp.identifier);
    if (runways.length === 0 || wp.windSpeed === 0) continue;

    const best = findBestRunway(wp.windDir, wp.windSpeed, runways);
    if (!best) continue;

    const percentage = Math.round((best.components.crosswindAbs / limit) * 100);
    let severity: CrosswindWarning['severity'] = 'safe';
    if (percentage >= 100) severity = 'exceeded';
    else if (percentage >= 85) severity = 'warning';
    else if (percentage >= 65) severity = 'caution';

    warnings.push({
      identifier: wp.identifier,
      runway: best.runway,
      crosswindAbs: best.components.crosswindAbs,
      crosswindDir: best.components.crosswindDir,
      limit,
      exceeded: percentage >= 100,
      percentage,
      severity,
    });
  }

  return warnings;
}
