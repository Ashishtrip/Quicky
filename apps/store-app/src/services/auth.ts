import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Web Client ID extracted from your google-services.json (client_type: 3)
const WEB_CLIENT_ID = '409651630637-j7o8kdi92p40vheil2eluoblu9i8ai9j.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
});

export async function onGoogleButtonPress() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Get the users ID token
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  
  if (!idToken) {
    throw new Error("No ID token found");
  }
  
  // Create a Google credential with the token
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  // Sign-in the user with the credential
  return auth().signInWithCredential(googleCredential);
}
