// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw-Fmi1gzDgg5J7fSZf7cTsM-8ooXtw7E",
  authDomain: "mediguide-bc57a.firebaseapp.com",
  projectId: "mediguide-bc57a",
  storageBucket: "mediguide-bc57a.firebasestorage.app",
  messagingSenderId: "495469138021",
  appId: "1:495469138021:web:6a7dc09f37f761d0b3f68c",
  measurementId: "G-6JN5VQER8C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Export auth so Login.js can use it
export { auth };