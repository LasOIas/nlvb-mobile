import { Text, View, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const checkIn = () => {
    if (name.trim() === '') {
      setMessage('Please enter your name.');
    } else {
      setMessage(`Welcome, ${name}! You are checked in.`);
      setName('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NLVB Player Check-In</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <Button title="Check In" onPress={checkIn} />
      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
  message: {
    color: '#4ade80',
    marginTop: 10,
    textAlign: 'center',
  },
});
