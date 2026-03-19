import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    booksAdded: 0,
    reviewsCount: 0,
    favoritesCount: 0,
    readingLists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setProfile(data || {
        id: user.id,
        username: user.email?.split('@')[0] || 'User',
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({
        id: user.id,
        username: user.email?.split('@')[0] || 'User',
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Books added
      const { count: booksAdded } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Favorites count
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Reading lists count (if you have a reading_lists table)
      const { count: readingLists } = await supabase
        .from('reading_lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        booksAdded: booksAdded || 0,
        reviewsCount: reviewsCount || 0,
        favoritesCount: favoritesCount || 0,
        readingLists: readingLists || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.japaneseTitleContainer}>
            <Text style={styles.japaneseTitle}>プロフィール</Text>
            <Text style={styles.englishTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Your personal reading journey
        </Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color="#8B0000" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton}>
            <Icon name="edit" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>
          {profile?.username || user.email?.split('@')[0]}
        </Text>
        <Text style={styles.email}>{user.email}</Text>

        {profile?.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : (
          <TouchableOpacity style={styles.addBioButton}>
            <Icon name="add" size={18} color="#8B0000" />
            <Text style={styles.addBioText}>Add a bio</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.memberSince}>
          Member since {new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>統計</Text>
          <Text style={styles.englishHeader}>Your Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Books')}
          >
            <Icon name="library-books" size={30} color="#8B0000" />
            <Text style={styles.statNumber}>{stats.booksAdded}</Text>
            <Text style={styles.statLabel}>Books Added</Text>
            <Text style={styles.statJapanese}>追加された本</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Books')}
          >
            <Icon name="rate-review" size={30} color="#006400" />
            <Text style={styles.statNumber}>{stats.reviewsCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
            <Text style={styles.statJapanese}>レビュー</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Icon name="favorite" size={30} color="#ff4444" />
            <Text style={styles.statNumber}>{stats.favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
            <Text style={styles.statJapanese}>お気に入り</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ReadingLists')}
          >
            <Icon name="list-alt" size={30} color="#00008B" />
            <Text style={styles.statNumber}>{stats.readingLists}</Text>
            <Text style={styles.statLabel}>Lists</Text>
            <Text style={styles.statJapanese}>リスト</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>クイックアクション</Text>
          <Text style={styles.englishHeader}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Favorites')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ff4444' }]}>
              <Icon name="favorite" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Favorites</Text>
            <Text style={styles.actionJapanese}>お気に入り</Text>
          </TouchableOpacity>
        <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('Social')}
        >
        <View style={[styles.actionIcon, { backgroundColor: '#4B0082' }]}>
            <Icon name="people" size={24} color="#fff" />
        </View>
        <Text style={styles.actionText}>Social</Text>
        <Text style={styles.actionJapanese}>ソーシャル</Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReadingLists')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#00008B' }]}>
              <Icon name="list" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Lists</Text>
            <Text style={styles.actionJapanese}>リスト</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Statistics')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#006400' }]}>
              <Icon name="analytics" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Stats</Text>
            <Text style={styles.actionJapanese}>統計</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'Settings feature coming soon!')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF8C00' }]}>
              <Icon name="settings" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Settings</Text>
            <Text style={styles.actionJapanese}>設定</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>最近の活動</Text>
          <Text style={styles.englishHeader}>Recent Activity</Text>
        </View>
        <View style={styles.activityCard}>
          <Icon name="update" size={48} color="#ccc" />
          <Text style={styles.activityEmptyText}>
            Your recent activity will appear here
          </Text>
          <Text style={styles.activityEmptySubtext}>
            Keep adding books and reviews to see your history
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerJapanese}>読書の旅は続く</Text>
        <Text style={styles.footerEnglish}>"The reading journey continues"</Text>
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
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginTop: -5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#8B0000',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#8B0000',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B0000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  bio: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  addBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F0F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  addBioText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  statsSection: {
    padding: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    fontWeight: '600',
  },
  statJapanese: {
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
  actionJapanese: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'System',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activityEmptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  activityEmptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
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

export default ProfileScreen;