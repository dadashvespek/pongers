import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerSelection = () => {
  const { allPlayers, selectedPlayers, togglePlayerSelection, addPlayer } = useAppContext();
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddNewPlayer = async () => {
    if (newPlayerName.trim()) {
      const player = await addPlayer(newPlayerName.trim());
      if (player) {
        togglePlayerSelection(player);
        setNewPlayerName('');
      }
    }
  };

  return (
    <div className="player-selection">
      <div className="add-player-form">
        <input 
          type="text" 
          className="input-field"
          placeholder="New player name" 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddNewPlayer()}
        />
        <button 
          className="btn"
          onClick={handleAddNewPlayer}
        >
          Add Player
        </button>
      </div>
      
      <div className="grid">
        <div className="player-list">
          <h3>Available Players</h3>
          {allPlayers.length === 0 ? (
            <p>No players added yet. Add your first player above!</p>
          ) : (
            allPlayers.map(player => (
              <div key={player.id} className="player-item">
                <div className="player-name">{player.name}</div>
                <button 
                  className={`btn ${selectedPlayers.find(p => p.id === player.id) ? 'btn-secondary' : ''}`}
                  onClick={() => togglePlayerSelection(player)}
                >
                  {selectedPlayers.find(p => p.id === player.id) ? 'Remove' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="selected-players">
          <h3>Selected Players ({selectedPlayers.length})</h3>
          {selectedPlayers.length === 0 ? (
            <p>No players selected. Select at least 2 players to start.</p>
          ) : (
            selectedPlayers.map(player => (
              <div key={player.id} className="player-item">
                <div className="player-name">{player.name}</div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => togglePlayerSelection(player)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;