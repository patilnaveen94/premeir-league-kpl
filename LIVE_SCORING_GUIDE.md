# Live Scoring System - User Guide

## Overview
The live scoring system allows admins to score cricket matches in real-time with instant updates visible to all users.

## How to Use Live Scoring

### 1. Access Live Scoring (Admin Only)
- Login to admin panel at `/admin`
- Navigate to the "Live Scoring" tab
- You'll see two panels: "Score Match" and "Live Matches"

### 2. Start a New Match
1. **Select Teams**: Choose Team 1 and Team 2 from dropdown
2. **Enter Match Title**: Give your match a descriptive name
3. **Click "Start Match"**: This creates a new live match

### 3. Ball-by-Ball Scoring
Once match is started, use the scoring buttons:
- **0, 1, 2, 3, 4, 6**: Runs scored on the ball
- **W (Wicket)**: Record a wicket
- **Wide/No Ball**: Add extras (coming soon)

### 4. Match Controls
- **Current Batsman**: Enter the batsman's name
- **Over Progress**: Automatically tracks balls and overs
- **Innings Switch**: Switch between Team 1 and Team 2 innings
- **End Match**: Complete the match when finished

### 5. Real-time Updates
- Scores update instantly in Firebase
- All connected devices see live updates
- Public scoreboard shows all active matches

## Public Viewing

### Live Scores Page
- Users can visit `/live-scores` to view all live matches
- No login required for viewing
- Real-time score updates
- Shows current batsman, overs, and match status

### Features
- **Live Indicator**: Animated "LIVE" badge for active matches
- **Team Scores**: Current runs, wickets, and overs
- **Match Status**: Shows current batsman and match progress
- **Responsive Design**: Works on all devices

## Database Structure

### Matches Collection (`matches`)
```javascript
{
  id: "match_id",
  title: "Team A vs Team B",
  team1: "Team A",
  team2: "Team B", 
  status: "live", // live, completed, upcoming
  currentOver: 5.2,
  currentBatsman: "Player Name",
  innings: {
    team1: {
      runs: 45,
      wickets: 2,
      overs: 8.4
    },
    team2: {
      runs: 23,
      wickets: 1,
      overs: 5.2
    }
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Technical Implementation

### Components
- **LiveScoring.js**: Admin scoring interface
- **LiveScoreboard.js**: Public live scores display
- **LiveScores.js**: Dedicated live scores page

### Firebase Integration
- Real-time listeners using `onSnapshot`
- Automatic updates across all connected devices
- Efficient data structure for cricket scoring

### Admin Panel Integration
- New "Live Scoring" tab in admin panel
- Side-by-side scoring and viewing interface
- Usage instructions built into the interface

## Tips for Admins

1. **Test Before Live**: Practice with test matches first
2. **Stable Internet**: Ensure good internet connection for real-time updates
3. **Multiple Devices**: Can score from multiple devices simultaneously
4. **Backup Scoring**: Keep manual scorecard as backup
5. **End Matches**: Always end matches when complete to remove from live display

## Troubleshooting

### Common Issues
- **Scores not updating**: Check internet connection
- **Match not appearing**: Ensure status is set to "live"
- **Wrong scores**: Use browser refresh to sync latest data
- **Multiple scorers**: Last update wins, coordinate with other admins

### Support
- Check browser console for error messages
- Ensure Firebase connection is active
- Verify admin permissions are correct

## Future Enhancements
- Ball-by-ball commentary
- Player statistics tracking
- Match highlights and key moments
- Push notifications for boundaries/wickets
- Advanced match analytics