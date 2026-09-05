import React from 'react';
import IncidentCard from './IncidentCard';
import { Activity } from 'lucide-react';

export default function IncidentFeed({ incidents, selectedIncidentId, onSelectIncident }) {
  // Sort incidents: CRITICAL first, then HIGH, then MEDIUM, then by minutesAgo ascending
  const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3 };
  const sortedIncidents = [...incidents].sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.minutesAgo - b.minutesAgo;
  });

  return (
    <aside className="w-full h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            Live Incidents
          </h2>
        </div>
        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
          {incidents.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedIncidents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No active incidents reported.
          </div>
        ) : (
          sortedIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={incident.id === selectedIncidentId}
              onClick={onSelectIncident}
            />
          ))
        )}
      </div>
    </aside>
  );
}
