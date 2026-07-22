import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const COLORS = {
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  primary: '#00696c',
  onPrimary: '#ffffff',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceVariant: '#dfe3e3',
  outlineVariant: '#bdc9c9',
  outline: '#6d797a',
  surfaceBright: '#f6fafa',
};

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      setIsLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error('No ID token found');
      
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.log('Google login error:', error);
      Alert.alert('Google Login Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🏪</Text>
            </View>
            <Text style={styles.title}>Quicky</Text>
            <Text style={styles.subtitle}>Store Partner Portal</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@store.com"
                  placeholderTextColor={COLORS.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.outline}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                (!email || !password || isLoading) && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footerActions}>
            <Pressable 
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Sign in with Google</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
                { marginTop: 12 }
              ]}
              onPress={() => navigation.navigate('Signup')}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surfaceBright,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.onSurface,
  },
  primaryButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  footerActions: {
    alignItems: 'center',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(87, 192, 196, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
