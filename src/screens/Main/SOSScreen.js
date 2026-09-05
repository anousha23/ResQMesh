import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTranslation } from '../../localization';
import { Button, Card } from '../../components/UI';

export default function SOSScreen() {
  const { t } = useTranslation();
  
  // Normal SOS State
  const [active, setActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Voice SOS State
  const [voiceState, setVoiceState] = useState('IDLE'); // IDLE, PERMISSION_DENIED, RECORDING, PREVIEW, SENDING, SENT
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [sendStep, setSendStep] = useState(0);
  
  // Animation for recording mic
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- Normal SOS Logic ---
  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => {
        setStep(s => (s < 3 ? s + 1 : s));
      }, 2000);
    } else {
      setStep(0);
    }
    return () => clearInterval(interval);
  }, [active]);

  const handleActivateNormalSos = () => {
    setModalVisible(false);
    setActive(true);
  };

  // --- Voice SOS Logic ---
  useEffect(() => {
    if (voiceState === 'RECORDING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [voiceState]);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const startVoiceSos = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setVoiceState('PERMISSION_DENIED');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setVoiceState('RECORDING');
    } catch (err) {
      console.error('Failed to start recording', err);
      setVoiceState('PERMISSION_DENIED');
    }
  };

  const stopRecording = async () => {
    setVoiceState('PREVIEW');
    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      setDurationMillis(status.durationMillis);
      
      const uri = recording.getURI();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (playbackStatus) => {
          if (playbackStatus.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );
      setSound(newSound);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
    setRecording(null);
  };

  const playRecording = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.replayAsync();
        setIsPlaying(true);
      }
    }
  };

  const sendVoiceSos = () => {
    setVoiceState('SENDING');
    const msgs = [0, 1, 2, 3, 4];
    msgs.forEach((s, index) => {
      setTimeout(() => {
        setSendStep(s);
        if (index === msgs.length - 1) {
          setTimeout(() => setVoiceState('SENT'), 1500);
        }
      }, index * 1000);
    });
    
    // Create mock incident object here as requested
    const incidentPacket = {
      incidentId: "SOS-VOICE-1042",
      type: "VOICE_SOS",
      severity: "CRITICAL",
      audioUri: "mock_uri_for_demo",
      transcription: "I am trapped inside a building near Block A. Please send help.",
      timestamp: new Date().toISOString(),
      location: "Block A",
      status: "DISPATCHED"
    };
    console.log("Created Incident:", incidentPacket);
  };

  const formatDuration = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Rendering ---
  
  if (voiceState === 'PERMISSION_DENIED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="mic-off" size={64} color="#ef4444" style={{marginBottom: 24}} />
          <Text style={styles.permissionTitle}>Microphone access is required</Text>
          <Text style={styles.permissionDesc}>to use Voice SOS.</Text>
          <Button title="Allow Microphone" onPress={startVoiceSos} style={{marginTop: 32, width: '100%'}} />
          <Button title="Cancel" variant="secondary" onPress={() => setVoiceState('IDLE')} style={{marginTop: 16, width: '100%'}} />
        </View>
      </SafeAreaView>
    );
  }

  if (voiceState === 'RECORDING') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.activeTitle}>VOICE SOS</Text>
          <Text style={styles.activeDesc}>Listening...</Text>
          
          <Animated.View style={[styles.recordingMic, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="mic" size={64} color="#fff" />
          </Animated.View>
          
          <Text style={styles.instructionText}>Speak clearly about your emergency.</Text>
          <Text style={styles.exampleText}>Example: "I am trapped inside a building"</Text>
          
          <Button title="Stop Recording" variant="danger" onPress={stopRecording} style={{marginTop: 64, width: '100%'}} />
        </View>
      </SafeAreaView>
    );
  }

  if (voiceState === 'PREVIEW') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.previewContainer}>
          <Text style={styles.activeTitle}>VOICE SOS</Text>
          <View style={styles.photoSuccess}>
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            <Text style={styles.successTitleText}>Recording captured ✓</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(durationMillis)}</Text>
          
          <View style={styles.audioControls}>
            <TouchableOpacity style={styles.controlBtn} onPress={playRecording}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
              <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={startVoiceSos}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.controlText}>Record Again</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.transcriptionCard}>
            <Text style={styles.transcriptionLabel}>TRANSCRIPTION</Text>
            <Text style={styles.transcriptionText}>"I am trapped inside a building near Block A. Please send help."</Text>
          </Card>
          
          <Text style={styles.offlineNotice}>Internet unavailable. Voice SOS will be transmitted through the local emergency network.</Text>
          
          <Button title="🚨 SEND VOICE SOS" onPress={sendVoiceSos} style={{marginTop: 24, width: '100%'}} />
          <Button title="Cancel" variant="secondary" onPress={() => setVoiceState('IDLE')} style={{marginTop: 16, width: '100%'}} />
        </View>
      </SafeAreaView>
    );
  }

  if (voiceState === 'SENDING') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.activeTitle}>PROCESSING VOICE SOS</Text>
          <Ionicons name="radio" size={80} color="#ef4444" style={{marginVertical: 32}} />
          {sendStep >= 0 && <Text style={styles.animText}>✓ {t('voiceCaptured')}</Text>}
          {sendStep >= 1 && <Text style={styles.animText}>✓ {t('emergencyMessageCreated')}</Text>}
          {sendStep >= 2 && <Text style={styles.animText}>✓ {t('broadcastingLocally')}</Text>}
          {sendStep >= 3 && <Text style={styles.animText}>✓ {t('networkConnected')}</Text>}
          {sendStep >= 4 && <Text style={styles.animText}>✓ {t('respondersAlerted')}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (voiceState === 'SENT') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          <Text style={styles.successTitle}>VOICE SOS SENT ✓</Text>
          <Text style={styles.successDesc}>Your emergency voice message has been broadcast through the local emergency network.</Text>
          <Button title="Done" onPress={() => setVoiceState('IDLE')} style={{marginTop: 32, width: '100%'}} />
        </View>
      </SafeAreaView>
    );
  }

  // Active Standard SOS
  if (active) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.activeContainer}>
          <View style={styles.pulsingSosButton}>
            <Text style={styles.bigSosText}>SOS</Text>
          </View>
          <Text style={styles.activeTitle}>{t('sosActive')}</Text>
          <Text style={styles.activeDesc}>{t('relaying')}</Text>

          <View style={styles.relayStatusContainer}>
            <View style={styles.relayRow}>
              <Ionicons name="radio" size={24} color="#16a34a" />
              <Text style={styles.relayText}>LOCAL NETWORK: Connected</Text>
            </View>
            {step >= 1 && (
              <View style={styles.relayRow}>
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                <Text style={styles.relayText}>EMERGENCY SIGNAL: Broadcasted</Text>
              </View>
            )}
            {step >= 2 && (
              <View style={styles.relayRow}>
                <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
                <Text style={styles.relayText}>ResQMesh Network: Active</Text>
              </View>
            )}
            {step >= 3 && (
              <View style={styles.relayRow}>
                <Ionicons name="search" size={24} color="#ef4444" />
                <Text style={styles.relayText}>Responders: Alerted</Text>
              </View>
            )}
          </View>

          <Button 
            title={t('cancelSos')} 
            variant="secondary" 
            onPress={() => setActive(false)} 
            style={{ marginTop: 40, width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // IDLE STATE (Normal view)
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.inactiveContainer}>
          <TouchableOpacity style={styles.bigSosButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.bigSosText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.sosHint}>I NEED HELP</Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.voiceSosBtn} onPress={startVoiceSos}>
          <View style={styles.voiceSosIcon}>
            <Ionicons name="mic" size={32} color="#fff" />
          </View>
          <View style={styles.voiceSosContent}>
            <Text style={styles.voiceSosTitle}>VOICE SOS</Text>
            <Text style={styles.voiceSosDesc}>Speak your emergency</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        {/* Confirmation Modal for Standard SOS */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={styles.modalTitle}>{t('activateSos')}</Text>
              <Text style={styles.modalDesc}>{t('sosWarning')}</Text>
              <View style={styles.modalActions}>
                <Button title={t('cancel')} variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
                <Button title={t('activate')} variant="danger" onPress={handleActivateNormalSos} style={{ flex: 1, marginLeft: 8 }} />
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  previewContainer: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  
  // Normal SOS
  inactiveContainer: { alignItems: 'center', width: '100%', marginBottom: 32 },
  bigSosButton: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: '#dc2626',
    justifyContent: 'center', alignItems: 'center', elevation: 10,
    shadowColor: '#dc2626', shadowOpacity: 0.5, shadowRadius: 20,
    borderWidth: 4, borderColor: '#7f1d1d',
  },
  bigSosText: { color: '#fff', fontSize: 64, fontWeight: 'bold' },
  sosHint: { color: '#ef4444', textAlign: 'center', marginTop: 24, fontSize: 18, fontWeight: 'bold' },

  // Active Standard SOS
  activeContainer: { alignItems: 'center', width: '100%', padding: 24, justifyContent: 'center', flex: 1 },
  pulsingSosButton: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#7f1d1d',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: '#dc2626',
  },
  activeTitle: { color: '#ef4444', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  activeDesc: { color: '#fff', fontSize: 16, marginBottom: 32 },
  
  relayStatusContainer: { width: '100%', backgroundColor: '#1e1e1e', borderRadius: 12, padding: 16 },
  relayRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  relayText: { color: '#fff', marginLeft: 12, fontSize: 16, fontWeight: 'bold' },

  // OR Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#666', paddingHorizontal: 16, fontWeight: 'bold' },

  // Voice SOS Button
  voiceSosBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e',
    width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333',
  },
  voiceSosIcon: { backgroundColor: '#3b82f6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  voiceSosContent: { flex: 1, marginLeft: 16 },
  voiceSosTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  voiceSosDesc: { color: '#aaa', fontSize: 14, marginTop: 4 },

  // Voice States
  permissionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  permissionDesc: { color: '#aaa', fontSize: 16, marginTop: 8 },
  
  recordingMic: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginVertical: 40 },
  instructionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  exampleText: { color: '#aaa', fontSize: 14, marginTop: 8, fontStyle: 'italic' },
  
  photoSuccess: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  successTitleText: { color: '#16a34a', fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  durationText: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginVertical: 16 },
  
  audioControls: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 24 },
  controlBtn: { alignItems: 'center', backgroundColor: '#2a2a2a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  controlText: { color: '#fff', marginTop: 8, fontWeight: 'bold' },

  transcriptionCard: { width: '100%', backgroundColor: '#1a1a1a', borderColor: '#333' },
  transcriptionLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  transcriptionText: { color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 24 },

  offlineNotice: { color: '#f59e0b', fontSize: 12, textAlign: 'center', marginTop: 24 },
  
  animText: { color: '#fff', fontSize: 16, marginVertical: 8, fontWeight: 'bold' },
  successTitle: { color: '#16a34a', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  successDesc: { color: '#aaa', textAlign: 'center', paddingHorizontal: 24 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
  modalDesc: { color: '#aaa', textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', width: '100%' },
});
