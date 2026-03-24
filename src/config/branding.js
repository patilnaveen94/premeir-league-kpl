// Branding Configuration for Khajjidoni Premier League
export const BRANDING = {
  leagueName: 'Khajjidoni Premier League',
  season: 'Season 2',
  year: 2026,
  tagline: 'The Ultimate Cricket Experience',
  
  // League colors
  colors: {
    primary: '#FF6B35', // Orange
    secondary: '#FFD700', // Gold accent
  },
  
  // Social media and contact
  contact: {
    email: 'info@khajjidoni.com',
    phone: '+91-XXXXXXXXXX',
  }
};

export const getSeasonTitle = () => {
  return `${BRANDING.leagueName} - ${BRANDING.season} ${BRANDING.year}`;
};
