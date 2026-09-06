import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../localization';
import { Button, Card } from '../../components/UI';
import { resetUserData } from '../../utils/storage';

export default function LogoutConfirmScreen({ navigation }) {
  const { t } = useTranslation();

  const handleConfirmLogout = async () => {
    // Clear user profile, medical details, emergency contact, and onboarding state
    await resetUserData();

    // Reset navigation stack back to Step 1 of the 3-step onboarding flow
    navigation.reset({
      index: 0,
      routes: [{ name: 'PersonalInfo' }],
    });
  };

  const handleCancel = () => {
    // Return safely to Profile without modifying any data
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={52} color="#ef4444" />
          </View>
        </View>

        <Text style={styles.title}>{t('logoutConfirmTitle')}</Text>

        <Card style={styles.warningCard}>
          <Text style={styles.warningText}>
            {t('logoutConfirmMessage')}
          </Text>
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#aaa" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            You will need to enter your personal, medical, and emergency contact details again.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title={t('logoutConfirmButton')}
            variant="danger"
            onPress={handleConfirmLogout}
            style={styles.confirmButton}
          />
          <Button
            title={t('cancel')}
            variant="secondary"
            onPress={handleCancel}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#450a0a',
    borderWidth: 2,
    borderColor: '#7f1d1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  warningText: {
    color: '#e5e5e5',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    marginBottom: 32,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
  },
  confirmButton: {
    marginBottom: 12,
  },
  cancelButton: {
    borderColor: '#555',
  },
});
