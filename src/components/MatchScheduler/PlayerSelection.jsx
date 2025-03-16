// src/components/MatchScheduler/PlayerSelection.jsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerSelection = () => {
  const { 
    players, 
    selectedPlayers, 
    selectPlayer, 
    unselectPlayer,
  } = useAppContext();
  
  return (
    <div className="player-selection">
      <div className="existing-players">
        <h3>Select Players for Session</h3>
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