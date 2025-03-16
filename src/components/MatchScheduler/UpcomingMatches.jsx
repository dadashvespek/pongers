import React from 'react';
import { useAppContext } from '../../context/AppContext';

const UpcomingMatches = () => {
  const { sessionMatches, currentMatchIndex } = useAppContext();
  
  if (!sessionMatches || sessionMatches.length === 0 || currentMatchIndex >= sessionMatches.length - 1) {
    return null;
  }
  
  const upcomingMatches = sessionMatches.slice(currentMatchIndex + 1);
  
  return (
    <div className="upcoming-matches">
      <h3>Upcoming Matches</h3>
      
      {upcomingMatches.map((match, index) => (
        <div key={match.id || index} className="match-card">
          <div className="player-name">{match.player1_name || `Player ${match.player1_id}`}</div>
          <div className="match-vs">VS</div>
          <div className="player-name">{match.player2_name || `Player ${match.player2_id}`}</div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingMatches;