import { Location, Coordinate } from '../types';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface LegStats {
  distanceKm: number;
  durationMinutes: number;
  geometry: Coordinate[];
}

const haversineDistance = (coords: Coordinate[]): number => {
  if (coords.length < 2) return 0;
  let dist = 0;
  const R = 6371; // Radius of the earth in km
  for (let i = 0; i < coords.length - 1; i++) {
    const lat1 = coords[i].lat * (Math.PI / 180);
    const lon1 = coords[i].lng * (Math.PI / 180);
    const lat2 = coords[i + 1].lat * (Math.PI / 180);
    const lon2 = coords[i + 1].lng * (Math.PI / 180);
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    dist += R * c;
  }
  return dist;
};

export const getRouteForPath = async (locations: Location[]): Promise<LegStats> => {
  if (locations.length < 2) {
    return { distanceKm: 0, durationMinutes: 0, geometry: [] };
  }

  // Format coordinates: lng,lat;lng,lat
  const coordString = locations.map(l => `${l.lng},${l.lat}`).join(';');
  
  try {
    const response = await fetch(`${OSRM_BASE_URL}/${coordString}?overview=full&geometries=geojson`);
    
    if (!response.ok) {
        throw new Error(`OSRM API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
    }

    const route = data.routes[0];
    
    // OSRM returns geometry as [lng, lat], we need [lat, lng] for Leaflet
    const geometry: Coordinate[] = route.geometry.coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0]
    }));

    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      geometry
    };
  } catch (error) {
    console.warn("Routing failed, falling back to straight lines", error);
    
    // Fallback: Straight lines and Haversine distance
    const simpleGeometry = locations.map(l => ({ lat: l.lat, lng: l.lng }));
    const dist = haversineDistance(simpleGeometry);
    
    return {
      distanceKm: dist,
      durationMinutes: dist * 2, // Rough estimate: 30km/h => 2 min per km
      geometry: simpleGeometry
    };
  }
};