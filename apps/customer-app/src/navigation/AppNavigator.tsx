import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ProductResult } from '@quicky/api-client';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Pressable, Text, View, Image, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@quicky/ui-kit';

import { HomeScreen } from '../screens/HomeScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { PaymentMethodScreen } from '../screens/PaymentMethodScreen';
import { OrderStatusScreen } from '../screens/OrderStatusScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ManageAddressesScreen } from '../screens/ManageAddressesScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { useAuthStore } from '../stores/authStore';

export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { product: ProductResult };
  Cart: undefined;
  PaymentMethod: {
    address: { fullName: string; street: string; city: string; pincode: string };
    instructions: string;
  };
  ManageAddresses: undefined;
  CompleteProfile: undefined;
  Feedback: undefined;
  About: undefined;
  OrderStatus: { orderId: string };
  Onboarding: undefined;
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

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

    let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
    if (route.name === 'Home') iconName = 'home';
    else if (route.name === 'Cart') iconName = 'shopping-cart';
    else if (route.name === 'Orders') iconName = 'receipt-long';
    else if (route.name === 'Profile') iconName = 'person';

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
              color={isFocused ? Colors.onPrimaryContainer : Colors.textSecondary}
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
    <SafeAreaView edges={['bottom']} style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map(renderTab)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
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
    backgroundColor: Colors.primaryContainer,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.onPrimaryContainer,
    fontWeight: '700',
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};



function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <Image
        source={require('../../assests/icon.png')}
        style={splashStyles.icon}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#00696c" style={splashStyles.spinner} />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  spinner: {
    marginTop: 32,
  },
});

export function AppNavigator({ isReady, isAuthLoading }: { isReady: boolean, isAuthLoading: boolean }) {
  const { user, isOnboarded } = useAuthStore();
  const isLoading = !isReady || isAuthLoading;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
            <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
            <Stack.Screen name="ManageAddresses" component={ManageAddressesScreen} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
