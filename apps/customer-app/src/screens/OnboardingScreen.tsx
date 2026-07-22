import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@quicky/ui-kit';
import { TextInput, SelectDropdown, RadioGroup, DatePicker } from '@quicky/ui-kit';
import { useAuthStore } from '../stores/authStore';
import firestore from '@react-native-firebase/firestore';

const STATE_OPTIONS = [
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Karnataka', value: 'Karnataka' },
  // add more as needed
];

export const OnboardingScreen = () => {
  const { user, setIsOnboarded } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    gender: '',
    email: user?.email || '',
    dob: undefined as Date | undefined,
    houseNo: '',
    area: '',
    city: '',
    state: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.gender) return 'Gender is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.dob) return 'Date of Birth is required';
    if (!formData.houseNo.trim()) return 'House No. is required';
    if (!formData.area.trim()) return 'Area is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state) return 'State is required';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) return;

    setError('');
    setIsLoading(true);

    try {
      await firestore().collection('users').doc(user.uid).set({
        ...formData,
        dob: formData.dob?.toISOString(),
        role: 'customer',
        isOnboarded: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      
      setIsOnboarded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself to get started.</Text>

        <TextInput
          label="Full Name"
          placeholder="Enter your name"
          value={formData.name}
          onChangeText={(text: string) => handleChange('name', text)}
        />

        <TextInput
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text: string) => handleChange('phone', text)}
        />

        <TextInput
          label="Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text: string) => handleChange('email', text)}
        />

        <RadioGroup
          label="Gender"
          options={[
            { id: 'male', label: 'Male' },
            { id: 'female', label: 'Female' },
            { id: 'other', label: 'Other' },
          ]}
          selectedValue={formData.gender}
          onValueChange={(val: string) => handleChange('gender', val)}
        />

        <DatePicker
          label="Date of Birth"
          value={formData.dob}
          onChange={(date: Date) => handleChange('dob', date)}
        />

        <Text style={styles.sectionTitle}>Location Details</Text>

        <TextInput
          label="House No. / Building"
          placeholder="e.g. 12A, XYZ Apartments"
          value={formData.houseNo}
          onChangeText={(text: string) => handleChange('houseNo', text)}
        />

        <TextInput
          label="Area / Sector"
          placeholder="e.g. Sector 18"
          value={formData.area}
          onChangeText={(text: string) => handleChange('area', text)}
        />

        <TextInput
          label="City"
          placeholder="e.g. New Delhi"
          value={formData.city}
          onChangeText={(text: string) => handleChange('city', text)}
        />

        <SelectDropdown
          label="State"
          placeholder="Select State"
          options={STATE_OPTIONS}
          selectedValue={formData.state}
          onValueChange={(val: string) => handleChange('state', val)}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Submit & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.bodyLarge,
    color: Colors.surface,
    fontWeight: 'bold',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
