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
  FlatList,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userBooks, setUserBooks] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    booksAdded: 0,
    reviewsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });

  useEffect(() => {
    fetchUserProfile();
    checkFollowStatus();
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user's books
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch user's reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          books (title, author)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch follow stats
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setProfile(profileData);
      setUserBooks(booksData || []);
      setUserReviews(reviewsData || []);
      setStats({
        booksAdded: booksData?.length || 0,
        reviewsCount: reviewsData?.length || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || currentUser.id === userId) return;

    try {
      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to follow users');
      return;
    }

    if (currentUser.id === userId) {
      Alert.alert('Cannot Follow Yourself', 'You cannot follow your own profile');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        Alert.alert('Unfollowed', `You are no longer following ${profile?.username}`);
      } else {
        await supabase
          .from('followers')
          .insert([{
            follower_id: currentUser.id,
            following_id: userId,
          }]);
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        Alert.alert('Following', `You are now following ${profile?.username}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <View style={styles.bookCover}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <Icon name="book" size={24} color="#8B0000" />
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>by {item.author}</Text>
        {item.average_rating > 0 && (
          <View style={styles.bookRating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.average_rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reviewItem}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.book_id })}
    >
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewBookTitle}>{item.books.title}</Text>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <Icon
              key={star}
              name={star <= item.rating ? 'star' : 'star-border'}
              size={14}
              color="#FFD700"
            />
          ))}
        </View>
      </View>
      {item.comment && (
        <Text style={styles.reviewComment} numberOfLines={2}>
          "{item.comment}"
        </Text>
      )}
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Icon name="error" size={64} color="#ccc" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 40 }} /> {/* Spacer */}
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color="#8B0000" />
            </View>
          )}
        </View>

        <Text style={styles.username}>{profile.username}</Text>
        {profile.full_name && (
          <Text style={styles.fullName}>{profile.full_name}</Text>
        )}

        {currentUser && currentUser.id !== userId && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
          >
            <Icon
              name={isFollowing ? 'check' : 'person-add'}
              size={20}
              color={isFollowing ? '#fff' : '#8B0000'}
            />
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        <Text style={styles.memberSince}>
          Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.booksAdded}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.reviewsCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => Alert.alert('Followers', 'Followers list coming soon!')}
        >
          <Text style={styles.statNumber}>{stats.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => Alert.alert('Following', 'Following list coming soon!')}
        >
          <Text style={styles.statNumber}>{stats.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* Books Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>追加された本</Text>
          <Text style={styles.englishHeader}>Recent Books</Text>
        </View>
        {userBooks.length > 0 ? (
          <FlatList
            data={userBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <View style={styles.emptySection}>
            <Icon name="library-books" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No books added yet</Text>
          </View>
        )}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>最近のレビュー</Text>
          <Text style={styles.englishHeader}>Recent Reviews</Text>
        </View>
        {userReviews.length > 0 ? (
          <FlatList
            data={userReviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptySection}>
            <Icon name="rate-review" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerJapanese}>読書仲間のプロフィール</Text>
        <Text style={styles.footerEnglish}>"Reader's Profile"</Text>
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
  errorText: {
    fontSize: 20,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 25,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
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
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  fullName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F0F0',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  followingButton: {
    backgroundColor: '#8B0000',
  },
  followButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  followingButtonText: {
    color: '#fff',
  },
  bio: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  japaneseHeader: {
    fontSize: 20,
    color: '#8B0000',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishHeader: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  horizontalList: {
    paddingBottom: 10,
  },
  bookItem: {
    width: 120,
    marginRight: 15,
  },
  bookCover: {
    width: 120,
    height: 180,
    backgroundColor: '#F8F0F0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8D8D8',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  bookInfo: {
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#FF8C00',
    marginLeft: 4,
  },
  reviewItem: {
    backgroundColor: '#FAF9F6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewBookTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptySection: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 20,
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

export default UserProfileScreen;