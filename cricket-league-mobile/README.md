# Cricket League Mobile App

A React Native mobile application for the Khajjidoni Premier League, built with Expo and Firebase.

## Features

### Authentication
- Email/password login and registration
- Firebase Authentication integration
- User role management

### Core Features
- **Home**: Latest news, upcoming matches, and league highlights
- **Teams**: Browse all cricket league teams with detailed information
- **Schedule**: View upcoming fixtures and completed match results
- **Points Table**: Current league standings with comprehensive statistics
- **News**: Latest cricket league news and updates
- **Player Registration**: Complete registration form for new players

### Mobile-Optimized
- Responsive design for all screen sizes
- Touch-friendly interface
- Pull-to-refresh functionality
- Smooth navigation with bottom tabs

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Icons**: Expo Vector Icons
- **State Management**: React Context API

## Setup Instructions

### 1. Install Dependencies
```bash
cd cricket-league-mobile
npm install
```

### 2. Install Expo CLI (if not already installed)
```bash
npm install -g @expo/cli
```

### 3. Firebase Configuration
The app uses the same Firebase configuration as the web version. The config is already set up in `firebase/firebase.js`.

### 4. Run the App

#### Development Server
```bash
npm start
# or
expo start
```

#### Run on Android
```bash
npm run android
# or
expo start --android
```

#### Run on iOS
```bash
npm run ios
# or
expo start --ios
```

#### Run on Web
```bash
npm run web
# or
expo start --web
```

## Project Structure

```
cricket-league-mobile/
├── assets/                 # App icons and splash screens
├── components/            # Reusable components (future)
├── context/
│   └── AuthContext.js     # Authentication context
├── firebase/
│   └── firebase.js        # Firebase configuration
├── navigation/
│   └── AppNavigator.js    # Navigation setup
├── screens/
│   ├── HomeScreen.js      # Home screen
│   ├── LoginScreen.js     # Login screen
│   ├── RegisterScreen.js  # Registration screen
│   ├── TeamsScreen.js     # Teams listing
│   ├── ScheduleScreen.js  # Match schedule
│   ├── PointsTableScreen.js # League table
│   ├── NewsScreen.js      # News articles
│   └── PlayerRegistrationScreen.js # Player registration
├── utils/                 # Utility functions (future)
├── App.js                 # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Features

### Authentication Flow
- Users must log in to access the app
- New users can register with email/password
- Firebase handles authentication state

### Navigation Structure
- Bottom tab navigation for main screens
- Stack navigation for authentication flow
- Protected routes for authenticated users

### Data Integration
- Real-time data from Firebase Firestore
- Shared database with web application
- Offline-friendly with Firebase caching

### Mobile UX
- Pull-to-refresh on all data screens
- Loading states and error handling
- Responsive design for different screen sizes
- Touch-optimized interface elements

## Customization

### Colors
The app uses the same color scheme as the web version:
- Primary: `#37003c` (Premier League Purple)
- Secondary: `#e90052` (Premier League Pink)
- Accent: `#00ff85` (Premier League Green)

### Adding New Screens
1. Create new screen component in `screens/` folder
2. Add to navigation in `AppNavigator.js`
3. Update tab bar icons if needed

### Firebase Collections
The app reads from the same Firestore collections as the web app:
- `users` - User profiles and roles
- `teams` - Team information
- `matches` - Match fixtures and results
- `standings` - Points table data
- `news` - News articles
- `playerRegistrations` - Player registration submissions

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### App Store Deployment
```bash
expo submit:android
expo submit:ios
```

## Future Enhancements

- Push notifications for match updates
- Live score updates
- Player statistics and profiles
- Photo uploads for player registration
- Offline mode improvements
- Social features (comments, likes)
- Fantasy league integration

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Firebase connection**: Check network connectivity and Firebase config
3. **Navigation errors**: Ensure all screen components are properly imported
4. **Build errors**: Check Expo CLI version and dependencies

### Development Tips

- Use Expo Go app for quick testing on physical devices
- Enable remote debugging for better error tracking
- Test on both iOS and Android simulators
- Use React Native Debugger for advanced debugging

## License

This project is for educational purposes. Premier League is a trademark of The Football Association Premier League Limited.