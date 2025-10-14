import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const ScheduleScreen = () => {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const matchesSnapshot = await getDocs(
        query(collection(db, 'matches'), orderBy('date', 'desc'))
      );
      const matchesData = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const getFilteredMatches = () => {
    return matches.filter(match => {
      if (activeTab === 'upcoming') {
        return match.status === 'upcoming';
      } else if (activeTab === 'completed') {
        return match.status === 'completed';
      }
      return true;
    });
  };

  const formatDate = (date) => {
    if (!date) return 'TBA';
    const matchDate = date.toDate ? date.toDate() : new Date(date);
    return matchDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const matchDate = date.toDate ? date.toDate() : new Date(date);
    return matchDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MatchCard = ({ match }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
        <Text style={styles.matchTime}>{formatTime(match.date)}</Text>
      </View>
      
      <View style={styles.teamsContainer}>
        <View style={styles.team}>
          <Text style={styles.teamName}>{match.team1}</Text>
          {match.status === 'completed' && match.team1Score && (
            <Text style={styles.score}>{match.team1Score}</Text>
          )}
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
        </View>
        
        <View style={styles.team}>
          <Text style={styles.teamName}>{match.team2}</Text>
          {match.status === 'completed' && match.team2Score && (
            <Text style={styles.score}>{match.team2Score}</Text>
          )}
        </View>
      </View>

      {match.venue && (
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.venue}>{match.venue}</Text>
        </View>
      )}

      {match.status === 'completed' && match.result && (
        <View style={styles.resultContainer}>
          <Text style={styles.result}>{match.result}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          match.status === 'completed' ? styles.completedBadge : styles.upcomingBadge
        ]}>
          <Text style={[
            styles.statusText,
            match.status === 'completed' ? styles.completedText : styles.upcomingText
          ]}>
            {match.status === 'completed' ? 'Completed' : 'Upcoming'}
          </Text>
        </View>
      </View>
    </View>
  );

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>Match Fixtures & Results</Text>
      </View>

      <View style={styles.tabContainer}>
        <TabButton
          title="Upcoming"
          isActive={activeTab === 'upcoming'}
          onPress={() => setActiveTab('upcoming')}
        />
        <TabButton
          title="Completed"
          isActive={activeTab === 'completed'}
          onPress={() => setActiveTab('completed')}
        />
      </View>

      <ScrollView 
        style={styles.matchesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {getFilteredMatches().map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}

        {getFilteredMatches().length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              No {activeTab} matches found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#37003c',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: -10,
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#37003c',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  matchesList: {
    flex: 1,
    padding: 15,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37003c',
  },
  matchTime: {
    fontSize: 14,
    color: '#666',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
    textAlign: 'center',
    marginBottom: 5,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e90052',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vs: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  venue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  resultContainer: {
    marginBottom: 10,
  },
  result: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e90052',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  completedBadge: {
    backgroundColor: '#e8f5e8',
  },
  upcomingBadge: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    color: '#2e7d32',
  },
  upcomingText: {
    color: '#f57c00',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
  },
});

export default ScheduleScreen;