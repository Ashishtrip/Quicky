import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radii, TextInput, Button } from '@quicky/ui-kit';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both the subject and description.');
      return;
    }

    const email = 'ashish.deo.tripathi@gmail.com';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailtoUrl);
      navigation.goBack();
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert(
        'Email Client Not Found', 
        'Could not open an email app. Please send your feedback directly to: ashish.deo.tripathi@gmail.com'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue / Bug</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Send us Feedback</Text>
          <Text style={styles.subtitle}>
            Please describe the issue or bug you are facing. This will open your default email client to send it to us.
          </Text>

          <View style={styles.formContainer}>
            <TextInput 
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., App crashes on checkout"
            />
            
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput 
                label=""
                value={body}
                onChangeText={setBody}
                placeholder="Please describe what happened..."
                multiline={true}
                numberOfLines={6}
                style={styles.textArea}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button 
            title="Submit Feedback" 
            onPress={handleSubmit} 
            disabled={!subject.trim() || !body.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  formContainer: {
    marginTop: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  textAreaContainer: {
    marginTop: Spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#bdc9c9',
  },
});
