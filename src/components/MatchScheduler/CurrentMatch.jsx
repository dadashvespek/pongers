import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const CurrentMatch = () => {
  const { matches, currentMatchIndex, recordMatchResult } = useAppContext();
  
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  
  if (!matches.length || currentMatchIndex >= matches.length) {
    return null;
  }
  
  const currentMatch = matches[currentMatchIndex];
  const { player1, player2 } = currentMatch;
  
  const handleFinishMatch = () => {
    recordMatchResult(player1Score, player2Score);
    setPlayer1Score(0);
    setPlayer2Score(0);
  };
  
  return (
    <div className="current-match">
      <h3>Current Match</h3>
      
      <div className="match-display">
        <div className="player-side">
          <h4>{player1.name}</h4>
          <div className="score-controls">
            <button onClick={() => setPlayer1Score(Math.max(0, player1Score - 1))}>-</button>
            <span className="score">{player1Score}</span>
            <button onClick={() => setPlayer1Score(player1Score + 1)}>+</button>
          </div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="player-side">
          <h4>{player2.name}</h4>
          <div className="score-controls">
            <button onClick={() => setPlayer2Score(Math.max(0, player2Score - 1))}>-</button>
            <span className="score">{player2Score}</span>
            <button onClick={() => setPlayer2Score(player2Score + 1)}>+</button>
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