import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabaseClient';
import { generateRotations } from '../utils/rotationCalculator';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // State
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentPlayer1Score, setCurrentPlayer1Score] = useState(0);
  const [currentPlayer2Score, setCurrentPlayer2Score] = useState(0);
  const [scoreUpdatePending, setScoreUpdatePending] = useState(false);
  const [localScoreTimestamp, setLocalScoreTimestamp] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStats, setSessionStats] = useState({});
  const [allTimeStats, setAllTimeStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Poll for active session
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data, error } = await supabase.from('active_session').select('*').eq('id', 1).single();
        
        if (error) {
          console.error('Error checking active session:', error);
          return;
        }
        
        if (data && data.is_active) {
          setSessionActive(true);
          setMatches(data.matches || []);
          setCurrentMatchIndex(data.current_match_index || 0);
          setSelectedPlayers(data.selected_players || []);
          setSessionStats(data.session_stats || {});
          
          const dbUpdateTime = new Date(data.last_updated || 0).getTime();
          if (!scoreUpdatePending && dbUpdateTime > localScoreTimestamp) {
            setCurrentPlayer1Score(data.current_player1_score || 0);
            setCurrentPlayer2Score(data.current_player2_score || 0);
          }
        } else if (!data.is_active && sessionActive) {
          setSessionActive(false);
          setMatches([]);
          setCurrentMatchIndex(0);
          setSelectedPlayers([]);
          setSessionStats({});
          setCurrentPlayer1Score(0);
          setCurrentPlayer2Score(0);
        }
      } catch (err) {
        console.error('Exception checking active session:', err);
      }
    };
    
    checkActiveSession();
    const intervalId = setInterval(checkActiveSession, 3000);
    return () => clearInterval(intervalId);
  }, [sessionActive, scoreUpdatePending, localScoreTimestamp]);
  
  // Sync scores to Supabase
  useEffect(() => {
    const syncScores = async () => {
      if (!sessionActive || !scoreUpdatePending) return;
      
      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('active_session')
          .update({
            current_player1_score: currentPlayer1Score,
            current_player2_score: currentPlayer2Score,
            last_updated: now
          })
          .eq('id', 1);
          
        if (error) console.error('Error syncing scores:', error);
        setScoreUpdatePending(false);
      } catch (err) {
        console.error('Exception syncing scores:', err);
      }
    };
    
    syncScores();
  }, [currentPlayer1Score, currentPlayer2Score, sessionActive, scoreUpdatePending]);
  
  // Load players on initial load
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('players').select('*');
        if (error) {
          console.error('Error fetching players:', error);
          setError('Failed to load players');
          return;
        }
        setPlayers(data || []);
      } catch (err) {
        console.error('Exception fetching players:', err);
        setError('Failed to load players');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // Load all-time stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('player_stats').select('*');
        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }
        
        const statsObj = {};
        data?.forEach(stat => { statsObj[stat.player_id] = stat; });
        setAllTimeStats(statsObj);
      } catch (err) {
        console.error('Exception fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Score update functions
  const updatePlayer1Score = (score) => {
    setCurrentPlayer1Score(score);
    setScoreUpdatePending(true);
    setLocalScoreTimestamp(Date.now());
  };
  
  const updatePlayer2Score = (score) => {
    setCurrentPlayer2Score(score);
    setScoreUpdatePending(true);
    setLocalScoreTimestamp(Date.now());
  };
  
  // Player management
  const removePlayer = async (playerId) => {
    if (!playerId) return false;
    
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) {
        console.error('Error removing player:', error);
        return false;
      }
      
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
      return true;
    } catch (err) {
      console.error('Exception removing player:', err);
      return false;
    }
  };
  
  const addPlayer = async (name) => {
    if (!name || !name.trim()) return null;
    
    try {
      const newPlayerId = uuidv4();
      const { data, error } = await supabase
        .from('players')
        .insert({ id: newPlayerId, name: name.trim() })
        .select();
      
      if (error) {
        console.error('Error adding player:', error);
        return null;
      }
      
      const newPlayer = data[0];
      setPlayers(prev => [...prev, newPlayer]);
      return newPlayer;
    } catch (err) {
      console.error('Exception adding player:', err);
      return null;
    }
  };
  
  // Player selection
  const selectPlayer = (player) => {
    if (!player || !player.id) {
      console.error('Invalid player object:', player);
      return;
    }
    
    if (!selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
  };
  
  const unselectPlayer = (playerId) => {
    if (!playerId) return;
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };
  
  // Session management
  const startSession = async () => {
    if (selectedPlayers.length < 2) {
      setError('Need at least 2 players to start a session');
      return;
    }
    
    try {
      const generatedMatches = generateRotations(selectedPlayers, 100);
      const stats = {};
      selectedPlayers.forEach(player => {
        if (player && player.id) {
          stats[player.id] = { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 };
        }
      });
      
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: true,
          matches: generatedMatches,
          current_match_index: 0,
          selected_players: selectedPlayers,
          session_stats: stats,
          current_player1_score: 0,
          current_player2_score: 0,
          last_updated: now
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error starting global session:', error);
        setError('Failed to start global session');
        return;
      }
      
      setMatches(generatedMatches);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      setSessionStats(stats);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setLocalScoreTimestamp(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    }
  };
  
  const endSession = async () => {
    try {
      // Save session results
      for (const playerId in sessionStats) {
        if (!playerId) continue;
        
        const playerStat = sessionStats[playerId];
        try {
          const wins = (allTimeStats[playerId]?.wins || 0) + playerStat.wins;
          const losses = (allTimeStats[playerId]?.losses || 0) + playerStat.losses;
          const totalPoints = (allTimeStats[playerId]?.total_points || 0) + playerStat.totalPoints;
          const gamesPlayed = (allTimeStats[playerId]?.games_played || 0) + playerStat.gamesPlayed;
          
          const { error } = await supabase
            .from('player_stats')
            .upsert({
              player_id: playerId,
              wins,
              losses,
              total_points: totalPoints,
              games_played: gamesPlayed
            });
          
          if (error) console.error('Error updating player stats:', error);
        } catch (err) {
          console.error('Exception updating player stats for player', playerId, err);
        }
      }
      
      // Update local all-time stats
      const updatedStats = { ...allTimeStats };
      for (const playerId in sessionStats) {
        if (!playerId) continue;
        
        const playerStat = sessionStats[playerId];
        
        if (!updatedStats[playerId]) {
          updatedStats[playerId] = {
            player_id: playerId,
            wins: 0,
            losses: 0,
            total_points: 0,
            games_played: 0
          };
        }
        
        updatedStats[playerId].wins += playerStat.wins;
        updatedStats[playerId].losses += playerStat.losses;
        updatedStats[playerId].total_points += playerStat.totalPoints;
        updatedStats[playerId].games_played += playerStat.gamesPlayed;
      }
      
      setAllTimeStats(updatedStats);
      
      // Reset global session state
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: false,
          matches: [],
          current_match_index: 0,
          selected_players: [],
          session_stats: {},
          current_player1_score: 0,
          current_player2_score: 0,
          last_updated: now
        })
        .eq('id', 1);
      
      if (error) console.error('Error ending global session:', error);
      
      // Reset local session state
      setSessionActive(false);
      setSelectedPlayers([]);
      setMatches([]);
      setCurrentMatchIndex(0);
      setSessionStats({});
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setLocalScoreTimestamp(0);
    } catch (err) {
      console.error('Exception ending session:', err);
    }
  };
  
  const recordMatchResult = async () => {
    if (currentMatchIndex >= matches.length) {
      console.error('Invalid match index:', currentMatchIndex);
      return;
    }
    
    try {
      const currentMatch = matches[currentMatchIndex];
      const player1Id = currentMatch.player1.id;
      const player2Id = currentMatch.player2.id;
      
      if (!player1Id || !player2Id) {
        console.error('Invalid player IDs:', { player1: currentMatch.player1, player2: currentMatch.player2 });
        return;
      }
      
      const player1Score = currentPlayer1Score;
      const player2Score = currentPlayer2Score;
      
      // Update session stats
      const updatedStats = { ...sessionStats };
      
      if (updatedStats[player1Id]) {
        updatedStats[player1Id].gamesPlayed += 1;
        updatedStats[player1Id].totalPoints += player1Score;
      }
      
      if (updatedStats[player2Id]) {
        updatedStats[player2Id].gamesPlayed += 1;
        updatedStats[player2Id].totalPoints += player2Score;
      }
      
      // Determine winner
      if (player1Score > player2Score) {
        if (updatedStats[player1Id]) updatedStats[player1Id].wins += 1;
        if (updatedStats[player2Id]) updatedStats[player2Id].losses += 1;
      } else if (player2Score > player1Score) {
        if (updatedStats[player2Id]) updatedStats[player2Id].wins += 1;
        if (updatedStats[player1Id]) updatedStats[player1Id].losses += 1;
      }
      
      // Record match
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: player1Id,
          player2_id: player2Id,
          player1_score: player1Score,
          player2_score: player2Score,
          session_date: new Date().toISOString()
        });
      
      if (matchError) console.error('Error recording match:', matchError);
      
      const nextMatchIndex = currentMatchIndex + 1;
      
      // Generate more matches if needed
      if (nextMatchIndex >= matches.length - 10) {
        const newMatches = [...matches];
        const additionalMatches = generateRotations(selectedPlayers, 20);
        
        // Find continuity with previous matches
        const lastMatch = newMatches[newMatches.length - 1];
        const lastPlayers = [lastMatch.player1.id, lastMatch.player2.id];
        
        let bestMatchIndex = 0;
        let bestContinuityScore = 0;
        
        for (let i = 0; i < additionalMatches.length; i++) {
          const match = additionalMatches[i];
          const continuityCount = (lastPlayers.includes(match.player1.id) ? 1 : 0) + 
                                 (lastPlayers.includes(match.player2.id) ? 1 : 0);
          
          if (continuityCount > bestContinuityScore) {
            bestContinuityScore = continuityCount;
            bestMatchIndex = i;
          }
        }
        
        for (let i = 0; i < additionalMatches.length; i++) {
          const index = (bestMatchIndex + i) % additionalMatches.length;
          newMatches.push(additionalMatches[index]);
        }
        
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('active_session')
          .update({
            matches: newMatches,
            current_match_index: nextMatchIndex,
            session_stats: updatedStats,
            current_player1_score: 0,
            current_player2_score: 0,
            last_updated: now
          })
          .eq('id', 1);
        
        if (error) console.error('Error updating extended matches:', error);
        setMatches(newMatches);
      } else {
        // Just update the match index
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('active_session')
          .update({
            current_match_index: nextMatchIndex,
            session_stats: updatedStats,
            current_player1_score: 0,
            current_player2_score: 0,
            last_updated: now
          })
          .eq('id', 1);
        
        if (error) console.error('Error updating global session:', error);
      }
      
      setCurrentMatchIndex(nextMatchIndex);
      setSessionStats(updatedStats);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setLocalScoreTimestamp(Date.now());
    } catch (err) {
      console.error('Exception recording match result:', err);
    }
  };
  
  const startQuickMatch = async (player1, player2) => {
    if (!player1 || !player2 || player1.id === player2.id) {
      setError('Need two different players for a quick match');
      return;
    }
    
    try {
      const quickMatch = [{ player1, player2 }];
      const stats = {
        [player1.id]: { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 },
        [player2.id]: { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 }
      };
      
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: true,
          matches: quickMatch,
          current_match_index: 0,
          selected_players: [player1, player2],
          session_stats: stats,
          current_player1_score: 0,
          current_player2_score: 0,
          last_updated: now
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error starting global quick match:', error);
        setError('Failed to start global quick match');
        return;
      }
      
      setMatches(quickMatch);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      setSessionStats(stats);
      setSelectedPlayers([player1, player2]);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setLocalScoreTimestamp(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error starting quick match:', err);
      setError('Failed to start quick match');
    }
  };
  
  return (
    <AppContext.Provider value={{
      players, selectedPlayers, matches, currentMatchIndex, sessionActive, 
      sessionStats, allTimeStats, isLoading, error, 
      currentPlayer1Score, currentPlayer2Score,
      updatePlayer1Score, updatePlayer2Score, 
      removePlayer, addPlayer, selectPlayer, unselectPlayer,
      startSession, endSession, recordMatchResult, startQuickMatch
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;