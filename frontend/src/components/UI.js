import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TextInput, View } from 'react-native';

export const Button = ({ title, onPress, variant = 'primary', style }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, variant === 'secondary' && styles.secondaryButton, variant === 'danger' && styles.dangerButton, style]} 
      onPress={onPress}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const Input = ({ label, ...props }) => (
  <View style={styles.inputContainer}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput 
      style={styles.input}
      placeholderTextColor="#666"
      {...props}
    />
  </View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#ef4444',
  },
  inputContainer: {
    marginVertical: 12,
    width: '100%',
  },
  label: {
    color: '#aaa',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  }
});
