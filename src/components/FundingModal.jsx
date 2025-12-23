"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 1. Load Safe Haven Script dynamically
  useEffect(() => {
    if (open && !scriptLoaded) {
      const script = document.createElement("script");
      script.src = "https://checkout.safehavenmfb.com/assets/checkout.min.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, [open, scriptLoaded]);

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || amount < 100) {
      toast.error("Minimum amount is ₦100");
      return;
    }

    setLoading(true);

    try {
      // 1. Get Config from Backend
      const token = await user.getIdToken();
      const initRes = await fetch(`${API_URL}/api/funding/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const initData = await initRes.json();

      if (!initRes.ok)
        throw new Error(initData.error || "Initialization failed");

      const config = initData.config;

      // 2. Initialize Safe Haven Checkout
      if (typeof window.SafeHavenCheckout === "undefined") {
        throw new Error("Payment gateway failed to load. Please refresh.");
      }

      const checkout = window.SafeHavenCheckout({
        environment: config.environment,
        clientId: config.clientId,
        referenceCode: config.referenceCode,
        currency: config.currency,
        amount: config.amount,
        customer: config.customer,
        settlementAccount: config.settlementAccount,
        // Callbacks
        onClose: () => {
          setLoading(false);
          toast.info("Payment cancelled");
        },
        // FIX: Removed 'async' keyword here
        callback: (response) => {
          console.log("Checkout Callback:", response);
          // Call the verification function without 'await' here
          // The library doesn't need to wait for your verification
          verifyTransaction(config.referenceCode);
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
      setLoading(false);
    }
  };

  const verifyTransaction = async (reference) => {
    try {
      toast.loading("Verifying payment...");
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/api/funding/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();

      if (data.success) {
        toast.dismiss();
        toast.success("Wallet credited successfully!");
        setAmount("");
        onOpenChange(false); // Close modal
      } else {
        toast.dismiss();
        toast.error(data.error || "Verification failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Could not verify payment. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Fund Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Enter amount to deposit via Bank Transfer or Card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₦
              </span>
              <Input
                type="number"
                placeholder="1000"
                className="pl-8 text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Min: ₦100
            </p>
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={handlePayment}
            disabled={loading || !scriptLoaded}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Secure Checkout
              </>
            )}
          </Button>

          <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Secured by Safe Haven MFB</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
