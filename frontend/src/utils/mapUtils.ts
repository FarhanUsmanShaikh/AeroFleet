import type { LatLng } from '../../../shared/types';

/**
 * Calculate the distance between two points using Haversine formula
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLng = toRadians(point2.longitude - point1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(coordinates: LatLng[]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to square meters (approximate)
  const metersPerDegree = 111320; // at equator
  return area * metersPerDegree * metersPerDegree;
}

/**
 * Calculate the center point of a polygon
 */
export function calculatePolygonCenter(coordinates: LatLng[]): LatLng {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  
  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude
    }),
    { latitude: 0, longitude: 0 }
  );
  
  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length
  };
}

/**
 * Calculate bounds of a set of coordinates
 */
export function calculateBounds(coordinates: LatLng[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  
  let north = -90, south = 90, east = -180, west = 180;
  
  coordinates.forEach(coord => {
    north = Math.max(north, coord.latitude);
    south = Math.min(south, coord.latitude);
    east = Math.max(east, coord.longitude);
    west = Math.min(west, coord.longitude);
  });
  
  return { north, south, east, west };
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    
    if (((yi > point.latitude) !== (yj > point.latitude)) &&
        (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Format coordinates for display
 */
export function formatCoordinate(value: number, type: 'lat' | 'lng'): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees) * 60 - minutes) * 60;
  
  const direction = type === 'lat' 
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  
  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}

/**
 * Format area for display
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)}m²`;
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)}ha`;
  } else {
    return `${(squareMeters / 1000000).toFixed(2)}km²`;
  }
}

/**
 * Default map center (San Francisco)
 */
export const DEFAULT_MAP_CENTER: [number, number] = [37.7749, -122.4194];

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 13;