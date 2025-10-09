// lib/flutterwaveWalletService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { firestore as db } from "./firebaseConfig";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.cloud/developersandbox";
const FLUTTERWAVE_SECRET_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_SECRET_KEY;

/**
 * Creates a Flutterwave customer
 * @param {Object} userData - User information
 * @returns {Promise<string>} Customer ID
 */
async function createFlutterwaveCustomer(userData) {
  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "X-Idempotency-Key": `customer-${userData.uid}-${Date.now()}`,
      },
      body: JSON.stringify({
        name: {
          first: userData.firstName || "User",
          last: userData.lastName || "Customer",
        },
        email: userData.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create customer");
    }

    return data.data.id;
  } catch (error) {
    console.error("Error creating Flutterwave customer:", error);
    throw error;
  }
}

/**
 * Creates a static virtual account for wallet funding
 * @param {string} userId - User ID from Firebase Auth
 * @param {Object} userData - User information including BVN
 * @returns {Promise<Object>} Virtual account details
 */
export async function createVirtualAccount(userId, userData) {
  try {
    // Create or get Flutterwave customer
    let customerId = userData.flutterwaveCustomerId;

    if (!customerId) {
      customerId = await createFlutterwaveCustomer(userData);

      // Update user document with customer ID
      await updateDoc(doc(db, "users", userId), {
        flutterwaveCustomerId: customerId,
      });
    }

    // Create static virtual account
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/virtual-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "X-Idempotency-Key": `va-${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        reference: `wallet-${userId}-${Date.now()}`,
        customer_id: customerId,
        amount: 0, // Static account with no fixed amount
        currency: "NGN",
        account_type: "static",
        narration: `${userData.firstName} ${userData.lastName} Wallet`,
        bvn: userData.bvn, // User's BVN is required
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create virtual account");
    }

    // Save virtual account details to user document
    await updateDoc(doc(db, "users", userId), {
      virtualAccount: {
        id: data.data.id,
        accountNumber: data.data.account_number,
        accountBankName: data.data.account_bank_name,
        reference: data.data.reference,
        status: data.data.status,
        createdAt: serverTimestamp(),
      },
    });

    return data.data;
  } catch (error) {
    console.error("Error creating virtual account:", error);
    throw error;
  }
}

/**
 * Handles webhook from Flutterwave for successful funding
 * @param {Object} webhookData - Webhook payload from Flutterwave
 */
export async function handleFundingWebhook(webhookData) {
  try {
    const { data } = webhookData;

    // Verify the transaction is successful
    if (data.status !== "succeeded") {
      console.log("Transaction not successful:", data.status);
      return;
    }

    // Find user by customer ID
    const usersQuery = query(
      collection(db, "users"),
      where("flutterwaveCustomerId", "==", data.customer.id)
    );

    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      throw new Error("User not found for customer ID");
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const amount = data.amount;

    // Create funding transaction record
    await addDoc(collection(db, "walletTransactions"), {
      userId,
      type: "funding",
      amount,
      currency: data.currency,
      status: "completed",
      reference: data.reference,
      flutterwaveChargeId: data.id,
      description: "Wallet funding via bank transfer",
      createdAt: serverTimestamp(),
    });

    // Update user wallet balance
    await updateDoc(doc(db, "users", userId), {
      walletBalance: increment(amount),
      lastFundedAt: serverTimestamp(),
    });

    console.log(`Wallet funded successfully for user ${userId}: ₦${amount}`);
  } catch (error) {
    console.error("Error handling funding webhook:", error);
    throw error;
  }
}

/**
 * Initiates withdrawal from wallet to user's bank account
 * @param {string} userId - User ID from Firebase Auth
 * @param {number} amount - Amount to withdraw
 * @param {Object} bankDetails - User's bank account details
 * @returns {Promise<Object>} Transfer details
 */
export async function initiateWithdrawal(userId, amount, bankDetails) {
  try {
    // Check user's wallet balance
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const currentBalance = userData.walletBalance || 0;

    if (currentBalance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Create withdrawal record first (pending status)
    const withdrawalRef = await addDoc(collection(db, "walletTransactions"), {
      userId,
      type: "withdrawal",
      amount,
      currency: "NGN",
      status: "pending",
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        bankCode: bankDetails.bankCode,
        accountName: bankDetails.accountName,
      },
      description: "Wallet withdrawal to bank account",
      createdAt: serverTimestamp(),
    });

    // Initiate transfer via Flutterwave
    const transferResponse = await fetch(
      `${FLUTTERWAVE_BASE_URL}/direct-transfers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "X-Trace-Id": `withdrawal-${withdrawalRef.id}`,
          "X-Idempotency-Key": `withdraw-${userId}-${Date.now()}`,
        },
        body: JSON.stringify({
          action: "instant",
          type: "bank",
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/withdrawal`,
          narration: "Wallet withdrawal",
          reference: withdrawalRef.id,
          payment_instruction: {
            amount: {
              value: amount,
              applies_to: "destination_currency",
            },
            source_currency: "NGN",
            destination_currency: "NGN",
            recipient: {
              bank: {
                account_number: bankDetails.accountNumber,
                code: bankDetails.bankCode,
              },
              name: {
                first: userData.firstName || "User",
                last: userData.lastName || "Customer",
              },
              email: userData.email,
            },
          },
        }),
      }
    );

    const transferData = await transferResponse.json();

    if (!transferResponse.ok) {
      // Update withdrawal record to failed
      await updateDoc(doc(db, "walletTransactions", withdrawalRef.id), {
        status: "failed",
        error: transferData.message,
        updatedAt: serverTimestamp(),
      });

      throw new Error(transferData.message || "Failed to initiate withdrawal");
    }

    // Update withdrawal record with transfer details
    await updateDoc(doc(db, "walletTransactions", withdrawalRef.id), {
      flutterwaveTransferId: transferData.data.id,
      flutterwaveReference: transferData.data.reference,
      status: "processing",
      updatedAt: serverTimestamp(),
    });

    // Deduct amount from user's wallet balance immediately
    await updateDoc(doc(db, "users", userId), {
      walletBalance: increment(-amount),
      lastWithdrawalAt: serverTimestamp(),
    });

    return {
      success: true,
      transferId: transferData.data.id,
      reference: transferData.data.reference,
      withdrawalId: withdrawalRef.id,
    };
  } catch (error) {
    console.error("Error initiating withdrawal:", error);
    throw error;
  }
}

/**
 * Handles withdrawal webhook from Flutterwave
 * @param {Object} webhookData - Webhook payload from Flutterwave
 */
export async function handleWithdrawalWebhook(webhookData) {
  try {
    const { data } = webhookData;
    const reference = data.reference; // This is our withdrawal document ID

    // Update withdrawal transaction record
    const withdrawalDoc = doc(db, "walletTransactions", reference);

    if (data.status === "SUCCESSFUL") {
      await updateDoc(withdrawalDoc, {
        status: "completed",
        completedAt: serverTimestamp(),
        fee: data.fee?.value || 0,
        updatedAt: serverTimestamp(),
      });

      console.log(`Withdrawal completed successfully: ${reference}`);
    } else {
      // If withdrawal failed, refund the user's wallet
      const withdrawalSnapshot = await getDoc(withdrawalDoc);

      if (withdrawalSnapshot.exists()) {
        const withdrawalData = withdrawalSnapshot.data();

        // Refund the amount back to user's wallet
        await updateDoc(doc(db, "users", withdrawalData.userId), {
          walletBalance: increment(withdrawalData.amount),
        });

        await updateDoc(withdrawalDoc, {
          status: "failed",
          error: "Transfer failed",
          refunded: true,
          updatedAt: serverTimestamp(),
        });

        console.log(`Withdrawal failed and refunded: ${reference}`);
      }
    }
  } catch (error) {
    console.error("Error handling withdrawal webhook:", error);
    throw error;
  }
}

/**
 * Gets user's wallet transactions
 * @param {string} userId - User ID from Firebase Auth
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} Array of transactions
 */

export async function getWalletTransactions(userId, maxResults = 50) {
  try {
    const transactionsQuery = query(
      collection(db, "walletTransactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults) // Correct: Use Firestore's limit function
    );

    const snapshot = await getDocs(transactionsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw error;
  }
}

/**
 * Gets Nigerian banks list from Flutterwave
 * @returns {Promise<Array>} Array of banks
 */
export async function getNigerianBanks() {
  try {
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/banks/NG`, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch banks");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching banks:", error);
    throw error;
  }
}
