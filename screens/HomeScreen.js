import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, user }) => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    reviewsCount: 0,
    favoritesCount: 0,
    booksAdded: 0,
  });

  useEffect(() => {
    fetchData();
    fetchUserStats();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch top-rated books
      const { data: topBooks } = await supabase
        .from('books')
        .select('*')
        .order('average_rating', { ascending: false })
        .limit(5);

      // Fetch recently added books
      const { data: newBooks } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setFeaturedBooks(topBooks || []);
      setRecentBooks(newBooks || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Get user's review count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get user's favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get user's books added count
      const { count: booksAdded } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      setUserStats({
        reviewsCount: reviewsCount || 0,
        favoritesCount: favoritesCount || 0,
        booksAdded: booksAdded || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchUserStats()]);
    setRefreshing(false);
  };

  const renderBookCard = (book, index) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCard}
      onPress={() => navigation.navigate('Books', { 
  screen: 'BookDetail', 
  params: { bookId: book.id }
})}
    >
      <View style={styles.bookNumber}>
        <Text style={styles.bookNumberText}>#{index + 1}</Text>
      </View>
      <View style={styles.bookContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          by {book.author}
        </Text>
        {book.average_rating > 0 && (
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{book.average_rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Japanese decorative text */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.japaneseTitleContainer}>
            <Text style={styles.japaneseTitle}>書評</Text>
            <Text style={styles.englishTitle}>Book Reviews</Text>
          </View>
            <TouchableOpacity 
    style={styles.logoutButton}
    onPress={async () => {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              await supabase.auth.signOut();
              // Navigation will handle the rest via App.js
            },
          },
        ]
      );
    }}
  >
    <Icon name="logout" size={22} color="#fff" />
  </TouchableOpacity>
          <View style={styles.userGreeting}>
            <Text style={styles.welcomeText}>
              Welcome back,{'\n'}
              <Text style={styles.userName}>
                {user?.email ? user.email.split('@')[0] : 'Reader'}
              </Text>
              !
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Discover and share your literary journey
        </Text>
      </View>

      {/* Quick Stats with Japanese decorative headers */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>統計</Text>
          <Text style={styles.englishHeader}>Quick Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.booksAdded}</Text>
            <Text style={styles.statLabel}>Books Added</Text>
            <Text style={styles.japaneseLabel}>追加された本</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.reviewsCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
            <Text style={styles.japaneseLabel}>レビュー</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
            <Text style={styles.japaneseLabel}>お気に入り</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions with Japanese decorative headers */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>アクション</Text>
          <Text style={styles.englishHeader}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Add')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8B0000' }]}>
              <Icon name="add" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Add Book</Text>
            <Text style={styles.japaneseActionText}>本を追加</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Books')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#006400' }]}>
              <Icon name="search" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Browse</Text>
            <Text style={styles.japaneseActionText}>探す</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#00008B' }]}>
              <Icon name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Profile</Text>
            <Text style={styles.japaneseActionText}>プロフィール</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Books with Japanese decorative headers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.japaneseHeader}>注目の本</Text>
            <Text style={styles.englishHeader}>Featured Books</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Books')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {featuredBooks.length > 0 ? (
          featuredBooks.map((book, index) => renderBookCard(book, index))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="book" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No books yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Add')}
            >
              <Text style={styles.addButtonText}>Add First Book</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recently Added with Japanese decorative headers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.japaneseHeader}>最近追加</Text>
            <Text style={styles.englishHeader}>Recently Added</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Books')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {recentBooks.length > 0 ? (
          recentBooks.map((book, index) => renderBookCard(book, index))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="update" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No recent books</Text>
          </View>
        )}
      </View>

      {/* Footer with Japanese decorative text */}
      <View style={styles.footer}>
        <Text style={styles.footerJapanese}>読書は心の栄養です</Text>
        <Text style={styles.footerEnglish}>"Reading nourishes the soul"</Text>
        <Text style={styles.footerSubtext}>- Book Review App -</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background
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
    backgroundColor: '#8B0000', // Deep red
    padding: 25,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  japaneseTitleContainer: {
    alignItems: 'flex-start',
  },
  japaneseTitle: {
    fontSize: 42,
    color: '#FFD700', // Gold
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginTop: -5,
  },
  userGreeting: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'right',
    lineHeight: 24,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FFD700',
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  statsSection: {
    padding: 20,
    marginTop: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  japaneseHeader: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
    marginRight: 10,
    fontFamily: 'System',
  },
  englishHeader: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    fontWeight: '600',
  },
  japaneseLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'System',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  japaneseActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'System',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  seeAll: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  bookNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookContent: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#FF8C00',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  footerJapanese: {
    fontSize: 20,
    color: '#8B0000',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'System',
  },
  footerEnglish: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  logoutButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
},
});

export default HomeScreen;