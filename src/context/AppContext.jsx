import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Add this import for UUID generation
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
  
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStats, setSessionStats] = useState({});
  
  // Player stats
  const [allTimeStats, setAllTimeStats] = useState({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
  const startSession = () => {
    if (selectedPlayers.length < 2) {
      setError('Need at least 2 players to start a session');
      return;
    }
    
    try {
      const generatedMatches = generateRotations(selectedPlayers);
      setMatches(generatedMatches);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      
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
      
      setSessionStats(stats);
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
    } catch (err) {
      console.error('Exception ending session:', err);
    } finally {
      // Reset session state regardless of errors
      setSessionActive(false);
      setSelectedPlayers([]);
      setMatches([]);
      setCurrentMatchIndex(0);
      setSessionStats({});
    }
  };
  
  // Record a match result with improved error handling
  const recordMatchResult = async (player1Score, player2Score) => {
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
      
      // Validate scores
      if (typeof player1Score !== 'number' || typeof player2Score !== 'number') {
        console.error('Invalid scores:', { player1Score, player2Score });
        return;
      }
      
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
      
      setSessionStats(updatedStats);
      
      // Record match in Supabase with explicit session_date
      const { error } = await supabase
        .from('matches')
        .insert({
          player1_id: player1Id,
          player2_id: player2Id,
          player1_score: player1Score,
          player2_score: player2Score,
          session_date: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error recording match:', error);
        // Continue to next match despite error
      }
      
      // Move to next match
      if (currentMatchIndex < matches.length - 1) {
        setCurrentMatchIndex(prev => prev + 1);
      } else {
        // End session if it was the last match
        await endSession();
      }
    } catch (err) {
      console.error('Exception recording match result:', err);
    }
  };
  
  // Generate a quick match between two players
  const startQuickMatch = (player1, player2) => {
    if (!player1 || !player2 || player1.id === player2.id) {
      setError('Need two different players for a quick match');
      return;
    }
    
    try {
      setMatches([{ player1, player2 }]);
      setCurrentMatchIndex(0);
      setSessionActive(true);
      
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
      
      setSessionStats(stats);
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