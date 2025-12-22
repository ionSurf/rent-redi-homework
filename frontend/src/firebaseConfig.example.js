import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// EXAMPLE - Replace these with your actual values from Firebase Console
// Get them from: Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with YOUR API key
  authDomain: "rentredi-short-take-home.firebaseapp.com", // Replace with YOUR auth domain
  databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com", // Your database URL
  projectId: "rentredi-short-take-home", // Replace with YOUR project ID
  storageBucket: "rentredi-short-take-home.appspot.com", // Replace with YOUR storage bucket
  messagingSenderId: "123456789012", // Replace with YOUR sender ID
  appId: "1:123456789012:web:abcdef1234567890" // Replace with YOUR app ID
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
