import React from 'react';
import { X, ShieldAlert, Wifi, Users, Clock, Radio, CheckCircle2 } from 'lucide-react';

export default function IncidentDetails({ incident, onClose }) {
  if (!incident) return null;

  const severityBadge = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-600 text-white',
    MEDIUM: 'bg-amber-600 text-white',
  }[incident.severity] || 'bg-slate-700 text-white';

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 bg-[#161b22]/95 backdrop-blur-md rounded-lg border border-[#30363d] shadow-2xl p-4 text-slate-100 transition-all">
      <div className="flex items-start justify-between border-b border-[#30363d] pb-2.5">
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${severityBadge}`}>
            {incident.severity}
          </span>
          <h3 className="text-base font-extrabold text-slate-100 mt-1 uppercase tracking-wide">
            {incident.type}
          </h3>
          <p className="text-xs text-slate-400 font-semibold">{incident.locationName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        {incident.peopleAffected > 0 && (
          <div className="flex items-center justify-between py-1 border-b border-[#21262d]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" /> People Affected:
            </span>
            <span className="font-bold text-red-400">{incident.peopleAffected}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-[#21262d]">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Confidence:
          </span>
          <span className="font-bold text-slate-200">{incident.confidence}%</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#21262d]">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" /> Node / Device ID:
          </span>
          <span className="font-mono font-bold text-slate-200 bg-[#21262d] border border-[#30363d] px-1.5 py-0.5 rounded">
            {incident.deviceId}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#21262d]">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-400" /> Supporting Reports:
          </span>
          <span className="font-bold text-slate-200">{incident.supportingReports}</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Timestamp:
          </span>
          <span className="font-mono text-slate-300">{incident.timestamp} ({incident.minutesAgo}m ago)</span>
        </div>

        {incident.description && (
          <div className="mt-2.5 p-2 bg-[#21262d] rounded border border-[#30363d] text-slate-300 leading-relaxed text-[11px]">
            {incident.description}
          </div>
        )}
      </div>
    </div>
  );
}
