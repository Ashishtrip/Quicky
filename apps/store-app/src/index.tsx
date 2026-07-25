import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, ActivityIndicator, View, Pressable, Text, StyleSheet, Image } from 'react-native';
import { initApiClient, setAuthToken } from '@quicky/api-client';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const envApiUrl = process.env['EXPO_PUBLIC_API_URL'];
let API_BASE_URL = envApiUrl || 'https://quicky-production.up.railway.app';
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

initApiClient({ baseUrl: API_BASE_URL });

import { DashboardScreen } from './screens/Dashboard';
import { CatalogScreen } from './screens/Catalog';
import { TaggingScreen } from './screens/Tagging';
import { InboxScreen } from './screens/Inbox';
import { AddCustomProductScreen } from './screens/AddCustomProduct';
import { StoreProfileScreen } from './screens/StoreProfileScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { SalesSummaryScreen } from './screens/SalesSummary';
import { setupFCMHandlers, requestUserPermission } from './services/fcm';

import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export type RootStackParamList = {
  Tabs: undefined;
  Tagging: { catalogItemId: string, name: string, price: number, isCustom?: boolean, unit?: string, imageUrl?: string, listingId?: string };
  AddCustomProduct: undefined;
  Onboarding: undefined;
  Notifications: undefined;
  SalesSummary: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Catalog: undefined;
  Inbox: undefined;
  StoreProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

import { MaterialIcons } from '@expo/vector-icons';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const storeColors = {
  primaryContainer: '#cce8e7',
  onPrimaryContainer: '#00696c',
  textSecondary: '#3d4949',
  surface: '#ffffff',
  text: '#191c1c'
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: storeColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconContainerActive: {
    backgroundColor: storeColors.primaryContainer,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
    color: storeColors.textSecondary,
  },
  tabLabelActive: {
    color: storeColors.text,
    fontFamily: 'Inter_600SemiBold',
  },
});

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key] as any;
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
          ? options.title
          : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    let iconName: React.ComponentProps<typeof MaterialIcons>['name'] = 'circle';
    if (route.name === 'Dashboard') {
      iconName = 'home';
    } else if (route.name === 'Catalog') {
      iconName = 'inventory';
    } else if (route.name === 'Inbox') {
      iconName = 'inbox';
    } else if (route.name === 'StoreProfile') {
      iconName = 'person';
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        style={styles.tabItem}
      >
        <View style={styles.tabContent}>
          <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
            <MaterialIcons
              name={iconName}
              size={24}
              color={isFocused ? storeColors.onPrimaryContainer : storeColors.textSecondary}
            />
          </View>
          <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
            {label as string}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map(renderTab)}
      </View>
    </View>
  );
}

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="StoreProfile" component={StoreProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

import firestore from '@react-native-firebase/firestore';
import { OnboardingScreen } from './screens/OnboardingScreen';

const App = () => {
  const { user, isLoading, setUser, isOnboarded, setIsOnboarded } = useAuthStore();
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    let mounted = true;
    
    // Listen to Firebase Auth state
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
          const doc = await firestore().collection('users').doc(firebaseUser.uid).get();
          if (mounted) {
            setIsOnboarded(!!doc.data());
          }
        } catch (error) {
          console.warn('[App] Error fetching store profile:', error);
          if (mounted) setIsOnboarded(false);
        }
      } else {
        setAuthToken(null);
        if (mounted) setIsOnboarded(false);
      }
      
      if (mounted) setUser(firebaseUser);
    });

    const tokenSubscriber = auth().onIdTokenChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.warn('[App] Error getting fresh token:', error);
        }
      } else {
        setAuthToken(null);
      }
    });
    
    return () => {
      mounted = false;
      subscriber();
      tokenSubscriber();
    };
  }, []);

  useEffect(() => {
    requestUserPermission();
    const unsubscribe = setupFCMHandlers();
    return unsubscribe;
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Image
          source={require('../assests/splash-logo.png')}
          style={{ width: 120, height: 120, borderRadius: 24 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#00696c" style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {user ? (
            isOnboarded ? (
              <Stack.Navigator>
                <Stack.Screen 
                  name="Tabs" 
                  component={TabNavigator} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="Tagging" 
                  component={TaggingScreen} 
                  options={({ route }) => ({ title: route.params.name })}
                />
                <Stack.Screen 
                  name="AddCustomProduct" 
                  component={AddCustomProductScreen} 
                  options={{ headerShown: false, title: 'Add Custom Product' }}
                />
                <Stack.Screen 
                  name="Notifications" 
                  component={NotificationsScreen} 
                  options={{ title: 'Notifications' }}
                />
                <Stack.Screen 
                  name="SalesSummary" 
                  component={SalesSummaryScreen} 
                  options={{ title: 'Sales Summary' }}
                />
              </Stack.Navigator>
            ) : (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Onboarding" component={OnboardingScreen as any} />
              </Stack.Navigator>
            )
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

registerRootComponent(App);

export default App;
