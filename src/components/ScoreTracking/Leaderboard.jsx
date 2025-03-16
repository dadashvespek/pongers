import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const Leaderboard = () => {
  const { players, allTimeStats } = useAppContext();
  const [sortBy, setSortBy] = useState('winPercentage');
  
  // Filter players with at least one game
  const playersWithStats = players.filter(player => {
    const stats = allTimeStats[player.id];
    return stats && stats.games_played > 0;
  });
  
  // Calculate derived stats and sort players
  const rankedPlayers = playersWithStats.map(player => {
    const stats = allTimeStats[player.id] || { 
      wins: 0, 
      losses: 0, 
      total_points: 0, 
      games_played: 0 
    };
    
    const winPercentage = stats.games_played > 0 
      ? (stats.wins / stats.games_played) * 100 
      : 0;
    
    return {
      ...player,
      stats,
      winPercentage,
    };
  }).sort((a, b) => {
    if (sortBy === 'winPercentage') {
      return b.winPercentage - a.winPercentage;
    } else if (sortBy === 'totalGames') {
      return b.stats.games_played - a.stats.games_played;
    } else if (sortBy === 'totalPoints') {
      return b.stats.total_points - a.stats.total_points;
    }
    return 0;
  });
  
  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      
      <div className="sort-controls">
        <span>Sort by: </span>
        <button 
          className={`sort-button ${sortBy === 'winPercentage' ? 'active' : ''}`}
          onClick={() => setSortBy('winPercentage')}
        >
          Win %
        </button>
        <button 
          className={`sort-button ${sortBy === 'totalGames' ? 'active' : ''}`}
          onClick={() => setSortBy('totalGames')}
        >
          Total Games
        </button>
        <button 
          className={`sort-button ${sortBy === 'totalPoints' ? 'active' : ''}`}
          onClick={() => setSortBy('totalPoints')}
        >
          Total Points
        </button>
      </div>
      
      {rankedPlayers.length === 0 ? (
        <p>No players have recorded games yet.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Win %</th>
              <th>W/L</th>
              <th>Games</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((player, index) => (
              <tr key={player.id} className={index < 3 ? 'top-ranked' : ''}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{Math.round(player.winPercentage)}%</td>
                <td>{player.stats.wins}/{player.stats.losses}</td>
                <td>{player.stats.games_played}</td>
                <td>{player.stats.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;