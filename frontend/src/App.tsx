import { useEffect, useState, useCallback } from 'react';
import MapComponent from './components/Map/MapComponent';
import MissionPlanningForm from './components/MissionPlanning/MissionPlanningForm';
import MissionMonitoringPanel from './components/MissionMonitoring/MissionMonitoringPanel';
import FleetDashboard from './components/Fleet/FleetDashboard';
import MissionList from './components/Fleet/MissionList';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import { websocketService } from './services/websocket';
import { apiService } from './services/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './utils/mapUtils';
import type { LatLng, Drone, Mission, Polygon, Waypoint } from '../../shared/types';
import './App.css';

function App() {
  /* ================= STATE ================= */

  const [isConnected, setIsConnected] = useState(false);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const [sidebarTab, setSidebarTab] = useState<'fleet' | 'missions'>('fleet');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [surveyArea, setSurveyArea] = useState<LatLng[]>([]);
  const [missionWaypoints, setMissionWaypoints] = useState<Waypoint[]>([]);

  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  /* ================= API LOADERS ================= */

  // ✅ matches apiService.getAllDrones()
  const loadDrones = useCallback(async () => {
    try {
      const res = await apiService.getAllDrones();
      if (res.success && res.data) setDrones(res.data);
    } catch (err) {
      console.error('Failed loading drones:', err);
    }
  }, []);

  // ✅ matches apiService.getAllMissions()
  const loadMissions = useCallback(async () => {
    try {
      const res = await apiService.getAllMissions();
      if (res.success && res.data) setMissions(res.data);
    } catch (err) {
      console.error('Failed loading missions:', err);
    }
  }, []);

  const loadMissionData = useCallback(async () => {
    if (!selectedMission) return;

    try {
      const res = await apiService.getMissionById(selectedMission.id);
      if (res.success && res.data) setSelectedMission(res.data);
    } catch (err) {
      console.error('Failed loading mission:', err);
    }
  }, [selectedMission]);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    websocketService.connect();
    websocketService.joinFleet();

    websocketService.on('connected', () => setIsConnected(true));
    websocketService.on('disconnected', () => setIsConnected(false));

    websocketService.on('fleetUpdate', loadDrones);

    const handleMissionUpdate = (data: any) => {
      if (selectedMission && data.missionId === selectedMission.id) {
        loadMissionData();
      }
      loadMissions();
    };

    websocketService.on('missionUpdate', handleMissionUpdate);
    websocketService.on('missionStatusChange', handleMissionUpdate);

    loadDrones();
    loadMissions();

    return () => {
      websocketService.off('missionUpdate', handleMissionUpdate);
      websocketService.off('missionStatusChange', handleMissionUpdate);
      websocketService.disconnect();
    };
  }, [loadDrones, loadMissions, loadMissionData, selectedMission]);

  /* ================= HANDLERS ================= */

  const handleMissionSelect = async (mission: Mission) => {
    setSelectedMission(mission);

    const res = await apiService.getMissionWaypoints(mission.id);
    if (res.success && res.data) setMissionWaypoints(res.data as Waypoint[]);
  };

  const handleMissionCreated = () => {
    loadMissions();
    setSurveyArea([]);
    setShowMissionForm(false);
    setSidebarTab('missions');
  };

  const handleMissionUpdate = () => {
    loadMissions();
    loadMissionData();
  };

  const handlePolygonDraw = (coords: LatLng[]) => {
    setSurveyArea(coords);
    setIsDrawingMode(false);
  };

  const handleSeedDrones = async () => {
    const res = await apiService.seedSampleDrones();
    if (res.success) loadDrones();
  };

  const getSurveyAreaPolygon = (): Polygon | null => {
    if (surveyArea.length < 3) return null;
    return { coordinates: surveyArea, area: 0 };
  };

  /* ================= UI ================= */

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-gray-100 px-6 py-4 animate-slide-down relative z-[1000]">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-sky rounded-2xl flex items-center justify-center shadow-lg relative z-10 transition-transform duration-500 hover:rotate-12">
                <span className="text-3xl">🚁</span>
              </div>
              <div className="absolute inset-0 bg-primary-400 blur-xl opacity-20 animate-pulse-slow"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                AeroFleet
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mission Control</span>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-1.5 py-0.5 px-2 bg-slate-50 rounded-full border border-slate-100">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`} />
                  <span className="text-[10px] font-bold text-slate-500">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`py-2 px-5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isDrawingMode
                  ? 'bg-gradient-warning text-white shadow-lg shadow-warning-500/20 px-6'
                  : 'text-slate-600 hover:bg-white hover:text-primary-600'
                  }`}
              >
                {isDrawingMode ? '✕ Stop Drawing' : '✏️ Draw Survey Area'}
              </button>

              <div className="w-px h-6 bg-slate-200 mx-1"></div>

              <button
                onClick={handleSeedDrones}
                className="py-2 px-5 text-slate-600 hover:text-primary-600 font-bold text-sm transition-colors flex items-center gap-2"
              >
                🔄 Seed Data
              </button>
            </div>

            <div className="flex items-center gap-3">
              {surveyArea.length >= 3 && (
                <button
                  onClick={() => setShowMissionForm(true)}
                  className="btn-success text-sm flex items-center gap-2 px-8 animate-scale-in"
                >
                  🚀 Plan Mission
                </button>
              )}

              <button
                onClick={() => setShowAnalytics(true)}
                className="btn-purple text-sm flex items-center gap-2"
              >
                📊 Analytics
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 bg-white/60 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl flex flex-col relative z-20">
          {/* TAB SWITCHER */}
          <div className="p-5 flex flex-col gap-4">
            <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1.5 border border-slate-200/50 shadow-inner">
              <button
                onClick={() => setSidebarTab('fleet')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${sidebarTab === 'fleet'
                  ? 'bg-white text-primary-600 shadow-xl shadow-primary-500/5 border border-slate-200 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
              >
                <span className="text-lg">🚁</span> Fleet
              </button>
              <button
                onClick={() => setSidebarTab('missions')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-500 relative ${sidebarTab === 'missions'
                  ? 'bg-white text-primary-600 shadow-xl shadow-primary-500/5 border border-slate-200 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
              >
                <span className="text-lg">✈️</span> Missions
                {missions.filter(m => ['PLANNED', 'STARTING', 'IN_PROGRESS'].includes(m.status)).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 bg-primary-600 rounded-full border-2 border-white shadow-lg animate-bounce items-center justify-center text-[10px] text-white">
                    {missions.filter(m => ['PLANNED', 'STARTING', 'IN_PROGRESS'].includes(m.status)).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {sidebarTab === 'fleet' ? (
              <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
                <FleetDashboard
                  drones={drones}
                  onDroneSelect={setSelectedDrone}
                  onDroneUpdate={loadDrones}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
                <MissionList
                  missions={missions}
                  onMissionSelect={handleMissionSelect}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 relative">
          <div className="h-full rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border-4 border-white relative transition-all duration-700 hover:shadow-[0_32px_80px_-12px_rgba(59,130,246,0.15)]">
            <MapComponent
              center={DEFAULT_MAP_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              onPolygonDraw={handlePolygonDraw}
              missionBounds={surveyArea.length ? surveyArea : undefined}
              dronePosition={
                selectedMission?.drone?.currentLocation ||
                selectedDrone?.currentLocation
              }
              flightPath={missionWaypoints}
              isDrawingMode={isDrawingMode}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {showMissionForm && (
        <MissionPlanningForm
          surveyArea={getSurveyAreaPolygon()}
          availableDrones={drones}
          onMissionCreated={handleMissionCreated}
          onClose={() => setShowMissionForm(false)}
        />
      )}

      {selectedMission && (
        <MissionMonitoringPanel
          mission={selectedMission}
          onClose={() => {
            setSelectedMission(null);
            setMissionWaypoints([]);
          }}
          onMissionUpdate={handleMissionUpdate}
        />
      )}

      {showAnalytics && (
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
      )}
    </div>
  );
}

export default App;
