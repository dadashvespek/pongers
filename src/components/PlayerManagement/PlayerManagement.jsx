// src/components/PlayerManagement/PlayerManagement.jsx
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerManagement = () => {
  const { players, addPlayer, removePlayer } = useAppContext();
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    const player = await addPlayer(newPlayerName.trim());
    if (player) {
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to remove this player? Their match history will be preserved.')) {
      await removePlayer(playerId);
    }
  };
  
  return (
    <div className="player-management">
      <h2>Player Management</h2>
      
      <div className="add-new-player">
        <h3>Add New Player</h3>
        <div className="new-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddNewPlayer()}
          />
          <button onClick={handleAddNewPlayer}>Add Player</button>
        </div>
      </div>
      
      <div className="existing-players">
        <h3>Existing Players ({players.length})</h3>
        <div className="players-grid">
          {players.map(player => (
            <div key={player.id} className="player-card">
              <span>{player.name}</span>
              <button 
                className="remove-player-btn"
                onClick={() => handleRemovePlayer(player.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;