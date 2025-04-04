// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ScrollView, TouchableOpacity
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
  const [newPlayer, setNewPlayer] = useState('');
  const [skill, setSkill] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [groups, setGroups] = useState<Player[][]>([]);
  const [numGroups, setNumGroups] = useState(2);
  const [message, setMessage] = useState('');

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

  const checkInPlayer = (playerName: string) => {
    if (!checkedInPlayers.includes(playerName)) {
      setCheckedInPlayers([...checkedInPlayers, playerName]);
    }
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

  const addNewPlayer = () => {
    const trimmed = newPlayer.trim();
    if (!trimmed) return;
    const exists = players.some(p => normalize(p.name) === normalize(trimmed));
    if (!exists) {
      setPlayers([...players, { name: trimmed, skill: 0 }]);
    } else {
      Alert.alert('Player already exists');
    }
    setNewPlayer('');
  };

  const loginAdmin = () => {
    if (adminCode === 'nlvb2025') {
      setIsAdmin(true);
      setAdminCode('');
    } else {
      Alert.alert('Incorrect admin code');
    }
  };

  const updatePlayer = (index: number, newSkill: string) => {
    const skillValue = parseFloat(newSkill);
    if (!isNaN(skillValue)) {
      const updated = [...players];
      updated[index].skill = skillValue;
      setPlayers(updated);
    }
  };

  const distributeGroups = () => {
    const eligible = players.filter(p => checkedInPlayers.includes(p.name));
    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teamCount = Math.max(1, numGroups);
    const teams: Player[][] = Array.from({ length: teamCount }, () => []);
    const totals = new Array(teamCount).fill(0);

    for (const p of sorted) {
      const index = totals.indexOf(Math.min(...totals));
      teams[index].push(p);
      totals[index] += p.skill;
    }
    setGroups(teams);
  };

  const resetCheckIns = () => {
    setCheckedInPlayers([]);
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminCode('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>NLVB App</Text>

      {!isAdmin ? (
        <View>
          <TextInput
            placeholder="Your name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <Button title="Check In" onPress={() => checkInPlayer(name)} />
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
          <Text style={styles.subheader}>Admin Panel</Text>

          <TextInput
            placeholder="New player name"
            style={styles.input}
            value={newPlayer}
            onChangeText={setNewPlayer}
          />
          <Button title="Add Player" onPress={addNewPlayer} />

          {players.map((p, i) => (
            <View key={i} style={styles.playerRow}>
              <Text>{p.name} (Skill: {p.skill})</Text>
              <Button title="Check-In" onPress={() => checkInPlayer(p.name)} />
              <TextInput
                placeholder="New Skill"
                keyboardType="numeric"
                style={styles.skillInput}
                onChangeText={(val) => updatePlayer(i, val)}
              />
              <Button title="Update" onPress={() => updatePlayer(i, skill)} />
            </View>
          ))}

          <Text style={styles.label}>Number of Groups:</Text>
          <Picker
            selectedValue={numGroups}
            onValueChange={(v) => setNumGroups(v)}
            style={styles.picker}
          >
            {[...Array(10)].map((_, i) => (
              <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
            ))}
          </Picker>

          <Button title="Generate Groups" onPress={distributeGroups} color="dodgerblue" />
          <Button title="Reset All Check-Ins" onPress={resetCheckIns} color="orange" />
          <Button title="Logout" onPress={logout} color="red" />

          {groups.map((g, i) => (
            <View key={i} style={styles.groupBox}>
              <Text style={styles.groupTitle}>Group {i + 1}</Text>
              {g.map((p, j) => (
                <Text key={j}>{p.name} (Skill: {p.skill})</Text>
              ))}
            </View>
          ))}
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
  label: { marginTop: 20 },
  picker: { backgroundColor: '#fff', marginBottom: 10 },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
});
