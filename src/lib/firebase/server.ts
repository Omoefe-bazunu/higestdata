import admin from 'firebase-admin';

// Initialize variables that may or may not be assigned.
let adminAuth: admin.auth.Auth | undefined = undefined;
let adminDb: admin.firestore.Firestore | undefined = undefined;
let adminStorage: admin.storage.Storage | undefined = undefined;

const hasAdminCredentials = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasAdminCredentials) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    console.warn('Admin features will be disabled due to an initialization error.');
  }
} else {
  console.warn('Firebase admin credentials are not set in the .env file. Admin features will be disabled.');
}


export { adminAuth, adminDb, adminStorage };
