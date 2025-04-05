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
  const [expandedPlayerIndex, setExpandedPlayerIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSkill, setEditSkill] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAdminTab, setSelectedAdminTab] = useState<'Players' | 'Groups'>('Players');

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

  const handleCheckIn = (name: string) => {
    if (!checkedInPlayers.includes(name)) {
      setCheckedInPlayers([...checkedInPlayers, name]);
    }
  };

  const handleDelete = (index: number) => {
    const updated = [...players];
    updated.splice(index, 1);
    setPlayers(updated);
    setCheckedInPlayers(checkedInPlayers.filter(name => name !== players[index].name));
  };

  const handleEdit = (index: number) => {
    setEditName(players[index].name);
    setEditSkill(players[index].skill.toString());
    setIsEditing(true);
  };

  const saveEdit = (index: number) => {
    const updated = [...players];
    updated[index] = { name: editName, skill: parseFloat(editSkill) || 0 };
    setPlayers(updated);
    setIsEditing(false);
    setExpandedPlayerIndex(null);
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

  const resetCheckIns = () => setCheckedInPlayers([]);
  const logout = () => setIsAdmin(false);

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
          <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.dropdownToggle}>
            <Text style={styles.dropdownToggleText}>☰ Admin Panel ▾</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              <Button title="Players" onPress={() => { setSelectedAdminTab('Players'); setShowDropdown(false); }} />
              <Button title="Groups" onPress={() => { setSelectedAdminTab('Groups'); setShowDropdown(false); }} />
            </View>
          )}

          {selectedAdminTab === 'Players' && (
            <View>
              <Text style={styles.subheader}>Players</Text>
              {players.map((p, i) => (
                <View key={i} style={styles.playerRow}>
                  <TouchableOpacity onPress={() => setExpandedPlayerIndex(i === expandedPlayerIndex ? null : i)}>
                    <Text>{p.name} (Skill: {p.skill})</Text>
                  </TouchableOpacity>
                  {expandedPlayerIndex === i && (
                    <View style={styles.expandedButtons}>
                      <Button title="Check-In" onPress={() => handleCheckIn(p.name)} color="dodgerblue" />
                      <Button title="Edit" onPress={() => handleEdit(i)} color="orange" />
                      <Button title="Delete" onPress={() => handleDelete(i)} color="red" />
                    </View>
                  )}
                  {isEditing && expandedPlayerIndex === i && (
                    <View>
                      <TextInput
                        placeholder="New Name"
                        value={editName}
                        onChangeText={setEditName}
                        style={styles.input}
                      />
                      <TextInput
                        placeholder="New Skill"
                        keyboardType="numeric"
                        value={editSkill}
                        onChangeText={setEditSkill}
                        style={styles.input}
                      />
                      <Button title="Save" onPress={() => saveEdit(i)} color="green" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {selectedAdminTab === 'Groups' && (
            <View>
              <Text style={styles.subheader}>Groups</Text>
              <TextInput
                placeholder="Number of groups"
                keyboardType="numeric"
                value={numGroups}
                onChangeText={setNumGroups}
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

          <Button title="Reset All Check-Ins" onPress={resetCheckIns} color="orange" />
          <Button title="Logout" onPress={logout} color="red" />
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
  expandedButtons: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 10
  },
  picker: { backgroundColor: '#fff', marginBottom: 10 },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  dropdownToggle: { marginBottom: 10, padding: 8, backgroundColor: '#ddd', borderRadius: 5 },
  dropdownToggleText: { fontSize: 16, textAlign: 'center' },
  dropdownMenu: {
    marginBottom: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    padding: 8
  }
});
