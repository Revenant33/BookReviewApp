import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AuthScreen = ({ setUser }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Signing in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('Sign in error:', error);
        
        // Check if user doesn't exist
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Account Not Found',
            'No account found with this email. Would you like to create one?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Create Account', 
                onPress: () => setIsSignUp(true) 
              }
            ]
          );
          return;
        }
        throw error;
      }

      console.log('Sign in successful:', data.user.email);
      Alert.alert('Welcome Back!', 'Successfully signed in.');
      setUser(data.user);
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    if (displayName.trim().length < 3) {
      Alert.alert('Error', 'Display name must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Signing up...');
      
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        console.error('Sign up error:', authError);
        
        // If user already exists, suggest signing in
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered')) {
          Alert.alert(
            'Account Exists',
            'This email is already registered. Please sign in instead.',
            [
              { 
                text: 'Sign In', 
                onPress: () => setIsSignUp(false) 
              }
            ]
          );
          return;
        }
        throw authError;
      }

      if (authData.user) {
        console.log('User created, now creating profile...');
        
        // Create profile with display name
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            username: displayName.trim(),
            created_at: new Date().toISOString(),
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // User created but profile failed - still sign them in
          Alert.alert(
            'Account Created',
            'Your account was created! Some profile features may be limited.',
            [{ text: 'OK', onPress: () => setUser(authData.user) }]
          );
        } else {
          Alert.alert(
            'Success!',
            `Welcome ${displayName}! Your account has been created.`,
            [{ text: 'Start Reading!', onPress: () => setUser(authData.user) }]
          );
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const useTestCredentials = (type = 'signin') => {
    if (type === 'signin') {
      setEmail('demo@test.com');
      setPassword('demo123');
      setIsSignUp(false);
    } else {
      setEmail(`test${Math.floor(Math.random() * 1000)}@test.com`);
      setPassword('test123');
      setDisplayName(`Reader${Math.floor(Math.random() * 1000)}`);
      setIsSignUp(true);
    }
    Alert.alert(
      'Test Credentials',
      type === 'signin' 
        ? 'Email: demo@test.com\nPassword: demo123\n\nClick "Sign In"'
        : `Email: ${email}\nPassword: test123\nDisplay: ${displayName}\n\nClick "Create Account"`
    );
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Japanese Title Header */}
        <View style={styles.header}>
          <Text style={styles.japaneseTitle}>書評コミュニティ</Text>
          <Text style={styles.englishTitle}>Book Review Community</Text>
          <Text style={styles.headerSubtitle}>
            Share your literary journey with fellow readers
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Auth Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, !isSignUp && styles.activeMode]}
              onPress={() => {
                setIsSignUp(false);
                resetForm();
              }}
            >
              <Text style={[styles.modeText, !isSignUp && styles.activeModeText]}>
                サインイン
              </Text>
              <Text style={[styles.modeSubtext, !isSignUp && styles.activeModeSubtext]}>
                Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, isSignUp && styles.activeMode]}
              onPress={() => {
                setIsSignUp(true);
                resetForm();
              }}
            >
              <Text style={[styles.modeText, isSignUp && styles.activeModeText]}>
                アカウント作成
              </Text>
              <Text style={[styles.modeSubtext, isSignUp && styles.activeModeSubtext]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Icon name="email" size={16} color="#8B0000" /> Email
              </Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Icon name="lock" size={16} color="#8B0000" /> Password
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {/* Display Name Field (only for sign up) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="person" size={16} color="#8B0000" /> Display Name
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username (min 3 chars)"
                  placeholderTextColor="#999"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  editable={!loading}
                />
                <Text style={styles.inputHint}>
                  This will be visible to other users
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon
                    name={isSignUp ? "person-add" : "login"}
                    size={22}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Test Credentials Buttons */}
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={[styles.testButton, styles.testSignInButton]}
                onPress={() => useTestCredentials('signin')}
                disabled={loading}
              >
                <Icon name="login" size={18} color="#fff" />
                <Text style={styles.testButtonText}>Use Test Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testButton, styles.testSignUpButton]}
                onPress={() => useTestCredentials('signup')}
                disabled={loading}
              >
                <Icon name="person-add" size={18} color="#fff" />
                <Text style={styles.testButtonText}>Try Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Icon name="info" size={20} color="#8B0000" />
                <Text style={styles.infoTitle}>Important Information</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.infoText}>
                  <Text style={styles.infoHighlight}>Email confirmation is OFF</Text> - You can sign up and login immediately
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.infoText}>
                  <Text style={styles.infoHighlight}>Display names</Text> are required for social features
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.infoText}>
                  <Text style={styles.infoHighlight}>Test accounts</Text> are available above
                </Text>
              </View>
            </View>

            {/* Switch Mode Prompt */}
            <View style={styles.switchMode}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  resetForm();
                }}
                disabled={loading}
              >
                <Text style={styles.switchLink}>
                  {isSignUp ? 'Sign in here' : 'Create one here'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerJapanese}>読書は旅である</Text>
          <Text style={styles.footerEnglish}>"Reading is a journey"</Text>
          <Text style={styles.footerSubtext}>- Start Your Journey Today -</Text>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  japaneseTitle: {
    fontSize: 36,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
  },
  englishTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginTop: -5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: -20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
  },
  activeMode: {
    backgroundColor: '#8B0000',
  },
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'System',
  },
  activeModeText: {
    color: '#fff',
  },
  modeSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  activeModeSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  inputHint: {
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
  buttonIcon: {
    marginRight: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  testSignInButton: {
    backgroundColor: '#006400',
  },
  testSignUpButton: {
    backgroundColor: '#00008B',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#F8F0F0',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  infoHighlight: {
    fontWeight: 'bold',
    color: '#8B0000',
  },
  switchMode: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchLink: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
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
    marginBottom: 8,
    fontStyle: 'italic',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default AuthScreen;