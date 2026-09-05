import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Card } from '../../components/UI';
import { MOCK_NODES } from '../../data/mockNodes';

export default function NetworkScreen() {
  const { t } = useTranslation();
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep(s => (s + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('network')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
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

        {/* How it works */}
        <Text style={styles.sectionTitle}>{t('howResqmeshWorks')}</Text>
        <Card style={styles.visualCard}>
          <View style={styles.flowRow}>
            <View style={styles.flowNode}>
              <Ionicons name="phone-portrait" size={24} color="#3b82f6" />
              <Text style={styles.flowText}>{t('yourDevice')}</Text>
            </View>
            <Ionicons name="arrow-down" size={20} color={animStep >= 1 ? "#ef4444" : "#333"} />
            <View style={styles.flowNode}>
              <Ionicons name="git-commit" size={24} color="#16a34a" />
              <Text style={styles.flowText}>{t('nearbyNode')}</Text>
            </View>
            <Ionicons name="arrow-down" size={20} color={animStep >= 2 ? "#ef4444" : "#333"} />
            <View style={styles.flowNode}>
              <Ionicons name="git-network" size={24} color="#f59e0b" />
              <Text style={styles.flowText}>{t('relayNode')}</Text>
            </View>
            <Ionicons name="arrow-down" size={20} color={animStep >= 3 ? "#ef4444" : "#333"} />
            <View style={styles.flowNode}>
              <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
              <Text style={styles.flowText}>{t('responder')}</Text>
            </View>
          </View>
        </Card>

        {/* Nearby Nodes */}
        <Text style={styles.sectionTitle}>{t('nearbyNodes')}</Text>
        {MOCK_NODES.map(node => (
          <Card key={node.id} style={styles.nodeCard}>
            <View style={styles.nodeHeader}>
              <Ionicons name="hardware-chip" size={20} color="#ccc" />
              <Text style={styles.nodeId}>{node.id}</Text>
              <Text style={styles.nodeDistance}>{node.distance}</Text>
            </View>
            <View style={styles.nodeStats}>
              <View style={styles.nodeStat}>
                <Text style={styles.statLabel}>{t('signal')}</Text>
                <Text style={[styles.statValue, {color: node.signal === 'Strong' ? '#16a34a' : '#f59e0b'}]}>{node.signal}</Text>
              </View>
              <View style={styles.nodeStat}>
                <Text style={styles.statLabel}>{t('battery')}</Text>
                <Text style={styles.statValue}>{node.battery}</Text>
              </View>
              <View style={styles.nodeStat}>
                <Text style={styles.statLabel}>{t('role')}</Text>
                <Text style={styles.statValue}>{node.role}</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Message Relay */}
        <Text style={styles.sectionTitle}>{t('messageRelay')}</Text>
        <Card style={styles.relayCard}>
          <Text style={styles.relayIncident}>INC-1042</Text>
          <Text style={styles.relayPriority}>HIGH PRIORITY</Text>
          <Text style={styles.relayType}>Structural Collapse</Text>
          <View style={styles.relayPath}>
            <Text style={styles.pathNode}>NODE-001</Text>
            <Ionicons name="arrow-forward" size={16} color="#ef4444" />
            <Text style={styles.pathNode}>NODE-004</Text>
            <Ionicons name="arrow-forward" size={16} color="#ef4444" />
            <Text style={styles.pathNode}>NODE-007</Text>
          </View>
          <Text style={styles.relayMeta}>3 {t('hops')} • 92% {t('confidence')}</Text>
        </Card>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 16, backgroundColor: '#1e1e1e', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  container: { padding: 16 },

  networkCard: { padding: 16, backgroundColor: '#1a1a1a', borderColor: '#333', marginBottom: 24 },
  networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '100%', backgroundColor: '#333', marginHorizontal: 16 },
  networkLabel: { color: '#aaa', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  statusBadgeOffline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#450a0a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusTextOffline: { color: '#dc2626', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },
  statusBadgeOnline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#052e16', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusTextOnline: { color: '#16a34a', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  
  visualCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 24 },
  flowRow: { alignItems: 'center' },
  flowNode: { alignItems: 'center', marginVertical: 8, backgroundColor: '#2a2a2a', padding: 12, borderRadius: 12, width: 160 },
  flowText: { color: '#fff', marginTop: 4, fontWeight: 'bold', fontSize: 12 },

  nodeCard: { marginBottom: 12 },
  nodeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nodeId: { color: '#fff', fontWeight: 'bold', marginLeft: 8, flex: 1 },
  nodeDistance: { color: '#3b82f6', fontWeight: 'bold' },
  nodeStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 },
  nodeStat: { alignItems: 'center' },
  statLabel: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  relayCard: { backgroundColor: '#1e1e1e', borderColor: '#333' },
  relayIncident: { color: '#aaa', fontSize: 12 },
  relayPriority: { color: '#ef4444', fontWeight: 'bold', marginVertical: 4 },
  relayType: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  relayPath: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', padding: 12, borderRadius: 8 },
  pathNode: { color: '#ccc', fontWeight: 'bold', marginHorizontal: 4, fontSize: 12 },
  relayMeta: { color: '#aaa', fontSize: 12, marginTop: 12, textAlign: 'right' }
});
