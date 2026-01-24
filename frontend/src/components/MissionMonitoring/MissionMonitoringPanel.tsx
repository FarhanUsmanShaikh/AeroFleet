import React, { useEffect, useState } from 'react';
import type { Mission, MissionAction } from '../../../../shared/types';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

interface MissionMonitoringPanelProps {
  mission: Mission;
  onClose: () => void;
  onMissionUpdate: () => void;
}

const MissionMonitoringPanel: React.FC<MissionMonitoringPanelProps> = ({
  mission,
  onClose,
  onMissionUpdate,
}) => {
  const [currentMission, setCurrentMission] = useState<Mission>(mission);
  const [isControlling, setIsControlling] = useState(false);
  const [abortReason, setAbortReason] = useState('');
  const [showAbortDialog, setShowAbortDialog] = useState(false);

  useEffect(() => {

    websocketService.joinMission(mission.id);

    // Listen for mission updates
    const handleMissionUpdate = (data: any) => {
      if (data.missionId === mission.id) {
        loadMissionData();
      }
    };

    const handleStatusChange = (data: any) => {
      if (data.missionId === mission.id) {
        loadMissionData();
      }
    };

    websocketService.on('missionUpdate', handleMissionUpdate);
    websocketService.on('missionStatusChange', handleStatusChange);

    // Load initial mission data
    loadMissionData();

    // Poll for updates every 5 seconds as fallback
    const interval = setInterval(loadMissionData, 5000);

    return () => {
      websocketService.leaveMission(mission.id);
      websocketService.off('missionUpdate', handleMissionUpdate);
      websocketService.off('missionStatusChange', handleStatusChange);
      clearInterval(interval);
    };
  }, [mission.id]);

  const loadMissionData = async () => {
    try {
      const response = await apiService.getMissionById(mission.id);
      if (response.success && response.data) {
        setCurrentMission(response.data);
        onMissionUpdate();
      }
    } catch (error) {
      console.error('Failed to load mission data:', error);
    }
  };

  const handleControlAction = async (action: MissionAction, reason?: string) => {
    setIsControlling(true);
    try {
      const response = await apiService.controlMission(mission.id, action, reason);
      if (response.success) {
        await loadMissionData();
      } else {
        alert(response.error || 'Failed to control mission');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to control mission');
    } finally {
      setIsControlling(false);
      setShowAbortDialog(false);
      setAbortReason('');
    }
  };

  const canStart = currentMission.status === 'PLANNED';
  const canPause = currentMission.status === 'IN_PROGRESS';
  const canResume = currentMission.status === 'PAUSED';
  const canAbort = ['PLANNED', 'STARTING', 'IN_PROGRESS', 'PAUSED'].includes(currentMission.status);

  const statusColors = {
    PLANNED: 'bg-slate-500',
    STARTING: 'bg-yellow-500',
    IN_PROGRESS: 'bg-primary-500',
    PAUSED: 'bg-orange-500',
    COMPLETED: 'bg-success-500',
    ABORTED: 'bg-red-500',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fade-in group/modal">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-scale-in relative z-10 gpu-accelerated">
        {/* Header */}
        <div className="p-8 pb-6 flex items-start justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative ${statusColors[currentMission.status as keyof typeof statusColors] || 'bg-slate-500'}`}>
              <span className="relative z-10">
                {currentMission.status === 'IN_PROGRESS' && '⚡'}
                {currentMission.status === 'COMPLETED' && '✓'}
                {currentMission.status === 'ABORTED' && '✕'}
                {currentMission.status === 'PAUSED' && '⏸'}
                {['PLANNED', 'STARTING'].includes(currentMission.status) && '✈️'}
              </span>
              {currentMission.status === 'IN_PROGRESS' && (
                <div className="absolute inset-0 bg-primary-400 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentMission.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${currentMission.status === 'IN_PROGRESS' ? 'bg-primary-50 text-primary-600 border-primary-200 animate-pulse' :
                  currentMission.status === 'COMPLETED' ? 'bg-success-50 text-success-600 border-success-200' :
                    currentMission.status === 'ABORTED' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                  {currentMission.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1">🚁 <span className="text-slate-800">{currentMission.drone?.name || 'Unassigned'}</span></span>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                <span className="flex items-center gap-1">🧭 <span className="text-slate-800 font-mono">{currentMission.id.split('-')[0].toUpperCase()}</span></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center text-3xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar smooth-scroll">
          <div className="p-8">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-soft transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Airborne Progress</div>
                <div className="text-3xl font-black text-primary-600 mb-4">{currentMission.progress.toFixed(1)}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner">
                  <div className="bg-gradient-sky h-full rounded-full transition-all duration-1000" style={{ width: `${currentMission.progress}%` }} />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-soft transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Waypoint Delta</div>
                <div className="text-3xl font-black text-slate-800 mb-2">
                  {currentMission.currentWaypointIndex}<span className="text-slate-300 mx-1">/</span>{currentMission.totalWaypoints}
                </div>
                <div className="text-[11px] font-bold text-success-600 bg-success-50 inline-block px-2 py-0.5 rounded-full">
                  {currentMission.totalWaypoints - currentMission.currentWaypointIndex} REMAINING
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-soft transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hull Energy</div>
                <div className={`text-3xl font-black mb-2 ${(currentMission.drone?.batteryLevel || 0) <= 20 ? 'text-red-500' : 'text-slate-800'
                  }`}>
                  {currentMission.drone?.batteryLevel || 0}%
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-500 ${(currentMission.drone?.batteryLevel || 0) <= 20 ? 'bg-red-500' : 'bg-success-500'
                    }`} style={{ width: `${currentMission.drone?.batteryLevel || 0}%` }} />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-soft transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time Remaining</div>
                <div className="text-3xl font-black text-slate-800 mb-1">
                  {Math.floor((currentMission.estimatedTimeRemaining || 0) / 60)}<span className="text-sm font-medium text-slate-400 ml-0.5">M</span> {(currentMission.estimatedTimeRemaining || 0) % 60}<span className="text-sm font-medium text-slate-400 ml-0.5">S</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 italic">REAL-TIME ESTIMATE</div>
              </div>
            </div>

            {/* Abort Dialog */}
            {showAbortDialog && (
              <div className="mb-8 p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] animate-shake">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🚫</span>
                  <div>
                    <h4 className="text-lg font-black text-red-900">Authorize Mission Abort?</h4>
                    <p className="text-sm font-medium text-red-600">This will immediately return the drone to base. This action is final.</p>
                  </div>
                </div>
                <textarea
                  value={abortReason}
                  onChange={(e) => setAbortReason(e.target.value)}
                  placeholder="Enter reason for mission termination..."
                  className="w-full p-4 bg-white border-2 border-red-100 rounded-2xl mb-6 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder-red-200 font-medium"
                  rows={3}
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => handleControlAction('ABORT', abortReason)}
                    disabled={isControlling}
                    className="btn-danger flex-1 py-4 text-base"
                  >
                    Confirm Termination
                  </button>
                  <button
                    onClick={() => {
                      setShowAbortDialog(false);
                      setAbortReason('');
                    }}
                    className="btn-secondary flex-1 py-4 text-base"
                  >
                    Return to Monitoring
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission Specs */}
              <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span>⚙️</span> Mission Specifications
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="pb-4 border-b border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trajectory Pattern</div>
                    <div className="text-base font-bold text-slate-800">{currentMission.pattern}</div>
                  </div>
                  <div className="pb-4 border-b border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Altitude</div>
                    <div className="text-base font-bold text-slate-800">{currentMission.altitude}m AGL</div>
                  </div>
                  <div className="pb-4 border-b border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sensor Overlap</div>
                    <div className="text-base font-bold text-slate-800">{currentMission.overlapPercentage}% Sidelap</div>
                  </div>
                  <div className="pb-4 border-b border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Distance</div>
                    <div className="text-base font-bold text-slate-800">{(currentMission.distanceCovered / 1000).toFixed(2)}km Traversed</div>
                  </div>
                </div>
              </div>

              {/* Control Center */}
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative z-10">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <span className="animate-pulse">🔴</span> Command Interface
                  </h3>
                  <div className="space-y-4">
                    {canStart && (
                      <button
                        onClick={() => handleControlAction('START')}
                        disabled={isControlling}
                        className="w-full py-5 bg-gradient-success text-white rounded-2xl font-black text-base shadow-xl shadow-success-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        🚀 ATTEMPT LAUNCH
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {canPause && (
                        <button
                          onClick={() => handleControlAction('PAUSE')}
                          disabled={isControlling}
                          className="py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl font-black text-sm transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                          ⏸ PAUSE
                        </button>
                      )}
                      {canResume && (
                        <button
                          onClick={() => handleControlAction('RESUME')}
                          disabled={isControlling}
                          className="py-5 bg-gradient-sky text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          ▶️ RESUME
                        </button>
                      )}
                      {canAbort && !showAbortDialog && (
                        <button
                          onClick={() => setShowAbortDialog(true)}
                          disabled={isControlling}
                          className={`py-5 bg-white/5 hover:bg-red-500/20 backdrop-blur-md text-red-400 hover:text-white rounded-2xl font-black text-sm transition-all border border-white/5 hover:border-red-500/30 flex items-center justify-center gap-2 ${!canPause && !canResume ? 'col-span-2' : ''
                            }`}
                        >
                          ✕ ABORT
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-10 pt-8 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase tracking-widest">
                      <span>Telemetry Link</span>
                      <span className="text-success-400">ENCRYPTED</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="opacity-60">Initialized:</span>
                      <span>{new Date(currentMission.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {currentMission.startedAt && (
                      <div className="flex justify-between items-center text-[11px] font-bold text-primary-400">
                        <span>Launch:</span>
                        <span>{new Date(currentMission.startedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionMonitoringPanel;
