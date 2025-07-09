import admin from 'firebase-admin';

// This file is for server-side Firebase Admin SDK initialization.

let adminAuth: admin.auth.Auth | undefined = undefined;
let adminDb: admin.firestore.Firestore | undefined = undefined;
let adminStorage: admin.storage.Storage | undefined = undefined;

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

    // If initialization is successful, get the services.
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // If there's an error, the services will remain undefined,
    // and the app will gracefully degrade.
  }
} else if (admin.apps.length) {
  // If the app is already initialized (e.g., in a hot-reload scenario), 
  // just get the services from the existing app instance.
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
} else {
    // This message will show if the admin credentials are not set in the .env file.
    console.warn("Firebase Admin credentials not found. Admin features will be disabled.");
}

export { adminAuth, adminDb, adminStorage };