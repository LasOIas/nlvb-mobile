// app/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCxntCdrDUnK1ik8WifA4OI8DixVJ_K_Hs',
  authDomain: 'nlvbapp.firebaseapp.com',
  projectId: 'nlvbapp',
  storageBucket: 'nlvbapp.appspot.com',
  messagingSenderId: '771776307889',
  appId: '1:771776307889:web:b0b23bfeedb1fc6659b890',
  measurementId: 'G-HXPEEE94VS'
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

// ✅ ENABLE PERSISTENCE EARLY
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed due to multiple tabs.');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not supported in this environment.');
  } else {
    console.warn('Persistence error:', err);
  }
});

export { db };
