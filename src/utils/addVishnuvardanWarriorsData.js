import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const addVishnuvardanWarriorsData = async () => {
  try {
    const teamsQuery = query(collection(db, 'teams'), where('name', '==', 'Vishnuvardan Warriors Ankalagi'));
    const existingTeams = await getDocs(teamsQuery);
    
    if (!existingTeams.empty) {
      console.log('Vishnuvardan Warriors Ankalagi already exists');
      return;
    }

    const teamData = {
      name: 'Vishnuvardan Warriors Ankalagi',
      city: 'Bagalkot',
      owner: '',
      captain: 'Laxaman Parchangouder',
      founded: '',
      stadium: '',
      logoURL: 'https://media.cricheroes.in/team_logo/1745041769854_uSD40OdD82Jg.jpg',
      captainPhotoURL: '',
      ownerPhotoURL: '',
      sponsorPhotoURL: '',
      players: [],
      createdAt: new Date(),
      createdBy: 'system'
    };

    const teamDocRef = await addDoc(collection(db, 'teams'), teamData);

    const playersData = [
      { name: 'Laxaman Parchangouder', profilePhoto: 'https://media.cricheroes.in/user_profile/1628666886143_AgTWrDPH0XgE.jpg' },
      { name: 'Girish Bilkeri', profilePhoto: 'https://media.cricheroes.in/user_profile/1627399908871_kuMiNB7nyRMS.jpg' },
      { name: 'Hanamanth M Kurabar', profilePhoto: '' },
      { name: 'LAXMAN BIDARI', profilePhoto: 'https://media.cricheroes.in/user_profile/1746352089871_pgN0sFod6zHb.jpg' },
      { name: 'Laxman G M', profilePhoto: 'https://media.cricheroes.in/user_profile/1746437929525_zyWtjKcRBJwD.jpg' },
      { name: 'Laxman Kichha', profilePhoto: 'https://media.cricheroes.in/user_profile/1746434015917_2OYV4ol7Rn02.jpg' },
      { name: 'LAXMAN MADAR', profilePhoto: 'https://media.cricheroes.in/user_profile/1746768676901_jhF9DupMM2ys.jpg' },
      { name: 'MANJU M18', profilePhoto: 'https://media.cricheroes.in/user_profile/1746263372693_TG1MmT6JxJqh.jpg' },
      { name: 'Nagaraj h', profilePhoto: 'https://media.cricheroes.in/user_profile/1746524220017_SRw8tyTD4Jdp.jpg' },
      { name: 'Pandu Ankalagi', profilePhoto: '' },
      { name: 'Sadashiv Hosur', profilePhoto: 'https://media.cricheroes.in/user_profile/1627399859296_N8Afw05JUdZq.jpg' },
      { name: 'shivu Reddy', profilePhoto: '' },
      { name: 'Shreekant H Madar', profilePhoto: '' },
      { name: 'SUNIL M17', profilePhoto: 'https://media.cricheroes.in/user_profile/1724413307482_CPs8Yne5FhoM.jpg' },
      { name: 'Sunil Madar 07', profilePhoto: 'https://media.cricheroes.in/user_profile/1724249609719_7Qs9zGC2LeSu.jpg' },
      { name: 'TULASAPPA TALAWAR', profilePhoto: '' }
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

    console.log('Vishnuvardan Warriors Ankalagi and all players added successfully!');

  } catch (error) {
    console.error('Error adding Vishnuvardan Warriors Ankalagi data:', error);
  }
};

export default addVishnuvardanWarriorsData;