import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CheckInScreen = () => {
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [checkedInPlayers, setCheckedInPlayers] = useState<string[]>([]);
  const [checkInMessage, setCheckInMessage] = useState('');

  useEffect(() => {
    loadPlayers();
    loadCheckedIn();
  }, []);

  const normalize = (str: string) => str.trim().toLowerCase();

  const loadPlayers = async () => {
    try {
      const stored = await AsyncStorage.getItem('players');
      if (stored) {
        setPlayers(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    }
  };

  const loadCheckedIn = async () => {
    try {
      const stored = await AsyncStorage.getItem('checkedInPlayers');
      if (stored) {
        setCheckedInPlayers(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load check-ins:', err);
    }
  };

  const saveCheckedIn = async (updatedList: string[]) => {
    await AsyncStorage.setItem('checkedInPlayers', JSON.stringify(updatedList));
    setCheckedInPlayers(updatedList);
  };

  const checkInPlayer = () => {
    const inputName = name.trim();
    if (!inputName) return;

    const lowerInput = normalize(inputName);
    const found = players.find((p) => normalize(p) === lowerInput);

    if (found) {
      if (!checkedInPlayers.includes(found)) {
        const updated = [...checkedInPlayers, found];
        saveCheckedIn(updated);
        setCheckInMessage('You are checked in');
      } else {
        setCheckInMessage('You are already checked in');
      }
    } else {
      setCheckInMessage('Player not found in history');
    }

    setTimeout(() => setCheckInMessage(''), 3000);
    setName('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Check-In</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Check In" onPress={checkInPlayer} />
      {checkInMessage !== '' && <Text style={styles.message}>{checkInMessage}</Text>}
    </KeyboardAvoidingView>
  );
};

export default CheckInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a', // Tailwind gray-900
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  message: {
    marginTop: 10,
    color: '#22c55e', // Tailwind green-500
    fontWeight: '600',
  },
});
