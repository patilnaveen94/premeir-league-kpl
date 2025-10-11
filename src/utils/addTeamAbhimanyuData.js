import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addTeamAbhimanyuData = async () => {
  try {
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'Team Abhimanyu'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('Team Abhimanyu already exists');
      return;
    }

    const teamData = {
      name: 'Team Abhimanyu',
      city: 'Bagalkot',
      owner: '',
      captain: 'Hanamant Talawar',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745041528120_MSpgIMMTlmbk.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      createdAt: new Date(),
      createdBy: 'system'
    };

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);

    const playersData = [
      { name: 'Hanamant Talawar', profilePhoto: 'https://media.cricheroes.in/user_profile/1751446155639_5V3W2QUILnlN.jpg' },
      { name: 'Basu Kumatagi', profilePhoto: '' },
      { name: 'Basvraj', profilePhoto: '' },
      { name: 'bhimashi Dodamani', profilePhoto: '' },
      { name: 'Girish Talwar', profilePhoto: '' },
      { name: 'Gopal Haadu', profilePhoto: '' },
      { name: 'hemu Shimagi', profilePhoto: '' },
      { name: 'Pandu Vasanad', profilePhoto: 'https://media.cricheroes.in/user_profile/1696322346022_Yzh2vkQtEYEs.jpg' },
      { name: 'prajwal Madivalar', profilePhoto: '' },
      { name: 'Ramesh Bidari', profilePhoto: '' },
      { name: 'Ramesh S', profilePhoto: 'https://media.cricheroes.in/user_profile/1746688969550_avarBsAuddj3.jpeg' },
      { name: 'ROHIT Kuri', profilePhoto: '' },
      { name: 'Ramesh Sharavi', profilePhoto: '' },
      { name: 'Sachin Kallennavar', profilePhoto: '' },
      { name: 'Shankar Anna', profilePhoto: '' },
      { name: 'Soldier 2', profilePhoto: '' },
      { name: 'Suresh Anna Army', profilePhoto: '' },
      { name: 'vittal S', profilePhoto: '' },
      { name: 'Yogi Raj', profilePhoto: '' }
    ];

    const playerIds = [];
    for (const playerData of playersData) {
      const playerRegistration = {
        fullName: playerData.name,
        'Full Name': playerData.name,
        email: '',
        phone: '',
        dateOfBirth: '',
        position: '',
        preferredHand: '',
        height: '',
        weight: '',
        address: '',
        experience: '',
        previousTeams: '',
        emergencyContact: '',
        emergencyPhone: '',
        photoBase64: playerData.profilePhoto,
        photoURL: playerData.profilePhoto,
        paymentScreenshotBase64: '',
        paymentStatus: 'verified',
        registrationFee: 100,
        approved: true,
        status: 'approved',
        teamId: teamDocRef.id,
        createdAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 'system',
        paymentVerifiedAt: new Date(),
        paymentVerifiedBy: 'system',
        assignedAt: new Date()
      };

      const playerDocRef = await addDoc(collection(db, 'playerRegistrations'), playerRegistration);
      playerIds.push(playerDocRef.id);
    }

    await updateDoc(doc(db, 'teams', teamDocRef.id), {
      players: playerIds,
      updatedAt: new Date()
    });

    console.log('Team Abhimanyu and all players added successfully!');

  } catch (error) {
    console.error('Error adding Team Abhimanyu data:', error);
  }
};

export default addTeamAbhimanyuData;