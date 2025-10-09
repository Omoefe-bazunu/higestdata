// lib/walletService.js
// Firebase wallet management service

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

class WalletService {
  // Get user wallet balance
  async getUserBalance(userId) {
    try {
      const userDoc = await getDoc(doc(firestore, "users", userId));
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      return userData.walletBalance || 0;
    } catch (error) {
      console.error("Error getting user balance:", error);
      throw error;
    }
  }

  // Check if user has sufficient balance
  async hasSufficientBalance(userId, amount) {
    try {
      const balance = await this.getUserBalance(userId);
      return balance >= amount;
    } catch (error) {
      console.error("Error checking balance:", error);
      return false;
    }
  }

  // Debit user wallet (with transaction record)
  async debitWallet(userId, amount, description, transactionType = "vtu") {
    try {
      return await runTransaction(firestore, async (transaction) => {
        // Get current balance
        const userRef = doc(firestore, "users", userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error("User not found");
        }

        const currentBalance = userDoc.data().walletBalance || 0;

        // Check sufficient balance
        if (currentBalance < amount) {
          throw new Error("Insufficient wallet balance");
        }

        const newBalance = currentBalance - amount;

        // Update user balance
        transaction.update(userRef, {
          walletBalance: newBalance,
          lastUpdated: serverTimestamp(),
        });

        // Create transaction record
        const transactionRef = doc(
          collection(firestore, "users", userId, "transactions")
        );
        transaction.set(transactionRef, {
          amount: amount,
          type: "debit",
          description: description,
          transactionType: transactionType,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          status: "completed",
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });

        return {
          success: true,
          newBalance: newBalance,
          transactionId: transactionRef.id,
        };
      });
    } catch (error) {
      console.error("Error debiting wallet:", error);
      throw error;
    }
  }

  // Refund user wallet (if transaction fails)
  async refundWallet(userId, amount, description, originalTransactionId) {
    try {
      return await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, "users", userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error("User not found");
        }

        const currentBalance = userDoc.data().walletBalance || 0;
        const newBalance = currentBalance + amount;

        // Update user balance
        transaction.update(userRef, {
          walletBalance: newBalance,
          lastUpdated: serverTimestamp(),
        });

        // Create refund transaction record
        const transactionRef = doc(
          collection(firestore, "users", userId, "transactions")
        );
        transaction.set(transactionRef, {
          amount: amount,
          type: "credit",
          description: `Refund: ${description}`,
          transactionType: "refund",
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          status: "completed",
          originalTransactionId: originalTransactionId,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });

        return {
          success: true,
          newBalance: newBalance,
          refundTransactionId: transactionRef.id,
        };
      });
    } catch (error) {
      console.error("Error refunding wallet:", error);
      throw error;
    }
  }

  // Create VTU transaction record
  async createVTUTransaction(userId, transactionData) {
    try {
      const transactionRef = await addDoc(
        collection(firestore, "users", userId, "vtuTransactions"),
        {
          ...transactionData,
          userId: userId,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        }
      );

      return {
        success: true,
        transactionId: transactionRef.id,
      };
    } catch (error) {
      console.error("Error creating VTU transaction:", error);
      throw error;
    }
  }

  // Update VTU transaction status
  async updateVTUTransactionStatus(
    userId,
    transactionId,
    status,
    apiResponse = null
  ) {
    try {
      const transactionRef = doc(
        firestore,
        "users",
        userId,
        "vtuTransactions",
        transactionId
      );

      const updateData = {
        status: status,
        updatedAt: serverTimestamp(),
      };

      if (apiResponse) {
        updateData.apiResponse = apiResponse;
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(transactionRef, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating VTU transaction:", error);
      throw error;
    }
  }

  // Get user transaction history
  async getTransactionHistory(userId, limit = 50) {
    try {
      const transactionsRef = collection(
        firestore,
        "users",
        userId,
        "transactions"
      );
      const q = query(
        transactionsRef,
        orderBy("timestamp", "desc"),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return transactions;
    } catch (error) {
      console.error("Error getting transaction history:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
