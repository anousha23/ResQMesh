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

export default function IncidentCard({ incident, isSelected, isHighestPriority, onClick }) {
  const IconComponent = iconMap[incident.icon] || AlertTriangle;

  const severityStyles = {
    CRITICAL: {
      dot: 'bg-red-500 animate-critical-dot',
      badge: 'bg-red-950/90 text-red-400 border-red-800/80',
      borderLeft: 'border-l-4 border-l-red-500',
    },
    HIGH: {
      dot: 'bg-orange-500',
      badge: 'bg-orange-950/90 text-orange-400 border-orange-800/80',
      borderLeft: 'border-l-4 border-l-orange-500',
    },
    MEDIUM: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-950/90 text-amber-400 border-amber-800/80',
      borderLeft: 'border-l-4 border-l-amber-500',
    },
  }[incident.severity] || {
    dot: 'bg-slate-500',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    borderLeft: 'border-l-4 border-l-slate-500',
  };

  const isNew = incident.minutesAgo === 0;

  let cardStateStyle = 'border-[#30363d] hover:border-slate-600 hover:bg-[#28303d]/70 shadow-sm';
  if (isSelected) {
    cardStateStyle = 'border-slate-400 ring-2 ring-slate-400/40 bg-[#28303d] shadow-lg z-10';
  } else if (isHighestPriority) {
    cardStateStyle = 'animate-critical-card-glow bg-[#282126] shadow-[0_0_15px_rgba(239,68,68,0.3)] z-10';
  }

  return (
    <div
      onClick={() => onClick(incident.id)}
      className={`p-3 bg-[#21262d] rounded-md border transition-all cursor-pointer ${severityStyles.borderLeft} ${
        isNew ? 'animate-card-arrival' : ''
      } ${cardStateStyle}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${severityStyles.dot}`} />
          <span
            className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase ${severityStyles.badge}`}
          >
            {incident.severity}
          </span>
          {isHighestPriority && (
            <span className="text-[9px] font-black bg-red-950 text-red-300 border border-red-800/90 px-1.5 py-0.5 rounded tracking-wider uppercase animate-pulse">
              TOP PRIORITY
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {incident.minutesAgo}m ago
        </span>
      </div>

      <div className="mt-2 flex items-center space-x-2.5">
        <div className="p-1.5 rounded bg-[#161b22] text-slate-300 border border-[#30363d] shrink-0">
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-100 truncate leading-tight">
            {incident.type}
          </h4>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
            {incident.locationName}
          </p>
        </div>
      </div>

      {incident.peopleAffected > 0 && (
        <div className="mt-2 text-xs font-semibold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded inline-block">
          {incident.peopleAffected} {incident.peopleAffected === 1 ? 'Person' : 'People'} Affected
        </div>
      )}
    </div>
  );
}
