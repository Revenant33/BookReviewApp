import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReadingListsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReadingLists();
    }
  }, [user]);

  const fetchReadingLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reading_lists')
        .select(`
          *,
          list_books (
            count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching reading lists:', error);
      // If table doesn't exist, show empty state
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const createReadingList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    setCreating(true);
    try {
      // First, ensure the table exists (for demo purposes)
      // In production, you would have created this table already
      
      const { data, error } = await supabase
        .from('reading_lists')
        .insert([{
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          is_public: false,
        }])
        .select()
        .single();

      if (error) {
        // If table doesn't exist, show informative message
        if (error.code === '42P01') {
          Alert.alert(
            'Feature Coming Soon',
            'The reading lists feature requires additional setup. For now, you can use favorites to save books!',
            [{ text: 'OK' }]
          );
        } else {
          throw error;
        }
      } else {
        setLists([data, ...lists]);
        Alert.alert('Success', 'Reading list created!');
        setModalVisible(false);
        setNewListName('');
        setNewListDescription('');
      }
    } catch (error) {
      console.error('Error creating reading list:', error);
      Alert.alert('Error', 'Failed to create reading list');
    } finally {
      setCreating(false);
    }
  };

  const renderListCard = ({ item }) => (
    
    <TouchableOpacity
    style={styles.listCard}
    onPress={() => navigation.navigate('ReadingListDetail', { listId: item.id })}
  >
      <View style={styles.listHeader}>
        <Icon name="list" size={28} color="#8B0000" />
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </View>
      
      <View style={styles.listFooter}>
        <View style={styles.bookCount}>
          <Icon name="book" size={16} color="#666" />
          <Text style={styles.bookCountText}>
            {item.list_books?.[0]?.count || 0} books
          </Text>
        </View>
        <Text style={styles.listDate}>
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading reading lists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.japaneseHeader}>読書リスト</Text>
          <Text style={styles.englishHeader}>Reading Lists</Text>
          <Text style={styles.headerSubtitle}>
            Organize your reading journey
          </Text>
        </View>
      </View>

      {/* Create List Card */}
      <TouchableOpacity
        style={styles.createCard}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.createIcon}>
          <Icon name="add-circle" size={32} color="#8B0000" />
        </View>
        <View style={styles.createText}>
          <Text style={styles.createTitle}>Create New List</Text>
          <Text style={styles.createSubtitle}>
            Organize books by theme, genre, or mood
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>

      {/* Lists */}
      <FlatList
        data={lists}
        renderItem={renderListCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="list-alt" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No reading lists yet</Text>
            <Text style={styles.emptyText}>
              Create your first list to organize books by theme, genre, or mood
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create First List</Text>
            </TouchableOpacity>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchReadingLists}
      />

      {/* Create List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalJapaneseTitle}>新しいリスト</Text>
              <Text style={styles.modalEnglishTitle}>Create New List</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>List Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Summer Reading, Mystery Novels"
                placeholderTextColor="#999"
                value={newListName}
                onChangeText={setNewListName}
                maxLength={50}
              />

              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="What's this list about?"
                placeholderTextColor="#999"
                value={newListDescription}
                onChangeText={setNewListDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  (!newListName.trim() || creating) && styles.modalSubmitButtonDisabled,
                ]}
                onPress={createReadingList}
                disabled={!newListName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="add-circle" size={22} color="#fff" />
                    <Text style={styles.modalSubmitButtonText}>
                      Create List
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#8B0000',
    borderStyle: 'dashed',
  },
  createIcon: {
    marginRight: 15,
  },
  createText: {
    flex: 1,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  listInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCountText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  listDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 25,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  modalJapaneseTitle: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  modalEnglishTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginTop: -5,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 30,
    padding: 5,
  },
  modalBody: {
    padding: 25,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#B85C5C',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default ReadingListsScreen;