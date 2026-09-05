import React from 'react';
import { X, ShieldAlert, Wifi, Users, Clock, Radio, CheckCircle2 } from 'lucide-react';

export default function IncidentDetails({ incident, onClose }) {
  if (!incident) return null;

  const severityBadge = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-amber-500 text-white',
  }[incident.severity] || 'bg-slate-500 text-white';

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 backdrop-blur rounded-lg border border-slate-300 shadow-xl p-4 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${severityBadge}`}>
            {incident.severity}
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 uppercase tracking-wide">
            {incident.type}
          </h3>
          <p className="text-xs text-slate-500 font-semibold">{incident.locationName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        {incident.peopleAffected > 0 && (
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-600" /> People Affected:
            </span>
            <span className="font-bold text-red-600">{incident.peopleAffected}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" /> Confidence:
          </span>
          <span className="font-bold text-slate-800">{incident.confidence}%</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-600" /> Node / Device ID:
          </span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
            {incident.deviceId}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-600" /> Supporting Reports:
          </span>
          <span className="font-bold text-slate-800">{incident.supportingReports}</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" /> Timestamp:
          </span>
          <span className="font-mono text-slate-700">{incident.timestamp} ({incident.minutesAgo}m ago)</span>
        </div>

        {incident.description && (
          <div className="mt-2.5 p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
            {incident.description}
          </div>
        )}
      </div>
    </div>
  );
}
