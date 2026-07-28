import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radii, AddressCard, Button, TextInput } from '@quicky/ui-kit';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useAddresses, useAddAddress, useDeleteAddress, Address } from '@quicky/api-client';

import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const ManageAddressesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: addresses, isLoading } = useAddresses(user?.uid || '');
  const addAddressMutation = useAddAddress();
  const deleteAddressMutation = useDeleteAddress();
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const handleSaveAddress = () => {
    if (!user?.uid) return;
    addAddressMutation.mutate(
      {
        userId: user.uid,
        ...newAddress,
      },
      {
        onSuccess: () => {
          setAddModalVisible(false);
          setNewAddress({
            label: 'Home',
            street: '',
            city: '',
            state: '',
            pincode: '',
            isDefault: false,
            latitude: undefined,
            longitude: undefined,
          });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!user?.uid) return;
    deleteAddressMutation.mutate({ id, userId: user.uid });
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use this feature.');
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode) {
        setNewAddress(prev => ({
          ...prev,
          street: geocode.street || geocode.name || '',
          city: geocode.city || geocode.subregion || '',
          state: geocode.region || '',
          pincode: geocode.postalCode || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        setAddModalVisible(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.container}
          ListHeaderComponent={
            <>
              <Button 
                title={isLocating ? "Locating..." : "Use Current Location"} 
                variant="secondary" 
                icon={<Feather name="navigation" size={18} color={Colors.primary} style={{ marginRight: Spacing.sm }} />}
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
              />
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="map" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No saved addresses yet</Text>
            </View>
          }
          renderItem={({ item: address }) => (
            <AddressCard
              label={address.label}
              addressText={`${address.street}, ${address.city}, ${address.state} ${address.pincode}`}
              isDefault={address.isDefault}
              onDelete={() => handleDelete(address.id)}
              onSelect={() => {}}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Button 
          title="+ Add New Address" 
          onPress={() => setAddModalVisible(true)} 
        />
      </View>

      {/* Add Address Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput 
                label="Label (Home, Work, etc.)"
                value={newAddress.label}
                onChangeText={(t) => setNewAddress({...newAddress, label: t})}
                placeholder="e.g. Home"
              />
              <TextInput 
                label="Street / House No."
                value={newAddress.street}
                onChangeText={(t) => setNewAddress({...newAddress, street: t})}
                placeholder="e.g. 123 Main St"
              />
              <TextInput 
                label="City"
                value={newAddress.city}
                onChangeText={(t) => setNewAddress({...newAddress, city: t})}
                placeholder="e.g. New Delhi"
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <TextInput 
                    label="State"
                    value={newAddress.state}
                    onChangeText={(t) => setNewAddress({...newAddress, state: t})}
                    placeholder="Delhi"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput 
                    label="Pincode"
                    value={newAddress.pincode}
                    onChangeText={(t) => setNewAddress({...newAddress, pincode: t})}
                    keyboardType="number-pad"
                    placeholder="110001"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button 
                title="Save Address" 
                onPress={handleSaveAddress}
                disabled={!newAddress.street || !newAddress.city || !newAddress.pincode || addAddressMutation.isPending}
                loading={addAddressMutation.isPending}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  locationButton: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#bdc9c9', // outline-variant
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  modalForm: {
    padding: Spacing.md,
    backgroundColor: '#f6fafa', // surface-bright equivalent or background
  },
  row: {
    flexDirection: 'row',
  },
  modalFooter: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.surface,
  },
});
