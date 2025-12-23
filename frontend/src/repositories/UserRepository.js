import { db } from "../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import { API_BASE_URL } from "../config/api";

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
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zip })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error response formats from backend
      if (data.error) {
        throw new Error(data.error);
      } else if (data.errors && Array.isArray(data.errors)) {
        // Zod validation errors
        const errorMessages = data.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages);
      } else {
        throw new Error('Failed to create user');
      }
    }

    return data;
  },

  updateUser: async (id, name, zip) => {
    // Call our Node.js API to handle the update and re-fetch weather if zip changed
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, zip })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error response formats from backend
      if (data.error) {
        throw new Error(data.error);
      } else if (data.errors && Array.isArray(data.errors)) {
        // Zod validation errors
        const errorMessages = data.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages);
      } else {
        throw new Error('Failed to update user');
      }
    }

    return data;
  },

  deleteUser: (id) => remove(ref(db, `users/${id}`))
};