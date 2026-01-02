import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

const teams = [
  {
    id: 'team1',
    name: 'Mumbai Warriors',
    logo: '🏏',
    captain: 'Rohit Sharma',
    coach: 'Mahela Jayawardene',
    homeGround: 'Wankhede Stadium',
    founded: 2008,
    colors: ['#004BA0', '#FFD700']
  },
  {
    id: 'team2',
    name: 'Chennai Super Kings',
    logo: '🦁',
    captain: 'MS Dhoni',
    coach: 'Stephen Fleming',
    homeGround: 'M. A. Chidambaram Stadium',
    founded: 2008,
    colors: ['#FFFF00', '#0000FF']
  },
  {
    id: 'team3',
    name: 'Royal Challengers',
    logo: '👑',
    captain: 'Virat Kohli',
    coach: 'Mike Hesson',
    homeGround: 'M. Chinnaswamy Stadium',
    founded: 2008,
    colors: ['#FF0000', '#FFD700']
  },
  {
    id: 'team4',
    name: 'Delhi Capitals',
    logo: '🏛️',
    captain: 'Rishabh Pant',
    coach: 'Ricky Ponting',
    homeGround: 'Arun Jaitley Stadium',
    founded: 2008,
    colors: ['#17479E', '#FF0000']
  }
];

const generatePlayers = () => {
  const currentSeason = new Date().getFullYear().toString();
  const firstNames = ['Rohit', 'Virat', 'MS', 'Rishabh', 'KL', 'Hardik', 'Jasprit', 'Ravindra', 'Shikhar', 'Yuzvendra'];
  const lastNames = ['Sharma', 'Kohli', 'Dhoni', 'Pant', 'Rahul', 'Pandya', 'Bumrah', 'Jadeja', 'Dhawan', 'Chahal'];
  const roles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const battingStyles = ['Right-handed', 'Left-handed'];
  const bowlingStyles = ['Right-arm fast', 'Left-arm fast', 'Right-arm spin', 'Left-arm spin'];

  const players = [];
  
  teams.forEach((team, teamIndex) => {
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      players.push({
        teamId: team.id,
        teamName: team.name,
        fullName: `${firstName} ${lastName} ${teamIndex + 1}${i + 1}`,
        age: Math.floor(Math.random() * 15) + 18,
        position: role,
        battingStyle: battingStyles[Math.floor(Math.random() * battingStyles.length)],
        bowlingStyle: role === 'Batsman' ? 'N/A' : bowlingStyles[Math.floor(Math.random() * bowlingStyles.length)],
        jerseyNumber: i + 1,
        matches: Math.floor(Math.random() * 50),
        runs: Math.floor(Math.random() * 2000),
        wickets: role === 'Batsman' ? 0 : Math.floor(Math.random() * 50),
        average: (Math.random() * 40 + 20).toFixed(2),
        strikeRate: (Math.random() * 50 + 100).toFixed(2),
        status: 'approved',
        season: currentSeason,
        registrationDate: new Date().toISOString(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${teamIndex + 1}${i + 1}@cricket.com`,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        address: `${Math.floor(Math.random() * 999) + 1}, Cricket Street, Mumbai, India`,
        emergencyContact: `${firstName} Parent`,
        emergencyPhone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        registrationFee: 100,
        paymentStatus: 'verified',
        paymentCompleted: true
      });
    }
  });
  
  return players;
};

export const populateTestData = async () => {
  try {
    console.log('Starting to populate test data...');
    
    // Add teams
    console.log('Adding teams...');
    for (const team of teams) {
      await setDoc(doc(db, 'teams', team.id), team);
      console.log(`Added team: ${team.name}`);
    }
    
    // Add players
    console.log('Adding players...');
    const players = generatePlayers();
    
    for (const player of players) {
      await addDoc(collection(db, 'playerRegistrations'), player);
      console.log(`Added player: ${player.fullName} to ${player.teamName}`);
    }
    
    console.log('✅ Test data populated successfully!');
    console.log(`Added ${teams.length} teams and ${players.length} players`);
    
  } catch (error) {
    console.error('Error populating test data:', error);
  }
};