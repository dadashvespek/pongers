import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';

const Leaderboard = () => {
  const { viewMode, activeSession } = useAppContext();
  const [players, setPlayers] = useState([]);
  const [sortBy, setSortBy] = useState('win_percentage');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // We'll use the same data source as PlayerStats but with different sorting
    const fetchPlayerStats = async () => {
      setLoading(true);
      
      if (viewMode === 'current' && activeSession) {
        // For current session, calculate on the fly
        const { data: matches } = await supabase
          .from('matches')
          .select('*')
          .eq('session_id', activeSession.id);
        
        const { data: sessionPlayers } = await supabase
          .from('session_players')
          .select('player_id, players(*)')
          .eq('session_id', activeSession.id);
        
        if (sessionPlayers && matches) {
          // Calculate stats for this session
          const stats = sessionPlayers.map(sp => {
            const player = sp.players;
            const playerId = sp.player_id;
            
            const playerMatches = matches.filter(m => 
              m.player1_id === playerId || m.player2_id === playerId
            );
            
            const wins = playerMatches.filter(m => m.winner_id === playerId).length;
            const totalGames = playerMatches.filter(m => m.is_completed).length;
            const losses = totalGames - wins;
            
            // Calculate total points scored
            const pointsScored = playerMatches.reduce((total, match) => {
              if (match.player1_id === playerId) {
                return total + match.player1_score;
              } else {
                return total + match.player2_score;
              }
            }, 0);
            
            return {
              id: player.id,
              name: player.name,
              wins,
              losses,
              total_games: totalGames,
              win_percentage: totalGames > 0 ? (wins / totalGames * 100) : 0,
              points_scored: pointsScored
            };
          });
          
          setPlayers(stats);
        }
      } else {
        // For all-time stats
        const { data } = await supabase
          .from('player_stats')
          .select('*, players(*)');
        
        if (data) {
          setPlayers(data.map(stat => ({
            id: stat.player_id,
            name: stat.players.name,
            wins: stat.wins,
            losses: stat.losses,
            total_games: stat.total_games,
            win_percentage: stat.win_percentage,
            points_scored: stat.points_scored || 0
          })));
        }
      }
      
      setLoading(false);
    };
    
    fetchPlayerStats();
  }, [viewMode, activeSession]);
  
  // Sort players based on selected metric
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'win_percentage') {
      return b.win_percentage - a.win_percentage;
    } else if (sortBy === 'wins') {
      return b.wins - a.wins;
    } else if (sortBy === 'total_games') {
      return b.total_games - a.total_games;
    } else if (sortBy === 'points_scored') {
      return b.points_scored - a.points_scored;
    }
    return 0;
  });
  
  if (loading) {
    return <div>Loading leaderboard...</div>;
  }
  
  if (players.length === 0) {
    return <p className="no-data">No leaderboard data available.</p>;
  }
  
  return (
    <div className="leaderboard">
      <div className="sort-controls">
        <label>Sort by: </label>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="win_percentage">Win Percentage</option>
          <option value="wins">Total Wins</option>
          <option value="total_games">Games Played</option>
          <option value="points_scored">Points Scored</option>
        </select>
      </div>
      
      <table className="stats-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Wins</th>
            <th>Games</th>
            <th>Win %</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.wins}</td>
              <td>{player.total_games}</td>
              <td>{player.win_percentage.toFixed(1)}%</td>
              <td>{player.points_scored}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;