import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Play, Pause, Square, RotateCcw, Users, Clock, Target, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

const EnhancedLiveScoring = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPreviousMatches, setShowPreviousMatches] = useState(false);
  const [previousMatches, setPreviousMatches] = useState([]);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(0);
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [strikerHand, setStrikerHand] = useState('right');
  const [nonStrikerHand, setNonStrikerHand] = useState('right');
  const [bowlerHand, setBowlerHand] = useState('right');
  const [bowlerType, setBowlerType] = useState('pace');
  const [isFreehit, setIsFreehit] = useState(false);
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('');
  const [battingFirst, setBattingFirst] = useState('');
  const [fieldingFirst, setFieldingFirst] = useState('');
  const [showBowlerChange, setShowBowlerChange] = useState(false);
  const [newBowler, setNewBowler] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showPlayerChange, setShowPlayerChange] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [newBatsman, setNewBatsman] = useState('');
  const [extraType, setExtraType] = useState('');
  const [extraRuns, setExtraRuns] = useState(1);
  const [shortRun, setShortRun] = useState(false);
  const [matchStatus, setMatchStatus] = useState('not_started');
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInningsPlayerSelection, setShowInningsPlayerSelection] = useState(false);
  const [newInningsStriker, setNewInningsStriker] = useState('');
  const [newInningsNonStriker, setNewInningsNonStriker] = useState('');
  const [newInningsBowler, setNewInningsBowler] = useState('');

  // Match state
  const [matchData, setMatchData] = useState({
    team1Score: 0,
    team1Wickets: 0,
    team1Overs: 0,
    team1Balls: 0,
    team2Score: 0,
    team2Wickets: 0,
    team2Overs: 0,
    team2Balls: 0,
    battingTeam: 1,
    bowlingTeam: 2,
    target: 0,
    requiredRate: 0,
    currentRunRate: 0
  });

  // Player stats
  const [playerStats, setPlayerStats] = useState({
    batsmen: {},
    bowlers: {},
    dismissedBatsmen: [] // Track dismissed batsmen
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      // Check if there's already a live match for this match ID
      const checkExistingLiveMatch = async () => {
        try {
          const liveMatchQuery = query(
            collection(db, 'liveMatches'),
            where('matchId', '==', selectedMatch.id)
          );
          const liveMatchSnapshot = await getDocs(liveMatchQuery);
          
          if (!liveMatchSnapshot.empty) {
            const liveMatchDoc = liveMatchSnapshot.docs[0];
            const data = liveMatchDoc.data();
            
            // Restore all the live match state
            setMatchData(data.matchData || matchData);
            setPlayerStats(data.playerStats || playerStats);
            setCommentary(data.commentary || []);
            setCurrentInnings(data.currentInnings || 1);
            setCurrentOver(data.currentOver || 0);
            setCurrentBall(data.currentBall || 0);
            setStriker(data.striker || '');
            setNonStriker(data.nonStriker || '');
            setBowler(data.bowler || '');
            setMatchStatus(data.status || 'not_started');
            setIsFreehit(data.isFreehit || false);
            setTossWinner(data.tossWinner || '');
            setTossDecision(data.tossDecision || '');
            setBattingFirst(data.battingFirst || '');
            setFieldingFirst(data.fieldingFirst || '');
            
            // Set up real-time listener for this live match
            const unsubscribe = onSnapshot(doc(db, 'liveMatches', liveMatchDoc.id), (doc) => {
              if (doc.exists()) {
                const updatedData = doc.data();
                setMatchData(updatedData.matchData || matchData);
                setPlayerStats(updatedData.playerStats || playerStats);
                setCommentary(updatedData.commentary || []);
                setCurrentInnings(updatedData.currentInnings || 1);
                setCurrentOver(updatedData.currentOver || 0);
                setCurrentBall(updatedData.currentBall || 0);
                setStriker(updatedData.striker || '');
                setNonStriker(updatedData.nonStriker || '');
                setBowler(updatedData.bowler || '');
                setMatchStatus(updatedData.status || 'not_started');
                setIsFreehit(updatedData.isFreehit || false);
              }
            });
            return unsubscribe;
          }
        } catch (error) {
          console.error('Error checking existing live match:', error);
        }
      };
      
      checkExistingLiveMatch();
    }
  }, [selectedMatch]);

  const fetchMatches = async () => {
    try {
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const allMatches = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const activeMatches = allMatches.filter(match => match.status === 'upcoming' || match.status === 'live');
      const completedMatches = allMatches.filter(match => match.status === 'completed');
      
      setMatches(activeMatches);
      setPreviousMatches(completedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const startMatch = async () => {
    if (!selectedMatch || !striker || !nonStriker || !bowler || !tossWinner || !tossDecision) {
      alert('Please complete toss details and select all players to start the match');
      return;
    }
    
    if (striker === nonStriker) {
      alert('Error: Striker and Non-striker cannot be the same player');
      return;
    }
    
    if (!battingFirst || !fieldingFirst) {
      alert('Error: Please complete toss decision to determine batting and fielding teams');
      return;
    }

    setLoading(true);
    try {
      const liveMatchData = {
        matchId: selectedMatch.id,
        team1: selectedMatch.team1,
        team2: selectedMatch.team2,
        team1Players: selectedMatch.team1Players || [],
        team2Players: selectedMatch.team2Players || [],
        overs: selectedMatch.overs || 20,
        venue: selectedMatch.venue,
        date: selectedMatch.date,
        matchData,
        playerStats,
        commentary: [],
        currentInnings: 1,
        currentOver: 0,
        currentBall: 0,
        striker,
        nonStriker,
        bowler,
        strikerHand,
        nonStrikerHand,
        bowlerHand,
        bowlerType,
        tossWinner,
        tossDecision,
        battingFirst,
        fieldingFirst,
        isFreehit: false,
        status: 'live',
        startedAt: new Date(),
        lastUpdated: new Date()
      };

      const liveMatchRef = await addDoc(collection(db, 'liveMatches'), liveMatchData);
      await updateDoc(doc(db, 'matches', selectedMatch.id), { 
        status: 'live',
        liveMatchId: liveMatchRef.id
      });
      
      setMatchStatus('live');
      addCommentary(`Match started! ${striker} and ${nonStriker} are at the crease. ${bowler} to bowl.`, false);
      alert('Match started successfully!');
    } catch (error) {
      console.error('Error starting match:', error);
      alert('Error starting match');
    }
    setLoading(false);
  };

  const addCommentary = (text, isBall = true) => {
    const newComment = {
      id: Date.now(),
      text,
      over: isBall ? currentOver : null,
      ball: isBall ? currentBall : null,
      timestamp: new Date(),
      isBall
    };
    setCommentary(prev => [newComment, ...prev]);
  };

  const updateMatchData = async (updates) => {
    if (!selectedMatch) return;
    
    try {
      const liveMatchQuery = query(
        collection(db, 'liveMatches'),
        where('matchId', '==', selectedMatch.id)
      );
      const liveMatchSnapshot = await getDocs(liveMatchQuery);
      
      if (!liveMatchSnapshot.empty) {
        const liveMatchDoc = liveMatchSnapshot.docs[0];
        const updateData = {
          ...updates,
          lastUpdated: new Date()
        };
        
        // Ensure commentary is properly formatted
        if (updates.commentary) {
          updateData.commentary = updates.commentary.map(comment => ({
            ...comment,
            timestamp: comment.timestamp || new Date()
          }));
        }
        
        await updateDoc(doc(db, 'liveMatches', liveMatchDoc.id), updateData);
      }
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const handleScore = async (runs) => {
    if (matchStatus !== 'live' || showBowlerChange) return;

    const newMatchData = { ...matchData };
    const battingTeam = currentInnings === 1 ? 'team1' : 'team2';
    
    // Update team score
    newMatchData[`${battingTeam}Score`] += runs;
    
    // Update ball count and over logic
    let newCurrentBall = currentBall;
    let newCurrentOver = currentOver;
    let newStriker = striker;
    let newNonStriker = nonStriker;
    
    if (!isFreehit) {
      newCurrentBall++;
      if (newCurrentBall === 6) {
        // Over completed
        newCurrentOver++;
        newCurrentBall = 0;
        newMatchData[`${battingTeam}Overs`] = newCurrentOver;
        newMatchData[`${battingTeam}Balls`] = 0;
        // Swap batsmen at end of over
        newStriker = nonStriker;
        newNonStriker = striker;
        setShowBowlerChange(true);
        addCommentary(`End of over ${newCurrentOver}. ${newStriker} on strike. Bowler change required.`, false);
      } else {
        newMatchData[`${battingTeam}Balls`] = newCurrentBall;
      }
    }
    
    // Swap batsmen on odd runs (but not at end of over)
    if (runs % 2 === 1 && newCurrentBall !== 0) {
      const temp = newStriker;
      newStriker = newNonStriker;
      newNonStriker = temp;
    }
    
    // Update state
    setCurrentBall(newCurrentBall);
    setCurrentOver(newCurrentOver);
    setStriker(newStriker);
    setNonStriker(newNonStriker);

    // Update batsman stats
    const newPlayerStats = { ...playerStats };
    if (!newPlayerStats.batsmen[striker]) {
      newPlayerStats.batsmen[striker] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }
    newPlayerStats.batsmen[striker].runs += runs;
    if (!isFreehit) {
      newPlayerStats.batsmen[striker].balls++;
    }
    if (runs === 4) newPlayerStats.batsmen[striker].fours++;
    if (runs === 6) newPlayerStats.batsmen[striker].sixes++;
    newPlayerStats.batsmen[striker].strikeRate = 
      newPlayerStats.batsmen[striker].balls > 0 ? (newPlayerStats.batsmen[striker].runs / newPlayerStats.batsmen[striker].balls * 100).toFixed(2) : 0;

    // Update bowler stats
    if (!newPlayerStats.bowlers[bowler]) {
      newPlayerStats.bowlers[bowler] = { overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0 };
    }
    newPlayerStats.bowlers[bowler].runs += runs;
    if (!isFreehit) {
      newPlayerStats.bowlers[bowler].balls++;
      if (newPlayerStats.bowlers[bowler].balls === 6) {
        newPlayerStats.bowlers[bowler].overs++;
        newPlayerStats.bowlers[bowler].balls = 0;
      }
    }
    
    // Calculate bowler economy
    const bowlerTotalBalls = newPlayerStats.bowlers[bowler].overs * 6 + newPlayerStats.bowlers[bowler].balls;
    newPlayerStats.bowlers[bowler].economy = bowlerTotalBalls > 0 ? (newPlayerStats.bowlers[bowler].runs / bowlerTotalBalls * 6).toFixed(2) : 0;

    // Calculate rates
    const totalBalls = newMatchData[`${battingTeam}Overs`] * 6 + newMatchData[`${battingTeam}Balls`];
    newMatchData.currentRunRate = totalBalls > 0 ? (newMatchData[`${battingTeam}Score`] / totalBalls * 6).toFixed(2) : 0;
    
    // Check for innings end conditions
    const maxBalls = selectedMatch.overs * 6;
    const battingTeamPlayers = getBattingTeamPlayers();
    const maxWickets = Math.max(1, battingTeamPlayers.length - 1); // Need at least 1 batsman remaining
    
    if (totalBalls >= maxBalls || newMatchData[`${battingTeam}Wickets`] >= maxWickets) {
      setMatchData(newMatchData);
      setPlayerStats(newPlayerStats);
      setIsFreehit(false);
      
      await updateMatchData({
        matchData: newMatchData,
        playerStats: newPlayerStats,
        commentary,
        currentOver: newCurrentOver,
        currentBall: newCurrentBall,
        isFreehit: false
      });
      
      endInnings();
      return;
    }
    
    if (currentInnings === 2) {
      const remainingBalls = (selectedMatch.overs * 6) - totalBalls;
      const remainingRuns = newMatchData.target - newMatchData[`${battingTeam}Score`];
      newMatchData.requiredRate = remainingBalls > 0 ? (remainingRuns / remainingBalls * 6).toFixed(2) : 0;
    }

    setMatchData(newMatchData);
    setPlayerStats(newPlayerStats);
    setIsFreehit(false);
    
    addCommentary(`${runs} run${runs !== 1 ? 's' : ''} scored by ${striker}`);
    
    await updateMatchData({
      matchData: newMatchData,
      playerStats: newPlayerStats,
      commentary,
      currentOver: newCurrentOver,
      currentBall: newCurrentBall,
      striker: newStriker,
      nonStriker: newNonStriker,
      isFreehit: false
    });
  };

  const handleWicket = async () => {
    if (matchStatus !== 'live' || !wicketType || showBowlerChange) return;

    const newMatchData = { ...matchData };
    const battingTeam = currentInnings === 1 ? 'team1' : 'team2';
    
    newMatchData[`${battingTeam}Wickets`]++;
    
    // Update ball count
    let newCurrentBall = currentBall;
    let newCurrentOver = currentOver;
    
    if (!isFreehit) {
      newCurrentBall++;
      if (newCurrentBall === 6) {
        newCurrentOver++;
        newCurrentBall = 0;
        newMatchData[`${battingTeam}Overs`] = newCurrentOver;
        newMatchData[`${battingTeam}Balls`] = 0;
        setShowBowlerChange(true);
      } else {
        newMatchData[`${battingTeam}Balls`] = newCurrentBall;
      }
    }
    
    setCurrentBall(newCurrentBall);
    setCurrentOver(newCurrentOver);
    
    // Check for all out or innings end
    const battingTeamPlayers = getBattingTeamPlayers();
    const maxWickets = Math.max(1, battingTeamPlayers.length - 1);
    
    if (newMatchData[`${battingTeam}Wickets`] >= maxWickets) {
      setMatchData(newMatchData);
      setPlayerStats(updatedPlayerStats);
      setIsFreehit(false);
      
      await updateMatchData({
        matchData: newMatchData,
        playerStats: updatedPlayerStats,
        commentary,
        currentOver: newCurrentOver,
        currentBall: newCurrentBall,
        isFreehit: false
      });
      
      endInnings();
      return;
    }

    // Update bowler stats
    const newPlayerStats = { ...playerStats };
    if (!newPlayerStats.bowlers[bowler]) {
      newPlayerStats.bowlers[bowler] = { overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0 };
    }
    newPlayerStats.bowlers[bowler].wickets++;
    if (!isFreehit) {
      newPlayerStats.bowlers[bowler].balls++;
      if (newPlayerStats.bowlers[bowler].balls === 6) {
        newPlayerStats.bowlers[bowler].overs++;
        newPlayerStats.bowlers[bowler].balls = 0;
      }
    }

    let commentaryText = `WICKET! ${striker} is out`;
    if (wicketType === 'caught' && fielder) {
      commentaryText += ` caught by ${fielder}`;
    } else if (wicketType === 'runout' && fielder) {
      commentaryText += ` run out by ${fielder}`;
    } else if (wicketType === 'stumped' && fielder) {
      commentaryText += ` stumped by ${fielder}`;
    }
    commentaryText += ` (${wicketType})`;

    // Add dismissed batsman to the list
    const updatedPlayerStats = {
      ...newPlayerStats,
      dismissedBatsmen: [...(newPlayerStats.dismissedBatsmen || []), striker]
    };

    setMatchData(newMatchData);
    setPlayerStats(updatedPlayerStats);
    setIsFreehit(false);
    addCommentary(commentaryText);
    
    // Reset wicket form
    setShowWicket(false);
    setWicketType('');
    setFielder('');
    
    // Show new batsman selection if not all out
    if (newMatchData[`${battingTeam}Wickets`] < maxWickets) {
      setShowPlayerChange(true);
    }
    
    await updateMatchData({
      matchData: newMatchData,
      playerStats: updatedPlayerStats,
      commentary,
      currentOver: newCurrentOver,
      currentBall: newCurrentBall,
      isFreehit: false
    });
  };

  const handleExtra = async () => {
    if (matchStatus !== 'live' || !extraType || showBowlerChange) return;

    const newMatchData = { ...matchData };
    const battingTeam = currentInnings === 1 ? 'team1' : 'team2';
    
    newMatchData[`${battingTeam}Score`] += extraRuns;

    // Handle different extra types
    if (extraType === 'wide' || extraType === 'noball') {
      // Don't increment ball count for wides and no-balls
      if (extraType === 'noball') {
        setIsFreehit(true);
        addCommentary(`No Ball! Free hit coming up. ${extraRuns} extra run${extraRuns !== 1 ? 's' : ''}`);
      } else {
        addCommentary(`Wide ball! ${extraRuns} extra run${extraRuns !== 1 ? 's' : ''}`);
      }
    } else {
      // Bye, leg-bye - increment ball count
      let newCurrentBall = currentBall + 1;
      let newCurrentOver = currentOver;
      
      if (newCurrentBall === 6) {
        // Over completed
        newCurrentOver++;
        newCurrentBall = 0;
        newMatchData[`${battingTeam}Overs`] = newCurrentOver;
        newMatchData[`${battingTeam}Balls`] = 0;
        // Swap batsmen at end of over
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
        setShowBowlerChange(true);
        addCommentary(`End of over ${newCurrentOver}. ${nonStriker} on strike. Bowler change required.`, false);
      } else {
        newMatchData[`${battingTeam}Balls`] = newCurrentBall;
      }
      
      setCurrentBall(newCurrentBall);
      setCurrentOver(newCurrentOver);
      addCommentary(`${extraType}! ${extraRuns} extra run${extraRuns !== 1 ? 's' : ''}`);
    }

    // Update bowler stats for wides and no-balls
    const newPlayerStats = { ...playerStats };
    if (extraType === 'wide' || extraType === 'noball') {
      if (!newPlayerStats.bowlers[bowler]) {
        newPlayerStats.bowlers[bowler] = { overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0 };
      }
      newPlayerStats.bowlers[bowler].runs += extraRuns;
      
      // Calculate bowler economy
      const bowlerTotalBalls = newPlayerStats.bowlers[bowler].overs * 6 + newPlayerStats.bowlers[bowler].balls;
      newPlayerStats.bowlers[bowler].economy = bowlerTotalBalls > 0 ? (newPlayerStats.bowlers[bowler].runs / bowlerTotalBalls * 6).toFixed(2) : 0;
    }

    // Calculate rates
    const totalBalls = newMatchData[`${battingTeam}Overs`] * 6 + newMatchData[`${battingTeam}Balls`];
    newMatchData.currentRunRate = totalBalls > 0 ? (newMatchData[`${battingTeam}Score`] / totalBalls * 6).toFixed(2) : 0;
    
    if (currentInnings === 2) {
      const remainingBalls = (selectedMatch.overs * 6) - totalBalls;
      const remainingRuns = newMatchData.target - newMatchData[`${battingTeam}Score`];
      newMatchData.requiredRate = remainingBalls > 0 ? (remainingRuns / remainingBalls * 6).toFixed(2) : 0;
    }

    setMatchData(newMatchData);
    setPlayerStats(newPlayerStats);
    setShowExtras(false);
    setExtraType('');
    setExtraRuns(1);

    const updatedCommentary = [...commentary];
    if (updatedCommentary.length > 0) {
      updatedCommentary[0] = {
        ...updatedCommentary[0],
        over: currentOver,
        ball: currentBall
      };
    }
    
    await updateMatchData({
      matchData: newMatchData,
      playerStats: newPlayerStats,
      commentary: updatedCommentary,
      isFreehit,
      currentOver,
      currentBall
    });
  };

  const handlePlayerChange = async () => {
    if (!newBatsman) return;
    
    // Initialize stats for new batsman
    const newPlayerStats = { ...playerStats };
    if (!newPlayerStats.batsmen[newBatsman]) {
      newPlayerStats.batsmen[newBatsman] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }
    
    setStriker(newBatsman);
    setPlayerStats(newPlayerStats);
    setShowPlayerChange(false);
    setNewBatsman('');
    addCommentary(`${newBatsman} comes to the crease`, false);
    
    await updateMatchData({
      striker: newBatsman,
      playerStats: newPlayerStats,
      commentary
    });
  };

  const handleBowlerChange = async () => {
    if (!newBowler) return;
    
    setBowler(newBowler);
    setShowBowlerChange(false);
    setNewBowler('');
    addCommentary(`${newBowler} comes on to bowl`, false);
    
    await updateMatchData({
      bowler: newBowler,
      bowlerHand,
      bowlerType,
      commentary
    });
  };

  const swapBatsmen = async () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
    addCommentary('Batsmen have crossed over', false);
    
    await updateMatchData({
      striker: nonStriker,
      nonStriker: temp,
      commentary
    });
  };

  const endInnings = async () => {
    if (currentInnings === 1) {
      const target = matchData.team1Score + 1;
      const newMatchData = { ...matchData, target };
      
      setMatchData(newMatchData);
      setCurrentInnings(2);
      setCurrentOver(0);
      setCurrentBall(0);
      
      // Switch teams for second innings
      const newBattingFirst = fieldingFirst;
      const newFieldingFirst = battingFirst;
      setBattingFirst(newBattingFirst);
      setFieldingFirst(newFieldingFirst);
      
      addCommentary(`End of first innings. ${battingFirst}: ${matchData.team1Score}/${matchData.team1Wickets}. Target: ${target} runs`, false);
      addCommentary(`Second innings begins. ${newBattingFirst} needs ${target} runs to win.`, false);
      
      // Show player selection for second innings
      setShowInningsPlayerSelection(true);
      setNewInningsStriker('');
      setNewInningsNonStriker('');
      setNewInningsBowler('');
      
      await updateMatchData({
        matchData: newMatchData,
        currentInnings: 2,
        currentOver: 0,
        currentBall: 0,
        battingFirst: newBattingFirst,
        fieldingFirst: newFieldingFirst,
        commentary
      });
    } else {
      // Match finished
      setMatchStatus('completed');
      addCommentary('Match completed!', false);
      
      await updateMatchData({
        status: 'completed',
        commentary,
        completedAt: new Date()
      });
    }
  };

  const getBattingTeamPlayers = () => {
    if (!selectedMatch) return [];
    if (!battingFirst) return [];
    return battingFirst === selectedMatch.team1 ? selectedMatch.team1Players || [] : selectedMatch.team2Players || [];
  };

  const getBowlingTeamPlayers = () => {
    if (!selectedMatch) return [];
    if (!fieldingFirst) return [];
    return fieldingFirst === selectedMatch.team1 ? selectedMatch.team1Players || [] : selectedMatch.team2Players || [];
  };

  const handleInningsPlayerSelection = async () => {
    if (!newInningsStriker || !newInningsNonStriker || !newInningsBowler) {
      alert('Please select all players to continue');
      return;
    }
    
    if (newInningsStriker === newInningsNonStriker) {
      alert('Striker and Non-striker cannot be the same player');
      return;
    }
    
    // Initialize stats for new batsmen
    const newPlayerStats = { ...playerStats };
    if (!newPlayerStats.batsmen[newInningsStriker]) {
      newPlayerStats.batsmen[newInningsStriker] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }
    if (!newPlayerStats.batsmen[newInningsNonStriker]) {
      newPlayerStats.batsmen[newInningsNonStriker] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }
    
    setStriker(newInningsStriker);
    setNonStriker(newInningsNonStriker);
    setBowler(newInningsBowler);
    setPlayerStats(newPlayerStats);
    setShowInningsPlayerSelection(false);
    
    addCommentary(`${newInningsStriker} and ${newInningsNonStriker} come out to bat. ${newInningsBowler} to bowl.`, false);
    
    await updateMatchData({
      striker: newInningsStriker,
      nonStriker: newInningsNonStriker,
      bowler: newInningsBowler,
      playerStats: newPlayerStats,
      commentary
    });
  };

  const deleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete from matches collection
      await deleteDoc(doc(db, 'matches', matchId));
      
      // Delete from liveMatches if exists
      const liveMatchQuery = query(
        collection(db, 'liveMatches'),
        where('matchId', '==', matchId)
      );
      const liveMatchSnapshot = await getDocs(liveMatchQuery);
      
      if (!liveMatchSnapshot.empty) {
        const liveMatchDoc = liveMatchSnapshot.docs[0];
        await deleteDoc(doc(db, 'liveMatches', liveMatchDoc.id));
      }
      
      // Refresh matches list
      fetchMatches();
      
      // If current match was deleted, reset selection
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch(null);
      }
      
      alert('Match deleted successfully');
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Error deleting match');
    }
  };

  if (!selectedMatch) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Match to Score</h3>
          <button
            onClick={() => setShowPreviousMatches(!showPreviousMatches)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            {showPreviousMatches ? 'Show Active' : 'Show Previous'}
          </button>
        </div>
        
        <div className="space-y-2">
          {(showPreviousMatches ? previousMatches : matches).map(match => (
            <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border">
              <button
                onClick={() => setSelectedMatch(match)}
                className="flex-1 text-left"
              >
                <div className="font-semibold">{match.team1} vs {match.team2}</div>
                <div className="text-sm text-gray-600">{match.date} • {match.venue}</div>
                <div className="text-xs text-gray-500">{match.overs} overs • {match.status}</div>
              </button>
              <button
                onClick={() => deleteMatch(match.id)}
                className="ml-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        
        {(showPreviousMatches ? previousMatches : matches).length === 0 && (
          <p className="text-gray-500 text-center py-4">
            {showPreviousMatches ? 'No previous matches found' : 'No matches available for scoring'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-cricket-navy to-cricket-blue text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">{selectedMatch.team1} vs {selectedMatch.team2}</h3>
          <div className="flex items-center space-x-2">
            {matchStatus === 'live' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs">LIVE</span>
              </div>
            )}
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{matchStatus.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-sm opacity-90">
          {selectedMatch.venue} • {selectedMatch.overs} overs
        </div>
      </div>

      {/* Score Display */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${currentInnings === 1 ? 'bg-green-100 border-2 border-green-500' : 'bg-white'}`}>
            <div className="font-semibold text-sm">{selectedMatch.team1}</div>
            <div className="text-xl font-bold">{matchData.team1Score}/{matchData.team1Wickets}</div>
            <div className="text-xs text-gray-600">{matchData.team1Overs}.{matchData.team1Balls} overs</div>
          </div>
          <div className={`p-3 rounded-lg ${currentInnings === 2 ? 'bg-green-100 border-2 border-green-500' : 'bg-white'}`}>
            <div className="font-semibold text-sm">{selectedMatch.team2}</div>
            <div className="text-xl font-bold">{matchData.team2Score}/{matchData.team2Wickets}</div>
            <div className="text-xs text-gray-600">{matchData.team2Overs}.{matchData.team2Balls} overs</div>
          </div>
        </div>
        
        {currentInnings === 2 && matchData.target > 0 && (
          <div className="bg-blue-100 p-3 rounded-lg mb-4">
            <div className="text-sm font-semibold text-blue-900">
              Target: {matchData.target} | Need: {matchData.target - (currentInnings === 2 ? matchData.team2Score : matchData.team1Score)}
            </div>
            <div className="text-xs text-blue-700">
              CRR: {matchData.currentRunRate} | RRR: {matchData.requiredRate}
            </div>
          </div>
        )}
      </div>

      {/* Toss and Player Selection (Before Match Start) */}
      {matchStatus === 'not_started' && (
        <div className="p-4 space-y-4">
          {/* Toss Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-900">Toss Details</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Toss Winner</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setTossWinner(selectedMatch.team1);
                      setTossDecision('');
                      setBattingFirst('');
                      setFieldingFirst('');
                    }}
                    className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                      tossWinner === selectedMatch.team1
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {selectedMatch.team1}
                  </button>
                  <button
                    onClick={() => {
                      setTossWinner(selectedMatch.team2);
                      setTossDecision('');
                      setBattingFirst('');
                      setFieldingFirst('');
                    }}
                    className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                      tossWinner === selectedMatch.team2
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {selectedMatch.team2}
                  </button>
                </div>
              </div>
              
              {tossWinner && (
                <div>
                  <label className="block text-sm font-medium mb-2">Toss Decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setTossDecision('bat');
                        setBattingFirst(tossWinner);
                        setFieldingFirst(tossWinner === selectedMatch.team1 ? selectedMatch.team2 : selectedMatch.team1);
                      }}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        tossDecision === 'bat'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      🏏 Chose to Bat
                    </button>
                    <button
                      onClick={() => {
                        setTossDecision('field');
                        setFieldingFirst(tossWinner);
                        setBattingFirst(tossWinner === selectedMatch.team1 ? selectedMatch.team2 : selectedMatch.team1);
                      }}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        tossDecision === 'field'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      ⚾ Chose to Field
                    </button>
                  </div>
                </div>
              )}
              
              {battingFirst && fieldingFirst && (
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm">
                    <div className="font-semibold text-green-700">🏏 Batting First: {battingFirst}</div>
                    <div className="font-semibold text-blue-700">⚾ Fielding First: {fieldingFirst}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Striker (from {battingFirst || 'batting team'})</label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {getBattingTeamPlayers().map(player => (
                <button
                  key={player.id}
                  onClick={() => setStriker(player.name)}
                  className={`p-2 text-left rounded border transition-all ${
                    striker === player.name
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {player.name} ({player.position})
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Non-Striker (from {battingFirst || 'batting team'})</label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {getBattingTeamPlayers().map(player => (
                <button
                  key={player.id}
                  onClick={() => setNonStriker(player.name)}
                  className={`p-2 text-left rounded border transition-all ${
                    nonStriker === player.name
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {player.name} ({player.position})
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Bowler (from {fieldingFirst || 'fielding team'})</label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {fieldingFirst && getBowlingTeamPlayers().map(player => (
                <button
                  key={player.id}
                  onClick={() => setBowler(player.name)}
                  className={`p-2 text-left rounded border transition-all ${
                    bowler === player.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {player.name} ({player.position})
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={startMatch}
            disabled={loading || !striker || !nonStriker || !bowler || !tossWinner || !tossDecision}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
          >
            <Play size={20} />
            <span>{loading ? 'Starting...' : 'Start Match'}</span>
          </button>
        </div>
      )}

      {/* Scoring Buttons */}
      {matchStatus === 'live' && (
        <div className="p-4">
          {/* Current Players */}
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold">Striker</div>
                <div className="font-medium">{striker}</div>
                <div className="text-green-600 font-semibold">{playerStats.batsmen[striker]?.runs || 0}* ({playerStats.batsmen[striker]?.balls || 0})</div>
              </div>
              <div>
                <div className="font-semibold">Non-Striker</div>
                <div className="font-medium">{nonStriker}</div>
                <div className="text-green-600 font-semibold">{playerStats.batsmen[nonStriker]?.runs || 0} ({playerStats.batsmen[nonStriker]?.balls || 0})</div>
              </div>
              <div>
                <div className="font-semibold">Bowler</div>
                <div className="font-medium">{bowler}</div>
                <div className="text-blue-600 font-semibold">{playerStats.bowlers[bowler]?.overs || 0}.{playerStats.bowlers[bowler]?.balls || 0}-{playerStats.bowlers[bowler]?.runs || 0}-{playerStats.bowlers[bowler]?.wickets || 0}</div>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="font-semibold">Over {currentOver}.{currentBall}</span>
              {isFreehit && <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">FREE HIT</span>}
            </div>
          </div>
          
          {/* Main Scoring */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0, 1, 2, 3, 4, 6].map(runs => (
              <button
                key={runs}
                onClick={() => handleScore(runs)}
                disabled={showBowlerChange}
                className={`p-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  runs === 0 ? 'bg-gray-200 hover:bg-gray-300' :
                  runs === 4 ? 'bg-green-500 hover:bg-green-600 text-white' :
                  runs === 6 ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {runs}
              </button>
            ))}
            <button
              onClick={() => setShowWicket(true)}
              disabled={showBowlerChange}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              W
            </button>
            <button
              onClick={() => setShowExtras(true)}
              disabled={showBowlerChange}
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Extras
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={swapBatsmen}
              className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg text-sm flex items-center justify-center space-x-1"
            >
              <RefreshCw size={16} />
              <span>Swap</span>
            </button>
            <button
              onClick={() => setShowBowlerChange(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg text-sm"
            >
              Change Bowler
            </button>
          </div>
          
          {/* Manual Control Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={endInnings}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg text-sm font-semibold"
            >
              End Innings
            </button>
            <button
              onClick={() => {
                setMatchStatus('completed');
                addCommentary('Match ended manually by scorer', false);
                updateMatchData({
                  status: 'completed',
                  commentary,
                  completedAt: new Date()
                });
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-semibold"
            >
              End Match
            </button>
          </div>
          
          {/* Navigation */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedMatch(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg text-sm"
            >
              Back
            </button>
            <button
              onClick={() => deleteMatch(selectedMatch.id)}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h4 className="font-semibold mb-4">Record Wicket</h4>
            <div className="space-y-3">
              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Wicket Type</option>
                <option value="bowled">Bowled</option>
                <option value="caught">Caught</option>
                <option value="lbw">LBW</option>
                <option value="runout">Run Out</option>
                <option value="stumped">Stumped</option>
                <option value="hitwicket">Hit Wicket</option>
              </select>
              
              {(wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') && (
                <select
                  value={fielder}
                  onChange={(e) => setFielder(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Fielder</option>
                  {getBowlingTeamPlayers().map(player => (
                    <option key={player.id} value={player.name}>{player.name}</option>
                  ))}
                </select>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleWicket}
                  disabled={!wicketType}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-2 rounded-lg"
                >
                  Record Wicket
                </button>
                <button
                  onClick={() => setShowWicket(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extras Modal */}
      {showExtras && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h4 className="font-semibold mb-4">Record Extra</h4>
            <div className="space-y-3">
              <select
                value={extraType}
                onChange={(e) => setExtraType(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Extra Type</option>
                <option value="wide">Wide</option>
                <option value="noball">No Ball</option>
                <option value="bye">Bye</option>
                <option value="legbye">Leg Bye</option>
              </select>
              
              <input
                type="number"
                min="1"
                max="6"
                value={extraRuns}
                onChange={(e) => setExtraRuns(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
                placeholder="Extra runs"
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handleExtra}
                  disabled={!extraType}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white p-2 rounded-lg"
                >
                  Record Extra
                </button>
                <button
                  onClick={() => setShowExtras(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Change Modal */}
      {showPlayerChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h4 className="font-semibold mb-4">New Batsman</h4>
            <div className="space-y-3">
              <select
                value={newBatsman}
                onChange={(e) => setNewBatsman(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select New Batsman</option>
                {getBattingTeamPlayers()
                  .filter(player => 
                    player.name !== striker && 
                    player.name !== nonStriker && 
                    !playerStats.dismissedBatsmen?.includes(player.name)
                  )
                  .map(player => (
                    <option key={player.id} value={player.name}>{player.name} ({player.position})</option>
                  ))}
              </select>
              
              <div className="flex space-x-2">
                <button
                  onClick={handlePlayerChange}
                  disabled={!newBatsman}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2 rounded-lg"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowPlayerChange(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Change Modal */}
      {showBowlerChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h4 className="font-semibold mb-4">Change Bowler</h4>
            <div className="space-y-3">
              <select
                value={newBowler}
                onChange={(e) => setNewBowler(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select New Bowler</option>
                {getBowlingTeamPlayers()
                  .filter(player => player.name !== bowler)
                  .map(player => (
                    <option key={player.id} value={player.name}>{player.name} ({player.position})</option>
                  ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select
                  value={bowlerHand}
                  onChange={(e) => setBowlerHand(e.target.value)}
                  className="p-2 border rounded-lg"
                >
                  <option value="right">Right Arm</option>
                  <option value="left">Left Arm</option>
                </select>
                <select
                  value={bowlerType}
                  onChange={(e) => setBowlerType(e.target.value)}
                  className="p-2 border rounded-lg"
                >
                  <option value="pace">Pace</option>
                  <option value="spin">Spin</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleBowlerChange}
                  disabled={!newBowler}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg"
                >
                  Change Bowler
                </button>
                <button
                  onClick={() => setShowBowlerChange(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                >
                  Continue Same Bowler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Innings Player Selection Modal */}
      {showInningsPlayerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h4 className="font-semibold mb-4">Select Players for Innings {currentInnings}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Striker (from {battingFirst})</label>
                <select
                  value={newInningsStriker}
                  onChange={(e) => setNewInningsStriker(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Striker</option>
                  {getBattingTeamPlayers().map(player => (
                    <option key={player.id} value={player.name}>{player.name} ({player.position})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Non-Striker (from {battingFirst})</label>
                <select
                  value={newInningsNonStriker}
                  onChange={(e) => setNewInningsNonStriker(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Non-Striker</option>
                  {getBattingTeamPlayers().map(player => (
                    <option key={player.id} value={player.name}>{player.name} ({player.position})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Bowler (from {fieldingFirst})</label>
                <select
                  value={newInningsBowler}
                  onChange={(e) => setNewInningsBowler(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Bowler</option>
                  {getBowlingTeamPlayers().map(player => (
                    <option key={player.id} value={player.name}>{player.name} ({player.position})</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleInningsPlayerSelection}
                disabled={!newInningsStriker || !newInningsNonStriker || !newInningsBowler}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-3 rounded-lg font-semibold"
              >
                Start Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commentary */}
      {commentary.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="font-semibold mb-2 text-sm">Commentary</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {commentary.slice(0, 5).map((comment) => (
              <div key={comment.id} className="text-xs text-gray-600">
                {comment.isBall && comment.over !== null && comment.ball !== null ? (
                  <span className="font-semibold">{comment.over}.{comment.ball}: </span>
                ) : null}
                <span>{comment.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLiveScoring;