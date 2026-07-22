import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (e) {
      console.warn("Failed to get FCM token", e);
    }
  }
  
  return null;
};

export const setupFCMHandlers = () => {
  // Foreground message handler
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));
    
    const notification = remoteMessage.notification;
    if (notification) {
      Alert.alert(
        notification.title || 'New Order!',
        notification.body || 'You have a new order to accept.',
        [{ text: 'OK' }]
      );
    }
  });

  return unsubscribe;
};

// Background handler needs to be registered early in the app lifecycle
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
