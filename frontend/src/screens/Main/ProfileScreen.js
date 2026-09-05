import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, AVAILABLE_LANGUAGES } from '../../localization';
import { Card } from '../../components/UI';
import { getUserProfile, getMedicalDetails, getEmergencyContact } from '../../utils/storage';

export default function ProfileScreen({ navigation }) {
  const { t, languageCode, changeLanguage } = useTranslation();
  
  const [profile, setProfile] = useState({});
  const [medical, setMedical] = useState({});
  const [contact, setContact] = useState({});
  const [langSelectorOpen, setLangSelectorOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const p = await getUserProfile();
      const m = await getMedicalDetails();
      const c = await getEmergencyContact();
      if (p) setProfile(p);
      if (m) setMedical(m);
      if (c) setContact(c);
    };
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          )}
          <Text style={styles.name}>{profile.name || 'User'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{profile.age || '--'} yrs</Text></View>
            <View style={[styles.badge, {backgroundColor: '#7f1d1d'}]}><Text style={[styles.badgeText, {color: '#fca5a5'}]}>{profile.bloodType || '--'}</Text></View>
          </View>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionTitle}>{t('preferredLanguage')}</Text>
        <Card style={styles.langCard}>
          <TouchableOpacity 
            style={styles.langSelector} 
            onPress={() => setLangSelectorOpen(!langSelectorOpen)}
          >
            <Ionicons name="language" size={24} color="#3b82f6" />
            <Text style={styles.currentLang}>
              {AVAILABLE_LANGUAGES.find(l => l.code === languageCode)?.name || 'English'}
            </Text>
            <Ionicons name={langSelectorOpen ? "chevron-up" : "chevron-down"} size={20} color="#aaa" />
          </TouchableOpacity>
          
          {langSelectorOpen && (
            <View style={styles.langList}>
              {AVAILABLE_LANGUAGES.map(lang => (
                <TouchableOpacity 
                  key={lang.code} 
                  style={styles.langItem}
                  onPress={() => {
                    changeLanguage(lang.code);
                    setLangSelectorOpen(false);
                  }}
                >
                  <Text style={[styles.langItemText, languageCode === lang.code && styles.langItemTextActive]}>
                    {lang.name}
                  </Text>
                  {languageCode === lang.code && <Ionicons name="checkmark" size={20} color="#ef4444" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Medical Details */}
        <Text style={styles.sectionTitle}>{t('medicalDetails')}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('allergies')}</Text>
            <Text style={styles.value}>{medical.allergies || 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('medicalConditions')}</Text>
            <Text style={styles.value}>{medical.conditions || 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('medications')}</Text>
            <Text style={styles.value}>{medical.medications || 'None'}</Text>
          </View>
        </Card>

        {/* Emergency Contact */}
        <Text style={styles.sectionTitle}>{t('emergencyContact')}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('contactName')}</Text>
            <Text style={styles.value}>{contact.name || 'Not set'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('relationship')}</Text>
            <Text style={styles.value}>{contact.relationship || '--'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('phoneNumber')}</Text>
            <Text style={styles.value}>{contact.phone || '--'}</Text>
          </View>
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

  profileHeader: { alignItems: 'center', marginVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  badgeRow: { flexDirection: 'row' },
  badge: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginHorizontal: 4 },
  badgeText: { color: '#ccc', fontWeight: 'bold' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  card: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  label: { color: '#aaa', fontSize: 14 },
  value: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  langCard: { padding: 0, overflow: 'hidden' },
  langSelector: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e1e1e' },
  currentLang: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, marginLeft: 12 },
  langList: { backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#333' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  langItemText: { color: '#ccc', fontSize: 16 },
  langItemTextActive: { color: '#ef4444', fontWeight: 'bold' },
});
