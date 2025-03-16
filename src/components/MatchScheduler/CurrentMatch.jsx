// src/components/MatchScheduler/CurrentMatch.jsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const CurrentMatch = () => {
  const { 
    matches, 
    currentMatchIndex, 
    recordMatchResult,
    currentPlayer1Score,
    currentPlayer2Score,
    updatePlayer1Score,
    updatePlayer2Score
  } = useAppContext();
  
  if (!matches.length || currentMatchIndex >= matches.length) {
    return null;
  }
  
  const currentMatch = matches[currentMatchIndex];
  const { player1, player2 } = currentMatch;
  
  const handleFinishMatch = () => {
    recordMatchResult();
  };
  
  return (
    <div className="current-match">
      <h3>Current Match #{currentMatchIndex + 1}</h3>
      
      <div className="match-display">
        <div className="player-side">
          <h4>{player1.name}</h4>
          <div className="score-controls">
            <button onClick={() => updatePlayer1Score(Math.max(0, currentPlayer1Score - 1))}>-</button>
            <span className="score">{currentPlayer1Score}</span>
            <button onClick={() => updatePlayer1Score(currentPlayer1Score + 1)}>+</button>
          </div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="player-side">
          <h4>{player2.name}</h4>
          <div className="score-controls">
            <button onClick={() => updatePlayer2Score(Math.max(0, currentPlayer2Score - 1))}>-</button>
            <span className="score">{currentPlayer2Score}</span>
            <button onClick={() => updatePlayer2Score(currentPlayer2Score + 1)}>+</button>
          </div>
        </div>
      </div>
      
      <button 
        className="primary-button finish-match-button"
        onClick={handleFinishMatch}
      >
        Finish Match
      </button>
    </div>
  );
};

export default CurrentMatch;