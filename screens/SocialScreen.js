import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SocialScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'following', 'followers'

  useEffect(() => {
    fetchUsers();
    if (user) {
      fetchFollowing();
      fetchFollowers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          following_id,
          profiles!followers_following_id_fkey (*)
        `)
        .eq('follower_id', user.id);

      if (!error && data) {
        setFollowing(data.map(item => item.profiles).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles!followers_follower_id_fkey (*)
        `)
        .eq('following_id', user.id);

      if (!error && data) {
        setFollowers(data.map(item => item.profiles).filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const handleFollowToggle = async (targetUserId, currentlyFollowing) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to follow users');
      return;
    }

    if (user.id === targetUserId) {
      Alert.alert('Cannot Follow Yourself', 'You cannot follow your own profile');
      return;
    }

    try {
      if (currentlyFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        // Update local state
        setFollowing(following.filter(u => u.id !== targetUserId));
        Alert.alert('Unfollowed', 'User unfollowed successfully');
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert([{
            follower_id: user.id,
            following_id: targetUserId,
          }]);
        
        // Add to following list
        const userToAdd = users.find(u => u.id === targetUserId);
        if (userToAdd) {
          setFollowing([userToAdd, ...following]);
        }
        Alert.alert('Following', 'You are now following this user');
      }

      // Refresh followers count
      fetchFollowers();
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderUserItem = ({ item }) => {
    const isFollowing = following.some(u => u.id === item.id);
    const isCurrentUser = user?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <View style={styles.userAvatarContainer}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={24} color="#8B0000" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username}
          </Text>
          {item.full_name && (
            <Text style={styles.fullName} numberOfLines={1}>
              {item.full_name}
            </Text>
          )}
          {item.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => handleFollowToggle(item.id, isFollowing)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const getFilteredUsers = () => {
    let data = [];
    switch (activeTab) {
      case 'following':
        data = following;
        break;
      case 'followers':
        data = followers;
        break;
      default:
        data = users;
    }

    if (searchQuery) {
      return data.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  };

  const getEmptyMessage = () => {
    if (searchQuery) return 'No users found';
    
    switch (activeTab) {
      case 'following':
        return 'You are not following anyone yet';
      case 'followers':
        return 'You have no followers yet';
      default:
        return 'No users found';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading social...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.japaneseHeader}>ソーシャル</Text>
          <Text style={styles.englishHeader}>Social</Text>
          <Text style={styles.headerSubtitle}>
            Connect with other readers
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={22} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={22} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={getFilteredUsers()}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'following' && 'Find and follow other readers to see them here'}
              {activeTab === 'followers' && 'Share your profile to get followers'}
              {activeTab === 'all' && !searchQuery && 'Be the first to join the community!'}
            </Text>
            {activeTab === 'all' && !searchQuery && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchUsers}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshing={loading}
        onRefresh={() => {
          fetchUsers();
          if (user) {
            fetchFollowing();
            fetchFollowers();
          }
        }}
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#8B0000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userAvatarContainer: {
    marginRight: 15,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8D8D8',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  bio: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8F0F0',
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#8B0000',
  },
  followButtonText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialScreen;