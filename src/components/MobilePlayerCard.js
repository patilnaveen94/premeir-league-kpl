import React from 'react';
import { User, Trophy, Target, TrendingUp } from 'lucide-react';

const MobilePlayerCard = ({ 
  player, 
  onClick, 
  showStats = true, 
  showTeam = true,
  className = ""
}) => {
  const getPlayerInitials = (name) => {
    if (!name) return '??';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div 
      className={`mobile-player-card mobile-hover cursor-pointer ${className}`}
      onClick={() => onClick && onClick(player)}
    >
      <div className="responsive-flex">
        {/* Player Avatar */}
        <div className="flex-shrink-0">
          {player.photoBase64 || player.photoURL ? (
            <img 
              src={player.photoBase64 || player.photoURL} 
              alt={player.name || player.fullName} 
              className="mobile-player-avatar" 
            />
          ) : (
            <div className="mobile-player-avatar bg-gradient-to-br from-cricket-navy to-cricket-blue flex items-center justify-center text-white font-bold">
              {getPlayerInitials(player.name || player.fullName)}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h3 className="mobile-player-name">
            {player.name || player.fullName}
          </h3>
          
          {showTeam && player.team && (
            <p className="mobile-player-info text-cricket-blue">
              {player.team}
            </p>
          )}
          
          {player.position && (
            <p className="mobile-player-info">
              {player.position}
            </p>
          )}

          {showStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 sm:mt-3">
              {player.runs !== undefined && (
                <div className="text-center">
                  <div className="responsive-small font-bold text-green-600">
                    {player.runs}
                  </div>
                  <div className="text-xs text-gray-500">Runs</div>
                </div>
              )}
              
              {player.wickets !== undefined && (
                <div className="text-center">
                  <div className="responsive-small font-bold text-red-600">
                    {player.wickets}
                  </div>
                  <div className="text-xs text-gray-500">Wickets</div>
                </div>
              )}
              
              {player.average !== undefined && (
                <div className="text-center">
                  <div className="responsive-small font-bold text-blue-600">
                    {parseFloat(player.average).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Avg</div>
                </div>
              )}
              
              {player.strikeRate !== undefined && (
                <div className="text-center">
                  <div className="responsive-small font-bold text-purple-600">
                    {parseFloat(player.strikeRate).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">S/R</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Indicator */}
        {onClick && (
          <div className="flex-shrink-0 ml-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-xs">→</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePlayerCard;