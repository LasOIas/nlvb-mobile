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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editModeIndex, setEditModeIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSkill, setEditSkill] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'settings'>('players');

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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
    setEditModeIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditModeIndex(index);
    setEditName(players[index].name);
    setEditSkill(players[index].skill.toString());
  };

  const saveEdit = (index: number) => {
    const updated = [...players];
    updated[index] = { name: editName, skill: parseFloat(editSkill) || 0 };
    setPlayers(updated);
    setEditModeIndex(null);
  };

  const removePlayer = (index: number) => {
    const updated = players.filter((_, i) => i !== index);
    setPlayers(updated);
    setCheckedInPlayers(prev => prev.filter(n => n !== players[index].name));
    setExpandedIndex(null);
  };

  const checkInFromAdmin = (name: string) => {
    if (!checkedInPlayers.includes(name)) {
      setCheckedInPlayers([...checkedInPlayers, name]);
    }
  };

  const distributeGroups = () => {
    const count = parseInt(numGroups);
    if (!count || count <= 0) return;
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

  const resetCheckIns = () => setCheckedInPlayers([]);
  const logoutAdmin = () => setIsAdmin(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>NLVB App</Text>
        {isAdmin && (
          <View style={styles.badge}><Text style={styles.badgeText}>{checkedInPlayers.length}</Text></View>
        )}
      </View>

      {!isAdmin ? (
        <View>
          <TextInput placeholder="Your name" style={styles.input} value={name} onChangeText={setName} />
          <Button title="Check In" onPress={checkInPlayer} />
          <Button title="Register" onPress={registerPlayer} />
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Text style={styles.subheader}>Admin Login</Text>
          <TextInput placeholder="Admin code" style={styles.input} secureTextEntry value={adminCode} onChangeText={setAdminCode} />
          <Button title="Login as Admin" onPress={loginAdmin} />
        </View>
      ) : (
        <View>
          <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setActiveTab('players')} style={[styles.tab, activeTab === 'players' && styles.activeTab]}>
              <Text>Players</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('settings')} style={[styles.tab, activeTab === 'settings' && styles.activeTab]}>
              <Text>Settings</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'players' && (
            <View>
              <Text style={styles.subheader}>Players</Text>
              {players.map((p, i) => (
                <View key={i} style={styles.playerBox}>
                  <TouchableOpacity onPress={() => toggleExpand(i)}>
                    <Text>{p.name} (Skill: {p.skill})</Text>
                  </TouchableOpacity>
                  {expandedIndex === i && (
                    <View style={styles.inlineBtns}>
                      <Button title="Check In" onPress={() => checkInFromAdmin(p.name)} color="green" />
                      <Button title="Edit" onPress={() => handleEdit(i)} color="blue" />
                      <Button title="Delete" onPress={() => removePlayer(i)} color="red" />
                    </View>
                  )}
                  {editModeIndex === i && (
                    <View>
                      <TextInput value={editName} onChangeText={setEditName} placeholder="Name" style={styles.input} />
                      <TextInput value={editSkill} onChangeText={setEditSkill} placeholder="Skill" style={styles.input} keyboardType="numeric" />
                      <Button title="Save" onPress={() => saveEdit(i)} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'settings' && (
            <View>
              <Text style={styles.subheader}>Group Settings</Text>
              <TextInput
                placeholder="Number of Groups"
                value={numGroups}
                onChangeText={setNumGroups}
                keyboardType="numeric"
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

              <Button title="Reset Check-Ins" onPress={resetCheckIns} color="orange" />
              <Button title="Logout" onPress={logoutAdmin} color="black" />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 26, fontWeight: 'bold' },
  input: {
    borderWidth: 1, padding: 8, marginVertical: 5, borderRadius: 5, backgroundColor: '#fff'
  },
  subheader: { fontSize: 20, marginTop: 20 },
  message: { marginTop: 10, color: 'green' },
  playerBox: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6
  },
  inlineBtns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8
  },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  tabRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ddd',
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#bbb'
  },
  badge: {
    backgroundColor: 'tomato',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  }
});
