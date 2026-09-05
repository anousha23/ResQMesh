import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@resqmesh_onboarding_completed',
  USER_PROFILE: '@resqmesh_user_profile',
  MEDICAL_DETAILS: '@resqmesh_medical_details',
  EMERGENCY_CONTACT: '@resqmesh_emergency_contact',
  LANGUAGE: '@resqmesh_language',
  INCIDENTS: '@resqmesh_incidents',
};

export const setItem = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, jsonValue);
    } else {
      await AsyncStorage.setItem(key, jsonValue);
    }
  } catch (e) {
    console.error(`Error setting item for key ${key}:`, e);
  }
};

export const getItem = async (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const jsonValue = window.localStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    }
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error(`Error getting item for key ${key}:`, e);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.error(`Error removing item for key ${key}:`, e);
  }
};

export const completeOnboarding = async () => {
  await setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
};

export const isOnboardingCompleted = async () => {
  const completed = await getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return !!completed;
};

export const saveUserProfile = async (profileData) => {
  await setItem(STORAGE_KEYS.USER_PROFILE, profileData);
};

export const getUserProfile = async () => {
  return await getItem(STORAGE_KEYS.USER_PROFILE);
};

export const saveMedicalDetails = async (medicalData) => {
  await setItem(STORAGE_KEYS.MEDICAL_DETAILS, medicalData);
};

export const getMedicalDetails = async () => {
  return await getItem(STORAGE_KEYS.MEDICAL_DETAILS);
};

export const saveEmergencyContact = async (contactData) => {
  await setItem(STORAGE_KEYS.EMERGENCY_CONTACT, contactData);
};

export const getEmergencyContact = async () => {
  return await getItem(STORAGE_KEYS.EMERGENCY_CONTACT);
};

export const setLanguage = async (languageCode) => {
  await setItem(STORAGE_KEYS.LANGUAGE, languageCode);
};

export const getLanguage = async () => {
  const lang = await getItem(STORAGE_KEYS.LANGUAGE);
  return lang || 'en';
};

export const saveIncident = async (incident) => {
  const existing = await getIncidents();
  existing.push(incident);
  await setItem(STORAGE_KEYS.INCIDENTS, existing);
};

export const getIncidents = async () => {
  const incidents = await getItem(STORAGE_KEYS.INCIDENTS);
  return incidents || [];
};

export default STORAGE_KEYS;
