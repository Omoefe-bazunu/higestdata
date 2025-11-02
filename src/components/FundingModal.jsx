"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, collection, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const processedRefs = useRef(new Set()); // Track processed references

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const updateWalletBalance = async (amountPaid, reference) => {
    if (processedRefs.current.has(reference)) {
      console.log("Duplicate prevented:", reference);
      return;
    }
    processedRefs.current.add(reference);

    try {
      const userRef = doc(firestore, "users", user.uid);
      const txRef = doc(
        collection(firestore, "users", user.uid, "transactions")
      );

      await runTransaction(firestore, async (tx) => {
        const userSnap = await tx.get(userRef);
        const current = userSnap.data()?.walletBalance || 0;
        const newBalance = current + amountPaid;

        tx.update(userRef, { walletBalance: newBalance });
        tx.set(txRef, {
          userId: user.uid,
          reference,
          description: "Wallet funding via Kora",
          amount: amountPaid,
          type: "credit",
          status: "success",
          date: new Date().toLocaleDateString(),
          createdAt: new Date().toISOString(),
        });
      });

      toast({
        title: "Success",
        description: `₦${amountPaid.toLocaleString()} added.`,
      });
      onOpenChange(false);
      setAmount("");
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Failed",
        description: "Contact support.",
        variant: "destructive",
      });
    }
  };

  const verifyPayment = async (reference) => {
    try {
      const response = await fetch("/api/kora/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        await updateWalletBalance(data.amount, reference);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Verify error:", error);
      return false;
    }
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Sign in required.",
        variant: "destructive",
      });
      return;
    }

    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount < 100) {
      toast({
        title: "Invalid",
        description: "Min ₦100.",
        variant: "destructive",
      });
      return;
    }

    if (!scriptLoaded || !window.Korapay) {
      toast({
        title: "Loading...",
        description: "Please wait.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    processedRefs.current.clear(); // Reset for new payment

    try {
      const initRes = await fetch("/api/kora/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: fundAmount,
          userId: user.uid,
          name: user.displayName || user.email.split("@")[0],
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || "Init failed");

      window.Korapay.initialize({
        key: initData.publicKey,
        reference: initData.reference,
        amount: fundAmount,
        currency: "NGN",
        customer: {
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
        },
        onSuccess: async (data) => {
          setLoading(false);
          if (processedRefs.current.has(data.reference)) return;
          const verified = await verifyPayment(data.reference);
          if (!verified) {
            toast({
              title: "Verify Failed",
              description: `Ref: ${data.reference}`,
              variant: "destructive",
            });
          }
        },
        onFailed: () => {
          setLoading(false);
          toast({
            title: "Failed",
            description: "Try again.",
            variant: "destructive",
          });
        },
        onClose: () => setLoading(false),
        onPending: () => {
          toast({ title: "Pending", description: "Processing..." });
        },
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Wallet</DialogTitle>
          <DialogDescription>Enter amount</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">Min: ₦100</p>
          </div>
          <Button
            onClick={handleFundWallet}
            className="w-full"
            disabled={loading || !scriptLoaded || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : !scriptLoaded ? (
              "Loading..."
            ) : (
              "Pay Now"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
