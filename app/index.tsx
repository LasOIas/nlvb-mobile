// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
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
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [editModeIndex, setEditModeIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedSkill, setEditedSkill] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'groups' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState('');

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

  const updatePlayer = (index: number) => {
    const trimmedName = editedName.trim();
    const newSkill = parseFloat(editedSkill);
    if (!trimmedName || isNaN(newSkill)) return;
    const updated = [...players];
    updated[index] = { name: trimmedName, skill: newSkill };
    setPlayers(updated);
    setEditModeIndex(null);
    setEditedName('');
    setEditedSkill('');
  };

  const addNewPlayer = () => {
    const name = newPlayerName.trim();
    const skill = parseFloat(newPlayerSkill);
    if (!name || isNaN(skill)) return;
    const exists = players.some(p => normalize(p.name) === normalize(name));
    if (!exists) {
      setPlayers([...players, { name, skill }]);
      setNewPlayerName('');
      setNewPlayerSkill('');
    }
  };

  const distributeGroups = () => {
    const count = parseInt(numGroups) || 2;
    const eligible = players.filter(p => checkedInPlayers.includes(p.name));
    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams: Player[][] = Array.from({ length: count }, () => []);
    const totals = new Array(count).fill(0);

    for (const p of sorted) {
      const index = totals.indexOf(Math.min(...totals));
      teams[index].push(p);
      totals[index] += p.skill;
    }
    setGroups(teams);
  };

  const togglePlayerExpand = (index: number) => {
    setExpandedPlayer(expandedPlayer === index ? null : index);
    setEditModeIndex(null);
  };

  const removePlayer = (index: number) => {
    const updated = players.filter((_, i) => i !== index);
    setPlayers(updated);
  };

  const checkInFromAdmin = (name: string) => {
    if (!checkedInPlayers.includes(name)) {
      setCheckedInPlayers([...checkedInPlayers, name]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>NLVB App</Text>
      <Text style={styles.subheader}>Checked-in: {checkedInPlayers.length}</Text>

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
          <Text style={styles.subheader}>Menu</Text>
          <View style={styles.tabRow}>
            <Button title="Players" onPress={() => setActiveTab('players')} />
            <Button title="Groups" onPress={() => setActiveTab('groups')} />
            <Button title="Logout" onPress={logoutAdmin} />
          </View>

          {activeTab === 'players' && (
            <View>
              <Text style={styles.subheader}>Add New Player</Text>
              <TextInput
                placeholder="Name"
                style={styles.input}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
              />
              <TextInput
                placeholder="Skill"
                style={styles.input}
                value={newPlayerSkill}
                keyboardType="numeric"
                onChangeText={setNewPlayerSkill}
              />
              <Button title="Add Player" onPress={addNewPlayer} />

              <Text style={styles.subheader}>Players</Text>
              {players.map((p, i) => (
                <View key={i} style={styles.playerRow}>
                  <TouchableOpacity onPress={() => togglePlayerExpand(i)}>
                    <Text>{p.name} (Skill: {p.skill})</Text>
                  </TouchableOpacity>

                  {expandedPlayer === i && (
                    <View style={styles.actionsRow}>
                      <Button title="Check In" onPress={() => checkInFromAdmin(p.name)} />
                      <Button title="Edit" onPress={() => setEditModeIndex(i)} />
                      <Button title="Delete" onPress={() => removePlayer(i)} />
                    </View>
                  )}

                  {editModeIndex === i && (
                    <View>
                      <TextInput
                        placeholder="Name"
                        value={editedName}
                        style={styles.input}
                        onChangeText={setEditedName}
                      />
                      <TextInput
                        placeholder="Skill"
                        keyboardType="numeric"
                        value={editedSkill}
                        style={styles.input}
                        onChangeText={setEditedSkill}
                      />
                      <Button title="Save" onPress={() => updatePlayer(i)} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'groups' && (
            <View>
              <Text style={styles.subheader}>Group Settings</Text>
              <TextInput
                placeholder="Number of Groups"
                keyboardType="numeric"
                value={numGroups}
                onChangeText={setNumGroups}
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

              <Button title="Reset All Check-ins" color="#f44336" onPress={resetCheckIns} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  subheader: { fontSize: 20, marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  message: { marginTop: 10, color: 'green' },
  playerRow: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6,
  },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});
