// File: app/(tabs)/checkin.tsx
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const normalize = (str: string) => str.trim().toLowerCase();

  const checkInPlayer = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const playersRaw = await AsyncStorage.getItem('players');
      const checkedInRaw = await AsyncStorage.getItem('checkedInPlayers');
      const players = playersRaw ? JSON.parse(playersRaw) : [];
      const checkedInPlayers = checkedInRaw ? JSON.parse(checkedInRaw) : [];

      const match = players.find((p: any) => normalize(p.name) === normalize(trimmedName));

      if (match) {
        const alreadyChecked = checkedInPlayers.some(
          (n: string) => normalize(n) === normalize(trimmedName)
        );

        if (!alreadyChecked) {
          checkedInPlayers.push(match.name);
          await AsyncStorage.setItem('checkedInPlayers', JSON.stringify(checkedInPlayers));
        }
        setMessage('You are checked in!');
      } else {
        setMessage('Player not found. Please register first.');
      }

      setName('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Check-in error:', error);
      setMessage('Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check In</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />
      <Button title="Check In" onPress={checkInPlayer} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  message: { marginTop: 10, color: 'green' },
});
