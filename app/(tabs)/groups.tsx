// File: app/(tabs)/groups.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Picker } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GroupsScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[][]>([]);
  const [numGroups, setNumGroups] = useState(2);

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

  const normalize = (s: string) => s.trim().toLowerCase();

  const distribute = () => {
    const eligible = players.filter(p =>
      checkedIn.some(c => normalize(c) === normalize(p.name))
    );

    const sorted = [...eligible].sort((a, b) => b.skill - a.skill);
    const teams = Array.from({ length: numGroups }, () => []);
    const totals = new Array(numGroups).fill(0);

    for (const p of sorted) {
      let minIndex = 0;
      for (let i = 1; i < numGroups; i++) {
        if (totals[i] < totals[minIndex]) minIndex = i;
      }
      teams[minIndex].push(p);
      totals[minIndex] += p.skill;
    }

    setGroups(teams);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Generator</Text>
      <Text style={styles.label}>Number of Groups:</Text>
      <Picker
        selectedValue={numGroups}
        onValueChange={(val) => setNumGroups(val)}
        style={styles.picker}
      >
        {[...Array(10)].map((_, i) => (
          <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
        ))}
      </Picker>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 16, marginTop: 10 },
  picker: { height: 50, width: 150, marginBottom: 10 },
  group: { marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10 },
  groupTitle: { fontWeight: 'bold', marginBottom: 5 },
});
