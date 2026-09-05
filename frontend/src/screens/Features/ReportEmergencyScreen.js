import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Button, Input, Card } from '../../components/UI';

export default function ReportEmergencyScreen({ navigation }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SENT
  const [sendStep, setSendStep] = useState(0);

  const categories = [
    { id: 'fire', icon: 'flame', name: t('fire') },
    { id: 'flood', icon: 'water', name: t('flood') },
    { id: 'earthquake', icon: 'pulse', name: t('earthquake') },
    { id: 'structural', icon: 'business', name: t('structuralCollapse') },
    { id: 'accident', icon: 'car', name: t('accident') },
    { id: 'landslide', icon: 'filter', name: t('landslide') },
    { id: 'other', icon: 'help-circle', name: t('other') },
  ];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    setStatus('SENDING');
  };

  useEffect(() => {
    if (status === 'SENDING') {
      const msgs = [0, 1, 2, 3];
      msgs.forEach((step, index) => {
        setTimeout(() => {
          setSendStep(step);
          if (index === msgs.length - 1) {
            setTimeout(() => setStatus('SENT'), 1000);
          }
        }, index * 1000);
      });
    }
  }, [status]);

  if (status === 'SENT') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
        <Text style={styles.successTitle}>{t('reportSent')}</Text>
        <Text style={styles.successDesc}>{t('reportSentDesc')}</Text>
        <Button title={t('home')} onPress={() => navigation.navigate('Home')} style={{marginTop: 32}} />
      </View>
    );
  }

  if (status === 'SENDING') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="radio" size={80} color="#ef4444" style={{marginBottom: 24}} />
        {sendStep >= 0 && <Text style={styles.animText}>✓ {t('creatingIncident')}</Text>}
        {sendStep >= 1 && <Text style={styles.animText}>✓ {t('classifyingEmergency')}</Text>}
        {sendStep >= 2 && <Text style={styles.animText}>✓ {t('packagingEvidence')}</Text>}
        {sendStep >= 3 && <Text style={styles.animText}>✓ {t('broadcastingLocally')}</Text>}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding: 16, paddingBottom: 40}}>
      
      <Text style={styles.sectionTitle}>{t('categories')}</Text>
      <View style={styles.grid}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.catButton, selectedCategory === cat.id && styles.catButtonActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons name={cat.icon} size={24} color={selectedCategory === cat.id ? "#fff" : "#ef4444"} />
            <Text style={[styles.catText, selectedCategory === cat.id && {color: '#fff'}]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input 
        label={t('description')} 
        placeholder="Optional details..." 
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.input, {height: 80}]}
      />

      <Text style={styles.sectionTitle}>{t('evidence')}</Text>
      <Card style={styles.evidenceCard}>
        {photo ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <View style={styles.photoSuccess}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.photoSuccessText}>{t('photoAttached')}</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => setPhoto(null)}>
              <Text style={styles.removeBtnText}>{t('remove')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Ionicons name="camera" size={32} color="#666" />
            <Text style={styles.addPhotoText}>Attach Photo</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Button 
        title={t('submit')} 
        onPress={handleSubmit} 
        variant={selectedCategory ? "primary" : "secondary"}
        style={{marginTop: 32}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centerContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catButton: { width: '48%', backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center' },
  catButtonActive: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  catText: { color: '#aaa', marginLeft: 8, fontWeight: 'bold' },
  
  input: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#333', textAlignVertical: 'top' },
  
  evidenceCard: { alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { alignItems: 'center', padding: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 12, width: '100%' },
  addPhotoText: { color: '#666', marginTop: 8 },
  
  photoPreviewContainer: { width: '100%', alignItems: 'center' },
  photoPreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  photoSuccess: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  photoSuccessText: { color: '#16a34a', fontWeight: 'bold', marginLeft: 8 },
  removeBtn: { padding: 8, backgroundColor: '#333', borderRadius: 8 },
  removeBtnText: { color: '#ff4444', fontWeight: 'bold' },

  animText: { color: '#fff', fontSize: 16, marginVertical: 8, fontWeight: 'bold' },
  successTitle: { color: '#16a34a', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  successDesc: { color: '#aaa', textAlign: 'center' },
});
