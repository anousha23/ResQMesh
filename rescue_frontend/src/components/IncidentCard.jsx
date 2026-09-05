import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Activity, 
  OctagonAlert, 
  Droplets, 
  Wind, 
  Home,
  UserX,
  Radio
} from 'lucide-react';

const iconMap = {
  AlertTriangle,
  Flame,
  Activity,
  OctagonAlert,
  Droplets,
  Wind,
  Home,
  UserX,
  Radio
};

export default function IncidentCard({ incident, isSelected, onClick }) {
  const IconComponent = iconMap[incident.icon] || AlertTriangle;

  const severityStyles = {
    CRITICAL: {
      dot: 'bg-red-500',
      badge: 'bg-red-100 text-red-700 border-red-200',
      borderLeft: 'border-l-4 border-l-red-500',
    },
    HIGH: {
      dot: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      borderLeft: 'border-l-4 border-l-orange-500',
    },
    MEDIUM: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      borderLeft: 'border-l-4 border-l-amber-500',
    },
  }[incident.severity] || {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    borderLeft: 'border-l-4 border-l-slate-400',
  };

  return (
    <div
      onClick={() => onClick(incident.id)}
      className={`p-3 bg-white rounded-md border transition-all cursor-pointer ${severityStyles.borderLeft} ${
        isSelected
          ? 'border-slate-800 ring-2 ring-slate-400 ring-offset-1 bg-slate-50/50 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${severityStyles.dot}`} />
          <span
            className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase ${severityStyles.badge}`}
          >
            {incident.severity}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {incident.minutesAgo}m ago
        </span>
      </div>

      <div className="mt-2 flex items-center space-x-2.5">
        <div className="p-1.5 rounded bg-slate-100 text-slate-700 shrink-0">
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">
            {incident.type}
          </h4>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {incident.locationName}
          </p>
        </div>
      </div>

      {incident.peopleAffected > 0 && (
        <div className="mt-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded inline-block">
          {incident.peopleAffected} {incident.peopleAffected === 1 ? 'Person' : 'People'} Affected
        </div>
      )}
    </div>
  );
}
