import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';


// Import screens
import HomeScreen from '../screens/HomeScreen';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookScreen from '../screens/AddBookScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddReviewScreen from '../screens/AddReviewScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ReadingListsScreen from '../screens/ReadingListsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SocialScreen from '../screens/SocialScreen';
import ReadingListDetailScreen from '../screens/ReadingListDetailScreen';

const Tab = createBottomTabNavigator();
const BookStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Book Stack Navigator
const BookStackNavigator = () => (
  <BookStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#8B0000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <BookStack.Screen 
      name="BookList" 
      component={BookListScreen} 
      options={{ 
        title: 'Books',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: '#FFD700', fontWeight: 'bold' }}>本</Text>
            <Text style={{ fontSize: 18, color: '#fff', marginTop: -5 }}>Books</Text>
          </View>
        )
      }}
    />
    <BookStack.Screen 
      name="BookDetail" 
      component={BookDetailScreen} 
      options={{ 
        title: 'Book Details',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>詳細</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Book Details</Text>
          </View>
        )
      }}
    />
    <BookStack.Screen 
      name="AddReview" 
      component={AddReviewScreen} 
      options={{ 
        title: 'Add Review',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>レビュー</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Add Review</Text>
          </View>
        )
      }}
    />
  </BookStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#8B0000',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ProfileStack.Screen 
      name="Social" 
      component={SocialScreen} 
      options={{ 
        title: 'Social',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>ソーシャル</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Social</Text>
          </View>
        )
      }}
    />
    <ProfileStack.Screen 
      name="Favorites" 
      component={FavoritesScreen} 
      options={{ 
        title: 'Favorites',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>お気に入り</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Favorites</Text>
          </View>
        )
      }}
    />
    <ProfileStack.Screen 
      name="ReadingLists" 
      component={ReadingListsScreen} 
      options={{ 
        title: 'Reading Lists',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>読書リスト</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Reading Lists</Text>
          </View>
        )
      }}
    />
    <ProfileStack.Screen 
      name="ReadingListDetail" 
      component={ReadingListDetailScreen} 
      options={{ 
        title: 'List Details',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>リスト詳細</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>List Details</Text>
          </View>
        )
      }}
    />
    <ProfileStack.Screen 
      name="Statistics" 
      component={StatisticsScreen} 
      options={{ 
        title: 'Statistics',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>統計</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>Statistics</Text>
          </View>
        )
      }}
    />
    <ProfileStack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
      options={{ 
        title: 'User Profile',
        headerTitle: () => (
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>ユーザープロフィール</Text>
            <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>User Profile</Text>
          </View>
        )
      }}
    />
  </ProfileStack.Navigator>
);

// Import View and Text for header titles
import { View, Text } from 'react-native';

// Main App Navigator
export default function AppNavigator({ user }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Books') iconName = 'menu-book';
            else if (route.name === 'Add') iconName = 'add-circle';
            else if (route.name === 'Profile') iconName = 'person';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#8B0000',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#FAF9F6',
            borderTopWidth: 1,
            borderTopColor: '#E8E8E8',
            height: 70,
            paddingBottom: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 5,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          children={(props) => <HomeScreen {...props} user={user} />}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color, fontWeight: focused ? 'bold' : 'normal' }}>
                  ホーム
                </Text>
                <Text style={{ fontSize: 10, color, marginTop: 2 }}>
                  Home
                </Text>
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Books" 
          component={BookStackNavigator}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color, fontWeight: focused ? 'bold' : 'normal' }}>
                  本
                </Text>
                <Text style={{ fontSize: 10, color, marginTop: 2 }}>
                  Books
                </Text>
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Add" 
          component={AddBookScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color, fontWeight: focused ? 'bold' : 'normal' }}>
                  追加
                </Text>
                <Text style={{ fontSize: 10, color, marginTop: 2 }}>
                  Add
                </Text>
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStackNavigator}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color, fontWeight: focused ? 'bold' : 'normal' }}>
                  プロフィール
                </Text>
                <Text style={{ fontSize: 10, color, marginTop: 2 }}>
                  Profile
                </Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}