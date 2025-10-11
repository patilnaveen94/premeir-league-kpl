import dataSync from '../services/dataSync';

// Sample teams data - replace with your actual teams
const teams = [
  { name: 'Druva Cricket Club' },
  { name: 'Shree Holebasaveshwar' },
  { name: 'SLV Strikers' },
  { name: 'Swarajya Tiger Boys' },
  { name: 'Team Abhimanyu' },
  { name: 'Vishnuvardhan Warriors' },
  { name: 'Team Alpha' },
  { name: 'Team Beta' }
];

export const initializeAllTeams = async () => {
  try {
    console.log('Initializing teams in points table...');
    const result = await dataSync.initializeTeams(teams);
    
    if (result.success) {
      console.log('All teams initialized successfully');
      return { success: true, message: 'Teams initialized successfully' };
    } else {
      console.error('Failed to initialize teams:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error initializing teams:', error);
    return { success: false, error: error.message };
  }
};

export default { initializeAllTeams, teams };