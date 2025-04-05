// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [expandedPlayerIndex, setExpandedPlayerIndex] = useState<number | null>(null);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editedSkill, setEditedSkill] = useState('');

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

  const checkInPlayer = () => {
    const trimmed = name.trim();
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

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const resetCheckIns = () => {
    setCheckedInPlayers([]);
  };

  const updatePlayerSkill = (index: number) => {
    const skillValue = parseFloat(editedSkill);
    if (!isNaN(skillValue)) {
      const updated = [...players];
      updated[index].skill = skillValue;
      setPlayers(updated);
      setEditedSkill('');
      setEditingPlayerIndex(null);
    }
  };

  const distributeGroups = () => {
    const groupCount = parseInt(numGroups);
    if (isNaN(groupCount) || groupCount < 1) return;
    const eligible = players.filter(p => checkedInPlayers.includes(p.name));
    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams: Player[][] = Array.from({ length: groupCount }, () => []);
    const totals = new Array(groupCount).fill(0);

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
          <TextInput placeholder="Your name" style={styles.input} value={name} onChangeText={setName} />
          <Button title="Check In" onPress={checkInPlayer} />
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
              <TouchableOpacity onPress={() => setExpandedPlayerIndex(expandedPlayerIndex === i ? null : i)}>
                <Text style={styles.playerName}>{p.name} (Skill: {p.skill})</Text>
              </TouchableOpacity>

              {expandedPlayerIndex === i && (
                <View>
                  <View style={styles.buttonRow}>
                    <Button title="Check-In" color="#4CAF50" onPress={() => setCheckedInPlayers([...checkedInPlayers, p.name])} />
                    <Button title="Edit" color="#2196F3" onPress={() => setEditingPlayerIndex(i)} />
                    <Button title="Delete" color="#f44336" onPress={() => {
                      const updated = players.filter((_, idx) => idx !== i);
                      setPlayers(updated);
                    }} />
                  </View>

                  {editingPlayerIndex === i && (
                    <View>
                      <TextInput
                        placeholder="New Skill"
                        style={styles.skillInput}
                        keyboardType="numeric"
                        value={editedSkill}
                        onChangeText={setEditedSkill}
                      />
                      <Button title="Update Skill" onPress={() => updatePlayerSkill(i)} />
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          <Text style={styles.subheader}>Group Settings</Text>
          <TextInput
            placeholder="Number of Groups"
            keyboardType="numeric"
            value={numGroups}
            onChangeText={setNumGroups}
            style={styles.input}
          />
          <Button title="Generate Groups" onPress={distributeGroups} />

          <Text style={styles.subheader}>Groups</Text>
          {groups.map((g, i) => (
            <View key={i} style={styles.groupBox}>
              <Text style={styles.groupTitle}>Group {i + 1}</Text>
              {g.map((p, j) => (
                <Text key={j}>{p.name} (Skill: {p.skill})</Text>
              ))}
            </View>
          ))}

          <View style={styles.buttonRowBottom}>
            <Button title="Reset Check-Ins" onPress={resetCheckIns} color="#9C27B0" />
            <Button title="Logout" onPress={logoutAdmin} color="#FF5722" />
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
    borderRadius: 6,
  },
  playerName: { fontWeight: 'bold' },
  skillInput: {
    borderWidth: 1, marginTop: 5, padding: 5, borderRadius: 5, backgroundColor: '#fff'
  },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 5
  },
  buttonRowBottom: {
    marginTop: 30,
    gap: 10
  }
});
