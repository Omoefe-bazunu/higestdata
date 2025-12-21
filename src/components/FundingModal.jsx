"use client";

import { useState, useEffect, useRef } from "react";
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

  // Ref to track if component is mounted (to avoid state update errors)
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

      // === CRITICAL FIX FOR MOBILE ===
      // We MUST close our modal here. If we leave it open, it traps focus
      // and prevents the user from clicking buttons in the Checkout iframe.
      onOpenChange(false);
      setAmount(""); // Reset for next time

      window.SafeHavenCheckout({
        environment: config.environment,
        clientId: config.clientId,
        referenceCode: config.referenceCode,
        currency: config.currency,
        amount: config.amount,
        customer: config.customer,
        settlementAccount: config.settlementAccount,
        // Callbacks
        onClose: () => {
          // Modal is already closed, just notify user
          toast.info("Payment flow cancelled");
        },
        callback: (response) => {
          console.log("Checkout Callback:", response);
          // Run verification (Modal is closed, so we rely on Toasts)
          verifyTransaction(config.referenceCode, token);
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
      if (isMounted.current) setLoading(false);
    }
  };

  // Helper to verify (Independent of Component State)
  const verifyTransaction = async (reference, token) => {
    try {
      toast.loading("Verifying payment...", { id: "verify-toast" });

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
        toast.dismiss("verify-toast");
        toast.success("Wallet credited successfully!");
      } else {
        toast.dismiss("verify-toast");
        toast.error(data.error || "Verification failed");
      }
    } catch (error) {
      toast.dismiss("verify-toast");
      toast.error(
        "Could not verify payment. Please refresh or contact support."
      );
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
