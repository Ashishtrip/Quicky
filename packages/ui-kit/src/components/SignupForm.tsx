import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Spacing, Colors, Typography } from '../theme/tokens';

export interface ExtraField {
  id: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export interface SignupFormProps {
  onSubmit: (data: Record<string, string>) => void;
  extraFields?: ExtraField[];
  onNavigateToLogin?: () => void;
  isLoading?: boolean;
}

export const SignupForm = ({ onSubmit, extraFields = [], onNavigateToLogin, isLoading }: SignupFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    email: '',
    password: '',
  });

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const isFormValid = formData['email'] && formData['password'] && extraFields.every(field => formData[field.id]);

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={formData['email']}
        onChangeText={(val) => handleChange('email', val)}
      />
      
      <TextInput
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={formData['password']}
        onChangeText={(val) => handleChange('password', val)}
      />

      {extraFields.map(field => (
        <TextInput
          key={field.id}
          label={field.label}
          placeholder={field.placeholder}
          keyboardType={field.keyboardType || 'default'}
          value={formData[field.id] || ''}
          onChangeText={(val) => handleChange(field.id, val)}
        />
      ))}

      <Button
        title={isLoading ? 'Signing up...' : 'Sign Up'}
        onPress={() => onSubmit(formData)}
        disabled={isLoading || !isFormValid}
        style={styles.submitButton}
      />

      {onNavigateToLogin && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text style={styles.footerLink}>Login</Text>
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
