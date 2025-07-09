import admin from 'firebase-admin';

// Initialize variables that may or may not be assigned.
let adminAuth: admin.auth.Auth | undefined = undefined;
let adminDb: admin.firestore.Firestore | undefined = undefined;
let adminStorage: admin.storage.Storage | undefined = undefined;

const hasAdminCredentials = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

// Initialize the admin app ONLY if it hasn't been initialized yet
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

    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else if (admin.apps.length) {
  // If the app is already initialized, just get the instances.
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
}

export { adminAuth, adminDb, adminStorage };
