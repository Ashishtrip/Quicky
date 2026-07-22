import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';

const COLORS = {
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  primary: '#00696c',
  onPrimary: '#ffffff',
  onPrimaryFixedVariant: '#004f52',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceVariant: '#dfe3e3',
  outlineVariant: '#bdc9c9',
  outline: '#6d797a',
};

export const SignupScreen = ({ navigation }: any) => {
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !storeName || !fullName) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }
    
    try {
      setIsLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      await userCredential.user.updateProfile({
        displayName: `${storeName} - ${fullName}`,
      });
      // Navigation will be handled automatically by auth state change
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>🏪</Text>
          <Text style={styles.brandText}>Quicky</Text>
        </View>
        <Pressable style={styles.helpButton}>
          <Text style={styles.helpIcon}>❓</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressActive} />
            <View style={styles.progressInactive} />
            <Text style={styles.progressText}>Step 1 of 2</Text>
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Create your partner account</Text>
            <Text style={styles.subtitle}>Let's start with your basic details to set up your store profile.</Text>
          </View>

          <View style={styles.form}>
            {/* Store Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🏬</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Quicky Mart Downtown"
                  placeholderTextColor={COLORS.outline}
                  value={storeName}
                  onChangeText={setStoreName}
                />
              </View>
            </View>

            {/* Full Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane Doe"
                  placeholderTextColor={COLORS.outline}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email Field (replaces Mobile Number for Firebase compat) */}
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

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.outline}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Pressable 
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Text style={styles.primaryButtonIcon}>›</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                  Log in
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.trustBadges}>
            <Text style={styles.trustIcon}>✔️</Text>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustIcon}>🛡️</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    zIndex: 50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  helpButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  helpIcon: {
    fontSize: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressActive: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 8,
  },
  progressInactive: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 4,
    marginRight: 8,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  form: {
    flex: 1,
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.onSurface,
  },
  actionsContainer: {
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 8,
  },
  primaryButtonIcon: {
    color: COLORS.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: COLORS.onPrimaryFixedVariant,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    opacity: 0.6,
  },
  trustIcon: {
    fontSize: 24,
    marginHorizontal: 16,
  }
});
