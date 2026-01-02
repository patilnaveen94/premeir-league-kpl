import React from 'react';
import { Users, Star } from 'lucide-react';

const TeamDisplay = ({ teamName, teams = [], size = 'md', showDetails = true }) => {
  const team = teams.find(t => t.teamName === teamName || t.name === teamName);
  
  const sizeClasses = {
    sm: { container: 'flex items-center space-x-2', logo: 'w-8 h-8', text: 'text-sm', details: 'text-xs' },
    md: { container: 'flex items-center space-x-3', logo: 'w-10 h-10', text: 'text-base', details: 'text-sm' },
    lg: { container: 'flex items-center space-x-4', logo: 'w-12 h-12', text: 'text-lg', details: 'text-base' }
  };
  
  const classes = sizeClasses[size];
  
  if (!team) {
    return (
      <div className={classes.container}>
        <div className={`${classes.logo} bg-gray-200 rounded-full flex items-center justify-center`}>
          <Users className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <div className={`font-bold text-gray-900 ${classes.text}`}>{teamName}</div>
          {showDetails && <div className={`text-gray-500 ${classes.details}`}>Team</div>}
        </div>
      </div>
    );
  }
  
  return (
    <div className={classes.container}>
      {/* Team Logo */}
      <div className={`${classes.logo} rounded-full p-0.5 shadow-md`} style={{ backgroundColor: team.primaryColor || '#3B82F6' }}>
        {team.logoBase64 ? (
          <img 
            src={team.logoBase64} 
            alt={`${team.teamName} logo`} 
            className="w-full h-full object-cover rounded-full border-2 border-white" 
          />
        ) : (
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
            <span className="font-bold text-gray-700" style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' }}>
              {(team.teamName || teamName).substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Team Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-gray-900 ${classes.text} truncate`}>
          {team.teamName || teamName}
        </div>
        {showDetails && (
          <div className={`flex items-center space-x-2 ${classes.details} text-gray-600`}>
            {team.captain && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="truncate">{team.captain}</span>
              </div>
            )}
            {team.sponsor && (
              <div className="text-gray-500 truncate">
                • {team.sponsor}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Sponsor Logo */}
      {showDetails && team.sponsorLogo && (
        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <img 
            src={team.sponsorLogo} 
            alt={`${team.sponsor} logo`} 
            className="w-full h-full object-contain rounded" 
          />
        </div>
      )}
    </div>
  );
};

export default TeamDisplay;