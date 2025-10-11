import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addDruvaCricketClubData = async () => {
  try {
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'Druva Cricket Club Sharadal'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('Druva Cricket Club Sharadal already exists');
      return;
    }

    const teamData = {
      name: 'Druva Cricket Club Sharadal',
      city: 'Bagalkot',
      owner: '',
      captain: 'Ramesh Mulimani',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745041923666_KXhgX2xOleVt.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      createdAt: new Date(),
      createdBy: 'system'
    };

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);

    const playersData = [
      { name: 'Ramesh Mulimani', profilePhoto: 'https://media.cricheroes.in/user_profile/1627280955705_kZJYwxMXFrBY.jpg' },
      { name: 'Akash M', profilePhoto: '' },
      { name: 'Anil', profilePhoto: '' },
      { name: 'Basangouda Patil', profilePhoto: '' },
      { name: 'Bhimana Gouda', profilePhoto: '' },
      { name: 'Dashigr', profilePhoto: '' },
      { name: 'Hanamant S', profilePhoto: '' },
      { name: 'Kashinaath', profilePhoto: '' },
      { name: 'Mallapa', profilePhoto: '' },
      { name: 'Manju D', profilePhoto: '' },
      { name: 'Ningangouda Patil', profilePhoto: '' },
      { name: 'Ningappa', profilePhoto: '' },
      { name: 'Rohit Kokkannavar', profilePhoto: 'https://media.cricheroes.in/user_profile/1724573975716_sFTZsQGtfBm0.jpg' },
      { name: 'Sacchu Reddy', profilePhoto: '' },
      { name: 'Sandeep', profilePhoto: '' },
      { name: 'Sanju Hugar', profilePhoto: '' }
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

    console.log('Druva Cricket Club Sharadal and all players added successfully!');

  } catch (error) {
    console.error('Error adding Druva Cricket Club Sharadal data:', error);
  }
};

export default addDruvaCricketClubData;