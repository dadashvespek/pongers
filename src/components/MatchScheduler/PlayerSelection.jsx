import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerSelection = () => {
  const { 
    players, 
    selectedPlayers, 
    selectPlayer, 
    unselectPlayer,
    addPlayer
  } = useAppContext();
  
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    const player = await addPlayer(newPlayerName.trim());
    if (player) {
      selectPlayer(player);
      setNewPlayerName('');
    }
  };
  
  return (
    <div className="player-selection">
      <div className="existing-players">
        <h3>Select Players</h3>
        <div className="players-grid">
          {players.map(player => (
            <button
              key={player.id}
              className={`player-button ${selectedPlayers.some(p => p.id === player.id) ? 'selected' : ''}`}
              onClick={() => selectPlayer(player)}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>
      
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
      
      <div className="selected-players">
        <h3>Selected Players ({selectedPlayers.length})</h3>
        <div className="selected-players-list">
          {selectedPlayers.map(player => (
            <div key={player.id} className="selected-player">
              <span>{player.name}</span>
              <button onClick={() => unselectPlayer(player.id)}>X</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;