import admin from 'firebase-admin';

// This file is for server-side Firebase Admin SDK initialization.

// Check if the necessary environment variables are set.
const hasAdminCredentials = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

// Initialize the Firebase Admin App only if it hasn't been initialized yet
// and the necessary credentials are provided.
if (hasAdminCredentials && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must have newlines correctly formatted.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
} else if (admin.apps.length) {
    // Already initialized
} else {
    // This message will show if the admin credentials are not set in the .env file.
    console.warn("Firebase Admin credentials not found. Admin features will be disabled.");
}

// Export the services if the app was initialized, otherwise export undefined.
const adminDb = admin.apps.length ? admin.firestore() : undefined;
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminStorage = admin.apps.length ? admin.storage() : undefined;


export { adminAuth, adminDb, adminStorage };
