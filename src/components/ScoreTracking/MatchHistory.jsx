import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAppContext } from '../../context/AppContext';

const MatchHistory = () => {
  const { players } = useAppContext();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
// In MatchHistory.jsx useEffect
useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching match history:', error);
      } else {
        setMatches(data || []);
      }
      
      setLoading(false);
    };
    
    fetchMatches();
  }, []);
  
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return <div className="match-history">Loading match history...</div>;
  }
  
  return (
    <div className="match-history">
      <h2>Match History</h2>
      
      {matches.length === 0 ? (
        <p>No matches have been recorded yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Players</th>
              <th>Score</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              const player1Name = getPlayerName(match.player1_id);
              const player2Name = getPlayerName(match.player2_id);
              const winner = match.player1_score > match.player2_score 
                ? player1Name 
                : match.player2_score > match.player1_score 
                  ? player2Name 
                  : 'Tie';
              
              return (
                <tr key={match.id}>
                  <td>{formatDate(match.session_date)}</td>
                  <td>{player1Name} vs {player2Name}</td>
                  <td>{match.player1_score} - {match.player2_score}</td>
                  <td>{winner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MatchHistory;