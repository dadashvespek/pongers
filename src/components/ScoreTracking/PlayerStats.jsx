import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';

const PlayerStats = () => {
  const { viewMode, activeSession } = useAppContext();
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPlayerStats = async () => {
      setLoading(true);
      
      if (viewMode === 'current' && activeSession) {
        // For current session, calculate stats on the fly
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .eq('session_id', activeSession.id);
        
        const { data: sessionPlayers } = await supabase
          .from('session_players')
          .select('player_id, players(*)')
          .eq('session_id', activeSession.id);
        
        if (sessionPlayers && matches) {
          // Calculate player stats for this session
          const stats = sessionPlayers.map(sp => {
            const player = sp.players;
            const playerId = sp.player_id;
            
            const playerMatches = matches.filter(m => 
              m.player1_id === playerId || m.player2_id === playerId
            );
            
            const wins = playerMatches.filter(m => m.winner_id === playerId).length;
            const totalGames = playerMatches.filter(m => m.is_completed).length;
            const losses = totalGames - wins;
            
            return {
              id: player.id,
              name: player.name,
              wins,
              losses,
              total_games: totalGames,
              win_percentage: totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : '0.0'
            };
          });
          
          setPlayerStats(stats);
        }
      } else {
        // For all-time stats, fetch from player_stats view
        const { data } = await supabase
          .from('player_stats')
          .select('*, players(*)');
        
        if (data) {
          setPlayerStats(data.map(stat => ({
            id: stat.player_id,
            name: stat.players.name,
            wins: stat.wins,
            losses: stat.losses,
            total_games: stat.total_games,
            win_percentage: stat.win_percentage.toFixed(1)
          })));
        }
      }
      
      setLoading(false);
    };
    
    fetchPlayerStats();
  }, [viewMode, activeSession]);
  
  if (loading) {
    return <div>Loading player stats...</div>;
  }
  
  if (playerStats.length === 0) {
    return <p className="no-data">No player statistics available.</p>;
  }
  
  return (
    <div className="player-stats">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Total Games</th>
            <th>Win %</th>
          </tr>
        </thead>
        <tbody>
          {playerStats.map(player => (
            <tr key={player.id}>
              <td>{player.name}</td>
              <td>{player.wins}</td>
              <td>{player.losses}</td>
              <td>{player.total_games}</td>
              <td>{player.win_percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStats;