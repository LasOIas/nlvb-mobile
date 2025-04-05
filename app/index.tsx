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
  const [numGroups, setNumGroups] = useState('');
  const [message, setMessage] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSkill, setEditSkill] = useState('');

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

  const resetCheckIns = () => {
    setCheckedInPlayers([]);
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const saveEditedPlayer = (index: number) => {
    const updated = [...players];
    const newSkill = parseFloat(editSkill);
    if (!editName.trim() || isNaN(newSkill)) return;

    updated[index] = { name: editName.trim(), skill: newSkill };
    setPlayers(updated);
    setEditMode(null);
    setExpandedPlayer(null);
    setEditName('');
    setEditSkill('');
  };

  const distributeGroups = () => {
    const groupCount = parseInt(numGroups);
    if (!groupCount || groupCount < 1) {
      setMessage('Please enter a valid number of groups.');
      return;
    }

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

  const removePlayer = (index: number) => {
    const newList = [...players];
    newList.splice(index, 1);
    setPlayers(newList);
    setExpandedPlayer(null);
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
            <View key={i} style={styles.playerCard}>
              <TouchableOpacity onPress={() => setExpandedPlayer(expandedPlayer === i ? null : i)}>
                <Text style={styles.playerText}>
                  {p.name} (Skill: {p.skill}) {checkedInPlayers.includes(p.name) ? '✔️' : ''}
                </Text>
              </TouchableOpacity>

              {expandedPlayer === i && (
                editMode === i ? (
                  <View style={styles.editBox}>
                    <TextInput
                      placeholder="Name"
                      value={editName}
                      onChangeText={setEditName}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Skill"
                      keyboardType="numeric"
                      value={editSkill}
                      onChangeText={setEditSkill}
                      style={styles.input}
                    />
                    <View style={styles.buttonRow}>
                      <Button title="Save" onPress={() => saveEditedPlayer(i)} />
                      <Button title="Cancel" onPress={() => setEditMode(null)} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.buttonRow}>
                    <Button title="Check In" color="#4caf50" onPress={() => {
                      if (!checkedInPlayers.includes(p.name)) {
                        setCheckedInPlayers([...checkedInPlayers, p.name]);
                      }
                    }} />
                    <Button title="Edit" color="#2196f3" onPress={() => {
                      setEditMode(i);
                      setEditName(p.name);
                      setEditSkill(p.skill.toString());
                    }} />
                    <Button title="Delete" color="#f44336" onPress={() => removePlayer(i)} />
                  </View>
                )
              )}
            </View>
          ))}

          <Text style={styles.subheader}>Group Settings</Text>
          <TextInput
            placeholder="Enter number of groups"
            value={numGroups}
            onChangeText={setNumGroups}
            keyboardType="numeric"
            style={styles.input}
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

          <View style={{ marginTop: 30 }}>
            <Button title="Reset All Check-Ins" color="#ff9800" onPress={resetCheckIns} />
            <View style={{ marginTop: 10 }} />
            <Button title="Logout" color="#9e9e9e" onPress={logoutAdmin} />
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
  subheader: { fontSize: 20, marginTop: 20, marginBottom: 10 },
  message: { marginTop: 10, color: 'green' },
  playerCard: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6
  },
  playerText: {
    fontSize: 16,
    fontWeight: '500'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  editBox: {
    marginTop: 10
  },
  groupBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
});
