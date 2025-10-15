import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { Users, Calendar, Trophy, FileText, CheckCircle, XCircle, Plus, Upload, Image, Edit, Trash2, UserPlus, CreditCard, User, Lock, GripVertical, ArrowUp, ArrowDown, Activity, Target } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { db } from '../firebase/firebase';
import AdminLogin from '../components/AdminLogin';
import dataSync from '../services/dataSync';
import EnhancedLiveScoring from '../components/EnhancedLiveScoring';
import LiveScoreboard from '../components/LiveScoreboard';
import ComprehensiveScoring from '../components/ComprehensiveScoring';
import addSLVStrikersData from '../utils/addSLVStrikersData';
import { formatMatchDate } from '../utils/dateUtils';
import dataRefreshManager from '../utils/dataRefresh';
import DataConsistencyChecker from '../components/DataConsistencyChecker';


// Helper function to generate initials from full name
const getPlayerInitials = (fullName) => {
  if (!fullName) return '??';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('players');
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerStatusFilter, setPlayerStatusFilter] = useState('pending');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddPlayers, setShowAddPlayers] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editPlayerData, setEditPlayerData] = useState({});
  const [newTeam, setNewTeam] = useState({ name: '', city: '', owner: '', captain: '', founded: '', stadium: '' });
  const [newMatch, setNewMatch] = useState({ team1: '', team2: '', date: '', venue: 'Nutan Vidyalaya Khajjidoni', overs: '8', time: '', matchType: 'knockout', team1Score: '', team2Score: '', status: 'upcoming' });
  const [teamLogo, setTeamLogo] = useState(null);
  const [captainPhoto, setCaptainPhoto] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [sponsorPhoto, setSponsorPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const { isAdminLoggedIn, currentAdmin } = useAdmin();
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ userid: '', password: '' });
  const [editAdmin, setEditAdmin] = useState({ userid: '', password: '' });
  const [sponsors, setSponsors] = useState([]);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [newSponsor, setNewSponsor] = useState({ name: '', type: 'title', season: '', contribution: '', description: '', prizePosition: '' });
  const [eventSponsorPhoto, setEventSponsorPhoto] = useState(null);
  const [showEditSponsor, setShowEditSponsor] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [editSponsor, setEditSponsor] = useState({ name: '', type: 'title', season: '', contribution: '', description: '', prizePosition: '' });
  const [formFields, setFormFields] = useState([]);
  const [showAddField, setShowAddField] = useState(false);
  const [showEditField, setShowEditField] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text', required: false, validation: '' });
  const [editField, setEditField] = useState({ name: '', label: '', type: 'text', required: false, validation: '' });
  const [paymentConfig, setPaymentConfig] = useState({
    fee: 100,
    instructions: '1. Pay ₹100 registration fee via UPI/Bank Transfer\n2. Take a screenshot of the payment confirmation\n3. Upload the screenshot below',
    qrCodeBase64: '',
    showQrCode: false
  });
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [draggedField, setDraggedField] = useState(null);
  const [carouselImages, setCarouselImages] = useState([]);
  const [showAddCarouselImage, setShowAddCarouselImage] = useState(false);
  const [newCarouselImage, setNewCarouselImage] = useState({ title: '', order: 0 });
  const [carouselImageFile, setCarouselImageFile] = useState(null);
  const [registrationSectionVisible, setRegistrationSectionVisible] = useState(true);
  const [showDetailedScoring, setShowDetailedScoring] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [scoreEntryMatch, setScoreEntryMatch] = useState(null);
  const [scorecardData, setScorecardData] = useState({});
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  const isSuperUser = currentAdmin?.role === 'superuser';

  const initializeScorecardData = (match) => {
    const data = {
      team1: {
        totalRuns: match.team1Score?.runs || 0,
        wickets: match.team1Score?.wickets || 0,
        overs: match.team1Score?.oversDisplay || '0.0',
        extras: match.team1Extras || 0,
        batting: {},
        bowling: {}
      },
      team2: {
        totalRuns: match.team2Score?.runs || 0,
        wickets: match.team2Score?.wickets || 0,
        overs: match.team2Score?.oversDisplay || '0.0',
        extras: match.team2Extras || 0,
        batting: {},
        bowling: {}
      }
    };

    // Initialize batting stats
    match.team1Players?.forEach(player => {
      const battingStats = match.battingStats?.[match.team1]?.find(p => p.playerId === player.id);
      data.team1.batting[player.id] = {
        runs: battingStats?.runs ?? 0,
        balls: battingStats?.balls ?? 0,
        fours: battingStats?.fours ?? 0,
        sixes: battingStats?.sixes ?? 0,
        dismissalType: battingStats?.dismissalType || '',
        bowlerName: battingStats?.bowlerName || '',
        fielderName: battingStats?.fielderName || '',
        fielder2Name: battingStats?.fielder2Name || ''
      };
    });

    match.team2Players?.forEach(player => {
      const battingStats = match.battingStats?.[match.team2]?.find(p => p.playerId === player.id);
      data.team2.batting[player.id] = {
        runs: battingStats?.runs ?? 0,
        balls: battingStats?.balls ?? 0,
        fours: battingStats?.fours ?? 0,
        sixes: battingStats?.sixes ?? 0,
        dismissalType: battingStats?.dismissalType || '',
        bowlerName: battingStats?.bowlerName || '',
        fielderName: battingStats?.fielderName || '',
        fielder2Name: battingStats?.fielder2Name || ''
      };
    });

    // Initialize bowling stats
    match.team1Players?.forEach(player => {
      const bowlingStats = match.bowlingStats?.[match.team1]?.find(p => p.playerId === player.id);
      data.team1.bowling[player.id] = {
        overs: bowlingStats?.overs ?? 0,
        maidens: bowlingStats?.maidens ?? 0,
        runs: bowlingStats?.runs ?? 0,
        wickets: bowlingStats?.wickets ?? 0,
        economy: bowlingStats?.economy ?? 0
      };
    });

    match.team2Players?.forEach(player => {
      const bowlingStats = match.bowlingStats?.[match.team2]?.find(p => p.playerId === player.id);
      data.team2.bowling[player.id] = {
        overs: bowlingStats?.overs ?? 0,
        maidens: bowlingStats?.maidens ?? 0,
        runs: bowlingStats?.runs ?? 0,
        wickets: bowlingStats?.wickets ?? 0,
        economy: bowlingStats?.economy ?? 0
      };
    });

    setScorecardData(data);
  };

  const updateScorecardData = (team, section, playerId, field, value) => {
    setScorecardData(prev => {
      const newData = {
        ...prev,
        [team]: {
          ...prev[team],
          [section]: {
            ...prev[team][section],
            [playerId]: {
              ...prev[team][section][playerId],
              [field]: value
            }
          }
        }
      };
      
      // Auto-calculate strike rate for batting
      if (section === 'batting' && (field === 'runs' || field === 'balls')) {
        const playerData = newData[team][section][playerId];
        const runs = parseInt(playerData.runs) || 0;
        const balls = parseInt(playerData.balls) || 0;
        if (balls > 0) {
          newData[team][section][playerId].strikeRate = ((runs / balls) * 100).toFixed(2);
        } else {
          newData[team][section][playerId].strikeRate = 0;
        }
      }
      
      // Auto-calculate economy rate for bowling
      if (section === 'bowling' && (field === 'runs' || field === 'overs')) {
        const playerData = newData[team][section][playerId];
        const runs = parseInt(playerData.runs) || 0;
        const overs = parseFloat(playerData.overs) || 0;
        if (overs > 0) {
          newData[team][section][playerId].economy = (runs / overs).toFixed(2);
        } else {
          newData[team][section][playerId].economy = 0;
        }
      }
      
      return newData;
    });
  };

  const updateTeamTotal = (team, field, value) => {
    setScorecardData(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: value
      }
    }));
  };

  const convertCricHeroesJsonToFirebase = (cricHeroesJson) => {
    try {
      const data = JSON.parse(cricHeroesJson);
      console.log('🔍 Parsed JSON structure:', {
        hasPageProps: !!data.pageProps,
        hasScorecard: !!data.pageProps?.scorecard,
        scorecardLength: data.pageProps?.scorecard?.length
      });
      
      const scorecard = data.pageProps?.scorecard;
      
      if (!scorecard || scorecard.length < 2) {
        throw new Error('Invalid scorecard data - missing or incomplete scorecard array');
      }

      const team1Data = scorecard[0];
      const team2Data = scorecard[1];
      
      console.log('🏏 Team data structure:', {
        team1: {
          name: team1Data.teamName,
          hasBatting: !!team1Data.batting,
          battingCount: team1Data.batting?.length,
          hasBowling: !!team1Data.bowling,
          bowlingCount: team1Data.bowling?.length
        },
        team2: {
          name: team2Data.teamName,
          hasBatting: !!team2Data.batting,
          battingCount: team2Data.batting?.length,
          hasBowling: !!team2Data.bowling,
          bowlingCount: team2Data.bowling?.length
        }
      });
      
      // Convert batting stats with detailed dismissal info
      const convertBattingStats = (batting, teamName) => {
        console.log(`🏏 Converting batting for ${teamName}:`, {
          playerCount: batting.length,
          firstPlayer: batting[0]
        });
        
        return batting.map(player => {
          const isOut = player.how_to_out !== 'not out';
          let dismissalType = '';
          let bowlerName = '';
          let fielderName = '';
          
          if (isOut) {
            const dismissal = player.how_to_out.toLowerCase();
            if (dismissal.includes('b ')) {
              dismissalType = 'bowled';
              bowlerName = player.how_to_out.split('b ')[1]?.split(' ')[0] || '';
            } else if (dismissal.includes('c ')) {
              dismissalType = 'caught';
              const parts = player.how_to_out.split('c ')[1];
              if (parts?.includes(' b ')) {
                fielderName = parts.split(' b ')[0] || '';
                bowlerName = parts.split(' b ')[1] || '';
              } else {
                fielderName = parts || '';
              }
            } else if (dismissal.includes('lbw')) {
              dismissalType = 'lbw';
              bowlerName = player.how_to_out.split('lbw ')[1] || '';
            } else if (dismissal.includes('run out')) {
              dismissalType = 'run out';
              fielderName = player.how_to_out.split('run out ')[1] || '';
            } else if (dismissal.includes('stumped')) {
              dismissalType = 'stumped';
              const parts = player.how_to_out.split('stumped ')[1];
              if (parts?.includes(' b ')) {
                fielderName = parts.split(' b ')[0] || '';
                bowlerName = parts.split(' b ')[1] || '';
              }
            } else {
              dismissalType = 'other';
            }
          }
          
          return {
            playerId: player.player_id?.toString() || player.name.replace(/\s+/g, '_').toLowerCase(),
            name: player.name,
            runs: parseInt(player.runs) || 0,
            balls: parseInt(player.balls) || 0,
            fours: parseInt(player['4s']) || 0,
            sixes: parseInt(player['6s']) || 0,
            isOut,
            dismissalType,
            bowlerName,
            fielderName,
            strikeRate: parseFloat(player.SR) || 0
          };
        });
      };

      // Convert bowling stats with detailed figures
      const convertBowlingStats = (bowling, teamName) => {
        console.log(`🎳 Converting bowling for ${teamName}:`, {
          playerCount: bowling.length,
          firstPlayer: bowling[0]
        });
        
        return bowling.map(player => {
          const overs = parseFloat(player.overs) || 0;
          const runs = parseInt(player.runs) || 0;
          const wickets = parseInt(player.wickets) || 0;
          const economy = parseFloat(player.economy_rate) || (overs > 0 ? (runs / overs).toFixed(2) : 0);
          
          return {
            playerId: player.player_id?.toString() || player.name.replace(/\s+/g, '_').toLowerCase(),
            name: player.name,
            overs,
            maidens: parseInt(player.maidens) || 0,
            runs,
            wickets,
            economy: parseFloat(economy),
            dots: parseInt(player['0s']) || 0,
            wides: parseInt(player.wide) || 0,
            noBalls: parseInt(player.noball) || 0,
            bestFigures: wickets > 0 ? `${wickets}/${runs}` : '0/0'
          };
        });
      };

      const firebaseData = {
        // Toss information
        tossWinner: data.pageProps?.summaryData?.data?.toss_details?.includes(team1Data.teamName) ? 
                   team1Data.teamName : team2Data.teamName,
        tossChoice: data.pageProps?.summaryData?.data?.toss_details?.includes('field') ? 'bowl' : 'bat',
        
        // Team 1 data
        team1: {
          totalRuns: team1Data.inning?.total_run || 0,
          wickets: team1Data.inning?.total_wicket || 0,
          overs: team1Data.inning?.overs_played || '0.0',
          extras: team1Data.inning?.total_extra || 0,
          batting: {},
          bowling: {}
        },
        
        // Team 2 data
        team2: {
          totalRuns: team2Data.inning?.total_run || 0,
          wickets: team2Data.inning?.total_wicket || 0,
          overs: team2Data.inning?.overs_played || '0.0',
          extras: team2Data.inning?.total_extra || 0,
          batting: {},
          bowling: {}
        },
        
        // Match result with proper formatting
        result: data.pageProps?.summaryData?.data?.match_summary?.summary || null,
        winningTeam: data.pageProps?.summaryData?.data?.winning_team || null,
        matchSummary: data.pageProps?.summaryData?.data?.match_summary?.summary || null
      };

      // Convert batting stats for both teams
      console.log('🏃 Converting batting stats...');
      const team1Batting = convertBattingStats(team1Data.batting || [], team1Data.teamName);
      const team2Batting = convertBattingStats(team2Data.batting || [], team2Data.teamName);
      console.log('✅ Batting conversion complete:', {
        team1Count: team1Batting.length,
        team2Count: team2Batting.length,
        team1Sample: team1Batting[0],
        team2Sample: team2Batting[0]
      });
      
      // Convert bowling stats for both teams (note: team1 bowlers are from team2 data)
      console.log('🎳 Converting bowling stats...');
      const team1Bowling = convertBowlingStats(team2Data.bowling || [], team2Data.teamName);
      const team2Bowling = convertBowlingStats(team1Data.bowling || [], team1Data.teamName);
      console.log('✅ Bowling conversion complete:', {
        team1Count: team1Bowling.length,
        team2Count: team2Bowling.length,
        team1Sample: team1Bowling[0],
        team2Sample: team2Bowling[0]
      });

      // Populate batting data with proper structure
      console.log('📊 Populating Firebase data structure...');
      team1Batting.forEach(player => {
        firebaseData.team1.batting[player.playerId] = {
          ...player,
          status: player.isOut ? 'out' : 'not out'
        };
      });
      
      team2Batting.forEach(player => {
        firebaseData.team2.batting[player.playerId] = {
          ...player,
          status: player.isOut ? 'out' : 'not out'
        };
      });

      // Populate bowling data with proper structure
      team1Bowling.forEach(player => {
        firebaseData.team1.bowling[player.playerId] = {
          ...player,
          oversDisplay: player.overs.toString()
        };
      });
      
      team2Bowling.forEach(player => {
        firebaseData.team2.bowling[player.playerId] = {
          ...player,
          oversDisplay: player.overs.toString()
        };
      });
      
      console.log('🎯 Final Firebase data structure:', {
        team1BattingKeys: Object.keys(firebaseData.team1.batting),
        team2BattingKeys: Object.keys(firebaseData.team2.batting),
        team1BowlingKeys: Object.keys(firebaseData.team1.bowling),
        team2BowlingKeys: Object.keys(firebaseData.team2.bowling),
        sampleBatting: firebaseData.team1.batting[Object.keys(firebaseData.team1.batting)[0]],
        sampleBowling: firebaseData.team1.bowling[Object.keys(firebaseData.team1.bowling)[0]]
      });

      return firebaseData;
    } catch (error) {
      console.error('Error converting JSON:', error);
      throw new Error('Failed to convert JSON data: ' + error.message);
    }
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      alert('Please paste the JSON data');
      return;
    }

    setImportLoading(true);
    try {
      const convertedData = convertCricHeroesJsonToFirebase(jsonInput);
      console.log('=== JSON IMPORT & SAVE ===');
      console.log('Raw JSON input:', jsonInput.substring(0, 500) + '...');
      console.log('Converted data from JSON:', JSON.stringify(convertedData, null, 2));
      
      // Prepare Firebase update data
      const updateData = {
        status: 'completed',
        tossWinner: convertedData.tossWinner || null,
        tossChoice: convertedData.tossChoice || null,
        team1Score: {
          runs: convertedData.team1?.totalRuns || 0,
          wickets: convertedData.team1?.wickets || 0,
          oversDisplay: convertedData.team1?.overs || '0.0'
        },
        team2Score: {
          runs: convertedData.team2?.totalRuns || 0,
          wickets: convertedData.team2?.wickets || 0,
          oversDisplay: convertedData.team2?.overs || '0.0'
        },
        team1Extras: convertedData.team1?.extras || 0,
        team2Extras: convertedData.team2?.extras || 0,
        result: convertedData.result || null,
        winningTeam: convertedData.winningTeam || null,
        updatedAt: new Date(),
        lastUpdatedBy: currentAdmin?.userid || 'admin'
      };
      
      // Add detailed batting stats with proper structure
      if (convertedData.team1?.batting || convertedData.team2?.batting) {
        const battingStats = {};
        
        if (convertedData.team1?.batting) {
          battingStats[scoreEntryMatch.team1] = Object.values(convertedData.team1.batting)
            .filter(player => player.runs > 0 || player.balls > 0 || player.dismissalType)
            .map(player => ({
              playerId: player.playerId,
              name: player.name,
              runs: player.runs || 0,
              balls: player.balls || 0,
              fours: player.fours || 0,
              sixes: player.sixes || 0,
              dismissalType: player.dismissalType || null,
              bowlerName: player.bowlerName || null,
              fielderName: player.fielderName || null,
              isOut: player.isOut || false,
              strikeRate: player.strikeRate || 0
            }));
        }
        
        if (convertedData.team2?.batting) {
          battingStats[scoreEntryMatch.team2] = Object.values(convertedData.team2.batting)
            .filter(player => player.runs > 0 || player.balls > 0 || player.dismissalType)
            .map(player => ({
              playerId: player.playerId,
              name: player.name,
              runs: player.runs || 0,
              balls: player.balls || 0,
              fours: player.fours || 0,
              sixes: player.sixes || 0,
              dismissalType: player.dismissalType || null,
              bowlerName: player.bowlerName || null,
              fielderName: player.fielderName || null,
              isOut: player.isOut || false,
              strikeRate: player.strikeRate || 0
            }));
        }
        
        updateData.battingStats = battingStats;
      }
      
      // Add detailed bowling stats with proper structure
      if (convertedData.team1?.bowling || convertedData.team2?.bowling) {
        const bowlingStats = {};
        
        if (convertedData.team1?.bowling) {
          bowlingStats[scoreEntryMatch.team1] = Object.values(convertedData.team1.bowling)
            .filter(player => player.overs > 0 || player.runs > 0 || player.wickets > 0)
            .map(player => ({
              playerId: player.playerId,
              name: player.name,
              overs: player.overs || 0,
              maidens: player.maidens || 0,
              runs: player.runs || 0,
              wickets: player.wickets || 0,
              economy: player.economy || 0,
              dots: player.dots || 0,
              wides: player.wides || 0,
              noBalls: player.noBalls || 0
            }));
        }
        
        if (convertedData.team2?.bowling) {
          bowlingStats[scoreEntryMatch.team2] = Object.values(convertedData.team2.bowling)
            .filter(player => player.overs > 0 || player.runs > 0 || player.wickets > 0)
            .map(player => ({
              playerId: player.playerId,
              name: player.name,
              overs: player.overs || 0,
              maidens: player.maidens || 0,
              runs: player.runs || 0,
              wickets: player.wickets || 0,
              economy: player.economy || 0,
              dots: player.dots || 0,
              wides: player.wides || 0,
              noBalls: player.noBalls || 0
            }));
        }
        
        updateData.bowlingStats = bowlingStats;
      }
      
      console.log('Saving to Firebase:', updateData);
      
      // Save to Firebase
      await updateDoc(doc(db, 'matches', scoreEntryMatch.id), updateData);
      
      console.log('✅ JSON data saved to Firebase successfully');
      
      // Trigger comprehensive data refresh using the manager
      await dataRefreshManager.refreshAfterMatchOperation('json-import', `${scoreEntryMatch.team1} vs ${scoreEntryMatch.team2}`);
      
      setShowJsonImport(false);
      setJsonInput('');
      await fetchMatches(); // Refresh matches
      
      alert('✅ JSON data imported and saved successfully! All statistics have been updated.');
      
    } catch (error) {
      console.error('❌ JSON import error:', error);
      alert('❌ Error importing JSON: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (!isAdminLoggedIn) {
      setShowAdminLogin(true);
    } else {
      setLoading(false);
      fetchTeams();
      fetchPlayerRegistrations();
      fetchMatches();
      fetchAdminUsers();
      fetchSponsors();
      fetchFormFields();
      fetchPaymentConfig();
      fetchCarouselImages();
      fetchRegistrationSettings();
    }
  }, [isAdminLoggedIn]);

  const fetchPlayerRegistrations = async () => {
    try {
      const registrationsSnapshot = await getDocs(collection(db, 'playerRegistrations'));
      const registrationsData = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayerRegistrations(registrationsData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setPlayerRegistrations([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const fetchMatches = useCallback(async () => {
    try {
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matchesData = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        matchType: doc.data().matchType || 'knockout'
      }));
      matchesData.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateTimeA - dateTimeB;
      });
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    }
  }, []);

  const uploadImage = async (file, folder) => {
    if (!file) return '';
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to process ${folder} image: ${error.message}`);
    }
  };

  const handlePaymentVerification = async (playerId, paymentStatus) => {
    try {
      await updateDoc(doc(db, 'playerRegistrations', playerId), {
        paymentStatus,
        paymentVerifiedAt: new Date(),
        paymentVerifiedBy: currentAdmin?.userid
      });
      
      fetchPlayerRegistrations();
      alert(`Payment ${paymentStatus === 'verified' ? 'verified' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status. Please try again.');
    }
  };

  const handlePlayerApproval = async (playerId, approved, teamId = null) => {
    try {
      await updateDoc(doc(db, 'playerRegistrations', playerId), {
        approved,
        status: approved ? 'approved' : 'rejected',
        teamId: approved && teamId ? teamId : null,
        season: 'Season 1', // Default to Season 1 for existing players
        reviewedAt: new Date(),
        reviewedBy: currentAdmin?.userid
      });
      
      fetchPlayerRegistrations();
    } catch (error) {
      console.error('Error updating player status:', error);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      const logoURL = await uploadImage(teamLogo, 'team-logos');
      const captainPhotoURL = await uploadImage(captainPhoto, 'captain-photos');
      const ownerPhotoURL = await uploadImage(ownerPhoto, 'owner-photos');
      const sponsorPhotoURL = await uploadImage(sponsorPhoto, 'sponsor-photos');

      const docRef = await addDoc(collection(db, 'teams'), {
        ...newTeam,
        logoURL,
        captainPhotoURL,
        ownerPhotoURL,
        sponsorPhotoURL,
        players: [],
        createdAt: new Date(),
        createdBy: currentAdmin?.userid
      });

      setTeams(prev => [...prev, { 
        id: docRef.id, 
        ...newTeam, 
        logoURL, 
        captainPhotoURL, 
        ownerPhotoURL, 
        sponsorPhotoURL,
        players: [],
        createdAt: new Date() 
      }]);
      
      resetTeamForm();
      
      // Initialize team in points table
      const pointsTableService = await import('../services/pointsTableService');
      await pointsTableService.default.initializeTeam(newTeam.name);
      
      // Trigger comprehensive data refresh using the manager
      await dataRefreshManager.refreshAfterTeamOperation('create', newTeam.name);
      
      alert('Team added successfully! All data has been refreshed.');
    } catch (error) {
      console.error('Error adding team:', error);
      setError(`Error adding team: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      const logoURL = teamLogo ? await uploadImage(teamLogo, 'team-logos') : selectedTeam.logoURL;
      const captainPhotoURL = captainPhoto ? await uploadImage(captainPhoto, 'captain-photos') : selectedTeam.captainPhotoURL;
      const ownerPhotoURL = ownerPhoto ? await uploadImage(ownerPhoto, 'owner-photos') : selectedTeam.ownerPhotoURL;
      const sponsorPhotoURL = sponsorPhoto ? await uploadImage(sponsorPhoto, 'sponsor-photos') : selectedTeam.sponsorPhotoURL;

      await updateDoc(doc(db, 'teams', selectedTeam.id), {
        ...newTeam,
        logoURL,
        captainPhotoURL,
        ownerPhotoURL,
        sponsorPhotoURL,
        updatedAt: new Date()
      });

      fetchTeams();
      resetTeamForm();
      
      // Trigger comprehensive data refresh using the manager
      await dataRefreshManager.refreshAfterTeamOperation('update', selectedTeam.name);
      
      alert('Team updated successfully! All data has been refreshed.');
    } catch (error) {
      console.error('Error updating team:', error);
      setError(`Error updating team: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteDoc(doc(db, 'teams', teamId));
        setTeams(prev => prev.filter(team => team.id !== teamId));
        
        // Trigger comprehensive data refresh using the manager
        await dataRefreshManager.refreshAfterTeamOperation('delete', teams.find(t => t.id === teamId)?.name || 'Unknown');
        
        alert('Team deleted successfully! All data has been refreshed.');
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team. Please try again.');
      }
    }
  };

  const handleAddPlayersToTeam = async (teamId, playerIds) => {
    try {
      const team = teams.find(t => t.id === teamId);
      const updatedPlayers = [...(team.players || []), ...playerIds];
      
      await updateDoc(doc(db, 'teams', teamId), {
        players: updatedPlayers,
        updatedAt: new Date()
      });

      // Update player registrations to mark them as assigned
      for (const playerId of playerIds) {
        await updateDoc(doc(db, 'playerRegistrations', playerId), {
          teamId: teamId,
          assignedAt: new Date()
        });
      }

      // Update local state immediately
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, players: updatedPlayers } : t
      ));
      setPlayerRegistrations(prev => prev.map(p => 
        playerIds.includes(p.id) ? { ...p, teamId } : p
      ));
      
      // Update selectedTeam if it's the current team
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(prev => ({ ...prev, players: updatedPlayers }));
      }
      
      alert('Player added to team successfully!');
    } catch (error) {
      console.error('Error adding players to team:', error);
      alert('Error adding players to team. Please try again.');
    }
  };

  const handleRemovePlayerFromTeam = async (teamId, playerId) => {
    try {
      const team = teams.find(t => t.id === teamId);
      const updatedPlayers = team.players.filter(id => id !== playerId);
      
      await updateDoc(doc(db, 'teams', teamId), {
        players: updatedPlayers,
        updatedAt: new Date()
      });

      // Remove team assignment from player
      await updateDoc(doc(db, 'playerRegistrations', playerId), {
        teamId: null,
        assignedAt: null
      });

      // Update local state immediately
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, players: updatedPlayers } : t
      ));
      setPlayerRegistrations(prev => prev.map(p => 
        p.id === playerId ? { ...p, teamId: null } : p
      ));
      
      // Update selectedTeam if it's the current team
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(prev => ({ ...prev, players: updatedPlayers }));
      }
      
      alert('Player removed from team successfully!');
    } catch (error) {
      console.error('Error removing player from team:', error);
      alert('Error removing player from team. Please try again.');
    }
  };

  const handleEditPlayer = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'playerRegistrations', selectedPlayer.id), {
        ...editPlayerData,
        updatedAt: new Date()
      });

      fetchPlayerRegistrations();
      setShowEditPlayer(false);
      setSelectedPlayer(null);
      alert('Player updated successfully!');
    } catch (error) {
      console.error('Error updating player:', error);
      setError(`Error updating player: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player registration?')) {
      try {
        // Remove player from any team they're assigned to
        const playerToDelete = playerRegistrations.find(p => p.id === playerId);
        if (playerToDelete?.teamId) {
          const team = teams.find(t => t.id === playerToDelete.teamId);
          if (team) {
            const updatedPlayers = team.players.filter(id => id !== playerId);
            await updateDoc(doc(db, 'teams', playerToDelete.teamId), {
              players: updatedPlayers,
              updatedAt: new Date()
            });
          }
        }
        
        await deleteDoc(doc(db, 'playerRegistrations', playerId));
        fetchPlayerRegistrations();
        fetchTeams();
        alert('Player deleted successfully!');
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
      }
    }
  };

  const openPlayerDetails = (player) => {
    // Close all other modals first
    setShowEditPlayer(false);
    setShowTeamDetails(false);
    setShowAddPlayers(false);
    
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
    // Scroll to top when opening modal
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const openEditPlayer = (player) => {
    console.log('Opening edit player modal for:', player.fullName);
    
    // Close all other modals
    setShowPlayerDetails(false);
    setShowTeamDetails(false);
    setShowAddPlayers(false);
    setShowAddTeam(false);
    setShowEditTeam(false);
    
    // Set player data and show modal
    setSelectedPlayer(player);
    setEditPlayerData({
      fullName: player.fullName || '',
      email: player.email || '',
      phone: player.phone || '',
      dateOfBirth: player.dateOfBirth || '',
      position: player.position || '',
      preferredHand: player.preferredHand || '',
      height: player.height || '',
      weight: player.weight || '',
      address: player.address || '',
      experience: player.experience || '',
      previousTeams: player.previousTeams || '',
      emergencyContact: player.emergencyContact || '',
      emergencyPhone: player.emergencyPhone || ''
    });
    setShowEditPlayer(true);
    // Scroll to top when opening modal
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    console.log('Edit player modal state set to true');
  };

  const resetTeamForm = () => {
    setNewTeam({ name: '', city: '', owner: '', captain: '', founded: '', stadium: '' });
    setTeamLogo(null);
    setCaptainPhoto(null);
    setOwnerPhoto(null);
    setSponsorPhoto(null);
    setShowAddTeam(false);
    setShowEditTeam(false);
    setSelectedTeam(null);
    setError('');
    setUploading(false);
  };

  const openEditTeam = (team) => {
    setSelectedTeam(team);
    setNewTeam({
      name: team.name,
      city: team.city,
      owner: team.owner,
      captain: team.captain,
      founded: team.founded,
      stadium: team.stadium
    });
    setShowEditTeam(true);
    // Scroll to top when edit form opens
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const fetchAdminUsers = async () => {
    try {
      const adminSnapshot = await getDocs(collection(db, 'adminUsers'));
      const adminData = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminUsers(adminData);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'adminUsers'), where('userid', '==', newAdmin.userid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('User ID already exists');
        return;
      }

      await addDoc(collection(db, 'adminUsers'), {
        ...newAdmin,
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      });
      
      setNewAdmin({ userid: '', password: '' });
      setShowAddAdmin(false);
      fetchAdminUsers();
      alert('Admin user created successfully!');
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Error creating admin user');
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'adminUsers', adminId), {
        isActive: !currentStatus
      });
      fetchAdminUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'adminUsers', selectedAdmin.id), {
        userid: editAdmin.userid,
        password: editAdmin.password
      });
      setShowEditAdmin(false);
      setSelectedAdmin(null);
      fetchAdminUsers();
      alert('Admin updated successfully!');
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Error updating admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteDoc(doc(db, 'adminUsers', adminId));
        fetchAdminUsers();
        alert('Admin deleted successfully!');
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Error deleting admin');
      }
    }
  };

  const openEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditAdmin({ userid: admin.userid, password: admin.password });
    setShowEditAdmin(true);
  };

  const fetchSponsors = async () => {
    try {
      const sponsorsSnapshot = await getDocs(collection(db, 'sponsors'));
      const sponsorsData = sponsorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSponsors(sponsorsData);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    }
  };

  const handleAddSponsor = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      let photoBase64 = '';
      
      if (eventSponsorPhoto) {
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(eventSponsorPhoto);
        });
      }

      await addDoc(collection(db, 'sponsors'), {
        ...newSponsor,
        photoBase64,
        createdAt: new Date(),
        createdBy: currentAdmin?.userid
      });
      
      setNewSponsor({ name: '', type: 'title', season: '', contribution: '', description: '', prizePosition: '' });
      setEventSponsorPhoto(null);
      setShowAddSponsor(false);
      fetchSponsors();
      alert('Sponsor added successfully!');
    } catch (error) {
      console.error('Error adding sponsor:', error);
      setError('Error adding sponsor. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId) => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
      try {
        await deleteDoc(doc(db, 'sponsors', sponsorId));
        fetchSponsors();
        alert('Sponsor deleted successfully!');
      } catch (error) {
        console.error('Error deleting sponsor:', error);
        alert('Error deleting sponsor. Please try again.');
      }
    }
  };

  const openEditSponsor = (sponsor) => {
    setSelectedSponsor(sponsor);
    setEditSponsor({
      name: sponsor.name,
      type: sponsor.type,
      season: sponsor.season,
      contribution: sponsor.contribution,
      description: sponsor.description,
      prizePosition: sponsor.prizePosition || ''
    });
    setShowEditSponsor(true);
  };

  const handleEditSponsor = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      let photoBase64 = selectedSponsor.photoBase64;
      
      if (eventSponsorPhoto) {
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(eventSponsorPhoto);
        });
      }

      await updateDoc(doc(db, 'sponsors', selectedSponsor.id), {
        ...editSponsor,
        photoBase64,
        updatedAt: new Date(),
        updatedBy: currentAdmin?.userid
      });
      
      setEditSponsor({ name: '', type: 'title', season: '', contribution: '', description: '', prizePosition: '' });
      setEventSponsorPhoto(null);
      setShowEditSponsor(false);
      setSelectedSponsor(null);
      fetchSponsors();
      alert('Sponsor updated successfully!');
    } catch (error) {
      console.error('Error updating sponsor:', error);
      setError('Error updating sponsor. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fetchFormFields = async () => {
    try {
      const fieldsSnapshot = await getDocs(collection(db, 'formFields'));
      const fieldsData = fieldsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no fields exist, create default fields
      if (fieldsData.length === 0) {
        const defaultFields = [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true, validation: '', order: 0 },
          { name: 'email', label: 'Email', type: 'email', required: true, validation: '', order: 1 },
          { name: 'phone', label: 'Phone Number', type: 'tel', required: true, validation: 'minLength:10', order: 2 },
          { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, validation: '', order: 3 },
          { name: 'position', label: 'Position', type: 'select', required: true, validation: 'options:Batsman,Bowler,All-rounder,Wicket-keeper', order: 4 },
          { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true, validation: '', order: 5 },
          { name: 'emergencyPhone', label: 'Emergency Phone', type: 'tel', required: true, validation: 'minLength:10', order: 6 }
        ];
        
        for (const field of defaultFields) {
          await addDoc(collection(db, 'formFields'), {
            ...field,
            createdAt: new Date(),
            createdBy: 'system'
          });
        }
        
        // Refetch after creating defaults
        const newSnapshot = await getDocs(collection(db, 'formFields'));
        const newData = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFormFields(newData.sort((a, b) => a.order - b.order));
      } else {
        setFormFields(fieldsData.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching form fields:', error);
    }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'formFields'), {
        ...newField,
        order: formFields.length,
        createdAt: new Date(),
        createdBy: currentAdmin?.userid
      });
      setNewField({ name: '', label: '', type: 'text', required: false, validation: '' });
      setShowAddField(false);
      fetchFormFields();
      alert('Field added successfully!');
    } catch (error) {
      console.error('Error adding field:', error);
      alert('Error adding field');
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await deleteDoc(doc(db, 'formFields', fieldId));
        fetchFormFields();
        alert('Field deleted successfully!');
      } catch (error) {
        console.error('Error deleting field:', error);
        alert('Error deleting field');
      }
    }
  };

  const handleDragStart = (e, field) => {
    setDraggedField(field);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetField) => {
    e.preventDefault();
    if (!draggedField || draggedField.id === targetField.id) return;

    const draggedIndex = formFields.findIndex(f => f.id === draggedField.id);
    const targetIndex = formFields.findIndex(f => f.id === targetField.id);
    
    const newFields = [...formFields];
    newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, draggedField);
    
    try {
      await Promise.all(newFields.map((field, index) => 
        updateDoc(doc(db, 'formFields', field.id), { order: index })
      ));
      
      setFormFields(newFields);
    } catch (error) {
      console.error('Error reordering fields:', error);
      alert('Error reordering fields');
    }
    
    setDraggedField(null);
  };

  const handleEditField = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'formFields', selectedField.id), {
        ...editField,
        updatedAt: new Date(),
        updatedBy: currentAdmin?.userid
      });
      setShowEditField(false);
      setSelectedField(null);
      fetchFormFields();
      alert('Field updated successfully!');
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Error updating field');
    }
  };

  const openEditField = (field) => {
    setSelectedField(field);
    setEditField({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      validation: field.validation || ''
    });
    setShowEditField(true);
  };

  const fetchPaymentConfig = async () => {
    try {
      const configSnapshot = await getDocs(collection(db, 'paymentConfig'));
      if (!configSnapshot.empty) {
        const configData = configSnapshot.docs[0].data();
        setPaymentConfig(configData);
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    try {
      const configSnapshot = await getDocs(collection(db, 'paymentConfig'));
      if (configSnapshot.empty) {
        await addDoc(collection(db, 'paymentConfig'), {
          ...paymentConfig,
          createdAt: new Date(),
          createdBy: currentAdmin?.userid
        });
      } else {
        const docId = configSnapshot.docs[0].id;
        await updateDoc(doc(db, 'paymentConfig', docId), {
          ...paymentConfig,
          updatedAt: new Date(),
          updatedBy: currentAdmin?.userid
        });
      }
      setShowPaymentConfig(false);
      alert('Payment configuration saved successfully!');
    } catch (error) {
      console.error('Error saving payment config:', error);
      alert('Error saving payment configuration');
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const carouselSnapshot = await getDocs(collection(db, 'carouselImages'));
      const carouselData = carouselSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedCarousel = carouselData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCarouselImages(sortedCarousel);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
    }
  };

  const handleAddCarouselImage = async (e) => {
    e.preventDefault();
    if (!carouselImageFile) {
      alert('Please select an image file');
      return;
    }
    
    setUploading(true);
    try {
      const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(carouselImageFile);
      });

      await addDoc(collection(db, 'carouselImages'), {
        ...newCarouselImage,
        url: imageBase64,
        createdAt: new Date(),
        createdBy: currentAdmin?.userid
      });
      
      setNewCarouselImage({ title: '', order: 0 });
      setCarouselImageFile(null);
      setShowAddCarouselImage(false);
      fetchCarouselImages();
      alert('Carousel image added successfully!');
    } catch (error) {
      console.error('Error adding carousel image:', error);
      alert('Error adding carousel image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCarouselImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this carousel image?')) {
      try {
        await deleteDoc(doc(db, 'carouselImages', imageId));
        fetchCarouselImages();
        alert('Carousel image deleted successfully!');
      } catch (error) {
        console.error('Error deleting carousel image:', error);
        alert('Error deleting carousel image');
      }
    }
  };

  const fetchRegistrationSettings = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      const registrationSetting = settingsSnapshot.docs.find(doc => doc.id === 'playerRegistration');
      setRegistrationSectionVisible(registrationSetting?.data()?.visible !== false);
    } catch (error) {
      console.error('Error fetching registration settings:', error);
    }
  };

  const handleToggleRegistrationSection = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      const registrationDoc = settingsSnapshot.docs.find(doc => doc.id === 'playerRegistration');
      
      if (registrationDoc) {
        await updateDoc(doc(db, 'settings', 'playerRegistration'), {
          visible: !registrationSectionVisible,
          updatedAt: new Date(),
          updatedBy: currentAdmin?.userid
        });
      } else {
        await addDoc(collection(db, 'settings'), {
          visible: !registrationSectionVisible,
          createdAt: new Date(),
          createdBy: currentAdmin?.userid
        });
      }
      
      setRegistrationSectionVisible(!registrationSectionVisible);
      alert(`Registration section ${!registrationSectionVisible ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating registration settings:', error);
      alert('Error updating registration settings');
    }
  };

  const tabs = [
    { id: 'players', name: 'Player Registrations', icon: Users },
    { id: 'teams', name: 'Teams', icon: Trophy },
    { id: 'sponsors', name: 'Sponsors', icon: Trophy },
    { id: 'matches', name: 'Matches & Scores', icon: Calendar },
    { id: 'live', name: 'Live Scoring', icon: Activity },
    { id: 'form', name: 'Registration Form', icon: FileText },
    { id: 'payment', name: 'Payment Settings', icon: CreditCard },
    { id: 'media', name: 'Carousel Images', icon: Image },
    { id: 'website', name: 'Website Settings', icon: Lock },
    { id: 'news', name: 'News', icon: FileText },
    { id: 'system', name: 'System Status', icon: Activity },
    ...(isSuperUser ? [{ id: 'admins', name: 'Admin Users', icon: User }] : [])
  ];

  if (!isAdminLoggedIn) {
    return showAdminLogin ? (
      <AdminLogin onClose={() => navigate('/')} />
    ) : null;
  }

  if (loading) {
    return (
      <div className="min-h-screen admin-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-bg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage Cricket League website content</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logged in as:</p>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{currentAdmin?.userid}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSuperUser ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isSuperUser ? 'Super User' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Consistency Checker */}
        <div className="mb-8">
          <DataConsistencyChecker showDetails={true} />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="mobile-admin-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`mobile-admin-tab ${
                      activeTab === tab.id
                        ? 'border-cricket-green text-cricket-green'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="sm:w-5 sm:h-5" />
                    <span className="mobile-hidden">{tab.name}</span>
                    <span className="mobile-only">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mobile-admin-content">
            {/* Player Registrations Tab */}
            {activeTab === 'players' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Player Registrations</h2>
                  <div className="flex items-center space-x-4">
                    {!isSuperUser && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Admin Access
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {playerRegistrations.filter(p => p.status === 'pending').length} pending approvals
                    </div>
                  </div>
                </div>

                {/* Status Tabs */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                      {['pending', 'approved', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setPlayerStatusFilter(status)}
                          className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                            playerStatusFilter === status
                              ? 'border-cricket-green text-cricket-green'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {status} ({playerRegistrations.filter(p => p.status === status).length})
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                <div className="space-y-2">
                  {playerRegistrations
                    .filter(player => player.status === playerStatusFilter)
                    .map((player) => (
                    <div key={player.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <button
                              onClick={() => openPlayerDetails(player)}
                              className="text-base font-semibold text-cricket-navy hover:text-cricket-blue underline truncate"
                            >
                              {player.fullName}
                            </button>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              player.status === 'approved' ? 'bg-green-100 text-green-800' :
                              player.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {player.status || 'pending'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 flex-1">
                              <div className="truncate">
                                <span className="font-medium">Email:</span> {player.email}
                              </div>
                              <div>
                                <span className="font-medium">Position:</span> {player.position}
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span> {player.phone}
                              </div>
                              <div>
                                <span className="font-medium">Fee:</span> ₹{player.registrationFee || 100}
                              </div>
                            </div>
                            
                            {/* Compact Photo and Payment */}
                            <div className="flex space-x-2 flex-shrink-0 ml-3">
                              {player.photoBase64 && (
                                <img 
                                  src={player.photoBase64} 
                                  alt="Player" 
                                  className="w-8 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => {
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                    modal.innerHTML = `
                                      <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2">
                                        <img src="${player.photoBase64}" class="max-w-full max-h-[85vh] object-contain rounded mx-auto block" />
                                        <button class="absolute -top-2 -right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold" onclick="this.parentElement.parentElement.remove()">
                                          ✕
                                        </button>
                                      </div>
                                    `;
                                    document.body.appendChild(modal);
                                  }}
                                  title="Player Photo"
                                />
                              )}
                              {player.paymentScreenshotBase64 && (
                                <img 
                                  src={player.paymentScreenshotBase64} 
                                  alt="Payment" 
                                  className="w-8 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => {
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                    modal.innerHTML = `
                                      <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2">
                                        <img src="${player.paymentScreenshotBase64}" class="max-w-full max-h-[85vh] object-contain rounded mx-auto block" />
                                        <button class="absolute -top-2 -right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold" onclick="this.parentElement.parentElement.remove()">
                                          ✕
                                        </button>
                                      </div>
                                    `;
                                    document.body.appendChild(modal);
                                  }}
                                  title="Payment Screenshot"
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                player.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                player.paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                Payment: {player.paymentStatus === 'verified' ? 'Approved' : player.paymentStatus === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                player.status === 'approved' ? 'bg-green-100 text-green-800' :
                                player.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                Player: {player.status === 'approved' ? 'Approved' : player.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                              {(player.paymentVerifiedBy || player.reviewedBy) && (
                                <span className="text-gray-400 text-xs truncate">
                                  by {player.reviewedBy || player.paymentVerifiedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                          {player.paymentStatus !== 'verified' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePaymentVerification(player.id, 'verified')}
                                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                              >
                                <CheckCircle size={16} />
                                <span>Verify Payment</span>
                              </button>
                              <button
                                onClick={() => handlePaymentVerification(player.id, 'rejected')}
                                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                              >
                                <XCircle size={16} />
                                <span>Reject Payment</span>
                              </button>
                            </div>
                          )}
                          {player.status === 'pending' && player.paymentStatus === 'verified' && (
                            <>
                              <select 
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handlePlayerApproval(player.id, true, e.target.value);
                                  }
                                }}
                              >
                                <option value="">Approve & Assign Team</option>
                                {teams.map(team => (
                                  <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                              </select>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePlayerApproval(player.id, true)}
                                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                  <CheckCircle size={16} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handlePlayerApproval(player.id, false)}
                                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                  <XCircle size={16} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditPlayer(player)}
                              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                              <Edit size={16} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {playerRegistrations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No player registrations found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Teams Management</h2>
                  <button
                    onClick={() => setShowAddTeam(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Team</span>
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                    {error}
                  </div>
                )}

                {/* Add Team Form */}
                {showAddTeam && (
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Team</h3>
                    <form onSubmit={handleAddTeam} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newTeam.city}
                        onChange={(e) => setNewTeam({...newTeam, city: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Owner"
                        value={newTeam.owner}
                        onChange={(e) => setNewTeam({...newTeam, owner: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Captain"
                        value={newTeam.captain}
                        onChange={(e) => setNewTeam({...newTeam, captain: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Founded Year"
                        value={newTeam.founded}
                        onChange={(e) => setNewTeam({...newTeam, founded: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Stadium"
                        value={newTeam.stadium}
                        onChange={(e) => setNewTeam({...newTeam, stadium: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setTeamLogo(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Captain Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCaptainPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Owner Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setOwnerPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSponsorPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="sm:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">
                          {uploading ? 'Adding Team...' : 'Add Team'}
                        </button>
                        <button type="button" onClick={resetTeamForm} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit Team Form */}
                {showEditTeam && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Edit Team</h3>
                    <form onSubmit={handleEditTeam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newTeam.city}
                        onChange={(e) => setNewTeam({...newTeam, city: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Owner"
                        value={newTeam.owner}
                        onChange={(e) => setNewTeam({...newTeam, owner: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Captain"
                        value={newTeam.captain}
                        onChange={(e) => setNewTeam({...newTeam, captain: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Founded Year"
                        value={newTeam.founded}
                        onChange={(e) => setNewTeam({...newTeam, founded: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Stadium"
                        value={newTeam.stadium}
                        onChange={(e) => setNewTeam({...newTeam, stadium: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        required
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setTeamLogo(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        {selectedTeam?.logoURL && <p className="text-xs text-gray-500 mt-1">Current logo will be kept if no new file selected</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Captain Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCaptainPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Owner Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setOwnerPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSponsorPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="md:col-span-2 flex space-x-2">
                        <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">
                          {uploading ? 'Updating Team...' : 'Update Team'}
                        </button>
                        <button type="button" onClick={resetTeamForm} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Teams Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {teams.map((team) => (
                    <div key={team.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                      {team.logoURL && (
                        <img src={team.logoURL} alt={team.name} className="w-16 h-16 object-cover rounded-full mx-auto mb-4" />
                      )}
                      <h3 className="text-lg font-semibold text-center mb-2">{team.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <p><span className="font-medium">City:</span> {team.city}</p>
                        <p><span className="font-medium">Owner:</span> {team.owner}</p>
                        <p><span className="font-medium">Captain:</span> {team.captain}</p>
                        <p><span className="font-medium">Stadium:</span> {team.stadium}</p>
                        <p><span className="font-medium">Founded:</span> {team.founded}</p>
                        <p><span className="font-medium">Players:</span> {team.players?.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length || 0}</p>
                        {team.createdBy && (
                          <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Created by:</span> {team.createdBy}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowTeamDetails(true);
                          }}
                          className="w-full bg-cricket-green hover:bg-cricket-green/90 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          View Details
                        </button>
                        <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 sm:gap-0">
                          <button
                            onClick={() => openEditTeam(team)}
                            className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-xs font-medium"
                          >
                            <Edit size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowAddPlayers(true);
                            }}
                            className="flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs font-medium"
                          >
                            <UserPlus size={12} />
                            <span>Manage</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="flex items-center justify-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs font-medium col-span-2 sm:col-span-1"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team Details Modal */}
                {showTeamDetails && selectedTeam && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-white via-blue-50 to-slate-100 rounded-2xl shadow-2xl p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
                      {/* Header with gradient background */}
                      <div className="relative bg-gradient-to-r from-cricket-navy via-cricket-blue to-cricket-orange rounded-xl p-6 mb-8 text-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            {selectedTeam.logoURL && (
                              <div className="w-20 h-20 bg-white/20 rounded-full p-2 backdrop-blur-sm">
                                <img src={selectedTeam.logoURL} alt="Team Logo" className="w-full h-full object-cover rounded-full" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-3xl font-bold drop-shadow-lg">{selectedTeam.name}</h3>
                              <p className="text-white/90 text-lg">{selectedTeam.city}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowTeamDetails(false)}
                            className="text-white/80 hover:text-white bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all"
                          >
                            <XCircle size={28} />
                          </button>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-cricket-navy/20 to-cricket-orange/20 rounded-xl"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Team Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg border border-blue-200/50">
                          <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                            <span className="w-2 h-8 bg-gradient-to-b from-cricket-navy to-cricket-blue rounded-full mr-3"></span>
                            Team Information
                          </h4>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="bg-white/70 rounded-lg p-4 shadow-sm">
                                <span className="font-semibold text-cricket-navy text-sm">Founded</span>
                                <p className="text-lg font-bold text-gray-800">{selectedTeam.founded}</p>
                              </div>
                              <div className="bg-white/70 rounded-lg p-4 shadow-sm">
                                <span className="font-semibold text-cricket-navy text-sm">Stadium</span>
                                <p className="text-lg font-bold text-gray-800">{selectedTeam.stadium}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Team Management */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 shadow-lg border border-gray-200/50">
                          <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                            <span className="w-2 h-8 bg-gradient-to-b from-cricket-orange to-cricket-navy rounded-full mr-3"></span>
                            Team Management
                          </h4>
                          <div className="space-y-4">
                            {/* Captain */}
                            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 shadow-md border border-yellow-200">
                              <div className="flex items-center space-x-4">
                                {selectedTeam.captainPhotoURL && (
                                  <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                                    <img src={selectedTeam.captainPhotoURL} alt="Captain" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-orange-800 text-sm">👑 CAPTAIN</p>
                                  <p className="text-lg font-semibold text-gray-800">{selectedTeam.captain}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Owner */}
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 shadow-md border border-purple-200">
                              <div className="flex items-center space-x-4">
                                {selectedTeam.ownerPhotoURL && (
                                  <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                                    <img src={selectedTeam.ownerPhotoURL} alt="Owner" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-purple-800 text-sm">💼 OWNER</p>
                                  <p className="text-lg font-semibold text-gray-800">{selectedTeam.owner}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Sponsor */}
                            {selectedTeam.sponsorPhotoURL && (
                              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 shadow-md border border-blue-200">
                                <div className="flex items-center space-x-4">
                                  <div className="w-14 h-14 bg-white rounded-full p-1 shadow-lg">
                                    <img src={selectedTeam.sponsorPhotoURL} alt="Sponsor" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-blue-800 text-sm">🤝 SPONSOR</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Players List */}
                      <div className="mt-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6 shadow-lg border border-gray-200/50">
                        <h4 className="text-xl font-bold text-cricket-navy mb-6 flex items-center">
                          <span className="w-2 h-8 bg-gradient-to-b from-cricket-blue to-cricket-orange rounded-full mr-3"></span>
                          Team Squad ({selectedTeam.players?.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length || 0} Players)
                        </h4>
                        {selectedTeam.players && selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).map(playerId => {
                              const player = playerRegistrations.find(p => p.id === playerId);
                              return (
                                <div key={playerId} className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-blue-100 hover:scale-105">
                                  <div className="flex items-center space-x-3">
                                    {player.photoBase64 ? (
                                      <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full p-0.5">
                                        <img src={player.photoBase64} alt={player.fullName} className="w-full h-full object-cover rounded-full" />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 bg-gradient-to-br from-cricket-navy to-cricket-blue rounded-full flex items-center justify-center text-white font-bold">
                                        {getPlayerInitials(player.fullName)}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-gray-800">{player.fullName}</p>
                                      <p className="text-sm font-semibold text-cricket-navy">{player.position}</p>
                                      <p className="text-xs text-gray-500">{player.email}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-6xl mb-4">🏏</div>
                            <p className="text-gray-500 text-lg">No players assigned to this team yet.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => setShowTeamDetails(false)}
                          className="bg-gradient-to-r from-cricket-navy to-cricket-blue hover:from-cricket-blue hover:to-cricket-navy text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manage Players Modal */}
                {showAddPlayers && selectedTeam && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4">Manage Players - {selectedTeam.name}</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Team Players */}
                        <div>
                          <h4 className="font-medium mb-3">Current Team Players ({selectedTeam.players?.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length || 0})</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {selectedTeam.players && selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).length > 0 ? (
                              selectedTeam.players.filter(playerId => playerRegistrations.find(p => p.id === playerId)).map(playerId => {
                                const player = playerRegistrations.find(p => p.id === playerId);
                                return (
                                  <div key={playerId} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                    <div className="flex items-center space-x-3">
                                      {player.photoBase64 && (
                                        <img src={player.photoBase64} alt={player.fullName} className="w-8 h-8 object-cover rounded-full" />
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">{player.fullName}</p>
                                        <p className="text-xs text-gray-600">{player.position}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemovePlayerFromTeam(selectedTeam.id, playerId)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-gray-500 text-sm">No players in this team</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Available Players */}
                        <div>
                          <h4 className="font-medium mb-3">Available Players ({playerRegistrations.filter(player => player.status === 'approved' && !player.teamId).length})</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {playerRegistrations
                              .filter(player => player.status === 'approved' && !player.teamId)
                              .map(player => (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm">
                                  <div className="flex items-center space-x-3">
                                    {player.photoBase64 ? (
                                      <img src={player.photoBase64} alt={player['Full Name']} className="w-10 h-10 object-cover rounded-full border-2 border-gray-200" />
                                    ) : (
                                      <div className="w-10 h-10 bg-cricket-navy rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {getPlayerInitials(player['Full Name'] || player.fullName)}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm text-gray-900">{player['Full Name'] || 'Unknown Player'}</p>
                                      <p className="text-xs text-gray-600">{player.position || 'No Position'} • {player.email || 'No Email'}</p>
                                      <p className="text-xs text-gray-500">Phone: {player.phone || 'No Phone'}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAddPlayersToTeam(selectedTeam.id, [player.id])}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                            {playerRegistrations.filter(player => player.status === 'approved' && !player.teamId).length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-gray-500 text-sm mb-2">No available players</p>
                                <p className="text-xs text-gray-400">All approved players are already assigned to teams</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setShowAddPlayers(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Player Details Modal */}
                {showPlayerDetails && selectedPlayer && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Player Details</h3>
                        <button
                          onClick={() => setShowPlayerDetails(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle size={24} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="text-center">
                            {selectedPlayer.photoURL && (
                              <img src={selectedPlayer.photoURL} alt={selectedPlayer.fullName} className="w-24 h-24 object-cover rounded-full mx-auto mb-4" />
                            )}
                            <h4 className="text-lg font-semibold">{selectedPlayer.fullName}</h4>
                            <p className="text-cricket-navy font-medium">{selectedPlayer.position}</p>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Email:</span> {selectedPlayer.email}</div>
                            <div><span className="font-medium">Phone:</span> {selectedPlayer.phone}</div>
                            <div><span className="font-medium">Date of Birth:</span> {selectedPlayer.dateOfBirth}</div>
                            <div><span className="font-medium">Preferred Hand:</span> {selectedPlayer.preferredHand}</div>
                            <div><span className="font-medium">Height:</span> {selectedPlayer.height} cm</div>
                            <div><span className="font-medium">Weight:</span> {selectedPlayer.weight} kg</div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Address:</span></div>
                            <p className="text-gray-600 bg-gray-50 p-2 rounded">{selectedPlayer.address || 'Not provided'}</p>
                            
                            <div><span className="font-medium">Experience:</span></div>
                            <p className="text-gray-600 bg-gray-50 p-2 rounded">{selectedPlayer.experience || 'Not provided'}</p>
                            
                            <div><span className="font-medium">Previous Teams:</span></div>
                            <p className="text-gray-600 bg-gray-50 p-2 rounded">{selectedPlayer.previousTeams || 'Not provided'}</p>
                            
                            <div><span className="font-medium">Emergency Contact:</span></div>
                            <p className="text-gray-600">{selectedPlayer.emergencyContact} - {selectedPlayer.emergencyPhone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-2">
                        <button
                          onClick={() => openEditPlayer(selectedPlayer)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                          Edit Player
                        </button>
                        <button
                          onClick={() => setShowPlayerDetails(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* Admin Users Tab - Super User Only */}
            {activeTab === 'admins' && isSuperUser && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Admin Users</h2>
                  {isSuperUser && (
                    <button
                      onClick={() => setShowAddAdmin(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Admin</span>
                    </button>
                  )}
                </div>

                {showAddAdmin && isSuperUser && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Admin User</h3>
                    <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="User ID"
                        value={newAdmin.userid}
                        onChange={(e) => setNewAdmin({...newAdmin, userid: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        required
                      />
                      <div className="md:col-span-2 flex space-x-2">
                        <button type="submit" className="btn-primary">Add Admin</button>
                        <button type="button" onClick={() => setShowAddAdmin(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{admin.userid}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              admin.role === 'superuser' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {admin.role === 'superuser' ? 'Super User' : 'Admin'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Created: {admin.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                          {isSuperUser && (
                            <p className="text-sm text-gray-500 font-mono">Password: {admin.password}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {admin.role !== 'superuser' && (
                            <>
                              <button
                                onClick={() => openEditAdmin(admin)}
                                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                              <button
                                onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  admin.isActive 
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {admin.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Admin Modal */}
                {showEditAdmin && selectedAdmin && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4">Edit Admin User</h3>
                      <form onSubmit={handleEditAdmin} className="space-y-4">
                        <input
                          type="text"
                          placeholder="User ID"
                          value={editAdmin.userid}
                          onChange={(e) => setEditAdmin({...editAdmin, userid: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={editAdmin.password}
                          onChange={(e) => setEditAdmin({...editAdmin, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                          required
                        />
                        <div className="flex space-x-2">
                          <button type="submit" className="flex-1 btn-primary">Update</button>
                          <button type="button" onClick={() => setShowEditAdmin(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Registration Form Tab */}
            {activeTab === 'form' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Registration Form Fields</h2>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Field</span>
                  </button>
                </div>

                {showAddField && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Field</h3>
                    <form onSubmit={handleAddField} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Field Name (e.g., fullName)"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Field Label (e.g., Full Name)"
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({...newField, type: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                        <option value="textarea">Textarea</option>
                        <option value="file">File</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Validation (e.g., minLength:10 for phone)"
                        value={newField.validation}
                        onChange={(e) => setNewField({...newField, validation: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({...newField, required: e.target.checked})}
                        />
                        <span>Required Field</span>
                      </label>
                      <div className="md:col-span-2 flex space-x-2">
                        <button type="submit" className="btn-primary">Add Field</button>
                        <button type="button" onClick={() => setShowAddField(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Registration Form Fields ({formFields.length})</h4>
                    <p className="text-sm text-blue-700">These fields will appear in the player registration form in the order shown below. Drag and drop to reorder fields.</p>
                  </div>
                  
                  {formFields.map((field, index) => (
                    <div 
                      key={field.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, field)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, field)}
                      className={`bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-move ${
                        draggedField?.id === field.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="text-gray-400" size={16} />
                            <div className="bg-cricket-navy text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{field.label}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Input Type:</span> {field.type}</p>
                              <p><span className="font-medium">Required:</span> 
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  field.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {field.required ? 'Yes' : 'No'}
                                </span>
                              </p>
                              {field.validation && <p><span className="font-medium">Validation:</span> {field.validation}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditField(field)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {formFields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No form fields configured. Add fields to customize the registration form.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Settings Tab */}
            {activeTab === 'payment' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                  <button
                    onClick={() => setShowPaymentConfig(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit Settings</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Current Payment Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium">Registration Fee:</span> ₹{paymentConfig.fee}
                    </div>
                    <div>
                      <span className="font-medium">Payment Instructions:</span>
                      <pre className="mt-2 bg-white p-3 rounded border text-sm whitespace-pre-wrap">{paymentConfig.instructions}</pre>
                    </div>
                    <div>
                      <span className="font-medium">QR Code Scanner:</span> {paymentConfig.showQrCode ? 'Enabled' : 'Disabled'}
                    </div>
                    {paymentConfig.qrCodeBase64 && (
                      <div>
                        <span className="font-medium">Payment QR Code:</span>
                        <img src={paymentConfig.qrCodeBase64} alt="Payment QR" className="mt-2 w-32 h-32 border rounded" />
                      </div>
                    )}
                  </div>
                </div>

                {showPaymentConfig && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4">Edit Payment Settings</h3>
                      <form onSubmit={handleSavePaymentConfig} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Registration Fee (₹)</label>
                          <input
                            type="number"
                            value={paymentConfig.fee}
                            onChange={(e) => setPaymentConfig({...paymentConfig, fee: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Payment Instructions</label>
                          <textarea
                            value={paymentConfig.instructions}
                            onChange={(e) => setPaymentConfig({...paymentConfig, instructions: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows="4"
                            required
                          />
                        </div>
                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={paymentConfig.showQrCode}
                              onChange={(e) => setPaymentConfig({...paymentConfig, showQrCode: e.target.checked})}
                            />
                            <span>Show QR Code Scanner</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Payment QR Code</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setPaymentConfig({...paymentConfig, qrCodeBase64: reader.result});
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button type="submit" className="btn-primary">Save Settings</button>
                          <button type="button" onClick={() => setShowPaymentConfig(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sponsors Tab */}
            {activeTab === 'sponsors' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-2 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sponsors Management</h2>
                  <button
                    onClick={() => setShowAddSponsor(true)}
                    className="btn-primary flex items-center space-x-2 w-fit"
                  >
                    <Plus size={16} />
                    <span>Add Sponsor</span>
                  </button>
                </div>

                {showAddSponsor && (
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Sponsor</h3>
                    <form onSubmit={handleAddSponsor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Sponsor Name"
                        value={newSponsor.name}
                        onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        required
                      />
                      <select
                        value={newSponsor.type}
                        onChange={(e) => setNewSponsor({...newSponsor, type: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                      >
                        <option value="title">Title Sponsor</option>
                        <option value="prize">Prize Sponsor</option>
                        <option value="food">Food Sponsor</option>
                        <option value="equipment">Equipment Sponsor</option>
                        <option value="team">Team Sponsor</option>
                        <option value="organization">Organization Sponsor</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Season (e.g., 2024)"
                        value={newSponsor.season}
                        onChange={(e) => setNewSponsor({...newSponsor, season: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Contribution"
                        value={newSponsor.contribution}
                        onChange={(e) => setNewSponsor({...newSponsor, contribution: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        required
                      />
                      {newSponsor.type === 'prize' && (
                        <select
                          value={newSponsor.prizePosition}
                          onChange={(e) => setNewSponsor({...newSponsor, prizePosition: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                          required
                        >
                          <option value="">Select Prize Position</option>
                          <option value="1st">1st Prize</option>
                          <option value="2nd">2nd Prize</option>
                          <option value="3rd">3rd Prize</option>
                          <option value="participation">Participation Prize</option>
                        </select>
                      )}
                      <textarea
                        placeholder="Description"
                        value={newSponsor.description}
                        onChange={(e) => setNewSponsor({...newSponsor, description: e.target.value})}
                        className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                        rows="3"
                      />
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEventSponsorPhoto(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button type="submit" className="btn-primary">Add Sponsor</button>
                        <button type="button" onClick={() => setShowAddSponsor(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                      {sponsor.photoBase64 && (
                        <img src={sponsor.photoBase64} alt={sponsor.name} className="w-full h-24 object-cover rounded-lg mb-4" />
                      )}
                      <h3 className="text-lg font-semibold mb-2">{sponsor.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <p><span className="font-medium">Type:</span> {sponsor.type}</p>
                        <p><span className="font-medium">Season:</span> {sponsor.season}</p>
                        <p><span className="font-medium">Contribution:</span> {sponsor.contribution}</p>
                        {sponsor.prizePosition && <p><span className="font-medium">Prize:</span> {sponsor.prizePosition}</p>}
                        <p className="text-xs line-clamp-2">{sponsor.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditSponsor(sponsor)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSponsor(sponsor.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Sponsor Modal */}
            {showEditSponsor && selectedSponsor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4">Edit Sponsor</h3>
                  <form onSubmit={handleEditSponsor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Sponsor Name"
                      value={editSponsor.name}
                      onChange={(e) => setEditSponsor({...editSponsor, name: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <select
                      value={editSponsor.type}
                      onChange={(e) => setEditSponsor({...editSponsor, type: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="title">Title Sponsor</option>
                      <option value="prize">Prize Sponsor</option>
                      <option value="food">Food Sponsor</option>
                      <option value="equipment">Equipment Sponsor</option>
                      <option value="team">Team Sponsor</option>
                      <option value="organization">Organization Sponsor</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Season (e.g., 2024)"
                      value={editSponsor.season}
                      onChange={(e) => setEditSponsor({...editSponsor, season: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Contribution"
                      value={editSponsor.contribution}
                      onChange={(e) => setEditSponsor({...editSponsor, contribution: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    {editSponsor.type === 'prize' && (
                      <select
                        value={editSponsor.prizePosition}
                        onChange={(e) => setEditSponsor({...editSponsor, prizePosition: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Prize Position</option>
                        <option value="1st">1st Prize</option>
                        <option value="2nd">2nd Prize</option>
                        <option value="3rd">3rd Prize</option>
                        <option value="participation">Participation Prize</option>
                      </select>
                    )}
                    <textarea
                      placeholder="Description"
                      value={editSponsor.description}
                      onChange={(e) => setEditSponsor({...editSponsor, description: e.target.value})}
                      className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEventSponsorPhoto(e.target.files[0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {selectedSponsor.photoBase64 && <p className="text-xs text-gray-500 mt-1">Current photo will be kept if no new file selected</p>}
                    </div>
                    <div className="sm:col-span-2 flex space-x-2">
                      <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">
                        {uploading ? 'Updating...' : 'Update Sponsor'}
                      </button>
                      <button type="button" onClick={() => setShowEditSponsor(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Live Scoring Tab */}
            {activeTab === 'live' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Live Scoring System</h2>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-red-500 animate-pulse" />
                    <span className="text-sm text-gray-600">Real-time match scoring</span>
                    {selectedMatch && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Match Selected: {selectedMatch.team1} vs {selectedMatch.team2}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Live Scoring Interface */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-cricket-green" />
                      Live Match Scoring
                      {selectedMatch && (
                        <button
                          onClick={() => setSelectedMatch(null)}
                          className="ml-auto text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md"
                        >
                          Clear Selection
                        </button>
                      )}
                    </h3>
                    <EnhancedLiveScoring preSelectedMatch={selectedMatch} />
                  </div>
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">How to Use Live Scoring:</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>1. Create Match:</strong> Select teams and start a new match</p>
                    <p><strong>2. Ball-by-Ball Scoring:</strong> Use scoring buttons (0, 1, 2, 3, 4, 6, W) to update scores</p>
                    <p><strong>3. Real-time Updates:</strong> Scores update instantly across all devices</p>
                    <p><strong>4. Live Display:</strong> Matches appear on the public scoreboard automatically</p>
                    <p><strong>5. Match Control:</strong> Pause, resume, or end matches as needed</p>
                    <p><strong>6. Score Entry:</strong> Click "Score Entry" button from matches tab to directly score a specific match</p>
                  </div>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Matches & Detailed Scoring</h2>
                  <button
                    onClick={() => setShowAddMatch(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Schedule Match</span>
                  </button>
                </div>

                {showAddMatch && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Schedule New Match</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      
                      // Validation: Prevent same team selection
                      if (newMatch.team1 === newMatch.team2) {
                        alert('Error: Cannot schedule a match between the same team. Please select different teams.');
                        return;
                      }
                      
                      // Validation: Check if teams have players
                      const team1Data = teams.find(t => t.name === newMatch.team1);
                      const team2Data = teams.find(t => t.name === newMatch.team2);
                      
                      if (!team1Data?.players?.length || !team2Data?.players?.length) {
                        alert('Error: Both teams must have at least one player assigned before scheduling a match.');
                        return;
                      }
                      
                      // Validation: Check for duplicate match on same date
                      const existingMatch = matches.find(match => 
                        match.date === newMatch.date && 
                        ((match.team1 === newMatch.team1 && match.team2 === newMatch.team2) ||
                         (match.team1 === newMatch.team2 && match.team2 === newMatch.team1))
                      );
                      
                      if (existingMatch) {
                        alert('Error: A match between these teams is already scheduled for this date.');
                        return;
                      }
                      
                      try {
                        
                        const team1Players = team1Data?.players?.map(playerId => {
                          const player = playerRegistrations.find(p => p.id === playerId);
                          return player ? {
                            id: playerId,
                            name: player['Full Name'] || player.fullName,
                            position: player.position,
                            bowlingQuota: player.position === 'Bowler' || player.position === 'All-rounder' ? 4 : 0
                          } : null;
                        }).filter(Boolean) || [];
                        
                        const team2Players = team2Data?.players?.map(playerId => {
                          const player = playerRegistrations.find(p => p.id === playerId);
                          return player ? {
                            id: playerId,
                            name: player['Full Name'] || player.fullName,
                            position: player.position,
                            bowlingQuota: player.position === 'Bowler' || player.position === 'All-rounder' ? 4 : 0
                          } : null;
                        }).filter(Boolean) || [];
                        
                        await addDoc(collection(db, 'matches'), {
                          ...newMatch,
                          team1Id: team1Data?.id,
                          team2Id: team2Data?.id,
                          team1Players,
                          team2Players,
                          overs: parseInt(newMatch.overs) || 8,
                          status: 'upcoming',
                          createdAt: new Date(),
                          createdBy: currentAdmin?.userid
                        });
                        
                        // Trigger comprehensive data refresh using the manager
                        await dataRefreshManager.refreshAfterMatchOperation('create', `${newMatch.team1} vs ${newMatch.team2}`);
                        
                        setNewMatch({ team1: '', team2: '', date: '', venue: 'Nutan Vidyalaya Khajjidoni', overs: '8', matchType: 'knockout', team1Score: '', team2Score: '', status: 'upcoming' });
                        setShowAddMatch(false);
                        fetchMatches();
                        
                        alert('Match scheduled successfully with player squads!');
                      } catch (error) {
                        console.error('Error scheduling match:', error);
                        alert('Error scheduling match. Please try again.');
                      }
                    }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={newMatch.team1}
                        onChange={(e) => setNewMatch({...newMatch, team1: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Team 1</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.name}>{team.name}</option>
                        ))}
                      </select>
                      <select
                        value={newMatch.team2}
                        onChange={(e) => setNewMatch({...newMatch, team2: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Team 2</option>
                        {teams.filter(team => team.name !== newMatch.team1).map(team => (
                          <option key={team.id} value={team.name}>{team.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={newMatch.date}
                        onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Venue"
                        value={newMatch.venue}
                        onChange={(e) => setNewMatch({...newMatch, venue: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <select
                        value={newMatch.overs || '8'}
                        onChange={(e) => setNewMatch({...newMatch, overs: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="5">5 Overs</option>
                        <option value="8">8 Overs</option>
                        <option value="10">10 Overs</option>
                        <option value="15">15 Overs</option>
                        <option value="20">20 Overs (T20)</option>
                        <option value="50">50 Overs (ODI)</option>
                      </select>
                      <input
                        type="time"
                        value={newMatch.time || ''}
                        onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <select
                        value={newMatch.matchType || 'knockout'}
                        onChange={(e) => setNewMatch({...newMatch, matchType: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="knockout">Knockout</option>
                        <option value="qualifier1">Qualifier 1</option>
                        <option value="qualifier2">Qualifier 2</option>
                        <option value="eliminator">Eliminator</option>
                        <option value="final">Final</option>
                      </select>
                      <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Match Setup Info:</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>• Players from both teams will be automatically included</p>
                          <p>• Bowling quotas: Bowlers & All-rounders get 4 overs (adjustable in live scoring)</p>
                          <p>• Match will be available for live scoring once created</p>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex space-x-2">
                        <button type="submit" className="btn-primary">Schedule Match</button>
                        <button type="button" onClick={() => setShowAddMatch(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{match.team1} vs {match.team2}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              match.status === 'live' ? 'bg-red-100 text-red-800 animate-pulse' :
                              match.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {match.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Date:</span> {formatMatchDate(match.date)}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {match.time || 'TBD'}
                            </div>
                            <div>
                              <span className="font-medium">Venue:</span> {match.venue}
                            </div>
                            <div>
                              <span className="font-medium">Format:</span> {match.overs} overs
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                                match.matchType === 'final' ? 'bg-yellow-100 text-yellow-800' :
                                match.matchType === 'qualifier1' || match.matchType === 'qualifier2' ? 'bg-blue-100 text-blue-800' :
                                match.matchType === 'eliminator' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {match.matchType === 'qualifier1' ? 'Qualifier 1' :
                                 match.matchType === 'qualifier2' ? 'Qualifier 2' :
                                 match.matchType?.charAt(0).toUpperCase() + match.matchType?.slice(1) || 'Knockout'}
                              </span>
                            </div>
                          </div>

                          {/* Toss Information */}
                          {match.tossWinner && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Toss:</span> {match.tossWinner} won and chose to {match.tossChoice}
                              </p>
                            </div>
                          )}

                          {/* Live Score Display */}
                          {(match.status === 'live' || match.status === 'completed') && (
                            <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white rounded-lg p-4 mb-4">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                  <h4 className="font-semibold mb-1">{match.team1}</h4>
                                  <p className="text-2xl font-bold">
                                    {match.team1Score?.runs || 0}/{match.team1Score?.wickets || 0}
                                  </p>
                                  <p className="text-sm opacity-90">({match.team1Score?.oversDisplay || '0.0'} overs)</p>
                                </div>
                                <div className="text-center">
                                  <h4 className="font-semibold mb-1">{match.team2}</h4>
                                  <p className="text-2xl font-bold">
                                    {match.team2Score?.runs || 0}/{match.team2Score?.wickets || 0}
                                  </p>
                                  <p className="text-sm opacity-90">({match.team2Score?.oversDisplay || '0.0'} overs)</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Squad Information */}
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            <div>
                              <span className="font-medium">{match.team1} Squad:</span> {match.team1Players?.length || 0} players
                            </div>
                            <div>
                              <span className="font-medium">{match.team2} Squad:</span> {match.team2Players?.length || 0} players
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => {
                              setScoreEntryMatch(match);
                              initializeScorecardData(match);
                              setShowScoreEntry(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                          >
                            <Target size={16} />
                            <span>Enter Scores</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setScoreEntryMatch(match);
                              setShowJsonImport(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                          >
                            <Upload size={16} />
                            <span>Import JSON</span>
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this match? This will also delete all related statistics and update points table.')) {
                                try {
                                  console.log('🗑️ Deleting match and related data:', match.id);
                                  
                                  // Delete the match document
                                  await deleteDoc(doc(db, 'matches', match.id));
                                  
                                  // Recalculate all player statistics from remaining matches
                                  const { default: statsService } = await import('../services/statsService');
                                  await statsService.recalculateAllStats();
                                  
                                  // Trigger comprehensive data refresh using the manager
                                  await dataRefreshManager.refreshAfterMatchOperation('delete', `${match.team1} vs ${match.team2}`);
                                  
                                  fetchMatches();
                                  alert('Match deleted successfully! All player statistics have been recalculated.');
                                } catch (error) {
                                  console.error('❌ Error deleting match:', error);
                                  alert('Error deleting match: ' + error.message);
                                }
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {matches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No matches scheduled yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Media & Images Tab */}
            {activeTab === 'media' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Media & Images</h2>
                  <button
                    onClick={() => setShowAddCarouselImage(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Carousel Image</span>
                  </button>
                </div>

                {showAddCarouselImage && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add Carousel Image</h3>
                    <form onSubmit={handleAddCarouselImage} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Image Title (optional)"
                        value={newCarouselImage.title}
                        onChange={(e) => setNewCarouselImage({...newCarouselImage, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="number"
                        placeholder="Display Order (0 = first)"
                        value={newCarouselImage.order}
                        onChange={(e) => setNewCarouselImage({...newCarouselImage, order: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCarouselImageFile(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">
                          {uploading ? 'Adding...' : 'Add Image'}
                        </button>
                        <button type="button" onClick={() => setShowAddCarouselImage(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carouselImages.map((image) => (
                    <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <img src={image.url} alt={image.title || 'Carousel Image'} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{image.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600 mb-4">Order: {image.order || 0}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteCarouselImage(image.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {carouselImages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Image size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Carousel Images</h3>
                    <p className="text-gray-600">Add images to display in the homepage carousel.</p>
                  </div>
                )}
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  News Management
                </h3>
                <p className="text-gray-600">
                  This section is under development. Coming soon!
                </p>
              </div>
            )}

            {/* Website Settings Tab */}
            {activeTab === 'website' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Website Settings</h2>
                  <p className="text-gray-600">
                    Control the visibility and behavior of different sections on the website.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Player Registration Section Control */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Player Registration Section</h3>
                        <p className="text-gray-600 text-sm">
                          Control whether the player registration section appears on the home page.
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${
                          registrationSectionVisible ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {registrationSectionVisible ? 'Visible' : 'Hidden'}
                        </span>
                        <button
                          onClick={handleToggleRegistrationSection}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            registrationSectionVisible ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              registrationSectionVisible ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">What this controls:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Shows/hides the "Join the League" section on the home page</li>
                        <li>• Includes tournament details, prize information, and registration button</li>
                        <li>• Useful for controlling registration periods</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Tab */}
            {activeTab === 'system' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status & Data Consistency</h2>
                  <p className="text-gray-600 mb-6">
                    Monitor data consistency across all pages and trigger manual refreshes when needed.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Detailed Data Consistency Checker */}
                  <DataConsistencyChecker showDetails={true} />

                  {/* Manual Refresh Controls */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Manual Data Refresh</h3>
                    <p className="text-blue-800 mb-4 text-sm">
                      Use these controls if you notice data inconsistencies across different pages.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => dataRefreshManager.triggerQuickRefresh('admin-manual')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                      >
                        Quick Refresh (Components Only)
                      </button>
                      <button
                        onClick={() => dataRefreshManager.triggerCompleteRefresh(true, 'admin-manual-full')}
                        className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-md font-medium"
                      >
                        Complete Refresh (Full Sync)
                      </button>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Refresh Manager Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          dataRefreshManager.isRefreshInProgress() 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {dataRefreshManager.isRefreshInProgress() ? 'Refreshing...' : 'Ready'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Queued Requests:</span>
                        <span className="ml-2 text-gray-600">{dataRefreshManager.getQueueLength()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Edit Player Modal - Available from all tabs */}
        {showEditPlayer && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 9999}}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Player - {selectedPlayer.fullName}</h3>
                <button
                  onClick={() => {
                    setShowEditPlayer(false);
                    setSelectedPlayer(null);
                    setEditPlayerData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <form onSubmit={handleEditPlayer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editPlayerData.fullName || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, fullName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editPlayerData.email || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, email: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={editPlayerData.phone || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, phone: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <input
                  type="date"
                  value={editPlayerData.dateOfBirth || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, dateOfBirth: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <select
                  value={editPlayerData.position || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, position: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                >
                  <option value="">Select Position</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
                <select
                  value={editPlayerData.preferredHand || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, preferredHand: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                >
                  <option value="">Select Preferred Hand</option>
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                </select>
                <input
                  type="number"
                  placeholder="Height (cm)"
                  value={editPlayerData.height || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, height: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={editPlayerData.weight || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, weight: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                />
                <input
                  type="text"
                  placeholder="Emergency Contact"
                  value={editPlayerData.emergencyContact || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, emergencyContact: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <input
                  type="tel"
                  placeholder="Emergency Phone"
                  value={editPlayerData.emergencyPhone || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, emergencyPhone: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  required
                />
                <textarea
                  placeholder="Address"
                  value={editPlayerData.address || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, address: e.target.value})}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  rows="2"
                />
                <textarea
                  placeholder="Cricket Experience"
                  value={editPlayerData.experience || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, experience: e.target.value})}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  rows="3"
                />
                <textarea
                  placeholder="Previous Teams"
                  value={editPlayerData.previousTeams || ''}
                  onChange={(e) => setEditPlayerData({...editPlayerData, previousTeams: e.target.value})}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-navy focus:border-cricket-navy"
                  rows="2"
                />
                
                <div className="md:col-span-2 flex space-x-2">
                  <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">
                    {uploading ? 'Updating...' : 'Update Player'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowEditPlayer(false);
                    setSelectedPlayer(null);
                    setEditPlayerData({});
                  }} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Field Modal */}
        {showEditField && selectedField && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit Field</h3>
              <form onSubmit={handleEditField} className="space-y-4">
                <input
                  type="text"
                  placeholder="Field Name (e.g., fullName)"
                  value={editField.name}
                  onChange={(e) => setEditField({...editField, name: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-base"
                  required
                />
                <input
                  type="text"
                  placeholder="Field Label (e.g., Full Name)"
                  value={editField.label}
                  onChange={(e) => setEditField({...editField, label: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-base"
                  required
                />
                <select
                  value={editField.type}
                  onChange={(e) => setEditField({...editField, type: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-base"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                  <option value="file">File</option>
                </select>
                <input
                  type="text"
                  placeholder="Validation (e.g., minLength:10 for phone)"
                  value={editField.validation}
                  onChange={(e) => setEditField({...editField, validation: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-base"
                />
                <label className="flex items-center space-x-2 touch-btn">
                  <input
                    type="checkbox"
                    checked={editField.required}
                    onChange={(e) => setEditField({...editField, required: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-base">Required Field</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <button type="submit" className="flex-1 btn-primary">Update Field</button>
                  <button type="button" onClick={() => setShowEditField(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* JSON Import Modal */}
        {showJsonImport && scoreEntryMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Import CricHeroes JSON - {scoreEntryMatch.team1} vs {scoreEntryMatch.team2}</h3>
                <button onClick={() => setShowJsonImport(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste CricHeroes JSON Response:
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Paste the complete JSON response from CricHeroes here..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Copy the complete JSON response from CricHeroes scorecard page</li>
                  <li>2. Paste it in the textarea above</li>
                  <li>3. Click "Import & Convert" to automatically populate the scorecard</li>
                  <li>4. Review the imported data and make any necessary adjustments</li>
                  <li>5. Save the complete scorecard to update the match</li>
                </ol>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowJsonImport(false)} 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleJsonImport}
                  disabled={importLoading || !jsonInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {importLoading ? 'Importing & Saving...' : 'Import & Save to Firebase'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Scorecard Entry Modal */}
        {showScoreEntry && scoreEntryMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Enter Match Scores - {scoreEntryMatch.team1} vs {scoreEntryMatch.team2}</h3>
                <button onClick={() => setShowScoreEntry(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
              
              {/* Toss Information */}
              <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Toss Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={scorecardData.tossWinner || ''}
                    onChange={(e) => setScorecardData(prev => ({...prev, tossWinner: e.target.value}))}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Toss Winner</option>
                    <option value={scoreEntryMatch.team1}>{scoreEntryMatch.team1}</option>
                    <option value={scoreEntryMatch.team2}>{scoreEntryMatch.team2}</option>
                  </select>
                  <select 
                    value={scorecardData.tossChoice || ''}
                    onChange={(e) => setScorecardData(prev => ({...prev, tossChoice: e.target.value}))}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Choice</option>
                    <option value="bat">Bat First</option>
                    <option value="bowl">Bowl First</option>
                  </select>
                </div>
              </div>
              
              {/* Team 1 Batting & Team 2 Bowling */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{scoreEntryMatch.team1} Batting vs {scoreEntryMatch.team2} Bowling</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4">{scoreEntryMatch.team1} Batting</h4>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="number" 
                          placeholder="Total Runs" 
                          value={scorecardData.team1?.totalRuns || ''}
                          onChange={(e) => updateTeamTotal('team1', 'totalRuns', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                        <input 
                          type="number" 
                          placeholder="Wickets" 
                          value={scorecardData.team1?.wickets || ''}
                          onChange={(e) => updateTeamTotal('team1', 'wickets', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                        <input 
                          type="text" 
                          placeholder="Overs" 
                          value={scorecardData.team1?.overs || ''}
                          onChange={(e) => updateTeamTotal('team1', 'overs', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Extras" 
                        value={scorecardData.team1?.extras || ''}
                        onChange={(e) => updateTeamTotal('team1', 'extras', e.target.value)}
                        className="w-full px-3 py-2 border rounded" 
                      />
                    </div>
                    
                    {/* Batting Stats Headers */}
                    <div className="grid grid-cols-5 gap-1 mb-2 text-xs font-semibold text-gray-600">
                      <div>Runs</div>
                      <div>Balls</div>
                      <div>4s</div>
                      <div>6s</div>
                      <div>S/R</div>
                    </div>
                    
                    <div className="space-y-2">
                      {scoreEntryMatch.team1Players?.map((player, i) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <div className="font-medium text-sm mb-2">{player.name}</div>
                          <div className="grid grid-cols-5 gap-1 mb-2">
                            <input 
                              type="number" 
                              placeholder="Runs" 
                              value={scorecardData.team1?.batting?.[player.id]?.runs ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'runs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Balls" 
                              value={scorecardData.team1?.batting?.[player.id]?.balls ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'balls', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="4s" 
                              value={scorecardData.team1?.batting?.[player.id]?.fours ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'fours', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="6s" 
                              value={scorecardData.team1?.batting?.[player.id]?.sixes ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'sixes', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-center font-medium">
                              {scorecardData.team1?.batting?.[player.id]?.strikeRate || '0.00'}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <select 
                              value={scorecardData.team1?.batting?.[player.id]?.dismissalType || ''}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'dismissalType', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Not Out</option>
                              <option value="bowled">Bowled</option>
                              <option value="caught">Caught</option>
                              <option value="lbw">LBW</option>
                              <option value="runout">Run Out</option>
                              <option value="stumped">Stumped</option>
                            </select>
                            <select 
                              value={scorecardData.team1?.batting?.[player.id]?.bowlerName || ''}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'bowlerName', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Bowler</option>
                              {scoreEntryMatch.team2Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <select 
                              value={scorecardData.team1?.batting?.[player.id]?.fielderName || ''}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'fielderName', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Fielder 1</option>
                              {scoreEntryMatch.team2Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <select 
                              value={scorecardData.team1?.batting?.[player.id]?.fielder2Name || ''}
                              onChange={(e) => updateScorecardData('team1', 'batting', player.id, 'fielder2Name', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Fielder 2</option>
                              {scoreEntryMatch.team2Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4">{scoreEntryMatch.team2} Bowling</h4>
                    
                    {/* Bowling Stats Headers */}
                    <div className="grid grid-cols-5 gap-1 mb-2 text-xs font-semibold text-gray-600">
                      <div>Overs</div>
                      <div>Maidens</div>
                      <div>Runs</div>
                      <div>Wickets</div>
                      <div>Economy</div>
                    </div>
                    
                    <div className="space-y-2">
                      {scoreEntryMatch.team2Players?.map((player, i) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <div className="font-medium text-sm mb-2">{player.name}</div>
                          <div className="grid grid-cols-5 gap-1">
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="Overs" 
                              value={scorecardData.team2?.bowling?.[player.id]?.overs ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'bowling', player.id, 'overs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Maidens" 
                              value={scorecardData.team2?.bowling?.[player.id]?.maidens ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'bowling', player.id, 'maidens', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Runs" 
                              value={scorecardData.team2?.bowling?.[player.id]?.runs ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'bowling', player.id, 'runs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Wickets" 
                              value={scorecardData.team2?.bowling?.[player.id]?.wickets ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'bowling', player.id, 'wickets', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-center font-medium">
                              {scorecardData.team2?.bowling?.[player.id]?.economy || '0.00'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team 2 Batting & Team 1 Bowling */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">{scoreEntryMatch.team2} Batting vs {scoreEntryMatch.team1} Bowling</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4">{scoreEntryMatch.team2} Batting</h4>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="number" 
                          placeholder="Total Runs" 
                          value={scorecardData.team2?.totalRuns || ''}
                          onChange={(e) => updateTeamTotal('team2', 'totalRuns', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                        <input 
                          type="number" 
                          placeholder="Wickets" 
                          value={scorecardData.team2?.wickets || ''}
                          onChange={(e) => updateTeamTotal('team2', 'wickets', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                        <input 
                          type="text" 
                          placeholder="Overs" 
                          value={scorecardData.team2?.overs || ''}
                          onChange={(e) => updateTeamTotal('team2', 'overs', e.target.value)}
                          className="px-3 py-2 border rounded" 
                        />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Extras" 
                        value={scorecardData.team2?.extras || ''}
                        onChange={(e) => updateTeamTotal('team2', 'extras', e.target.value)}
                        className="w-full px-3 py-2 border rounded" 
                      />
                    </div>
                    
                    {/* Batting Stats Headers */}
                    <div className="grid grid-cols-5 gap-1 mb-2 text-xs font-semibold text-gray-600">
                      <div>Runs</div>
                      <div>Balls</div>
                      <div>4s</div>
                      <div>6s</div>
                      <div>S/R</div>
                    </div>
                    
                    <div className="space-y-2">
                      {scoreEntryMatch.team2Players?.map((player, i) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <div className="font-medium text-sm mb-2">{player.name}</div>
                          <div className="grid grid-cols-5 gap-1 mb-2">
                            <input 
                              type="number" 
                              placeholder="Runs" 
                              value={scorecardData.team2?.batting?.[player.id]?.runs ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'runs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Balls" 
                              value={scorecardData.team2?.batting?.[player.id]?.balls ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'balls', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="4s" 
                              value={scorecardData.team2?.batting?.[player.id]?.fours ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'fours', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="6s" 
                              value={scorecardData.team2?.batting?.[player.id]?.sixes ?? 0}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'sixes', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-center font-medium">
                              {scorecardData.team2?.batting?.[player.id]?.strikeRate || '0.00'}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <select 
                              value={scorecardData.team2?.batting?.[player.id]?.dismissalType || ''}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'dismissalType', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Not Out</option>
                              <option value="bowled">Bowled</option>
                              <option value="caught">Caught</option>
                              <option value="lbw">LBW</option>
                              <option value="runout">Run Out</option>
                              <option value="stumped">Stumped</option>
                            </select>
                            <select 
                              value={scorecardData.team2?.batting?.[player.id]?.bowlerName || ''}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'bowlerName', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Bowler</option>
                              {scoreEntryMatch.team1Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <select 
                              value={scorecardData.team2?.batting?.[player.id]?.fielderName || ''}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'fielderName', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Fielder 1</option>
                              {scoreEntryMatch.team1Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                            <select 
                              value={scorecardData.team2?.batting?.[player.id]?.fielder2Name || ''}
                              onChange={(e) => updateScorecardData('team2', 'batting', player.id, 'fielder2Name', e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Fielder 2</option>
                              {scoreEntryMatch.team1Players?.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4">{scoreEntryMatch.team1} Bowling</h4>
                    
                    {/* Bowling Stats Headers */}
                    <div className="grid grid-cols-5 gap-1 mb-2 text-xs font-semibold text-gray-600">
                      <div>Overs</div>
                      <div>Maidens</div>
                      <div>Runs</div>
                      <div>Wickets</div>
                      <div>Economy</div>
                    </div>
                    
                    <div className="space-y-2">
                      {scoreEntryMatch.team1Players?.map((player, i) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <div className="font-medium text-sm mb-2">{player.name}</div>
                          <div className="grid grid-cols-5 gap-1">
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="Overs" 
                              value={scorecardData.team1?.bowling?.[player.id]?.overs ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'bowling', player.id, 'overs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Maidens" 
                              value={scorecardData.team1?.bowling?.[player.id]?.maidens ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'bowling', player.id, 'maidens', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Runs" 
                              value={scorecardData.team1?.bowling?.[player.id]?.runs ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'bowling', player.id, 'runs', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <input 
                              type="number" 
                              placeholder="Wickets" 
                              value={scorecardData.team1?.bowling?.[player.id]?.wickets ?? 0}
                              onChange={(e) => updateScorecardData('team1', 'bowling', player.id, 'wickets', e.target.value)}
                              className="px-2 py-1 border rounded text-xs" 
                            />
                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-center font-medium">
                              {scorecardData.team1?.bowling?.[player.id]?.economy || '0.00'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowScoreEntry(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      console.log('=== SCORECARD SAVE DEBUG ===');
                      console.log('Raw scorecard data:', JSON.stringify(scorecardData, null, 2));
                      console.log('Match data:', scoreEntryMatch);
                      
                      // Validate required data
                      if (!scorecardData || (!scorecardData.team1 && !scorecardData.team2)) {
                        throw new Error('No scorecard data to save');
                      }
                      
                      const updateData = {
                        status: 'completed',
                        tossWinner: scorecardData.tossWinner || null,
                        tossChoice: scorecardData.tossChoice || null,
                        team1Score: {
                          runs: parseInt(scorecardData.team1?.totalRuns) || 0,
                          wickets: parseInt(scorecardData.team1?.wickets) || 0,
                          oversDisplay: scorecardData.team1?.overs || '0.0'
                        },
                        team2Score: {
                          runs: parseInt(scorecardData.team2?.totalRuns) || 0,
                          wickets: parseInt(scorecardData.team2?.wickets) || 0,
                          oversDisplay: scorecardData.team2?.overs || '0.0'
                        },
                        team1Extras: parseInt(scorecardData.team1?.extras) || 0,
                        team2Extras: parseInt(scorecardData.team2?.extras) || 0,
                        result: scorecardData.result || null,
                        winningTeam: scorecardData.winningTeam || null,
                        updatedAt: new Date(),
                        lastUpdatedBy: currentAdmin?.userid || 'admin'
                      };
                      
                      console.log('Basic update data prepared:', updateData);
                      
                      // Process batting stats
                      const battingStats = {};
                      let hasBattingData = false;
                      
                      if (scorecardData.team1?.batting && Object.keys(scorecardData.team1.batting).length > 0) {
                        console.log('Processing team1 batting stats...');
                        battingStats[scoreEntryMatch.team1] = [];
                        
                        Object.entries(scorecardData.team1.batting).forEach(([playerId, stats]) => {
                          const playerData = scoreEntryMatch.team1Players?.find(p => p.id === playerId);
                          if (playerData && (stats.runs > 0 || stats.balls > 0 || stats.dismissalType)) {
                            battingStats[scoreEntryMatch.team1].push({
                              playerId,
                              name: playerData.name,
                              runs: parseInt(stats.runs) || 0,
                              balls: parseInt(stats.balls) || 0,
                              fours: parseInt(stats.fours) || 0,
                              sixes: parseInt(stats.sixes) || 0,
                              dismissalType: stats.dismissalType || null,
                              bowlerName: stats.bowlerName || null,
                              fielderName: stats.fielderName || null,
                              fielder2Name: stats.fielder2Name || null,
                              isOut: !!stats.dismissalType,
                              strikeRate: stats.balls > 0 ? parseFloat(((stats.runs / stats.balls) * 100).toFixed(2)) : 0
                            });
                            hasBattingData = true;
                          }
                        });
                      }
                      
                      if (scorecardData.team2?.batting && Object.keys(scorecardData.team2.batting).length > 0) {
                        console.log('Processing team2 batting stats...');
                        battingStats[scoreEntryMatch.team2] = [];
                        
                        Object.entries(scorecardData.team2.batting).forEach(([playerId, stats]) => {
                          const playerData = scoreEntryMatch.team2Players?.find(p => p.id === playerId);
                          if (playerData && (stats.runs > 0 || stats.balls > 0 || stats.dismissalType)) {
                            battingStats[scoreEntryMatch.team2].push({
                              playerId,
                              name: playerData.name,
                              runs: parseInt(stats.runs) || 0,
                              balls: parseInt(stats.balls) || 0,
                              fours: parseInt(stats.fours) || 0,
                              sixes: parseInt(stats.sixes) || 0,
                              dismissalType: stats.dismissalType || null,
                              bowlerName: stats.bowlerName || null,
                              fielderName: stats.fielderName || null,
                              fielder2Name: stats.fielder2Name || null,
                              isOut: !!stats.dismissalType,
                              strikeRate: stats.balls > 0 ? parseFloat(((stats.runs / stats.balls) * 100).toFixed(2)) : 0
                            });
                            hasBattingData = true;
                          }
                        });
                      }
                      
                      if (hasBattingData) {
                        updateData.battingStats = battingStats;
                        console.log('Batting stats added:', battingStats);
                      }
                      
                      // Process bowling stats
                      const bowlingStats = {};
                      let hasBowlingData = false;
                      
                      if (scorecardData.team1?.bowling && Object.keys(scorecardData.team1.bowling).length > 0) {
                        console.log('Processing team1 bowling stats...');
                        bowlingStats[scoreEntryMatch.team1] = [];
                        
                        Object.entries(scorecardData.team1.bowling).forEach(([playerId, stats]) => {
                          const playerData = scoreEntryMatch.team1Players?.find(p => p.id === playerId);
                          if (playerData && (stats.overs > 0 || stats.runs > 0 || stats.wickets > 0)) {
                            const overs = parseFloat(stats.overs) || 0;
                            const runs = parseInt(stats.runs) || 0;
                            bowlingStats[scoreEntryMatch.team1].push({
                              playerId,
                              name: playerData.name,
                              overs,
                              maidens: parseInt(stats.maidens) || 0,
                              runs,
                              wickets: parseInt(stats.wickets) || 0,
                              economy: overs > 0 ? parseFloat((runs / overs).toFixed(2)) : 0
                            });
                            hasBowlingData = true;
                          }
                        });
                      }
                      
                      if (scorecardData.team2?.bowling && Object.keys(scorecardData.team2.bowling).length > 0) {
                        console.log('Processing team2 bowling stats...');
                        bowlingStats[scoreEntryMatch.team2] = [];
                        
                        Object.entries(scorecardData.team2.bowling).forEach(([playerId, stats]) => {
                          const playerData = scoreEntryMatch.team2Players?.find(p => p.id === playerId);
                          if (playerData && (stats.overs > 0 || stats.runs > 0 || stats.wickets > 0)) {
                            const overs = parseFloat(stats.overs) || 0;
                            const runs = parseInt(stats.runs) || 0;
                            bowlingStats[scoreEntryMatch.team2].push({
                              playerId,
                              name: playerData.name,
                              overs,
                              maidens: parseInt(stats.maidens) || 0,
                              runs,
                              wickets: parseInt(stats.wickets) || 0,
                              economy: overs > 0 ? parseFloat((runs / overs).toFixed(2)) : 0
                            });
                            hasBowlingData = true;
                          }
                        });
                      }
                      
                      if (hasBowlingData) {
                        updateData.bowlingStats = bowlingStats;
                        console.log('Bowling stats added:', bowlingStats);
                      }
                      
                      console.log('=== FINAL UPDATE DATA ===');
                      console.log(JSON.stringify(updateData, null, 2));
                      console.log('Updating match ID:', scoreEntryMatch.id);
                      
                      // Perform the update
                      await updateDoc(doc(db, 'matches', scoreEntryMatch.id), updateData);
                      
                      console.log('✅ Firebase update completed successfully');
                      
                      // Trigger complete data sync to update all statistics
                      await dataSync.syncAllData();
                      
                      setShowScoreEntry(false);
                      await fetchMatches(); // Refresh matches
                      alert('✅ Scorecard saved successfully! All statistics have been updated.');
                      
                    } catch (error) {
                      console.error('❌ Error saving scorecard:', error);
                      console.error('Error details:', {
                        message: error.message,
                        code: error.code,
                        stack: error.stack
                      });
                      alert('❌ Error saving scorecard: ' + error.message + '\n\nCheck browser console for detailed error information.');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Complete Scorecard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;