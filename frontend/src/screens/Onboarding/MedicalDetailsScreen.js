import React, { useState } from 'react';
import { Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from '../../localization';
import { Input, Button } from '../../components/UI';
import { saveMedicalDetails } from '../../utils/storage';

export default function MedicalDetailsScreen({ navigation }) {
  const { t } = useTranslation();
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');

  const handleNext = async () => {
    await saveMedicalDetails({ allergies, conditions, medications });
    navigation.navigate('EmergencyContact');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.stepText}>{t('step2')}</Text>
        <Text style={styles.title}>{t('medicalDetails')}</Text>

        <Input 
          label={t('allergies')} 
          placeholder="e.g. Peanuts, Penicillin" 
          value={allergies} 
          onChangeText={setAllergies} 
        />
        <Input 
          label={t('medicalConditions')} 
          placeholder="e.g. Asthma, Diabetes" 
          value={conditions} 
          onChangeText={setConditions} 
        />
        <Input 
          label={t('medications')} 
          placeholder="e.g. Inhaler, Insulin" 
          value={medications} 
          onChangeText={setMedications} 
        />

        <Button 
          title={t('next')} 
          onPress={handleNext} 
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
