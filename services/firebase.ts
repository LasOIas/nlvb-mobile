// app/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
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
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export { db };