import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radii, TextInput, Button, RadioGroup, DatePicker, SelectDropdown } from '@quicky/ui-kit';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';
import { ActivityIndicator, Alert } from 'react-native';

const STATE_OPTIONS = [
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Karnataka', value: 'Karnataka' },
];

export const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    gender: '',
    dob: undefined as Date | undefined,
    houseNo: '',
    area: '',
    city: '',
    state: '',
  });

  const queryClient = useQueryClient();
  
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const doc = await firestore().collection('users').doc(user.uid).get();
      const data = doc.data();
      if (!data) return null;
      return {
        name: data['name'] as string,
        phone: data['phone'] as string,
        email: data['email'] as string,
        gender: data['gender'] as string,
        dob: data['dob'] ? new Date(data['dob']) : undefined,
        houseNo: data['houseNo'] as string,
        area: data['area'] as string,
        city: data['city'] as string,
        state: data['state'] as string,
      };
    },
    enabled: !!user?.uid,
  });

  const updateUserProfile = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const payload = { ...data };
      if (payload.dob) {
        payload.dob = payload.dob.toISOString();
      }
      await firestore().collection('users').doc(user.uid).set({
        ...payload,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    }
  });

  // Pre-fill form data when profile is loaded
  React.useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        phone: userProfile.phone || prev.phone,
        email: userProfile.email || prev.email,
        gender: userProfile.gender || prev.gender,
        dob: userProfile.dob || prev.dob,
        houseNo: userProfile.houseNo || prev.houseNo,
        area: userProfile.area || prev.area,
        city: userProfile.city || prev.city,
        state: userProfile.state || prev.state,
      }));
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to save your profile.');
      return;
    }

    try {
      await updateUserProfile.mutateAsync(formData);

      // optionally update the firebase user profile displayName
      if (user.updateProfile) {
        await user.updateProfile({ displayName: formData.name });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>Complete your profile to get the best experience</Text>


        <View style={styles.formContainer}>
          <TextInput 
            label="Full Name"
            value={formData.name}
            onChangeText={(text: string) => setFormData({...formData, name: text})}
            placeholder="John Doe"
          />
          <TextInput 
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text: string) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
            placeholder="+91 9876543210"
          />
          <TextInput 
            label="Email Address (Optional)"
            value={formData.email}
            onChangeText={(text: string) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="john@example.com"
          />
          <RadioGroup
            label="Gender"
            options={[
              { id: 'male', label: 'Male' },
              { id: 'female', label: 'Female' },
              { id: 'other', label: 'Other' },
            ]}
            selectedValue={formData.gender}
            onValueChange={(val: string) => setFormData({...formData, gender: val})}
          />
          <DatePicker
            label="Date of Birth"
            value={formData.dob}
            onChange={(date: Date) => setFormData({...formData, dob: date})}
          />
          <Text style={[styles.title, { fontSize: 18, marginTop: Spacing.xl }]}>Location Details</Text>
          <TextInput
            label="House No. / Building"
            placeholder="e.g. 12A, XYZ Apartments"
            value={formData.houseNo}
            onChangeText={(text: string) => setFormData({...formData, houseNo: text})}
          />
          <TextInput
            label="Area / Sector"
            placeholder="e.g. Sector 18"
            value={formData.area}
            onChangeText={(text: string) => setFormData({...formData, area: text})}
          />
          <TextInput
            label="City"
            placeholder="e.g. New Delhi"
            value={formData.city}
            onChangeText={(text: string) => setFormData({...formData, city: text})}
          />
          <SelectDropdown
            label="State"
            options={STATE_OPTIONS}
            selectedValue={formData.state}
            onValueChange={(val: string) => setFormData({...formData, state: val})}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={updateUserProfile.isPending ? "Saving..." : "Save Profile"}
          onPress={handleSave}
          disabled={!formData.name || !formData.phone || updateUserProfile.isPending}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  formContainer: {
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#bdc9c9', // outline-variant
  },
});
