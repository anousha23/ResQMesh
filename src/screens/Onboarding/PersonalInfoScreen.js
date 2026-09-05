import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Input, Button } from '../../components/UI';
import { saveUserProfile } from '../../utils/storage';

export default function PersonalInfoScreen({ navigation }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bloodType, setBloodType] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    await saveUserProfile({ photo, name, age, bloodType });
    navigation.navigate('MedicalDetails');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.stepText}>{t('step1')}</Text>
        <Text style={styles.title}>{t('personalInfo')}</Text>

        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color="#666" />
              <Text style={styles.photoText}>{t('selectPhoto')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input 
          label={t('fullName')} 
          placeholder="e.g. Hargun" 
          value={name} 
          onChangeText={setName} 
        />
        <Input 
          label={t('age')} 
          placeholder="e.g. 25" 
          keyboardType="numeric" 
          value={age} 
          onChangeText={setAge} 
        />
        <Input 
          label={t('bloodType')} 
          placeholder="e.g. O+" 
          value={bloodType} 
          onChangeText={setBloodType} 
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
  photoContainer: { alignSelf: 'center', marginBottom: 24 },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  photoText: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' },
  photo: { width: 120, height: 120, borderRadius: 60 },
});
