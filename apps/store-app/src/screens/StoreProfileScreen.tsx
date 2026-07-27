import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Animated, PanResponder, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import auth from '@react-native-firebase/auth';
import { useStoreData } from '../hooks/useStoreData';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, Accuracy } from 'expo-location';
// @ts-ignore
import { reverseGeocodeAsync } from 'expo-location';
import { Alert } from 'react-native';

const COLORS = {
  surface: '#f6fafa',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  tertiary: '#8b4b55',
  tertiaryContainer: '#ea9ba5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainerHigh: '#e4e9e9',
  outlineVariant: '#bdc9c9',
  primaryContainer: '#57c0c4',
  verifiedBg: 'rgba(231, 212, 127, 0.2)',
  verifiedText: '#576c10',
  starText: '#E7D47F',
  success: '#516607',
  error: '#ba1a1a',
  surfaceVariant: '#dfe3e3'
};

const CustomAnimatedSlider = ({ value, minimumValue, maximumValue, step, onSlidingComplete }: any) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const currentVal = useRef(0);

  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  useEffect(() => {
    if (sliderWidth > 0) {
      const percentage = (value - minimumValue) / (maximumValue - minimumValue);
      const px = percentage * sliderWidth;
      pan.setValue(px);
      currentVal.current = px;
    }
  }, [value, sliderWidth, minimumValue, maximumValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(currentVal.current);
        pan.setValue(0);
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }).start();

        const width = sliderWidthRef.current;
        let newX = currentVal.current + gestureState.dx;
        
        if (newX < 0) newX = 0;
        if (newX > width) newX = width;

        let finalValue = minimumValue;
        if (width > 0) {
          const percentage = newX / width;
          const rawValue = minimumValue + percentage * (maximumValue - minimumValue);
          const steps = Math.round(rawValue / step);
          finalValue = steps * step;
          
          if (finalValue < minimumValue) finalValue = minimumValue;
          if (finalValue > maximumValue) finalValue = maximumValue;
        }

        const finalPercentage = (finalValue - minimumValue) / (maximumValue - minimumValue);
        const finalX = width > 0 ? finalPercentage * width : 0;
        
        currentVal.current = finalX;

        Animated.spring(pan, {
          toValue: finalX,
          useNativeDriver: false,
        }).start();

        onSlidingComplete(finalValue);
      },
    })
  ).current;

  return (
    <View 
      style={styles.customSliderWrapper} 
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.customSliderTrack} />
      <Animated.View 
        style={[
          styles.customSliderFill, 
          { width: sliderWidth > 0 ? pan.interpolate({
              inputRange: [0, sliderWidth],
              outputRange: [12, sliderWidth + 12],
              extrapolate: 'clamp'
            }) : 12 }
        ]} 
      />
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.customSliderThumb,
          { transform: [
              { translateX: sliderWidth > 0 ? pan.interpolate({
                  inputRange: [0, sliderWidth],
                  outputRange: [0, sliderWidth],
                  extrapolate: 'clamp'
                }) : pan 
              }, 
              { scale }
            ] 
          },
        ]}
      />
    </View>
  );
};

export const StoreProfileScreen = () => {
  const { user } = useAuthStore();
  const { storeData, loading, updateStore } = useStoreData();
  const navigation = useNavigation<any>();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState<number | undefined>(undefined);
  const [editLng, setEditLng] = useState<number | undefined>(undefined);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await requestForegroundPermissionsAsync();
      
      let lat: number | null = null;
      let lng: number | null = null;
      let location = null;

      if (status === 'granted') {
        try {
          location = await getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
          if (location) {
            lat = location.coords.latitude;
            lng = location.coords.longitude;
          }
        } catch (err) {
          console.warn('getCurrentPositionAsync failed', err);
        }
      }

      if (__DEV__) {
        lat = 28.7495;
        lng = 77.0565;
      }

      if (lat === null || lng === null) {
        Alert.alert('Permission denied', 'Allow Quicky to access your location in settings to use this feature.');
        setIsFetchingLocation(false);
        return;
      }

      const geocode = await reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addressParts = [
          place.street,
          place.district || place.city,
          place.region,
          place.postalCode
        ].filter(Boolean);
        
        setEditAddress(addressParts.join(', '));
        setEditLat(lat);
        setEditLng(lng);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Could not fetch your current location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  useEffect(() => {
    if (storeData) {
      setEditName(storeData.name || '');
      setEditAddress(storeData.address || '');
      if (storeData.latitude) setEditLat(storeData.latitude);
      if (storeData.longitude) setEditLng(storeData.longitude);
    }
  }, [storeData]);

  const handleSave = async () => {
    try {
      await updateStore({ 
        name: editName, 
        address: editAddress,
        latitude: editLat,
        longitude: editLng
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const radiusKm = ((storeData?.deliveryRadius || 2500) / 1000).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          style={({pressed}) => [styles.headerIconButton, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('Dashboard' as any)}
        >
          <MaterialIcons name="storefront" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Quicky</Text>
        <Pressable 
          style={({pressed}) => [styles.headerIconButton, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('Notifications' as any)}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
             <Image 
               source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3keGekIBVi_RqHhy0VL2sAUAV_LfWD4mn9zyVcgJQuBpWHCYp4DaDHF66FzDoL686RXTqFgQrcglUiXnGy2Eo4w9EzfAcI_VlcikKIb7zF5vqEZ-oASicYbQA66tB3b02GcEjevIw4t8pOXkphO2IinNVyilm35v-pgZwiKG84ZQs-cQLkf_sAqmq9DNZi2muTzdTlne3-6hKt60_vpmpHkmsKRiKux3yf-etvrW5rzl9_C-MGRyBPX4n-xFjJkMB0k3CgaiNV3Q8' }} 
               style={styles.profileImage} 
             />
            <Pressable style={styles.editBadge} onPress={() => setIsEditing(!isEditing)}>
              <MaterialIcons name="edit" size={16} color={COLORS.primary} />
            </Pressable>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.editInputTitle}
              value={editName}
              onChangeText={setEditName}
              placeholder="Store Name"
            />
          ) : (
            <Text style={styles.storeName}>{storeData?.name || 'Your Store'}</Text>
          )}
          
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={16} color={COLORS.verifiedText} />
            <Text style={styles.verifiedText}>Verified Freshness Partner</Text>
          </View>

          <View style={styles.ratingCard}>
            <Text style={styles.ratingScore}>4.8</Text>
            <View style={styles.ratingMeta}>
              <MaterialIcons name="star" size={18} color={COLORS.starText} />
              <Text style={styles.ratingCount}>(124 ratings)</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <MaterialIcons name="location-on" size={18} color={COLORS.primary} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Store Location</Text>
              </View>
              <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
                <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
            </View>
            
            {isEditing ? (
              <View style={styles.cardBodyOverlay}>
                <TextInput
                  style={styles.editInputAddress}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline
                  placeholder="Store Address"
                />
                <Pressable 
                  style={[styles.locationButton, isFetchingLocation && { opacity: 0.7 }]} 
                  onPress={handleGetLocation}
                  disabled={isFetchingLocation}
                >
                  {isFetchingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <MaterialIcons name="my-location" size={14} color={COLORS.primary} style={styles.locationButtonIcon} />
                      <Text style={styles.locationButtonText}>Use Current Location</Text>
                    </>
                  )}
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cardBodyOverlay}>
                <Text style={styles.cardBodyText}>
                  {storeData?.address || 'Address not set'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <MaterialIcons name="schedule" size={18} color={COLORS.primary} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Operating Hours</Text>
              </View>
              <Pressable style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>
            <View style={styles.hoursContainer}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>Mon-Fri</Text>
                <Text style={styles.hoursValue}>7am - 10pm</Text>
              </View>
              <View style={[styles.hoursRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.hoursLabel}>Sat-Sun</Text>
                <Text style={styles.hoursValue}>8am - 11pm</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.fullCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialIcons name="local-shipping" size={18} color={COLORS.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Delivery Radius</Text>
            </View>
            <View style={styles.radiusBadge}>
              <Text style={styles.radiusBadgeText}>{radiusKm} km</Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <CustomAnimatedSlider
              minimumValue={0}
              maximumValue={3500}
              step={500}
              value={storeData?.deliveryRadius || 3500}
              onSlidingComplete={(val: number) => updateStore({ deliveryRadius: val })}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>0 km</Text>
              <Text style={styles.sliderLabelText}>3.5 km</Text>
            </View>
          </View>
        </View>

        <View style={styles.fullCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialIcons name="support-agent" size={18} color={COLORS.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Support & Settings</Text>
            </View>
          </View>
          <View style={styles.settingsList}>
            <Pressable style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={styles.settingsIconContainer}>
                  <MaterialIcons name="call" size={20} color={COLORS.onSurfaceVariant} />
                </View>
                <Text style={styles.settingsItemText}>Partner Support</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.outlineVariant} />
            </Pressable>
            <Pressable style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={styles.settingsIconContainer}>
                  <MaterialIcons name="settings" size={20} color={COLORS.onSurfaceVariant} />
                </View>
                <Text style={styles.settingsItemText}>App Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.outlineVariant} />
            </Pressable>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={COLORS.tertiary} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    width: 128,
    height: 128,
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  editInputTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderColor: COLORS.primaryContainer,
    textAlign: 'center',
    minWidth: 200,
    paddingVertical: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verifiedBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.verifiedText,
    marginLeft: 4,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingScore: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 8,
  },
  ratingMeta: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  fullCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    zIndex: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardBodyOverlay: {
    zIndex: 2,
  },
  cardBodyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    lineHeight: 24,
  },
  hoursContainer: {
    marginTop: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + '4D',
  },
  hoursLabel: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  radiusBadge: {
    backgroundColor: 'rgba(87, 192, 196, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  radiusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  settingsList: {
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  editInputAddress: {
    fontSize: 14,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 60,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(87, 192, 196, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationButtonIcon: {
    marginRight: 6,
  },
  locationButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sliderContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabelText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  customSliderWrapper: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  customSliderTrack: {
    height: 8,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 4,
    width: '100%',
    position: 'absolute',
  },
  customSliderFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    position: 'absolute',
    left: 0,
  },
  customSliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
    marginLeft: 8,
  }
});
