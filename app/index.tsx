// File: app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, ScrollView, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Player {
  name: string;
  skill: number;
}

type AdminSection = 'players' | 'groups';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [checkedInPlayers, setCheckedInPlayers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [groups, setGroups] = useState<Player[][]>([]);
  const [numGroups, setNumGroups] = useState<string>('2');
  const [message, setMessage] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [editModeIndex, setEditModeIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedSkill, setEditedSkill] = useState('');
  const [adminTab, setAdminTab] = useState<AdminSection>('players');

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

  const distributeGroups = () => {
    const groupCount = parseInt(numGroups);
    if (isNaN(groupCount) || groupCount <= 0) return;

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

  const renderAdminTabs = () => (
    <View style={styles.tabRow}>
      <Button
        title="Players"
        onPress={() => setAdminTab('players')}
        color={adminTab === 'players' ? '#007AFF' : '#ccc'}
      />
      <Button
        title="Groups"
        onPress={() => setAdminTab('groups')}
        color={adminTab === 'groups' ? '#007AFF' : '#ccc'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>NLVB App</Text>
      <Text style={styles.checkedIn}>Checked-in: {checkedInPlayers.length}</Text>

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
          {renderAdminTabs()}

          {adminTab === 'players' && (
            <>
              <Text style={styles.subheader}>Players</Text>
              {players.map((p, i) => (
                <View key={i} style={styles.playerRow}>
                  <TouchableOpacity onPress={() => togglePlayerExpand(i)}>
                    <Text>{p.name} (Skill: {p.skill})</Text>
                  </TouchableOpacity>

                  {expandedPlayer === i && (
                    <View style={styles.actionsRow}>
                      <Button title="Check In" color="#4CAF50" onPress={() => checkInFromAdmin(p.name)} />
                      <Button title="Edit" color="#2196F3" onPress={() => {
                        setEditModeIndex(i);
                        setEditedName(p.name);
                        setEditedSkill(p.skill.toString());
                      }} />
                      <Button title="Delete" color="#f44336" onPress={() => removePlayer(i)} />
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
            </>
          )}

          {adminTab === 'groups' && (
            <>
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

              <Text style={styles.subheader}>Options</Text>
              <Button title="Reset All Check-ins" color="#f44336" onPress={resetCheckIns} />
              <Button title="Logout" color="#888" onPress={logoutAdmin} />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  checkedIn: { fontSize: 16, color: '#555', marginBottom: 20 },
  subheader: { fontSize: 20, marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1, padding: 8, marginBottom: 10,
    borderRadius: 5, backgroundColor: '#fff'
  },
  message: { marginTop: 10, color: 'green' },
  playerRow: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6
  },
  groupBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8
  },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10
  }
});
