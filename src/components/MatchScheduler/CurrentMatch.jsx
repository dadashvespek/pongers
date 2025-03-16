import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const CurrentMatch = () => {
  const { 
    sessionMatches, 
    currentMatchIndex, 
    updateScore, 
    completeMatch 
  } = useAppContext();
  
  const [showScoreConfirmation, setShowScoreConfirmation] = useState(false);
  
  if (!sessionMatches || sessionMatches.length === 0 || currentMatchIndex >= sessionMatches.length) {
    return <div>No active match</div>;
  }
  
  const currentMatch = sessionMatches[currentMatchIndex];
  
  // Find player objects from the match data
  const player1 = {
    id: currentMatch.player1_id,
    name: currentMatch.player1_name || `Player ${currentMatch.player1_id}`
  };
  
  const player2 = {
    id: currentMatch.player2_id,
    name: currentMatch.player2_name || `Player ${currentMatch.player2_id}`
  };
  
  const handleFinishMatch = () => {
    completeMatch();
    setShowScoreConfirmation(false);
  };
  
  return (
    <div className="current-match-container">
      <h3>Current Match</h3>
      
      <div className="match-card current-match">
        <div className="player-side">
          <h4>{player1.name}</h4>
          <div className="score-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => updateScore(player1, false)}
              disabled={currentMatch.player1_score <= 0}
            >
              -
            </button>
            <span className="score-number">{currentMatch.player1_score}</span>
            <button 
              className="btn"
              onClick={() => updateScore(player1, true)}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="match-vs">VS</div>
        
        <div className="player-side">
          <h4>{player2.name}</h4>
          <div className="score-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => updateScore(player2, false)}
              disabled={currentMatch.player2_score <= 0}
            >
              -
            </button>
            <span className="score-number">{currentMatch.player2_score}</span>
            <button 
              className="btn"
              onClick={() => updateScore(player2, true)}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {!showScoreConfirmation ? (
        <button 
          className="btn finish-match-btn"
          onClick={() => setShowScoreConfirmation(true)}
        >
          Finish Match
        </button>
      ) : (
        <div className="score-confirmation">
          <p>Confirm final score: {player1.name} {currentMatch.player1_score} - {currentMatch.player2_score} {player2.name}</p>
          <div className="confirmation-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowScoreConfirmation(false)}
            >
              Cancel
            </button>
            <button 
              className="btn"
              onClick={handleFinishMatch}
            >
              Confirm & Next Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentMatch;