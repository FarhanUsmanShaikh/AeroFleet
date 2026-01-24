import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { Mission } from '../../../../shared/types';

interface AnalyticsData {
  totalMissions: number;
  completedMissions: number;
  abortedMissions: number;
  activeMissions: number;
  averageDuration: number;
  completionRate: number;
  totalFlightTime: number;
  totalDistance: number;
}

interface AnalyticsDashboardProps {
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [allMissions, setAllMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadAnalytics();
    loadAllMissions();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getMissionStatistics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMissions = async () => {
    try {
      const response = await apiService.getAllMissions();
      if (response.success && response.data) {
        let missions = response.data;

        // Filter by time range
        const now = new Date();
        if (selectedTimeRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          missions = missions.filter((m) => new Date(m.createdAt) >= weekAgo);
        } else if (selectedTimeRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          missions = missions.filter((m) => new Date(m.createdAt) >= monthAgo);
        }

        setAllMissions(missions);
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-black tracking-widest text-xs uppercase animate-pulse">Aggregating Fleet Intelligence...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fade-in group/modal">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-scale-in relative z-10 gpu-accelerated">
        {/* Header */}
        <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Fleet Intelligence</h2>
            <p className="text-sm text-slate-500 font-medium">Performance analytics and mission historical data</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as 'all' | 'week' | 'month')}
                className="select-field min-w-[160px] py-2 px-4 pr-10 text-xs font-black uppercase tracking-wider bg-white shadow-soft hover:shadow-md transition-all border-none"
              >
                <option value="all">ALL TIME</option>
                <option value="week">LAST 7 DAYS</option>
                <option value="month">LAST 30 DAYS</option>
              </select>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center text-3xl font-light"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 smooth-scroll">
          {analytics && (
            <div className="space-y-10">
              {/* Primary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-[2rem] border border-primary-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Total Operations</div>
                    <div className="text-4xl font-black text-primary-900 leading-none">{analytics.totalMissions}</div>
                  </div>
                  <span className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">📊</span>
                </div>

                <div className="p-6 bg-gradient-to-br from-success-50 to-success-100/50 rounded-[2rem] border border-success-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-success-600 uppercase tracking-widest mb-1">Success Criteria</div>
                    <div className="text-4xl font-black text-success-900 leading-none">{analytics.completedMissions}</div>
                  </div>
                  <span className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">🏆</span>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100/50 rounded-[2rem] border border-red-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Mission Terminated</div>
                    <div className="text-4xl font-black text-red-900 leading-none">{analytics.abortedMissions}</div>
                  </div>
                  <span className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">⚠️</span>
                </div>

                <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-[2rem] border border-amber-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Current Active</div>
                    <div className="text-4xl font-black text-amber-900 leading-none">{analytics.activeMissions}</div>
                  </div>
                  <span className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">📡</span>
                </div>
              </div>

              {/* Advanced Metrics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Completion Rate & Efficiency */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-soft hover:shadow-md transition-all">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <span>✅</span> Operational Success Rate
                    </h3>
                    <div className="flex items-center gap-8">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-success-500"
                            strokeDasharray={364} strokeDashoffset={364 - (364 * analytics.completionRate) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-800">{analytics.completionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <p className="text-sm font-medium text-slate-500">Your fleet maintains a <span className="text-success-600 font-bold">{analytics.completionRate.toFixed(1)}%</span> success rate across {analytics.totalMissions} operations.</p>
                        <div className="flex gap-4">
                          <div className="px-4 py-2 bg-success-50 rounded-xl">
                            <div className="text-[10px] font-black text-success-600 tracking-wider uppercase">Efficiency</div>
                            <div className="text-lg font-black text-success-800">OPTIMAL</div>
                          </div>
                          <div className="px-4 py-2 bg-primary-50 rounded-xl">
                            <div className="text-[10px] font-black text-primary-600 tracking-wider uppercase">Reliability</div>
                            <div className="text-lg font-black text-primary-800">CLASS-A</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full"></div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Flight Time</div>
                        <div className="text-3xl font-black mb-1">{formatDuration(analytics.totalFlightTime)}</div>
                        <div className="text-xs font-bold text-primary-400">LOGGED AIRTIME</div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full"></div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Telemetry</div>
                        <div className="text-3xl font-black mb-1">{formatDistance(analytics.totalDistance)}</div>
                        <div className="text-xs font-bold text-purple-400">CUMULATIVE DISTANCE</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Status Distribution */}
                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Status Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Planned', count: allMissions.filter((m) => m.status === 'PLANNED').length, color: 'bg-slate-400', icon: '📝' },
                      { label: 'Starting', count: allMissions.filter((m) => m.status === 'STARTING').length, color: 'bg-yellow-400', icon: '🛫' },
                      { label: 'In Progress', count: allMissions.filter((m) => m.status === 'IN_PROGRESS').length, color: 'bg-primary-500', icon: '⚡' },
                      { label: 'Paused', count: allMissions.filter((m) => m.status === 'PAUSED').length, color: 'bg-orange-400', icon: '⏸' },
                      { label: 'Completed', count: allMissions.filter((m) => m.status === 'COMPLETED').length, color: 'bg-success-500', icon: '🏁' },
                    ].map((status) => (
                      <div key={status.label} className="p-4 bg-white rounded-2xl flex items-center justify-between shadow-soft hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{status.icon}</span>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{status.label}</div>
                            <div className="text-sm font-black text-slate-800">{status.count} Operational</div>
                          </div>
                        </div>
                        <div className={`w-8 h-8 ${status.color} rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg`}>
                          {Math.round((status.count / (allMissions.length || 1)) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log Table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>📜</span> Mission Operational Log
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 italic">SHOWING RECENT 10 ENTRIES</span>
                </div>
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trajectory</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allMissions.slice(0, 10).map((mission) => (
                        <tr key={mission.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{mission.name}</div>
                            <div className="text-[10px] font-medium text-slate-400 font-mono">{mission.id.split('-')[0].toUpperCase()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${mission.status === 'COMPLETED' ? 'bg-success-50 text-success-600 border-success-100' :
                              mission.status === 'ABORTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                mission.status === 'IN_PROGRESS' ? 'bg-primary-50 text-primary-600 border-primary-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                              {mission.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-[60px] bg-slate-100 h-1 rounded-full">
                                <div className="bg-primary-500 h-full rounded-full" style={{ width: `${mission.progress}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-600">{mission.progress.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-800">
                            {formatDistance(mission.distanceCovered)}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-400">
                            {new Date(mission.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allMissions.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/30">
                      <div className="text-4xl mb-4 grayscale opacity-20">📭</div>
                      <div className="text-sm font-black text-slate-300 uppercase tracking-widest">No Operational History Found</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
