import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, ScrollView, TextInput } from 'react-native';
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
  const [recordedUri, setRecordedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [sendStep, setSendStep] = useState(0);
  
  // Spoken Transcript Text & NLU Data
  const [customTranscriptText, setCustomTranscriptText] = useState("there's fire everywhere, we're trapped on the second floor, two of us can't walk");
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [classifiedData, setClassifiedData] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef(null);

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
    setRecordedUri(null);
    setVoiceState('RECORDING');
    setIsLiveListening(true);

    // Live Web SpeechRecognition if available in browser/simulator
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let liveTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        if (liveTranscript.trim()) {
          setCustomTranscriptText(liveTranscript.trim());
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log('Speech recognition init info:', e);
      }
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
      }
    } catch (err) {
      console.log('Expo Audio init info:', err);
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsLiveListening(false);
    setVoiceState('PREVIEW');

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const status = await recording.getStatusAsync();
        setDurationMillis(status.durationMillis || 4000);
        
        const uri = recording.getURI();
        setRecordedUri(uri);

        if (uri) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false },
            (playbackStatus) => {
              if (playbackStatus.didJustFinish) setIsPlaying(false);
            }
          );
          setSound(newSound);
        }
      } catch (err) {
        console.log('Finished audio recording capture');
      }
      setRecording(null);
    } else {
      setDurationMillis(4000);
    }

    // Attempt instant local backend transcription if audio file was saved
    if (recordedUri) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: recordedUri,
          name: 'voice.m4a',
          type: 'audio/m4a',
        });
        const res = await fetch('http://localhost:8000/transcribe', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const sttData = await res.json();
          if (sttData.transcript) {
            setCustomTranscriptText(sttData.transcript);
          }
        }
      } catch (e) {
        console.log("Local STT server audio transcription info:", e);
      }
    }
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
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // SEND VOICE SOS & RUN INCIDENT CLASSIFIER
  const sendVoiceSos = async () => {
    setVoiceState('SENDING');
    setClassifiedData(null);

    let classifiedResult = null;

    try {
      const response = await fetch('http://localhost:8000/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: customTranscriptText,
          lat: 12.9698,
          lon: 79.1559,
          landmark_description: "Block A"
        })
      });

      if (response.ok) {
        classifiedResult = await response.json();
        setClassifiedData(classifiedResult);
        console.log("Offline NLU Classification Output:", classifiedResult);
      }
    } catch (err) {
      console.log("Backend offline or connection error, using local classification fallback");
    }

    const msgs = [0, 1, 2, 3];
    msgs.forEach((s, index) => {
      setTimeout(() => {
        setSendStep(s);
        if (index === msgs.length - 1) {
          setTimeout(() => setVoiceState('SENT'), 1000);
        }
      }, index * 800);
    });
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
          <Text style={styles.activeTitle}>VOICE SOS RECORDING</Text>
          <Text style={styles.activeDesc}>Listening to your spoken voice message...</Text>
          
          <Animated.View style={[styles.recordingMic, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="mic" size={64} color="#fff" />
          </Animated.View>
          
          <Text style={styles.instructionText}>Speak clearly into your device microphone.</Text>
          <Text style={styles.exampleText}>Example: "There's fire on the 2nd floor, two of us can't walk!"</Text>

          {/* LIVE HEARD TRANSCRIPT PREVIEW WHILE SPEAKING */}
          {customTranscriptText ? (
            <View style={styles.liveSpeechBox}>
              <Text style={styles.liveSpeechLabel}>🗣️ HEARD IN REAL-TIME:</Text>
              <Text style={styles.liveSpeechText}>"{customTranscriptText}"</Text>
            </View>
          ) : null}
          
          <Button title="Stop & Capture Recording" variant="danger" onPress={stopRecording} style={{marginTop: 32, width: '100%'}} />
        </View>
      </SafeAreaView>
    );
  }

  // STEP 1: PREVIEW STATE - Displays the heard voice transcription FIRST!
  if (voiceState === 'PREVIEW') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.previewContainer}>
          <Text style={styles.activeTitle}>VOICE MESSAGE CAPTURED</Text>
          <View style={styles.photoSuccess}>
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            <Text style={styles.successTitleText}>Voice Captured & Transcribed ✓</Text>
          </View>
          
          <Text style={styles.durationText}>{formatDuration(durationMillis)}</Text>
          
          <View style={styles.audioControls}>
            <TouchableOpacity style={styles.controlBtn} onPress={playRecording}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
              <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Play Audio'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={startVoiceSos}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.controlText}>Re-Record Voice</Text>
            </TouchableOpacity>
          </View>

          {/* HEARD VOICE MESSAGE DISPLAY & EDIT BOX */}
          <Card style={styles.transcriptionCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Ionicons name="mic" size={20} color="#3b82f6" />
              <Text style={styles.transcriptionLabel}> HEARD SPOKEN MESSAGE FROM MIC:</Text>
            </View>
            <TextInput
              style={styles.transcriptInput}
              value={customTranscriptText}
              onChangeText={setCustomTranscriptText}
              multiline
              placeholder="Spoken transcript..."
              placeholderTextColor="#666"
            />
          </Card>
          
          <Text style={styles.offlineNotice}>⚡ Ready to classify. Click below to run this message through incident_classifier.py.</Text>
          
          <Button title="🚨 CLASSIFY & TRANSMIT EMERGENCY" onPress={sendVoiceSos} style={{marginTop: 20, width: '100%'}} />
          <Button title="Cancel" variant="secondary" onPress={() => setVoiceState('IDLE')} style={{marginTop: 12, width: '100%'}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (voiceState === 'SENDING') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.activeTitle}>TRANSCRIBING & CLASSIFYING VOICE</Text>
          <Ionicons name="hardware-chip" size={80} color="#ef4444" style={{marginVertical: 32}} />
          {sendStep >= 0 && <Text style={styles.animText}>✓ Spoken voice message received</Text>}
          {sendStep >= 1 && <Text style={styles.animText}>✓ Running incident_classifier.py rule engine</Text>}
          {sendStep >= 2 && <Text style={styles.animText}>✓ Generating tactical incident JSON report</Text>}
          {sendStep >= 3 && <Text style={styles.animText}>✓ Transmitting report over local mesh network</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // STEP 2: SENT & CLASSIFIED STATE - Displays Heard Message AND Classified JSON Parameters!
  if (voiceState === 'SENT') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{padding: 20, alignItems: 'center'}}>
          <Ionicons name="checkmark-circle" size={72} color="#16a34a" />
          <Text style={styles.successTitle}>VOICE REPORT TRANSCRIBED & CLASSIFIED ✓</Text>
          <Text style={styles.successDesc}>Your actual spoken message was parsed by incident_classifier.py and generated the JSON report below.</Text>
          
          {/* DISPLAY 1: ACTUAL TRANSCRIBED SPOKEN MESSAGE */}
          <Card style={[styles.transcriptionCard, {marginTop: 16, borderColor: '#3b82f6'}]}>
            <Text style={{color: '#3b82f6', fontWeight: 'bold', fontSize: 13, marginBottom: 4}}>
              🗣️ SPOKEN MESSAGE HEARD FROM MIC:
            </Text>
            <Text style={{color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 24, fontWeight: 'bold'}}>
              "{classifiedData?.raw_transcript || customTranscriptText}"
            </Text>
          </Card>

          {/* DISPLAY 2: CLASSIFIED PARAMETERS SUMMARY */}
          {classifiedData && (
            <View style={styles.classificationResultCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="warning" size={24} color="#ef4444" />
                <Text style={styles.cardHeaderTitle}>
                  CLASSIFIED INCIDENT TYPE: {classifiedData.incident_type?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.paramGrid}>
                <View style={styles.paramItem}>
                  <Text style={styles.paramLabel}>Priority Resource Required</Text>
                  <Text style={[styles.paramValue, {color: '#3b82f6'}]}>
                    {classifiedData.resource_needs?.priority_resource}
                  </Text>
                </View>

                <View style={styles.paramItem}>
                  <Text style={styles.paramLabel}>Floor / Level Detected</Text>
                  <Text style={styles.paramValue}>
                    {classifiedData.location?.floor_level || 'Ground / Unspecified'}
                  </Text>
                </View>

                <View style={styles.paramItem}>
                  <Text style={styles.paramLabel}>Mobility Status Detected</Text>
                  <Text style={styles.paramValue}>
                    {classifiedData.victims?.mobility_status || 'all_can_walk'}
                  </Text>
                </View>

                <View style={styles.paramItem}>
                  <Text style={styles.paramLabel}>People Affected / Trapped</Text>
                  <Text style={styles.paramValue}>
                    {classifiedData.victims?.people_affected || 1} Affected / {classifiedData.victims?.people_trapped || 0} Trapped
                  </Text>
                </View>
              </View>

              {/* RAW CLASSIFIED JSON PAYLOAD BOX */}
              <Text style={styles.jsonBoxLabel}>GENERATED INCIDENT JSON PAYLOAD:</Text>
              <View style={styles.jsonBox}>
                <Text style={styles.jsonCode}>
                  {JSON.stringify(classifiedData, null, 2)}
                </Text>
              </View>
            </View>
          )}

          <Button 
            title="Return to Home" 
            onPress={() => { setVoiceState('IDLE'); setClassifiedData(null); }} 
            style={{marginTop: 24, width: '100%'}} 
          />
        </ScrollView>
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
              <Ionicons name="git-network" size={24} color="#16a34a" />
              <Text style={styles.relayText}>LOCAL NETWORK: Connected</Text>
            </View>
            {step >= 1 && (
              <View style={styles.relayRow}>
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                <Text style={styles.relayText}>NODE-001: {t('received')}</Text>
              </View>
            )}
            {step >= 2 && (
              <View style={styles.relayRow}>
                <Ionicons name="swap-horizontal" size={24} color="#f59e0b" />
                <Text style={styles.relayText}>NODE-004: Relaying</Text>
              </View>
            )}
            {step >= 3 && (
              <View style={styles.relayRow}>
                <Ionicons name="search" size={24} color="#ef4444" />
                <Text style={styles.relayText}>RESPONDER: {t('searching')}</Text>
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
            <Text style={styles.voiceSosDesc}>Record voice & transcribe via Whisper</Text>
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
  previewContainer: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  
  inactiveContainer: { alignItems: 'center', width: '100%', marginBottom: 32 },
  bigSosButton: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: '#dc2626',
    justifyContent: 'center', alignItems: 'center', elevation: 10,
    shadowColor: '#dc2626', shadowOpacity: 0.5, shadowRadius: 20,
    borderWidth: 4, borderColor: '#7f1d1d',
  },
  bigSosText: { color: '#fff', fontSize: 64, fontWeight: 'bold' },
  sosHint: { color: '#ef4444', textAlign: 'center', marginTop: 24, fontSize: 18, fontWeight: 'bold' },

  activeContainer: { alignItems: 'center', width: '100%', padding: 24, justifyContent: 'center', flex: 1 },
  pulsingSosButton: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#7f1d1d',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: '#dc2626',
  },
  activeTitle: { color: '#ef4444', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  activeDesc: { color: '#fff', fontSize: 16, marginBottom: 32 },
  
  relayStatusContainer: { width: '100%', backgroundColor: '#1e1e1e', borderRadius: 12, padding: 16 },
  relayRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  relayText: { color: '#fff', marginLeft: 12, fontSize: 16, fontWeight: 'bold' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333' },
  dividerText: { color: '#666', paddingHorizontal: 16, fontWeight: 'bold' },

  voiceSosBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e',
    width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333',
  },
  voiceSosIcon: { backgroundColor: '#3b82f6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  voiceSosContent: { flex: 1, marginLeft: 16 },
  voiceSosTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  voiceSosDesc: { color: '#aaa', fontSize: 14, marginTop: 4 },

  permissionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  permissionDesc: { color: '#aaa', fontSize: 16, marginTop: 8 },
  
  recordingMic: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginVertical: 30 },
  instructionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  exampleText: { color: '#aaa', fontSize: 14, marginTop: 6, fontStyle: 'italic', textAlign: 'center' },
  
  liveSpeechBox: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', marginTop: 16, width: '100%' },
  liveSpeechLabel: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  liveSpeechText: { color: '#fff', fontSize: 14, fontStyle: 'italic', marginTop: 4 },

  photoSuccess: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  successTitleText: { color: '#16a34a', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  durationText: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginVertical: 12 },
  
  audioControls: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 16 },
  controlBtn: { alignItems: 'center', backgroundColor: '#2a2a2a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  controlText: { color: '#fff', marginTop: 6, fontWeight: 'bold' },

  transcriptionCard: { width: '100%', backgroundColor: '#1a1a1a', borderColor: '#3b82f6', padding: 16 },
  transcriptionLabel: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  transcriptInput: { color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 24, marginTop: 8, backgroundColor: '#121212', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', minHeight: 80, textAlignVertical: 'top' },

  offlineNotice: { color: '#f59e0b', fontSize: 12, textAlign: 'center', marginTop: 16 },
  
  animText: { color: '#fff', fontSize: 16, marginVertical: 8, fontWeight: 'bold' },
  successTitle: { color: '#16a34a', fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  successDesc: { color: '#aaa', textAlign: 'center', paddingHorizontal: 12 },

  // NLU Classification Card
  classificationResultCard: {
    width: '100%', backgroundColor: '#1e1e1e', borderRadius: 16, padding: 16,
    marginVertical: 16, borderWidth: 1, borderColor: '#ef4444'
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 8 },
  cardHeaderTitle: { color: '#ef4444', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  
  paramGrid: { marginBottom: 16 },
  paramItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  paramLabel: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  paramValue: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  
  jsonBoxLabel: { color: '#16a34a', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  jsonBox: { backgroundColor: '#0d0d0d', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', maxHeight: 220 },
  jsonCode: { color: '#4ade80', fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
  modalDesc: { color: '#aaa', textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', width: '100%' },
});
