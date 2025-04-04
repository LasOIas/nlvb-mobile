import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const loadPlayers = async () => {
    const data = await AsyncStorage.getItem('players');
    setPlayers(data ? JSON.parse(data) : []);
  };

  const savePlayers = async (updated: any[]) => {
    await AsyncStorage.setItem('players', JSON.stringify(updated));
    setPlayers(updated);
  };

  const handleSave = () => {
    const parsedSkill = parseFloat(skill);
    if (!name.trim() || isNaN(parsedSkill)) return;

    const updated = [...players];
    if (editingIndex !== null) {
      updated[editingIndex] = { name: name.trim(), skill: parsedSkill };
    } else {
      updated.push({ name: name.trim(), skill: parsedSkill });
    }

    savePlayers(updated);
    setName('');
    setSkill('');
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const p = players[index];
    setName(p.name);
    setSkill(p.skill.toString());
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updated = players.filter((_, i) => i !== index);
    savePlayers(updated);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Player name"
        style={styles.input}
      />
      <TextInput
        value={skill}
        onChangeText={setSkill}
        placeholder="Skill (1-10)"
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title={editingIndex !== null ? 'Update Player' : 'Add Player'} onPress={handleSave} />

      <FlatList
        data={players}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.playerRow}>
            <Text>{item.name} (Skill: {item.skill})</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(index)}>
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(index)}>
                <Text style={styles.link}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  playerRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: { flexDirection: 'row', gap: 10 },
  link: { color: 'blue', marginLeft: 10 },
});
