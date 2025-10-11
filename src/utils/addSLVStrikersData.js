import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addSLVStrikersData = async () => {
  try {
    // Check if SLV Strikers team already exists
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'SLV Strikers'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('SLV Strikers team already exists');
      return;
    }

    // Team data
    const teamData = {
      name: 'SLV Strikers',
      city: 'Bagalkot',
      owner: '',
      captain: 'Hanamant Tirakannavar',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745041238128_4veNtw74kWpj.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      season: '1',
      createdAt: new Date(),
      createdBy: 'system'
    };

    // Add team to Firebase
    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);
    console.log('SLV Strikers team added with ID:', teamDocRef.id);

    // Players data from the API response
    const playersData = [
      { name: 'Hanamant Tirakannavar', profilePhoto: 'https://media.cricheroes.in/user_profile/1660296966153_3ClTaCzzYAPL.jpg' },
      { name: 'Hanamant Meti UPSC', profilePhoto: 'https://media.cricheroes.in/user_profile/1745049131344_xvIdhkIulhsg.jpg' },
      { name: 'Hanamant N', profilePhoto: 'https://media.cricheroes.in/user_profile/1655512583332_vAKD8jxQd3ED.jpg' },
      { name: 'Hanmant Hosur', profilePhoto: 'https://media.cricheroes.in/user_profile/1628938136554_ba3ls2TEN4BY.jpg' },
      { name: 'Kiran Guraddi', profilePhoto: 'https://media.cricheroes.in/user_profile/1723639827046_swiD0JXUTAio.jpg' },
      { name: 'Laxman', profilePhoto: 'https://media.cricheroes.in/user_profile/1747046420418_PyUJv2lCca5L.jpg' },
      { name: 'Manju Agasimani', profilePhoto: '' },
      { name: 'Manju Anandi', profilePhoto: '' },
      { name: 'Muttu Muttannavar', profilePhoto: '' },
      { name: 'Pandu Reddy', profilePhoto: 'https://media.cricheroes.in/user_profile/1724316591994_INK6kUFLF7jD.jpg' },
      { name: 'Pradeep Goudar', profilePhoto: '' },
      { name: 'Raju Goudar', profilePhoto: '' },
      { name: 'Ravi M', profilePhoto: 'https://media.cricheroes.in/user_profile/1751445975355_h1sbXFs9Uoar.jpg' },
      { name: 'Sadashiv Muttannavar', profilePhoto: 'https://media.cricheroes.in/user_profile/1746408895837_MpcxIcngz9Ei.jpg' },
      { name: 'Yamanappa', profilePhoto: '' }
    ];

    // Add players to playerRegistrations collection
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
        season: '1',
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
      console.log(`Player ${playerData.name} added with ID:`, playerDocRef.id);
    }

    // Update team with player IDs
    await updateDoc(doc(db, 'teams', teamDocRef.id), {
      players: playerIds,
      updatedAt: new Date()
    });

    console.log('SLV Strikers team and all players added successfully!');
    console.log('Team ID:', teamDocRef.id);
    console.log('Total players added:', playerIds.length);

  } catch (error) {
    console.error('Error adding SLV Strikers data:', error);
  }
};

export default addSLVStrikersData;