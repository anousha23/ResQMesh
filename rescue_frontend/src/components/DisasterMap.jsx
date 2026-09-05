import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Component to dynamically pan map when an incident is selected
function MapController({ selectedIncident }) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 15, {
        duration: 1.2,
      });
    }
  }, [selectedIncident, map]);

  return null;
}

// Helper to generate Leaflet divIcons for cleanly styled markers without broken images
const createCustomIcon = (type, severity, isSelected, isShelter = false) => {
  if (isShelter) {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white ring-2 ring-emerald-400">
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

  let bgClass = 'bg-amber-500';
  let ringClass = 'ring-amber-300';
  if (severity === 'CRITICAL') {
    bgClass = 'bg-red-600';
    ringClass = 'ring-red-400';
  } else if (severity === 'HIGH') {
    bgClass = 'bg-orange-500';
    ringClass = 'ring-orange-300';
  }

  const selectedRing = isSelected ? 'scale-125 ring-4 ring-slate-900 z-50 shadow-2xl' : 'shadow-md';

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
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgClass} border-2 border-white ring-2 ${ringClass} transition-transform duration-200 ${selectedRing}">
        ${iconSvg}
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
  onSelectIncident,
}) {
  // Center near the mock cluster coordinates
  const defaultCenter = [12.973, 79.158];
  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId);

  return (
    <div className="relative w-full h-full bg-slate-200 overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedIncident={selectedIncident} />

        {/* Incident Markers */}
        {incidents.map((incident) => {
          const isSelected = incident.id === selectedIncidentId;
          const customIcon = createCustomIcon(
            incident.type,
            incident.severity,
            isSelected
          );

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectIncident(incident.id),
              }}
            >
              <Popup className="resqmesh-popup">
                <div className="p-1 max-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1">
                    <span className="font-extrabold text-xs text-slate-900 uppercase">
                      {incident.type}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-red-500'
                          : incident.severity === 'HIGH'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-600">
                    <p><strong>Priority:</strong> {incident.severity}</p>
                    <p><strong>Confidence:</strong> {incident.confidence}%</p>
                    <p><strong>Device:</strong> {incident.deviceId}</p>
                    <p><strong>Supporting Reports:</strong> {incident.supportingReports}</p>
                    <p><strong>Reported:</strong> {incident.timestamp}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Shelter Markers */}
        {shelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.latitude, shelter.longitude]}
            icon={createCustomIcon(shelter.name, 'SAFE', false, true)}
          >
            <Popup>
              <div className="p-1 max-w-[200px]">
                <span className="font-extrabold text-xs text-emerald-700 block mb-1">
                  🟢 {shelter.name}
                </span>
                <p className="text-[11px] text-slate-600">
                  <strong>Location:</strong> {shelter.locationName}<br />
                  <strong>Capacity:</strong> {shelter.capacity}<br />
                  <strong>Status:</strong> {shelter.status}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
