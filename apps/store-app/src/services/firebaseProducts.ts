import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface CustomProduct {
  name: string;
  quantity: string;
  unit?: string;
  category?: string;
  freshness?: string;
  price?: string;
  imageUri: string;
  storeId: string;
  createdAt: number | FirebaseFirestoreTypes.FieldValue;
}

export const uploadProductImage = async (storeId: string, base64Data: string): Promise<string> => {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // Defaulting to jpg since ImagePicker typically returns jpegs when returning base64
  const path = `images/custom_products/${storeId}/${uuid}.jpg`;
  
  const reference = storage().ref(path);
  
  return new Promise((resolve, reject) => {
    const task = reference.putString(base64Data, 'base64', { contentType: 'image/jpeg' });
    
    task.on('state_changed', 
      (snapshot) => {
        console.log(`Upload is ${snapshot.state}: ${snapshot.bytesTransferred} / ${snapshot.totalBytes}`);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const url = await reference.getDownloadURL();
          resolve(url);
        } catch (downloadError) {
          console.error('Error getting download URL:', downloadError);
          reject(downloadError);
        }
      }
    );
  });
};

export const saveCustomProduct = async (product: CustomProduct): Promise<void> => {
  const productsCollection = firestore().collection('store_custom_products');
  await productsCollection.add(product);
};
