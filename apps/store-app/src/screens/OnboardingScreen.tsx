import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { updateStoreProfile } from '@quicky/api-client';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, Accuracy } from 'expo-location';
// @ts-ignore
import { reverseGeocodeAsync } from 'expo-location';

const { width } = Dimensions.get('window');

const COLORS = {
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#eaefee',
  primary: '#00696c',
  onPrimary: '#ffffff',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceVariant: '#dfe3e3',
};

const SLIDES = [
  {
    id: 0,
    title: 'Reduce Waste, Boost Profit',
    description: 'Turn surplus inventory into instant sales before it expires. Smart algorithms match your stock with local demand.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAudC3LTQpNSAgEUnIEitmsL1lLBgrOfqgzXmnfdETdXOazrMvcwLZXwmiWZU8LgHvdIoNZ-A_pHlI8azWDO8uon_AGH6N2Jvw87hfjAynkV59eRQB6Zv-xdSP_FbxhouXkLRILPav_ZrBCZkZVpi-_EAmtTKwX342SKldQOCy6tE8b-b89FsKEkbDPm40p7e6vvtYpbyWqSmV31AmS1F8CjenyRqFgjn9NupDcD1mJJx25oIe2DxvEmoA9ZhGq4U6F0sKhbmJrJiTD',
  },
  {
    id: 1,
    title: 'Simple Order Management',
    description: 'Receive, pack, and hand off orders with a single tap. Designed for busy store environments with high contrast and clear actions.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiI14bXb3VI6OmbvvXahBJPbitpyUayMkP31IwaSymn5m_WHpxNDWZ7cWqaHwUbd2dSMZyY6LrMBIkWfycKtCNyHxM9xgHILrTI1aJ8HKZwm_02bA4_646uZHyJKvKlfoUZmJj2ja8LWKRYTIUJuTIRu95VdBfD1y9s22RocHTa5VhRSddTufkMmyrgqNaZ3c4jBNycQl8vY8g2CXu7R0ZdWWDpSCnrAH6xWrMXpZqrtKNXp9cP_Zr_iqCPMSuBOWPh6DnEl-cdpd-',
  },
  {
    id: 2,
    title: 'Seamless Handoffs',
    description: 'Coordinate effortlessly with riders. Real-time tracking ensures orders are picked up quickly and accurately.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFFplrUQZxBf4ZcdSAxJpPyNbCq759wdKCbVjb_IprgrtHqktzVyhRLuPM06pOyHQv7LKRnkZB5pMTnjyYMOXIEjY8rou1dgAk1A4rhJdMB335qWOlEdBC_XCNQnwWtCt0T46vYAyEMV1_bshBereFqNAI-Q4H4oir2GwHZrYwwYX4y-upbiYQxDt4kfusswNLqwvAcIvpNnnxJhRJEyhYRK8sFUrv2eQF86H0_9vmGBPP6TDLbhZjgWZMN8qlsXumOGBc061gUdE_',
  }
];

export const OnboardingScreen = () => {
  const { user, setIsOnboarded } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form State
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        setAddress(addressParts.join(', '));
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Could not fetch your current location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleComplete = async () => {
    if (!storeName || !address || !ownerName || !contactNumber) {
      Alert.alert('Missing Fields', 'Please fill out Store Name, Address, Owner Name, and Contact Number.');
      return;
    }
    
    setIsSubmitting(true);
    if (user) {
      try {
        let fcmToken = '';
        try {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
          if (enabled) {
            fcmToken = await messaging().getToken();
          }
        } catch (messagingErr) {
          console.warn('Could not request messaging token', messagingErr);
        }

        // Create in backend
        await updateStoreProfile(user.uid, {
          name: storeName,
          address,
          latitude: latitude || 28.7495,
          longitude: longitude || 77.0565,
          ownerName,
          phone: contactNumber,
          contactPhone: contactNumber,
          contactEmail: email,
          gstNumber,
          isOpen: false,
          deliveryRadius: 2500, // 2.5km default
          fcmToken: fcmToken || undefined,
        });

        // Create in Firestore
        await firestore().collection('stores').doc(user.uid).set({
          name: storeName,
          address,
          latitude: latitude || 28.7495,
          longitude: longitude || 77.0565,
          isOpen: false,
          deliveryRadius: 2500,
        }, { merge: true });

        // Record onboarding finish
        await firestore().collection('users').doc(user.uid).set({
          onboardedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        setIsOnboarded(true);
      } catch (e) {
        console.error("Error creating store", e);
        Alert.alert('Error', 'Failed to create your store. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const isSetupStep = currentSlide === SLIDES.length;
  const slide = isSetupStep ? null : SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Quicky</Text>
        {!isSetupStep && (
          <Pressable onPress={() => setCurrentSlide(SLIDES.length)} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isSetupStep ? (
          <ScrollView contentContainerStyle={styles.setupContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Set up your Store</Text>
            <Text style={styles.setupDescription}>Let's get your store ready to receive orders.</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Store Name *</Text>
              <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="e.g. Kalyan Kirana" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Owner Name *</Text>
              <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Full Name" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Number *</Text>
              <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} placeholder="Phone number" keyboardType="phone-pad" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GST Number (Optional)</Text>
              <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} placeholder="GSTIN" autoCapitalize="characters" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Store Address *</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={address} onChangeText={setAddress} placeholder="Full store address" multiline />
              
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
            </View>
          </ScrollView>
        ) : (
          <View style={styles.content}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: slide?.image }} style={styles.image} />
            </View>

            <Text style={styles.title}>{slide?.title}</Text>
            <Text style={styles.description}>{slide?.description}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {!isSetupStep && (
            <View style={styles.indicators}>
              {SLIDES.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.indicator, 
                    index === currentSlide ? styles.indicatorActive : styles.indicatorInactive
                  ]} 
                />
              ))}
              <View 
                style={[
                  styles.indicator, 
                  isSetupStep ? styles.indicatorActive : styles.indicatorInactive
                ]} 
              />
            </View>
          )}

          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isSubmitting && { opacity: 0.7 }
            ]} 
            onPress={isSetupStep ? handleComplete : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSetupStep ? 'Complete Setup' : 'Next'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: COLORS.surfaceVariant,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  setupContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  setupDescription: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(87, 192, 196, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  locationButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
