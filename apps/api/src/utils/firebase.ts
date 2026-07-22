import * as admin from 'firebase-admin';

// Google Application Credentials are automatically picked up 
// if GOOGLE_APPLICATION_CREDENTIALS is set in the environment.
if (!admin.apps.length) {
  admin.initializeApp();
}

export const messaging: admin.messaging.Messaging = admin.messaging();
