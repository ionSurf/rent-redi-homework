import { useState, useEffect } from 'react';
import { UserRepository } from '../repositories/UserRepository';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = UserRepository.subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup WebSocket on unmount
  }, []);

  const addUser = async (name, zip) => {
    await UserRepository.createUser(name, zip);
  };

  return { users, loading, addUser, deleteUser: UserRepository.deleteUser };
}