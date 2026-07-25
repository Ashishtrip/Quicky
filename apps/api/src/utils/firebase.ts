import * as admin from 'firebase-admin';

// Google Application Credentials are automatically picked up 
// if GOOGLE_APPLICATION_CREDENTIALS is set in the environment (e.g. locally).
// For Railway, we use FIREBASE_SERVICE_ACCOUNT_JSON to pass the raw JSON string.
if (!admin.apps.length) {
  if (process.env['FIREBASE_SERVICE_ACCOUNT_JSON']) {
    const serviceAccount = JSON.parse(process.env['FIREBASE_SERVICE_ACCOUNT_JSON']);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp();
  }
}

export const messaging: admin.messaging.Messaging = admin.messaging();
export const adminAuth: admin.auth.Auth = admin.auth();
