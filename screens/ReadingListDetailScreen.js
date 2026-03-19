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
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReadingListDetailScreen = ({ route, navigation }) => {
  const { listId } = route.params;
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    fetchListDetails();
    fetchAllBooks();
  }, [listId]);

  const fetchListDetails = async () => {
    setLoading(true);
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('reading_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listError) throw listError;

      // Fetch books in this list
      const { data: listBooksData, error: booksError } = await supabase
        .from('reading_list_items')
        .select(`
          *,
          books (*)
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: false });

      if (booksError) throw booksError;

      setList(listData);
      setBooks(listBooksData || []);
    } catch (error) {
      console.error('Error fetching list details:', error);
      Alert.alert('Error', 'Failed to load reading list');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBooks = async () => {
    try {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true })
        .limit(50);

      setAllBooks(data || []);
    } catch (error) {
      console.error('Error fetching all books:', error);
    }
  };

  const addBookToList = async (bookId) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add books to lists');
      return;
    }

    setAddingBook(true);
    try {
      const { error } = await supabase
        .from('reading_list_items')
        .insert([{
          list_id: listId,
          book_id: bookId,
        }]);

      if (error) throw error;

      // Refresh the list
      fetchListDetails();
      setModalVisible(false);
      Alert.alert('Success', 'Book added to list!');
    } catch (error) {
      console.error('Error adding book to list:', error);
      Alert.alert('Error', 'Failed to add book to list');
    } finally {
      setAddingBook(false);
    }
  };

  const removeBookFromList = async (itemId) => {
    Alert.alert(
      'Remove Book',
      'Are you sure you want to remove this book from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reading_list_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              // Update local state
              setBooks(books.filter(item => item.id !== itemId));
              Alert.alert('Success', 'Book removed from list');
            } catch (error) {
              console.error('Error removing book from list:', error);
              Alert.alert('Error', 'Failed to remove book from list');
            }
          },
        },
      ]
    );
  };

  const renderBookItem = ({ item }) => {
    const book = item.books;
    if (!book) return null;

    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
      >
        <View style={styles.bookCover}>
          {book.cover_image_url ? (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Icon name="book" size={24} color="#8B0000" />
            </View>
          )}
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {book.author}
          </Text>
          
          {book.genre && (
            <Text style={styles.bookGenre}>{book.genre}</Text>
          )}

          <Text style={styles.addedDate}>
            Added {new Date(item.added_at).toLocaleDateString()}
          </Text>
        </View>

        {user?.id === list?.user_id && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBookFromList(item.id)}
          >
            <Icon name="remove-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderBookOption = ({ item }) => (
    <TouchableOpacity
      style={styles.bookOption}
      onPress={() => addBookToList(item.id)}
      disabled={addingBook}
    >
      <View style={styles.optionCover}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.optionCoverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.optionCoverPlaceholder}>
            <Icon name="book" size={20} color="#8B0000" />
          </View>
        )}
      </View>
      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.optionAuthor} numberOfLines={1}>
          by {item.author}
        </Text>
      </View>
      <Icon name="add" size={24} color="#8B0000" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading reading list...</Text>
      </View>
    );
  }

  if (!list) {
    return (
      <View style={styles.centered}>
        <Icon name="error" size={64} color="#ccc" />
        <Text style={styles.errorText}>Reading list not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user?.id === list.user_id;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reading List</Text>
          {isOwner && (
            <TouchableOpacity
              style={styles.addButtonHeader}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List Info Card */}
      <View style={styles.listInfoCard}>
        <Text style={styles.listName}>{list.name}</Text>
        {list.description && (
          <Text style={styles.listDescription}>{list.description}</Text>
        )}
        
        <View style={styles.listMeta}>
          <View style={styles.metaItem}>
            <Icon name="book" size={20} color="#8B0000" />
            <Text style={styles.metaText}>{books.length} books</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name={list.is_public ? 'public' : 'lock'} size={20} color="#8B0000" />
            <Text style={styles.metaText}>
              {list.is_public ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
      </View>

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="menu-book" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No books in this list</Text>
            <Text style={styles.emptyText}>
              {isOwner
                ? 'Add books to get started!'
                : 'This list is currently empty'}
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.addBooksButton}
                onPress={() => setModalVisible(true)}
              >
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.addBooksButtonText}>Add Books</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshing={loading}
        onRefresh={fetchListDetails}
      />

      {/* Add Books Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalJapaneseTitle}>本を追加</Text>
              <Text style={styles.modalEnglishTitle}>Add Books</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allBooks}
              renderItem={renderBookOption}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Icon name="book" size={48} color="#ccc" />
                  <Text style={styles.modalEmptyText}>No books available</Text>
                </View>
              }
            />
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
  addButtonHeader: {
    padding: 8,
  },
  listInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  listName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  listDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  listMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#8B0000',
    marginLeft: 6,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  bookCard: {
    flexDirection: 'row',
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
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 90,
    marginRight: 15,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D8D8',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookGenre: {
    fontSize: 12,
    color: '#8B0000',
    backgroundColor: '#F8F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    fontWeight: '500',
    marginBottom: 8,
  },
  addedDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
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
  addBooksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 25,
  },
  addBooksButtonText: {
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
  modalList: {
    padding: 20,
  },
  bookOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionCover: {
    width: 50,
    height: 75,
    marginRight: 15,
  },
  optionCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  optionCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F0F0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D8D8',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionAuthor: {
    fontSize: 12,
    color: '#666',
  },
  modalEmpty: {
    alignItems: 'center',
    padding: 40,
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default ReadingListDetailScreen;