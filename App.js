import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

if (Platform.OS === 'web') {
  enableScreens(false);
}

import { LanguageProvider, useTranslation } from './src/localization';
import { isOnboardingCompleted } from './src/utils/storage';

// Screens
import PersonalInfoScreen from './src/screens/Onboarding/PersonalInfoScreen';
import MedicalDetailsScreen from './src/screens/Onboarding/MedicalDetailsScreen';
import EmergencyContactScreen from './src/screens/Onboarding/EmergencyContactScreen';

import HomeScreen from './src/screens/Main/HomeScreen';
import SOSScreen from './src/screens/Main/SOSScreen';
import ProfileScreen from './src/screens/Main/ProfileScreen';
import LogoutConfirmScreen from './src/screens/Main/LogoutConfirmScreen';

import ReportEmergencyScreen from './src/screens/Features/ReportEmergencyScreen';
import SafeZonesScreen from './src/screens/Features/SafeZonesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    primary: '#ef4444', // Red for emergency
  },
};

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SOS') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#1e1e1e' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="SOS" component={SOSScreen} options={{ title: t('sos') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const checkState = async () => {
      const completed = await isOnboardingCompleted();
      setOnboarded(completed);
      setLoading(false);
    };
    checkState();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={customDarkTheme}>
      <Stack.Navigator 
        initialRouteName={onboarded ? 'Main' : 'PersonalInfo'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="MedicalDetails" component={MedicalDetailsScreen} />
        <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
          name="ReportEmergency" 
          component={ReportEmergencyScreen} 
          options={{ 
            headerShown: true, 
            title: 'Report Emergency', 
            headerStyle: { backgroundColor: '#1e1e1e' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen 
          name="SafeZones" 
          component={SafeZonesScreen} 
          options={{ 
            headerShown: true, 
            title: 'Safe Zones', 
            headerStyle: { backgroundColor: '#1e1e1e' }, 
            headerTintColor: '#fff' 
          }} 
        />
        <Stack.Screen 
          name="LogoutConfirm" 
          component={LogoutConfirmScreen} 
          options={{ 
            headerShown: true, 
            title: 'Start Again', 
            headerStyle: { backgroundColor: '#1e1e1e' }, 
            headerTintColor: '#fff' 
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}
