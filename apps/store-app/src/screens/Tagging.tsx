import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable, Image, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../index';
import { useTagging, useDeleteListing } from '../hooks/useTagging';

type Bucket = 'FRESH_STOCK' | 'USE_TODAY';

type Props = NativeStackScreenProps<RootStackParamList, 'Tagging'>;

const COLORS = {
  background: '#f6fafa',
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainer: '#eaefee',
  surfaceContainerHigh: '#e4e9e9',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  secondary: '#516607',
  secondaryContainer: '#d3ed84',
  onSecondaryContainer: '#161e00',
  tertiary: '#8b4b55',
  tertiaryContainer: '#ea9ba5',
  onTertiaryContainer: '#390a14',
  outlineVariant: '#bdc9c9',
};

export const TaggingScreen = ({ route, navigation }: Props) => {
  const { catalogItemId, name, price: referenceMrp, listingId } = route.params;
  const { mutate, isPending } = useTagging();
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const [quantity, setQuantity] = useState(1);
  const [bucket, setBucket] = useState<Bucket>('FRESH_STOCK');
  const [mfgDate, setMfgDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isIos = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const handleSubmit = () => {
    if (quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }
    
    mutate({
      catalogItemId,
      stockQuantity: quantity,
      expiryBucket: bucket,
      price: referenceMrp,
      isCustom: route.params.isCustom,
      name: name,
      unit: route.params.unit,
      imageUrl: route.params.imageUrl,
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Item listed successfully!');
        navigation.goBack();
      },
      onError: () => {
        Alert.alert('Error', 'Failed to list item.');
      }
    });
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <Pressable 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.iconText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tag Expiry</Text>
        <View style={styles.headerRight}>
          {listingId && (
            <Pressable 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  "Delete Item",
                  "Remove this item from your inventory?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Delete", 
                      style: "destructive", 
                      onPress: () => {
                        deleteListing(listingId, {
                          onSuccess: () => {
                            Alert.alert('Success', 'Item removed from inventory.');
                            navigation.goBack();
                          },
                          onError: () => Alert.alert('Error', 'Failed to delete item.')
                        });
                      }
                    }
                  ]
                );
              }}
              disabled={isDeleting}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Context Card */}
        <View style={styles.productCard}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.imageIcon}>📦</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{name}</Text>
            <View style={styles.productMeta}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>Item {catalogItemId.slice(0, 4)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quantity Stepper */}
        <View style={styles.stepperSection}>
          <Text style={styles.sectionLabel}>ITEMS TO TAG</Text>
          <View style={styles.stepperContainer}>
            <Pressable 
              style={({pressed}) => [styles.stepperBtn, pressed && styles.pressed]} 
              onPress={handleDecrement}
            >
              <Text style={styles.stepperBtnIcon}>-</Text>
            </Pressable>
            
            <TextInput
              style={styles.stepperInput}
              keyboardType="numeric"
              value={quantity.toString()}
              onChangeText={(text) => {
                const val = parseInt(text, 10);
                setQuantity(isNaN(val) ? 0 : val);
              }}
            />
            
            <Pressable 
              style={({pressed}) => [styles.stepperBtnPrimary, pressed && styles.pressed]} 
              onPress={handleIncrement}
            >
              <Text style={styles.stepperBtnIconPrimary}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Condition Tags */}
        <View style={styles.tagsContainer}>
          <Pressable 
            style={({pressed}) => [
              styles.tagBtn, 
              styles.tagBtnTertiary, 
              bucket === 'USE_TODAY' && styles.tagBtnTertiarySelected,
              pressed && styles.pressed
            ]}
            onPress={() => setBucket('USE_TODAY')}
          >
            <Text style={styles.tagIconTertiary}>⚠️</Text>
            <Text style={styles.tagLabel}>USE TODAY</Text>
          </Pressable>
          
          <Pressable 
            style={({pressed}) => [
              styles.tagBtn, 
              styles.tagBtnSecondary, 
              bucket === 'FRESH_STOCK' && styles.tagBtnSecondarySelected,
              pressed && styles.pressed
            ]}
            onPress={() => setBucket('FRESH_STOCK')}
          >
            <Text style={styles.tagIconSecondary}>✅</Text>
            <Text style={styles.tagLabel}>FRESH STOCK</Text>
          </Pressable>
        </View>

        {/* Optional Date Field */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Mfg Date (Optional)</Text>
          <Pressable 
            style={styles.dateInputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={[styles.dateInputText, !mfgDate && styles.dateInputTextPlaceholder]}>
              {mfgDate ? mfgDate.toLocaleDateString() : 'Tap to set date'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={mfgDate || new Date()}
              mode="date"
              display={isIos ? 'spinner' : 'default'}
              maximumDate={new Date()} // Can't be in the future
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || mfgDate;
                if (isAndroid) {
                  setShowDatePicker(false);
                }
                if (event.type === 'set') {
                  setMfgDate(currentDate);
                } else if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
            />
          )}
          {isIos && showDatePicker ? (
            <Pressable style={styles.doneButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable 
          style={({pressed}) => [
            styles.saveButton, 
            pressed && styles.pressed,
            isPending && styles.saveButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.saveButtonIcon}>💾</Text>
          <Text style={styles.saveButtonText}>
            {isPending ? 'Saving...' : 'Save Tags'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconText: {
    fontSize: 20,
    color: COLORS.onSurfaceVariant,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
  },
  deleteIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom bar
  },
  productCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIcon: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  stepperSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 999,
    padding: 8,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 201, 0.2)', // outlineVariant with opacity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepperBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnIcon: {
    fontSize: 24,
    color: COLORS.onSurfaceVariant,
  },
  stepperBtnPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnIconPrimary: {
    fontSize: 24,
    color: COLORS.onPrimaryContainer,
  },
  stepperInput: {
    width: 60,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    padding: 0,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  tagBtn: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagBtnTertiary: {
    backgroundColor: '#FFF',
    borderColor: COLORS.tertiary,
  },
  tagBtnTertiarySelected: {
    backgroundColor: COLORS.tertiaryContainer,
    borderColor: COLORS.tertiary,
  },
  tagBtnSecondary: {
    backgroundColor: '#FFF',
    borderColor: COLORS.secondary,
  },
  tagBtnSecondarySelected: {
    backgroundColor: COLORS.secondaryContainer,
    borderColor: COLORS.secondary,
  },
  tagIconTertiary: {
    fontSize: 28,
    marginBottom: 8,
  },
  tagIconSecondary: {
    fontSize: 28,
    marginBottom: 8,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  dateSection: {
    marginTop: 24,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
    marginLeft: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 201, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  dateInputTextPlaceholder: {
    color: COLORS.onSurfaceVariant,
  },
  doneButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  saveButton: {
    height: 56,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonIcon: {
    fontSize: 20,
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  }
});
