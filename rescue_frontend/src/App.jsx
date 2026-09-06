import React, { useState } from 'react';
import Header from './components/Header';
import IncidentFeed from './components/IncidentFeed';
import DisasterMap from './components/DisasterMap';
import SituationSummary from './components/SituationSummary';
import NetworkStatus from './components/NetworkStatus';
import IncidentDetails from './components/IncidentDetails';
import { initialIncidents, mockShelters } from './data/mockIncidents';

export default function App() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [shelters] = useState(mockShelters);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Automatically find highest priority incident (CRITICAL > HIGH > MEDIUM > LOW)
  const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const highestPriorityIncident = incidents.reduce((prev, curr) => {
    if (!prev) return curr;
    const currRank = severityRank[curr.severity] || 0;
    const prevRank = severityRank[prev.severity] || 0;
    if (currRank > prevRank) return curr;
    if (currRank === prevRank && curr.minutesAgo < prev.minutesAgo) return curr;
    return prev;
  }, null);

  const highestPriorityIncidentId = highestPriorityIncident?.id || null;
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // Optional hackathon demo interaction: Simulate incoming mesh broadcast incident
  const handleSimulateIncident = () => {
    const newIdNum = incidents.length + 1;
    const newIncident = {
      id: `INC-00${newIdNum}`,
      type: "SOS Signal Detected",
      severity: "CRITICAL",
      icon: "AlertTriangle",
      peopleAffected: 1,
      locationName: `Zone A · Sector ${newIdNum}`,
      latitude: 12.9730 + (Math.random() - 0.5) * 0.015,
      longitude: 79.1580 + (Math.random() - 0.5) * 0.015,
      confidence: Math.floor(Math.random() * 15) + 85,
      deviceId: `D0${Math.floor(Math.random() * 9) + 1}`,
      supportingReports: Math.floor(Math.random() * 4) + 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      minutesAgo: 0,
      status: "ACTIVE",
      description: "Emergency beacon received over LoRa hop. Distress call payload unpacked."
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-[#f0f6fc] overflow-hidden font-sans">
      {/* Top Slim Header */}
      <Header
        onSimulateIncident={handleSimulateIncident}
        hasCriticalAlert={incidents.some(i => i.severity === 'CRITICAL')}
      />

      {/* Main Command Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Section A: Live Incident Feed (Left Side Panel ~25%) */}
        <div className="w-full md:w-80 lg:w-96 h-64 md:h-full shrink-0">
          <IncidentFeed
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            highestPriorityIncidentId={highestPriorityIncidentId}
            onSelectIncident={setSelectedIncidentId}
          />
        </div>

        {/* Section B: Disaster Map (Main Center Section ~55%) */}
        <div className="flex-1 h-full relative">
          <DisasterMap
            incidents={incidents}
            shelters={shelters}
            selectedIncidentId={selectedIncidentId}
            highestPriorityIncidentId={highestPriorityIncidentId}
            onSelectIncident={setSelectedIncidentId}
          />

          {/* Floating Details Panel overlay on top of map when an incident is selected */}
          {selectedIncident && (
            <IncidentDetails
              incident={selectedIncident}
              onClose={() => setSelectedIncidentId(null)}
            />
          )}
        </div>

        {/* Section C: Situation Summary (Right Side Panel ~20%) */}
        <div className="w-full md:w-64 lg:w-72 h-auto md:h-full shrink-0">
          <SituationSummary
            incidents={incidents}
            highestPriorityIncidentId={highestPriorityIncidentId}
          />
        </div>
      </div>

      {/* Section D: Network Status (Bottom Section) */}
      <NetworkStatus activeDeviceCount={incidents.length + 3} />
    </div>
  );
}
