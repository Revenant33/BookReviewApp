import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BookDetailScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchBookData();
    checkFavoriteStatus();
    checkUserReview();
  }, [bookId, user]);

  const fetchBookData = async () => {
    setLoading(true);
    
    try {
      // Fetch book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;

      // Fetch reviews with user info
      const { data: reviewsData, error: reviewsError } = await supabase
  .from('reviews')
  .select('*')
  .eq('book_id', bookId)
  .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      setBook(bookData);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching book data:', error);
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite
    }
  };

  const checkUserReview = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();
      
      setUserReview(data);
    } catch (error) {
      // No review
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Please sign in to add favorites');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId);
        setIsFavorite(false);
        Alert.alert('Removed from Favorites');
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, book_id: bookId }]);
        setIsFavorite(true);
        Alert.alert('Added to Favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleShare = async () => {
    if (!book) return;

    try {
      await Share.share({
        message: `Check out "${book.title}" by ${book.author} on Book Reviews!`,
        title: book.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddReview = () => {
    navigation.navigate('AddReview', { bookId });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centered}>
        <Icon name="error" size={64} color="#ccc" />
        <Text style={styles.errorText}>Book not found</Text>
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
      {/* Book Header */}
      <View style={styles.header}>
        <View style={styles.coverContainer}>
          {book.cover_image_url ? (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.placeholderCover]}>
              <Icon name="book" size={48} color="#8B0000" />
            </View>
          )}
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          
          <View style={styles.metaInfo}>
            {book.genre && (
              <Text style={styles.genre}>{book.genre}</Text>
            )}
            {book.published_year && (
              <Text style={styles.year}>Published: {book.published_year}</Text>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= (book.average_rating || 0) ? 'star' : 'star-border'}
                  size={22}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {book.average_rating ? book.average_rating.toFixed(1) : 'No ratings'} • {reviews.length} reviews
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
          <Icon
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={24}
            color={isFavorite ? '#ff4444' : '#666'}
          />
          <Text style={styles.actionButtonText}>
            {isFavorite ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={24} color="#666" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleAddReview}>
          <Icon name="rate-review" size={24} color="#8B0000" />
          <Text style={[styles.actionButtonText, { color: '#8B0000' }]}>
            {userReview ? 'Edit Review' : 'Add Review'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book Description Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>概要</Text>
          <Text style={styles.englishHeader}>About This Book</Text>
        </View>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            {book.description || 'No description available for this book. Be the first to add a review!'}
          </Text>
        </View>
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.japaneseHeader}>レビュー</Text>
          <Text style={styles.englishHeader}>Reviews ({reviews.length})</Text>
        </View>

        {reviews.length > 0 ? (
          reviews.slice(0, 3).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  {review.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: review.profiles.avatar_url }}
                      style={styles.reviewerAvatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Icon name="person" size={16} color="#fff" />
                    </View>
                  )}
                  <Text style={styles.reviewerName}>
                    {review.profiles?.username || 'Anonymous'}
                  </Text>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-border'}
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
              {review.comment && (
                <Text style={styles.reviewComment} numberOfLines={3}>
                  "{review.comment}"
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noReviews}>
            <Icon name="rate-review" size={48} color="#ccc" />
            <Text style={styles.noReviewsText}>No reviews yet</Text>
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={handleAddReview}
            >
              <Text style={styles.addReviewButtonText}>Be the first to review</Text>
            </TouchableOpacity>
          </View>
        )}

        {reviews.length > 3 && (
          <TouchableOpacity
            style={styles.seeAllReviews}
            onPress={() => Alert.alert('Coming Soon', 'All reviews feature coming soon!')}
          >
            <Text style={styles.seeAllReviewsText}>See All Reviews →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerJapanese}>一冊の本、無限の物語</Text>
        <Text style={styles.footerEnglish}>"One book, infinite stories"</Text>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
  },
  coverContainer: {
    marginRight: 20,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderCover: {
    backgroundColor: '#F8F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  metaInfo: {
    marginBottom: 15,
  },
  genre: {
    fontSize: 14,
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontWeight: '500',
  },
  year: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ratingContainer: {
    marginTop: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -25,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
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
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  englishHeader: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginTop: -5,
  },
  descriptionCard: {
    backgroundColor: '#FAF9F6',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  reviewCard: {
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
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noReviews: {
    alignItems: 'center',
    padding: 30,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  addReviewButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seeAllReviews: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  seeAllReviewsText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
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

export default BookDetailScreen;