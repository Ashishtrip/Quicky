import React, { useState } from 'react';
import { AuthScreen, LoginForm } from '@quicky/ui-kit';
import auth from '@react-native-firebase/auth';
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

  return (
    <AuthScreen 
      title="Welcome to Quicky" 
      subtitle="Login to get fresh groceries delivered in minutes."
    >
      <LoginForm
        onSubmit={handleLogin}
        onNavigateToSignup={() => navigation.navigate('Signup')}
        isLoading={isLoading}
      />
    </AuthScreen>
  );
};
