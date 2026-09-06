import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../../localization';
import { Card } from '../../components/UI';
import { getUserProfile } from '../../utils/storage';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const profile = await getUserProfile();
        if (profile && profile.name) {
          setName(profile.name);
        } else {
          setName('');
        }
      };
      loadProfile();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('greeting')}{name ? `, ${name}` : ''}</Text>
          <Text style={styles.subGreeting}>{t('protectingLocally')}</Text>
        </View>

        {/* Network Status Card - Minimal User-Friendly */}
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
                <Ionicons name="radio" size={16} color="#16a34a" />
                <Text style={styles.statusTextOnline}>{t('connected')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Compact User-Facing Emergency Card */}
        <Text style={styles.sectionTitle}>{t('nearbySituation')}</Text>
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertTitleRow}>
              <Ionicons name="warning" size={20} color="#ef4444" />
              <Text style={styles.alertBadgeText}>⚠️ {t('emergencyNearby')}</Text>
            </View>
            <View style={styles.priorityTag}>
              <Text style={styles.priorityTagText}>{t('highPriority')}</Text>
            </View>
          </View>
          <Text style={styles.alertTitle}>Structural Damage</Text>
          <Text style={styles.alertDesc}>{t('emergencyNearbyDesc')}</Text>
          <View style={styles.alertActionBox}>
            <Ionicons name="navigate-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.alertActionText}>{t('emergencyNearbyAction')}</Text>
          </View>
          <Text style={styles.alertVerification}>✓ {t('verifiedAdvisory')}</Text>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.quickActionsContainer}>
          {/* Main SOS Banner */}
          <TouchableOpacity 
            style={styles.actionButtonDanger} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SOS')}
          >
            <Ionicons name="alert-circle" size={32} color="#fff" />
            <View style={styles.actionDangerTextContainer}>
              <Text style={styles.actionDangerTitle}>{t('sos')}</Text>
              <Text style={styles.actionDangerSubtitle}>Emergency assistance request</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
          
          {/* Secondary Actions Grid */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ReportEmergency')}
            >
              <Ionicons name="megaphone" size={28} color="#ef4444" />
              <Text style={styles.actionTextSecondary}>{t('reportEmergency')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SafeZones')}
            >
              <Ionicons name="shield-checkmark" size={28} color="#16a34a" />
              <Text style={styles.actionTextSecondary}>{t('findSafeZone')}</Text>
            </TouchableOpacity>
          </View>
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
  
  alertCard: { borderColor: '#7f1d1d', backgroundColor: '#450a0a', borderWidth: 1, padding: 16 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center' },
  alertBadgeText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
  priorityTag: { backgroundColor: '#7f1d1d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityTagText: { color: '#fca5a5', fontSize: 10, fontWeight: 'bold' },
  alertTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  alertDesc: { color: '#fca5a5', fontSize: 13, marginBottom: 12 },
  alertActionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7f1d1d', padding: 10, borderRadius: 8, marginBottom: 10 },
  alertActionText: { color: '#fff', fontWeight: 'bold', fontSize: 13, flex: 1 },
  alertVerification: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  quickActionsContainer: { marginBottom: 8 },
  actionButtonDanger: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ef4444', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 12 
  },
  actionDangerTextContainer: { flex: 1, marginLeft: 14 },
  actionDangerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionDangerSubtitle: { color: '#fee2e2', fontSize: 12, marginTop: 2 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { 
    width: '48%', 
    backgroundColor: '#1e1e1e', 
    borderWidth: 1, 
    borderColor: '#333', 
    padding: 18, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  actionTextSecondary: { color: '#ccc', fontWeight: 'bold', marginTop: 10, fontSize: 13, textAlign: 'center' },

  safetyCard: { padding: 16 },
  safetyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  safetyLabel: { color: '#aaa', fontSize: 14 },
  safetyValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
