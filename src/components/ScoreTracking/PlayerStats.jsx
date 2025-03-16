import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const PlayerStats = () => {
  const { players, allTimeStats, sessionStats, sessionActive } = useAppContext();
  const [viewMode, setViewMode] = useState(sessionActive ? 'session' : 'allTime');
  
  const calculateStats = (player, viewMode) => {
    const stats = viewMode === 'session' 
      ? (sessionStats[player.id] || { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 })
      : (allTimeStats[player.id] || { wins: 0, losses: 0, total_points: 0, games_played: 0 });
    
    const gamesPlayed = viewMode === 'session' ? stats.gamesPlayed : stats.games_played;
    const totalPoints = viewMode === 'session' ? stats.totalPoints : stats.total_points;
    
    const winPercentage = gamesPlayed > 0 ? Math.round((stats.wins / gamesPlayed) * 100) : 0;
    const avgPoints = gamesPlayed > 0 ? Math.round((totalPoints / gamesPlayed) * 10) / 10 : 0;
    
    return {
      gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      winPercentage,
      avgPoints
    };
  };
  
  // Filter players based on view mode
  const relevantPlayers = players.filter(player => {
    if (viewMode === 'session') {
      return sessionStats[player.id];
    }
    return true;
  });
  
  return (
    <div className="player-stats">
      <h2>Player Statistics</h2>
      
      {sessionActive && (
        <div className="view-toggle">
          <button 
            className={`toggle-button ${viewMode === 'session' ? 'active' : ''}`}
            onClick={() => setViewMode('session')}
          >
            Current Session
          </button>
          <button 
            className={`toggle-button ${viewMode === 'allTime' ? 'active' : ''}`}
            onClick={() => setViewMode('allTime')}
          >
            All Time
          </button>
        </div>
      )}
      
      <table className="stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Games</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win %</th>
            <th>Avg Points</th>
          </tr>
        </thead>
        <tbody>
          {relevantPlayers.map(player => {
            const { gamesPlayed, wins, losses, winPercentage, avgPoints } = calculateStats(player, viewMode);
            
            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                <td>{gamesPlayed}</td>
                <td>{wins}</td>
                <td>{losses}</td>
                <td>{winPercentage}%</td>
                <td>{avgPoints}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStats;