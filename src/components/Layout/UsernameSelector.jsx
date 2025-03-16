// src/components/Layout/UsernameSelector.jsx
import React, { useState, useEffect } from 'react';

const UsernameSelector = () => {
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Anonymous');
  const [isEditing, setIsEditing] = useState(false);
  
  const saveUsername = () => {
    localStorage.setItem('username', username || 'Anonymous');
    setIsEditing(false);
  };
  
  return (
    <div className="username-selector">
      {isEditing ? (
        <div className="username-edit">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />
          <button onClick={saveUsername}>Save</button>
        </div>
      ) : (
        <div className="username-display">
          <span>Signed in as: {username}</span>
          <button onClick={() => setIsEditing(true)}>Change</button>
        </div>
      )}
    </div>
  );
};

export default UsernameSelector;