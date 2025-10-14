import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const TeamsScreen = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  const TeamCard = ({ team }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamLogo}>
          {team.logo ? (
            <Image source={{ uri: team.logo }} style={styles.logoImage} />
          ) : (
            <Ionicons name="shield-outline" size={40} color="#37003c" />
          )}
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamLocation}>{team.location || 'Location TBA'}</Text>
        </View>
      </View>
      
      <View style={styles.teamStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{team.matchesPlayed || 0}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{team.wins || 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{team.losses || 0}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{team.points || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {team.captain && (
        <View style={styles.captainInfo}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.captainText}>Captain: {team.captain}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.subtitle}>Cricket League Teams</Text>
      </View>

      <View style={styles.teamsContainer}>
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </View>

      {teams.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No teams found</Text>
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
  teamsContainer: {
    padding: 15,
  },
  teamCard: {
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
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37003c',
    marginBottom: 5,
  },
  teamLocation: {
    fontSize: 14,
    color: '#666',
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e90052',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  captainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  captainText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
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

export default TeamsScreen;