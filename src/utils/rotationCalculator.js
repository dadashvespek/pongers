// src/utils/rotationCalculator.js - modified to support endless matches
export const generateRotations = (players, matchCount = 10) => {
  if (players.length < 2) {
    return [];
  }
  
  // For only 2 players, return a sequence of matches between them
  if (players.length === 2) {
    const matches = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        player1: players[0],
        player2: players[1]
      });
    }
    return matches;
  }
  
  // For 3 or more players, generate rotations with table continuity
  const matches = [];
  const playerCount = players.length;
  
  // Create all possible unique pairs
  const allPairs = [];
  for (let i = 0; i < playerCount; i++) {
    for (let j = i + 1; j < playerCount; j++) {
      allPairs.push({
        player1: players[i],
        player2: players[j]
      });
    }
  }
  
  // Start with first pair
  matches.push(allPairs[0]);
  const usedPairs = new Set([0]);
  
  // Generate initial rotation ensuring table continuity
  while (usedPairs.size < allPairs.length) {
    const lastMatch = matches[matches.length - 1];
    const lastPlayers = [lastMatch.player1.id, lastMatch.player2.id];
    
    // Find the next best pair that maintains table continuity
    let bestPairIndex = -1;
    
    // First priority: Find a pair that has exactly one player from the previous match
    for (let i = 0; i < allPairs.length; i++) {
      if (usedPairs.has(i)) continue;
      
      const pair = allPairs[i];
      const continuityCount = (lastPlayers.includes(pair.player1.id) ? 1 : 0) + 
                             (lastPlayers.includes(pair.player2.id) ? 1 : 0);
      
      if (continuityCount === 1) {
        bestPairIndex = i;
        break;
      }
    }
    
    // If no continuity pair found, just pick the next unused pair
    if (bestPairIndex === -1) {
      for (let i = 0; i < allPairs.length; i++) {
        if (!usedPairs.has(i)) {
          bestPairIndex = i;
          break;
        }
      }
    }
    
    matches.push(allPairs[bestPairIndex]);
    usedPairs.add(bestPairIndex);
  }
  
  // Now extend the matches to reach desired match count by repeating the pattern
  const initialRotation = [...matches];
  while (matches.length < matchCount) {
    // Get the last match so we can maintain continuity when adding the next rotation
    const lastMatch = matches[matches.length - 1];
    const lastPlayers = [lastMatch.player1.id, lastMatch.player2.id];
    
    // Find the best match from initialRotation to start the next cycle with continuity
    let bestMatchIndex = 0;
    let bestContinuityScore = 0;
    
    for (let i = 0; i < initialRotation.length; i++) {
      const match = initialRotation[i];
      const continuityCount = (lastPlayers.includes(match.player1.id) ? 1 : 0) + 
                             (lastPlayers.includes(match.player2.id) ? 1 : 0);
      
      if (continuityCount > bestContinuityScore) {
        bestContinuityScore = continuityCount;
        bestMatchIndex = i;
      }
    }
    
    // Add the best next match and the rest of the rotation
    const rotationLength = initialRotation.length;
    for (let i = 0; i < rotationLength && matches.length < matchCount; i++) {
      const index = (bestMatchIndex + i) % rotationLength;
      matches.push(initialRotation[index]);
    }
  }
  
  return matches;
};