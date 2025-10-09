import { firestore } from "./firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// Get Wallet Balance for the current user
export async function getWalletBalance(userId) {
  if (!userId) return 0;

  const userDoc = await getDoc(doc(firestore, "users", userId));
  if (userDoc.exists()) {
    return userDoc.data().walletBalance || 0;
  }
  return 0;
}

// Get Transactions (ordered by date, latest first)
export async function getTransactions(userId) {
  if (!userId) return [];

  const q = query(
    collection(firestore, "users", userId, "transactions"),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Get Crypto Rates (from Firestore document "settings/cryptoConfig")
export async function getCryptoRates() {
  const configDoc = await getDoc(doc(firestore, "settings", "cryptoConfig"));
  if (configDoc.exists()) {
    const data = configDoc.data();
    return data.customRates || {}; // Return the customRates object or empty object if not found
  }
  return {};
}

// Get Crypto Wallets
export async function getCryptoWallets() {
  const walletSnap = await getDoc(doc(firestore, "settings", "cryptoWallets"));
  if (walletSnap.exists()) {
    return walletSnap.data() || {};
  }
  return {};
}

// Get Exchange Rate
export async function getExchangeRate() {
  const exchangeSnap = await getDoc(doc(firestore, "settings", "exchangeRate"));
  if (exchangeSnap.exists()) {
    return exchangeSnap.data().rates || 1;
  }
  return 1;
}

// Get Notifications for the user
export async function getNotifications(userId) {
  if (!userId) return [];

  const q = query(
    collection(firestore, "users", userId, "notifications"),
    orderBy("date", "desc"),
    limit(20)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Fetch ALL transactions across all users (admin only)
export async function getAllTransactions() {
  const q = query(
    collectionGroup(firestore, "transactions"),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Get Flagged Transactions (for admins)
export async function getFlaggedTransactions() {
  const snapshot = await getDocs(collection(firestore, "flaggedTransactions"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
