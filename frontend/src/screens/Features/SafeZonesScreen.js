import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Card } from '../../components/UI';
import { MOCK_SAFE_ZONES } from '../../data/mockSafeZones';

export default function SafeZonesScreen() {
  const { t } = useTranslation();
  const [expandedZone, setExpandedZone] = useState(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {MOCK_SAFE_ZONES.map(zone => (
          <Card key={zone.id} style={styles.zoneCard}>
            <View style={styles.zoneHeader}>
              <View style={styles.zoneTitleRow}>
                <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                <Text style={styles.zoneName}>{zone.name}</Text>
              </View>
              <Text style={styles.distanceText}>{zone.distance} away</Text>
            </View>
            
            <View style={styles.zoneStats}>
              <View style={[styles.statusBadge, zone.status === 'OPEN' ? styles.bgGreen : styles.bgYellow]}>
                <Text style={[styles.statusText, zone.status === 'OPEN' ? styles.textGreen : styles.textYellow]}>
                  {zone.status}
                </Text>
              </View>
              <Text style={styles.capacityText}>{t('capacity')}: {zone.capacity}</Text>
            </View>

            <TouchableOpacity 
              style={styles.expandBtn} 
              onPress={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
            >
              <Text style={styles.expandText}>{t('offlineDirections')}</Text>
              <Ionicons name={expandedZone === zone.id ? "chevron-up" : "chevron-down"} size={20} color="#3b82f6" />
            </TouchableOpacity>

            {expandedZone === zone.id && (
              <View style={styles.directionsContainer}>
                {zone.directions.map(dir => (
                  <View key={dir.id} style={styles.directionRow}>
                    <Ionicons name={dir.icon} size={20} color="#ccc" style={styles.dirIcon} />
                    <Text style={styles.dirText}>{dir.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 16 },
  
  zoneCard: { marginBottom: 16 },
  zoneHeader: { marginBottom: 12 },
  zoneTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  zoneName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  distanceText: { color: '#aaa', marginLeft: 32 },
  
  zoneStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  bgGreen: { backgroundColor: '#052e16' },
  bgYellow: { backgroundColor: '#422006' },
  textGreen: { color: '#16a34a', fontWeight: 'bold' },
  textYellow: { color: '#f59e0b', fontWeight: 'bold' },
  capacityText: { color: '#ccc', fontSize: 14 },

  expandBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#333' },
  expandText: { color: '#3b82f6', fontWeight: 'bold' },

  directionsContainer: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginTop: 8 },
  directionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dirIcon: { width: 30 },
  dirText: { color: '#fff', fontSize: 14, flex: 1 },
});
