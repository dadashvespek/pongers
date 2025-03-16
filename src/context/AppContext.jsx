import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateRotations } from '../utils/rotationCalculator';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Players
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  
  // Matches
  const [matchRotation, setMatchRotation] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [sessionMatches, setSessionMatches] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  
  // Stats
  const [playerStats, setPlayerStats] = useState({});
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'allTime'

  // Fetch all players on initial load
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*');
      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setAllPlayers(data || []);
      }
    };

    const fetchActiveSession = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching active session:', error);
      } else if (data && data.length > 0) {
        setActiveSession(data[0]);
        fetchSessionData(data[0].id);
      }
    };

    fetchPlayers();
    fetchActiveSession();
  }, []);

  const fetchSessionData = async (sessionId) => {
    // Fetch players for this session
    const { data: sessionPlayers, error: playersError } = await supabase
      .from('session_players')
      .select('player_id, players(*)')
      .eq('session_id', sessionId);
    
    if (!playersError && sessionPlayers) {
      const selected = sessionPlayers.map(sp => sp.players);
      setSelectedPlayers(selected);
    }
    
    // Fetch matches for this session
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('session_id', sessionId)
      .order('match_order', { ascending: true });
    
    if (!matchesError && matches) {
      setSessionMatches(matches);
      
      // Find the current match (first unfinished match)
      const currentMatch = matches.findIndex(match => match.is_completed === false);
      if (currentMatch !== -1) {
        setCurrentMatchIndex(currentMatch);
      }
    }
  };

  // Add a new player
  const addPlayer = async (name) => {
    if (!name.trim()) return null;
    
    const { data, error } = await supabase
      .from('players')
      .insert([{ name }])
      .select();
    
    if (error) {
      console.error('Error adding player:', error);
      return null;
    }
    
    setAllPlayers([...allPlayers, data[0]]);
    return data[0];
  };

  // Toggle player selection for current session
  const togglePlayerSelection = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Generate match rotation
  const generateMatchSchedule = async () => {
    if (selectedPlayers.length < 2) {
      alert('You need at least 2 players to generate matches');
      return;
    }
    
    // Create a new session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{ is_active: true }])
      .select();
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return;
    }
    
    setActiveSession(session[0]);
    
    // Add players to this session
    const sessionPlayers = selectedPlayers.map(player => ({
      session_id: session[0].id,
      player_id: player.id
    }));
    
    await supabase.from('session_players').insert(sessionPlayers);
    
    // Generate fair rotations
    const rotations = generateRotations(selectedPlayers);
    setMatchRotation(rotations);
    
    // Create matches in the database
    const matches = rotations.map((match, index) => ({
      session_id: session[0].id,
      player1_id: match.player1.id,
      player2_id: match.player2.id,
      match_order: index,
      is_completed: false,
      player1_score: 0,
      player2_score: 0,
    }));
    
    const { data: matchesData } = await supabase
      .from('matches')
      .insert(matches)
      .select();
    
    setSessionMatches(matchesData || []);
    setCurrentMatchIndex(0);
  };

  // Update match score
  const updateScore = async (player, increment = true) => {
    if (!sessionMatches[currentMatchIndex]) return;
    
    const currentMatch = sessionMatches[currentMatchIndex];
    const isPlayer1 = player.id === currentMatch.player1_id;
    const scoreField = isPlayer1 ? 'player1_score' : 'player2_score';
    
    const newScore = increment 
      ? (isPlayer1 ? currentMatch.player1_score + 1 : currentMatch.player2_score + 1)
      : (isPlayer1 ? Math.max(0, currentMatch.player1_score - 1) : Math.max(0, currentMatch.player2_score - 1));
    
    const { data } = await supabase
      .from('matches')
      .update({ [scoreField]: newScore })
      .eq('id', currentMatch.id)
      .select();
    
    if (data) {
      const updatedMatches = [...sessionMatches];
      updatedMatches[currentMatchIndex] = data[0];
      setSessionMatches(updatedMatches);
    }
  };

  // Complete current match and move to the next
  const completeMatch = async () => {
    if (!sessionMatches[currentMatchIndex]) return;
    
    const currentMatch = sessionMatches[currentMatchIndex];
    const player1Score = currentMatch.player1_score;
    const player2Score = currentMatch.player2_score;
    
    // Determine winner
    const winner_id = player1Score > player2Score 
      ? currentMatch.player1_id 
      : player2Score > player1Score 
        ? currentMatch.player2_id 
        : null;
    
    // Update match as completed
    const { data } = await supabase
      .from('matches')
      .update({ 
        is_completed: true,
        winner_id 
      })
      .eq('id', currentMatch.id)
      .select();
    
    // Update player stats
    if (winner_id) {
      // Update win/loss records
      await supabase.rpc('increment_player_stats', { 
        player_id: winner_id,
        won: true 
      });
      
      const loserId = winner_id === currentMatch.player1_id 
        ? currentMatch.player2_id 
        : currentMatch.player1_id;
      
      await supabase.rpc('increment_player_stats', { 
        player_id: loserId,
        won: false 
      });
    }
    
    // Update session matches
    const updatedMatches = [...sessionMatches];
    updatedMatches[currentMatchIndex] = data[0];
    setSessionMatches(updatedMatches);
    
    // Move to next match if available
    if (currentMatchIndex < sessionMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else {
      // End session if this was the last match
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', activeSession.id);
      
      setActiveSession(null);
    }
  };

  // End current session early
  const endSession = async () => {
    if (!activeSession) return;
    
    await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', activeSession.id);
    
    setActiveSession(null);
    setSelectedPlayers([]);
    setSessionMatches([]);
  };

  const value = {
    allPlayers,
    selectedPlayers,
    togglePlayerSelection,
    addPlayer,
    generateMatchSchedule,
    matchRotation,
    currentMatchIndex,
    sessionMatches,
    activeSession,
    updateScore,
    completeMatch,
    playerStats,
    viewMode,
    setViewMode,
    endSession
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;