/**
 * Generates a fair rotation of matches ensuring table continuity
 * (at least one player remains at the table between matches)
 * 
 * @param {Array} players - Array of player objects
 * @returns {Array} - Array of match objects with player1 and player2 properties
 */
export const generateRotations = (players) => {
    if (players.length < 2) {
      return [];
    }
    
    // For only 2 players, return a single match
    if (players.length === 2) {
      return [{
        player1: players[0],
        player2: players[1]
      }];
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
    
    // For each subsequent match, prioritize table continuity
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
    
    return matches;
  };