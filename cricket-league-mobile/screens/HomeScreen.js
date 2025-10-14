import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [upcomingSnapshot, recentSnapshot, standingsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('status', '==', 'upcoming'), orderBy('date', 'asc'), limit(3))),
        getDocs(query(collection(db, 'matches'), where('status', '==', 'completed'), orderBy('date', 'desc'), limit(3))),
        getDocs(collection(db, 'standings'))
      ]);

      setUpcomingMatches(upcomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRecentMatches(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStandings(standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.points - a.points).slice(0, 5));
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const FeatureCard = ({ icon, title, description, onPress }) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <Ionicons name={icon} size={32} color="#e90052" />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Khajjidoni Premier League</Text>
        <Text style={styles.heroSubtitle}>The Ultimate Cricket Experience</Text>
        <TouchableOpacity 
          style={styles.heroButton}
          onPress={() => navigation.navigate('PlayerRegistration')}
        >
          <Text style={styles.heroButtonText}>Register Now</Text>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="trophy-outline"
            title="Live Scores"
            description="Real-time match updates"
            onPress={() => navigation.navigate('Schedule')}
          />
          <FeatureCard
            icon="calendar-outline"
            title="Fixtures"
            description="Complete schedule"
            onPress={() => navigation.navigate('Schedule')}
          />
          <FeatureCard
            icon="people-outline"
            title="Teams"
            description="Team profiles"
            onPress={() => navigation.navigate('Teams')}
          />
          <FeatureCard
            icon="stats-chart-outline"
            title="Points Table"
            description="League standings"
            onPress={() => navigation.navigate('Table')}
          />
        </View>
      </View>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Matches</Text>
          {upcomingMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.matchTeams}>
                <Text style={styles.teamName}>{match.team1}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamName}>{match.team2}</Text>
              </View>
              <Text style={styles.matchDate}>{new Date(match.date?.toDate()).toLocaleDateString()}</Text>
              <Text style={styles.matchVenue}>{match.venue}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          {recentMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.matchTeams}>
                <Text style={styles.teamName}>{match.team1}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamName}>{match.team2}</Text>
              </View>
              <Text style={styles.matchResult}>{match.result}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Top Teams */}
      {standings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Teams</Text>
          {standings.map((team, index) => (
            <View key={team.id} style={styles.standingRow}>
              <Text style={styles.position}>{index + 1}</Text>
              <Text style={styles.teamName}>{team.team}</Text>
              <Text style={styles.points}>{team.points} pts</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hero: {
    backgroundColor: '#37003c',
    padding: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: '#e90052',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#37003c',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: (width - 50) / 2,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#37003c',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
    flex: 1,
    textAlign: 'center',
  },
  vs: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  matchVenue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  matchResult: {
    fontSize: 14,
    color: '#e90052',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  position: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37003c',
    width: 30,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e90052',
    marginLeft: 'auto',
  },
});

export default HomeScreen;