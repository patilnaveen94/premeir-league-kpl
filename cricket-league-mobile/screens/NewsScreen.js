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
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const NewsScreen = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const newsSnapshot = await getDocs(
        query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(20))
      );
      const newsData = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to dummy data if no news in database
      setNews([
        {
          id: '1',
          title: 'Season 2024 Kicks Off with Spectacular Opening Ceremony',
          summary: 'The Khajjidoni Premier League 2024 season began with a grand opening ceremony featuring all participating teams.',
          content: 'The much-awaited Khajjidoni Premier League 2024 season officially commenced with a spectacular opening ceremony that showcased the talent and spirit of all participating teams...',
          createdAt: new Date(),
          category: 'Tournament',
          featured: true
        },
        {
          id: '2',
          title: 'New Teams Join the League',
          summary: 'Two new teams have been added to make this season more competitive than ever.',
          content: 'This season welcomes two exciting new teams to the Khajjidoni Premier League, bringing fresh talent and increased competition...',
          createdAt: new Date(Date.now() - 86400000),
          category: 'Teams'
        },
        {
          id: '3',
          title: 'Player Registration Now Open',
          summary: 'Aspiring cricketers can now register to participate in the upcoming season.',
          content: 'The registration portal for new players is now live. Players can submit their applications through the mobile app...',
          createdAt: new Date(Date.now() - 172800000),
          category: 'Registration'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const formatDate = (date) => {
    const newsDate = date.toDate ? date.toDate() : new Date(date);
    return newsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'tournament': return '#e90052';
      case 'teams': return '#37003c';
      case 'registration': return '#00ff85';
      default: return '#666';
    }
  };

  const NewsCard = ({ article, featured = false }) => (
    <TouchableOpacity style={[styles.newsCard, featured && styles.featuredCard]}>
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.newsImage} />
      )}
      
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          {article.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
          )}
          <Text style={styles.newsDate}>{formatDate(article.createdAt)}</Text>
        </View>
        
        <Text style={[styles.newsTitle, featured && styles.featuredTitle]}>
          {article.title}
        </Text>
        
        <Text style={styles.newsSummary} numberOfLines={3}>
          {article.summary || article.content}
        </Text>
        
        <View style={styles.readMore}>
          <Text style={styles.readMoreText}>Read more</Text>
          <Ionicons name="chevron-forward" size={16} color="#e90052" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>News</Text>
        <Text style={styles.subtitle}>Latest Cricket League Updates</Text>
      </View>

      <ScrollView 
        style={styles.newsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {news.map((article, index) => (
          <NewsCard 
            key={article.id} 
            article={article} 
            featured={index === 0 && article.featured}
          />
        ))}

        {news.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No news articles found</Text>
            <Text style={styles.emptySubtext}>Check back later for updates</Text>
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
  newsList: {
    flex: 1,
    padding: 15,
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e90052',
  },
  newsImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  newsContent: {
    padding: 20,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37003c',
    marginBottom: 10,
    lineHeight: 24,
  },
  featuredTitle: {
    fontSize: 20,
  },
  newsSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#e90052',
    fontWeight: '600',
    marginRight: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default NewsScreen;