// import { firestore } from "./firebaseConfig";
// import {
//   doc,
//   getDoc,
//   collection,
//   collectionGroup,
//   getDocs,
//   query,
//   orderBy,
//   limit,
// } from "firebase/firestore";

// // Get Wallet Balance for the current user
// export async function getWalletBalance(userId) {
//   if (!userId) return 0;

//   const userDoc = await getDoc(doc(firestore, "users", userId));
//   if (userDoc.exists()) {
//     return userDoc.data().walletBalance || 0;
//   }
//   return 0;
// }

// // Get Transactions (ordered by date, latest first)
// export async function getTransactions(userId) {
//   if (!userId) return [];

//   const q = query(
//     collection(firestore, "users", userId, "transactions"),
//     orderBy("createdAt", "desc")
//   );
//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => {
//     const data = doc.data();
//     const timestamp = data.createdAt || data.date;
//     const dateStr = timestamp?.toDate?.()
//       ? timestamp.toDate().toLocaleDateString()
//       : timestamp?.seconds
//       ? new Date(timestamp.seconds * 1000).toLocaleDateString()
//       : data.date || "N/A";

//     return {
//       id: doc.id,
//       ...data,
//       date: dateStr,
//     };
//   });
// }

// // Get Crypto Rates (from Firestore document "settings/cryptoConfig")
// export async function getCryptoRates() {
//   const configDoc = await getDoc(doc(firestore, "settings", "cryptoConfig"));
//   if (configDoc.exists()) {
//     const data = configDoc.data();
//     return data.customRates || {}; // Return the customRates object or empty object if not found
//   }
//   return {};
// }

// // Get Crypto Wallets
// export async function getCryptoWallets() {
//   const walletSnap = await getDoc(doc(firestore, "settings", "cryptoWallets"));
//   if (walletSnap.exists()) {
//     return walletSnap.data() || {};
//   }
//   return {};
// }

// // Get Exchange Rate
// export async function getExchangeRate() {
//   const exchangeSnap = await getDoc(doc(firestore, "settings", "exchangeRate"));
//   if (exchangeSnap.exists()) {
//     return exchangeSnap.data().rates || 1;
//   }
//   return 1;
// }

// // Get Notifications for the user
// export async function getNotifications(userId) {
//   if (!userId) return [];

//   const q = query(
//     collection(firestore, "users", userId, "notifications"),
//     orderBy("date", "desc"),
//     limit(20)
//   );
//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));
// }

// // Fetch ALL transactions across all users (admin only)
// export async function getAllTransactions() {
//   const q = query(
//     collectionGroup(firestore, "transactions"),
//     orderBy("createdAt", "desc")
//   );

//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => {
//     const data = doc.data();
//     const timestamp = data.createdAt;
//     const dateStr = timestamp?.toDate?.()
//       ? timestamp.toDate().toLocaleDateString()
//       : timestamp?.seconds
//       ? new Date(timestamp.seconds * 1000).toLocaleDateString()
//       : data.date || "N/A";

//     return {
//       id: doc.id,
//       ...data,
//       date: dateStr,
//     };
//   });
// }

// // Get Flagged Transactions (for admins)
// export async function getFlaggedTransactions() {
//   const snapshot = await getDocs(collection(firestore, "flaggedTransactions"));
//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));
// }

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
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.createdAt || data.date;
    const dateStr = timestamp?.toDate?.()
      ? timestamp.toDate().toLocaleDateString()
      : timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleDateString()
      : data.date || "N/A";

    return {
      id: doc.id,
      ...data,
      date: dateStr,
    };
  });
}

// Get Crypto Rates (from Firestore document "settings/cryptoConfig")
export async function getCryptoRates() {
  const configDoc = await getDoc(doc(firestore, "settings", "cryptoConfig"));
  if (configDoc.exists()) {
    const data = configDoc.data();
    return data.customRates || {};
    // Return the customRates object or empty object if not found
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

// Fetch ALL transactions across all users (For Admin Dashboard)
export async function getAllTransactions() {
  // Use collectionGroup to fetch 'transactions' from all users
  const q = query(
    collectionGroup(firestore, "transactions"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  // Filter and map results
  const transactions = snapshot.docs
    .map((doc) => {
      // 1. DEDUPLICATION LOGIC:
      // server.js saves funding attempts to a ROOT 'transactions' collection
      // AND a 'users/{id}/transactions' subcollection.
      // We only want the subcollection docs (path length > 2) to avoid duplicates.
      if (doc.ref.path.split("/").length <= 2) return null;

      const data = doc.data();
      const timestamp = data.createdAt;
      const dateStr = timestamp?.toDate?.()
        ? timestamp.toDate().toLocaleDateString() +
          " " +
          timestamp.toDate().toLocaleTimeString()
        : timestamp?.seconds
        ? new Date(timestamp.seconds * 1000).toLocaleDateString()
        : data.date || "N/A";

      return {
        id: doc.id,
        ...data,
        date: dateStr,
        // Ensure amount is a number for calculations
        amount: parseFloat(data.amount || data.amountCharged || 0),
        // Normalize type for easier filtering (credit/debit logic is handled in UI)
        normalizedType:
          data.type === "funding" || data.type === "credit"
            ? "Credit"
            : "Debit",
      };
    })
    .filter((tx) => tx !== null); // Remove the nulls (root collection docs)

  return transactions;
}

// NEW: Fetch Detailed Withdrawal Requests (For Admin Review)
export async function getWithdrawalRequests() {
  // Fetches from the dedicated 'withdrawalRequests' collection created in server.js
  const q = query(
    collection(firestore, "withdrawalRequests"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.createdAt;
    const dateStr = timestamp?.toDate?.()
      ? timestamp.toDate().toLocaleString()
      : timestamp?.seconds
      ? new Date(timestamp.seconds * 1000).toLocaleString()
      : "N/A";

    return {
      id: doc.id,
      ...data,
      date: dateStr,
      // Helper to easily spot pending requests
      isPending:
        data.status === "processing" || data.status === "manual_review",
    };
  });
}

// Get Flagged Transactions (for admins)
export async function getFlaggedTransactions() {
  const snapshot = await getDocs(collection(firestore, "flaggedTransactions"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
