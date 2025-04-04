import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

export default function Index() {
  const [name, setName] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [players, setPlayers] = useState([
    { name: 'Mikey', skill: 8 },
    { name: 'Ashley', skill: 6 },
  ]);
  const [checkedInPlayers, setCheckedInPlayers] = useState<string[]>([]);

  const checkInPlayer = () => {
    const matched = players.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (matched && !checkedInPlayers.includes(matched.name)) {
      setCheckedInPlayers([...checkedInPlayers, matched.name]);
      setCheckInMessage('You are checked in!');
    } else {
      setCheckInMessage('Player not found.');
    }
    setName('');
    setTimeout(() => setCheckInMessage(''), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NLVB Player Grouping App</Text>

      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Button title="Check In" onPress={checkInPlayer} />

      {checkInMessage ? <Text style={styles.message}>{checkInMessage}</Text> : null}

      <Text style={styles.groupTitle}>Checked In Players:</Text>
      {checkedInPlayers.map((player, idx) => (
        <Text key={idx}>{player}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#111',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  message: {
    color: 'lightgreen',
    marginTop: 10,
  },
  groupTitle: {
    color: '#ccc',
    marginTop: 20,
    fontSize: 18,
  },
});
