import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const PointsTableScreen = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    try {
      const standingsSnapshot = await getDocs(collection(db, 'standings'));
      const standingsData = standingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedStandings = standingsData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
        return b.wins - a.wins;
      });
      setStandings(sortedStandings);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStandings();
  };

  const getPositionStyle = (position) => {
    if (position <= 2) return styles.topPosition;
    if (position <= 4) return styles.qualifyPosition;
    return styles.normalPosition;
  };

  const TableRow = ({ team, position }) => (
    <View style={[styles.tableRow, getPositionStyle(position)]}>
      <Text style={styles.position}>{position}</Text>
      <Text style={styles.teamName}>{team.team}</Text>
      <Text style={styles.stat}>{team.matchesPlayed || 0}</Text>
      <Text style={styles.stat}>{team.wins || 0}</Text>
      <Text style={styles.stat}>{team.losses || 0}</Text>
      <Text style={styles.stat}>{team.draws || 0}</Text>
      <Text style={styles.points}>{team.points || 0}</Text>
      <Text style={styles.nrr}>{(team.netRunRate || 0).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Points Table</Text>
        <Text style={styles.subtitle}>League Standings</Text>
      </View>

      <ScrollView 
        style={styles.tableContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerPos}>Pos</Text>
            <Text style={styles.headerTeam}>Team</Text>
            <Text style={styles.headerStat}>MP</Text>
            <Text style={styles.headerStat}>W</Text>
            <Text style={styles.headerStat}>L</Text>
            <Text style={styles.headerStat}>D</Text>
            <Text style={styles.headerPoints}>Pts</Text>
            <Text style={styles.headerNRR}>NRR</Text>
          </View>

          {/* Table Rows */}
          {standings.map((team, index) => (
            <TableRow key={team.id} team={team} position={index + 1} />
          ))}

          {standings.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No standings data available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e8f5e8' }]} />
            <Text style={styles.legendText}>Top 2 - Finals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fff3e0' }]} />
            <Text style={styles.legendText}>3rd-4th - Playoffs</Text>
          </View>
        </View>
        <Text style={styles.abbreviations}>
          MP: Matches Played, W: Wins, L: Losses, D: Draws, Pts: Points, NRR: Net Run Rate
        </Text>
      </View>
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
  tableContainer: {
    flex: 1,
    padding: 15,
  },
  table: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#37003c',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerPos: {
    width: 40,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  headerTeam: {
    width: 120,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerStat: {
    width: 40,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  headerPoints: {
    width: 50,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  headerNRR: {
    width: 60,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topPosition: {
    backgroundColor: '#e8f5e8',
  },
  qualifyPosition: {
    backgroundColor: '#fff3e0',
  },
  normalPosition: {
    backgroundColor: 'white',
  },
  position: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
    textAlign: 'center',
  },
  teamName: {
    width: 120,
    fontSize: 14,
    fontWeight: '600',
    color: '#37003c',
  },
  stat: {
    width: 40,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  points: {
    width: 50,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e90052',
    textAlign: 'center',
  },
  nrr: {
    width: 60,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  legend: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37003c',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  abbreviations: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
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

export default PointsTableScreen;