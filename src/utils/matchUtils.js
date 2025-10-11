export const getMatchWinMessage = (match) => {
  if (!match.team1Score || !match.team2Score || match.status !== 'completed') {
    return null;
  }

  const team1Runs = parseInt(match.team1Score.runs) || 0;
  const team1Wickets = parseInt(match.team1Score.wickets) || 0;
  const team2Runs = parseInt(match.team2Score.runs) || 0;
  const team2Wickets = parseInt(match.team2Score.wickets) || 0;

  let winner, margin, marginType;

  if (team1Runs > team2Runs) {
    winner = match.team1;
    margin = team1Runs - team2Runs;
    marginType = 'runs';
  } else if (team2Runs > team1Runs) {
    winner = match.team2;
    margin = team2Runs - team1Runs;
    marginType = 'runs';
  } else {
    return `${match.team1} vs ${match.team2} - Match Tied`;
  }

  // If winning team has fewer wickets lost, show wickets margin
  if (marginType === 'runs') {
    if (winner === match.team1 && team1Wickets < 10) {
      const wicketsRemaining = 10 - team1Wickets;
      marginType = 'wickets';
      margin = wicketsRemaining;
    } else if (winner === match.team2 && team2Wickets < 10) {
      const wicketsRemaining = 10 - team2Wickets;
      marginType = 'wickets';
      margin = wicketsRemaining;
    }
  }

  return `${winner} won by ${margin} ${marginType}`;
};