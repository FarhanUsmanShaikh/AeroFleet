import type {
  ApiResponse,
  Mission,
  Drone,
  MissionConfig,
  MissionAction,
  DroneStatus,
  LatLng,
  DroneFilter
} from '../../../shared/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Mission API methods
  async createMission(config: MissionConfig): Promise<ApiResponse<Mission>> {
    return this.request<Mission>('/api/missions', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getAllMissions(): Promise<ApiResponse<Mission[]>> {
    return this.request<Mission[]>('/api/missions');
  }

  async getActiveMissions(): Promise<ApiResponse<Mission[]>> {
    return this.request<Mission[]>('/api/missions/active');
  }

  async getMissionById(id: string): Promise<ApiResponse<Mission>> {
    return this.request<Mission>(`/api/missions/${id}`);
  }

  async controlMission(id: string, action: MissionAction, reason?: string): Promise<ApiResponse<Mission>> {
    return this.request<Mission>(`/api/missions/${id}/control`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason }),
    });
  }

  async getMissionWaypoints(id: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/missions/${id}/waypoints`);
  }

  async getMissionProgress(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/missions/${id}/progress`);
  }

  async getMissionStatistics(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/missions/statistics/overview');
  }

  // Fleet API methods
  async getAllDrones(filter?: DroneFilter): Promise<ApiResponse<Drone[]>> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.model) params.append('model', filter.model);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/fleet?${queryString}` : '/api/fleet';

    return this.request<Drone[]>(endpoint);
  }

  async getAvailableDrones(): Promise<ApiResponse<Drone[]>> {
    return this.request<Drone[]>('/api/fleet/available');
  }

  async getDroneById(id: string): Promise<ApiResponse<Drone>> {
    return this.request<Drone>(`/api/fleet/${id}`);
  }

  async updateDroneStatus(id: string, status: DroneStatus): Promise<ApiResponse<Drone>> {
    return this.request<Drone>(`/api/fleet/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateDroneLocation(id: string, location: LatLng): Promise<ApiResponse<Drone>> {
    return this.request<Drone>(`/api/fleet/${id}/location`, {
      method: 'PUT',
      body: JSON.stringify({ latitude: location.latitude, longitude: location.longitude }),
    });
  }

  async updateDroneBattery(id: string, batteryLevel: number): Promise<ApiResponse<Drone>> {
    return this.request<Drone>(`/api/fleet/${id}/battery`, {
      method: 'PUT',
      body: JSON.stringify({ batteryLevel }),
    });
  }

  async createDrone(droneData: {
    name: string;
    model: string;
    currentLatitude?: number;
    currentLongitude?: number;
    maxFlightTime?: number;
    maxSpeed?: number;
  }): Promise<ApiResponse<Drone>> {
    return this.request<Drone>('/api/fleet', {
      method: 'POST',
      body: JSON.stringify(droneData),
    });
  }

  async seedSampleDrones(): Promise<ApiResponse<Drone[]>> {
    return this.request<Drone[]>('/api/fleet/seed', {
      method: 'POST',
    });
  }

  async getFleetStatistics(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/fleet/statistics');
  }

  async getDroneMissions(id: string): Promise<ApiResponse<Mission[]>> {
    return this.request<Mission[]>(`/api/fleet/${id}/missions`);
  }

  // Health check
  async getHealth(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/health');
  }
}

export const apiService = new ApiService();
export default apiService;