import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabaseClient';
import { generateRotations } from '../utils/rotationCalculator';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Players state
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  
  // Matches state
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  // Current scores state
  const [currentPlayer1Score, setCurrentPlayer1Score] = useState(0);
  const [currentPlayer2Score, setCurrentPlayer2Score] = useState(0);
  const [scoreUpdatePending, setScoreUpdatePending] = useState(false);
  
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStats, setSessionStats] = useState({});
  
  // Player stats
  const [allTimeStats, setAllTimeStats] = useState({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Set up polling for active session with score sync
  useEffect(() => {
    // Check if there's already an active session
    const checkActiveSession = async () => {
      try {
        const { data, error } = await supabase
          .from('active_session')
          .select('*')
          .eq('id', 1)
          .single();
        
        if (error) {
          console.error('Error checking active session:', error);
          return;
        }
        
        // If there's an active session, load it
        if (data && data.is_active) {
          setSessionActive(true);
          setMatches(data.matches || []);
          setCurrentMatchIndex(data.current_match_index || 0);
          setSelectedPlayers(data.selected_players || []);
          setSessionStats(data.session_stats || {});
          
          // Only update scores if we're not currently editing them
          if (!scoreUpdatePending) {
            setCurrentPlayer1Score(data.current_player1_score || 0);
            setCurrentPlayer2Score(data.current_player2_score || 0);
          }
        } else if (!data.is_active && sessionActive) {
          // Session was ended elsewhere
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
    
    // Check immediately
    checkActiveSession();
    
    // Then set up polling every 1 second for better score sync
    const intervalId = setInterval(checkActiveSession, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionActive, scoreUpdatePending]);
  
  // Effect to sync score changes to Supabase
  useEffect(() => {
    // When scores change, update the database
    const syncScores = async () => {
      if (!sessionActive || !scoreUpdatePending) return;
      
      try {
        const { error } = await supabase
          .from('active_session')
          .update({
            current_player1_score: currentPlayer1Score,
            current_player2_score: currentPlayer2Score
          })
          .eq('id', 1);
          
        if (error) {
          console.error('Error syncing scores:', error);
        }
        
        // Reset the pending flag
        setScoreUpdatePending(false);
      } catch (err) {
        console.error('Exception syncing scores:', err);
      }
    };
    
    syncScores();
  }, [currentPlayer1Score, currentPlayer2Score, sessionActive, scoreUpdatePending]);
  
  // Score update functions
  const updatePlayer1Score = (score) => {
    setCurrentPlayer1Score(score);
    setScoreUpdatePending(true);
  };
  
  const updatePlayer2Score = (score) => {
    setCurrentPlayer2Score(score);
    setScoreUpdatePending(true);
  };
  
  // Load players from Supabase on initial load
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*');
        
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
  
  // Load all-time stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('player_stats')
          .select('*');
        
        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }
        
        // Convert array to object with player id as key
        const statsObj = {};
        data?.forEach(stat => {
          statsObj[stat.player_id] = stat;
        });
        
        setAllTimeStats(statsObj);
      } catch (err) {
        console.error('Exception fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  const removePlayer = async (playerId) => {
    if (!playerId) {
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
      
      if (error) {
        console.error('Error removing player:', error);
        return false;
      }
      
      // Remove from local state
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      
      // Also remove from selected players if present
      setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
      
      return true;
    } catch (err) {
      console.error('Exception removing player:', err);
      return false;
    }
  };
  
  // Add a new player with proper UUID
  const addPlayer = async (name) => {
    if (!name || !name.trim()) {
      return null;
    }
    
    try {
      // Generate a proper UUID for the player
      const newPlayerId = uuidv4();
      
      const { data, error } = await supabase
        .from('players')
        .insert({ 
          id: newPlayerId,
          name: name.trim() 
        })
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
  
  // Player selection methods
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
    if (!playerId) {
      return;
    }
    
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };
  
  // Start a new session with selected players
  const startSession = async () => {
    if (selectedPlayers.length < 2) {
      setError('Need at least 2 players to start a session');
      return;
    }
    
    try {
      // Generate a large number of matches to simulate an endless session
      // You can adjust this number based on expected usage
      const generatedMatches = generateRotations(selectedPlayers, 100);
      
      // Initialize session stats
      const stats = {};
      selectedPlayers.forEach(player => {
        if (player && player.id) {
          stats[player.id] = {
            wins: 0,
            losses: 0,
            totalPoints: 0,
            gamesPlayed: 0
          };
        }
      });
      
      // Update global state in Supabase first
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: true,
          matches: generatedMatches,
          current_match_index: 0,
          selected_players: selectedPlayers,
          session_stats: stats,
          current_player1_score: 0,
          current_player2_score: 0
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error starting global session:', error);
        setError('Failed to start global session');
        return;
      }
      
      // Then update local state
      setMatches(generatedMatches);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      setSessionStats(stats);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    }
  };
  
  // End the current session
  const endSession = async () => {
    try {
      // Save session results to Supabase
      for (const playerId in sessionStats) {
        if (!playerId) continue;
        
        const playerStat = sessionStats[playerId];
        
        try {
          // Calculate new stats based on current session
          const wins = (allTimeStats[playerId]?.wins || 0) + playerStat.wins;
          const losses = (allTimeStats[playerId]?.losses || 0) + playerStat.losses;
          const totalPoints = (allTimeStats[playerId]?.total_points || 0) + playerStat.totalPoints;
          const gamesPlayed = (allTimeStats[playerId]?.games_played || 0) + playerStat.gamesPlayed;
          
          // Update all-time stats in Supabase
          const { error } = await supabase
            .from('player_stats')
            .upsert({
              player_id: playerId,
              wins,
              losses,
              total_points: totalPoints,
              games_played: gamesPlayed
            });
          
          if (error) {
            console.error('Error updating player stats:', error);
          }
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
      
      // Reset global session state in Supabase
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: false,
          matches: [],
          current_match_index: 0,
          selected_players: [],
          session_stats: {},
          current_player1_score: 0,
          current_player2_score: 0
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error ending global session:', error);
      }
      
      // Reset local session state
      setSessionActive(false);
      setSelectedPlayers([]);
      setMatches([]);
      setCurrentMatchIndex(0);
      setSessionStats({});
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
    } catch (err) {
      console.error('Exception ending session:', err);
    }
  };
  
  // Record a match result with improved error handling
  const recordMatchResult = async () => {
    if (currentMatchIndex >= matches.length) {
      console.error('Invalid match index:', currentMatchIndex);
      return;
    }
    
    try {
      const currentMatch = matches[currentMatchIndex];
      const player1Id = currentMatch.player1.id;
      const player2Id = currentMatch.player2.id;
      
      // Validate player IDs
      if (!player1Id || !player2Id) {
        console.error('Invalid player IDs:', { player1: currentMatch.player1, player2: currentMatch.player2 });
        return;
      }
      
      // Use the current scores from state
      const player1Score = currentPlayer1Score;
      const player2Score = currentPlayer2Score;
      
      // Update session stats
      const updatedStats = { ...sessionStats };
      
      // Update game stats for both players
      if (updatedStats[player1Id]) {
        updatedStats[player1Id].gamesPlayed += 1;
        updatedStats[player1Id].totalPoints += player1Score;
      }
      
      if (updatedStats[player2Id]) {
        updatedStats[player2Id].gamesPlayed += 1;
        updatedStats[player2Id].totalPoints += player2Score;
      }
      
      // Determine winner and update win/loss
      if (player1Score > player2Score) {
        if (updatedStats[player1Id]) updatedStats[player1Id].wins += 1;
        if (updatedStats[player2Id]) updatedStats[player2Id].losses += 1;
      } else if (player2Score > player1Score) {
        if (updatedStats[player2Id]) updatedStats[player2Id].wins += 1;
        if (updatedStats[player1Id]) updatedStats[player1Id].losses += 1;
      }
      
      // Record match in Supabase with explicit session_date
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: player1Id,
          player2_id: player2Id,
          player1_score: player1Score,
          player2_score: player2Score,
          session_date: new Date().toISOString()
        });
      
      if (matchError) {
        console.error('Error recording match:', matchError);
      }
      
      // Move to next match - In endless mode, we always go to the next match
      const nextMatchIndex = currentMatchIndex + 1;
      
      // Check if we need to generate more matches
      if (nextMatchIndex >= matches.length - 10) {
        // If we're running out of matches, generate more
        const newMatches = [...matches];
        const additionalMatches = generateRotations(selectedPlayers, 20);
        
        // Find a good starting point in additional matches for continuity
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
        
        // Add the additional matches from the best starting point
        for (let i = 0; i < additionalMatches.length; i++) {
          const index = (bestMatchIndex + i) % additionalMatches.length;
          newMatches.push(additionalMatches[index]);
        }
        
        // Update in Supabase
        const { error } = await supabase
          .from('active_session')
          .update({
            matches: newMatches,
            current_match_index: nextMatchIndex,
            session_stats: updatedStats,
            current_player1_score: 0,
            current_player2_score: 0
          })
          .eq('id', 1);
        
        if (error) {
          console.error('Error updating extended matches:', error);
        }
        
        // Update local state
        setMatches(newMatches);
      } else {
        // Just update the match index
        const { error } = await supabase
          .from('active_session')
          .update({
            current_match_index: nextMatchIndex,
            session_stats: updatedStats,
            current_player1_score: 0,
            current_player2_score: 0
          })
          .eq('id', 1);
        
        if (error) {
          console.error('Error updating global session:', error);
        }
      }
      
      // Update local state
      setCurrentMatchIndex(nextMatchIndex);
      setSessionStats(updatedStats);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
    } catch (err) {
      console.error('Exception recording match result:', err);
    }
  };
  
  // Generate a quick match between two players
  const startQuickMatch = async (player1, player2) => {
    if (!player1 || !player2 || player1.id === player2.id) {
      setError('Need two different players for a quick match');
      return;
    }
    
    try {
      const quickMatch = [{ player1, player2 }];
      
      // Initialize session stats for the two players
      const stats = {
        [player1.id]: {
          wins: 0,
          losses: 0,
          totalPoints: 0,
          gamesPlayed: 0
        },
        [player2.id]: {
          wins: 0,
          losses: 0,
          totalPoints: 0,
          gamesPlayed: 0
        }
      };
      
      // Update global state
      const { error } = await supabase
        .from('active_session')
        .update({
          is_active: true,
          matches: quickMatch,
          current_match_index: 0,
          selected_players: [player1, player2],
          session_stats: stats,
          current_player1_score: 0,
          current_player2_score: 0
        })
        .eq('id', 1);
      
      if (error) {
        console.error('Error starting global quick match:', error);
        setError('Failed to start global quick match');
        return;
      }
      
      // Update local state
      setMatches(quickMatch);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      setSessionStats(stats);
      setSelectedPlayers([player1, player2]);
      setCurrentPlayer1Score(0);
      setCurrentPlayer2Score(0);
      setError(null);
    } catch (err) {
      console.error('Error starting quick match:', err);
      setError('Failed to start quick match');
    }
  };
  
  // Pass down all values and functions needed by components
  const value = {
    players,
    selectedPlayers,
    matches,
    currentMatchIndex,
    sessionActive,
    sessionStats,
    allTimeStats,
    isLoading,
    error,
    // Expose score state and functions
    currentPlayer1Score,
    currentPlayer2Score,
    updatePlayer1Score,
    updatePlayer2Score,
    // Other functions
    removePlayer,
    addPlayer,
    selectPlayer,
    unselectPlayer,
    startSession,
    endSession,
    recordMatchResult,
    startQuickMatch
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;