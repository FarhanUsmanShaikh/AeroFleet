import React from 'react';
import type { Mission } from '../../../../shared/types';

interface MissionListProps {
    missions: Mission[];
    onMissionSelect: (mission: Mission) => void;
}

const MissionList: React.FC<MissionListProps> = ({ missions, onMissionSelect }) => {
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'PLANNED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'STARTING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'IN_PROGRESS': return 'bg-primary-100 text-primary-700 border-primary-200';
            case 'PAUSED': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'COMPLETED': return 'bg-success-100 text-success-700 border-success-200';
            case 'ABORTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="pt-2">
            <div className="space-y-4">
                {missions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl opacity-50">✈️</span>
                        </div>
                        <p className="text-gray-500 font-medium">No missions created yet</p>
                    </div>
                ) : (
                    missions.map((mission) => (
                        <div
                            key={mission.id}
                            onClick={() => onMissionSelect(mission)}
                            className="group p-4 rounded-2xl border-2 border-gray-100 hover:border-primary-200 transition-all duration-300 bg-white hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-fade-in"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                                    {mission.name}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(mission.status)}`}>
                                    {mission.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex items-center gap-1">
                                    <span>🚁</span>
                                    <span>Drone: {mission.drone?.name || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>📊</span>
                                    <span>Pattern: {mission.pattern}</span>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-gray-500 font-medium">Progress</span>
                                    <span className="text-primary-600 font-bold">{mission.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                                        style={{ width: `${mission.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MissionList;
