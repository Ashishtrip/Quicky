import React, { useState } from 'react';
import { AuthScreen, SignupForm } from '@quicky/ui-kit';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

export const SignupScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (data: Record<string, string>) => {
    try {
      setIsLoading(true);
      await auth().createUserWithEmailAndPassword(data['email'] as string, data['password'] as string);
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen 
      title="Join Quicky" 
      subtitle="Sign up for fast and fresh deliveries."
    >
      <SignupForm
        onSubmit={handleSignup}
        onNavigateToLogin={() => navigation.navigate('Login')}
        isLoading={isLoading}
      />
    </AuthScreen>
  );
};
