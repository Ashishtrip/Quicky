import React, { useState } from 'react';
import { AuthScreen, LoginForm } from '@quicky/ui-kit';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';

export const LoginScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      await auth().signInWithEmailAndPassword(email, pass);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error('No ID token found');
      
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.log('Google login error:', error);
      Alert.alert('Google Login Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen 
      title="Welcome to Quicky" 
      subtitle="Login to get fresh groceries delivered in minutes."
    >
      <LoginForm
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onNavigateToSignup={() => navigation.navigate('Signup')}
        isLoading={isLoading}
      />
    </AuthScreen>
  );
};
