import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii } from '@quicky/ui-kit';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userSocket } from '../services/socket';
import { OrderResult, useSubmitRating } from '@quicky/api-client';
import { useAuthStore } from '../stores/authStore';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

type OrderStatusRouteProp = RouteProp<RootStackParamList, 'OrderStatus'>;


export function OrderStatusScreen() {
  const route = useRoute<OrderStatusRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orderId } = route.params;
  const { user } = useAuthStore();

  const [status, setStatus] = useState<'FINDING_STORE' | 'ACCEPTED' | 'PACKED'>('FINDING_STORE');
  const [orderData, setOrderData] = useState<OrderResult | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const submitRatingMutation = useSubmitRating();
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCustomerLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        console.warn('Could not get customer location', e);
      }
    })();

    return () => {

      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    userSocket.connect(user!.uid);

    const unsubscribeAccepted = userSocket.subscribe('order-accepted', (payload: OrderResult) => {
      if (payload.id === orderId) {
        setStatus('ACCEPTED');
        setOrderData(payload);
        
        // Simulate delivery and ask for rating
        const deliveryTimeout = setTimeout(() => {
          Alert.alert(
            'Order Delivered! 🚚',
            'Was this as fresh as labelled?',
            [
              { text: 'Good', onPress: () => { submitRatingMutation.mutate({ orderId, rating: 'GOOD' }); navigation.navigate('MainTabs'); } },
              { text: 'Average', onPress: () => { submitRatingMutation.mutate({ orderId, rating: 'AVERAGE' }); navigation.navigate('MainTabs'); } },
              { text: 'Poor', onPress: () => { submitRatingMutation.mutate({ orderId, rating: 'POOR' }); navigation.navigate('MainTabs'); }, style: 'destructive' },
            ],
            { cancelable: false }
          );
        }, 8000); // Wait 8 seconds before fake delivery
        timeoutRefs.current.push(deliveryTimeout);
      }
    });

    return () => {
      unsubscribeAccepted();
      userSocket.disconnect();
    };
  }, [orderId, navigation, submitRatingMutation]);

  // Format the ETA
  let etaDisplay = 'Calculating...';
  if (orderData?.delivery?.estimatedDelivery) {
    const etaDate = new Date(orderData.delivery.estimatedDelivery);
    const mins = Math.max(1, Math.round((etaDate.getTime() - Date.now()) / 60000));
    etaDisplay = `${mins} min${mins > 1 ? 's' : ''}`;
  }

  const isFindingStore = status === 'FINDING_STORE';
  const isAccepted = status === 'ACCEPTED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {isFindingStore ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.black} />
            <Text style={styles.title}>Finding a Store...</Text>
            <Text style={styles.subtitle}>
              Broadcasting your order to nearby kirana stores with matching inventory.
            </Text>
          </View>
        ) : null}

        {isAccepted ? (
          <View style={styles.centerState}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Preparing your order</Text>
            <Text style={styles.subtitle}>
              {orderData?.assignedStore?.name || 'A nearby store'} has accepted your order and is packing it now.
            </Text>

            <View style={styles.etaContainer}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{etaDisplay}</Text>
            </View>

            {orderData?.assignedStore?.latitude && customerLocation && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: (orderData.assignedStore.latitude + customerLocation.latitude) / 2,
                    longitude: (orderData.assignedStore.longitude + customerLocation.longitude) / 2,
                    latitudeDelta: Math.abs(orderData.assignedStore.latitude - customerLocation.latitude) * 2 || 0.05,
                    longitudeDelta: Math.abs(orderData.assignedStore.longitude - customerLocation.longitude) * 2 || 0.05,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{ latitude: customerLocation.latitude, longitude: customerLocation.longitude }} title="You" pinColor="blue" />
                  <Marker coordinate={{ latitude: orderData.assignedStore.latitude, longitude: orderData.assignedStore.longitude }} title="Store" pinColor="red" />
                  <Polyline 
                    coordinates={[
                      { latitude: orderData.assignedStore.latitude, longitude: orderData.assignedStore.longitude },
                      { latitude: customerLocation.latitude, longitude: customerLocation.longitude }
                    ]}
                    strokeColor={Colors.primary}
                    strokeWidth={3}
                    lineDashPattern={[5, 5]} // Dotted arc line
                  />
                </MapView>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  centerState: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  etaContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    width: '100%',
  },
  etaLabel: {
    ...Typography.bodyLarge,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  etaValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    marginTop: Spacing.xl,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
