// OpenSky Network API
// Pros: Completely free for non-commercial use, provides real-time state vectors (position, altitude, velocity).
// Cons: Only provides current aircraft states (no flight numbers, schedules, or origin/destination info out of the box), rate limited heavily for unauthenticated users.
export const fetchOpenSkyFlights = async (boundingBox?: { lamin: number, lomin: number, lamax: number, lomax: number }) => {
  try {
    let url = 'https://opensky-network.org/api/states/all';
    
    // Add bounding box if provided (highly recommended to avoid downloading the entire world's data)
    if (boundingBox) {
      url += `?lamin=${boundingBox.lamin}&lomin=${boundingBox.lomin}&lamax=${boundingBox.lamax}&lomax=${boundingBox.lomax}`;
    }

    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('OpenSky API error');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching OpenSky data:', error);
    return null;
  }
};


// Aviationstack API
// Pros: Provides comprehensive data including flight status, origin, destination, and airline info.
// Cons: The FREE tier does NOT support HTTPS encryption. This means if your app is hosted on Vercel (https), 
//       browser security (Mixed Content) will block requests to their free HTTP endpoint.
export const fetchAviationStackFlights = async (apiKey: string) => {
  try {
    // Note: The free tier requires 'http://', not 'https://'
    const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}`);
    if (!response.ok) throw new Error('Aviationstack API error');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Aviationstack data:', error);
    return null;
  }
};


// AirLabs API
// Pros: Supports HTTPS on the free tier! Provides real-time flights, schedules, and routing. 
//       Offers 1000 free requests per month. Good balance of flight status + live tracking.
// Cons: Strict monthly limits, not entirely open-source like OpenSky.
export const fetchAirLabsFlights = async (apiKey: string, boundingBox?: { bbox: string }) => {
  try {
    let url = `https://airlabs.co/api/v9/flights?api_key=${apiKey}`;
    
    if (boundingBox) {
      // bbox format: lat_min,lng_min,lat_max,lng_max
      url += `&bbox=${boundingBox.bbox}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('AirLabs API error');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AirLabs data:', error);
    return null;
  }
};
