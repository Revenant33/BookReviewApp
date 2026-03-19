import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddBookScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const genres = [
    'Fiction', 'Non-Fiction', 'Science', 'Fantasy',
    'Mystery', 'Biography', 'History', 'Romance',
    'Self-Help', 'Science Fiction', 'Thriller', 'Classic'
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Error', 'Please fill in at least title and author');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in to add books');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('books')
        .insert([{
          title: title.trim(),
          author: author.trim(),
          genre: genre || null,
          published_year: year ? parseInt(year) : null,
          description: description.trim() || null,
          cover_image_url: coverUrl.trim() || null,
          created_by: user.id,
        }]);

      if (error) throw error;

      Alert.alert(
        'Success!',
        'Book added successfully to the collection.',
        [
          {
            text: 'View Books',
            onPress: () => {
              resetForm();
              navigation.navigate('Books');
            }
          },
          {
            text: 'Add Another',
            onPress: resetForm,
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Add book error:', error);
      Alert.alert('Error', 'Failed to add book: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setGenre('');
    setYear('');
    setDescription('');
    setCoverUrl('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="library-add" size={48} color="#8B0000" />
          <Text style={styles.japaneseTitle}>新しい本を追加</Text>
          <Text style={styles.englishTitle}>Add New Book</Text>
          <Text style={styles.headerSubtitle}>
            Share a book with the community
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Book Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Book Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter book title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          {/* Author */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Author <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter author name"
              placeholderTextColor="#999"
              value={author}
              onChangeText={setAuthor}
              maxLength={100}
            />
          </View>

          {/* Genre Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreScroll}
            >
              {genres.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genreOption,
                    genre === g && styles.genreOptionSelected,
                  ]}
                  onPress={() => setGenre(g)}
                >
                  <Text
                    style={[
                      styles.genreText,
                      genre === g && styles.genreTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Published Year */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Published Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2023"
              placeholderTextColor="#999"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter a brief description of the book..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Cover Image URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cover Image URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/book-cover.jpg"
              placeholderTextColor="#999"
              value={coverUrl}
              onChangeText={setCoverUrl}
              autoCapitalize="none"
            />
            <Text style={styles.urlHint}>
              You can find book cover images online
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !title.trim() || !author.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="check-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Add Book to Collection
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Preview Note */}
          {coverUrl && (
            <View style={styles.previewNote}>
              <Icon name="image" size={20} color="#4CAF50" />
              <Text style={styles.previewNoteText}>
                Cover image preview available
              </Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>📚 Adding Tips:</Text>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Make sure title and author are accurate</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Choose the most relevant genre</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Add a description to help others discover the book</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  japaneseTitle: {
    fontSize: 28,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 15,
    fontFamily: 'System',
  },
  englishTitle: {
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
  form: {
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
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  required: {
    color: '#ff4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  genreScroll: {
    marginTop: 5,
  },
  genreOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genreOptionSelected: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  genreText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genreTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  urlHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 15,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#B85C5C',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  previewNoteText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 10,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8F00',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#5D4037',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});

export default AddBookScreen;