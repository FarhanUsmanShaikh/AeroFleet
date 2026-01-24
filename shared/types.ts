// Shared TypeScript interfaces for Drone Survey Management System

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Polygon {
  coordinates: LatLng[];
  area: number; // in square meters
}

export interface SensorConfig {
  type: 'CAMERA' | 'LIDAR' | 'THERMAL';
  frequency: number; // captures per second
  resolution: string;
}

export type MissionStatus = 'PLANNED' | 'STARTING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABORTED';
export type DroneStatus = 'AVAILABLE' | 'IN_MISSION' | 'MAINTENANCE';
export type MissionPattern = 'GRID' | 'CROSSHATCH' | 'PERIMETER';
export type WaypointAction = 'FLY_TO' | 'HOVER' | 'LAND';
export type MissionAction = 'START' | 'PAUSE' | 'RESUME' | 'ABORT';

export interface Waypoint {
  id: string;
  missionId: string;
  sequenceNumber: number;
  latitude: number;
  longitude: number;
  altitude: number;
  action: WaypointAction;
  completed: boolean;
  completedAt?: Date;
}

export interface Drone {
  id: string;
  name: string;
  model: string;
  status: DroneStatus;
  batteryLevel: number;
  currentLocation: LatLng;
  maxFlightTime: number; // in seconds
  maxSpeed: number; // in m/s
  lastUpdated: Date;
}

export interface MissionConfig {
  name: string;
  droneId: string;
  surveyArea: Polygon;
  pattern: MissionPattern;
  altitude: number;
  overlapPercentage: number;
  sensorSettings: SensorConfig;
}

export interface Mission {
  id: string;
  name: string;
  droneId: string;
  status: MissionStatus;
  pattern: MissionPattern;
  altitude: number;
  overlapPercentage: number;
  surveyArea: Polygon;
  totalWaypoints: number;
  currentWaypointIndex: number;
  progress: number; // percentage
  estimatedDuration: number; // in seconds
  actualDuration?: number; // in seconds
  distanceCovered: number; // in meters
  estimatedTimeRemaining: number; // in seconds
  drone?: Drone;
  waypoints?: Waypoint[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface MissionReport {
  id: string;
  missionId: string;
  totalFlightDuration: number; // in seconds
  distanceCovered: number; // in meters
  coveragePercentage: number;
  finalStatus: 'COMPLETED' | 'ABORTED';
  abortReason?: string;
  waypointsCompleted: number;
  batteryConsumed: number; // percentage
  generatedAt: Date;
}

export interface ValidationRules {
  altitude: { min: number; max: number }; // meters
  overlapPercentage: { min: number; max: number }; // percentage
  polygonMinPoints: number;
  polygonMaxPoints: number;
  missionNameMaxLength: number;
  batteryMinLevel: number; // percentage for safety abort
}

// WebSocket event types
export interface MissionUpdate {
  missionId: string;
  status: MissionStatus;
  progress: number;
  currentWaypointIndex: number;
  estimatedTimeRemaining: number;
  batteryLevel: number;
  dronePosition: LatLng;
}

export interface FleetUpdate {
  droneId: string;
  status: DroneStatus;
  batteryLevel: number;
  currentLocation: LatLng;
  lastUpdated: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search types
export interface DroneFilter {
  status?: DroneStatus;
  model?: string;
  location?: string;
}

export interface MissionFilter {
  status?: MissionStatus;
  droneId?: string;
  pattern?: MissionPattern;
  dateFrom?: Date;
  dateTo?: Date;
}

// Analytics types
export interface OrganizationAnalytics {
  totalMissions: number;
  missionsInProgress: number;
  completedMissions: number;
  abortedMissions: number;
  averageMissionDuration: number; // in seconds
  completionRate: number; // percentage
  totalFlightTime: number; // in seconds
  totalDistanceCovered: number; // in meters
}

export interface DroneAnalytics {
  droneId: string;
  totalMissions: number;
  totalFlightTime: number; // in seconds
  totalDistance: number; // in meters
  averageBatteryUsage: number; // percentage
  lastMissionDate?: Date;
}