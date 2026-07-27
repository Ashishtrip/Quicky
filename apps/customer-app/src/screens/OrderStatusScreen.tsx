import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii } from '@quicky/ui-kit';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userSocket } from '../services/socket';
import { OrderResult, useCancelOrder } from '@quicky/api-client';
import { useAuthStore } from '../stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';
import { ROHINI_LAT, ROHINI_LNG } from '../hooks/useProductFilters';

type OrderStatusRouteProp = RouteProp<RootStackParamList, 'OrderStatus'>;

export function OrderStatusScreen() {
  const route = useRoute<OrderStatusRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orderId, initialStatus, initialOrderData } = route.params as any;
  const { user } = useAuthStore();

  const [orderData, setOrderData] = useState<OrderResult | null>(initialOrderData || null);
  const [pulseAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    userSocket.connect(user!.uid);

    let isDone = false;

    // Start 60-second progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 60000,
      easing: Easing.linear,
      useNativeDriver: false, // width animation requires false
    }).start(({ finished }) => {
      if (finished && !isDone) {
        // Timeout reached without acceptance
        isDone = true;
        setHasFailed(true);
        import('react-native').then(({ Alert }) => {
          Alert.alert(
            'Fail to Find Store', 
            'Try Again Later', 
            [{ text: 'OK', onPress: () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs' as any) }]
          );
        });
      }
    });

    const handleAcceptance = (payload: OrderResult) => {
      if (payload.id === orderId && !isDone) {
        isDone = true;
        progressAnim.stopAnimation();
        // Jump to 100%
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start(() => {
          // Navigate to My Orders (OrdersScreen tab)
          setTimeout(() => {
             navigation.navigate('MainTabs' as any, { screen: 'Orders' } as any);
          }, 300);
        });
      }
    };

    const unsubscribeAccepted = userSocket.subscribe('order-accepted', handleAcceptance);
    
    const unsubscribeStatusChanged = userSocket.subscribe('order-status-changed', (payload: OrderResult) => {
      if (payload.id === orderId && payload.status && payload.status !== 'PLACED' && payload.status !== 'PENDING') {
         handleAcceptance(payload);
      }
    });

    const unsubscribeExpired = userSocket.subscribe('order-expired', (payload: OrderResult) => {
      if (payload.id === orderId && !isDone) {
        isDone = true;
        progressAnim.stopAnimation();
        setHasFailed(true);
        import('react-native').then(({ Alert }) => {
          Alert.alert(
            'Fail to Find Store', 
            'Try Again Later', 
            [{ text: 'OK', onPress: () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs' as any) }]
          );
        });
      }
    });

    return () => {
      unsubscribeAccepted();
      unsubscribeStatusChanged();
      unsubscribeExpired();
      progressAnim.stopAnimation();
      userSocket.disconnect();
    };
  }, [orderId, navigation, progressAnim, user]);

  const customerLat = orderData?.lat || ROHINI_LAT;
  const customerLng = orderData?.lng || ROHINI_LNG;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3]
  });
  
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0]
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={[styles.map, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialIcons name="map" size={64} color={Colors.outline} />
          <Text style={{ marginTop: 8, color: Colors.outline, fontFamily: Typography.bodySmall.fontFamily }}>Map Placeholder</Text>
        </View>
        
        <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
          <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs' as any)} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.surface} />
          </Pressable>
        </SafeAreaView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Processing your order ticket</Text>
          <Text style={styles.subtitle}>Finding the fastest store nearby...</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>Searching</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafa', // surface-dim equivalent
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  storePinInactive: {
    width: 32,
    height: 32,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#bdc9c9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  userPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#57c0c4',
  },
  userPin: {
    width: 48,
    height: 48,
    backgroundColor: '#57c0c4',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 30,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(189, 201, 201, 0.4)',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171c1d',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#3d4949',
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    backgroundColor: '#dfe3e3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '30%',
    backgroundColor: '#57c0c4',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  progressLabelLeft: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6d797a',
    letterSpacing: 0.5,
  }
});
