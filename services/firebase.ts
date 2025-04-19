// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxntCdrDUnK1ik8WifA4OI8DixVJ_K_Hs",
  authDomain: "nlvbapp.firebaseapp.com",
  projectId: "nlvbapp",
  storageBucket: "nlvbapp.firebasestorage.app",
  messagingSenderId: "771776307889",
  appId: "1:771776307889:web:b0b23bfeedb1fc6659b890",
  measurementId: "G-HXPEEE94VS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Export the Firestore database instance