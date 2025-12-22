import { db } from "../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

export const UserRepository = {
  // CRUD Operations
  subscribeToUsers: (callback) => {
    const userRef = ref(db, 'users');
    return onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      callback(list);
    });
  },

  createUser: async (name, zip) => {
    // We call our Node.js API to handle the weather logic
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zip })
    });
    return response.json();
  },

  updateUser: async (id, name, zip) => {
    // Call our Node.js API to handle the update and re-fetch weather if zip changed
    const response = await fetch(`http://localhost:8080/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zip })
    });
    return response.json();
  },

  deleteUser: (id) => remove(ref(db, `users/${id}`))
};
