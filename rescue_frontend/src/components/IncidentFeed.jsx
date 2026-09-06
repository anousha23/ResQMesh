import React from 'react';
import IncidentCard from './IncidentCard';
import { Activity } from 'lucide-react';

export default function IncidentFeed({ incidents, selectedIncidentId, highestPriorityIncidentId, onSelectIncident }) {
  // Sort incidents: CRITICAL first, then HIGH, then MEDIUM, then by minutesAgo ascending
  const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3 };
  const sortedIncidents = [...incidents].sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.minutesAgo - b.minutesAgo;
  });

  const hasCritical = incidents.some((i) => i.severity === 'CRITICAL');

  return (
    <aside className="w-full h-full flex flex-col bg-[#161b22] border-r border-[#30363d] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#1c2128] shrink-0">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-slate-300" />
          <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
            Live Incidents
          </h2>
        </div>
        <span className="text-xs font-bold bg-[#28303d] text-slate-300 px-2 py-0.5 rounded-full border border-[#30363d]">
          {incidents.length}
        </span>
      </div>

      {hasCritical && (
        <div className="px-3 pt-2.5 shrink-0">
          <div className="bg-red-950/70 border border-red-800/80 px-2.5 py-1.5 rounded-md flex items-center justify-between shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-critical-dot"></span>
              <span className="text-[11px] font-extrabold text-red-400 tracking-wider uppercase">
                CRITICAL DISPATCH ACTIVE
              </span>
            </div>
            <span className="text-[9px] bg-red-900/90 text-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
              PRIORITY #1
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedIncidents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No active incidents reported.
          </div>
        ) : (
          sortedIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={incident.id === selectedIncidentId}
              isHighestPriority={incident.id === highestPriorityIncidentId}
              onClick={onSelectIncident}
            />
          ))
        )}
      </div>
    </aside>
  );
}
