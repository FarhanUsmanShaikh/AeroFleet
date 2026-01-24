import React, { useState, useEffect } from 'react';
import type { Drone, DroneStatus, DroneFilter } from '../../../../shared/types';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

interface FleetDashboardProps {
  drones: Drone[];
  onDroneSelect?: (drone: Drone) => void;
  onDroneUpdate?: () => void;
}

const FleetDashboard: React.FC<FleetDashboardProps> = ({
  drones: initialDrones,
  onDroneSelect,
  onDroneUpdate,
}) => {
  const [drones, setDrones] = useState<Drone[]>(initialDrones);
  const [filter, setFilter] = useState<DroneFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Synchronize local state with props when initialDrones changes
  useEffect(() => {
    setDrones(initialDrones);
  }, [initialDrones]);

  useEffect(() => {
    // Listen for fleet updates
    const handleFleetUpdate = () => {
      loadDrones();
    };

    websocketService.on('fleetUpdate', handleFleetUpdate);

    return () => {
      websocketService.off('fleetUpdate', handleFleetUpdate);
    };
  }, []);

  useEffect(() => {
    loadDrones();
  }, [filter]);

  const loadDrones = async () => {
    try {
      const response = await apiService.getAllDrones(filter);
      if (response.success && response.data) {
        setDrones(response.data);
      }
    } catch (error) {
      console.error('Failed to load drones:', error);
    }
  };

  const handleStatusUpdate = async (droneId: string, status: DroneStatus) => {
    setIsUpdatingStatus(droneId);
    try {
      const response = await apiService.updateDroneStatus(droneId, status);
      if (response.success) {
        await loadDrones();
      } else {
        alert(response.error || 'Failed to update drone status');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update drone status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filteredDrones = drones.filter((drone) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        drone.name.toLowerCase().includes(query) ||
        drone.model.toLowerCase().includes(query) ||
        drone.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusColor = (status: DroneStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'IN_MISSION':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getBatteryColor = (level: number): string => {
    if (level <= 20) return 'bg-red-500';
    if (level <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="h-full flex flex-col pt-2">
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drones..."
            className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 text-sm bg-slate-50/50 hover:bg-white transition-all duration-300 placeholder-slate-400 font-medium"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary-400 transition-colors">🔍</div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filter.status || ''}
            onChange={(e) =>
              setFilter({
                ...filter,
                status: e.target.value ? (e.target.value as DroneStatus) : undefined,
              })
            }
            className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary-400/10 bg-slate-50/50 cursor-pointer transition-all duration-300 appearance-none text-slate-600"
          >
            <option value="">STATUS</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_MISSION">In Mission</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <select
            value={filter.model || ''}
            onChange={(e) =>
              setFilter({
                ...filter,
                model: e.target.value || undefined,
              })
            }
            className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary-400/10 bg-slate-50/50 cursor-pointer transition-all duration-300 appearance-none text-slate-600"
          >
            <option value="">MODEL</option>
            {Array.from(new Set(initialDrones.map((d) => d.model))).map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {(filter.status || filter.model || searchQuery) && (
          <button
            onClick={() => {
              setFilter({});
              setSearchQuery('');
              if (onDroneUpdate) onDroneUpdate();
            }}
            className="w-full py-2 text-xs text-slate-400 hover:text-primary-600 font-bold flex items-center justify-center gap-1 transition-colors"
          >
            ✕ RESET ALL FILTERS
          </button>
        )}
      </div>

      {/* Drone List */}
      <div className="flex-1 space-y-4">
        {filteredDrones.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl opacity-50">🔍</span>
            </div>
            <p className="text-gray-500 font-medium">No drones found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrones.map((drone) => (
              <div
                key={drone.id}
                className="group p-4 rounded-2xl border-2 border-gray-100 hover:border-primary-200 transition-all duration-300 bg-white hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-fade-in"
              >
                {/* Drone Header */}
                <div
                  className="flex items-start justify-between mb-3"
                  onClick={() => onDroneSelect && onDroneSelect(drone)}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                      {drone.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <span>📦</span>
                      {drone.model}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${getStatusColor(
                      drone.status
                    )}`}
                  >
                    {drone.status === 'AVAILABLE' && '✓ '}
                    {drone.status === 'IN_MISSION' && '⚡ '}
                    {drone.status === 'MAINTENANCE' && '🔧 '}
                    {drone.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Battery Level */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <span>🔋</span> Battery
                    </span>
                    <span className={`text-xs font-bold ${drone.batteryLevel <= 20 ? 'text-danger-600' :
                      drone.batteryLevel <= 50 ? 'text-warning-600' :
                        'text-success-600'
                      }`}>
                      {drone.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 battery-indicator ${getBatteryColor(
                        drone.batteryLevel
                      )}`}
                      style={{ width: `${drone.batteryLevel}%` }}
                    ></div>
                  </div>
                </div>

                {/* Location */}
                {drone.currentLocation && (
                  <div className="text-xs text-gray-500 mb-3 flex items-start gap-1 bg-gray-50 p-2 rounded-lg">
                    <span className="mt-0.5">📍</span>
                    <div className="flex-1">
                      <div className="font-mono">
                        {drone.currentLocation.latitude.toFixed(6)}, {drone.currentLocation.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-2 mt-3">
                  {drone.status !== 'MAINTENANCE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(drone.id, 'MAINTENANCE');
                      }}
                      disabled={isUpdatingStatus === drone.id}
                      className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-warning-50 to-warning-100 hover:from-warning-100 hover:to-warning-200 text-warning-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 border border-warning-200 hover:shadow-md"
                    >
                      {isUpdatingStatus === drone.id ? '⏳' : '🔧'} Maintenance
                    </button>
                  )}
                  {drone.status === 'MAINTENANCE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(drone.id, 'AVAILABLE');
                      }}
                      disabled={isUpdatingStatus === drone.id}
                      className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-success-50 to-success-100 hover:from-success-100 hover:to-success-200 text-success-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 border border-success-200 hover:shadow-md"
                    >
                      {isUpdatingStatus === drone.id ? '⏳' : '✓'} Set Available
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetDashboard;
