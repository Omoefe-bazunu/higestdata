"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { firestore } from "@/lib/firebaseConfig";
import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference");
      const payment = searchParams.get("payment");

      if (payment === "success" && reference && !verified) {
        setVerified(true);

        try {
          // Verify with Paystack
          const response = await fetch(
            `/api/paystack/verify?reference=${reference}`
          );
          const data = await response.json();

          if (!data.success) {
            toast({
              title: "Payment Failed",
              description: data.message || "Transaction verification failed.",
              variant: "destructive",
            });
            router.replace("/dashboard");
            return;
          }

          const { userId, amount, email, channel, currency } = data;

          // Check if transaction already exists
          const transactionsRef = collection(
            firestore,
            "users",
            userId,
            "transactions"
          );
          const q = query(
            transactionsRef,
            where("paystackReference", "==", reference)
          );
          const existingTx = await getDocs(q);

          if (!existingTx.empty) {
            toast({
              title: "Already Processed",
              description: "This transaction has already been credited.",
            });
            router.replace("/dashboard");
            return;
          }

          // Update wallet balance
          const userRef = doc(firestore, "users", userId);
          await updateDoc(userRef, {
            walletBalance: increment(amount),
          });

          // Create transaction record
          const transactionRecord = {
            userId,
            description: "Wallet Funding via Paystack",
            amount,
            type: "credit",
            status: "Completed",
            date: new Date().toLocaleDateString(),
            createdAt: new Date().toISOString(),
            paystackReference: reference,
            paymentMethod: channel,
            metadata: {
              email,
              currency,
            },
          };

          await addDoc(transactionsRef, transactionRecord);

          toast({
            title: "Payment Successful",
            description: `₦${amount.toFixed(2)} has been added to your wallet.`,
          });
        } catch (error) {
          console.error("Verification error:", error);
          toast({
            title: "Verification Error",
            description:
              "Failed to verify payment. Please contact support if your account wasn't credited.",
            variant: "destructive",
          });
        } finally {
          router.replace("/dashboard");
        }
      }
    };

    verifyPayment();
  }, [searchParams, router, verified]);

  return null;
}
