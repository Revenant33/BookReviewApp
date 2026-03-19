import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalReviews: 0,
    totalFavorites: 0,
    averageRating: 0,
    booksByGenre: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Total books in the system
      const { count: totalBooks } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      // Total reviews in the system
      const { count: totalReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Total favorites in the system
      const { count: totalFavorites } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true });

      // Average rating of all books
      const { data: booksData } = await supabase
        .from('books')
        .select('average_rating')
        .gt('average_rating', 0);

      const averageRating = booksData?.length > 0
        ? booksData.reduce((sum, book) => sum + book.average_rating, 0) / booksData.length
        : 0;

      // Books by genre
      const { data: genreData } = await supabase
        .from('books')
        .select('genre')
        .not('genre', 'is', null);

      const genreCounts = {};
      genreData?.forEach(book => {
        if (book.genre) {
          genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        }
      });

      const booksByGenre = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalBooks: totalBooks || 0,
        totalReviews: totalReviews || 0,
        totalFavorites: totalFavorites || 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
        booksByGenre,
        recentActivity: [], // You can add recent activity data here
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon, value, label, japaneseLabel, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statJapanese}>{japaneseLabel}</Text>
    </View>
  );

  const renderGenreBar = (genre, count, index, totalBooks) => {
    const percentage = totalBooks > 0 ? (count / totalBooks * 100).toFixed(0) : 0;
    const barWidth = (percentage * (width - 80)) / 100;

    return (
      <View key={genre} style={styles.genreItem}>
        <View style={styles.genreHeader}>
          <Text style={styles.genreName}>{genre}</Text>
          <Text style={styles.genreCount}>{count} books ({percentage}%)</Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.bar, { width: barWidth }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.japaneseHeader}>統計データ</Text>
          <Text style={styles.englishHeader}>Statistics</Text>
          <Text style={styles.headerSubtitle}>
            Insights from our reading community
          </Text>
        </View>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.overviewGrid}>
          {renderStatCard('library-books', stats.totalBooks, 'Total Books', '合計本', '#8B0000')}
          {renderStatCard('rate-review', stats.totalReviews, 'Total Reviews', '合計レビュー', '#006400')}
          {renderStatCard('favorite', stats.totalFavorites, 'Total Favorites', '合計お気に入り', '#ff4444')}
          {renderStatCard('star', stats.averageRating, 'Avg. Rating', '平均評価', '#FF8C00')}
        </View>
      </View>

      {/* Genre Distribution */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseSectionTitle}>ジャンル分布</Text>
          <Text style={styles.englishSectionTitle}>Genre Distribution</Text>
        </View>
        <View style={styles.genreCard}>
          {stats.booksByGenre.length > 0 ? (
            stats.booksByGenre.map((item, index) =>
              renderGenreBar(item.genre, item.count, index, stats.totalBooks)
            )
          ) : (
            <View style={styles.emptyState}>
              <Icon name="bar-chart" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No genre data available</Text>
            </View>
          )}
        </View>
      </View>

      {/* Community Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseSectionTitle}>コミュニティインサイト</Text>
          <Text style={styles.englishSectionTitle}>Community Insights</Text>
        </View>
        <View style={styles.insightsCard}>
          <View style={styles.insightItem}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Growing Community</Text>
              <Text style={styles.insightText}>
                {stats.totalBooks} books shared by readers worldwide
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.insightItem}>
            <Icon name="people" size={24} color="#2196F3" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Active Engagement</Text>
              <Text style={styles.insightText}>
                {stats.totalReviews} reviews helping others discover great reads
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.insightItem}>
            <Icon name="emoji-events" size={24} color="#FFC107" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Quality Content</Text>
              <Text style={styles.insightText}>
                Average book rating of {stats.averageRating} stars
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoonSection}>
        <Icon name="insights" size={48} color="#8B0000" />
        <Text style={styles.comingSoonTitle}>More Insights Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          We're working on more detailed statistics including reading trends, 
          monthly activity reports, and personalized recommendations.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerJapanese}>データが語る物語</Text>
        <Text style={styles.footerEnglish}>"The story told by data"</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 25,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  japaneseHeader: {
    fontSize: 32,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishHeader: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    marginTop: -5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statJapanese: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'System',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  japaneseSectionTitle: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishSectionTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginTop: -5,
  },
  genreCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  genreItem: {
    marginBottom: 20,
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  genreName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  genreCount: {
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  comingSoonSection: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginTop: 15,
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 0,
    marginBottom: 20,
  },
  footerJapanese: {
    fontSize: 18,
    color: '#8B0000',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'System',
  },
  footerEnglish: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StatisticsScreen;