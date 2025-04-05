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
  const [numGroups, setNumGroups] = useState(2);
  const [message, setMessage] = useState('');
  const [expandedPlayerIndex, setExpandedPlayerIndex] = useState<number | null>(null);

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
      setMessage('Checked in');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const removePlayer = (index: number) => {
    const updated = players.filter((_, i) => i !== index);
    setPlayers(updated);
    setCheckedInPlayers(checkedInPlayers.filter(name => name !== players[index].name));
  };

  const editPlayerSkill = (index: number, newSkill: string) => {
    const skillValue = parseFloat(newSkill);
    if (!isNaN(skillValue)) {
      const updated = [...players];
      updated[index].skill = skillValue;
      setPlayers(updated);
    }
  };

  const loginAdmin = () => {
    if (adminCode === 'nlvb2025') {
      setIsAdmin(true);
      setAdminCode('');
    } else {
      Alert.alert('Incorrect admin code');
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

  const distributeGroups = () => {
    const eligible = players.filter(p => checkedInPlayers.includes(p.name));
    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams: Player[][] = Array.from({ length: numGroups }, () => []);
    const totals = new Array(numGroups).fill(0);

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
          <Text style={styles.subheader}>Players</Text>

          {players.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.playerCard}
              onPress={() => setExpandedPlayerIndex(expandedPlayerIndex === i ? null : i)}
            >
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.playerSkill}>Skill: {p.skill}</Text>
              {expandedPlayerIndex === i && (
                <View style={styles.actionRow}>
                  <Button title="Check In" onPress={() => checkInPlayer(p.name)} />
                  <TextInput
                    placeholder="Skill"
                    keyboardType="numeric"
                    style={styles.skillInput}
                    onChangeText={(text) => editPlayerSkill(i, text)}
                  />
                  <Button title="Delete" color="red" onPress={() => removePlayer(i)} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Number of Groups:</Text>
          <TextInput
            placeholder="Enter number of groups"
            keyboardType="numeric"
            value={numGroups.toString()}
            onChangeText={text => setNumGroups(Number(text) || 2)}
            style={styles.input}
          />

          <Button title="Generate Groups" onPress={distributeGroups} />

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
  subheader: { fontSize: 20, marginTop: 20, marginBottom: 10 },
  message: { marginTop: 10, color: 'green' },
  playerCard: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6
  },
  playerName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerSkill: {
    marginBottom: 5,
    color: '#555',
  },
  skillInput: {
    borderWidth: 1, marginVertical: 5, padding: 5, borderRadius: 5, backgroundColor: '#fff', flex: 1
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'column',
    gap: 6,
  },
  label: { marginTop: 20 },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
});
