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
    Pressable,
    SafeAreaView,
} from 'react-native';

import { fetchPlayers, addPlayer, updatePlayer as updatePlayerService, deletePlayer } from '../services/players';
import { cleanUpDuplicateCheckins, fetchCheckins, checkInPlayer as supabaseCheckIn, checkOutPlayer as supabaseCheckOut } from '../services/checkins';
import { supabase } from '@/lib/supabase';

interface Player {
  id: string;
  name: string;
  skill: number;
}


interface TournamentTeam {
  name: string;
  members: string[];
  rating: number;
  wins: number;
  losses: number;
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
  const [numGroupsText, setNumGroupsText] = useState('2');
  const [message, setMessage] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [editModeIndex, setEditModeIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedSkill, setEditedSkill] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'settings' | 'tournaments'>('players');

  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [showBracket, setShowBracket] = useState(false);
  const [rounds, setRounds] = useState<string[][][]>([]); // 3D array: rounds → matchups → teams

  useEffect(() => {
    const loadData = async () => {
      try {
        try {
          await cleanUpDuplicateCheckins(); // Don't let this crash the rest
        } catch (err) {
          console.error('Deduplication failed but continuing anyway:', err);
        }
  
        const playersData = await fetchPlayers();
        if (playersData) setPlayers(playersData);
  
        const checkinsData = await fetchCheckins();
        if (checkinsData) setCheckedInPlayers(checkinsData);
      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      }
    };
    loadData();
  }, []);   

  const normalize = (str: string) => str.trim().toLowerCase();

  const handleCheckIn = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const player = players.find(p => normalize(p.name) === normalize(trimmed));
    if (player && !checkedInPlayers.includes(player.id)) {
      try {
        await supabaseCheckIn(player.id);
        const updatedCheckins = await fetchCheckins();
        setCheckedInPlayers(updatedCheckins);
        setMessage('Checked in');
      } catch (error) {
        console.error("Error with check-in:", error);
        setMessage('Error checking in');
      }
    } else {
      setMessage('Player not found');
    }
    setName('');
    setTimeout(() => setMessage(''), 2000);
  };  

  const registerPlayer = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = players.some(p => normalize(p.name) === normalize(trimmed));
    if (!exists) {
      await addPlayer(trimmed, 0);
      const updatedPlayers = await fetchPlayers();
      setPlayers(updatedPlayers);
      setMessage('Registered. Waiting for admin to set skill.');
    } else {
      setMessage('Player already exists');
    }
    setName('');
    setTimeout(() => setMessage(''), 2000);
  };  
  
  const registerPlayerAsAdmin = async () => {
    const trimmedName = name.trim();
    const parsedSkill = parseFloat(skill);
  
    if (!trimmedName || isNaN(parsedSkill)) {
      setMessage('Enter valid name and skill');
      return;
    }
  
    try {
      await addPlayer(trimmedName, parsedSkill);
      const updatedPlayers = await fetchPlayers();
      setPlayers(updatedPlayers);
      setMessage('Player registered');
    } catch (err) {
      console.error('Failed to register player:', err);
      setMessage('Error saving player');
    }
    setName('');
    setSkill('');
    setTimeout(() => setMessage(''), 2000);
  };

  const updatePlayer = async (index: number) => {
    const nameInput = editedName.trim();
    const skillInput = parseFloat(editedSkill);
    const currentPlayer = players[index];
    const updatedPlayer = {
      name: nameInput || currentPlayer.name,
      skill: !isNaN(skillInput) ? skillInput : currentPlayer.skill
    };
    try {
      await updatePlayerService(currentPlayer.id, updatedPlayer.name, updatedPlayer.skill);
      const updatedPlayers = await fetchPlayers();
      setPlayers(updatedPlayers);
    } catch (error) {
      console.error('Failed to update player:', error);
    }
    setEditModeIndex(null);
    setEditedName('');
    setEditedSkill('');
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
    console.log("Logging out admin...");
    setIsAdmin(false);
  };  

  const resetCheckIns = async () => {
    try {
      console.log("Resetting these IDs:", checkedInPlayers); // For debugging
      for (const playerId of checkedInPlayers) {
        const { error } = await supabase
          .from('checkins')
          .delete()
          .eq('player_id', playerId);
  
        if (error) {
          console.error(`Failed to check out player ${playerId}:`, error.message);
          throw error;
        }
      }
  
      const updatedCheckins = await fetchCheckins();
      setCheckedInPlayers(updatedCheckins);
      setMessage('All check-ins reset');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error("Error resetting check-ins:", error);
      setMessage('Failed to reset check-ins');
    }
  };   
     
  const confirmResetCheckIns = () => {
    console.log("Reset All Check-ins tapped"); // add this
    Alert.alert(
      'Reset All Check-ins',
      'Are you sure you want to reset all check-ins?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetCheckIns },
      ]
    );
  };
  
  const confirmLogoutAdmin = () => {
    console.log("Logout tapped"); // add this
    Alert.alert(
      'Logout Admin',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'default', onPress: logoutAdmin },
      ]
    );
  };
  
  // Tournament functions (kept local)
  const resetTournament = async () => {
    setTournamentTeams([]);
    setNewTeamName('');
  };  
  
  const confirmResetTournament = () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset tournament settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetTournament },
      ]
    );
  };
  
  const addTeamToTournament = async () => {
    const trimmed = newTeamName.trim();
    if (
      trimmed &&
      !tournamentTeams.some(team => team.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      const newTeam: TournamentTeam = {
        name: trimmed,
        members: [],
        rating: 0,
        wins: 0,
        losses: 0
      };
      setTournamentTeams([...tournamentTeams, newTeam]);
      setNewTeamName('');
    }
  };
  
  const generateBracket = () => {
    const shuffled = [...tournamentTeams.map(t => t.name)];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  
    const firstRound: string[][] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        firstRound.push([shuffled[i], shuffled[i + 1]]);
      } else {
        firstRound.push([shuffled[i], 'BYE']);
      }
    }
  
    setRounds([firstRound]);
    setShowBracket(true);
  };
  
  const handleWinnerSelect = (roundIndex: number, matchIndex: number, winner: string) => {
    const newRounds = [...rounds];
    newRounds[roundIndex][matchIndex] = [winner, ''];
    const isRoundComplete = newRounds[roundIndex].every(
      match => match[0] && (match[1] === '' || match[1] === 'BYE')
    );
    if (isRoundComplete && newRounds.length === roundIndex + 1) {
      const nextRound: string[][] = [];
      const winners = newRounds[roundIndex].map(match => match[0]);
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          nextRound.push([winners[i], winners[i + 1]]);
        } else {
          nextRound.push([winners[i], 'BYE']);
        }
      }
      newRounds.push(nextRound);
    }
    setRounds(newRounds);
  };
  
  const promptUpdateRating = (index: number) => {
    Alert.prompt(
      'Update Rating',
      `Enter new rating for ${tournamentTeams[index].name}`,
      (value) => {
        const rating = parseInt(value);
        if (!isNaN(rating)) {
          const updated = [...tournamentTeams];
          updated[index].rating = rating;
          setTournamentTeams(updated);
        }
      },
      'plain-text',
      tournamentTeams[index].rating.toString()
    );
  };
  
  const promptAddMember = (index: number) => {
    Alert.prompt(
      'Add Member',
      `Enter player name to add to ${tournamentTeams[index].name}`,
      (value) => {
        const trimmedMember = value.trim();
        if (trimmedMember) {
          const updated = [...tournamentTeams];
          if (!updated[index].members.includes(trimmedMember)) {
            updated[index].members.push(trimmedMember);
            setTournamentTeams(updated);
          }
        }
      }
    );
  };
  
  const checkInFromAdmin = async (playerId: string) => {
    if (!checkedInPlayers.includes(playerId)) {
      try {
        await supabaseCheckIn(playerId);
        const updatedCheckins = await fetchCheckins();
        setCheckedInPlayers(updatedCheckins);
      } catch (error) {
        console.error("Error checking in from admin:", error);
      }
    }
  };
  
  const checkOutFromAdmin = async (playerId: string) => {
    try {
      await supabaseCheckOut(playerId);
      const updatedCheckins = await fetchCheckins();
      setCheckedInPlayers(updatedCheckins);
    } catch (error) {
      console.error("Error checking out:", error);
    }
  };  
  
  const distributeGroups = () => {
    const eligible = players.filter(p => checkedInPlayers.includes(p.id));
    const shuffled = [...eligible].sort((a, b) => {
      if (a.skill === b.skill) return Math.random() - 0.5;
      return b.skill - a.skill;
    });
    const teams: Player[][] = Array.from({ length: numGroups }, () => []);
    const totals = new Array(numGroups).fill(0);
    for (const player of shuffled) {
      const index = totals.indexOf(Math.min(...totals));
      teams[index].push(player);
      totals[index] += player.skill;
    }
    setGroups(teams);
  };
  
  const updateTeamStat = (index: number, stat: 'wins' | 'losses', increment: number) => {
    const updatedTeams = [...tournamentTeams];
    updatedTeams[index][stat] += increment;
    setTournamentTeams(updatedTeams);
  };
  
  const styles = StyleSheet.create({
    fullScreen: { flex: 1 },
    container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
    subheader: { fontSize: 20, marginTop: 20, marginBottom: 10 },
    input: {
      borderWidth: 1,
      padding: 8,
      marginBottom: 10,
      borderRadius: 5,
      backgroundColor: '#fff',
      color: '#333',
    },
    newTag: {
      color: 'green',
      fontWeight: 'bold',
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
      padding: 14,
      backgroundColor: '#e8f0fe',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#b0c4de',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    groupTitle: { fontWeight: 'bold', marginBottom: 5 },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10
    },
    dropdownHeader: {
      backgroundColor: '#333',
      padding: 10,
      borderRadius: 4,
      marginBottom: 5,
    },
    dropdownHeaderText: {
      color: '#fff',
      fontWeight: 'bold'
    },
    dropdownMenu: {
      backgroundColor: '#333',
      borderRadius: 4,
      marginBottom: 10
    },
    dropdownItem: {
      padding: 10,
      borderBottomColor: '#555',
      borderBottomWidth: 1,
    },
    dropdownText: {
      color: '#fff'
    },
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: 10,
      borderTopWidth: 1,
      borderColor: '#ccc',
      flexDirection: 'row',
      justifyContent: 'space-around',
      zIndex: 99, // Added
      height: 60, // Added
    },    
    groupMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    groupMetaText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    groupPlayers: {
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      paddingTop: 8,
    },
    groupPlayerText: {
      fontSize: 14,
      marginBottom: 4,
    }
  });
  
  return (
    <SafeAreaView style={[styles.fullScreen, { paddingBottom: 60 }]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.header}>NLVB App</Text>
        <Text style={styles.subheader}>Checked-in: {checkedInPlayers.length}</Text>
        {!isAdmin ? (
          <View>
            <TextInput
            autoComplete="off"
              placeholder="Your name"
              placeholderTextColor="#333"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          
            <Button title="Check In" onPress={handleCheckIn} />
            <Button title="Register" color="#2196F3" onPress={registerPlayer} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Text style={styles.subheader}>Admin Login</Text>
            <TextInput
            autoComplete="off"
              placeholder="Admin code"
              placeholderTextColor="#333"
              style={styles.input}
              secureTextEntry
              value={adminCode}
              onChangeText={setAdminCode}
            />
            <Button title="Login as Admin" onPress={loginAdmin} />
          </View>
        ) : (
          <View>
            <Pressable style={styles.dropdownHeader} onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={styles.dropdownHeaderText}>Menu ▼</Text>
            </Pressable>
            {menuOpen && (
              <View style={styles.dropdownMenu}>
                <Pressable onPress={() => setActiveTab('players')} style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>Players</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('settings')} style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>Groups</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('tournaments')} style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>Tournaments</Text>
                </Pressable>
              </View>
            )}
            {activeTab === 'players' && (
              <>
                <Text style={styles.subheader}>Register New Player</Text>
                <TextInput
                autoComplete="off"
                  placeholder="Player Name"
                  placeholderTextColor="#333"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                autoComplete="off"
                  placeholder="Skill (0–100)"
                  placeholderTextColor="#333"
                  style={styles.input}
                  keyboardType="numeric"
                  value={skill}
                  onChangeText={setSkill}
                />
                <Button title="Register Player" onPress={registerPlayerAsAdmin} />
                {message ? <Text style={styles.message}>{message}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
                  <Text style={styles.subheader}>Players ({players.length})</Text>
                  {isAdmin && (
                    <Button
                      title="Check In All"
                      onPress={async () => {
                        try {
                          for (const p of players) {
                            await supabaseCheckIn(p.id);
                          }                          
                          const updated = await fetchCheckins();
                          setCheckedInPlayers(updated);
                          setMessage('All players checked in');
                          setTimeout(() => setMessage(''), 2000);
                        } catch (error) {
                          console.error("Error checking in all:", error);
                        }
                      }}
                    />
                  )}
                </View>
                {players.map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.playerRow,
                      p.skill === 0 && { backgroundColor: '#FFF9C4' } // light yellow for new
                    ]}
                  >
                    <TouchableOpacity onPress={() => setExpandedPlayer(expandedPlayer === i ? null : i)}>
                      <Text>
                        {p.name} (Skill: {p.skill}){' '}
                        {p.skill === 0 && <Text style={styles.newTag}>(NEW)</Text>}
                        {checkedInPlayers.includes(p.id) ? ' ✅' : ''}
                      </Text>
                    </TouchableOpacity>
                    {expandedPlayer === i && (
                      <View style={styles.actionsRow}>
                        <Button title="Check In" color="#4CAF50" onPress={() => checkInFromAdmin(p.id)} />
                        {checkedInPlayers.includes(p.id) && (
                          <Button title="Check Out" color="#FF9800" onPress={() => checkOutFromAdmin(p.id)} />
                        )}
                        <Button title="Edit" color="#2196F3" onPress={() => {
                          setEditModeIndex(i);
                          setEditedName(p.name);
                          setEditedSkill(p.skill.toString());
                        }} />
                        <Button
                          title="Delete"
                          color="#f44336"
                          onPress={() => {
                            Alert.alert(
                              'Confirm Delete',
                              `Are you sure you want to delete ${p.id}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await deletePlayer(p.id);
                                      const updated = await fetchPlayers();
                                      setPlayers(updated);
                                    } catch (error) {
                                      console.error("Error deleting player:", error);
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        />
                      </View>
                    )}
                    {editModeIndex === i && (
                      <View>
                        <TextInput
                        autoComplete="off"
                          placeholder="Edit Name"
                          placeholderTextColor="#333"
                          value={editedName}
                          style={styles.input}
                          onChangeText={setEditedName}
                        />
                        <TextInput
                        autoComplete="off"
                          placeholder="Edit Skill"
                          placeholderTextColor="#333"
                          keyboardType="numeric"
                          value={editedSkill}
                          style={styles.input}
                          onChangeText={setEditedSkill}
                        />
                        <Button title="Save Changes" onPress={() => updatePlayer(i)} />
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <Text style={styles.subheader}>Generated Groups</Text>
                <TextInput
                autoComplete="off"
                  placeholder="Number of Groups"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  value={numGroupsText}
                  onChangeText={(text) => {
                    setNumGroupsText(text);
                    const parsed = parseInt(text);
                    if (!isNaN(parsed)) setNumGroups(parsed);
                  }}
                  style={styles.input}
                />
                <Button title="Generate Groups" onPress={distributeGroups} />
                {groups.length > 0 && (
                  <Button title="Regenerate" onPress={distributeGroups} color="#2196F3" />
                )}
                {groups.map((g, i) => {
                  const groupSkill = g.reduce((acc, p) => acc + p.skill, 0);
                  return (
                    <View key={i} style={styles.groupBox}>
                      <Text style={styles.groupTitle}>Group {i + 1}</Text>
                      <View style={styles.groupMetaRow}>
                        <Text style={styles.groupMetaText}>Players: {g.length}</Text>
                        <Text style={styles.groupMetaText}>Total Skill: {groupSkill}</Text>
                      </View>
                      <View style={styles.groupPlayers}>
                        {g.map((p, j) => (
                          <Text key={j} style={styles.groupPlayerText}>
                            • {p.name} <Text style={{ color: '#888' }}>(Skill: {p.skill})</Text>
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </>
            )}
            {activeTab === 'tournaments' && (
              <>
                <Text style={styles.subheader}>Tournaments</Text>
                <TextInput
                autoComplete="off"
                  placeholder="Team Name"
                  placeholderTextColor="#333"
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  style={styles.input}
                />
                <Button title="Add Team" onPress={addTeamToTournament} />
                <Button
                  title="Generate Bracket"
                  color="#4A90E2"
                  onPress={generateBracket}
                />
                {tournamentTeams.length > 0 && (
                  <Button title="Reset Tournament" color="#f44336" onPress={confirmResetTournament} />
                )}
                <Button
                  title={showBracket ? "Hide Bracket" : "View Bracket"}
                  onPress={() => setShowBracket(!showBracket)}
                  color="#8e44ad"
                />
                {showBracket && rounds.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Tournament Bracket</Text>
                    {rounds.map((round, roundIndex) => (
                      <View key={roundIndex} style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
                          Round {roundIndex + 1}
                        </Text>
                        {round.map((match, matchIndex) => (
                          <View
                            key={matchIndex}
                            style={{
                              borderWidth: 1,
                              borderColor: '#ccc',
                              padding: 12,
                              marginBottom: 8,
                              borderRadius: 6,
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              {match.map((team, teamIndex) => {
                                const isWinner = rounds[roundIndex][matchIndex][0] === team;
                                return (
                                  <TouchableOpacity
                                    key={teamIndex}
                                    style={{
                                      flex: 1,
                                      alignItems: 'center',
                                      padding: 10,
                                      marginHorizontal: 5,
                                      borderRadius: 4,
                                      borderWidth: 1,
                                      borderColor: isWinner ? '#333' : '#aaa',
                                      backgroundColor: '#fff',
                                    }}
                                    onPress={() => handleWinnerSelect(roundIndex, matchIndex, team)}
                                  >
                                    <Text style={{ fontWeight: 'bold' }}>{team}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.subheader}>Teams</Text>
                {tournamentTeams.map((team, i) => (
                  <View key={i} style={styles.groupBox}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{team.name}</Text>
                    <Text>Rating: {team.rating}</Text>
                    <Text>Members: {team.members.length > 0 ? team.members.join(', ') : 'None'}</Text>
                    <View style={styles.actionsRow}>
                      <Button title="Edit Rating" onPress={() => promptUpdateRating(i)} />
                      <Button title="Add Member" onPress={() => promptAddMember(i)} />
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
      {isAdmin && (
  <View style={styles.bottomActions}>
    <TouchableOpacity onPress={confirmResetCheckIns} style={{ backgroundColor: '#f44336', padding: 10, borderRadius: 6 }}>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reset All Check-ins</Text>
</TouchableOpacity>
<TouchableOpacity onPress={confirmLogoutAdmin} style={{ backgroundColor: '#888', padding: 10, borderRadius: 6 }}>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
</TouchableOpacity>
  </View>
)}
    </SafeAreaView>
  );
}