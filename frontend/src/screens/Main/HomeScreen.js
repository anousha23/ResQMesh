import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Card } from '../../components/UI';
import { getUserProfile } from '../../utils/storage';
import { MOCK_ALERTS } from '../../data/mockAlerts';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      if (profile && profile.name) setName(profile.name);
    };
    loadProfile();
  }, []);

  const latestAlert = MOCK_ALERTS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('greeting')}, {name}</Text>
          <Text style={styles.subGreeting}>{t('protectingLocally')}</Text>
        </View>

        {/* Network Status Card */}
        <Card style={styles.networkCard}>
          <View style={styles.networkRow}>
            <View style={styles.networkCol}>
              <Text style={styles.networkLabel}>{t('internet')}</Text>
              <View style={styles.statusBadgeOffline}>
                <Ionicons name="cloud-offline" size={16} color="#dc2626" />
                <Text style={styles.statusTextOffline}>{t('offline')}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.networkCol}>
              <Text style={styles.networkLabel}>{t('localEmergencyNetwork')}</Text>
              <View style={styles.statusBadgeOnline}>
                <Ionicons name="git-network" size={16} color="#16a34a" />
                <Text style={styles.statusTextOnline}>{t('connected')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Nearby Situation */}
        <Text style={styles.sectionTitle}>{t('nearbySituation')}</Text>
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={24} color="#ef4444" />
            <Text style={styles.alertPriority}>{t('highPriority')}</Text>
          </View>
          <Text style={styles.alertTitle}>{latestAlert.type}</Text>
          <Text style={styles.alertDesc}>{latestAlert.distance} away • {latestAlert.location}</Text>
          <View style={styles.alertActionBox}>
            <Text style={styles.alertActionText}>{latestAlert.recommendedAction}</Text>
          </View>
          <Text style={styles.alertVerification}>✓ {latestAlert.verification}</Text>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButtonDanger} onPress={() => navigation.navigate('SOS')}>
            <Ionicons name="alert-circle" size={32} color="#fff" />
            <Text style={styles.actionText}>{t('sos')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ReportEmergency')}>
            <Ionicons name="megaphone" size={32} color="#ef4444" />
            <Text style={styles.actionTextSecondary}>{t('reportEmergency')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('SafeZones')}>
            <Ionicons name="shield-checkmark" size={32} color="#16a34a" />
            <Text style={styles.actionTextSecondary}>{t('findSafeZone')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Network')}>
            <Ionicons name="git-network" size={32} color="#3b82f6" />
            <Text style={styles.actionTextSecondary}>{t('network')}</Text>
          </TouchableOpacity>
        </View>

        {/* My Safety */}
        <Text style={styles.sectionTitle}>{t('mySafety')}</Text>
        <Card style={styles.safetyCard}>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>{t('location')}</Text>
            <Text style={styles.safetyValue}>Block A, Sector 4</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>{t('battery')}</Text>
            <Text style={styles.safetyValue}>78%</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>{t('sosStatus')}</Text>
            <Text style={styles.safetyValue}>Inactive</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>{t('nearestSafeZone')}</Text>
            <Text style={styles.safetyValue}>Hillview School (600m)</Text>
          </View>
        </Card>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subGreeting: { color: '#16a34a', fontSize: 14, marginTop: 4 },
  
  networkCard: { padding: 16, backgroundColor: '#1a1a1a', borderColor: '#333' },
  networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '100%', backgroundColor: '#333', marginHorizontal: 16 },
  networkLabel: { color: '#aaa', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  statusBadgeOffline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#450a0a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusTextOffline: { color: '#dc2626', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },
  statusBadgeOnline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#052e16', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusTextOnline: { color: '#16a34a', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  
  alertCard: { borderColor: '#7f1d1d', backgroundColor: '#450a0a' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertPriority: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8 },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  alertDesc: { color: '#fca5a5', fontSize: 14, marginBottom: 12 },
  alertActionBox: { backgroundColor: '#7f1d1d', padding: 12, borderRadius: 8, marginBottom: 12 },
  alertActionText: { color: '#fff', fontWeight: 'bold' },
  alertVerification: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButtonDanger: { width: '48%', backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  actionButton: { width: '48%', backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  actionText: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
  actionTextSecondary: { color: '#ccc', fontWeight: 'bold', marginTop: 8, textAlign: 'center' },

  safetyCard: { padding: 16 },
  safetyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  safetyLabel: { color: '#aaa', fontSize: 14 },
  safetyValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
