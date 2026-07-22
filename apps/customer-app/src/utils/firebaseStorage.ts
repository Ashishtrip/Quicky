import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { StateStorage } from 'zustand/middleware';

/**
 * A Zustand StateStorage adapter that persists state to Firebase Firestore.
 * Requires the user to be authenticated (can be anonymous).
 */
export const firebaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const user = auth().currentUser;
    if (!user) return null;
    
    try {
      const doc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('store')
        .doc(name)
        .get();
      const data = doc.data();
      if (data) {
        return data['value'] || null;
      }
      return null;
    } catch (error) {
      console.error(`Error reading ${name} from Firestore:`, error);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    const user = auth().currentUser;
    if (!user) return;
    
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('store')
        .doc(name)
        .set({
          value,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error(`Error writing ${name} to Firestore:`, error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    const user = auth().currentUser;
    if (!user) return;
    
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('store')
        .doc(name)
        .delete();
    } catch (error) {
      console.error(`Error removing ${name} from Firestore:`, error);
    }
  },
};
