// Utility functions for player name handling and normalization

/**
 * Normalize player name by removing captain indicators and extra spaces
 * @param {string} name - Player name to normalize
 * @returns {string} - Normalized player name
 */
export const normalizePlayerName = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/\s*\(c\)\s*$/i, '') // Remove (c) at the end (case insensitive)
    .replace(/\s*\(captain\)\s*$/i, '') // Remove (captain) at the end
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Check if two player names match after normalization
 * @param {string} name1 - First player name
 * @param {string} name2 - Second player name
 * @returns {boolean} - True if names match after normalization
 */
export const playerNamesMatch = (name1, name2) => {
  const normalized1 = normalizePlayerName(name1);
  const normalized2 = normalizePlayerName(name2);
  return normalized1.toLowerCase() === normalized2.toLowerCase();
};

/**
 * Find player by name with normalization support
 * @param {Array} players - Array of player objects
 * @param {string} searchName - Name to search for
 * @param {string} nameField - Field name containing the player name (default: 'fullName')
 * @returns {Object|null} - Found player object or null
 */
export const findPlayerByName = (players, searchName, nameField = 'fullName') => {
  if (!players || !searchName) return null;
  
  return players.find(player => 
    playerNamesMatch(player[nameField], searchName)
  ) || null;
};

/**
 * Get all possible name variations for a player
 * @param {string} name - Player name
 * @returns {Array} - Array of possible name variations
 */
export const getPlayerNameVariations = (name) => {
  if (!name) return [];
  
  const normalized = normalizePlayerName(name);
  const variations = [
    name, // Original name
    normalized, // Normalized name
    `${normalized} (c)`, // With captain indicator
    `${normalized} (Captain)` // With full captain title
  ];
  
  return [...new Set(variations)]; // Remove duplicates
};