import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Animated, PanResponder } from 'react-native';
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
  surfaceContainerLowest: '#ffffff',
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

  const numTicks = Math.round((maximumValue - minimumValue) / step);
  const ticks = Array.from({ length: numTicks + 1 }).map((_, i) => (i / numTicks) * 100);

  return (
    <View 
      style={styles.customSliderWrapper} 
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.customSliderTrack}>
        {ticks.map((tick, i) => (
          <View key={i} style={[styles.customSliderTick, { left: `${tick}%` }]} />
        ))}
      </View>
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
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGst, setEditGst] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState<number | undefined>(undefined);
  const [editLng, setEditLng] = useState<number | undefined>(undefined);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow Quicky to access your location in settings to use this feature.');
        setIsFetchingLocation(false);
        return;
      }

      let location = null;
      try {
        location = await getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
      } catch (err) {
        console.warn('getCurrentPositionAsync failed', err);
      }
      
      if (!location) {
        throw new Error('Location could not be determined');
      }

      const geocode = await reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
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
        setEditLat(location.coords.latitude);
        setEditLng(location.coords.longitude);
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
      setEditOwnerName(storeData.ownerName || '');
      setEditPhone(storeData.phone || '');
      setEditEmail(storeData.contactEmail || '');
      setEditGst(storeData.gstNumber || '');
      setEditAddress(storeData.address || '');
      if (storeData.latitude) setEditLat(storeData.latitude);
      if (storeData.longitude) setEditLng(storeData.longitude);
    }
  }, [storeData]);

  const handleSave = async () => {
    try {
      await updateStore({ 
        name: editName, 
        ownerName: editOwnerName,
        phone: editPhone,
        contactEmail: editEmail,
        gstNumber: editGst,
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

  const handleToggleStatus = (isOpen: boolean) => {
    if (storeData?.isOpen === isOpen) return;
    updateStore({ isOpen });
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
          <MaterialIcons name="storefront" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.headerTitle}>Quicky</Text>
        <Pressable 
          style={({pressed}) => [styles.headerIconButton, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('Notifications' as any)}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderImageText}>{storeData?.name?.[0]?.toUpperCase() || 'K'}</Text>
            </View>
            <Pressable style={styles.editBadge} onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editIcon}>{isEditing ? '✕' : '✏️'}</Text>
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
            <Text style={styles.verifiedIcon}>✓</Text>
            <Text style={styles.verifiedText}>Verified Freshness Partner</Text>
          </View>

          <View style={styles.ratingCard}>
            <Text style={styles.ratingScore}>4.8</Text>
            <View style={styles.ratingMeta}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.ratingCount}>(124 ratings)</Text>
            </View>
          </View>
        </View>

        {/* Store Details */}
        <View style={styles.fullCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={styles.cardTitle}>Store Details</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>
          
          {isEditing ? (
            <View>
              <TextInput
                style={styles.editInputDetail}
                value={editOwnerName}
                onChangeText={setEditOwnerName}
                placeholder="Owner Name"
              />
              <TextInput
                style={styles.editInputDetail}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.editInputDetail}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.editInputDetail}
                value={editGst}
                onChangeText={setEditGst}
                placeholder="GST Number"
                autoCapitalize="characters"
              />
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Details</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={styles.cardBodyText}>
                <Text style={{fontWeight: 'bold'}}>Owner: </Text>
                {storeData?.ownerName || 'Not specified'}
              </Text>
              <Text style={styles.cardBodyText}>
                <Text style={{fontWeight: 'bold'}}>Phone: </Text>
                {storeData?.phone || 'Not specified'}
              </Text>
              <Text style={styles.cardBodyText}>
                <Text style={{fontWeight: 'bold'}}>Email: </Text>
                {storeData?.contactEmail || 'Not specified'}
              </Text>
              <Text style={styles.cardBodyText}>
                <Text style={{fontWeight: 'bold'}}>GST: </Text>
                {storeData?.gstNumber || 'Not specified'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.gridContainer}>
          {/* Store Location */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>📍</Text>
                <Text style={styles.cardTitle}>Store Location</Text>
              </View>
              <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
                <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
            </View>
            
            {isEditing ? (
              <View>
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
                      <Text style={styles.locationButtonIcon}>📍</Text>
                      <Text style={styles.locationButtonText}>Use Current Location</Text>
                    </>
                  )}
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.cardBodyText}>
                {storeData?.address || 'Address not set'}
              </Text>
            )}
          </View>

          {/* Operating Status */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>🏪</Text>
                <Text style={styles.cardTitle}>Operating Status</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              If closed, no tickets will be raised to your store.
            </Text>
            
            <View style={styles.statusButtonsContainer}>
              <Pressable 
                style={[
                  styles.statusButton, 
                  styles.statusButtonLeft,
                  storeData?.isOpen ? styles.statusButtonActiveOpen : styles.statusButtonInactive
                ]}
                onPress={() => handleToggleStatus(true)}
              >
                <Text style={[
                  styles.statusButtonText,
                  storeData?.isOpen ? styles.statusButtonTextActive : styles.statusButtonTextInactive
                ]}>OPEN</Text>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.statusButton, 
                  styles.statusButtonRight,
                  !storeData?.isOpen ? styles.statusButtonActiveClosed : styles.statusButtonInactive
                ]}
                onPress={() => handleToggleStatus(false)}
              >
                <Text style={[
                  styles.statusButtonText,
                  !storeData?.isOpen ? styles.statusButtonTextActive : styles.statusButtonTextInactive
                ]}>CLOSED</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Delivery Radius */}
        <View style={styles.fullCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>🚚</Text>
              <Text style={styles.cardTitle}>Delivery Radius</Text>
            </View>
            <View style={styles.radiusBadge}>
              <Text style={styles.radiusBadgeText}>{radiusKm} km</Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <CustomAnimatedSlider
              minimumValue={250}
              maximumValue={2500}
              step={250}
              value={storeData?.deliveryRadius || 2500}
              onSlidingComplete={(val: number) => updateStore({ deliveryRadius: val })}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>0.25 km</Text>
              <Text style={styles.sliderLabelText}>2.5 km</Text>
            </View>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
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
  placeholderImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderImageText: {
    fontSize: 48,
    color: COLORS.onSurface,
    fontWeight: 'bold',
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
  editIcon: {
    fontSize: 14,
  },
  storeName: {
    fontSize: 28,
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
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  verifiedIcon: {
    color: COLORS.verifiedText,
    fontSize: 14,
    marginRight: 4,
    fontWeight: 'bold',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.verifiedText,
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
  },
  starIcon: {
    color: COLORS.starText,
    fontSize: 18,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
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
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  cardBodyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  editInputDetail: {
    fontSize: 14,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
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
    fontSize: 14,
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
  statusDescription: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 16,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: COLORS.outlineVariant,
  },
  statusButtonRight: {
  },
  statusButtonActiveOpen: {
    backgroundColor: COLORS.success,
  },
  statusButtonActiveClosed: {
    backgroundColor: COLORS.error,
  },
  statusButtonInactive: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusButtonTextActive: {
    color: COLORS.surfaceContainerLowest,
  },
  statusButtonTextInactive: {
    color: COLORS.onSurfaceVariant,
  },
  radiusBadge: {
    backgroundColor: 'rgba(87, 192, 196, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  radiusBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 8,
    paddingVertical: 16,
  },
  customSliderWrapper: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  customSliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
  },
  customSliderTick: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginLeft: -1,
  },
  customSliderFill: {
    position: 'absolute',
    left: 0,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  customSliderThumb: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  sliderLabelText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    minHeight: 48,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderRadius: 24,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
});

