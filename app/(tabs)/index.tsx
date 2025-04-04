// File: app/groups.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroupsScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[][]>([]);
  const [numGroups, setNumGroups] = useState(2);
  const [name, setName] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const storedPlayers = await AsyncStorage.getItem('players');
      const storedCheckins = await AsyncStorage.getItem('checkedInPlayers');
      const parsedPlayers = storedPlayers ? JSON.parse(storedPlayers) : [];
      const parsedCheckins = storedCheckins ? JSON.parse(storedCheckins) : [];
      setPlayers(parsedPlayers);
      setCheckedIn(parsedCheckins);
    };

    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    AsyncStorage.setItem('checkedInPlayers', JSON.stringify(checkedIn));
  }, [checkedIn]);

  const normalize = (s: string) => s.trim().toLowerCase();

  const checkInPlayer = () => {
    const inputName = name.trim();
    if (!inputName) return;
    const lowerInput = normalize(inputName);
    const matchedPlayer = players.find(p => normalize(p.name) === lowerInput);

    if (matchedPlayer) {
      if (!checkedIn.some(c => normalize(c) === lowerInput)) {
        setCheckedIn(prev => [...prev, matchedPlayer.name]);
        setCheckInMessage('You are checked in');
      }
    } else {
      setCheckInMessage('Player not found in history');
    }

    setTimeout(() => setCheckInMessage(''), 3000);
    setName('');
  };

  const registerNewPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    const exists = players.some(p => normalize(p.name) === normalize(trimmedName));
    if (exists) {
      setRegistrationMessage('Player already registered.');
    } else {
      setPlayers(prev => [...prev, { name: trimmedName, skill: 0 }]);
      setRegistrationMessage('Player registered. Waiting for admin to assign skill.');
    }

    setTimeout(() => setRegistrationMessage(''), 3000);
    setNewPlayerName('');
  };

  const distribute = () => {
    const teamCount = Number(numGroups) || 2;
    if (!players.length || !checkedIn.length || teamCount <= 0) return;

    const eligible = players.filter(p =>
      checkedIn.some(c => normalize(c) === normalize(p.name))
    );

    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams: { name: string; skill: number }[][] = Array.from({ length: teamCount }, () => []);
    const totals = new Array(teamCount).fill(0);

    for (const p of sorted) {
      let minIndex = 0;
      for (let i = 1; i < teamCount; i++) {
        if (totals[i] < totals[minIndex]) minIndex = i;
      }
      teams[minIndex].push(p);
      totals[minIndex] += p.skill;
    }

    setGroups(teams);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NLVB Player Grouping App</Text>

      <Text style={styles.subTitle}>Check-In</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        style={styles.input}
      />
      <Button title="Check In" onPress={checkInPlayer} />
      {!!checkInMessage && <Text style={styles.message}>{checkInMessage}</Text>}

      <Text style={styles.subTitle}>New Player Registration</Text>
      <TextInput
        value={newPlayerName}
        onChangeText={setNewPlayerName}
        placeholder="Your name"
        style={styles.input}
      />
      <Button title="Register" onPress={registerNewPlayer} />
      {!!registrationMessage && <Text style={styles.message}>{registrationMessage}</Text>}

      <Button title="Generate Groups" onPress={distribute} />

      <FlatList
        data={groups}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const totalSkill = item.reduce((sum, p) => sum + p.skill, 0);
          return (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>
                Group {index + 1} ({item.length} players, Total Skill: {totalSkill})
              </Text>
              {item.map((p, i) => (
                <Text key={i}>{p.name} (Skill: {p.skill})</Text>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, borderRadius: 6 },
  message: { color: 'green', marginTop: 5, marginBottom: 10 },
  group: { marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10 },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
});
