import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addShreeHoleBasaveshwarData = async () => {
  try {
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'Shree HoleBasaveshwar Udagati'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('Shree HoleBasaveshwar Udagati already exists');
      return;
    }

    const teamData = {
      name: 'Shree HoleBasaveshwar Udagati',
      city: 'Bagalkot',
      owner: '',
      captain: 'Mahantesh H',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745949247431_RGsfA9LwusQ6.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      createdAt: new Date(),
      createdBy: 'system'
    };

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);

    const playersData = [
      { name: 'Mahantesh H', profilePhoto: '' },
      { name: 'Anand Meti', profilePhoto: '' },
      { name: 'Appu Naikar', profilePhoto: 'https://media.cricheroes.in/user_profile/1746456683768_wUnP3nMkyi5m.jpg' },
      { name: 'Arun', profilePhoto: '' },
      { name: 'Iranna Kallolli', profilePhoto: '' },
      { name: 'K V Patil', profilePhoto: '' },
      { name: 'Mahesh', profilePhoto: 'https://media.cricheroes.in/user_profile/1745633020543_JXfEJl95GtOj.jpg' },
      { name: 'Manjunath A', profilePhoto: '' },
      { name: 'Nagaraj S Kambar', profilePhoto: '' },
      { name: 'Sangu K', profilePhoto: '' },
      { name: 'Santosh', profilePhoto: '' },
      { name: 'Shker', profilePhoto: '' },
      { name: 'Ssdddddddd', profilePhoto: '' },
      { name: 'T V Kambar', profilePhoto: '' },
      { name: 'Yamanappa', profilePhoto: '' }
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

    console.log('Shree HoleBasaveshwar Udagati and all players added successfully!');

  } catch (error) {
    console.error('Error adding Shree HoleBasaveshwar Udagati data:', error);
  }
};

export default addShreeHoleBasaveshwarData;