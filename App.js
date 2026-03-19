import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext'; // Add this

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
        <ActivityIndicator size="large" color="#8B0000" />
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen setUser={setUser} />;
  }

  return (
    <AuthProvider> {/* Wrap with AuthProvider */}
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      <AppNavigator user={user} />
    </AuthProvider>
  );
}