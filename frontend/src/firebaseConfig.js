import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// These values come from your Firebase Console:
// Project Settings > General > Your Apps > Web App (Add app if you haven't)
const firebaseConfig = {
  apiKey: "AIzaSyA_HAIepdEy6YU4z1GQEh123rBb6ph0Tmc",
  authDomain: "rentredi-short-take-home.firebaseapp.com",
  databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
  projectId: "rentredi-short-take-home",
  storageBucket: "rentredi-short-take-home.firebasestorage.app",
  messagingSenderId: "635137921676",
  appId: "1:635137921676:web:331b9c4b5a30cd242521a9"
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getDatabase(app);
export const auth = getAuth(app);
