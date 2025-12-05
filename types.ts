export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Location extends Coordinate {
  id: string;
  type: 'depot' | 'job';
  name: string;
}

export interface RouteStats {
  totalDistanceKm: number;
  totalTimeMinutes: number;
  estimatedFuelCost: number;
}

export interface RoutePlan {
  truckId: number;
  path: Location[]; // Ordered list of locations to visit (stops)
  geometry: Coordinate[]; // The actual road path points
  color: string;
}

export interface OptimizationResult {
  naive: {
    stats: RouteStats;
    routes: RoutePlan[];
  };
  optimized: {
    stats: RouteStats;
    routes: RoutePlan[];
  };
  savings: {
    distanceSavedKm: number;
    timeSavedMinutes: number;
    moneySaved: number;
    percentImprovement: number;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  OPTIMIZING = 'OPTIMIZING',
  RESULTS = 'RESULTS',
}