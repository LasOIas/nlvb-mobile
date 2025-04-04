// File: app/(tabs)/register.tsx
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Clear the message after 3 seconds
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const readPlayers = async () => {
    try {
      const data = await AsyncStorage.getItem('players');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading players from storage:', error);
      return [];
    }
  };

  const writePlayers = async (players: any[]) => {
    try {
      await AsyncStorage.setItem('players', JSON.stringify(players));
    } catch (error) {
      console.error('Error writing players to storage:', error);
    }
  };

  const registerPlayer = async () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    try {
      const players = await readPlayers();
      const exists = players.some(
        (p: any) => p.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        setMessage('Player already registered.');
      } else {
        players.push({ name: trimmedName, skill: 0 });
        await writePlayers(players);
        setMessage('Player registered. Waiting for admin to assign skill.');
      }

      setNewPlayerName('');
    } catch (error) {
      console.error('Error registering player:', error);
      setMessage('Failed to register player.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register New Player</Text>
      <TextInput
        style={styles.input}
        value={newPlayerName}
        onChangeText={setNewPlayerName}
        placeholder="Enter your name"
        placeholderTextColor="#888"
      />
      <Button title="Register" onPress={registerPlayer} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, marginBottom: 10, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: '#000',
  },
  message: { marginTop: 10, color: 'green' },
});
