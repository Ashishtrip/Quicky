import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../index';
import { uploadProductImage } from '../services/firebaseProducts';
import { useAuthStore } from '../stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTagging } from '../hooks/useTagging';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddCustomProduct'>;

const COLORS = {
  surface: '#f6fafa',
  surfaceDim: '#d6dbdb',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  primaryFixedDim: '#6fd6da',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  secondaryContainer: '#d3ed84',
  onSecondaryContainer: '#576c10',
  tertiaryContainer: '#ea9ba5',
  onTertiaryContainer: '#6b313b',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainerHigh: '#e4e9e9',
  surfaceVariant: '#dfe3e3',
  outlineVariant: '#bdc9c9',
  outline: '#6d797a',
  background: '#f6fafa',
  onBackground: '#171c1d',
};

export const AddCustomProductScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [freshness, setFreshness] = useState('fresh');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync } = useTagging();

  const incrementQuantity = () => {
    const val = parseInt(quantity) || 0;
    setQuantity((val + 1).toString());
  };

  const decrementQuantity = () => {
    const val = parseInt(quantity) || 0;
    if (val > 0) setQuantity((val - 1).toString());
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri && asset?.base64) {
      setImageUri(asset.uri);
      setImageBase64(asset.base64);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri && asset?.base64) {
      setImageUri(asset.uri);
      setImageBase64(asset.base64);
    }
  };

  const selectImageSource = () => {
    Alert.alert(
      'Upload Photo',
      'Choose a photo source',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    
    if (!quantity.trim() || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Valid quantity is required');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Error', 'Price is required');
      return;
    }

    if (!imageBase64 || !imageUri) {
      Alert.alert('Error', 'Please provide an image for the product');
      return;
    }

    setIsSubmitting(true);
    try {
      const storeId = useAuthStore.getState().user!.uid;
      
      const downloadUrl = await uploadProductImage(storeId, imageBase64);
      
      const customItemId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      await mutateAsync({
        catalogItemId: `custom_${customItemId}`,
        price: Number(price.trim()),
        stockQuantity: Number(quantity.trim()),
        expiryBucket: freshness === 'fresh' ? 'FRESH_STOCK' : 'USE_TODAY',
        isCustom: true,
        name: name.trim(),
        unit,
        imageUrl: downloadUrl,
      });
      
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Product</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Image Upload Section */}
          <Pressable 
            style={({pressed}) => [styles.imageUploadBox, pressed && styles.imageUploadBoxPressed]}
            onPress={selectImageSource}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <>
                <View style={styles.cameraIconContainer}>
                  <MaterialIcons name="add-a-photo" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload Product Photo</Text>
                <Text style={styles.uploadSubtitle}>PNG, JPG up to 5MB</Text>
              </>
            )}
          </Pressable>

          <View style={styles.formSection}>
            {/* Product Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Organic Red Apples"
                placeholderTextColor={COLORS.outline}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Category" value="" color={COLORS.outline} />
                  <Picker.Item label="Fruits & Vegetables" value="fruits" />
                  <Picker.Item label="Dairy" value="dairy" />
                  <Picker.Item label="Bakery" value="bakery" />
                  <Picker.Item label="Meat & Poultry" value="meat" />
                </Picker>
              </View>
            </View>

            {/* Quantity / Unit */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Quantity / Unit</Text>
              <View style={styles.row}>
                {/* Numeric Input */}
                <View style={styles.quantityContainer}>
                  <Pressable style={styles.qtyButton} onPress={decrementQuantity}>
                    <MaterialIcons name="remove" size={24} color={COLORS.primary} />
                  </Pressable>
                  <TextInput
                    style={styles.qtyInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <Pressable style={styles.qtyButton} onPress={incrementQuantity}>
                    <MaterialIcons name="add" size={24} color={COLORS.primary} />
                  </Pressable>
                </View>

                {/* Unit Dropdown */}
                <View style={[styles.pickerContainer, styles.unitPickerContainer]}>
                  <Picker
                    selectedValue={unit}
                    onValueChange={(itemValue) => setUnit(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="kg" value="kg" />
                    <Picker.Item label="g" value="g" />
                    <Picker.Item label="pcs" value="pcs" />
                    <Picker.Item label="units" value="units" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Freshness Status */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Freshness Status</Text>
              <View style={styles.row}>
                <Pressable 
                  style={[styles.pillToggle, freshness === 'fresh' && styles.pillToggleActiveFresh]}
                  onPress={() => setFreshness('fresh')}
                >
                  <MaterialIcons name="eco" size={20} color={freshness === 'fresh' ? COLORS.onSecondaryContainer : COLORS.onSurfaceVariant} style={styles.pillIcon} />
                  <Text style={[styles.pillText, freshness === 'fresh' && styles.pillTextActiveFresh]}>Fresh Stock</Text>
                </Pressable>

                <View style={{width: 12}} />

                <Pressable 
                  style={[styles.pillToggle, freshness === 'use_today' && styles.pillToggleActiveUseToday]}
                  onPress={() => setFreshness('use_today')}
                >
                  <MaterialIcons name="schedule" size={20} color={freshness === 'use_today' ? COLORS.onTertiaryContainer : COLORS.onSurfaceVariant} style={styles.pillIcon} />
                  <Text style={[styles.pillText, freshness === 'use_today' && styles.pillTextActiveUseToday]}>Use Today</Text>
                </Pressable>
              </View>
            </View>

            {/* Price */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Selling Price</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.outline}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.fabContainer}>
          <Pressable 
            style={({pressed}) => [styles.fab, (pressed || isSubmitting) && styles.fabPressed]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.onPrimaryContainer} />
            ) : (
              <Text style={styles.fabText}>List Product</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginLeft: -8,
    marginRight: 12,
  },
  backButtonPressed: {
    backgroundColor: COLORS.surfaceVariant,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: COLORS.primary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  imageUploadBox: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  imageUploadBoxPressed: {
    backgroundColor: COLORS.surfaceVariant,
    transform: [{ scale: 0.98 }],
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  uploadSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 4,
  },
  formSection: {
    gap: 16,
  },
  fieldContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.onSurface,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.onSurface,
  },
  pickerContainer: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 48,
    color: COLORS.onSurface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  quantityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    height: '100%',
    marginRight: 12,
  },
  qtyButton: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  qtyInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.onSurface,
    padding: 0,
    margin: 0,
  },
  unitPickerContainer: {
    width: '33%',
  },
  pillToggle: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillIcon: {
    marginRight: 8,
  },
  pillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  pillToggleActiveFresh: {
    backgroundColor: COLORS.secondaryContainer,
    borderColor: COLORS.secondaryContainer,
    shadowOpacity: 0,
    elevation: 0,
  },
  pillTextActiveFresh: {
    color: COLORS.onSecondaryContainer,
  },
  pillToggleActiveUseToday: {
    backgroundColor: COLORS.tertiaryContainer,
    borderColor: COLORS.tertiaryContainer,
    shadowOpacity: 0,
    elevation: 0,
  },
  pillTextActiveUseToday: {
    color: COLORS.onTertiaryContainer,
  },
  priceInputContainer: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
  },
  currencySymbol: {
    paddingLeft: 16,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: COLORS.onSurfaceVariant,
  },
  priceInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.onSurface,
  },
  bottomSpacer: {
    height: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  fab: {
    width: '100%',
    maxWidth: 400,
    height: 48,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: COLORS.onPrimaryContainer,
  }
});
