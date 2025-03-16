import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';

const MatchHistory = () => {
  const { viewMode, activeSession } = useAppContext();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      
      let query = supabase
        .from('matches')
        .select(`
          *,
          player1:players!player1_id(name),
          player2:players!player2_id(name),
          winner:players!winner_id(name),
          session:sessions!session_id(created_at)
        `)
        .order('created_at', { ascending: false });
      
      if (viewMode === 'current' && activeSession) {
        query = query.eq('session_id', activeSession.id);
      } else {
        query = query.limit(30); // Limit all-time view
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching match history:', error);
      } else {
        setMatches(data || []);
      }
      
      setLoading(false);
    };
    
    fetchMatches();
  }, [viewMode, activeSession]);
  
  if (loading) {
    return <div>Loading match history...</div>;
  }
  
  if (matches.length === 0) {
    return <p className="no-data">No matches available to display.</p>;
  }
  
  return (
    <div className="match-history">
      <table className="stats-table">
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
            const date = new Date(match.session?.created_at).toLocaleDateString();
            const player1Name = match.player1?.name || `Player ${match.player1_id}`;
            const player2Name = match.player2?.name || `Player ${match.player2_id}`;
            const winnerName = match.winner?.name || 'Tie';
            
            return (
              <tr key={match.id}>
                <td>{date}</td>
                <td>{player1Name} vs {player2Name}</td>
                <td>{match.player1_score} - {match.player2_score}</td>
                <td>{winnerName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MatchHistory;