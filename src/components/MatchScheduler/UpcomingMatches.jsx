// src/components/MatchScheduler/UpcomingMatches.jsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const UpcomingMatches = () => {
  const { matches, currentMatchIndex } = useAppContext();
  
  // Only show the next 3 upcoming matches
  const upcomingMatches = matches.slice(currentMatchIndex + 1, currentMatchIndex + 4);
  
  if (!upcomingMatches.length) {
    return (
      <div className="upcoming-matches">
        <h3>Upcoming Matches</h3>
        <p>No more matches in this session.</p>
      </div>
    );
  }
  
  return (
    <div className="upcoming-matches">
      <h3>Upcoming Matches</h3>
      
      <div className="matches-list">
        {upcomingMatches.map((match, index) => (
          <div key={index} className="upcoming-match">
            <span>{match.player1.name}</span>
            <span className="vs">vs</span>
            <span>{match.player2.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingMatches;