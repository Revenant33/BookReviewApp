import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddReviewScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookDetails();
    checkExistingReview();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error fetching book:', error);
      Alert.alert('Error', 'Failed to load book details');
    }
  };

  const checkExistingReview = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();

      if (!error && data) {
        setExistingReview(data);
        setRating(data.rating);
        setComment(data.comment || '');
      }
    } catch (error) {
      // No existing review
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to submit a review');
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        book_id: bookId,
        user_id: user.id,
        rating: rating,
        comment: comment.trim() || null,
      };

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id);

        if (error) throw error;
        Alert.alert('Success', 'Review updated successfully!');
      } else {
        // Insert new review
        const { error } = await supabase
          .from('reviews')
          .insert([reviewData]);

        if (error) throw error;
        Alert.alert('Success', 'Review submitted successfully!');
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.japaneseTitle}>
            {existingReview ? 'レビュー編集' : 'レビュー追加'}
          </Text>
          <Text style={styles.englishTitle}>
            {existingReview ? 'Edit Review' : 'Add Review'}
          </Text>
          {book && (
            <Text style={styles.bookTitle}>
              "{book.title}" by {book.author}
            </Text>
          )}
        </View>

        {/* Book Info Card */}
        {book && (
          <View style={styles.bookCard}>
            <Text style={styles.bookTitleText}>{book.title}</Text>
            <Text style={styles.bookAuthor}>by {book.author}</Text>
            {book.genre && (
              <Text style={styles.bookGenre}>{book.genre}</Text>
            )}
          </View>
        )}

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionLabel}>Your Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Icon
                  name={star <= rating ? 'star' : 'star-border'}
                  size={42}
                  color="#FFD700"
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Select stars above' : `${rating} out of 5 stars`}
          </Text>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionLabel}>Your Review (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your thoughts about this book..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {comment.length}/1000 characters
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>📝 Review Tips:</Text>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Be honest and thoughtful</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Share what you liked or disliked</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Avoid spoilers or use spoiler warnings</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>Your review helps other readers</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon
                name={existingReview ? 'edit' : 'rate-review'}
                size={24}
                color="#fff"
              />
              <Text style={styles.submitButtonText}>
                {existingReview ? 'Update Review' : 'Submit Review'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  japaneseTitle: {
    fontSize: 32,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    marginTop: -5,
  },
  bookTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bookCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  bookTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bookGenre: {
    fontSize: 14,
    color: '#8B0000',
    backgroundColor: '#F8F0F0',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    fontWeight: '500',
  },
  ratingSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 25,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 18,
    color: '#8B0000',
    fontWeight: '600',
  },
  commentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  tipsSection: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginTop: 20,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginTop: 25,
    padding: 18,
    borderRadius: 15,
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
  cancelButton: {
    alignItems: 'center',
    marginTop: 15,
    padding: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default AddReviewScreen;