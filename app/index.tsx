// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

interface Player {
  name: string;
  skill: number;
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [checkedInPlayers, setCheckedInPlayers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [groups, setGroups] = useState<Player[][]>([]);
  const [numGroups, setNumGroups] = useState('2');
  const [message, setMessage] = useState('');
  const [activePlayer, setActivePlayer] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const savedPlayers = await AsyncStorage.getItem('players');
      const savedCheckins = await AsyncStorage.getItem('checkedInPlayers');
      const parsedPlayers = savedPlayers ? JSON.parse(savedPlayers) : [];
      const parsedCheckins = savedCheckins ? JSON.parse(savedCheckins) : [];
      setPlayers(parsedPlayers);
      setCheckedInPlayers(parsedCheckins);
    };
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    AsyncStorage.setItem('checkedInPlayers', JSON.stringify(checkedInPlayers));
  }, [checkedInPlayers]);

  const normalize = (str: string) => str.trim().toLowerCase();

  const checkInPlayer = (playerName?: string) => {
    const trimmed = playerName || name.trim();
    if (!trimmed) return;
    const match = players.find(p => normalize(p.name) === normalize(trimmed));
    if (match && !checkedInPlayers.includes(match.name)) {
      setCheckedInPlayers([...checkedInPlayers, match.name]);
      setMessage('Checked in');
    } else {
      setMessage('Player not found');
    }
    setName('');
    setTimeout(() => setMessage(''), 2000);
  };

  const registerPlayer = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = players.some(p => normalize(p.name) === normalize(trimmed));
    if (!exists) {
      setPlayers([...players, { name: trimmed, skill: 0 }]);
      setMessage('Registered. Waiting for admin to set skill.');
    } else {
      setMessage('Player already exists');
    }
    setName('');
    setTimeout(() => setMessage(''), 2000);
  };

  const loginAdmin = () => {
    if (adminCode === 'nlvb2025') {
      setIsAdmin(true);
      setAdminCode('');
    } else {
      Alert.alert('Incorrect admin code');
    }
  };

  const updatePlayerSkill = (index: number, newSkill: string) => {
    const skillVal = parseFloat(newSkill);
    if (!isNaN(skillVal)) {
      const updated = [...players];
      updated[index].skill = skillVal;
      setPlayers(updated);
    }
  };

  const removePlayer = (index: number) => {
    const updated = [...players];
    updated.splice(index, 1);
    setPlayers(updated);
    setActivePlayer(null);
  };

  const distributeGroups = () => {
    const n = parseInt(numGroups);
    if (isNaN(n) || n <= 0) return;

    const eligible = players.filter(p => checkedInPlayers.includes(p.name));
    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams: Player[][] = Array.from({ length: n }, () => []);
    const totals = new Array(n).fill(0);

    for (const p of sorted) {
      const index = totals.indexOf(Math.min(...totals));
      teams[index].push(p);
      totals[index] += p.skill;
    }
    setGroups(teams);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>NLVB App</Text>

      {!isAdmin ? (
        <View>
          <TextInput
            placeholder="Your name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <Button title="Check In" onPress={() => checkInPlayer()} />
          <Button title="Register" onPress={registerPlayer} />
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Text style={styles.subheader}>Admin Login</Text>
          <TextInput
            placeholder="Admin code"
            style={styles.input}
            secureTextEntry
            value={adminCode}
            onChangeText={setAdminCode}
          />
          <Button title="Login as Admin" onPress={loginAdmin} />
        </View>
      ) : (
        <View>
          <Text style={styles.subheader}>Players</Text>

          {players.map((p, i) => (
            <View key={i} style={styles.playerRow}>
              <TouchableOpacity onPress={() => setActivePlayer(activePlayer === i ? null : i)}>
                <Text>{p.name} (Skill: {p.skill})</Text>
              </TouchableOpacity>
              {activePlayer === i && (
                <View style={styles.actionsRow}>
                  <TextInput
                    placeholder="Skill"
                    keyboardType="numeric"
                    style={styles.skillInput}
                    value={skill}
                    onChangeText={setSkill}
                  />
                  <Button title="Edit" onPress={() => updatePlayerSkill(i, skill)} />
                  <Button title="Check In" onPress={() => checkInPlayer(p.name)} />
                  <Button title="Delete" onPress={() => removePlayer(i)} color="#dc2626" />
                </View>
              )}
            </View>
          ))}

          <Text style={styles.subheader}>Group Settings</Text>
          <TextInput
            placeholder="Number of Groups"
            value={numGroups}
            onChangeText={setNumGroups}
            style={styles.input}
            keyboardType="numeric"
          />
          <Button title="Generate Groups" onPress={distributeGroups} />

          <Text style={styles.subheader}>Generated Groups</Text>
          {groups.map((g, i) => (
            <View key={i} style={styles.groupBox}>
              <Text style={styles.groupTitle}>Group {i + 1}</Text>
              {g.map((p, j) => (
                <Text key={j}>{p.name} (Skill: {p.skill})</Text>
              ))}
            </View>
          ))}

          <View style={styles.adminActions}>
            <Button
              title="Reset All Check-Ins"
              onPress={() => setCheckedInPlayers([])}
              color="#dc2626"
            />
            <View style={{ marginVertical: 5 }} />
            <Button
              title="Logout"
              onPress={() => setIsAdmin(false)}
              color="#6b7280"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1, padding: 8, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff'
  },
  subheader: { fontSize: 20, marginTop: 20 },
  message: { marginTop: 10, color: 'green' },
  playerRow: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6
  },
  skillInput: {
    borderWidth: 1, marginVertical: 5, padding: 5, borderRadius: 5, backgroundColor: '#fff'
  },
  actionsRow: {
    marginTop: 10,
    gap: 6,
  },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  adminActions: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    gap: 10,
  },
});
