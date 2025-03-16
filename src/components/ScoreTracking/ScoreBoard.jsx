import React from 'react';
import { useAppContext } from '../../context/AppContext';

const ScoreBoard = () => {
  const { selectedPlayers, sessionStats } = useAppContext();
  
  return (
    <div className="score-board">
      <h3>Session Scoreboard</h3>
      
      <table className="score-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>W</th>
            <th>L</th>
            <th>Points</th>
            <th>Win %</th>
          </tr>
        </thead>
        <tbody>
          {selectedPlayers.map(player => {
            const stats = sessionStats[player.id] || { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 };
            const winPercentage = stats.gamesPlayed > 0 
              ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
              : 0;
            
            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                <td>{stats.wins}</td>
                <td>{stats.losses}</td>
                <td>{stats.totalPoints}</td>
                <td>{winPercentage}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreBoard;