# Cricket League Website

A modern, responsive Cricket League website built with React.js, Tailwind CSS, and Firebase.

## Features

### Public Pages
- **Home**: Hero section with latest news and features
- **Teams**: Display all Cricket League teams with details
- **Schedule**: Upcoming fixtures and match schedules
- **Results**: Latest match results and scores
- **Points Table**: Current league standings with season selection
- **News**: Latest Cricket League news and updates
- **Contact**: Contact form and information

### Authentication
- **Login/Register**: Email/password and Google Sign-In
- **Protected Routes**: Player registration requires authentication
- **Role-based Access**: Admin panel for authorized users

### Player Registration
- Comprehensive registration form for players
- Photo upload functionality
- Emergency contact information
- Admin approval system

### Admin Panel
- Player registration management
- Approve/reject player applications
- Content management (expandable)

## Tech Stack

- **Frontend**: React.js 18 + Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting (ready)
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password and Google)
3. Create Firestore database
4. Enable Storage
5. Update `firebase/firebase.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Firestore Collections
Create these collections in Firestore:
- `users` - User profiles and roles
- `teams` - Team information
- `standings` - Points table data
- `playerRegistrations` - Player registration submissions

### 4. Admin User Setup
To create an admin user:
1. Register normally through the website
2. In Firestore, find your user document in the `users` collection
3. Change the `role` field from `user` to `admin`

### 5. Run Development Server
```bash
npm start
```

### 6. Build for Production
```bash
npm run build
```

### 7. Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation component
│   └── Footer.js          # Footer component
├── pages/
│   ├── Home.js            # Home page
│   ├── Login.js           # Login page
│   ├── Register.js        # Registration page
│   ├── Teams.js           # Teams listing
│   ├── Schedule.js        # Fixtures
│   ├── Results.js         # Match results
│   ├── PointsTable.js     # League table
│   ├── News.js            # News articles
│   ├── Contact.js         # Contact form
│   ├── PlayerRegistration.js  # Player registration
│   └── AdminPanel.js      # Admin dashboard
├── context/
│   └── AuthContext.js     # Authentication context
├── firebase/
│   └── firebase.js        # Firebase configuration
├── App.js                 # Main app component
├── index.js              # App entry point
└── index.css             # Global styles
```

## Key Features

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Responsive navigation with mobile menu
- Optimized for all screen sizes

### Authentication System
- Firebase Authentication integration
- Google Sign-In support
- Protected routes and role-based access

### Modern UI/UX
- Premier League color scheme
- Smooth animations and transitions
- Clean, professional design
- Accessible components

### Firebase Integration
- Real-time data with Firestore
- File uploads with Storage
- User management and roles
- Scalable architecture

## Customization

### Colors
Update the color scheme in `tailwind.config.js`:
```javascript
colors: {
  premier: {
    purple: '#37003c',  // Primary brand color
    pink: '#e90052',    // Secondary brand color
    blue: '#00ff85',    // Accent color
  }
}
```

### Content
- Update team data in `Teams.js`
- Modify fixtures in `Schedule.js`
- Add real news content in `News.js`
- Update contact information in `Contact.js`

## Future Enhancements

- Live match updates
- Player statistics
- Fantasy league integration
- Push notifications
- Advanced admin features
- Multi-language support

## License

This project is for educational purposes. Premier League is a trademark of The Football Association Premier League Limited.