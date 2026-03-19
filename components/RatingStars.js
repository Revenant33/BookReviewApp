import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RatingStars = ({ rating, size = 20, editable = false, onRate }) => {
  const handlePress = (starIndex) => {
    if (editable && onRate) {
      onRate(starIndex + 1);
    }
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={star <= rating ? 'star' : 'star-border'}
          size={size}
          color="#FFD700"
          onPress={() => handlePress(star - 1)}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

export default RatingStars;