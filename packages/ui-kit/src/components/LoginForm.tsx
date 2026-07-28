import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Spacing, Colors, Typography } from '../theme/tokens';

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onNavigateToSignup?: () => void;
  isLoading?: boolean;
}

export const LoginForm = ({ onSubmit, onNavigateToSignup, isLoading }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={isLoading ? 'Logging in...' : 'Login'}
        onPress={() => onSubmit(email, password)}
        disabled={isLoading || !email || !password}
        loading={isLoading}
        style={styles.submitButton}
      />

      {onNavigateToSignup && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignup} disabled={isLoading}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.bodyLarge,
    color: Colors.accent,
    fontWeight: '600',
  },
});
