// Branding Configuration for Khajjidoni Premier League
export const BRANDING = {
  leagueName: 'Khajjidoni Premier League',
  season: 'Season 2',
  year: 2026,
  seasonSponsor: 'John Deere',
  sponsorLogo: '🌾', // Can be replaced with actual logo URL
  tagline: 'The Ultimate Cricket Experience',
  
  // Sponsor colors for consistent branding
  sponsorColors: {
    primary: '#367C2B', // John Deere Green
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

export const getSponsorBranding = () => {
  return `${BRANDING.season} Powered by ${BRANDING.seasonSponsor}`;
};
