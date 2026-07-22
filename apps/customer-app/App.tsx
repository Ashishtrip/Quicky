import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootLayout from './src/RootLayout';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: `${error.name}: ${error.message}\n${error.stack?.slice(0, 500)}` };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#DC2626', padding: 24, paddingTop: 60 }}>
          <Text style={{ fontSize: 20, color: 'white', fontWeight: 'bold', marginBottom: 12 }}>RENDER CRASH</Text>
          <ScrollView>
            <Text style={{ fontSize: 12, color: 'white', fontFamily: 'monospace' }}>{this.state.error}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayout />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
