/**
 * Aviation input validation utilities
 * These functions validate user inputs before making API calls
 */

// Strict ICAO airport code validation (4 uppercase letters)
const ICAO_REGEX = /^[A-Z]{4}$/;

/**
 * Validates an ICAO airport code format
 * @param code - The ICAO code to validate
 * @returns true if valid 4-letter ICAO code
 */
export const validateICAO = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  return ICAO_REGEX.test(code.toUpperCase().trim());
};

/**
 * Sanitizes and normalizes an ICAO code
 * @param code - The ICAO code to sanitize
 * @returns Uppercase trimmed ICAO code or null if invalid
 */
export const sanitizeICAO = (code: string): string | null => {
  if (!code || typeof code !== 'string') return null;
  const sanitized = code.toUpperCase().trim();
  return validateICAO(sanitized) ? sanitized : null;
};

/**
 * Validates geographic coordinates
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns true if coordinates are valid
 */
export const validateCoordinates = (lat: number, lon: number): boolean => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * Validates a bounding box string format
 * @param bbox - Bounding box in format "west,south,east,north"
 * @returns true if valid bbox format with valid coordinates
 */
export const validateBbox = (bbox: string): boolean => {
  if (!bbox || typeof bbox !== 'string') return false;
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [west, south, east, north] = parts;
  return (
    validateCoordinates(south, west) &&
    validateCoordinates(north, east) &&
    south <= north
  );
};

/**
 * Validates weather data type parameter
 * @param type - The weather type ('metar' or 'taf')
 * @returns true if valid weather type
 */
export const validateWeatherType = (type: string): boolean => {
  return type === 'metar' || type === 'taf';
};

/**
 * Sanitizes a string for safe use in URLs
 * @param input - The string to sanitize
 * @returns URL-safe encoded string
 */
export const sanitizeForUrl = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return encodeURIComponent(input.trim());
};

/**
 * Validates a region parameter for winds aloft API
 * @param region - The region string
 * @returns true if valid region
 */
export const validateRegion = (region: string): boolean => {
  const validRegions = ['all', 'bos', 'mia', 'chi', 'dfw', 'slc', 'sfo', 'alaska', 'hawaii', 'other_pac'];
  return validRegions.includes(region.toLowerCase());
};
