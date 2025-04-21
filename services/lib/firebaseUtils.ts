// app/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCxntCdrDUnK1ik8WifA4OI8DixVJ_K_Hs',
  authDomain: 'nlvbapp.firebaseapp.com',
  projectId: 'nlvbapp',
  storageBucket: 'nlvbapp.appspot.com',
  messagingSenderId: '771776307889',
  appId: '1:771776307889:web:b0b23bfeedb1fc6659b890',
  measurementId: 'G-HXPEEE94VS',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable persistence BEFORE any reads/writes
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed — multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence is not available in this environment.');
  } else {
    console.warn('Persistence error:', err);
  }
});

export { db };

// === Firestore API ===

interface Player {
  name: string;
  [key: string]: any;
}

export const savePlayer = async (player: Player) => {
  await setDoc(doc(db, 'players', player.name), player);
};

export const deletePlayer = async (name: string) => {
  await deleteDoc(doc(db, 'players', name));
};

export const fetchPlayers = async () => {
  const snap = await getDocs(collection(db, 'players'));
  return snap.docs.map(d => d.data());
};

export const saveCheckedInPlayers = async (list: string[]) => {
  await setDoc(doc(db, 'checkedInPlayers', 'list'), { players: list });
};

export const getCheckedInPlayers = async () => {
  const docSnap = await getDoc(doc(db, 'checkedInPlayers', 'list'));
  return docSnap.exists() ? docSnap.data().players : [];
};

export const saveGroups = async (groups: any[]) => {
  await setDoc(doc(db, 'groups', 'data'), { groups });
};

export const getGroups = async () => {
  const docSnap = await getDoc(doc(db, 'groups', 'data'));
  return docSnap.exists() ? docSnap.data().groups : [];
};

interface TournamentTeam {
  name: string;
  [key: string]: any;
}

export const saveTournamentTeam = async (team: TournamentTeam) => {
  await setDoc(doc(db, 'tournamentTeams', team.name), team);
};

export const deleteTournamentTeam = async (teamName: string) => {
  await deleteDoc(doc(db, 'tournamentTeams', teamName));
};

export const getTournamentTeams = async () => {
  const snap = await getDocs(collection(db, 'tournamentTeams'));
  return snap.docs.map(d => d.data());
};

export const saveRounds = async (rounds: any[]) => {
  await setDoc(doc(db, 'rounds', 'bracket'), { rounds });
};

export const getRounds = async () => {
  const docSnap = await getDoc(doc(db, 'rounds', 'bracket'));
  return docSnap.exists() ? docSnap.data().rounds : [];
};

export const saveAppMeta = async (meta: Record<string, any>) => {
  await setDoc(doc(db, 'appMeta', 'meta'), meta);
};

export const getAppMeta = async () => {
  const docSnap = await getDoc(doc(db, 'appMeta', 'meta'));
  return docSnap.exists() ? docSnap.data() : {};
};
