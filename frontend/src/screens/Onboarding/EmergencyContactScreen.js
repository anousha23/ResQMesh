import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from '../../localization';
import { Input, Button } from '../../components/UI';
import { saveEmergencyContact, getEmergencyContact, completeOnboarding } from '../../utils/storage';

export default function EmergencyContactScreen({ navigation }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadContact = async () => {
      const existing = await getEmergencyContact();
      if (existing) {
        if (existing.name) setName(existing.name);
        if (existing.relationship) setRelationship(existing.relationship);
        if (existing.phone) setPhone(existing.phone);
      }
    };
    loadContact();
  }, []);

  const handleFinish = async () => {
    await saveEmergencyContact({ name, relationship, phone });
    await completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.stepText}>{t('step3')}</Text>
        <Text style={styles.title}>{t('emergencyContact')}</Text>

        <Input 
          label={t('contactName')} 
          placeholder="e.g. John Doe" 
          value={name} 
          onChangeText={setName} 
        />
        <Input 
          label={t('relationship')} 
          placeholder="e.g. Parent, Sibling" 
          value={relationship} 
          onChangeText={setRelationship} 
        />
        <Input 
          label={t('phoneNumber')} 
          placeholder="e.g. +91 98765 43210" 
          keyboardType="phone-pad"
          value={phone} 
          onChangeText={setPhone} 
        />

        <Button 
          title={t('enterResqmesh')} 
          onPress={handleFinish} 
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 24 },
  stepText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
});
