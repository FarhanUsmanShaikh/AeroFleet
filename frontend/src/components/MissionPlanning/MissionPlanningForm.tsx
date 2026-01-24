import React, { useState, useEffect } from 'react';
import type { MissionConfig, Drone, Polygon, MissionPattern, SensorConfig } from '../../../../shared/types';
import { apiService } from '../../services/api';
import { calculatePolygonArea } from '../../utils/mapUtils';

interface MissionPlanningFormProps {
  surveyArea: Polygon | null;
  availableDrones: Drone[];
  onMissionCreated: () => void;
  onClose: () => void;
}

const MissionPlanningForm: React.FC<MissionPlanningFormProps> = ({
  surveyArea,
  availableDrones,
  onMissionCreated,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<MissionConfig>>({
    name: '',
    droneId: '',
    pattern: 'GRID',
    altitude: 50,
    overlapPercentage: 70,
    sensorSettings: {
      type: 'CAMERA',
      frequency: 1,
      resolution: '4K',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  useEffect(() => {
    if (surveyArea && formData.pattern && formData.altitude && formData.overlapPercentage) {
      calculateEstimates();
    }
  }, [surveyArea, formData.pattern, formData.altitude, formData.overlapPercentage]);

  const calculateEstimates = () => {
    if (!surveyArea) return;

    // Rough estimation based on area and pattern
    const area = surveyArea.area || calculatePolygonArea(surveyArea.coordinates);
    const spacing = formData.altitude! * (1 - formData.overlapPercentage! / 100);

    let flightLines = 0;
    if (formData.pattern === 'GRID' || formData.pattern === 'CROSSHATCH') {
      // Estimate flight lines based on area
      const bounds = {
        north: Math.max(...surveyArea.coordinates.map(c => c.latitude)),
        south: Math.min(...surveyArea.coordinates.map(c => c.latitude)),
        east: Math.max(...surveyArea.coordinates.map(c => c.longitude)),
        west: Math.min(...surveyArea.coordinates.map(c => c.longitude)),
      };
      const latSpan = bounds.north - bounds.south;
      const lngSpan = bounds.east - bounds.west;
      const avgSpan = (latSpan + lngSpan) / 2;
      flightLines = Math.ceil(avgSpan * 111000 / spacing); // Convert degrees to meters

      if (formData.pattern === 'CROSSHATCH') {
        flightLines *= 2; // Crosshatch has perpendicular lines
      }
    } else if (formData.pattern === 'PERIMETER') {
      // Perimeter follows boundary
      flightLines = 1;
    }

    // Estimate distance (rough calculation)
    const avgLineLength = Math.sqrt(area) * 0.8; // Rough estimate
    const estimatedDist = flightLines * avgLineLength;
    setEstimatedDistance(Math.round(estimatedDist));

    // Estimate duration (assuming 15 m/s average speed)
    const speed = 15; // m/s
    const estimatedTime = estimatedDist / speed;
    setEstimatedDuration(Math.round(estimatedTime));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!surveyArea || surveyArea.coordinates.length < 3) {
      setError('Please define a survey area on the map first');
      return;
    }

    if (!formData.name || !formData.droneId) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.altitude! < 10 || formData.altitude! > 400) {
      setError('Altitude must be between 10 and 400 meters');
      return;
    }

    if (formData.overlapPercentage! < 10 || formData.overlapPercentage! > 90) {
      setError('Overlap percentage must be between 10% and 90%');
      return;
    }

    setIsSubmitting(true);

    try {
      const missionConfig: MissionConfig = {
        name: formData.name!,
        droneId: formData.droneId!,
        surveyArea: {
          coordinates: surveyArea.coordinates,
          area: surveyArea.area || calculatePolygonArea(surveyArea.coordinates),
        },
        pattern: formData.pattern!,
        altitude: formData.altitude!,
        overlapPercentage: formData.overlapPercentage!,
        sensorSettings: formData.sensorSettings!,
      };

      const response = await apiService.createMission(missionConfig);

      if (response.success) {
        onMissionCreated();
        onClose();
      } else {
        setError(response.error || 'Failed to create mission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDronesList = availableDrones.filter(d => d.status === 'AVAILABLE');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fade-in group/modal">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="bg-white rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in relative z-10 gpu-accelerated">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Plan New Mission</h2>
            <p className="text-sm text-slate-500 font-medium">Configure survey parameters and drone assignment</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center text-2xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar smooth-scroll">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-3 animate-shake">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="form-section">
              <label className="form-label">
                <span>📝</span> Mission Designation
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g. North Sector Inspection alpha-01"
                required
              />
            </div>

            {/* Drone Selection */}
            <div className="form-section">
              <label className="form-label">
                <span>🚁</span> Drone Assignment
              </label>
              {availableDronesList.length === 0 ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl text-amber-700 text-sm font-bold flex items-center gap-3">
                  <span>⚠️</span> No drones available in current inventory.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={formData.droneId}
                    onChange={(e) => setFormData({ ...formData, droneId: e.target.value })}
                    className="select-field"
                    required
                  >
                    <option value="">Select drone for mission...</option>
                    {availableDronesList.map((drone) => (
                      <option key={drone.id} value={drone.id}>
                        {drone.name} — {drone.model} ({drone.batteryLevel}% Battery)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Flight Config */}
            <div className="grid grid-cols-2 gap-6">
              <div className="form-section mb-0">
                <label className="form-label">
                  <span>🚀</span> Altitude (m)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.altitude}
                    onChange={(e) => setFormData({ ...formData, altitude: parseFloat(e.target.value) || 0 })}
                    className="input-field pr-12"
                    min={10} max={400} required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">METERS</span>
                </div>
              </div>
              <div className="form-section mb-0">
                <label className="form-label">
                  <span>🛡️</span> Overlap (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.overlapPercentage}
                    onChange={(e) => setFormData({ ...formData, overlapPercentage: parseFloat(e.target.value) || 0 })}
                    className="input-field pr-12"
                    min={10} max={90} required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">PERCENT</span>
                </div>
              </div>
            </div>

            {/* Pattern Selector */}
            <div className="form-section">
              <label className="form-label">
                <span>🧭</span> Survey Flight Pattern
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['GRID', 'CROSSHATCH', 'PERIMETER'] as MissionPattern[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, pattern: p })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${formData.pattern === p
                      ? 'bg-primary-50 border-primary-500 ring-4 ring-primary-500/10'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                  >
                    <span className="text-2xl">
                      {p === 'GRID' && '🪜'}
                      {p === 'CROSSHATCH' && '🕸️'}
                      {p === 'PERIMETER' && '🔄'}
                    </span>
                    <span className={`text-[10px] font-black tracking-tighter ${formData.pattern === p ? 'text-primary-600' : 'text-slate-500'}`}>
                      {p}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                {formData.pattern === 'GRID' && 'Optimized parallel sweep coverage'}
                {formData.pattern === 'CROSSHATCH' && 'Maximum density multi-pass mapping'}
                {formData.pattern === 'PERIMETER' && 'Boundary tracking & perimeter sweep'}
              </p>
            </div>

            {/* Estimates Display */}
            {(estimatedDuration || estimatedDistance) && (
              <div className="p-6 bg-gradient-to-br from-primary-600 to-purple-700 rounded-3xl shadow-xl shadow-primary-500/20 text-white animate-slide-up">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <span className="text-xl">📊</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Mission Telemetry Prediction</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Trajectory</span>
                    <div className="text-3xl font-black leading-none">
                      {(estimatedDistance! / 1000).toFixed(2)} <span className="text-sm font-medium opacity-60">KM</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Airborne Duration</span>
                    <div className="text-3xl font-black leading-none">
                      {Math.floor(estimatedDuration! / 60)}<span className="text-sm font-medium opacity-60">M</span> {estimatedDuration! % 60}<span className="text-sm font-medium opacity-60">S</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !surveyArea || availableDronesList.length === 0}
            className="btn-success px-12 py-4 shadow-success-500/30 disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isSubmitting ? 'Initializing...' : 'Launch Mission'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionPlanningForm;
