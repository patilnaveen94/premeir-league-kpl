import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addSwarajyaTigerBoysData = async () => {
  try {
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'Swarajya Tiger Boys'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('Swarajya Tiger Boys already exists');
      return;
    }

    const teamData = {
      name: 'Swarajya Tiger Boys',
      city: 'Bagalkot',
      owner: '',
      captain: 'Gundu',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745041313109_xRW68FF5aD0a.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      createdAt: new Date(),
      createdBy: 'system'
    };

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);

    const playersData = [
      { name: 'Gundu', profilePhoto: '' },
      { name: 'Adiveppa Madar', profilePhoto: '' },
      { name: 'Amit Mantur', profilePhoto: 'https://media.cricheroes.in/user_profile/1627310297671_kceGafAr6T2Y.jpg' },
      { name: 'Anilkumar', profilePhoto: '' },
      { name: 'Basu Teggi', profilePhoto: '' },
      { name: 'Basu Ukali', profilePhoto: '' },
      { name: 'Dundappa Arakeri', profilePhoto: '' },
      { name: 'Hanamant Sabannavar', profilePhoto: '' },
      { name: 'Hanamant Vasanad', profilePhoto: '' },
      { name: 'Iranna Kulali', profilePhoto: '' },
      { name: 'Laxman', profilePhoto: 'https://media.cricheroes.in/user_profile/1746900690487_lv0avgDe2aYT.jpeg' },
      { name: 'Manju Vasanad', profilePhoto: '' },
      { name: 'Manjunath Hugar', profilePhoto: 'https://media.cricheroes.in/user_profile/1656131918737_BdQ2G1VPnfLz.jpg' },
      { name: 'Mantesh Mantur', profilePhoto: 'https://media.cricheroes.in/user_profile/1646035250425_NlgLOCujKFoc.jpg' },
      { name: 'Pawan Kumar Vasanad', profilePhoto: 'https://media.cricheroes.in/user_profile/1755069599629_wEBUXnuVmUKn.jpg' },
      { name: 'Prasant Hanchinal', profilePhoto: '' },
      { name: 'Revayya Hiremath', profilePhoto: '' },
      { name: 'S R Hunachikatti To', profilePhoto: '' },
      { name: 'Shekhar Walikar', profilePhoto: '' },
      { name: 'Sindhu Mareguddi', profilePhoto: '' },
      { name: 'Varun Shivamogi', profilePhoto: '' }
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

    console.log('Swarajya Tiger Boys and all players added successfully!');

  } catch (error) {
    console.error('Error adding Swarajya Tiger Boys data:', error);
  }
};

export default addSwarajyaTigerBoysData;