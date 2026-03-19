import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const BookCard = ({ book, onPress }) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = React.useState(false);

  React.useEffect(() => {
    checkIfFavorite();
  }, [book.id, user]);

  const checkIfFavorite = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite
    }
  };

  const handleFavoritePress = async () => {
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
          .eq('book_id', book.id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, book_id: book.id }]);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.card}>
        {/* Book Cover */}
        <View style={styles.coverContainer}>
          {book.cover_image_url ? (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.placeholderCover]}>
              <Icon name="book" size={32} color="#8B0000" />
            </View>
          )}
        </View>

        {/* Book Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
            >
              <Icon
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={22}
                color={isFavorite ? '#ff4444' : '#999'}
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.author} numberOfLines={1}>
            by {book.author}
          </Text>
          
          {book.genre && (
            <View style={styles.genreContainer}>
              <Text style={styles.genre}>{book.genre}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>
                {book.average_rating ? book.average_rating.toFixed(1) : 'New'}
              </Text>
            </View>
            
            {book.published_year && (
              <Text style={styles.year}>{book.published_year}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  coverContainer: {
    marginRight: 15,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  placeholderCover: {
    backgroundColor: '#F8F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8D8D8',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  favoriteButton: {
    padding: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  genreContainer: {
    alignSelf: 'flex-start',
  },
  genre: {
    fontSize: 12,
    color: '#8B0000',
    backgroundColor: '#F8F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600',
    marginLeft: 4,
  },
  year: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default BookCard;