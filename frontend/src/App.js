import React, { useState } from 'react';
import { useUsers } from './hooks/useUsers';
import { UserRepository } from './repositories/UserRepository';
import { useAuth } from './hooks/useAuth'; // Assume similar hook for Auth

function App() {
  const { users, loading, addUser, deleteUser } = useUsers();
  const [name, setName] = useState('');
  const [zip, setZip] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    addUser(name, zip);
    setName(''); setZip('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>RentRedi Landlord Dashboard</h1>
      
      {/* Auth Section */}
      <button onClick={UserRepository.login}>Login with Google</button>
      
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="ZIP Code" value={zip} onChange={e => setZip(e.target.value)} />
        <button type="submit">Add User</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <ul>
          {users.map(u => (
            <li key={u.id}>
              {u.name} - {u.zip} ({u.lat}, {u.lon})
              <button onClick={() => deleteUser(u.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;