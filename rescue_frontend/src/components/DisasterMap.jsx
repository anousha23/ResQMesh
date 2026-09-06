import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

// Controller to auto-fit bounds on initial load & smoothly flyTo selected incident
function MapController({ incidents, shelters, selectedIncident }) {
  const map = useMap();

  // 1. Initial Auto-Bounds Fitting to encompass all active incidents & shelters
  useEffect(() => {
    if (!incidents || incidents.length === 0) return;

    const points = [
      ...incidents.map((i) => [i.latitude, i.longitude]),
      ...shelters.map((s) => [s.latitude, s.longitude]),
    ];

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map]);

  // 2. Smoothly flyTo selected incident when user selects from Incident Feed or Map
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selectedIncident, map]);

  return null;
}

// Minimal, non-intrusive map controls overlay
function CustomMapControls({ incidents, shelters }) {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleRecenter = () => {
    if (!incidents || incidents.length === 0) return;
    const points = [
      ...incidents.map((i) => [i.latitude, i.longitude]),
      ...shelters.map((s) => [s.latitude, s.longitude]),
    ];
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1 bg-[#161b22]/90 backdrop-blur-sm p-1.5 rounded-lg border border-[#30363d] shadow-xl">
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="p-2 text-slate-300 hover:text-white hover:bg-[#21262d] rounded transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="p-2 text-slate-300 hover:text-white hover:bg-[#21262d] rounded transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <div className="h-px bg-[#30363d] my-1" />
      <button
        onClick={handleRecenter}
        title="Show All Incidents"
        className="p-2 text-slate-300 hover:text-white hover:bg-[#21262d] rounded transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Custom Leaflet DivIcon Factory to ensure zero broken image URLs & rich SVG styling
const createCustomIcon = (incident, isSelected, isHighestPriority, isShelter = false) => {
  if (isShelter) {
    return L.divIcon({
      className: 'custom-leaflet-marker-shelter',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-700 text-white shadow-lg border-2 border-slate-950 ring-2 ring-emerald-500 transition-transform duration-200 hover:scale-125 ${
          isSelected ? 'scale-125 ring-4 ring-slate-100 z-50' : ''
        }">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }

  const { type, severity } = incident;

  let bgClass = 'bg-amber-600';
  let ringClass = 'ring-amber-500';
  let rippleHtml = '';

  if (severity === 'CRITICAL') {
    bgClass = 'bg-red-600';
    ringClass = 'ring-red-500';
    rippleHtml = `<div class="absolute w-8 h-8 rounded-full bg-red-500/50 animate-critical-dot pointer-events-none"></div>`;
  } else if (severity === 'HIGH') {
    bgClass = 'bg-orange-600';
    ringClass = 'ring-orange-500';
    rippleHtml = `<div class="absolute w-8 h-8 rounded-full bg-orange-500/35 animate-status-pulse pointer-events-none"></div>`;
  }

  const selectedPing = isSelected
    ? `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-slate-200 animate-ping pointer-events-none"></div>`
    : '';

  const selectedRing = isSelected ? 'scale-125 ring-4 ring-slate-100 z-50 shadow-2xl' : 'shadow-md';
  const glowClass = isHighestPriority ? 'animate-critical-glow z-40' : '';

  // Return SVG icon based on type
  let iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `;

  if (type.toLowerCase().includes('fire')) {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    `;
  } else if (type.toLowerCase().includes('flood') || type.toLowerCase().includes('water')) {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.595 15.12a1 1 0 00-1.127.359l-1.02 1.36" />
      </svg>
    `;
  } else if (type.toLowerCase().includes('road') || type.toLowerCase().includes('blocked')) {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    `;
  }

  return L.divIcon({
    className: 'custom-leaflet-marker-incident',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${rippleHtml}
        ${selectedPing}
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgClass} text-white border-2 border-slate-950 ring-2 ${ringClass} transition-transform duration-200 hover:scale-125 ${glowClass} ${selectedRing}">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export default function DisasterMap({
  incidents,
  shelters,
  selectedIncidentId,
  highestPriorityIncidentId,
  onSelectIncident,
}) {
  // Center near Vellore mock demo cluster coordinates
  const defaultCenter = useMemo(() => [12.973, 79.158], []);
  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId);

  return (
    <div className="relative w-full h-full bg-[#0d1117] overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Free Real Geographic Tile Provider (OpenStreetMap - No API Key, No Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          className="dark-tile-layer"
        />

        {/* Controller for Auto Fit-Bounds & FlyTo selection */}
        <MapController
          incidents={incidents}
          shelters={shelters}
          selectedIncident={selectedIncident}
        />

        {/* Minimal Floating Map Controls (Zoom In, Zoom Out, Recenter) */}
        <CustomMapControls incidents={incidents} shelters={shelters} />

        {/* Incident Markers */}
        {incidents.map((incident) => {
          const isSelected = incident.id === selectedIncidentId;
          const isHighestPriority = incident.id === highestPriorityIncidentId;
          const customIcon = createCustomIcon(incident, isSelected, isHighestPriority, false);

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectIncident(incident.id),
              }}
            >
              <Popup className="resqmesh-dark-popup">
                <div className="p-0.5 max-w-[230px]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#30363d] pb-1.5 mb-1.5">
                    <span className="font-extrabold text-xs text-slate-100 uppercase tracking-wide">
                      {incident.type}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-red-600'
                          : incident.severity === 'HIGH'
                          ? 'bg-orange-600'
                          : 'bg-amber-600'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-300">
                    <p><strong className="text-slate-400">Location:</strong> {incident.locationName}</p>
                    {incident.peopleAffected > 0 && (
                      <p><strong className="text-slate-400">People Affected:</strong> <span className="font-bold text-red-400">{incident.peopleAffected}</span></p>
                    )}
                    <p><strong className="text-slate-400">Confidence:</strong> {incident.confidence}%</p>
                    <p><strong className="text-slate-400">Device Node:</strong> <code className="text-slate-200 bg-[#21262d] border border-[#30363d] px-1.5 py-0.5 rounded font-mono">{incident.deviceId}</code></p>
                    <p><strong className="text-slate-400">Reported:</strong> {incident.timestamp} ({incident.minutesAgo}m ago)</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Shelter / Safe Location Markers */}
        {shelters.map((shelter) => {
          const isSelected = shelter.id === selectedIncidentId;
          const customIcon = createCustomIcon(shelter, isSelected, false, true);

          return (
            <Marker
              key={shelter.id}
              position={[shelter.latitude, shelter.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectIncident(shelter.id),
              }}
            >
              <Popup className="resqmesh-dark-popup">
                <div className="p-0.5 max-w-[210px]">
                  <span className="font-extrabold text-xs text-emerald-400 block border-b border-[#30363d] pb-1 mb-1.5">
                    🟢 {shelter.name}
                  </span>
                  <p className="text-[11px] text-slate-300 space-y-1">
                    <strong className="text-slate-400">Location:</strong> {shelter.locationName}<br />
                    <strong className="text-slate-400">Capacity:</strong> {shelter.capacity}<br />
                    <strong className="text-slate-400">Medical Supplies:</strong> <span className="text-emerald-400 font-bold">{shelter.medicalSupplies}</span><br />
                    <strong className="text-slate-400">Status:</strong> <span className="text-emerald-400 font-bold">{shelter.status}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

