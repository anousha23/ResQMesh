import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Card } from '../../components/UI';
import { MOCK_ALERTS } from '../../data/mockAlerts';

export default function AlertsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('alerts')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {MOCK_ALERTS.map(alert => (
          <Card key={alert.id} style={[
            styles.alertCard,
            alert.severity === 'HIGH' ? styles.highAlert : 
            alert.severity === 'MEDIUM' ? styles.mediumAlert : styles.lowAlert
          ]}>
            <View style={styles.alertHeader}>
              <Ionicons 
                name="warning" 
                size={20} 
                color={alert.severity === 'HIGH' ? '#ef4444' : alert.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6'} 
              />
              <Text style={[styles.alertPriority, { color: alert.severity === 'HIGH' ? '#ef4444' : alert.severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6' }]}>
                {alert.severity} PRIORITY
              </Text>
              <Text style={styles.timestamp}>{alert.timestamp}</Text>
            </View>
            <Text style={styles.alertTitle}>{alert.type}</Text>
            <Text style={styles.alertDesc}>{alert.distance} • {alert.location}</Text>
            
            <View style={[styles.alertActionBox, { backgroundColor: alert.severity === 'HIGH' ? '#7f1d1d' : alert.severity === 'MEDIUM' ? '#78350f' : '#1e3a8a' }]}>
              <Text style={styles.alertActionText}>{alert.recommendedAction}</Text>
            </View>
            
            <View style={styles.verificationRow}>
              <Ionicons name={alert.verified ? "checkmark-circle" : "help-circle"} size={16} color={alert.verified ? "#16a34a" : "#aaa"} />
              <Text style={[styles.alertVerification, { color: alert.verified ? "#16a34a" : "#aaa" }]}>
                {' '}{alert.verification}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 16, backgroundColor: '#1e1e1e', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  container: { padding: 16 },
  alertCard: { marginBottom: 16, borderWidth: 1 },
  highAlert: { borderColor: '#7f1d1d', backgroundColor: '#450a0a' },
  mediumAlert: { borderColor: '#78350f', backgroundColor: '#422006' },
  lowAlert: { borderColor: '#1e3a8a', backgroundColor: '#172554' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertPriority: { fontWeight: 'bold', marginLeft: 8, flex: 1 },
  timestamp: { color: '#aaa', fontSize: 12 },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  alertDesc: { color: '#ccc', fontSize: 14, marginBottom: 12 },
  alertActionBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  alertActionText: { color: '#fff', fontWeight: 'bold' },
  verificationRow: { flexDirection: 'row', alignItems: 'center' },
  alertVerification: { fontSize: 12, fontWeight: 'bold' },
});
